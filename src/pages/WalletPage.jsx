// src/pages/WalletPage.jsx

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Card, 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from "@/components/ui";
import UserWallet from '../components/wallet/UserWallet';
import { getWalletBalance, getTransactionHistory } from '../store/slices/walletSlice';

const WalletPage = () => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.wallet);
  
  useEffect(() => {
    // Fetch wallet data when component mounts
    dispatch(getWalletBalance());
    dispatch(getTransactionHistory());
  }, [dispatch]);
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Wallet & Payments</h1>
      
      <Tabs defaultValue="wallet" className="mb-8">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="bank-accounts">Bank Accounts</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="wallet" className="mt-6">
          <UserWallet />
        </TabsContent>
        
        <TabsContent value="payment-methods" className="mt-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Payment Methods</h2>
            <p className="text-muted-foreground">
              You have not added any payment methods yet. Add a payment method to enable quick deposits.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              <Card className="p-4 border-dashed flex flex-col items-center justify-center h-40 cursor-pointer hover:bg-muted/20">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </div>
                <p className="font-medium">Add New Card</p>
                <p className="text-xs text-muted-foreground mt-1">Credit or Debit Card</p>
              </Card>
              
              <Card className="p-4 border-dashed flex flex-col items-center justify-center h-40 cursor-pointer hover:bg-muted/20">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </div>
                <p className="font-medium">Add UPI ID</p>
                <p className="text-xs text-muted-foreground mt-1">For Quick Payments</p>
              </Card>
              
              <Card className="p-4 border-dashed flex flex-col items-center justify-center h-40 cursor-pointer hover:bg-muted/20">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </div>
                <p className="font-medium">Add Net Banking</p>
                <p className="text-xs text-muted-foreground mt-1">Link Your Bank</p>
              </Card>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="bank-accounts" className="mt-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Bank Accounts</h2>
            <p className="text-muted-foreground mb-6">
              Add your bank accounts for quick withdrawals. All bank accounts must be verified before use.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="p-4 border-dashed flex flex-col items-center justify-center h-40 cursor-pointer hover:bg-muted/20">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </div>
                <p className="font-medium">Add New Bank Account</p>
                <p className="text-xs text-muted-foreground mt-1">For Withdrawals</p>
              </Card>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports" className="mt-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Transaction Reports</h2>
            <p className="text-muted-foreground mb-6">
              Download or view your transaction reports for record keeping and tax purposes.
            </p>
            
            <div className="space-y-4">
              <div className="p-4 border rounded-md flex justify-between items-center">
                <div>
                  <p className="font-medium">Monthly Statement</p>
                  <p className="text-sm text-muted-foreground">April 2025</p>
                </div>
                <div className="flex gap-2">
                  <button className="text-sm px-3 py-1 bg-muted rounded-md">View</button>
                  <button className="text-sm px-3 py-1 bg-primary text-white rounded-md">Download</button>
                </div>
              </div>
              
              <div className="p-4 border rounded-md flex justify-between items-center">
                <div>
                  <p className="font-medium">Monthly Statement</p>
                  <p className="text-sm text-muted-foreground">March 2025</p>
                </div>
                <div className="flex gap-2">
                  <button className="text-sm px-3 py-1 bg-muted rounded-md">View</button>
                  <button className="text-sm px-3 py-1 bg-primary text-white rounded-md">Download</button>
                </div>
              </div>
              
              <div className="p-4 border rounded-md flex justify-between items-center">
                <div>
                  <p className="font-medium">Monthly Statement</p>
                  <p className="text-sm text-muted-foreground">February 2025</p>
                </div>
                <div className="flex gap-2">
                  <button className="text-sm px-3 py-1 bg-muted rounded-md">View</button>
                  <button className="text-sm px-3 py-1 bg-primary text-white rounded-md">Download</button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WalletPage;
