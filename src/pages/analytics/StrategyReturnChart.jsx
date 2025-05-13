import React, { useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Strategy Return Chart component
const StrategyReturnChart = ({ timeframe = '1M' }) => {
  // Generate sample return data
  const equityData = useMemo(() => {
    const days = timeframe === '1W' ? 7 : 
                 timeframe === '1M' ? 30 : 
                 timeframe === '3M' ? 90 : 
                 timeframe === '6M' ? 180 : 
                 timeframe === '1Y' ? 365 : 500;
    
    let equity = 10000;
    let benchmark = 10000;
    const data = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      
      // Random daily return between -2% and 2% for strategy
      const dailyReturn = (Math.random() * 4 - 2) / 100;
      equity = equity * (1 + dailyReturn);
      
      // Random daily return between -1% and 1.5% for benchmark
      const benchmarkReturn = (Math.random() * 2.5 - 1) / 100;
      benchmark = benchmark * (1 + benchmarkReturn);
      
      data.push({
        date: date.toISOString().split('T')[0],
        equity: equity,
        benchmark: benchmark,
      });
    }
    
    return data;
  }, [timeframe]);
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Strategy Performance</CardTitle>
          <div className="flex space-x-2">
            <Select defaultValue={timeframe}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1W">1 Week</SelectItem>
                <SelectItem value="1M">1 Month</SelectItem>
                <SelectItem value="3M">3 Months</SelectItem>
                <SelectItem value="6M">6 Months</SelectItem>
                <SelectItem value="1Y">1 Year</SelectItem>
                <SelectItem value="ALL">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={equityData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }} 
                tickCount={5} 
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
                domain={['dataMin - 1000', 'dataMax + 1000']}
              />
              <Tooltip 
                formatter={(value) => [`$${value.toFixed(2)}`, 'Value']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="equity" 
                name="Strategy" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="benchmark" 
                name="S&P 500" 
                stroke="#94a3b8" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Start Value</div>
            <div className="font-medium">${equityData[0].equity.toFixed(2)}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Current Value</div>
            <div className="font-medium">${equityData[equityData.length - 1].equity.toFixed(2)}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Total Return</div>
            <div className={`font-medium ${(equityData[equityData.length - 1].equity - equityData[0].equity) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {((equityData[equityData.length - 1].equity / equityData[0].equity - 1) * 100).toFixed(2)}%
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">vs. Benchmark</div>
            <div className={`font-medium ${
              ((equityData[equityData.length - 1].equity / equityData[0].equity) - 
              (equityData[equityData.length - 1].benchmark / equityData[0].benchmark)) >= 0 
              ? 'text-green-600' : 'text-red-600'
            }`}>
              {(((equityData[equityData.length - 1].equity / equityData[0].equity) - 
                (equityData[equityData.length - 1].benchmark / equityData[0].benchmark)) * 100).toFixed(2)}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StrategyReturnChart;
