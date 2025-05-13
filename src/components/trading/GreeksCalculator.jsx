import React, { useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { 
  HoverCard,
  HoverCardTrigger,
  HoverCardContent
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { InfoIcon } from "lucide-react";

// Helper function to calculate option Greeks using Black-Scholes approximation
const calculateGreeks = (type, underlyingPrice, strikePrice, volatility, daysToExpiry, interestRate = 0.05) => {
  volatility = volatility / 100; // Convert from percentage to decimal
  const t = daysToExpiry / 365; // Time in years
  
  // Black-Scholes d1 and d2
  const d1 = (Math.log(underlyingPrice / strikePrice) + (interestRate + 0.5 * volatility * volatility) * t) / (volatility * Math.sqrt(t));
  const d2 = d1 - volatility * Math.sqrt(t);
  
  // Standard normal functions
  const pdf = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  const cdf = (x) => {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - p : p;
  };
  
  // Calculate option price
  let price;
  if (type === 'call') {
    price = underlyingPrice * cdf(d1) - strikePrice * Math.exp(-interestRate * t) * cdf(d2);
  } else { // put
    price = strikePrice * Math.exp(-interestRate * t) * cdf(-d2) - underlyingPrice * cdf(-d1);
  }
  
  // Calculate Greeks
  const delta = type === 'call' ? cdf(d1) : cdf(d1) - 1;
  const gamma = pdf(d1) / (underlyingPrice * volatility * Math.sqrt(t));
  
  // Theta (daily)
  const theta = -(underlyingPrice * pdf(d1) * volatility) / (2 * Math.sqrt(t)) - 
      interestRate * strikePrice * Math.exp(-interestRate * t) * 
      (type === 'call' ? cdf(d2) : -cdf(-d2));
  const dailyTheta = theta / 365;
  
  // Vega (for 1% change in volatility)
  const vega = underlyingPrice * Math.sqrt(t) * pdf(d1) / 100;
  
  // Rho (for 1% change in interest rate)
  const rho = type === 'call'
    ? strikePrice * t * Math.exp(-interestRate * t) * cdf(d2) / 100
    : -strikePrice * t * Math.exp(-interestRate * t) * cdf(-d2) / 100;
  
  return {
    price: price.toFixed(2),
    delta: delta.toFixed(3),
    gamma: gamma.toFixed(4),
    theta: dailyTheta.toFixed(3),
    vega: vega.toFixed(3),
    rho: rho.toFixed(3)
  };
};

// Helper to calculate the total Greeks for a strategy
const calculateStrategyGreeks = (strategy, volatility, daysToExpiry) => {
  if (!strategy?.legs?.length) return null;

  // Initialize total Greeks
  let totalDelta = 0;
  let totalGamma = 0;
  let totalTheta = 0;
  let totalVega = 0;
  let totalRho = 0;
  let totalCost = 0;

  // Calculate Greeks for each leg and sum them
  strategy.legs.forEach(leg => {
    const quantity = leg.quantity || 1;
    const greeks = calculateGreeks(
      leg.type, 
      strategy.underlyingPrice, 
      leg.strikePrice, 
      volatility, 
      daysToExpiry
    );
    
    const direction = leg.action === 'buy' ? 1 : -1;
    
    totalDelta += direction * quantity * parseFloat(greeks.delta);
    totalGamma += direction * quantity * parseFloat(greeks.gamma);
    totalTheta += direction * quantity * parseFloat(greeks.theta);
    totalVega += direction * quantity * parseFloat(greeks.vega);
    totalRho += direction * quantity * parseFloat(greeks.rho);
    totalCost += direction * quantity * parseFloat(greeks.price);
  });

  return {
    delta: totalDelta.toFixed(3),
    gamma: totalGamma.toFixed(4),
    theta: totalTheta.toFixed(3),
    vega: totalVega.toFixed(3),
    rho: totalRho.toFixed(3),
    cost: totalCost.toFixed(2)
  };
};

// Greek interpretations/descriptions
const greekDescriptions = {
  delta: "Delta measures the rate of change in an option's price relative to a $1 change in the underlying asset. A delta of 0.5 means the option price will change by approximately $0.50 for every $1 move in the underlying.",
  gamma: "Gamma measures the rate of change in delta for a $1 change in the underlying. It shows how delta will change as the underlying price moves, indicating the stability of your delta exposure.",
  theta: "Theta measures the rate of time decay in an option's value. A theta of -0.10 means the option will lose about $0.10 per day from time decay alone, assuming all other factors remain constant.",
  vega: "Vega measures the sensitivity of an option's price to changes in implied volatility. A vega of 0.15 means the option price will change approximately $0.15 for each 1% change in implied volatility.",
  rho: "Rho measures the sensitivity of an option's price to changes in interest rates. A rho of 0.05 means the option will gain approximately $0.05 for every 1% increase in interest rates."
};

// Suggested strategy based on Greeks
const getStrategyOutlook = (greeks) => {
  if (!greeks) return null;
  
  const delta = parseFloat(greeks.delta);
  const gamma = parseFloat(greeks.gamma);
  const theta = parseFloat(greeks.theta);
  const vega = parseFloat(greeks.vega);
  
  if (Math.abs(delta) > 0.5) {
    return {
      outlook: delta > 0 ? "Bullish" : "Bearish",
      description: delta > 0 
        ? "Strong directional bet on rising prices. Profit depends primarily on upward price movement."
        : "Strong directional bet on falling prices. Profit depends primarily on downward price movement.",
      risk: "Price moving in the opposite direction"
    };
  } else if (Math.abs(delta) < 0.2 && gamma > 0.01) {
    return {
      outlook: "Neutral with Volatility Bias",
      description: "Strategy benefits from significant price movement in either direction. Generally market-neutral but requires volatility for profitability.",
      risk: "Lack of movement in the underlying price"
    };
  } else if (Math.abs(delta) < 0.2 && theta > 0) {
    return {
      outlook: "Neutral with Time Decay Benefit",
      description: "Strategy benefits from the passage of time. Profits from expiring option premium as long as the price stays within a certain range.",
      risk: "Significant price movement outside the expected range"
    };
  } else if (vega > 0.5) {
    return {
      outlook: "Long Volatility",
      description: "Strategy will benefit from increasing implied volatility, regardless of price direction. Consider this approach when you expect market uncertainty to rise.",
      risk: "Decreasing volatility and time decay"
    };
  } else if (vega < -0.5) {
    return {
      outlook: "Short Volatility",
      description: "Strategy will benefit from decreasing implied volatility. Consider this approach when you expect market calmness or stability.",
      risk: "Sudden increase in volatility or sharp price moves"
    };
  } else {
    return {
      outlook: "Balanced",
      description: "Your strategy has moderate exposure to multiple market factors. It doesn't take an extreme position on price direction, volatility, or time.",
      risk: "Various factors depending on exact position structure"
    };
  }
};

const GreeksCalculator = ({ 
  strategy, 
  volatility = 30, 
  daysToExpiry = 30,
  showDescriptions = true,
  showOutlook = true
}) => {
  const strategyGreeks = useMemo(() => {
    return calculateStrategyGreeks(strategy, volatility, daysToExpiry);
  }, [strategy, volatility, daysToExpiry]);

  const outlook = useMemo(() => {
    return getStrategyOutlook(strategyGreeks);
  }, [strategyGreeks]);

  if (!strategy?.legs?.length) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center h-40">
          <p className="text-gray-500">No strategy data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Greeks Analysis</CardTitle>
        <CardDescription>
          Option Greeks measure the sensitivity of your strategy to various factors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          {['delta', 'gamma', 'theta', 'vega', 'rho'].map(greek => (
            <div key={greek} className="bg-gray-50 p-3 rounded-lg flex flex-col items-center">
              <div className="flex items-center mb-1">
                <span className="text-sm font-medium text-gray-600 capitalize">{greek}</span>
                <HoverCard>
                  <HoverCardTrigger>
                    <InfoIcon className="h-3.5 w-3.5 ml-1 text-gray-400" />
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80 p-4">
                    <p className="text-sm">{greekDescriptions[greek]}</p>
                  </HoverCardContent>
                </HoverCard>
              </div>
              <div className="text-lg font-semibold">
                {strategyGreeks ? strategyGreeks[greek] : 'N/A'}
              </div>
            </div>
          ))}
        </div>

        {showOutlook && outlook && (
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <h3 className="text-base font-medium">Strategy Outlook:</h3>
              <Badge variant="outline" className="ml-2">
                {outlook.outlook}
              </Badge>
            </div>
            <p className="text-sm text-gray-700 mb-2">{outlook.description}</p>
            <div className="flex items-center">
              <span className="text-xs font-medium text-gray-500 mr-2">Primary Risk:</span>
              <span className="text-xs text-gray-700">{outlook.risk}</span>
            </div>
          </div>
        )}

        {showDescriptions && (
          <div>
            <h3 className="text-base font-medium mb-2">Greek Breakdown by Leg</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leg</TableHead>
                  <TableHead>Delta</TableHead>
                  <TableHead>Gamma</TableHead>
                  <TableHead>Theta</TableHead>
                  <TableHead>Vega</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {strategy.legs.map((leg, index) => {
                  const greeks = calculateGreeks(
                    leg.type,
                    strategy.underlyingPrice,
                    leg.strikePrice,
                    volatility,
                    daysToExpiry
                  );
                  const quantity = leg.quantity || 1;
                  const direction = leg.action === 'buy' ? 1 : -1;

                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center">
                          <Badge variant={leg.action === 'buy' ? 'default' : 'secondary'} className="mr-2">
                            {leg.action}
                          </Badge>
                          <span>
                            {quantity} {leg.type.toUpperCase()} {leg.strikePrice}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(direction * quantity * parseFloat(greeks.delta)).toFixed(3)}
                      </TableCell>
                      <TableCell>
                        {(direction * quantity * parseFloat(greeks.gamma)).toFixed(4)}
                      </TableCell>
                      <TableCell>
                        {(direction * quantity * parseFloat(greeks.theta)).toFixed(3)}
                      </TableCell>
                      <TableCell>
                        {(direction * quantity * parseFloat(greeks.vega)).toFixed(3)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-gray-50 font-medium">
                  <TableCell>Total</TableCell>
                  <TableCell>{strategyGreeks.delta}</TableCell>
                  <TableCell>{strategyGreeks.gamma}</TableCell>
                  <TableCell>{strategyGreeks.theta}</TableCell>
                  <TableCell>{strategyGreeks.vega}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            <div className="mt-4 text-sm text-gray-600">
              <p className="mb-1">
                <strong>Interpretation:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Delta ({strategyGreeks.delta}):</strong>{' '}
                  {parseFloat(strategyGreeks.delta) > 0 
                    ? `Your strategy will gain approximately $${strategyGreeks.delta} for each $1 increase in the underlying price.`
                    : `Your strategy will gain approximately $${Math.abs(parseFloat(strategyGreeks.delta)).toFixed(3)} for each $1 decrease in the underlying price.`
                  }
                </li>
                <li>
                  <strong>Gamma ({strategyGreeks.gamma}):</strong>{' '}
                  Your delta will change by approximately {strategyGreeks.gamma} for each $1 move in the underlying.
                </li>
                <li>
                  <strong>Theta ({strategyGreeks.theta}):</strong>{' '}
                  {parseFloat(strategyGreeks.theta) < 0 
                    ? `Your strategy will lose approximately $${Math.abs(parseFloat(strategyGreeks.theta)).toFixed(3)} per day from time decay.`
                    : `Your strategy will gain approximately $${strategyGreeks.theta} per day from time decay.`
                  }
                </li>
                <li>
                  <strong>Vega ({strategyGreeks.vega}):</strong>{' '}
                  {parseFloat(strategyGreeks.vega) > 0
                    ? `Your strategy will gain approximately $${strategyGreeks.vega} for each 1% increase in implied volatility.`
                    : `Your strategy will gain approximately $${Math.abs(parseFloat(strategyGreeks.vega)).toFixed(3)} for each 1% decrease in implied volatility.`
                  }
                </li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GreeksCalculator;
