// src/pages/KYCPage.jsx

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Card,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Button
} from "@/components/ui";
import { FileCheck, Clock, AlertTriangle, HelpCircle } from 'lucide-react';
import KYCUploadForm from '../components/kyc/KYCUploadForm';
import KYCVerificationStatus from '../components/kyc/KYCVerificationStatus';
import { getKYCStatus } from '../store/slices/kycSlice';

const KYCPage = () => {
  const dispatch = useDispatch();
  const { status, isLoading } = useSelector((state) => state.kyc || { status: 'not_started', isLoading: false });
  
  useEffect(() => {
    dispatch(getKYCStatus());
  }, [dispatch]);
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Account Verification</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <KYCUploadForm />
        </div>
        
        <div>
          <KYCVerificationStatus />
          
          <Card className="p-4 mt-4 bg-muted/20">
            <h4 className="text-sm font-semibold mb-2 flex items-center">
              <HelpCircle size={16} className="mr-2 text-muted-foreground" />
              Verification Help
            </h4>
            <ul className="text-sm space-y-2 mt-3">
              <li className="flex items-start">
                <Clock size={14} className="mr-2 flex-shrink-0 mt-1 text-blue-500" />
                <span>Verification usually takes 24-48 hours</span>
              </li>
              <li className="flex items-start">
                <AlertTriangle size={14} className="mr-2 flex-shrink-0 mt-1 text-yellow-500" />
                <span>Ensure all document details are clearly visible</span>
              </li>
              <li className="flex items-start">
                <FileCheck size={14} className="mr-2 flex-shrink-0 mt-1 text-green-500" />
                <span>Documents must match the name on your account</span>
              </li>
            </ul>
            
            <div className="mt-4 pt-4 border-t border-muted">
              <h4 className="text-sm font-semibold mb-2">Need help?</h4>
              <p className="text-xs text-muted-foreground mb-2">Contact our support team if you're having trouble with your verification.</p>
              <Button variant="outline" size="sm" className="w-full">Contact Support</Button>
            </div>
          </Card>
          
          <Card className="p-4 mt-4">
            <h4 className="text-sm font-semibold mb-2">Why verify your account?</h4>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• Access to advanced trading features</li>
              <li>• Higher deposit and withdrawal limits</li>
              <li>• Enhanced account security</li>
              <li>• Required by regulatory guidelines</li>
            </ul>
          </Card>
        </div>
      </div>
      
      <Card className="p-6 mt-8">
        <h2 className="text-xl font-bold mb-4">Account Verification Process</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-md border ${status === 'not_started' ? 'bg-blue-50 border-blue-200' : 'bg-muted/20'}`}>
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2">
                1
              </div>
              <h3 className="font-medium">Upload Documents</h3>
            </div>
            <p className="text-xs text-muted-foreground">Submit your identity documents for verification.</p>
          </div>
          
          <div className={`p-4 rounded-md border ${status === 'uploaded' ? 'bg-blue-50 border-blue-200' : 'bg-muted/20'}`}>
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2">
                2
              </div>
              <h3 className="font-medium">Document Review</h3>
            </div>
            <p className="text-xs text-muted-foreground">Our team checks your documents for compliance.</p>
          </div>
          
          <div className={`p-4 rounded-md border ${status === 'pending' ? 'bg-blue-50 border-blue-200' : 'bg-muted/20'}`}>
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2">
                3
              </div>
              <h3 className="font-medium">Verification</h3>
            </div>
            <p className="text-xs text-muted-foreground">Your identity is verified against official records.</p>
          </div>
          
          <div className={`p-4 rounded-md border ${status === 'approved' ? 'bg-blue-50 border-blue-200' : 'bg-muted/20'}`}>
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2">
                4
              </div>
              <h3 className="font-medium">Completion</h3>
            </div>
            <p className="text-xs text-muted-foreground">Your account is fully verified and unrestricted.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default KYCPage;
