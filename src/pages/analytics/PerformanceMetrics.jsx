import React, { useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
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
import {
  BarChart,
  Bar,
  ResponsiveContainer
} from 'recharts';

// Helper to format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Performance Metrics component
const PerformanceMetrics = ({ strategy, timeframe = '1M' }) => {
  // In a real app, these would be calculated from actual strategy data
  // Here we're generating simulated metrics
  const metrics = useMemo(() => {
    const randomPercentage = (min, max) => (Math.random() * (max - min) + min).toFixed(2);
    const randomCurrency = (min, max) => (Math.random() * (max - min) + min).toFixed(2);
    
    return {
      totalReturn: randomPercentage(-10, 30),
      annualizedReturn: randomPercentage(-5, 25),
      sharpeRatio: (Math.random() * 3).toFixed(2),
      maxDrawdown: randomPercentage(-30, -5),
      winRate: randomPercentage(40, 80),
      profitFactor: (Math.random() * 2 + 0.5).toFixed(2),
      totalTrades: Math.floor(Math.random() * 50) + 10,
      averageHoldingPeriod: Math.floor(Math.random() * 14) + 1,
      bestTrade: randomCurrency(500, 5000),
      worstTrade: randomCurrency(-3000, -200)
    };
  }, [timeframe]);
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Performance Metrics</CardTitle>
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Total Return</div>
            <div className={`text-lg font-semibold ${parseFloat(metrics.totalReturn) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {parseFloat(metrics.totalReturn) >= 0 ? '+' : ''}{metrics.totalReturn}%
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Ann. Return</div>
            <div className={`text-lg font-semibold ${parseFloat(metrics.annualizedReturn) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {parseFloat(metrics.annualizedReturn) >= 0 ? '+' : ''}{metrics.annualizedReturn}%
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Sharpe Ratio</div>
            <div className="text-lg font-semibold">
              {metrics.sharpeRatio}
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Max Drawdown</div>
            <div className="text-lg font-semibold text-red-600">
              {metrics.maxDrawdown}%
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Win Rate</div>
            <div className="text-lg font-semibold">
              {metrics.winRate}%
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Profit Factor</div>
            <div className="text-lg font-semibold">
              {metrics.profitFactor}
            </div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="py-2 text-gray-500">Total Trades</TableCell>
                  <TableCell className="py-2 text-right">{metrics.totalTrades}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="py-2 text-gray-500">Avg Holding Period</TableCell>
                  <TableCell className="py-2 text-right">{metrics.averageHoldingPeriod} days</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="py-2 text-gray-500">Best Trade</TableCell>
                  <TableCell className="py-2 text-right text-green-600">+${metrics.bestTrade}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="py-2 text-gray-500">Worst Trade</TableCell>
                  <TableCell className="py-2 text-right text-red-600">-${Math.abs(metrics.worstTrade)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Win/Loss Distribution</h4>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart
                data={[
                  { name: 'Big Win', value: Math.floor(Math.random() * 5) + 1, fill: '#10b981' },
                  { name: 'Win', value: Math.floor(Math.random() * 15) + 10, fill: '#34d399' },
                  { name: 'Small Win', value: Math.floor(Math.random() * 10) + 5, fill: '#6ee7b7' },
                  { name: 'Break Even', value: Math.floor(Math.random() * 8) + 2, fill: '#94a3b8' },
                  { name: 'Small Loss', value: Math.floor(Math.random() * 8) + 2, fill: '#fca5a5' },
                  { name: 'Loss', value: Math.floor(Math.random() * 10) + 3, fill: '#f87171' },
                  { name: 'Big Loss', value: Math.floor(Math.random() * 5) + 1, fill: '#ef4444' },
                ]}
                margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
              >
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceMetrics;
