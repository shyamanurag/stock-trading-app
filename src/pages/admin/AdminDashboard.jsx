// src/pages/admin/AdminDashboard.jsx

import React from 'react';
import { Card, Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { 
  Users, 
  CreditCard, 
  FileCheck, 
  BarChart2, 
  Settings,
  AlertTriangle
} from 'lucide-react';

// Mock data
const stats = {
  totalUsers: 1245,
  userGrowth: 12.5,
  tradingVolume: 1250000,
  volumeChange: 8.3,
  totalOrders: 3876,
  orderChange: 15.2,
  totalRevenue: 875000,
  revenueChange: 7.6,
  systemLoad: 42,
  systemAlerts: 2
};

const StatsCard = ({ title, value, icon, description, change, color }) => {
  const Icon = icon;
  
  return (
    <Card className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          {change && (
            <p className={`text-xs mt-1 flex items-center ${
              parseFloat(change) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {parseFloat(change) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(change))}%
            </p>
          )}
        </div>
        <div className={`p-2 rounded-full ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </Card>
  );
};

const AlertCard = ({ title, count, color }) => {
  return (
    <Card className={`p-4 border-l-4 ${color}`}>
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium">{title}</p>
        <span className="text-lg font-bold">{count}</span>
      </div>
    </Card>
  );
};

const AdminDashboard = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard 
          title="Total Users" 
          value={stats.totalUsers} 
          icon={Users}
          description="All registered users"
          change={stats.userGrowth}
          color="bg-blue-500"
        />
        <StatsCard 
          title="Trading Volume" 
          value={`₹${stats.tradingVolume.toLocaleString()}`} 
          icon={BarChart2}
          description="Last 24 hours"
          change={stats.volumeChange}
          color="bg-green-500"
        />
        <StatsCard 
          title="Total Orders" 
          value={stats.totalOrders} 
          icon={FileCheck}
          description="Last 24 hours"
          change={stats.orderChange}
          color="bg-purple-500"
        />
        <StatsCard 
          title="Total Revenue" 
          value={`₹${stats.totalRevenue.toLocaleString()}`} 
          icon={CreditCard}
          description="Last 30 days"
          change={stats.revenueChange}
          color="bg-indigo-500"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <AlertCard 
          title="Pending KYC Verifications" 
          count={3}
          color="border-yellow-500"
        />
        <AlertCard 
          title="Pending Withdrawals" 
          count={5}
          color="border-blue-500"
        />
        <AlertCard 
          title="System Alerts" 
          count={stats.systemAlerts}
          color="border-red-500"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Recent Registrations</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="pb-2 font-medium">User</th>
                  <th className="pb-2 font-medium">Registered</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-muted/20">
                  <td className="py-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-2">
                        R
                      </div>
                      <div>
                        <p className="font-medium">Rahul Sharma</p>
                        <p className="text-xs text-muted-foreground">rahul@example.com</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-sm">
                    May 10, 2025
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                      Pending KYC
                    </span>
                  </td>
                </tr>
                <tr className="border-b hover:bg-muted/20">
                  <td className="py-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-2">
                        P
                      </div>
                      <div>
                        <p className="font-medium">Priya Singh</p>
                        <p className="text-xs text-muted-foreground">priya@example.com</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-sm">
                    May 9, 2025
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      Verified
                    </span>
                  </td>
                </tr>
                <tr className="border-b hover:bg-muted/20">
                  <td className="py-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-2">
                        V
                      </div>
                      <div>
                        <p className="font-medium">Vikram Patel</p>
                        <p className="text-xs text-muted-foreground">vikram@example.com</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-sm">
                    May 8, 2025
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                      Pending KYC
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">API Server</span>
              <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Operational</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">WebSocket Server</span>
              <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Operational</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Database</span>
              <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Operational</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Payment Gateway</span>
              <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Partial Outage</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Market Data Feed</span>
              <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Operational</span>
            </div>
            
            <div className="pt-4 mt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">System Load</span>
                <span className="text-sm">{stats.systemLoad}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${stats.systemLoad}%` }}
                ></div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
