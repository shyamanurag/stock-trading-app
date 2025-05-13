import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart3, 
  AlertTriangle, 
  Activity, 
  ListChecks, 
  RefreshCw, 
  Download 
} from 'lucide-react';

// Import extracted components
import VolatilitySurface from './VolatilitySurface';
import PerformanceMetrics from './PerformanceMetrics';
import StrategyReturnChart from './StrategyReturnChart';
import MonthlyReturnsCalendar from './MonthlyReturnsCalendar';
import ScenarioAnalysis from './ScenarioAnalysis';
import PositionsTable from './PositionsTable';

// Main Analytics Dashboard Component
const AdvancedAnalyticsDashboard = ({ strategy }) => {
  const [activeTab, setActiveTab] = useState("performance");
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Advanced Analytics Dashboard</h1>
            <p className="text-gray-500">Comprehensive analysis tools for options strategies</p>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh Data
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" /> Export Report
            </Button>
          </div>
        </div>
        
        <Separator />
        
        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="performance" className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="risk" className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Risk Analysis
            </TabsTrigger>
            <TabsTrigger value="volatility" className="flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Volatility Analysis
            </TabsTrigger>
            <TabsTrigger value="positions" className="flex items-center">
              <ListChecks className="h-4 w-4 mr-2" />
              Positions
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance" className="space-y-6">
            <StrategyReturnChart />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PerformanceMetrics strategy={strategy} />
              <MonthlyReturnsCalendar />
            </div>
          </TabsContent>
          
          <TabsContent value="risk" className="space-y-6">
            <ScenarioAnalysis strategy={strategy} />
          </TabsContent>
          
          <TabsContent value="volatility" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Volatility Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-base font-medium mb-3">Implied Volatility Trend</h3>
                    <div className="bg-gray-100 h-72 flex items-center justify-center">
                      <p className="text-gray-500">IV Trend Chart</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-base font-medium mb-3">Volatility Smile</h3>
                    <div className="bg-gray-100 h-72 flex items-center justify-center">
                      <p className="text-gray-500">Volatility Smile Chart</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-base font-medium mb-3">Volatility Surface</h3>
                  <VolatilitySurface />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="positions" className="space-y-6">
            <PositionsTable />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
