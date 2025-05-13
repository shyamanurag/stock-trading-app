// src/components/admin/AdminRechargeInterface.jsx

import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { 
  Card, 
  Input, 
  Button, 
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui";
import { Search, Plus, ArrowUpCircle, ArrowDownCircle, Check, X } from 'lucide-react';

// Mock data for development
const mockPendingRecharges = [
  {
    id: '1',
    userId: 'USR123456',
    userName: 'Rahul Sharma',
    amount: 10000,
    requestedOn: new Date(2025, 4, 10).toISOString(),
    status: 'pending',
    method: 'bank_transfer',
    reference: 'NEFT123456789'
  },
  {
    id: '2',
    userId: 'USR789012',
    userName: 'Priya Singh',
    amount: 5000,
    requestedOn: new Date(2025, 4, 9).toISOString(),
    status: 'pending',
    method: 'upi',
    reference: 'UPI/123456789'
  },
  {
    id: '3',
    userId: 'USR345678',
    userName: 'Vikram Patel',
    amount: 25000,
    requestedOn: new Date(2025, 4, 8).toISOString(),
    status: 'pending',
    method: 'bank_transfer',
    reference: 'IMPS987654321'
  }
];

const mockRecentTransactions = [
  {
    id: '4',
    userId: 'USR567890',
    userName: 'Ananya Roy',
    amount: 15000,
    date: new Date(2025, 4, 7).toISOString(),
    status: 'completed',
    type: 'credit',
    method: 'manual',
    approvedBy: 'Admin'
  },
  {
    id: '5',
    userId: 'USR123456',
    userName: 'Rahul Sharma',
    amount: 8000,
    date: new Date(2025, 4, 6).toISOString(),
    status: 'completed',
    type: 'debit',
    method: 'manual',
    approvedBy: 'Admin'
  },
  {
    id: '6',
    userId: 'USR901234',
    userName: 'Deepak Verma',
    amount: 12000,
    date: new Date(2025, 4, 5).toISOString(),
    status: 'completed',
    type: 'credit',
    method: 'manual',
    approvedBy: 'Admin'
  }
];

// Mock function for development
const mockApproveRecharge = (rechargeId) => ({ 
  type: 'MOCK_APPROVE_RECHARGE', 
  payload: { rechargeId } 
});

const mockRejectRecharge = (rechargeId) => ({ 
  type: 'MOCK_REJECT_RECHARGE', 
  payload: { rechargeId } 
});

const mockAddFunds = (userData) => ({ 
  type: 'MOCK_ADD_FUNDS', 
  payload: userData 
});

const AdminRechargeInterface = () => {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingRecharges, setPendingRecharges] = useState(mockPendingRecharges);
  const [recentTransactions, setRecentTransactions] = useState(mockRecentTransactions);
  const [activeTab, setActiveTab] = useState('pending');
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserName, setSelectedUserName] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState('credit');
  const [remarks, setRemarks] = useState('');
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    // In a real app, this would filter data based on search query
  };
  
  const handleApproveRecharge = (rechargeId) => {
    dispatch(mockApproveRecharge(rechargeId));
    
    // For demo purposes, update the UI immediately
    setPendingRecharges(prevRecharges => 
      prevRecharges.filter(recharge => recharge.id !== rechargeId)
    );
    
    // Add to recent transactions
    const approved = pendingRecharges.find(recharge => recharge.id === rechargeId);
    if (approved) {
      const newTransaction = {
        id: `new-${approved.id}`,
        userId: approved.userId,
        userName: approved.userName,
        amount: approved.amount,
        date: new Date().toISOString(),
        status: 'completed',
        type: 'credit',
        method: 'manual',
        approvedBy: 'Admin'
      };
      
      setRecentTransactions(prev => [newTransaction, ...prev]);
    }
  };
  
  const handleRejectRecharge = (rechargeId) => {
    dispatch(mockRejectRecharge(rechargeId));
    
    // For demo purposes, update the UI immediately
    setPendingRecharges(prevRecharges => 
      prevRecharges.filter(recharge => recharge.id !== rechargeId)
    );
  };
  
  const handleAddFunds = () => {
    if (!selectedUserId || !amount || parseFloat(amount) <= 0) {
      return;
    }
    
    const userData = {
      userId: selectedUserId,
      userName: selectedUserName,
      amount: parseFloat(amount),
      type: transactionType,
      remarks
    };
    
    dispatch(mockAddFunds(userData));
    
    // For demo purposes, add to recent transactions
    const newTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      userId: selectedUserId,
      userName: selectedUserName,
      amount: parseFloat(amount),
      date: new Date().toISOString(),
      status: 'completed',
      type: transactionType,
      method: 'manual',
      approvedBy: 'Admin'
    };
    
    setRecentTransactions(prev => [newTransaction, ...prev]);
    
    // Reset form
    setSelectedUserId('');
    setSelectedUserName('');
    setAmount('');
    setTransactionType('credit');
    setRemarks('');
    setShowAddFundsModal(false);
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold mb-2 md:mb-0">Wallet Management</h1>
        
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search user or transaction ID"
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-9 w-full md:w-64"
            />
          </div>
          
          <Button onClick={() => setShowAddFundsModal(true)}>
            <Plus size={16} className="mr-2" />
            Add Funds
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending">Pending Requests</TabsTrigger>
          <TabsTrigger value="recent">Recent Transactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          {pendingRecharges.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 text-left">
                    <th className="p-3 font-medium">User</th>
                    <th className="p-3 font-medium">Amount</th>
                    <th className="p-3 font-medium">Method</th>
                    <th className="p-3 font-medium">Reference</th>
                    <th className="p-3 font-medium">Requested On</th>
                    <th className="p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRecharges.map((recharge) => (
                    <tr key={recharge.id} className="border-b hover:bg-muted/20">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{recharge.userName}</p>
                          <p className="text-xs text-muted-foreground">{recharge.userId}</p>
                        </div>
                      </td>
                      <td className="p-3 font-medium">₹{recharge.amount.toLocaleString()}</td>
                      <td className="p-3 capitalize">{recharge.method.replace('_', ' ')}</td>
                      <td className="p-3 text-sm">{recharge.reference}</td>
                      <td className="p-3 text-sm">{formatDate(recharge.requestedOn)}</td>
                      <td className="p-3">
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-green-500 text-green-500 hover:bg-green-50"
                            onClick={() => handleApproveRecharge(recharge.id)}
                          >
                            <Check size={14} className="mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-red-500 text-red-500 hover:bg-red-50"
                            onClick={() => handleRejectRecharge(recharge.id)}
                          >
                            <X size={14} className="mr-1" />
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">No pending recharge requests.</p>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="recent">
          {recentTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 text-left">
                    <th className="p-3 font-medium">User</th>
                    <th className="p-3 font-medium">Amount</th>
                    <th className="p-3 font-medium">Type</th>
                    <th className="p-3 font-medium">Method</th>
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-muted/20">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{transaction.userName}</p>
                          <p className="text-xs text-muted-foreground">{transaction.userId}</p>
                        </div>
                      </td>
                      <td className="p-3 font-medium">₹{transaction.amount.toLocaleString()}</td>
                      <td className="p-3">
                        <div className="flex items-center">
                          {transaction.type === 'credit' ? (
                            <span className="flex items-center text-green-600">
                              <ArrowDownCircle size={14} className="mr-1" />
                              Credit
                            </span>
                          ) : (
                            <span className="flex items-center text-red-600">
                              <ArrowUpCircle size={14} className="mr-1" />
                              Debit
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 capitalize">{transaction.method}</td>
                      <td className="p-3 text-sm">{formatDate(transaction.date)}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">No recent transactions.</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Add Funds Modal */}
      {showAddFundsModal && (
        <Dialog open={true} onOpenChange={() => setShowAddFundsModal(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add/Remove Funds</DialogTitle>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <div>
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  placeholder="Enter user ID"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="userName">User Name</Label>
                <Input
                  id="userName"
                  placeholder="Enter user name"
                  value={selectedUserName}
                  onChange={(e) => setSelectedUserName(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="transactionType">Transaction Type</Label>
                <Select value={transactionType} onValueChange={setTransactionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select transaction type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Credit (Add Funds)</SelectItem>
                    <SelectItem value="debit">Debit (Remove Funds)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="remarks">Remarks</Label>
                <Input
                  id="remarks"
                  placeholder="Enter remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddFundsModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddFunds} disabled={!selectedUserId || !amount || parseFloat(amount) <= 0}>
                {transactionType === 'credit' ? 'Add Funds' : 'Remove Funds'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminRechargeInterface;
