// src/components/wallet/WalletTransactionHistory.jsx

import React from 'react';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

// Mock data for development
const mockTransactions = [
  { 
    id: '1', 
    type: 'deposit', 
    amount: 5000, 
    status: 'completed', 
    timestamp: new Date(2025, 4, 10).toISOString(),
    reference: 'UPI/12345678/DEPOSIT' 
  },
  { 
    id: '2', 
    type: 'withdrawal', 
    amount: 2000, 
    status: 'completed', 
    timestamp: new Date(2025, 4, 5).toISOString(),
    reference: 'NEFT/87654321/WITHDRAW' 
  },
  { 
    id: '3', 
    type: 'deposit', 
    amount: 1500, 
    status: 'pending', 
    timestamp: new Date(2025, 4, 1).toISOString(),
    reference: 'CARD/56781234/DEPOSIT' 
  },
  { 
    id: '4', 
    type: 'withdrawal', 
    amount: 3000, 
    status: 'failed', 
    timestamp: new Date(2025, 3, 28).toISOString(),
    reference: 'NEFT/43218765/FAILED' 
  }
];

const TransactionStatusBadge = ({ status }) => {
  const statusConfig = {
    completed: {
      color: 'bg-green-100 text-green-800',
      icon: <CheckCircle size={14} className="mr-1" />
    },
    pending: {
      color: 'bg-yellow-100 text-yellow-800',
      icon: <Clock size={14} className="mr-1" />
    },
    failed: {
      color: 'bg-red-100 text-red-800',
      icon: <AlertCircle size={14} className="mr-1" />
    }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`flex items-center px-2 py-1 rounded-full text-xs ${config.color}`}>
      {config.icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const WalletTransactionHistory = () => {
  // Replace with actual Redux state once implemented
  const { transactions = mockTransactions, isLoading = false } = useSelector(
    (state) => state.wallet || { transactions: mockTransactions, isLoading: false }
  );

  if (isLoading) {
    return <div className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 bg-gray-200 rounded mb-2"></div>
      ))}
    </div>;
  }

  if (!transactions || transactions.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">
      No transactions found
    </div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b text-left text-sm text-muted-foreground">
            <th className="pb-2 font-medium">Date</th>
            <th className="pb-2 font-medium">Type</th>
            <th className="pb-2 font-medium">Amount</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 font-medium">Reference</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="border-b hover:bg-muted/20">
              <td className="py-3 text-sm">
                {format(new Date(transaction.timestamp), 'dd MMM yyyy, HH:mm')}
              </td>
              <td className="py-3">
                <div className="flex items-center">
                  {transaction.type === 'deposit' ? (
                    <ArrowDownCircle size={16} className="mr-2 text-green-500" />
                  ) : (
                    <ArrowUpCircle size={16} className="mr-2 text-red-500" />
                  )}
                  <span className="capitalize">{transaction.type}</span>
                </div>
              </td>
              <td className={`py-3 font-medium ${
                transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.type === 'deposit' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
              </td>
              <td className="py-3">
                <TransactionStatusBadge status={transaction.status} />
              </td>
              <td className="py-3 text-sm text-muted-foreground truncate max-w-[150px]">
                {transaction.reference || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WalletTransactionHistory;
