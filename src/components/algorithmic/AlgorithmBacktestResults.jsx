// src/components/algorithmic/AlgorithmBacktestResults.jsx
// Path: stock-trading-app/src/components/algorithmic/AlgorithmBacktestResults.jsx

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart as BarChartIcon,
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Info,
  FileText
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
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

// Helper to format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Helper to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Component for equity curve chart
const EquityCurveChart = ({ data }) => {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickFormatter={(tick) => {
              const date = new Date(tick);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
            tickCount={10}
          />
          <YAxis 
            yAxisId="left"
            domain={['auto', 'auto']}
            tickFormatter={(tick) => `$${tick.toLocaleString()}`}
          />
          <Tooltip 
            formatter={(value, name) => [formatCurrency(value), 'Equity']}
            labelFormatter={(label) => `Date: ${formatDate(label)}`}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="equity"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.2}
            name="Equity"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// Component for drawdown chart
const DrawdownChart = ({ data }) => {
  // Calculate drawdown series
  const drawdownSeries = [];
  let peak = 0;
  
  data.forEach(point => {
    if (point.equity > peak) {
      peak = point.equity;
    }
    
    const drawdown = (peak - point.equity) / peak * 100;
    drawdownSeries.push({
      date: point.date,
      drawdown: -drawdown // Negative value for visual representation
    });
  });
  
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={drawdownSeries}
          margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickFormatter={(tick) => {
              const date = new Date(tick);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
            tickCount={10}
          />
          <YAxis 
            tickFormatter={(tick) => `${Math.abs(tick).toFixed(1)}%`}
          />
          <Tooltip 
            formatter={(value) => [`${Math.abs(value).toFixed(2)}%`, 'Drawdown']}
            labelFormatter={(label) => `Date: ${formatDate(label)}`}
          />
          <ReferenceLine y={0} stroke="#666" />
          <Line 
            type="monotone" 
            dataKey="drawdown" 
            stroke="#ef4444" 
            fill="none" 
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Component for trade distribution chart
const TradeDistributionChart = ({ trades }) => {
  // Group trades by symbol
  const tradesBySymbol = trades.reduce((acc, trade) => {
    acc[trade.symbol] = (acc[trade.symbol] || 0) + 1;
    return acc;
  }, {});
  
  // Convert to array for chart
  const data = Object.entries(tradesBySymbol).map(([symbol, count]) => ({
    name: symbol,
    value: count
  }));
  
  // Colors for pie chart
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#a855f7'];
  
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={true}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name, props) => [`${value} trades`, props.payload.name]} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Component for profit/loss distribution chart
const ProfitLossDistributionChart = ({ trades }) => {
  // Create bins for P&L distribution
  const bins = [-50, -25, -10, -5, 0, 5, 10, 25, 50, 100];
  const distribution = Array(bins.length).fill(0);
  
  trades.forEach(trade => {
    const plPercent = trade.profitLoss;
    
    // Find the appropriate bin
    let binIndex = 0;
    while (binIndex < bins.length - 1 && plPercent > bins[binIndex]) {
      binIndex++;
    }
    
    distribution[binIndex]++;
  });
  
  // Convert to chart data
  const data = bins.map((bin, index) => {
    const label = index === bins.length - 1 
      ? `>${bins[index - 1]}%` 
      : index === 0 
        ? `<${bin}%` 
        : `${bins[index - 1]}% to ${bin}%`;
    
    return {
      name: label,
      count: distribution[index],
      fill: bin < 0 ? '#ef4444' : bin === 0 ? '#9ca3af' : '#22c55e'
    };
  });
  
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 10 }}
            interval={0}
            angle={-25}
            textAnchor="end"
          />
          <YAxis />
          <Tooltip formatter={(value) => [`${value} trades`, 'Count']} />
          <Bar dataKey="count" name="Number of Trades">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Component for monthly returns chart
const MonthlyReturnsChart = ({ data }) => {
  // Process data to get monthly returns
  const monthlyReturns = [];
  let currentMonth = null;
  let monthStartEquity = null;
  
  data.forEach(point => {
    const date = new Date(point.date);
    const month = `${date.getFullYear()}-${date.getMonth() + 1}`;
    
    if (month !== currentMonth) {
      if (currentMonth !== null) {
        // Calculate return for previous month
        const previousMonthData = data.find(p => {
          const d = new Date(p.date);
          return `${d.getFullYear()}-${d.getMonth() + 1}` === currentMonth;
        });
        
        const monthEndEquity = previousMonthData.equity;
        const monthlyReturn = (monthEndEquity / monthStartEquity - 1) * 100;
        
        monthlyReturns.push({
          month: currentMonth,
          return: monthlyReturn,
          fill: monthlyReturn >= 0 ? '#22c55e' : '#ef4444'
        });
      }
      
      currentMonth = month;
      monthStartEquity = point.equity;
    }
  });
  
  // Add the last month
  if (currentMonth !== null && monthStartEquity !== null) {
    const lastPoint = data[data.length - 1];
    const monthlyReturn = (lastPoint.equity / monthStartEquity - 1) * 100;
    
    monthlyReturns.push({
      month: currentMonth,
      return: monthlyReturn,
      fill: monthlyReturn >= 0 ? '#22c55e' : '#ef4444'
    });
  }
  
  // Format month labels
  const formattedReturns = monthlyReturns.map(item => {
    const [year, month] = item.month.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return {
      ...item,
      monthFormatted: `${monthNames[parseInt(month) - 1]} ${year}`
    };
  });
  
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formattedReturns}
          margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="monthFormatted" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tickFormatter={(tick) => `${tick.toFixed(1)}%`}
          />
          <Tooltip 
            formatter={(value) => [`${value.toFixed(2)}%`, 'Return']}
          />
          <ReferenceLine y={0} stroke="#666" />
          <Bar dataKey="return" name="Monthly Return">
            {formattedReturns.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Main component for displaying backtest results
const AlgorithmBacktestResults = ({ results }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [tradesPage, setTradesPage] = useState(1);
  const tradesPerPage = 10;
  
  // Metrics summary component
  const MetricsSummary = () => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500 mb-1">Total Return</div>
            <div className={`text-2xl font-semibold ${results.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {results.totalReturn >= 0 ? '+' : ''}{results.totalReturn.toFixed(2)}%
            </div>
            <div className="text-xs text-gray-500">
              {formatDate(results.startDate)} - {formatDate(results.endDate)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500 mb-1">Sharpe Ratio</div>
            <div className="text-2xl font-semibold">
              {results.sharpeRatio.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">
              Risk-adjusted return
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500 mb-1">Win Rate</div>
            <div className="text-2xl font-semibold">
              {results.winRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">
              {results.trades.filter(t => parseFloat(t.profitLossAmount) > 0).length} out of {results.trades.length} trades
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500 mb-1">Max Drawdown</div>
            <div className="text-2xl font-semibold text-red-600">
              {results.maxDrawdown.toFixed(2)}%
            </div>
            <div className="text-xs text-gray-500">
              Largest equity decline
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // Performance metrics component
  const PerformanceMetrics = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Initial Capital</TableCell>
                    <TableCell className="text-right">{formatCurrency(results.initialCapital)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Final Equity</TableCell>
                    <TableCell className="text-right">{formatCurrency(results.finalEquity)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Total Return</TableCell>
                    <TableCell className={`text-right ${results.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {results.totalReturn >= 0 ? '+' : ''}{results.totalReturn.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Annualized Return</TableCell>
                    <TableCell className={`text-right ${results.annualizedReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {results.annualizedReturn >= 0 ? '+' : ''}{results.annualizedReturn.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Sharpe Ratio</TableCell>
                    <TableCell className="text-right">{results.sharpeRatio.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Max Drawdown</TableCell>
                    <TableCell className="text-right text-red-600">{results.maxDrawdown.toFixed(2)}%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Trade Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Total Trades</TableCell>
                    <TableCell className="text-right">{results.trades.length}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Win Rate</TableCell>
                    <TableCell className="text-right">{results.winRate.toFixed(1)}%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Average Win</TableCell>
                    <TableCell className="text-right text-green-600">+{formatCurrency(results.averageWin)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Average Loss</TableCell>
                    <TableCell className="text-right text-red-600">-{formatCurrency(Math.abs(results.averageLoss))}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Profit Factor</TableCell>
                    <TableCell className="text-right">{results.profitFactor.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Avg. Holding Period</TableCell>
                    <TableCell className="text-right">
                      {(() => {
                        const periods = results.trades.map(trade => {
                          const entryDate = new Date(trade.entry);
                          const exitDate = new Date(trade.exit);
                          return (exitDate - entryDate) / (1000 * 60 * 60 * 24);
                        });
                        const avg = periods.reduce((sum, period) => sum + period, 0) / periods.length;
                        return `${avg.toFixed(1)} days`;
                      })()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };
  
  // Calculate pagination for trades
  const paginatedTrades = results.trades.slice(
    (tradesPage - 1) * tradesPerPage,
    tradesPage * tradesPerPage
  );
  
  const totalPages = Math.ceil(results.trades.length / tradesPerPage);
  
  return (
    <div className="space-y-6">
      <MetricsSummary />
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="flex items-center">
            <LineChartIcon className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="trades" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Trades
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center">
            <BarChartIcon className="h-4 w-4 mr-2" />
            Analysis
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Equity Curve</CardTitle>
            </CardHeader>
            <CardContent>
              <EquityCurveChart data={results.equityCurve} />
            </CardContent>
          </Card>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Drawdown</CardTitle>
            </CardHeader>
            <CardContent>
              <DrawdownChart data={results.equityCurve} />
            </CardContent>
          </Card>
          
          <PerformanceMetrics />
        </TabsContent>
        
        <TabsContent value="trades">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Trades</CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Entry Date</TableHead>
                    <TableHead>Exit Date</TableHead>
                    <TableHead>Entry Price</TableHead>
                    <TableHead>Exit Price</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead className="text-right">P/L ($)</TableHead>
                    <TableHead className="text-right">P/L (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTrades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell>{trade.id}</TableCell>
                      <TableCell>{trade.symbol}</TableCell>
                      <TableCell>
                        <Badge variant={trade.type === 'long' ? 'default' : 'secondary'}>
                          {trade.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(trade.entry)}</TableCell>
                      <TableCell>{formatDate(trade.exit)}</TableCell>
                      <TableCell>${parseFloat(trade.entryPrice).toFixed(2)}</TableCell>
                      <TableCell>${parseFloat(trade.exitPrice).toFixed(2)}</TableCell>
                      <TableCell>{trade.quantity}</TableCell>
                      <TableCell className={`text-right ${parseFloat(trade.profitLossAmount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {parseFloat(trade.profitLossAmount) >= 0 ? '+' : ''}${Math.abs(parseFloat(trade.profitLossAmount)).toFixed(2)}
                      </TableCell>
                      <TableCell className={`text-right ${trade.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trade.profitLoss >= 0 ? '+' : ''}{trade.profitLoss.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Showing {(tradesPage - 1) * tradesPerPage + 1}-
                    {Math.min(tradesPage * tradesPerPage, results.trades.length)} of {results.trades.length} trades
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTradesPage(tradesPage - 1)}
                      disabled={tradesPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTradesPage(tradesPage + 1)}
                      disabled={tradesPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analysis">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Returns</CardTitle>
              </CardHeader>
              <CardContent>
                <MonthlyReturnsChart data={results.equityCurve} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>P&L Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ProfitLossDistributionChart trades={results.trades} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Trade Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <TradeDistributionChart trades={results.trades} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Trade Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Best Trade</div>
                      <div className="text-lg font-semibold text-green-600">
                        +{formatCurrency((() => {
                          const bestTrade = [...results.trades].sort((a, b) => 
                            parseFloat(b.profitLossAmount) - parseFloat(a.profitLossAmount)
                          )[0];
                          return parseFloat(bestTrade.profitLossAmount);
                        })())}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(() => {
                          const bestTrade = [...results.trades].sort((a, b) => 
                            parseFloat(b.profitLossAmount) - parseFloat(a.profitLossAmount)
                          )[0];
                          return `${bestTrade.symbol} on ${formatDate(bestTrade.exit)}`;
                        })()}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Worst Trade</div>
                      <div className="text-lg font-semibold text-red-600">
                        {formatCurrency((() => {
                          const worstTrade = [...results.trades].sort((a, b) => 
                            parseFloat(a.profitLossAmount) - parseFloat(b.profitLossAmount)
                          )[0];
                          return parseFloat(worstTrade.profitLossAmount);
                        })())}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(() => {
                          const worstTrade = [...results.trades].sort((a, b) => 
                            parseFloat(a.profitLossAmount) - parseFloat(b.profitLossAmount)
                          )[0];
                          return `${worstTrade.symbol} on ${formatDate(worstTrade.exit)}`;
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Largest Winner</div>
                      <div className="text-lg font-semibold text-green-600">
                        +{(() => {
                          const bestTrade = [...results.trades].sort((a, b) => 
                            b.profitLoss - a.profitLoss
                          )[0];
                          return `${bestTrade.profitLoss.toFixed(2)}%`;
                        })()}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Largest Loser</div>
                      <div className="text-lg font-semibold text-red-600">
                        {(() => {
                          const worstTrade = [...results.trades].sort((a, b) => 
                            a.profitLoss - b.profitLoss
                          )[0];
                          return `${worstTrade.profitLoss.toFixed(2)}%`;
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Consecutive Wins</div>
                      <div className="text-lg font-semibold">
                        {(() => {
                          let maxConsecutiveWins = 0;
                          let currentStreak = 0;
                          
                          results.trades.forEach(trade => {
                            if (parseFloat(trade.profitLossAmount) > 0) {
                              currentStreak++;
                              maxConsecutiveWins = Math.max(maxConsecutiveWins, currentStreak);
                            } else {
                              currentStreak = 0;
                            }
                          });
                          
                          return maxConsecutiveWins;
                        })()}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Consecutive Losses</div>
                      <div className="text-lg font-semibold">
                        {(() => {
                          let maxConsecutiveLosses = 0;
                          let currentStreak = 0;
                          
                          results.trades.forEach(trade => {
                            if (parseFloat(trade.profitLossAmount) <= 0) {
                              currentStreak++;
                              maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentStreak);
                            } else {
                              currentStreak = 0;
                            }
                          });
                          
                          return maxConsecutiveLosses;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium mb-1">Backtest Disclaimer</h4>
              <p className="text-xs text-gray-600">
                Past performance is not indicative of future results. Backtests have inherent limitations, including the potential for overfitting and the inability to account for all market conditions. Always consider real-world factors like slippage, commissions, and market impact, which can significantly affect actual trading results.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlgorithmBacktestResults;
