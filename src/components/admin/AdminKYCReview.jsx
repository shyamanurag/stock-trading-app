// src/components/admin/AdminKYCReview.jsx

import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { 
  Card, 
  Button, 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent,
  Input,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui";
import { Search, CheckCircle, XCircle, Eye, Clock, Filter } from 'lucide-react';

// Mock data for development
const mockPendingKYC = [
  {
    id: '1',
    userId: 'USR123456',
    userName: 'Rahul Sharma',
    documentType: 'aadhar',
    documentNumber: '1234 5678 9012',
    submittedOn: new Date(2025, 4, 10).toISOString(),
    frontImage: 'https://placehold.co/400x300/png',
    backImage: 'https://placehold.co/400x300/png',
    selfieImage: 'https://placehold.co/400x300/png'
  },
  {
    id: '2',
    userId: 'USR789012',
    userName: 'Priya Singh',
    documentType: 'pan',
    documentNumber: 'ABCDE1234F',
    submittedOn: new Date(2025, 4, 9).toISOString(),
    frontImage: 'https://placehold.co/400x300/png',
    backImage: null,
    selfieImage: 'https://placehold.co/400x300/png'
  },
  {
    id: '3',
    userId: 'USR345678',
    userName: 'Vikram Patel',
    documentType: 'passport',
    documentNumber: 'J1234567',
    submittedOn: new Date(2025, 4, 8).toISOString(),
    frontImage: 'https://placehold.co/400x300/png',
    backImage: 'https://placehold.co/400x300/png',
    selfieImage: 'https://placehold.co/400x300/png'
  }
];

const mockRecentKYC = [
  {
    id: '4',
    userId: 'USR567890',
    userName: 'Ananya Roy',
    documentType: 'aadhar',
    documentNumber: '9876 5432 1098',
    reviewedOn: new Date(2025, 4, 7).toISOString(),
    status: 'approved',
    reviewedBy: 'Admin'
  },
  {
    id: '5',
    userId: 'USR123456',
    userName: 'Rahul Sharma',
    documentType: 'voter',
    documentNumber: 'ABC1234567',
    reviewedOn: new Date(2025, 4, 6).toISOString(),
    status: 'rejected',
    reviewedBy: 'Admin',
    rejectionReason: 'Document unclear, please resubmit with better quality'
  },
  {
    id: '6',
    userId: 'USR901234',
    userName: 'Deepak Verma',
    documentType: 'driving',
    documentNumber: 'DL-1420110123456',
    reviewedOn: new Date(2025, 4, 5).toISOString(),
    status: 'approved',
    reviewedBy: 'Admin'
  }
];

// Mock functions for development
const mockApproveKYC = (kycId) => ({ 
  type: 'MOCK_APPROVE_KYC', 
  payload: { kycId } 
});

const mockRejectKYC = (kycId, reason) => ({ 
  type: 'MOCK_REJECT_KYC', 
  payload: { kycId, reason } 
});

const AdminKYCReview = () => {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingKYC, setPendingKYC] = useState(mockPendingKYC);
  const [recentKYC, setRecentKYC] = useState(mockRecentKYC);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedKYC, setSelectedKYC] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filter, setFilter] = useState('all');
  
  // Handle search
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    // In a real app, this would filter data based on search query
  };
  
  // Open review modal
  const handleOpenReview = (kyc) => {
    setSelectedKYC(kyc);
    setShowReviewModal(true);
  };
  
  // Close review modal
  const handleCloseReview = () => {
    setSelectedKYC(null);
    setShowReviewModal(false);
    setRejectionReason('');
  };
  
  // Handle approval
  const handleApprove = () => {
    if (!selectedKYC) return;
    
    dispatch(mockApproveKYC(selectedKYC.id));
    
    // For demo purposes, update the UI immediately
    setPendingKYC(prevKYC => 
      prevKYC.filter(kyc => kyc.id !== selectedKYC.id)
    );
    
    // Add to recent KYC with approved status
    const approved = {
      id: selectedKYC.id,
      userId: selectedKYC.userId,
      userName: selectedKYC.userName,
      documentType: selectedKYC.documentType,
      documentNumber: selectedKYC.documentNumber,
      reviewedOn: new Date().toISOString(),
      status: 'approved',
      reviewedBy: 'Admin'
    };
    
    setRecentKYC(prev => [approved, ...prev]);
    handleCloseReview();
  };
  
  // Handle rejection
  const handleReject = () => {
    if (!selectedKYC || !rejectionReason) return;
    
    dispatch(mockRejectKYC(selectedKYC.id, rejectionReason));
    
    // For demo purposes, update the UI immediately
    setPendingKYC(prevKYC => 
      prevKYC.filter(kyc => kyc.id !== selectedKYC.id)
    );
    
    // Add to recent KYC with rejected status
    const rejected = {
      id: selectedKYC.id,
      userId: selectedKYC.userId,
      userName: selectedKYC.userName,
      documentType: selectedKYC.documentType,
      documentNumber: selectedKYC.documentNumber,
      reviewedOn: new Date().toISOString(),
      status: 'rejected',
      reviewedBy: 'Admin',
      rejectionReason
    };
    
    setRecentKYC(prev => [rejected, ...prev]);
    handleCloseReview();
  };
  
  // Format date
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
  
  // Filter recent KYC by status
  const filteredRecentKYC = recentKYC.filter(kyc => {
    if (filter === 'all') return true;
    return kyc.status === filter;
  });
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold mb-2 md:mb-0">KYC Verification</h1>
        
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search user or document ID"
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-9 w-full md:w-64"
            />
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending">Pending Verification ({pendingKYC.length})</TabsTrigger>
          <TabsTrigger value="recent">Recent Verifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          {pendingKYC.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 text-left">
                    <th className="p-3 font-medium">User</th>
                    <th className="p-3 font-medium">Document</th>
                    <th className="p-3 font-medium">Submitted On</th>
                    <th className="p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingKYC.map((kyc) => (
                    <tr key={kyc.id} className="border-b hover:bg-muted/20">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{kyc.userName}</p>
                          <p className="text-xs text-muted-foreground">{kyc.userId}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="capitalize">{kyc.documentType.replace('_', ' ')}</p>
                          <p className="text-xs text-muted-foreground">{kyc.documentNumber}</p>
                        </div>
                      </td>
                      <td className="p-3 text-sm">{formatDate(kyc.submittedOn)}</td>
                      <td className="p-3">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleOpenReview(kyc)}
                        >
                          <Eye size={14} className="mr-1" />
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">No pending KYC verification requests.</p>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="recent">
          <div className="flex justify-end mb-4">
            <div className="flex items-center space-x-2">
              <Filter size={14} className="text-muted-foreground" />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {filteredRecentKYC.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 text-left">
                    <th className="p-3 font-medium">User</th>
                    <th className="p-3 font-medium">Document</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Reviewed On</th>
                    <th className="p-3 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecentKYC.map((kyc) => (
                    <tr key={kyc.id} className="border-b hover:bg-muted/20">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{kyc.userName}</p>
                          <p className="text-xs text-muted-foreground">{kyc.userId}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="capitalize">{kyc.documentType.replace('_', ' ')}</p>
                          <p className="text-xs text-muted-foreground">{kyc.documentNumber}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        {kyc.status === 'approved' ? (
                          <span className="flex items-center text-green-600">
                            <CheckCircle size={14} className="mr-1" />
                            Approved
                          </span>
                        ) : (
                          <span className="flex items-center text-red-600">
                            <XCircle size={14} className="mr-1" />
                            Rejected
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-sm">{formatDate(kyc.reviewedOn)}</td>
                      <td className="p-3">
                        {kyc.status === 'rejected' && kyc.rejectionReason && (
                          <div className="text-xs text-muted-foreground max-w-xs truncate">
                            Reason: {kyc.rejectionReason}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">No recent KYC verifications found.</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Review Modal */}
      {showReviewModal && selectedKYC && (
        <Dialog open={true} onOpenChange={handleCloseReview}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Review KYC Documents</DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">User Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{selectedKYC.userName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">User ID:</span>
                      <span className="font-medium">{selectedKYC.userId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Document Type:</span>
                      <span className="font-medium capitalize">{selectedKYC.documentType.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Document Number:</span>
                      <span className="font-medium">{selectedKYC.documentNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Submitted On:</span>
                      <span className="font-medium">{formatDate(selectedKYC.submittedOn)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Verification Decision</h3>
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <Button 
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={handleApprove}
                      >
                        <CheckCircle size={16} className="mr-2" />
                        Approve
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 border-red-500 text-red-500 hover:bg-red-50"
                        disabled={!rejectionReason}
                        onClick={handleReject}
                      >
                        <XCircle size={16} className="mr-2" />
                        Reject
                      </Button>
                    </div>
                    
                    <div>
                      <Label htmlFor="rejection-reason">Rejection Reason (required for rejection)</Label>
                      <Textarea
                        id="rejection-reason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Explain why the KYC verification is being rejected..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-4">Document Images</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Front Side</p>
                    <img 
                      src={selectedKYC.frontImage} 
                      alt="Front Document" 
                      className="w-full h-auto border rounded"
                    />
                  </div>
                  
                  {selectedKYC.backImage && (
                    <div>
                      <p className="text-sm font-medium mb-2">Back Side</p>
                      <img 
                        src={selectedKYC.backImage} 
                        alt="Back Document" 
                        className="w-full h-auto border rounded"
                      />
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Selfie</p>
                    <img 
                      src={selectedKYC.selfieImage} 
                      alt="Selfie" 
                      className="w-full h-auto border rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseReview}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminKYCReview;
