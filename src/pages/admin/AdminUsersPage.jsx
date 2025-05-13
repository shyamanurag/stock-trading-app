// src/pages/admin/AdminUsersPage.jsx

import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Input, 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Switch,
  Label
} from "@/components/ui";
import { Search, MoreHorizontal, UserPlus, Filter, Edit, Trash, Lock, Shield, Eye } from 'lucide-react';

// Mock users data
const mockUsers = [
  {
    id: '1',
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    phone: '+91 98765 43210',
    role: 'user',
    status: 'active',
    kycStatus: 'pending',
    registeredOn: '2025-05-10T10:30:00Z',
    balance: 5000
  },
  {
    id: '2',
    name: 'Priya Singh',
    email: 'priya@example.com',
    phone: '+91 87654 32109',
    role: 'user',
    status: 'active',
    kycStatus: 'verified',
    registeredOn: '2025-04-15T08:45:00Z',
    balance: 12500
  },
  {
    id: '3',
    name: 'Vikram Patel',
    email: 'vikram@example.com',
    phone: '+91 76543 21098',
    role: 'user',
    status: 'suspended',
    kycStatus: 'rejected',
    registeredOn: '2025-03-22T14:20:00Z',
    balance: 0
  },
  {
    id: '4',
    name: 'Ananya Roy',
    email: 'ananya@example.com',
    phone: '+91 65432 10987',
    role: 'admin',
    status: 'active',
    kycStatus: 'verified',
    registeredOn: '2025-02-10T09:15:00Z',
    balance: 25000
  }
];

const AdminUsersPage = () => {
  const [users, setUsers] = useState(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Handle search
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    // In a real app, this would filter the users list
  };
  
  // Filter users based on active tab
  const filteredUsers = users.filter(user => {
    if (activeTab === 'all') return true;
    if (activeTab === 'admins') return user.role === 'admin';
    if (activeTab === 'suspended') return user.status === 'suspended';
    if (activeTab === 'pending-kyc') return user.kycStatus === 'pending';
    return true;
  });
  
  // View user details
  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserDetailsModal(true);
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get KYC status badge class
  const getKYCStatusBadgeClass = (status) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold mb-2 md:mb-0">User Management</h1>
        
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search users"
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-9 w-full md:w-64"
            />
          </div>
          
          <Button onClick={() => setShowAddUserModal(true)}>
            <UserPlus size={16} className="mr-2" />
            Add User
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all">All Users</TabsTrigger>
            <TabsTrigger value="admins">Admins</TabsTrigger>
            <TabsTrigger value="suspended">Suspended</TabsTrigger>
            <TabsTrigger value="pending-kyc">Pending KYC</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center">
            <Filter size={14} className="mr-2 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter</span>
          </div>
        </div>
      </Tabs>
      
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 text-left">
                <th className="p-3 font-medium">User</th>
                <th className="p-3 font-medium">Role</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">KYC Status</th>
                <th className="p-3 font-medium">Registered</th>
                <th className="p-3 font-medium">Balance</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b hover:bg-muted/20">
                  <td className="p-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-2">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 capitalize">{user.role}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${getKYCStatusBadgeClass(user.kycStatus)}`}>
                      {user.kycStatus}
                    </span>
                  </td>
                  <td className="p-3 text-sm">{formatDate(user.registeredOn)}</td>
                  <td className="p-3 font-medium">₹{user.balance.toLocaleString()}</td>
                  <td className="p-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewUser(user)}>
                          <Eye size={14} className="mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit size={14} className="mr-2" />
                          Edit User
                        </DropdownMenuItem>
                        {user.status === 'active' ? (
                          <DropdownMenuItem className="text-red-600">
                            <Lock size={14} className="mr-2" />
                            Suspend User
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-green-600">
                            <Shield size={14} className="mr-2" />
                            Activate User
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-red-600">
                          <Trash size={14} className="mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Add User Modal */}
      {showAddUserModal && (
        <Dialog open={true} onOpenChange={() => setShowAddUserModal(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Enter user's name" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter email address" />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" placeholder="Enter phone number" />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <select id="role" className="w-full p-2 border rounded-md">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="verified" />
                <Label htmlFor="verified">Skip KYC Verification</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddUserModal(false)}>
                Cancel
              </Button>
              <Button>Add User</Button>
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
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mr-3 text-2xl">
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
                      <p className="text-sm text-muted-foreground">Role</p>
                      <p className="font-medium capitalize">{selectedUser.role}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(selectedUser.status)}`}>
                        {selectedUser.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">KYC Status</p>
                      <span className={`px-2 py-1 rounded-full text-xs ${getKYCStatusBadgeClass(selectedUser.kycStatus)}`}>
                        {selectedUser.kycStatus}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Registered On</p>
                      <p className="font-medium">{formatDate(selectedUser.registeredOn)}</p>
                    </div>
                  </div>
                  
                  <div className="bg-muted/20 p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">Wallet Balance</p>
                    <p className="text-xl font-bold">₹{selectedUser.balance.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="md:w-2/3">
                  <Tabs defaultValue="activity">
                    <TabsList className="w-full mb-4">
                      <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
                      <TabsTrigger value="orders" className="flex-1">Orders</TabsTrigger>
                      <TabsTrigger value="wallet" className="flex-1">Wallet</TabsTrigger>
                      <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="activity">
                      <div className="text-center p-8 text-muted-foreground">
                        Activity history will be implemented in the next phase.
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="orders">
                      <div className="text-center p-8 text-muted-foreground">
                        Order history will be implemented in the next phase.
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="wallet">
                      <div className="text-center p-8 text-muted-foreground">
                        Wallet transactions will be implemented in the next phase.
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="settings">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Account Status</p>
                            <p className="text-sm text-muted-foreground">Enable or disable user account</p>
                          </div>
                          <Switch checked={selectedUser.status === 'active'} />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Admin Privileges</p>
                            <p className="text-sm text-muted-foreground">Grant admin access</p>
                          </div>
                          <Switch checked={selectedUser.role === 'admin'} />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">KYC Verification</p>
                            <p className="text-sm text-muted-foreground">Manual verification override</p>
                          </div>
                          <Switch checked={selectedUser.kycStatus === 'verified'} />
                        </div>
                        
                        <div className="pt-4 border-t mt-4">
                          <Button variant="destructive" className="w-full">
                            <Trash size={16} className="mr-2" />
                            Delete User Account
                          </Button>
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
              <Button>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminUsersPage;
