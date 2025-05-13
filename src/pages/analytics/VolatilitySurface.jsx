import React, { useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";

// Monthly Returns Calendar component
const MonthlyReturnsCalendar = () => {
  // Generate sample monthly return data
  const monthlyReturns = useMemo(() => {
    const years = ['2023', '2024', '2025'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const data = {};
    
    years.forEach(year => {
      data[year] = {};
      months.forEach(month => {
        // Generate random returns between -15% and +20%
        const returnValue = (Math.random() * 35 - 15).toFixed(2);
        data[year][month] = returnValue;
      });
    });
    
    return data;
  }, []);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Returns</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.keys(monthlyReturns).reverse().map(year => (
            <div key={year}>
              <div className="flex items-center mb-2">
                <h3 className="text-lg font-medium">{year}</h3>
                <div className="ml-4 text-sm">
                  <span className="text-gray-500">Annual Return: </span>
                  <span className={`font-medium ${
                    Object.values(monthlyReturns[year]).reduce((a, b) => a + parseFloat(b), 0) >= 0 
                    ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {Object.values(monthlyReturns[year]).reduce((a, b) => a + parseFloat(b), 0).toFixed(2)}%
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                {Object.entries(monthlyReturns[year]).map(([month, returnValue]) => (
                  <div 
                    key={`${year}-${month}`}
                    className={`p-2 rounded-md ${
                      parseFloat(returnValue) > 5 ? 'bg-green-100' :
                      parseFloat(returnValue) > 0 ? 'bg-green-50' :
                      parseFloat(returnValue) > -5 ? 'bg-red-50' : 'bg-red-100'
                    }`}
                  >
                    <div className="text-xs text-gray-500">{month}</div>
                    <div className={`text-sm font-medium ${
                      parseFloat(returnValue) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {parseFloat(returnValue) >= 0 ? '+' : ''}{returnValue}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyReturnsCalendar;
