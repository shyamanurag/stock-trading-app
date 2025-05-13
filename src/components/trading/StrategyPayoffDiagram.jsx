import React, { useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Helper function to calculate option payoff
const calculateOptionPayoff = (type, action, strikePrice, premium, pricePoint) => {
  let payoff = 0;
  
  if (type === 'call') {
    if (action === 'buy') {
      payoff = Math.max(0, pricePoint - strikePrice) - premium;
    } else { // sell
      payoff = premium - Math.max(0, pricePoint - strikePrice);
    }
  } else { // put
    if (action === 'buy') {
      payoff = Math.max(0, strikePrice - pricePoint) - premium;
    } else { // sell
      payoff = premium - Math.max(0, strikePrice - pricePoint);
    }
  }
  
  return payoff;
};

const StrategyPayoffDiagram = ({ 
  strategy, 
  showBreakEven = true, 
  showCurrentPrice = true,
  showLegBreakdown = false,
  showArea = false,
  height = 300
}) => {
  // Generate payoff data for the chart
  const payoffData = useMemo(() => {
    if (!strategy?.legs?.length) return [];
    
    // Find min and max strike prices to set chart boundaries
    let strikes = strategy.legs.map(leg => leg.strikePrice);
    const minStrike = Math.min(...strikes);
    const maxStrike = Math.max(...strikes);
    
    // Set boundaries with padding
    const lowerBound = Math.max(minStrike - (maxStrike - minStrike) * 0.5, 0);
    const upperBound = maxStrike + (maxStrike - minStrike) * 0.5;
    const step = (upperBound - lowerBound) / 40;
    
    return Array.from({ length: 41 }, (_, i) => {
      const price = lowerBound + i * step;
      
      // Calculate total payoff
      let totalPayoff = 0;
      const legPayoffs = {};
      
      // Calculate payoff for each leg
      strategy.legs.forEach((leg, legIndex) => {
        const quantity = leg.quantity || 1;
        const premium = parseFloat(leg.price) || 0;
        
        const legPayoff = calculateOptionPayoff(
          leg.type, 
          leg.action, 
          leg.strikePrice, 
          premium, 
          price
        ) * quantity;
        
        totalPayoff += legPayoff;
        legPayoffs[`leg${legIndex}`] = legPayoff;
      });
      
      return { 
        price, 
        payoff: totalPayoff,
        ...legPayoffs
      };
    });
  }, [strategy]);

  // Find where payoff crosses zero (break-even points)
  const breakEvenPoints = useMemo(() => {
    if (!payoffData.length) return [];
    
    const points = [];
    for (let i = 1; i < payoffData.length; i++) {
      if ((payoffData[i-1].payoff <= 0 && payoffData[i].payoff >= 0) || 
          (payoffData[i-1].payoff >= 0 && payoffData[i].payoff <= 0)) {
        // Linear interpolation for more accurate break-even point
        const x1 = payoffData[i-1].price;
        const y1 = payoffData[i-1].payoff;
        const x2 = payoffData[i].price;
        const y2 = payoffData[i].payoff;
        
        const breakEvenPrice = x1 + (0 - y1) * (x2 - x1) / (y2 - y1);
        points.push(breakEvenPrice);
      }
    }
    
    return points;
  }, [payoffData]);

  // Calculate min and max payoffs for chart scaling
  const { minPayoff, maxPayoff } = useMemo(() => {
    if (!payoffData.length) return { minPayoff: 0, maxPayoff: 0 };
    
    const payoffs = payoffData.map(d => d.payoff);
    return {
      minPayoff: Math.min(...payoffs),
      maxPayoff: Math.max(...payoffs)
    };
  }, [payoffData]);

  // Generate color palette for leg breakdown
  const legColors = ["#4f46e5", "#06b6d4", "#10b981", "#ec4899", "#f97316", "#8b5cf6"];

  // Generate a tooltip formatter that handles all data
  const tooltipFormatter = (value, name) => {
    if (name === 'payoff') {
      return [`$${value.toFixed(2)}`, 'Total P/L'];
    }
    
    if (name.startsWith('leg')) {
      const legIndex = parseInt(name.replace('leg', ''));
      const leg = strategy.legs[legIndex];
      if (leg) {
        return [
          `$${value.toFixed(2)}`, 
          `${leg.action} ${leg.quantity} ${leg.type.toUpperCase()} ${leg.strikePrice}`
        ];
      }
    }
    
    return [value, name];
  };

  if (!strategy?.legs?.length) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center h-64">
          <p className="text-gray-500">No strategy data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Strategy Payoff Diagram</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            {showLegBreakdown ? (
              <ComposedChart
                data={payoffData}
                margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="price"
                  label={{ value: 'Underlying Price ($)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  domain={[
                    Math.floor(minPayoff * 1.1), 
                    Math.ceil(maxPayoff * 1.1)
                  ]}
                  label={{ value: 'Profit/Loss ($)', angle: -90, position: 'insideLeft' }} 
                />
                <Tooltip formatter={tooltipFormatter} />
                <Legend />
                
                {/* Zero reference line */}
                <ReferenceLine y={0} stroke="#666" />
                
                {/* Current price reference line */}
                {showCurrentPrice && (
                  <ReferenceLine 
                    x={strategy.underlyingPrice} 
                    stroke="#666" 
                    strokeDasharray="3 3"
                    label={{ 
                      value: `Current: $${strategy.underlyingPrice}`,
                      position: 'top'
                    }}
                  />
                )}
                
                {/* Break-even points reference lines */}
                {showBreakEven && breakEvenPoints.map((point, i) => (
                  <ReferenceLine 
                    key={i}
                    x={point} 
                    stroke="#ff6b6b" 
                    strokeDasharray="3 3"
                    label={{ 
                      value: `BE: $${point.toFixed(2)}`,
                      position: 'top'
                    }}
                  />
                ))}
                
                {/* Individual leg lines */}
                {strategy.legs.map((leg, i) => (
                  <Line 
                    key={i}
                    type="monotone" 
                    dataKey={`leg${i}`}
                    name={`${leg.action} ${leg.quantity} ${leg.type.toUpperCase()} ${leg.strikePrice}`}
                    stroke={legColors[i % legColors.length]}
                    strokeWidth={1}
                    dot={false}
                    strokeDasharray={leg.action === 'sell' ? "5 5" : ""}
                  />
                ))}
                
                {/* Total payoff line */}
                <Line 
                  type="monotone" 
                  dataKey="payoff" 
                  name="Total P/L"
                  stroke="#000"
                  strokeWidth={2.5}
                  dot={false}
                />
              </ComposedChart>
            ) : (
              <ComposedChart
                data={payoffData}
                margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="price"
                  label={{ value: 'Underlying Price ($)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  domain={[
                    Math.floor(minPayoff * 1.1), 
                    Math.ceil(maxPayoff * 1.1)
                  ]}
                  label={{ value: 'Profit/Loss ($)', angle: -90, position: 'insideLeft' }} 
                />
                <Tooltip 
                  formatter={(value) => [`$${value.toFixed(2)}`, 'Profit/Loss']}
                  labelFormatter={(value) => `Price: $${value}`}
                />
                
                {/* Zero reference line */}
                <ReferenceLine y={0} stroke="#666" />
                
                {/* Current price reference line */}
                {showCurrentPrice && (
                  <ReferenceLine 
                    x={strategy.underlyingPrice} 
                    stroke="#666" 
                    strokeDasharray="3 3"
                    label={{ 
                      value: `Current: $${strategy.underlyingPrice}`,
                      position: 'top'
                    }}
                  />
                )}
                
                {/* Break-even points reference lines */}
                {showBreakEven && breakEvenPoints.map((point, i) => (
                  <ReferenceLine 
                    key={i}
                    x={point} 
                    stroke="#ff6b6b" 
                    strokeDasharray="3 3"
                    label={{ 
                      value: `BE: $${point.toFixed(2)}`,
                      position: 'top'
                    }}
                  />
                ))}
                
                {/* Area under the curve */}
                {showArea && (
                  <Area 
                    type="monotone"
                    dataKey="payoff"
                    fill="#3b82f6"
                    stroke="none"
                    fillOpacity={0.2}
                  />
                )}
                
                {/* Total payoff line */}
                <Line 
                  type="monotone" 
                  dataKey="payoff" 
                  stroke="#3b82f6" 
                  strokeWidth={2.5}
                  dot={false}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {/* Summary metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-gray-50 p-3 rounded-md text-center">
            <div className="text-sm text-gray-500">Max Profit</div>
            <div className="font-semibold text-green-600">
              ${maxPayoff > 0 ? maxPayoff.toFixed(2) : '0.00'}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-md text-center">
            <div className="text-sm text-gray-500">Max Loss</div>
            <div className="font-semibold text-red-600">
              ${minPayoff < 0 ? Math.abs(minPayoff).toFixed(2) : '0.00'}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-md text-center">
            <div className="text-sm text-gray-500">Break-even</div>
            <div className="font-semibold">
              {breakEvenPoints.length > 0 
                ? breakEvenPoints.map(p => `$${p.toFixed(2)}`).join(', ') 
                : 'None'}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-md text-center">
            <div className="text-sm text-gray-500">Risk/Reward</div>
            <div className="font-semibold">
              {maxPayoff > 0 && minPayoff < 0
                ? (Math.abs(minPayoff) / maxPayoff).toFixed(2)
                : 'N/A'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StrategyPayoffDiagram;
