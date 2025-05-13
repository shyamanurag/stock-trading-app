import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import {
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowRight, 
  PlusCircle, 
  X, 
  ChevronUp, 
  ChevronDown,
  ChevronsUpDown,
  Calendar,
  DollarSign,
  PercentIcon
} from "lucide-react";

// Define some strategy templates and their configurations
const strategyTemplates = {
  'custom': {
    name: 'Custom Strategy',
    description: 'Build your own custom options strategy',
    legs: []
  },
  'long-call': {
    name: 'Long Call',
    description: 'Profit from an increase in the stock price with limited risk',
    legs: [
      { type: 'call', action: 'buy', strikeOffset: 0, quantity: 1 }
    ]
  },
  'long-put': {
    name: 'Long Put',
    description: 'Profit from a decrease in the stock price with limited risk',
    legs: [
      { type: 'put', action: 'buy', strikeOffset: 0, quantity: 1 }
    ]
  },
  'covered-call': {
    name: 'Covered Call',
    description: 'Generate income by selling call options against a long stock position',
    legs: [
      { type: 'stock', action: 'buy', quantity: 100 },
      { type: 'call', action: 'sell', strikeOffset: 5, quantity: 1 }
    ]
  },
  'bull-call-spread': {
    name: 'Bull Call Spread',
    description: 'Buy a call at a lower strike and sell a call at a higher strike with the same expiration',
    legs: [
      { type: 'call', action: 'buy', strikeOffset: 0, quantity: 1 },
      { type: 'call', action: 'sell', strikeOffset: 10, quantity: 1 }
    ]
  },
  'bear-put-spread': {
    name: 'Bear Put Spread',
    description: 'Buy a put at a higher strike and sell a put at a lower strike with the same expiration',
    legs: [
      { type: 'put', action: 'buy', strikeOffset: 0, quantity: 1 },
      { type: 'put', action: 'sell', strikeOffset: -10, quantity: 1 }
    ]
  },
  'iron-condor': {
    name: 'Iron Condor',
    description: 'Sell an OTM put spread and an OTM call spread to profit from low volatility',
    legs: [
      { type: 'put', action: 'buy', strikeOffset: -20, quantity: 1 },
      { type: 'put', action: 'sell', strikeOffset: -10, quantity: 1 },
      { type: 'call', action: 'sell', strikeOffset: 10, quantity: 1 },
      { type: 'call', action: 'buy', strikeOffset: 20, quantity: 1 }
    ]
  },
  'butterfly': {
    name: 'Butterfly Spread',
    description: 'Buy a call, sell two calls at a higher strike, and buy a call at an even higher strike',
    legs: [
      { type: 'call', action: 'buy', strikeOffset: -10, quantity: 1 },
      { type: 'call', action: 'sell', strikeOffset: 0, quantity: 2 },
      { type: 'call', action: 'buy', strikeOffset: 10, quantity: 1 }
    ]
  },
  'straddle': {
    name: 'Long Straddle',
    description: 'Buy a call and a put at the same strike price to profit from high volatility',
    legs: [
      { type: 'call', action: 'buy', strikeOffset: 0, quantity: 1 },
      { type: 'put', action: 'buy', strikeOffset: 0, quantity: 1 }
    ]
  },
  'strangle': {
    name: 'Long Strangle',
    description: 'Buy an OTM call and an OTM put to profit from high volatility at a lower cost than a straddle',
    legs: [
      { type: 'call', action: 'buy', strikeOffset: 10, quantity: 1 },
      { type: 'put', action: 'buy', strikeOffset: -10, quantity: 1 }
    ]
  }
};

// Helper function to format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value);
};

// Helper function to format percentage
const formatPercent = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
};

const StrategyVisualBuilder = ({ 
  symbol = '',
  underlyingPrice = 100,
  onStrategyChange,
  initialStrategy = null
}) => {
  // Strategy state
  const [strategy, setStrategy] = useState({
    name: 'Custom Strategy',
    symbol: symbol,
    underlyingPrice: underlyingPrice,
    legs: initialStrategy?.legs || []
  });
  
  // UI state
  const [selectedTemplate, setSelectedTemplate] = useState('custom');
  const [legBeingEdited, setLegBeingEdited] = useState(null);
  const [activeTab, setActiveTab] = useState("builder");
  
  // Options chain parameters
  const [strikeStep, setStrikeStep] = useState(5);
  const [volatility, setVolatility] = useState(30);
  const [expirations, setExpirations] = useState([
    { value: '2025-06-20', label: 'Jun 20, 2025 (38 days)' },
    { value: '2025-07-18', label: 'Jul 18, 2025 (66 days)' },
    { value: '2025-08-15', label: 'Aug 15, 2025 (94 days)' },
    { value: '2025-09-19', label: 'Sep 19, 2025 (129 days)' }
  ]);
  
  // Generate strike prices based on the underlying price
  const strikes = Array.from(
    { length: 21 }, 
    (_, i) => Math.round((underlyingPrice - 50 + i * strikeStep) / strikeStep) * strikeStep
  );
  
  // Mock option chain data (in a real app, this would come from an API)
  const generateOptionData = (type, strike, expDate) => {
    const daysToExp = Math.round((new Date(expDate) - new Date()) / (1000 * 60 * 60 * 24));
    const distance = Math.abs(strike - underlyingPrice) / underlyingPrice;
    const iv = volatility * (1 + distance * 0.5 + Math.random() * 0.2 - 0.1);
    
    // Very basic option pricing model
    const t = daysToExp / 365;
    const sqrtT = Math.sqrt(t);
    const ivDecimal = iv / 100;
    
    let price;
    if (type === 'call') {
      if (strike <= underlyingPrice) {
        price = Math.max(underlyingPrice - strike, 0) + (strike * ivDecimal * sqrtT * 0.4);
      } else {
        price = strike * ivDecimal * sqrtT * 0.4 * Math.exp(-distance * 2);
      }
    } else { // put
      if (strike >= underlyingPrice) {
        price = Math.max(strike - underlyingPrice, 0) + (strike * ivDecimal * sqrtT * 0.4);
      } else {
        price = strike * ivDecimal * sqrtT * 0.4 * Math.exp(-distance * 2);
      }
    }
    
    const bidAskSpread = price * 0.05; // 5% spread
    return {
      bid: Math.max(0, price - bidAskSpread / 2).toFixed(2),
      ask: (price + bidAskSpread / 2).toFixed(2),
      iv: iv.toFixed(1)
    };
  };
  
  // Effect to update strategy when the template changes
  useEffect(() => {
    if (selectedTemplate === 'custom') return;
    
    const template = strategyTemplates[selectedTemplate];
    if (!template) return;
    
    const atm = Math.round(underlyingPrice / strikeStep) * strikeStep;
    
    const newLegs = template.legs.map(leg => {
      const strikePrice = leg.type === 'stock' ? underlyingPrice : atm + leg.strikeOffset;
      let price;
      
      if (leg.type === 'stock') {
        price = underlyingPrice;
      } else {
        const optionData = generateOptionData(
          leg.type, 
          strikePrice, 
          expirations[0].value
        );
        price = leg.action === 'buy' ? optionData.ask : optionData.bid;
      }
      
      return {
        type: leg.type,
        action: leg.action,
        expiration: leg.type === 'stock' ? null : expirations[0].value,
        strikePrice: strikePrice,
        quantity: leg.quantity || 1,
        price: price
      };
    });
    
    setStrategy({
      ...strategy,
      name: template.name,
      legs: newLegs
    });
    
  }, [selectedTemplate, underlyingPrice, strikeStep]);
  
  // Effect to notify parent component of strategy changes
  useEffect(() => {
    if (onStrategyChange) {
      onStrategyChange(strategy);
    }
  }, [strategy, onStrategyChange]);
  
  // Add a new leg to the strategy
  const addLeg = (type = 'call') => {
    const atm = Math.round(underlyingPrice / strikeStep) * strikeStep;
    let newLeg;
    
    if (type === 'stock') {
      newLeg = {
        type: 'stock',
        action: 'buy',
        expiration: null,
        strikePrice: underlyingPrice,
        quantity: 100,
        price: underlyingPrice
      };
    } else {
      const optionData = generateOptionData(
        type, 
        atm, 
        expirations[0].value
      );
      
      newLeg = {
        type: type,
        action: 'buy',
        expiration: expirations[0].value,
        strikePrice: atm,
        quantity: 1,
        price: optionData.ask
      };
    }
    
    setStrategy({
      ...strategy,
      legs: [...strategy.legs, newLeg]
    });
    
    // Start editing the new leg
    setLegBeingEdited(strategy.legs.length);
  };
  
  // Remove a leg from the strategy
  const removeLeg = (index) => {
    const newLegs = [...strategy.legs];
    newLegs.splice(index, 1);
    
    setStrategy({
      ...strategy,
      legs: newLegs
    });
    
    if (legBeingEdited === index) {
      setLegBeingEdited(null);
    } else if (legBeingEdited !== null && legBeingEdited > index) {
      setLegBeingEdited(legBeingEdited - 1);
    }
  };
  
  // Update a leg's property
  const updateLeg = (index, field, value) => {
    const newLegs = [...strategy.legs];
    const leg = { ...newLegs[index], [field]: value };
    
    // If we're changing the type, action, strike, or expiration, update the price
    if (['type', 'action', 'strikePrice', 'expiration'].includes(field) && leg.type !== 'stock') {
      const optionData = generateOptionData(
        leg.type, 
        leg.strikePrice, 
        leg.expiration
      );
      
      leg.price = leg.action === 'buy' ? optionData.ask : optionData.bid;
    }
    
    newLegs[index] = leg;
    
    setStrategy({
      ...strategy,
      legs: newLegs
    });
  };
  
  // Calculate total cost of strategy
  const calculateTotalCost = () => {
    return strategy.legs.reduce((total, leg) => {
      const direction = leg.action === 'buy' ? 1 : -1;
      const multiplier = leg.type === 'stock' ? 1 : 100; // Options are for 100 shares
      return total + (direction * leg.quantity * leg.price * multiplier);
    }, 0);
  };

  // Render a single leg in edit mode
  const renderLegEditor = (leg, index) => {
    return (
      <Card className="mb-2">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">
              <Badge variant={leg.action === 'buy' ? "default" : "destructive"} className="mr-2">
                {leg.action === 'buy' ? 'BUY' : 'SELL'}
              </Badge>
              <span className="font-medium">
                {leg.quantity} × {leg.type === 'stock' ? 'Shares' : leg.type.toUpperCase()}
                {leg.type !== 'stock' && ` @ ${leg.strikePrice}`}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setLegBeingEdited(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium mb-1">Type</label>
              <Select
                value={leg.type}
                onValueChange={(value) => updateLeg(index, 'type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="call">Call Option</SelectItem>
                  <SelectItem value="put">Put Option</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium mb-1">Action</label>
              <Select
                value={leg.action}
                onValueChange={(value) => updateLeg(index, 'action', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <Input
                type="number"
                value={leg.quantity}
                onChange={(e) => updateLeg(index, 'quantity', parseInt(e.target.value) || 1)}
                min="1"
              />
            </div>
            
            {leg.type !== 'stock' && (
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium mb-1">Strike Price</label>
                <Select
                  value={String(leg.strikePrice)}
                  onValueChange={(value) => updateLeg(index, 'strikePrice', parseFloat(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {strikes.map((strike) => (
                      <SelectItem key={strike} value={String(strike)}>
                        ${strike.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {leg.type !== 'stock' && (
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Expiration</label>
                <Select
                  value={leg.expiration}
                  onValueChange={(value) => updateLeg(index, 'expiration', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {expirations.map((exp) => (
                      <SelectItem key={exp.value} value={exp.value}>
                        {exp.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Price</label>
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 text-gray-500 mr-1" />
                <Input
                  type="number"
                  value={leg.price}
                  onChange={(e) => updateLeg(index, 'price', parseFloat(e.target.value) || 0)}
                  step="0.01"
                  min="0"
                />
              </div>
              {leg.type !== 'stock' && (
                <div className="mt-1 text-xs text-gray-500 flex justify-between">
                  <span>Per contract</span>
                  <span>Total: {formatCurrency(leg.price * leg.quantity * 100)}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => removeLeg(index)}
            >
              Remove Leg
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Render a leg in compact mode
  const renderLegCompact = (leg, index) => {
    return (
      <div 
        className="flex items-center justify-between border rounded-md p-3 mb-2 cursor-pointer hover:bg-gray-50"
        onClick={() => setLegBeingEdited(index)}
      >
        <div className="flex items-center">
          <Badge variant={leg.action === 'buy' ? "default" : "destructive"} className="mr-2">
            {leg.action === 'buy' ? 'BUY' : 'SELL'}
          </Badge>
          <div>
            <div className="font-medium">
              {leg.quantity} × {leg.type === 'stock' ? 'Shares' : `${leg.type.toUpperCase()} ${leg.strikePrice}`}
            </div>
            {leg.type !== 'stock' && (
              <div className="text-xs text-gray-500">
                Exp: {new Date(leg.expiration).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="font-medium">
            {formatCurrency(leg.price)}
          </div>
          <div className="text-xs text-gray-500">
            {leg.type === 'stock' ? 'per share' : 'per contract'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="mb-4 w-full">
      <CardHeader>
        <CardTitle>{strategy.name}</CardTitle>
        <CardDescription>
          {strategyTemplates[selectedTemplate]?.description || 'Create a custom options strategy'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="builder">Strategy Builder</TabsTrigger>
            <TabsTrigger value="settings">Market Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="builder" className="pt-4">
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Strategy Template</label>
              <Select
                value={selectedTemplate}
                onValueChange={setSelectedTemplate}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(strategyTemplates).map(([key, template]) => (
                    <SelectItem key={key} value={key}>{template.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium">Strategy Legs</h3>
              <div className="flex space-x-2">
                <Select
                  defaultValue="call"
                  onValueChange={(type) => addLeg(type)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Add" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock">Add Stock</SelectItem>
                    <SelectItem value="call">Add Call</SelectItem>
                    <SelectItem value="put">Add Put</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2 mb-6">
              {strategy.legs.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-md">
                  <p className="text-gray-500">No legs added. Add a leg or select a template to get started.</p>
                </div>
              ) : (
                strategy.legs.map((leg, index) => (
                  <div key={index}>
                    {legBeingEdited === index 
                      ? renderLegEditor(leg, index)
                      : renderLegCompact(leg, index)
                    }
                  </div>
                ))
              )}
            </div>
            
            {strategy.legs.length > 0 && (
              <div className="mt-6 bg-gray-50 p-4 rounded-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">Total Cost:</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(calculateTotalCost())}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {calculateTotalCost() >= 0 
                    ? "Debit - You pay this amount to open the position"
                    : "Credit - You receive this amount to open the position"
                  }
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="settings" className="pt-4">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Underlying Symbol & Price</label>
                <div className="flex space-x-2">
                  <Input
                    className="w-24"
                    placeholder="Symbol"
                    value={strategy.symbol}
                    onChange={(e) => setStrategy({...strategy, symbol: e.target.value})}
                  />
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="number"
                      className="pl-8"
                      placeholder="Price"
                      value={strategy.underlyingPrice}
                      onChange={(e) => setStrategy({...strategy, underlyingPrice: parseFloat(e.target.value) || 0})}
                      step="0.01"
                      min="0.01"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <label className="block text-sm font-medium">Implied Volatility</label>
                  <span className="text-sm">{volatility}%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <PercentIcon className="h-4 w-4 text-gray-500" />
                  <Slider
                    value={[volatility]}
                    min={5}
                    max={100}
                    step={1}
                    onValueChange={(value) => setVolatility(value[0])}
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Strike Price Step</label>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <Select
                    value={String(strikeStep)}
                    onValueChange={(value) => setStrikeStep(parseFloat(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">$1.00</SelectItem>
                      <SelectItem value="2.5">$2.50</SelectItem>
                      <SelectItem value="5">$5.00</SelectItem>
                      <SelectItem value="10">$10.00</SelectItem>
                      <SelectItem value="25">$25.00</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Available Expirations</label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Days to Expiry</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expirations.map((exp) => {
                      const daysToExp = Math.round((new Date(exp.value) - new Date()) / (1000 * 60 * 60 * 24));
                      return (
                        <TableRow key={exp.value}>
                          <TableCell>{new Date(exp.value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</TableCell>
                          <TableCell>{daysToExp}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2">
        <Button 
          variant="outline" 
          onClick={() => {
            setSelectedTemplate('custom');
            setStrategy({
              ...strategy,
              name: 'Custom Strategy',
              legs: []
            });
          }}
        >
          Reset
        </Button>
        <Button>
          Save Strategy
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StrategyVisualBuilder;
