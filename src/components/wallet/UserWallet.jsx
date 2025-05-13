// src/components/wallet/UserWallet.jsx

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Card, 
  Button, 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from "@/components/ui";
import { PlusCircle, MinusCircle, RefreshCw, FileText } from 'lucide-react';
import WalletTransactionHistory from './WalletTransactionHistory';
import PaymentIntegrationModal from './PaymentIntegrationModal';

// Mock functions for development until we integrate with the actual API and Redux store
const mockGetWalletBalance = () => ({ type: 'MOCK_GET_WALLET_BALANCE' });
const mockGetTransactionHistory = () => ({ type: 'MOCK_GET_TRANSACTION_HISTORY' });

const UserWallet = () => {
  const dispatch = useDispatch();
  
  // Replace with actual Redux selectors once implemented
  const walletState = useSelector((state) => state.wallet || {
    balance: 10000.50, // Mock data for development
    isLoading: false,
    error: null
  });
  
  const { balance, isLoading, error } = walletState;
  
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  useEffect(() => {
    // Dispatch actions to fetch wallet data
    dispatch(mockGetWalletBalance());
    dispatch(mockGetTransactionHistory());
  }, [dispatch]);

  // Functions to handle deposit and withdrawal
  const handleDeposit = () => {
    setShowDepositModal(true);
  };

  const handleWithdraw = () => {
    setShowWithdrawModal(true);
  };

  const handleRefresh = () => {
    dispatch(mockGetWalletBalance());
    dispatch(mockGetTransactionHistory());
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>;
  }

  if (error) {
    return <div className="text-red-500 p-4 border border-red-200 rounded-md">
      Failed to load wallet information: {error}
    </div>;
  }

  return (
    <div className="p-4">
      <Card className="bg-background border-border">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">My Wallet</h2>
            <Button variant="ghost" size="sm" onClick={handleRefresh} className="text-muted-foreground">
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </Button>
          </div>

          <div className="bg-muted/20 p-6 rounded-lg mb-6">
            <div className="text-sm text-muted-foreground mb-2">Available Balance</div>
            <div className="text-3xl font-bold text-foreground">₹{balance.toFixed(2)}</div>
          </div>

          <div className="flex gap-4 mb-6">
            <Button onClick={handleDeposit} className="flex-1 bg-green-600 hover:bg-green-700">
              <PlusCircle size={18} className="mr-2" />
              Deposit
            </Button>
            <Button onClick={handleWithdraw} variant="outline" className="flex-1 border-red-500 text-red-500 hover:bg-red-50">
              <MinusCircle size={18} className="mr-2" />
              Withdraw
            </Button>
          </div>

          <Tabs defaultValue="transactions">
            <TabsList className="w-full">
              <TabsTrigger value="transactions" className="flex-1">Transaction History</TabsTrigger>
              <TabsTrigger value="statements" className="flex-1">Statements</TabsTrigger>
            </TabsList>
            <TabsContent value="transactions" className="mt-4">
              <WalletTransactionHistory />
            </TabsContent>
            <TabsContent value="statements" className="mt-4">
              <div className="flex justify-center items-center h-48 border border-dashed rounded-md">
                <div className="text-center">
                  <FileText size={48} className="mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No statements generated yet</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>

      {/* Modals */}
      {showDepositModal && (
        <PaymentIntegrationModal 
          type="deposit" 
          onClose={() => setShowDepositModal(false)} 
        />
      )}
      {showWithdrawModal && (
        <PaymentIntegrationModal 
          type="withdraw" 
          onClose={() => setShowWithdrawModal(false)} 
        />
      )}
    </div>
  );
};

export default UserWallet;
