import React, { useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity 
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

// Helper function to simulate scenario payoff calculation
function calculateScenarioPayoff(price, priceChangePercent, volatilityChangePercent, daysToExpiry) {
  // This would be a more complex calculation in a real app
  // Here we're just generating plausible-looking data
  
  // Start with a base payoff curve (simplified)
  const basePayoff = Math.max(0, price - 100) * 2 - 5;
  
  // Adjust based on price change
  const priceEffect = priceChangePercent * 0.2;
  
  // Adjust based on volatility change
  const volatilityEffect = volatilityChangePercent * 0.1;
  
  // Adjust based on time decay
  const timeEffect = Math.max(0, (30 - daysToExpiry) * 0.2);
  
  return basePayoff + priceEffect + volatilityEffect - timeEffect;
}

// Scenario Analysis component
const ScenarioAnalysis = ({ strategy }) => {
  // Generate sample scenario data
  const scenarios = useMemo(() => {
    return [
      {
        name: 'Base Case',
        priceChange: '0%',
        volatilityChange: '0%',
        daysToExpiry: 30,
        profitLoss: 500,
        returnPercent: 15.2
      },
      {
        name: 'Bullish Scenario',
        priceChange: '+10%',
        volatilityChange: '-5%',
        daysToExpiry: 30,
        profitLoss: 1250,
        returnPercent: 38.1
      },
      {
        name: 'Bearish Scenario',
        priceChange: '-10%',
        volatilityChange: '+10%',
        daysToExpiry: 30,
        profitLoss: -800,
        returnPercent: -24.4
      },
      {
        name: 'Volatility Spike',
        priceChange: '0%',
        volatilityChange: '+30%',
        daysToExpiry: 30,
        profitLoss: 320,
        returnPercent: 9.8
      },
      {
        name: 'Volatility Crush',
        priceChange: '0%',
        volatilityChange: '-30%',
        daysToExpiry: 30,
        profitLoss: -250,
        returnPercent: -7.6
      },
      {
        name: '1 Week Later',
        priceChange: '0%',
        volatilityChange: '0%',
        daysToExpiry: 23,
        profitLoss: 180,
        returnPercent: 5.5
      }
    ];
  }, []);
  
  // Generate payoff data for different scenarios
  const scenarioData = useMemo(() => {
    // Base case - current price is 100
    const basePrice = 100;
    // Generate price points from -30% to +30%
    const pricePoints = Array.from({ length: 31 }, (_, i) => basePrice * (0.7 + i * 0.02));
    
    // Calculate payoffs for different scenarios
    const baseCase = pricePoints.map(price => ({
      price,
      payoff: calculateScenarioPayoff(price, 0, 0, 30)
    }));
    
    const bullishCase = pricePoints.map(price => ({
      price,
      payoff: calculateScenarioPayoff(price, 10, -5, 30)
    }));
    
    const bearishCase = pricePoints.map(price => ({
      price,
      payoff: calculateScenarioPayoff(price, -10, 10, 30)
    }));
    
    const volatilitySpikeCase = pricePoints.map(price => ({
      price,
      payoff: calculateScenarioPayoff(price, 0, 30, 30)
    }));
    
    const timeDecayCase = pricePoints.map(price => ({
      price,
      payoff: calculateScenarioPayoff(price, 0, 0, 15)
    }));
    
    return {
      pricePoints,
      baseCase,
      bullishCase,
      bearishCase,
      volatilitySpikeCase,
      timeDecayCase
    };
  }, []);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scenario Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-base font-medium mb-3">Scenario Comparison</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scenario</TableHead>
                  <TableHead className="text-right">P/L</TableHead>
                  <TableHead className="text-right">Return %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scenarios.map((scenario) => (
                  <TableRow key={scenario.name}>
                    <TableCell>
                      <div className="font-medium">{scenario.name}</div>
                      <div className="text-xs text-gray-500">
                        Price: {scenario.priceChange}, IV: {scenario.volatilityChange}, DTE: {scenario.daysToExpiry}
                      </div>
                    </TableCell>
                    <TableCell className={`text-right ${scenario.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {scenario.profitLoss >= 0 ? '+' : ''}${scenario.profitLoss}
                    </TableCell>
                    <TableCell className={`text-right ${scenario.returnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {scenario.returnPercent >= 0 ? '+' : ''}{scenario.returnPercent}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div>
            <h3 className="text-base font-medium mb-3">Payoff Comparison</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number"
                    dataKey="price"
                    domain={['dataMin', 'dataMax']}
                    allowDataOverflow={true}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    formatter={(value) => [`$${value}`, 'P/L']}
                    labelFormatter={(value) => `Price: $${value}`}
                  />
                  <Legend />
                  <ReferenceLine y={0} stroke="#666" />
                  <ReferenceLine x={100} stroke="#666" strokeDasharray="3 3" label="Current" />
                  
                  <Line 
                    data={scenarioData.baseCase}
                    type="monotone" 
                    dataKey="payoff" 
                    name="Base Case" 
                    stroke="#3b82f6" 
                    dot={false}
                  />
                  <Line 
                    data={scenarioData.bullishCase}
                    type="monotone" 
                    dataKey="payoff" 
                    name="Bullish" 
                    stroke="#22c55e" 
                    dot={false}
                  />
                  <Line 
                    data={scenarioData.bearishCase}
                    type="monotone" 
                    dataKey="payoff" 
                    name="Bearish" 
                    stroke="#ef4444" 
                    dot={false}
                  />
                  <Line 
                    data={scenarioData.volatilitySpikeCase}
                    type="monotone" 
                    dataKey="payoff" 
                    name="IV Spike" 
                    stroke="#8b5cf6" 
                    dot={false}
                  />
                  <Line 
                    data={scenarioData.timeDecayCase}
                    type="monotone" 
                    dataKey="payoff" 
                    name="Time Decay" 
                    stroke="#f59e0b" 
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-base font-medium mb-3">Risk Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
                <h4 className="text-sm font-medium">Upside Potential</h4>
              </div>
              <p className="mt-2 text-sm">
                This strategy has strong upside potential if the price increases by 5-15%. 
                Maximum theoretical gain is approximately +$1,250 (38.1% return).
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <TrendingDown className="h-5 w-5 text-red-500 mr-2" />
                <h4 className="text-sm font-medium">Downside Risk</h4>
              </div>
              <p className="mt-2 text-sm">
                The strategy is exposed to significant downside risk if the price decreases. 
                Maximum theoretical loss is approximately -$800 (24.4% loss).
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-purple-500 mr-2" />
                <h4 className="text-sm font-medium">Volatility Sensitivity</h4>
              </div>
              <p className="mt-2 text-sm">
                This strategy benefits from increased volatility, which is unusual for many option strategies.
                A 30% increase in implied volatility could result in a $320 gain.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScenarioAnalysis;
