import React, { useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, PlusCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableFooter,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Positions Table component
const PositionsTable = () => {
  const positions = useMemo(() => {
    return [
      {
        id: 1,
        symbol: 'AAPL',
        strategy: 'Bull Call Spread',
        openDate: '2025-04-15',
        costBasis: 850,
        currentValue: 1200,
        profitLoss: 350,
        returnPercent: 41.18
      },
      {
        id: 2,
        symbol: 'MSFT',
        strategy: 'Covered Call',
        openDate: '2025-03-22',
        costBasis: 4120,
        currentValue: 4380,
        profitLoss: 260,
        returnPercent: 6.31
      },
      {
        id: 3,
        symbol: 'NVDA',
        strategy: 'Iron Condor',
        openDate: '2025-05-01',
        costBasis: 320,
        currentValue: 415,
        profitLoss: 95,
        returnPercent: 29.69
      },
      {
        id: 4,
        symbol: 'TSLA',
        strategy: 'Long Put',
        openDate: '2025-04-28',
        costBasis: 650,
        currentValue: 420,
        profitLoss: -230,
        returnPercent: -35.38
      },
      {
        id: 5,
        symbol: 'AMZN',
        strategy: 'Long Straddle',
        openDate: '2025-04-22',
        costBasis: 1200,
        currentValue: 1320,
        profitLoss: 120,
        returnPercent: 10.00
      }
    ];
  }, []);
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Open Positions</CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Position
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Strategy</TableHead>
              <TableHead>Open Date</TableHead>
              <TableHead className="text-right">Cost Basis</TableHead>
              <TableHead className="text-right">Current Value</TableHead>
              <TableHead className="text-right">P/L</TableHead>
              <TableHead className="text-right">Return %</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.map((position) => (
              <TableRow key={position.id}>
                <TableCell className="font-medium">{position.symbol}</TableCell>
                <TableCell>{position.strategy}</TableCell>
                <TableCell>{position.openDate}</TableCell>
                <TableCell className="text-right">${position.costBasis}</TableCell>
                <TableCell className="text-right">${position.currentValue}</TableCell>
                <TableCell className={`text-right ${position.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {position.profitLoss >= 0 ? '+' : '-'}${Math.abs(position.profitLoss)}
                </TableCell>
                <TableCell className={`text-right ${position.returnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {position.returnPercent >= 0 ? '+' : ''}
                  {position.returnPercent.toFixed(2)}%
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">Details</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell className="text-right">
                ${positions.reduce((sum, position) => sum + position.costBasis, 0)}
              </TableCell>
              <TableCell className="text-right">
                ${positions.reduce((sum, position) => sum + position.currentValue, 0)}
              </TableCell>
              <TableCell className={`text-right ${
                positions.reduce((sum, position) => sum + position.profitLoss, 0) >= 0 
                ? 'text-green-600' : 'text-red-600'
              }`}>
                {positions.reduce((sum, position) => sum + position.profitLoss, 0) >= 0 ? '+' : '-'}
                ${Math.abs(positions.reduce((sum, position) => sum + position.profitLoss, 0))}
              </TableCell>
              <TableCell className={`text-right ${
                positions.reduce((sum, position) => sum + position.costBasis, 0) > 0 &&
                (positions.reduce((sum, position) => sum + position.profitLoss, 0) / 
                 positions.reduce((sum, position) => sum + position.costBasis, 0) * 100) >= 0 
                ? 'text-green-600' : 'text-red-600'
              }`}>
                {positions.reduce((sum, position) => sum + position.costBasis, 0) > 0 
                  ? (positions.reduce((sum, position) => sum + position.profitLoss, 0) / 
                     positions.reduce((sum, position) => sum + position.costBasis, 0) * 100).toFixed(2) + '%'
                  : 'N/A'}
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PositionsTable;
