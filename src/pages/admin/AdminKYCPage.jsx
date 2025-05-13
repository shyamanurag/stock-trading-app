// src/pages/admin/AdminKYCPage.jsx - Enhanced Version

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Card, 
  Button, 
  Input, 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Label,
  Textarea,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Progress,
  RadioGroup,
  RadioGroupItem
} from "@/components/ui";
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Download, 
  Printer, 
  MoreHorizontal, 
  AlertTriangle,
  Calendar,
  UserCheck,
  FileText,
  ExternalLink,
  Loader2
} from 'lucide-react';

// Mock API service for development
const mockKYCService = {
  getPendingKYC: () => 
    new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockPendingKYC);
      }, 500);
    }),
  
  getRecentKYC: () => 
    new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockRecentKYC);
      }, 500);
    }),
  
  getKYCDetails: (id) => 
    new Promise((resolve) => {
      setTimeout(() => {
        const kyc = [...mockPendingKYC, ...mockRecentKYC].find(k => k.id === id);
        resolve(kyc);
      }, 500);
    }),
  
  approveKYC: (id, notes) => 
    new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: 'KYC approved successfully' });
      }, 1000);
    }),
  
  rejectKYC: (id, reason) => 
    new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: 'KYC rejected successfully' });
      }, 1000);
    }),
  
  requestAdditionalDocuments: (id, documents, message) => 
    new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: 'Additional documents requested successfully' });
      }, 1000);
    })
};

// Mock data for development
const mockPendingKYC = [
  {
    id: '1',
    userId: 'USR123456',
    userName: 'Rahul Sharma',
    email: 'rahul@example.com',
    phone: '+91 98765 43210',
    documentType: 'aadhar',
    documentNumber: '1234 5678 9012',
    submittedOn: new Date(2025, 4, 10).toISOString(),
    status: 'pending',
    priority: 'high',
    frontImage: 'https://placehold.co/400x300/png',
    backImage: 'https://placehold.co/400x300/png',
    selfieImage: 'https://placehold.co/400x300/png',
    attempts: 1
  },
  {
    id: '2',
    userId: 'USR789012',
    userName: 'Priya Singh',
    email: 'priya@example.com',
    phone: '+91 87654 32109',
    documentType: 'pan',
    documentNumber: 'ABCDE1234F',
    submittedOn: new Date(2025, 4, 9).toISOString(),
    status: 'pending',
    priority: 'normal',
    frontImage: 'https://placehold.co/400x300/png',
    backImage: null,
    selfieImage: 'https://placehold.co/400x300/png',
    attempts: 1
  },
  {
    id: '3',
    userId: 'USR345678',
    userName: 'Vikram Patel',
    email: 'vikram@example.com',
    phone: '+91 76543 21098',
    documentType: 'passport',
    documentNumber: 'J1234567',
    submittedOn: new Date(2025, 4, 8).toISOString(),
    status: 'pending',
    priority: 'high',
    frontImage: 'https://placehold.co/400x300/png',
    backImage: 'https://placehold.co/400x300/png',
    selfieImage: 'https://placehold.co/400x300/png',
    attempts: 2,
    previousRejectionReason: 'Document image unclear'
  },
  {
    id: '4',
    userId: 'USR567890',
    userName: 'Ananya Roy',
    email: 'ananya@example.com',
    phone: '+91 65432 10987',
    documentType: 'aadhar',
    documentNumber: '9876 5432 1098',
    submittedOn: new Date(2025, 4, 7).toISOString(),
    status: 'additional_documents_requested',
    priority: 'normal',
    frontImage: 'https://placehold.co/400x300/png',
    backImage: 'https://placehold.co/400x300/png',
    selfieImage: 'https://placehold.co/400x300/png',
    attempts: 2,
    additionalDocumentsRequested: ['Address Proof', 'Income Proof'],
    requestMessage: 'Please provide utility bill as address proof and latest salary slip as income proof'
  }
];

const mockRecentKYC = [
  {
    id: '5',
    userId: 'USR901234',
    userName: 'Deepak Verma',
    email: 'deepak@example.com',
    phone: '+91 54321 09876',
    documentType: 'driving',
    documentNumber: 'DL-1420110123456',
    submittedOn: new Date(2025, 4, 5).toISOString(),
    reviewedOn: new Date(2025, 4, 6).toISOString(),
    status: 'approved',
    reviewedBy: 'Admin',
    frontImage: 'https://placehold.co/400x300/png',
    backImage: 'https://placehold.co/400x300/png',
    selfieImage: 'https://placehold.co/400x300/png',
    attempts: 1,
    notes: 'All documents verified successfully'
  },
  {
    id: '6',
    userId: 'USR123789',
    userName: 'Sanjay Kumar',
    email: 'sanjay@example.com',
    phone: '+91 43210 98765',
    documentType: 'aadhar',
    documentNumber: '4567 8901 2345',
    submittedOn: new Date(2025, 4, 3).toISOString(),
    reviewedOn: new Date(2025, 4, 4).toISOString(),
    status: 'rejected',
    reviewedBy: 'Admin',
    frontImage: 'https://placehold.co/400x300/png',
    backImage: 'https://placehold.co/400x300/png',
    selfieImage: 'https://placehold.co/400x300/png',
    attempts: 1,
    rejectionReason: 'Document details do not match with user information'
  },
  {
    id: '7',
    userId: 'USR456123',
    userName: 'Neha Gupta',
    email: 'neha@example.com',
    phone: '+91 32109 87654',
    documentType: 'pan',
    documentNumber: 'FGHIJ5678K',
    submittedOn: new Date(2025, 4, 1).toISOString(),
    reviewedOn: new Date(2025, 4, 2).toISOString(),
    status: 'approved',
    reviewedBy: 'Admin',
    frontImage: 'https://placehold.co/400x300/png',
    backImage: null,
    selfieImage: 'https://placehold.co/400x300/png',
    attempts: 2,
    previousRejectionReason: 'Selfie does not match with document photo',
    notes: 'Resubmitted with clear selfie, all documents verified'
  }
];

const AdminKYCPage = () => {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingKYC, setPendingKYC] = useState([]);
  const [recentKYC, setRecentKYC] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedKYC, setSelectedKYC] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showAdditionalDocModal, setShowAdditionalDocModal] = useState(false);
  const [additionalDocs, setAdditionalDocs] = useState([]);
  const [additionalMessage, setAdditionalMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch KYC data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [pendingData, recentData] = await Promise.all([
          mockKYCService.getPendingKYC(),
          mockKYCService.getRecentKYC()
        ]);
        setPendingKYC(pendingData);
        setRecentKYC(recentData);
      } catch (error) {
        console.error('Error fetching KYC data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Handle search
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Filter KYC applications
  const filterKYC = (data) => {
    if (!data) return [];
    
    return data.filter(kyc => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === '' || 
        kyc.userName.toLowerCase().includes(searchLower) || 
        kyc.userId.toLowerCase().includes(searchLower) || 
        kyc.documentNumber.toLowerCase().includes(searchLower) ||
        kyc.email?.toLowerCase().includes(searchLower) ||
        kyc.phone?.toLowerCase().includes(searchLower);
      
      // Status filter
      const matchesStatus = filter === 'all' || kyc.status === filter;
      
      // Date filter
      let matchesDate = true;
      if (dateFilter === 'today') {
        const today = new Date();
        const submittedDate = new Date(kyc.submittedOn);
        matchesDate = submittedDate.toDateString() === today.toDateString();
      } else if (dateFilter === 'week') {
        const now = new Date();
        const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
        const submittedDate = new Date(kyc.submittedOn);
        matchesDate = submittedDate >= oneWeekAgo;
      }
      
      // Priority filter
      const matchesPriority = priorityFilter === 'all' || kyc.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesDate && matchesPriority;
    });
  };
  
  // Sort KYC applications
  const sortKYC = (data) => {
    if (!data) return [];
    
    return [...data].sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.submittedOn) - new Date(a.submittedOn);
      } else if (sortBy === 'priority') {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        return priorityOrder[a.priority || 'normal'] - priorityOrder[b.priority || 'normal'];
      } else if (sortBy === 'attempts') {
        return (b.attempts || 1) - (a.attempts || 1);
      } else if (sortBy === 'name') {
        return a.userName.localeCompare(b.userName);
      }
      return 0;
    });
  };
  
  const filteredPendingKYC = sortKYC(filterKYC(pendingKYC));
  const filteredRecentKYC = sortKYC(filterKYC(recentKYC));
  
  // View KYC details
  const handleViewKYC = async (kyc) => {
    setIsProcessing(true);
    try {
      // In a real application, you would fetch complete details from the API
      const kycDetails = await mockKYCService.getKYCDetails(kyc.id);
      setSelectedKYC(kycDetails);
      setReviewAction('approve');
      setRejectionReason('');
      setReviewNotes('');
      setShowReviewModal(true);
    } catch (error) {
      console.error('Error fetching KYC details:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Open additional documents modal
  const handleRequestAdditional = () => {
    setAdditionalDocs([]);
    setAdditionalMessage('');
    setShowReviewModal(false);
    setShowAdditionalDocModal(true);
  };
  
  // Handle approve KYC
  const handleApprove = async () => {
    if (!selectedKYC) return;
    
    setIsProcessing(true);
    try {
      await mockKYCService.approveKYC(selectedKYC.id, reviewNotes);
      
      // Update UI
      setPendingKYC(prevKYC => 
        prevKYC.filter(kyc => kyc.id !== selectedKYC.id)
      );
      
      // Add to recent KYC
      const approved = {
        ...selectedKYC,
        status: 'approved',
        reviewedOn: new Date().toISOString(),
        reviewedBy: 'Admin',
        notes: reviewNotes
      };
      
      setRecentKYC(prev => [approved, ...prev]);
      setShowReviewModal(false);
    } catch (error) {
      console.error('Error approving KYC:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle reject KYC
  const handleReject = async () => {
    if (!selectedKYC || !rejectionReason) return;
    
    setIsProcessing(true);
    try {
      await mockKYCService.rejectKYC(selectedKYC.id, rejectionReason);
      
      // Update UI
      setPendingKYC(prevKYC => 
        prevKYC.filter(kyc => kyc.id !== selectedKYC.id)
      );
      
      // Add to recent KYC
      const rejected = {
        ...selectedKYC,
        status: 'rejected',
        reviewedOn: new Date().toISOString(),
        reviewedBy: 'Admin',
        rejectionReason
      };
      
      setRecentKYC(prev => [rejected, ...prev]);
      setShowReviewModal(false);
    } catch (error) {
      console.error('Error rejecting KYC:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle request additional documents
  const handleSubmitAdditionalRequest = async () => {
    if (!selectedKYC || additionalDocs.length === 0 || !additionalMessage) return;
    
    setIsProcessing(true);
    try {
      await mockKYCService.requestAdditionalDocuments(selectedKYC.id, additionalDocs, additionalMessage);
      
      // Update UI
      setPendingKYC(prevKYC => 
        prevKYC.map(kyc => 
          kyc.id === selectedKYC.id 
            ? {
                ...kyc,
                status: 'additional_documents_requested',
                additionalDocumentsRequested: additionalDocs,
                requestMessage: additionalMessage
              } 
            : kyc
        )
      );
      
      setShowAdditionalDocModal(false);
    } catch (error) {
      console.error('Error requesting additional documents:', error);
    } finally {
      setIsProcessing(false);
    }
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
  
  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock size={14} className="mr-1" /> },
      'approved': { color: 'bg-green-100 text-green-800', icon: <CheckCircle size={14} className="mr-1" /> },
      'rejected': { color: 'bg-red-100 text-red-800', icon: <XCircle size={14} className="mr-1" /> },
      'additional_documents_requested': { color: 'bg-blue-100 text-blue-800', icon: <FileText size={14} className="mr-1" /> }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const displayText = status === 'additional_documents_requested' ? 'Docs Requested' : status.charAt(0).toUpperCase() + status.slice(1);
    
    return (
      <Badge variant="outline" className={`flex items-center ${config.color}`}>
        {config.icon}
        {displayText}
      </Badge>
    );
  };
  
  // Priority badge component
  const PriorityBadge = ({ priority }) => {
    const priorityConfig = {
      'high': { color: 'bg-red-100 text-red-800' },
      'normal': { color: 'bg-blue-100 text-blue-800' },
      'low': { color: 'bg-gray-100 text-gray-800' }
    };
    
    const config = priorityConfig[priority] || priorityConfig.normal;
    
    return (
      <Badge variant="outline" className={`${config.color}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">KYC Verification Management</h1>
          <p className="text-muted-foreground">Review and approve KYC applications</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name, ID, or document"
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-9 w-full md:w-64"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-1">
                <Filter size={16} />
                <span className="hidden md:inline">Filters</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-2">
                <Label className="text-xs">Status</Label>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="mt-1 mb-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="additional_documents_requested">Docs Requested</SelectItem>
                  </SelectContent>
                </Select>
                
                <Label className="text-xs">Time Period</Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="mt-1 mb-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                  </SelectContent>
                </Select>
                
                <Label className="text-xs">Priority</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="mt-1 mb-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                
                <Label className="text-xs">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date (Newest First)</SelectItem>
                    <SelectItem value="priority">Priority (Highest First)</SelectItem>
                    <SelectItem value="attempts">Attempts (Most First)</SelectItem>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="bg-muted/20 p-4 rounded-lg mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Pending</h3>
          <p className="text-2xl font-bold">{pendingKYC.filter(k => k.status === 'pending').length}</p>
          <div className="mt-2">
            <Progress value={
              (pendingKYC.filter(k => k.status === 'pending').length / 
               (pendingKYC.length || 1)) * 100
            } className="h-2" />
          </div>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Docs Requested</h3>
          <p className="text-2xl font-bold">{pendingKYC.filter(k => k.status === 'additional_documents_requested').length}</p>
          <div className="mt-2">
            <Progress value={
              (pendingKYC.filter(k => k.status === 'additional_documents_requested').length / 
               (pendingKYC.length || 1)) * 100
            } className="h-2" />
          </div>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Approved (Last 7 Days)</h3>
          <p className="text-2xl font-bold">{
            recentKYC.filter(k => 
              k.status === 'approved' && 
              new Date(k.reviewedOn) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            ).length
          }</p>
          <div className="mt-2 text-xs text-green-600">
            +{
              recentKYC.filter(k => 
                k.status === 'approved' && 
                new Date(k.reviewedOn) >= new Date(Date.now() - 24 * 60 * 60 * 1000)
              ).length
            } today
          </div>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Rejected (Last 7 Days)</h3>
          <p className="text-2xl font-bold">{
            recentKYC.filter(k => 
              k.status === 'rejected' && 
              new Date(k.reviewedOn) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            ).length
          }</p>
          <div className="mt-2 text-xs text-red-600">
            {
              recentKYC.filter(k => 
                k.status === 'rejected' && 
                new Date(k.reviewedOn) >= new Date(Date.now() - 24 * 60 * 60 * 1000)
              ).length
            } today
          </div>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="relative">
            Pending Review
            {pendingKYC.length > 0 && (
              <Badge className="ml-2 bg-primary text-white">{pendingKYC.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="recent">
            Recent Verifications
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading KYC applications...</span>
            </div>
          ) : filteredPendingKYC.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 text-left">
                    <th className="p-3 font-medium">User</th>
                    <th className="p-3 font-medium">Document</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Priority</th>
                    <th className="p-3 font-medium">Submitted</th>
                    <th className="p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPendingKYC.map((kyc) => (
                    <tr key={kyc.id} className="border-b hover:bg-muted/20">
                      <td className="p-3">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3 text-primary">
                            {kyc.userName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{kyc.userName}</p>
                            <div className="flex gap-2 items-center text-xs text-muted-foreground">
                              <span>{kyc.email}</span>
                              <span>•</span>
                              <span>{kyc.phone}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="capitalize">{kyc.documentType.replace('_', ' ')}</p>
                          <p className="text-xs text-muted-foreground">{kyc.documentNumber}</p>
                          {kyc.attempts > 1 && (
                            <Badge variant="outline" className="mt-1 bg-purple-100 text-purple-800">
                              Attempt {kyc.attempts}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <StatusBadge status={kyc.status} />
                        {kyc.status === 'additional_documents_requested' && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {kyc.additionalDocumentsRequested?.join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <PriorityBadge priority={kyc.priority || 'normal'} />
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="text-sm">{formatDate(kyc.submittedOn)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(kyc.submittedOn).toLocaleDateString() === new Date().toLocaleDateString() 
                              ? 'Today' 
                              : new Date(kyc.submittedOn).toLocaleDateString() === new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString()
                                ? 'Yesterday'
                                : new Date(kyc.submittedOn).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleViewKYC(kyc)}
                            disabled={isProcessing}
                          >
                            <Eye size={14} className="mr-1" />
                            Review
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="flex items-center" onClick={() => handleViewKYC(kyc)}>
                                <Eye size={14} className="mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem className="flex items-center">
                                <Calendar size={14} className="mr-2" />
                                View History
                              </DropdownMenuItem>
                              <DropdownMenuItem className="flex items-center">
                                <UserCheck size={14} className="mr-2" />
                                Match with Database
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="flex items-center">
                                <Download size={14} className="mr-2" />
                                Download Documents
                              </DropdownMenuItem>
                              <DropdownMenuItem className="flex items-center">
                                <Printer size={14} className="mr-2" />
                                Print Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center justify-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-1">No pending KYC applications</h3>
                <p className="text-muted-foreground mb-4">All KYC applications have been reviewed</p>
                <Button variant="outline" onClick={() => setFilter('all')}>
                  Clear Filters
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="recent">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading recent verifications...</span>
            </div>
          ) : filteredRecentKYC.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 text-left">
                    <th className="p-3 font-medium">User</th>
                    <th className="p-3 font-medium">Document</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Reviewed</th>
                    <th className="p-3 font-medium">Reviewed By</th>
                    <th className="p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecentKYC.map((kyc) => (
                    <tr key={kyc.id} className="border-b hover:bg-muted/20">
                      <td className="p-3">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3 text-primary">
                            {kyc.userName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{kyc.userName}</p>
                            <div className="flex gap-2 items-center text-xs text-muted-foreground">
                              <span>{kyc.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="capitalize">{kyc.documentType.replace('_', ' ')}</p>
                          <p className="text-xs text-muted-foreground">{kyc.documentNumber}</p>
                          {kyc.attempts > 1 && (
                            <Badge variant="outline" className="mt-1 bg-purple-100 text-purple-800">
                              Attempt {kyc.attempts}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <StatusBadge status={kyc.status} />
                        {kyc.status === 'rejected' && kyc.rejectionReason && (
                          <div className="mt-1 text-xs text-muted-foreground max-w-xs truncate">
                            Reason: {kyc.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="text-sm">{formatDate(kyc.reviewedOn)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(kyc.reviewedOn).toLocaleDateString() === new Date().toLocaleDateString() 
                              ? 'Today' 
                              : new Date(kyc.reviewedOn).toLocaleDateString() === new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString()
                                ? 'Yesterday'
                                : new Date(kyc.reviewedOn).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center mr-2 text-xs">
                            A
                          </div>
                          <span>{kyc.reviewedBy}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewKYC(kyc)}
                          >
                            <Eye size={14} className="mr-1" />
                            View
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="flex items-center" onClick={() => handleViewKYC(kyc)}>
                                <Eye size={14} className="mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem className="flex items-center">
                                <Calendar size={14} className="mr-2" />
                                View History
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="flex items-center">
                                <Download size={14} className="mr-2" />
                                Download Documents
                              </DropdownMenuItem>
                              <DropdownMenuItem className="flex items-center">
                                <Printer size={14} className="mr-2" />
                                Print Details
                              </DropdownMenuItem>
                              <DropdownMenuItem className="flex items-center">
                                <ExternalLink size={14} className="mr-2" />
                                Export to PDF
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center justify-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-1">No recent verifications found</h3>
                <p className="text-muted-foreground mb-4">Review some KYC applications to see them here</p>
                <Button variant="outline" onClick={() => setFilter('all')}>
                  Clear Filters
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Review Modal */}
      {showReviewModal && selectedKYC && (
        <Dialog open={true} onOpenChange={() => setShowReviewModal(false)}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span>Review KYC Documents</span>
                <StatusBadge status={selectedKYC.status} />
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="bg-muted/20 p-4 rounded-lg mb-4">
                    <h3 className="text-lg font-medium mb-3">User Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{selectedKYC.userName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">User ID:</span>
                        <span className="font-medium">{selectedKYC.userId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{selectedKYC.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="font-medium">{selectedKYC.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Document:</span>
                        <span className="font-medium capitalize">{selectedKYC.documentType.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Document No:</span>
                        <span className="font-medium">{selectedKYC.documentNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Submitted:</span>
                        <span className="font-medium">{formatDate(selectedKYC.submittedOn)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Attempts:</span>
                        <span className="font-medium">{selectedKYC.attempts || 1}</span>
                      </div>
                      {selectedKYC.previousRejectionReason && (
                        <div className="pt-2 border-t">
                          <span className="text-sm text-red-600">Previous Rejection: {selectedKYC.previousRejectionReason}</span>
                        </div>
                      )}
                    </div>
                    
                    {selectedKYC.status === 'rejected' && selectedKYC.rejectionReason && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
                        <p className="text-sm font-medium">Rejection Reason:</p>
                        <p className="text-sm mt-1">{selectedKYC.rejectionReason}</p>
                      </div>
                    )}
                    
                    {selectedKYC.status === 'approved' && selectedKYC.notes && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-800">
                        <p className="text-sm font-medium">Approval Notes:</p>
                        <p className="text-sm mt-1">{selectedKYC.notes}</p>
                      </div>
                    )}
                    
                    {selectedKYC.status === 'additional_documents_requested' && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800">
                        <p className="text-sm font-medium">Additional Documents Requested:</p>
                        <ul className="text-sm mt-1 list-disc list-inside">
                          {selectedKYC.additionalDocumentsRequested?.map((doc, idx) => (
                            <li key={idx}>{doc}</li>
                          ))}
                        </ul>
                        <p className="text-sm mt-2">{selectedKYC.requestMessage}</p>
                      </div>
                    )}
                  </div>
                  
                  {selectedKYC.status === 'pending' && (
                    <div>
                      <h3 className="text-lg font-medium mb-3">Verification Decision</h3>
                      <RadioGroup value={reviewAction} onValueChange={setReviewAction} className="mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <RadioGroupItem value="approve" id="approve" />
                          <Label htmlFor="approve" className="cursor-pointer">Approve Verification</Label>
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          <RadioGroupItem value="reject" id="reject" />
                          <Label htmlFor="reject" className="cursor-pointer">Reject Verification</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="additional" id="additional" />
                          <Label htmlFor="additional" className="cursor-pointer">Request Additional Documents</Label>
                        </div>
                      </RadioGroup>
                      
                      {reviewAction === 'approve' && (
                        <div className="mb-4">
                          <Label htmlFor="notes">Approval Notes (Optional)</Label>
                          <Textarea
                            id="notes"
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            placeholder="Add any notes about this verification..."
                            className="mt-1"
                          />
                          <Button 
                            onClick={handleApprove}
                            disabled={isProcessing}
                            className="w-full mt-4 bg-green-600 hover:bg-green-700"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 size={16} className="mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CheckCircle size={16} className="mr-2" />
                                Approve Verification
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                      
                      {reviewAction === 'reject' && (
                        <div className="mb-4">
                          <Label htmlFor="rejection-reason">Rejection Reason (Required)</Label>
                          <Textarea
                            id="rejection-reason"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Explain why the KYC verification is being rejected..."
                            className="mt-1"
                            required
                          />
                          <Button 
                            onClick={handleReject}
                            disabled={isProcessing || !rejectionReason}
                            className="w-full mt-4 bg-red-600 hover:bg-red-700"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 size={16} className="mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <XCircle size={16} className="mr-2" />
                                Reject Verification
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                      
                      {reviewAction === 'additional' && (
                        <div className="mb-4">
                          <Button 
                            onClick={handleRequestAdditional}
                            disabled={isProcessing}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            <FileText size={16} className="mr-2" />
                            Request Additional Documents
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <h3 className="text-lg font-medium mb-3">Document Images</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Front Side</p>
                      <div className="relative group">
                        <img 
                          src={selectedKYC.frontImage} 
                          alt="Front Document" 
                          className="w-full h-auto border rounded object-cover"
                        />
                        <div className="absolute inset-0 hidden group-hover:flex flex-col items-center justify-center bg-black/50 rounded transition duration-150">
                          <div className="flex space-x-2">
                            <Button size="sm" variant="secondary">
                              <Eye size={14} className="mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="secondary">
                              <Download size={14} className="mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {selectedKYC.backImage && (
                      <div>
                        <p className="text-sm font-medium mb-2">Back Side</p>
                        <div className="relative group">
                          <img 
                            src={selectedKYC.backImage} 
                            alt="Back Document" 
                            className="w-full h-auto border rounded object-cover"
                          />
                          <div className="absolute inset-0 hidden group-hover:flex flex-col items-center justify-center bg-black/50 rounded transition duration-150">
                            <div className="flex space-x-2">
                              <Button size="sm" variant="secondary">
                                <Eye size={14} className="mr-1" />
                                View
                              </Button>
                              <Button size="sm" variant="secondary">
                                <Download size={14} className="mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Selfie</p>
                      <div className="relative group">
                        <img 
                          src={selectedKYC.selfieImage} 
                          alt="Selfie" 
                          className="w-full h-auto border rounded object-cover"
                        />
                        <div className="absolute inset-0 hidden group-hover:flex flex-col items-center justify-center bg-black/50 rounded transition duration-150">
                          <div className="flex space-x-2">
                            <Button size="sm" variant="secondary">
                              <Eye size={14} className="mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="secondary">
                              <Download size={14} className="mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-3">Verification Checks</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="p-4">
                        <h4 className="font-medium mb-2">Photo Match</h4>
                        <div className="flex space-x-4">
                          <div className="w-20 h-20 rounded border">
                            <img 
                              src={selectedKYC.frontImage} 
                              alt="Document Photo" 
                              className="w-full h-full object-cover rounded"
                            />
                          </div>
                          <div className="text-gray-400 flex items-center">VS</div>
                          <div className="w-20 h-20 rounded border">
                            <img 
                              src={selectedKYC.selfieImage} 
                              alt="Selfie" 
                              className="w-full h-full object-cover rounded"
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm font-medium">Confidence Score</span>
                          <div className="flex items-center">
                            <Progress value={85} className="h-2 w-24 mr-2" />
                            <span className="text-sm">85%</span>
                          </div>
                        </div>
                      </Card>
                      
                      <Card className="p-4">
                        <h4 className="font-medium mb-2">Document Authenticity</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex justify-between">
                            <span>Security Features</span>
                            <Badge variant="outline" className="bg-green-100 text-green-800">Valid</Badge>
                          </li>
                          <li className="flex justify-between">
                            <span>MRZ Check</span>
                            <Badge variant="outline" className="bg-green-100 text-green-800">Valid</Badge>
                          </li>
                          <li className="flex justify-between">
                            <span>Document Format</span>
                            <Badge variant="outline" className="bg-green-100 text-green-800">Valid</Badge>
                          </li>
                          <li className="flex justify-between">
                            <span>Tampering Check</span>
                            <Badge variant="outline" className="bg-green-100 text-green-800">No Tampering</Badge>
                          </li>
                        </ul>
                      </Card>
                      
                      <Card className="p-4">
                        <h4 className="font-medium mb-2">User Information Match</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex justify-between">
                            <span>Name</span>
                            <Badge variant="outline" className="bg-green-100 text-green-800">Match</Badge>
                          </li>
                          <li className="flex justify-between">
                            <span>Date of Birth</span>
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Partial Match</Badge>
                          </li>
                          <li className="flex justify-between">
                            <span>Address</span>
                            <Badge variant="outline" className="bg-green-100 text-green-800">Match</Badge>
                          </li>
                        </ul>
                      </Card>
                      
                      <Card className="p-4">
                        <h4 className="font-medium mb-2">Risk Assessment</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Overall Risk Score</span>
                            <div className="flex items-center">
                              <Progress value={15} className="h-2 w-24 mr-2" />
                              <span className="text-sm text-green-600">Low</span>
                            </div>
                          </div>
                          <div className="pt-2 text-xs text-muted-foreground">
                            <p>No suspicious patterns detected. User has a clean banking history and no flags in the system.</p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReviewModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Additional Documents Modal */}
      {showAdditionalDocModal && selectedKYC && (
        <Dialog open={true} onOpenChange={() => setShowAdditionalDocModal(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Additional Documents</DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <div className="mb-4">
                <Label className="block mb-2">Required Documents</Label>
                <div className="space-y-2">
                  {['Address Proof', 'Income Proof', 'Bank Statement', 'Photo ID', 'Signature Proof'].map((doc, idx) => (
                    <div key={idx} className="flex items-center">
                      <input 
                        type="checkbox" 
                        id={`doc-${idx}`} 
                        className="mr-2 h-4 w-4"
                        checked={additionalDocs.includes(doc)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAdditionalDocs([...additionalDocs, doc]);
                          } else {
                            setAdditionalDocs(additionalDocs.filter(d => d !== doc));
                          }
                        }}
                      />
                      <Label htmlFor={`doc-${idx}`} className="cursor-pointer">{doc}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <Label htmlFor="message">Message to User</Label>
                <Textarea
                  id="message"
                  value={additionalMessage}
                  onChange={(e) => setAdditionalMessage(e.target.value)}
                  placeholder="Explain what documents are needed and why..."
                  className="mt-1"
                  required
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdditionalDocModal(false)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitAdditionalRequest}
                disabled={isProcessing || additionalDocs.length === 0 || !additionalMessage}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileText size={16} className="mr-2" />
                    Request Documents
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminKYCPage;
