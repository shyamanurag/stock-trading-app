import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import StrategyBuilder from '../components/trading/StrategyBuilder';
import StrategyVisualBuilder from '../components/trading/StrategyVisualBuilder';
import StrategyPayoffDiagram from '../components/trading/StrategyPayoffDiagram';
import GreeksCalculator from '../components/trading/GreeksCalculator';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import {
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Save, 
  Share2, 
  BarChart3, 
  LineChart, 
  Download, 
  ListChecks, 
  Calculator, 
  RefreshCw 
} from 'lucide-react';

// Sample market watch data
const marketWatchData = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 193.28, change: 2.45, changePercent: 1.28 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 416.32, change: -1.89, changePercent: -0.45 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 174.56, change: 0.87, changePercent: 0.50 },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', price: 184.72, change: 3.21, changePercent: 1.77 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 952.28, change: 18.44, changePercent: 1.97 },
  { symbol: 'TSLA', name: 'Tesla, Inc.', price: 177.96, change: -4.32, changePercent: -2.37 },
  { symbol: 'META', name: 'Meta Platforms, Inc.', price: 480.27, change: 5.79, changePercent: 1.22 },
  { symbol: 'V', name: 'Visa Inc.', price: 273.98, change: 0.45, changePercent: 0.16 },
];

const StrategyBuilderPage = () => {
  const [activeTab, setActiveTab] = useState('visual');
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [stockPrice, setStockPrice] = useState(193.28);
  const [strategy, setStrategy] = useState(null);
  const [volatility, setVolatility] = useState(30);
  const [daysToExpiry, setDaysToExpiry] = useState(30);
  const [savedStrategies, setSavedStrategies] = useState([]);
  
  // When a symbol is selected from the market watch
  const selectSymbol = (symbol) => {
    const stock = marketWatchData.find(item => item.symbol === symbol);
    if (stock) {
      setSelectedSymbol(symbol);
      setStockPrice(stock.price);
    }
  };
  
  // Handle strategy updates from child components
  const handleStrategyChange = (newStrategy) => {
    setStrategy(newStrategy);
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Options Strategy Builder</h1>
            <p className="text-gray-500">Create, analyze, and save options strategies</p>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Trading
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh Data
            </Button>
            <Button size="sm">
              <Save className="h-4 w-4 mr-2" /> Save Strategy
            </Button>
          </div>
        </div>
        
        <Separator />
        
        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Market Watch */}
          <div className="col-span-12 md:col-span-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Market Watch</CardTitle>
                <CardDescription>Select a symbol to build a strategy</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white">
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Chg%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {marketWatchData.map((stock) => (
                        <TableRow 
                          key={stock.symbol} 
                          className={`cursor-pointer hover:bg-gray-50 ${selectedSymbol === stock.symbol ? 'bg-gray-50' : ''}`}
                          onClick={() => selectSymbol(stock.symbol)}
                        >
                          <TableCell className="font-medium">{stock.symbol}</TableCell>
                          <TableCell className="text-right">${stock.price.toFixed(2)}</TableCell>
                          <TableCell className={`text-right ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
            
            {strategy && (
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Strategy Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 p-2 rounded-md">
                        <div className="text-xs text-gray-500">Symbol</div>
                        <div className="font-medium">{selectedSymbol}</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-md">
                        <div className="text-xs text-gray-500">Price</div>
                        <div className="font-medium">${stockPrice.toFixed(2)}</div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-2 rounded-md">
                      <div className="text-xs text-gray-500">Strategy Type</div>
                      <div className="font-medium">{strategy.name || 'Custom Strategy'}</div>
                    </div>
                    
                    <div className="bg-gray-50 p-2 rounded-md">
                      <div className="text-xs text-gray-500">Number of Legs</div>
                      <div className="font-medium">{strategy.legs?.length || 0} legs</div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Leg Summary</div>
                      <div className="space-y-1">
                        {strategy.legs?.map((leg, index) => (
                          <div key={index} className="text-xs flex items-center">
                            <Badge variant={leg.action === 'buy' ? "default" : "destructive"} className="mr-1 text-xs px-1 py-0">
                              {leg.action === 'buy' ? 'B' : 'S'}
                            </Badge>
                            <span>
                              {leg.quantity} {leg.type === 'stock' ? 'Shares' : `${leg.type.toUpperCase()} ${leg.strikePrice}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Main Content Area */}
          <div className="col-span-12 md:col-span-9">
            {/* Builder Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="visual" className="flex items-center">
                  <ListChecks className="h-4 w-4 mr-2" />
                  Visual Builder
                </TabsTrigger>
                <TabsTrigger value="advanced" className="flex items-center">
                  <Calculator className="h-4 w-4 mr-2" />
                  Advanced Builder
                </TabsTrigger>
                <TabsTrigger value="analyze" className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analysis
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="visual">
                <StrategyVisualBuilder
                  symbol={selectedSymbol}
                  underlyingPrice={stockPrice}
                  onStrategyChange={handleStrategyChange}
                  initialStrategy={strategy}
                />
                
                {strategy && strategy.legs && strategy.legs.length > 0 && (
                  <div className="mt-6">
                    <StrategyPayoffDiagram 
                      strategy={strategy}
                      showBreakEven={true}
                      showCurrentPrice={true}
                    />
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="advanced">
                <StrategyBuilder />
              </TabsContent>
              
              <TabsContent value="analyze">
                {strategy && strategy.legs && strategy.legs.length > 0 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Card>
                          <CardHeader>
                            <CardTitle>Strategy Parameters</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium mb-1">Implied Volatility (%)</label>
                                <Input 
                                  type="number" 
                                  value={volatility} 
                                  onChange={(e) => setVolatility(parseFloat(e.target.value))}
                                  step="1"
                                  min="1"
                                  max="200"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium mb-1">Days to Expiry</label>
                                <Input 
                                  type="number" 
                                  value={daysToExpiry} 
                                  onChange={(e) => setDaysToExpiry(parseInt(e.target.value))}
                                  step="1"
                                  min="1"
                                  max="365"
                                />
                              </div>
                              
                              <Button className="w-full">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Update Analysis
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div>
                        <Card>
                          <CardHeader>
                            <CardTitle>Profit/Loss Scenarios</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Price</TableHead>
                                  <TableHead className="text-right">P/L Amount</TableHead>
                                  <TableHead className="text-right">P/L %</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {[0.8, 0.9, 0.95, 1, 1.05, 1.1, 1.2].map((factor) => {
                                  const price = stockPrice * factor;
                                  // Simple approximation for demo purposes
                                  let payoff = 0;
                                  
                                  strategy.legs.forEach(leg => {
                                    const direction = leg.action === 'buy' ? 1 : -1;
                                    const quantity = leg.quantity || 1;
                                    const multiplier = leg.type === 'stock' ? 1 : 100;
                                    
                                    if (leg.type === 'stock') {
                                      payoff += direction * quantity * (price - leg.price);
                                    } else if (leg.type === 'call') {
                                      const intrinsicValue = Math.max(0, price - leg.strikePrice);
                                      payoff += direction * quantity * multiplier * (intrinsicValue - leg.price);
                                    } else if (leg.type === 'put') {
                                      const intrinsicValue = Math.max(0, leg.strikePrice - price);
                                      payoff += direction * quantity * multiplier * (intrinsicValue - leg.price);
                                    }
                                  });
                                  
                                  // Calculate total cost
                                  let totalCost = 0;
                                  strategy.legs.forEach(leg => {
                                    const direction = leg.action === 'buy' ? 1 : -1;
                                    const quantity = leg.quantity || 1;
                                    const multiplier = leg.type === 'stock' ? 1 : 100;
                                    totalCost += direction * quantity * leg.price * multiplier;
                                  });
                                  
                                  const percentReturn = totalCost !== 0 
                                    ? (payoff / Math.abs(totalCost)) * 100 
                                    : 0;
                                  
                                  return (
                                    <TableRow key={factor}>
                                      <TableCell>${price.toFixed(2)}</TableCell>
                                      <TableCell className={`text-right ${payoff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        ${Math.abs(payoff).toFixed(2)} {payoff >= 0 ? 'profit' : 'loss'}
                                      </TableCell>
                                      <TableCell className={`text-right ${percentReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {percentReturn >= 0 ? '+' : ''}{percentReturn.toFixed(2)}%
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                    
                    <GreeksCalculator 
                      strategy={strategy}
                      volatility={volatility}
                      daysToExpiry={daysToExpiry}
                    />
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Risk Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-base font-medium mb-3">Strategy Metrics</h3>
                            <div className="space-y-2">
                              {/* Calculate some basic metrics for the strategy */}
                              {(() => {
                                let totalCost = 0;
                                strategy.legs.forEach(leg => {
                                  const direction = leg.action === 'buy' ? 1 : -1;
                                  const quantity = leg.quantity || 1;
                                  const multiplier = leg.type === 'stock' ? 1 : 100;
                                  totalCost += direction * quantity * leg.price * multiplier;
                                });
                                
                                // Very simple max profit/loss calculation for demo
                                const maxProfit = totalCost < 0 ? Math.abs(totalCost) : 1000; // Simplified
                                const maxLoss = totalCost > 0 ? totalCost : 1000; // Simplified
                                
                                return (
                                  <>
                                    <div className="flex justify-between p-2 bg-gray-50 rounded-md">
                                      <span className="text-sm text-gray-600">Total Cost:</span>
                                      <span className="font-medium">
                                        ${Math.abs(totalCost).toFixed(2)} {totalCost >= 0 ? 'debit' : 'credit'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between p-2 bg-gray-50 rounded-md">
                                      <span className="text-sm text-gray-600">Max Profit:</span>
                                      <span className="font-medium text-green-600">${maxProfit.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between p-2 bg-gray-50 rounded-md">
                                      <span className="text-sm text-gray-600">Max Loss:</span>
                                      <span className="font-medium text-red-600">${maxLoss.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between p-2 bg-gray-50 rounded-md">
                                      <span className="text-sm text-gray-600">Risk/Reward Ratio:</span>
                                      <span className="font-medium">{(maxLoss / maxProfit).toFixed(2)}</span>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-base font-medium mb-3">Strategy Recommendations</h3>
                            <div className="p-3 bg-gray-50 rounded-md">
                              <div className="mb-2">
                                <span className="text-sm font-medium">Market Outlook:</span>
                                <Badge className="ml-2" variant="outline">
                                  {(() => {
                                    // Simplified determination of strategy outlook
                                    let bullishCount = 0;
                                    let bearishCount = 0;
                                    
                                    strategy.legs.forEach(leg => {
                                      if (leg.type === 'call' && leg.action === 'buy') bullishCount++;
                                      if (leg.type === 'put' && leg.action === 'buy') bearishCount++;
                                      if (leg.type === 'call' && leg.action === 'sell') bearishCount++;
                                      if (leg.type === 'put' && leg.action === 'sell') bullishCount++;
                                      if (leg.type === 'stock' && leg.action === 'buy') bullishCount++;
                                      if (leg.type === 'stock' && leg.action === 'sell') bearishCount++;
                                    });
                                    
                                    if (bullishCount > bearishCount) return 'Bullish';
                                    if (bearishCount > bullishCount) return 'Bearish';
                                    return 'Neutral';
                                  })()}
                                </Badge>
                              </div>
                              
                              <p className="text-sm mb-3">
                                {(() => {
                                  // Generate a simple recommendation based on strategy type
                                  const outlook = (() => {
                                    let bullishCount = 0;
                                    let bearishCount = 0;
                                    
                                    strategy.legs.forEach(leg => {
                                      if (leg.type === 'call' && leg.action === 'buy') bullishCount++;
                                      if (leg.type === 'put' && leg.action === 'buy') bearishCount++;
                                      if (leg.type === 'call' && leg.action === 'sell') bearishCount++;
                                      if (leg.type === 'put' && leg.action === 'sell') bullishCount++;
                                      if (leg.type === 'stock' && leg.action === 'buy') bullishCount++;
                                      if (leg.type === 'stock' && leg.action === 'sell') bearishCount++;
                                    });
                                    
                                    if (bullishCount > bearishCount) return 'bullish';
                                    if (bearishCount > bullishCount) return 'bearish';
                                    return 'neutral';
                                  })();
                                  
                                  if (outlook === 'bullish') {
                                    return `This strategy is positioned to benefit from an increase in ${selectedSymbol}'s price. Consider your timeframe and risk tolerance before executing.`;
                                  } else if (outlook === 'bearish') {
                                    return `This strategy is positioned to benefit from a decrease in ${selectedSymbol}'s price. Be aware of potential downside risks if the market moves against your position.`;
                                  } else {
                                    return `This strategy is market-neutral and focuses on volatility or time decay rather than directional movement. It may perform best when ${selectedSymbol}'s price remains within a specific range.`;
                                  }
                                })()}
                              </p>
                              
                              <div className="text-sm font-medium mb-1">Considerations:</div>
                              <ul className="text-sm list-disc pl-5 space-y-1">
                                <li>Monitor implied volatility changes, which can significantly impact option prices</li>
                                <li>Be aware of upcoming earnings reports or other events that could affect the stock</li>
                                <li>Consider setting stop-loss orders to manage risk</li>
                                <li>Review your strategy as expiration approaches, especially if it includes short options</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <div className="flex justify-end space-x-3">
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export Analysis
                      </Button>
                      <Button variant="outline">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Strategy
                      </Button>
                      <Button>
                        <Save className="h-4 w-4 mr-2" />
                        Save Strategy
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-6 flex flex-col items-center justify-center h-64">
                      <p className="text-gray-500 mb-4">Build a strategy first to see analysis</p>
                      <Button onClick={() => setActiveTab('visual')}>
                        Go to Strategy Builder
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyBuilderPage;
