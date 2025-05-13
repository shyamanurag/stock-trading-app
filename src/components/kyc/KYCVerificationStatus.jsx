// src/components/kyc/KYCVerificationStatus.jsx

import React from 'react';
import { useSelector } from 'react-redux';
import { Progress } from "@/components/ui";
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

// Mock data for development
const mockKycState = {
  status: 'uploaded', // 'not_started', 'uploaded', 'pending', 'approved', 'rejected'
  documents: [
    {
      type: 'aadhar',
      uploadedAt: '2025-05-10T10:30:00Z',
      status: 'pending'
    }
  ],
  lastUpdated: '2025-05-10T10:30:00Z',
  rejectionReason: null
};

const statusConfig = {
  'not_started': {
    title: 'Not Started',
    description: 'You have not started the KYC verification process yet.',
    color: 'text-gray-500',
    icon: AlertTriangle,
    progress: 0
  },
  'uploaded': {
    title: 'Documents Uploaded',
    description: 'Your documents have been uploaded and are awaiting review.',
    color: 'text-blue-500',
    icon: Clock,
    progress: 33
  },
  'pending': {
    title: 'Verification In Progress',
    description: 'Your documents are being verified. This usually takes 24-48 hours.',
    color: 'text-yellow-500',
    icon: Clock,
    progress: 66
  },
  'approved': {
    title: 'Verification Complete',
    description: 'Your KYC verification has been approved. You have full access to all trading features.',
    color: 'text-green-500',
    icon: CheckCircle,
    progress: 100
  },
  'rejected': {
    title: 'Verification Rejected',
    description: 'Your KYC verification was rejected. Please re-upload your documents with clearer images.',
    color: 'text-red-500',
    icon: XCircle,
    progress: 30
  }
};

const KYCStatusIcon = ({ status }) => {
  const config = statusConfig[status] || statusConfig.not_started;
  const Icon = config.icon;
  
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
      status === 'approved' ? 'bg-green-100' : 
      status === 'rejected' ? 'bg-red-100' : 
      status === 'pending' || status === 'uploaded' ? 'bg-yellow-100' : 
      'bg-gray-100'
    }`}>
      <Icon className={`w-6 h-6 ${config.color}`} />
    </div>
  );
};

const KYCVerificationStatus = () => {
  // Replace with actual Redux state once implemented
  const { status, documents, lastUpdated, rejectionReason } = useSelector(
    (state) => state.kyc || mockKycState
  );
  
  const config = statusConfig[status] || statusConfig.not_started;
  
  return (
    <div className="bg-background rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">KYC Verification Status</h3>
        <KYCStatusIcon status={status} />
      </div>
      
      <Progress value={config.progress} className="h-2 mb-4" />
      
      <div className="mb-4">
        <h4 className={`font-medium text-lg ${config.color}`}>{config.title}</h4>
        <p className="text-muted-foreground text-sm mt-1">{config.description}</p>
        
        {rejectionReason && status === 'rejected' && (
          <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded text-sm text-red-800">
            <span className="font-medium">Reason for rejection:</span> {rejectionReason}
          </div>
        )}
      </div>
      
      {documents && documents.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-sm mb-2">Submitted Documents</h4>
          <ul className="space-y-2 text-sm">
            {documents.map((doc, index) => (
              <li key={index} className="flex items-center justify-between p-2 bg-muted/20 rounded">
                <span>{doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(doc.uploadedAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {lastUpdated && (
        <div className="text-xs text-muted-foreground">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default KYCVerificationStatus;
