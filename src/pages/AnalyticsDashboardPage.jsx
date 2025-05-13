import React from 'react';
import { useSelector } from 'react-redux';
import AdvancedAnalyticsDashboard from '../components/analytics/AdvancedAnalyticsDashboard';
import useStrategyBuilder from '../hooks/useStrategyBuilder';
import { useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const AnalyticsDashboardPage = () => {
  const { strategyId } = useParams();
  const [searchParams] = useSearchParams();
  const queryStrategyId = searchParams.get('strategyId');
  
  // Use the ID from either route params or query string
  const id = strategyId || queryStrategyId;
  
  // Get strategy from Redux or via the custom hook
  const { loadStrategy, strategy, analysis, backtest } = useStrategyBuilder();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Load the strategy when the component mounts
  useEffect(() => {
    if (id) {
      setLoading(true);
      setError(null);
      
      loadStrategy(id)
        .then(() => {
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Failed to load strategy');
          setLoading(false);
        });
    }
  }, [id, loadStrategy]);
  
  // If no strategyId provided and we don't have a current strategy
  if (!id && !strategy?.id) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
            <h2 className="text-xl font-semibold">No Strategy Selected</h2>
            <p className="text-gray-500 text-center max-w-md">
              Please select a strategy from your portfolio or create a new one to view analytics.
            </p>
            <div className="flex space-x-4">
              <Link to="/strategies">
                <Button variant="outline">View My Strategies</Button>
              </Link>
              <Link to="/strategy-builder">
                <Button>Create New Strategy</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-500">Loading strategy data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
            <div className="text-red-500 text-xl">Error</div>
            <p>{error}</p>
            <Link to="/strategies">
              <Button variant="outline">Back to Strategies</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div>
      <div className="bg-background">
        <div className="container mx-auto py-2">
          <Link to="/strategies" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Strategies
          </Link>
        </div>
      </div>
      
      <AdvancedAnalyticsDashboard 
        strategy={strategy} 
        analysis={analysis} 
        backtest={backtest} 
      />
    </div>
  );
};

export default AnalyticsDashboardPage;
