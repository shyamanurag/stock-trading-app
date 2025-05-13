// src/components/algorithmic/SignalTester.jsx
// Path: stock-trading-app/src/components/algorithmic/SignalTester.jsx

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  Check, 
  X, 
  Search, 
  Loader, 
  AlertCircle, 
  Calendar, 
  TrendingUp,
  TrendingDown,
  BadgeInfo,
  Target
} from 'lucide-react';

// Mock data for testing
const MOCK_SYMBOLS = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 193.28, changePercent: 2.14 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 415.25, changePercent: -1.25 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 174.23, changePercent: 0.78 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 185.47, changePercent: 1.53 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 947.89, changePercent: 3.72 },
  { symbol: 'META', name: 'Meta Platforms Inc.', price: 476.82, changePercent: 2.04 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 177.58, changePercent: -0.93 },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc.', price: 408.12, changePercent: 0.42 },
  { symbol: 'V', name: 'Visa Inc.', price: 274.46, changePercent: 0.68 },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.', price: 487.23, changePercent: -0.37 }
];

// Mock technical indicator data
const MOCK_TECH_DATA = {
  'AAPL': {
    'SMA': { '50': 185.64, '200': 180.23 },
    'EMA': { '12': 189.76, '26': 187.43 },
    'RSI': { '14': 63.24 },
    'MACD': { 'signal': 1.43, 'histogram': 0.87 },
    'Bollinger': { 'upper': 202.32, 'middle': 188.76, 'lower': 175.20 },
    'ATR': { '14': 3.85 }
  },
  'MSFT': {
    'SMA': { '50': 410.12, '200': 389.67 },
    'EMA': { '12': 418.53, '26': 412.89 },
    'RSI': { '14': 48.72 },
    'MACD': { 'signal': -0.87, 'histogram': -0.54 },
    'Bollinger': { 'upper': 435.67, 'middle': 412.34, 'lower': 389.01 },
    'ATR': { '14': 6.23 }
  },
  'GOOGL': {
    'SMA': { '50': 170.34, '200': 156.78 },
    'EMA': { '12': 173.45, '26': 169.87 },
    'RSI': { '14': 56.12 },
    'MACD': { 'signal': 0.76, 'histogram': 0.32 },
    'Bollinger': { 'upper': 184.32, 'middle': 172.45, 'lower': 160.58 },
    'ATR': { '14': 3.12 }
  },
  'AMZN': {
    'SMA': { '50': 180.23, '200': 165.67 },
    'EMA': { '12': 184.56, '26': 179.34 },
    'RSI': { '14': 64.87 },
    'MACD': { 'signal': 1.98, 'histogram': 0.76 },
    'Bollinger': { 'upper': 195.67, 'middle': 182.34, 'lower': 169.01 },
    'ATR': { '14': 4.56 }
  },
  'NVDA': {
    'SMA': { '50': 920.45, '200': 780.32 },
    'EMA': { '12': 942.34, '26': 915.67 },
    'RSI': { '14': 78.34 },
    'MACD': { 'signal': 12.45, 'histogram': 4.23 },
    'Bollinger': { 'upper': 1023.45, 'middle': 930.24, 'lower': 837.03 },
    'ATR': { '14': 28.67 }
  }
};

// Price action patterns
const MOCK_PRICE_PATTERNS = {
  'AAPL': { 'breakout': false, 'breakdown': false, 'new_high': false, 'new_low': false, 'inside_bar': true, 'engulfing_bullish': false },
  'MSFT': { 'breakout': false, 'breakdown': true, 'new_high': false, 'new_low': false, 'inside_bar': false, 'engulfing_bearish': true },
  'GOOGL': { 'breakout': false, 'breakdown': false, 'new_high': false, 'new_low': false, 'inside_bar': false, 'engulfing_bullish': false },
  'AMZN': { 'breakout': true, 'breakdown': false, 'new_high': true, 'new_low': false, 'inside_bar': false, 'engulfing_bullish': true },
  'NVDA': { 'breakout': true, 'breakdown': false, 'new_high': true, 'new_low': false, 'inside_bar': false, 'engulfing_bullish': false }
};

// Test if a condition is satisfied
const testCondition = (condition, symbol) => {
  if (!condition.type || !MOCK_TECH_DATA[symbol]) {
    return false;
  }
  
  const data = MOCK_TECH_DATA[symbol];
  const pricePatterns = MOCK_PRICE_PATTERNS[symbol];
  const price = MOCK_SYMBOLS.find(s => s.symbol === symbol)?.price || 0;
  
  if (condition.type === 'indicator') {
    const indicator = condition.indicator;
    const operator = condition.operator;
    
    // Handle indicator comparison
    if (indicator === 'SMA') {
      const period = condition.parameters?.period || 50;
      const smaValue = data.SMA[period] || 0;
      
      if (operator === '>') {
        return price > condition.value;
      }
      else if (operator === '<') {
        return price < condition.value;
      }
      else if (operator === 'crossover') {
        // Compare with another indicator or value
        if (condition.value === 'SMA') {
          const otherPeriod = condition.valueParameters?.period || 200;
          const otherValue = data.SMA[otherPeriod] || 0;
          
          // For demo purposes, just check if price > SMA
          // In a real system, would check for an actual crossover
          return smaValue > otherValue;
        } else {
          return smaValue > condition.value;
        }
      }
    }
    else if (indicator === 'RSI') {
      const period = condition.parameters?.period || 14;
      const rsiValue = data.RSI[period] || 0;
      
      if (operator === '>') {
        return rsiValue > condition.value;
      }
      else if (operator === '<') {
        return rsiValue < condition.value;
      }
    }
    else if (indicator === 'Bollinger Bands') {
      if (operator === 'price_above_upper') {
        return price > data.Bollinger.upper;
      }
      else if (operator === 'price_below_lower') {
        return price < data.Bollinger.lower;
      }
      else if (operator === 'price_above_middle') {
        return price > data.Bollinger.middle;
      }
      else if (operator === 'price_below_middle') {
        return price < data.Bollinger.middle;
      }
    }
  }
  else if (condition.type === 'priceAction') {
    const action = condition.action;
    return pricePatterns[action] || false;
  }
  
  // Default fallback
  return Math.random() > 0.5; // Random result for demo
};

// Signal Tester component
const SignalTester = ({ algorithm }) => {
  const [symbol, setSymbol] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState([]);
  const [includeAll, setIncludeAll] = useState(false);

  // Filter symbols by search term
  const filteredSymbols = MOCK_SYMBOLS.filter(item => 
    item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Scan for signals on selected symbols
  const scanForSignals = () => {
    setScanning(true);
    
    // Determine which symbols to scan
    const symbolsToScan = symbol 
      ? [symbol] 
      : includeAll 
        ? MOCK_SYMBOLS.map(s => s.symbol)
        : MOCK_SYMBOLS.slice(0, 5).map(s => s.symbol); // Top 5 by default
    
    setTimeout(() => {
      const scanResults = symbolsToScan.map(sym => {
        // Test entry conditions
        const entryConditionsMet = algorithm.entryConditions.every(condition => 
          testCondition(condition, sym)
        );
        
        // Test exit conditions (only if we have a position)
        const exitConditionsMet = algorithm.exitConditions.some(condition => 
          testCondition(condition, sym)
        );
        
        const mockSymbol = MOCK_SYMBOLS.find(s => s.symbol === sym);
        
        return {
          symbol: sym,
          name: mockSymbol?.name || '',
          price: mockSymbol?.price || 0,
          changePercent: mockSymbol?.changePercent || 0,
          entrySignal: entryConditionsMet,
          exitSignal: exitConditionsMet,
          technicals: MOCK_TECH_DATA[sym] || {}
        };
      });
      
      setResults(scanResults);
      setScanning(false);
    }, 1500); // Simulate loading
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Signal Tester</CardTitle>
            <CardDescription>
              Test your trading conditions on current market data
            </CardDescription>
          </div>
          <Select
            value={symbol}
            onValueChange={setSymbol}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Symbols" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Symbols</SelectItem>
              <SelectGroup>
                <SelectLabel>Popular Stocks</SelectLabel>
                {MOCK_SYMBOLS.map(stock => (
                  <SelectItem key={stock.symbol} value={stock.symbol}>
                    {stock.symbol}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search symbols..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            onClick={scanForSignals}
            disabled={scanning || (algorithm.entryConditions.length === 0 && algorithm.exitConditions.length === 0)}
          >
            {scanning ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Target className="h-4 w-4 mr-2" />
                Scan for Signals
              </>
            )}
          </Button>
        </div>
        
        {algorithm.entryConditions.length === 0 && algorithm.exitConditions.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">No conditions defined</p>
              <p>Add entry or exit conditions to test signals.</p>
            </div>
          </div>
        )}
        
        {results.length > 0 ? (
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Entry Signal</TableHead>
                  <TableHead>Exit Signal</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.symbol}>
                    <TableCell>
                      <div className="font-medium">{result.symbol}</div>
                      <div className="text-xs text-gray-500">{result.name}</div>
                    </TableCell>
                    <TableCell>${result.price.toFixed(2)}</TableCell>
                    <TableCell className={result.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {result.changePercent >= 0 ? '+' : ''}{result.changePercent.toFixed(2)}%
                    </TableCell>
                    <TableCell>
                      {result.entrySignal ? (
                        <span className="inline-flex items-center text-green-600">
                          <Check className="h-4 w-4 mr-1" /> Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-gray-500">
                          <X className="h-4 w-4 mr-1" /> No
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {result.exitSignal ? (
                        <span className="inline-flex items-center text-red-600">
                          <Check className="h-4 w-4 mr-1" /> Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-gray-500">
                          <X className="h-4 w-4 mr-1" /> No
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {result.entrySignal && !result.exitSignal && (
                        <Badge className="bg-green-600">BUY</Badge>
                      )}
                      {result.exitSignal && (
                        <Badge variant="destructive">SELL</Badge>
                      )}
                      {!result.entrySignal && !result.exitSignal && (
                        <Badge variant="outline">HOLD</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="mt-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="include-all" 
                  checked={includeAll}
                  onCheckedChange={setIncludeAll}
                />
                <label htmlFor="include-all" className="text-sm">
                  Include all available symbols
                </label>
              </div>
              
              <Button variant="outline" size="sm" onClick={scanForSignals}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-md">
            <div className="text-gray-500">
              <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No Signals Tested</h3>
              <p className="max-w-md mx-auto text-sm">
                Click "Scan for Signals" to test your trading rules against current market data.
              </p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-gray-50 border-t px-6 py-3">
        <div className="text-xs text-gray-500 flex items-center">
          <Calendar className="h-3.5 w-3.5 mr-1" />
          Data as of {new Date().toLocaleString()}. Using simulated market data for demo purposes.
        </div>
      </CardFooter>
    </Card>
  );
};

export default SignalTester;
