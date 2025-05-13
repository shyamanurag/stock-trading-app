// src/pages/admin/AdminWalletPage.jsx

import React from 'react';
import AdminRechargeInterface from '../../components/admin/AdminRechargeInterface';

const AdminWalletPage = () => {
  return <AdminRechargeInterface />;
};

export default AdminWalletPage;
// src/pages/admin/AdminWalletPage.jsx - Enhanced Version (continued)

                          <p className="text-sm mt-1">{selectedRecharge.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    <Button 
                      onClick={() => handleApproveRecharge(selectedRecharge.id)}
                      disabled={isProcessing}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 size={16} className="mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} className="mr-2" />
                          Approve Recharge
                        </>
                      )}
                    </Button>
                    
                    <div>
                      <Label htmlFor="rejection-reason">Rejection Reason (Required for rejection)</Label>
                      <Textarea
                        id="rejection-reason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Explain why the recharge is being rejected..."
                        className="mt-1"
                      />
                      <Button 
                        onClick={() => handleRejectRecharge(selectedRecharge.id)}
                        disabled={isProcessing || !rejectionReason}
                        className="w-full mt-2 bg-red-600 hover:bg-red-700"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 size={16} className="mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <XCircle size={16} className="mr-2" />
                            Reject Recharge
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Payment Receipt</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <img 
                      src={selectedRecharge.receipt} 
                      alt="Payment Receipt" 
                      className="w-full h-auto"
                    />
                  </div>
                  
                  <div className="flex justify-center mt-4 space-x-2">
                    <Button variant="outline" size="sm">
                      <Download size={14} className="mr-1" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm">
                      <Printer size={14} className="mr-1" />
                      Print
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink size={14} className="mr-1" />
                      View Full Size
                    </Button>
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                      <AlertTriangle size={16} className="mr-2" />
                      Verification Checklist
                    </h4>
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li className="flex items-start">
                        <div className="flex h-5 items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </div>
                        <div className="ml-2">Amount matches requested amount</div>
                      </li>
                      <li className="flex items-start">
                        <div className="flex h-5 items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </div>
                        <div className="ml-2">Transaction date is recent (within last 48 hours)</div>
                      </li>
                      <li className="flex items-start">
                        <div className="flex h-5 items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </div>
                        <div className="ml-2">Receipt appears genuine with no signs of tampering</div>
                      </li>
                      <li className="flex items-start">
                        <div className="flex h-5 items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </div>
                        <div className="ml-2">Payment method details match the provided information</div>
                      </li>
                      <li className="flex items-start">
                        <div className="flex h-5 items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </div>
                        <div className="ml-2">Reference number matches with the one provided</div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReceiptModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Transaction Details Modal */}
      {showTransactionDetailsModal && selectedTransaction && (
        <Dialog open={true} onOpenChange={() => setShowTransactionDetailsModal(false)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <div className="flex justify-center mb-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  selectedTransaction.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {selectedTransaction.type === 'credit' ? <ArrowDownCircle size={32} /> : <ArrowUpCircle size={32} />}
                </div>
              </div>
              
              <div className="text-center mb-6">
                <h2 className={`text-2xl font-bold ${
                  selectedTransaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {selectedTransaction.type === 'credit' ? '+' : '-'}{formatCurrency(selectedTransaction.amount)}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {formatDate(selectedTransaction.date)}
                </p>
                <div className="mt-2">
                  {selectedTransaction.status === 'completed' ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle size={12} className="mr-1" />
                      Completed
                    </Badge>
                  ) : selectedTransaction.status === 'rejected' ? (
                    <Badge className="bg-red-100 text-red-800">
                      <XCircle size={12} className="mr-1" />
                      Rejected
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Clock size={12} className="mr-1" />
                      Pending
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-muted/20 p-4 rounded-lg">
                  <h3 className="font-medium mb-3">Transaction Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transaction ID:</span>
                      <span className="font-medium">{selectedTransaction.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reference:</span>
                      <span className="font-medium">{selectedTransaction.reference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Method:</span>
                      <span className="font-medium capitalize">{selectedTransaction.method.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium capitalize">{selectedTransaction.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">{formatDate(selectedTransaction.date)}</span>
                    </div>
                    {selectedTransaction.approvedBy && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Approved By:</span>
                        <span className="font-medium">{selectedTransaction.approvedBy}</span>
                      </div>
                    )}
                    {selectedTransaction.rejectedBy && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rejected By:</span>
                        <span className="font-medium">{selectedTransaction.rejectedBy}</span>
                      </div>
                    )}
                    {selectedTransaction.rejectionReason && (
                      <div className="pt-2 border-t mt-2">
                        <span className="text-muted-foreground">Rejection Reason:</span>
                        <p className="text-sm mt-1">{selectedTransaction.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-muted/20 p-4 rounded-lg">
                  <h3 className="font-medium mb-3">User Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{selectedTransaction.userName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">User ID:</span>
                      <span className="font-medium">{selectedTransaction.userId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{selectedTransaction.email}</span>
                    </div>
                    {selectedTransaction.phone && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="font-medium">{selectedTransaction.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center space-x-2 mt-6">
                <Button variant="outline" size="sm">
                  <Printer size={14} className="mr-1" />
                  Print Receipt
                </Button>
                <Button variant="outline" size="sm">
                  <Download size={14} className="mr-1" />
                  Download
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleViewUser(selectedTransaction.userId)}>
                  <User size={14} className="mr-1" />
                  View User
                </Button>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTransactionDetailsModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* User Details Modal */}
      {showUserDetailsModal && selectedUser && (
        <Dialog open={true} onOpenChange={() => setShowUserDetailsModal(false)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mr-3 text-primary text-2xl">
                      {selectedUser.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{selectedUser.name}</h2>
                      <p className="text-sm text-muted-foreground">User ID: {selectedUser.id}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedUser.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">KYC Status</p>
                      <p className="font-medium capitalize">{selectedUser.kycStatus}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Account Status</p>
                      <p className="font-medium capitalize">{selectedUser.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Joined On</p>
                      <p className="font-medium">{formatDate(selectedUser.joinedOn)}</p>
                    </div>
                  </div>
                  
                  <div className="bg-muted/20 p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">Wallet Balance</p>
                    <p className="text-xl font-bold">{formatCurrency(selectedUser.balance)}</p>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        setShowUserDetailsModal(false);
                        setUserId(selectedUser.id);
                        setUserName(selectedUser.name);
                        setShowAddFundsModal(true);
                      }}
                    >
                      <Plus size={16} className="mr-2" />
                      Add/Remove Funds
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Mail size={16} className="mr-2" />
                      Contact User
                    </Button>
                  </div>
                </div>
                
                <div className="md:w-2/3">
                  <Tabs defaultValue="transactions">
                    <TabsList className="w-full mb-4">
                      <TabsTrigger value="transactions" className="flex-1">Transaction History</TabsTrigger>
                      <TabsTrigger value="statistics" className="flex-1">Statistics</TabsTrigger>
                      <TabsTrigger value="settings" className="flex-1">Account Settings</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="transactions">
                      <h3 className="text-lg font-medium mb-3">Recent Transactions</h3>
                      {selectedUser.recentTransactions && selectedUser.recentTransactions.length > 0 ? (
                        <div className="space-y-3">
                          {selectedUser.recentTransactions.map((transaction) => (
                            <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/20">
                              <div className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                                  transaction.type === 'deposit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                }`}>
                                  {transaction.type === 'deposit' ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
                                </div>
                                <div>
                                  <p className="font-medium capitalize">{transaction.type}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(transaction.date)} • {transaction.method.replace('_', ' ')}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`font-medium ${
                                  transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                </p>
                                <p className="text-xs">
                                  {transaction.status === 'completed' ? (
                                    <span className="text-green-600">Completed</span>
                                  ) : transaction.status === 'rejected' ? (
                                    <span className="text-red-600">Rejected</span>
                                  ) : (
                                    <span className="text-yellow-600">Pending</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground border rounded-md">
                          No recent transactions found
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="statistics">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium mb-3">Transaction Summary</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card className="p-3">
                              <p className="text-sm text-muted-foreground">Total Transactions</p>
                              <p className="text-xl font-bold">{selectedUser.totalTransactions}</p>
                            </Card>
                            <Card className="p-3">
                              <p className="text-sm text-muted-foreground">Monthly Avg Volume</p>
                              <p className="text-xl font-bold">{formatCurrency(selectedUser.monthlyAvgVolume)}</p>
                            </Card>
                            <Card className="p-3">
                              <p className="text-sm text-muted-foreground">Last Transaction</p>
                              <p className="text-lg font-medium">
                                {selectedUser.recentTransactions && selectedUser.recentTransactions.length > 0
                                  ? formatDate(selectedUser.recentTransactions[0].date).split(',')[0]
                                  : 'N/A'
                                }
                              </p>
                            </Card>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-medium mb-3">Transaction Patterns</h3>
                          <Card className="p-4">
                            <div className="text-center text-muted-foreground py-12">
                              Transaction chart will be implemented in the next phase
                            </div>
                          </Card>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="settings">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-md">
                          <div>
                            <p className="font-medium">Account Status</p>
                            <p className="text-sm text-muted-foreground">Enable or disable user account</p>
                          </div>
                          <Switch checked={selectedUser.status === 'active'} />
                        </div>
                        
                        <div className="flex items-center justify-between p-4 border rounded-md">
                          <div>
                            <p className="font-medium">KYC Verification</p>
                            <p className="text-sm text-muted-foreground">Override KYC verification status</p>
                          </div>
                          <Select defaultValue={selectedUser.kycStatus}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="verified">Verified</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 border rounded-md">
                          <div>
                            <p className="font-medium">Transaction Limits</p>
                            <p className="text-sm text-muted-foreground">Set daily transaction limits</p>
                          </div>
                          <Input type="number" className="w-32" defaultValue="50000" />
                        </div>
                        
                        <div className="flex items-center justify-between p-4 border rounded-md">
                          <div>
                            <p className="font-medium">Enhanced Monitoring</p>
                            <p className="text-sm text-muted-foreground">Flag account for enhanced transaction monitoring</p>
                          </div>
                          <Switch />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUserDetailsModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminWalletPage;
