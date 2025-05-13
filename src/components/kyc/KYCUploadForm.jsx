// src/components/kyc/KYCUploadForm.jsx

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Button, 
  Card, 
  Input, 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem,
  RadioGroup,
  RadioGroupItem,
  Label,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui";
import { Upload, X, Check, AlertTriangle, Camera } from 'lucide-react';

// Mock function for development
const mockUploadKYCDocument = (formData) => ({ 
  type: 'MOCK_UPLOAD_KYC_DOCUMENT', 
  payload: formData 
});

const DocumentTypeInfo = ({ type }) => {
  const infoContent = {
    'aadhar': 'Upload front and back side of your Aadhar card. Make sure all details are clearly visible.',
    'pan': 'Upload a clear photo of your PAN card. Ensure the PAN number and name are clearly visible.',
    'passport': 'Upload the first and last page of your passport. Ensure your photo and details are clearly visible.',
    'voter': 'Upload front and back sides of your Voter ID card.',
    'driving': 'Upload both sides of your Driving License.'
  };

  return (
    <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 mb-4">
      <div className="flex">
        <AlertTriangle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
        <div>{infoContent[type] || 'Please upload a clear photo of your document.'}</div>
      </div>
    </div>
  );
};

const KYCUploadForm = () => {
  const dispatch = useDispatch();
  
  // Replace with actual Redux state once implemented
  const kycState = useSelector((state) => state.kyc || { 
    isLoading: false, 
    status: 'not_started' 
  });
  
  const { isLoading, status } = kycState;
  
  const [documentType, setDocumentType] = useState('aadhar');
  const [documentNumber, setDocumentNumber] = useState('');
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const [uploadMethod, setUploadMethod] = useState('upload');
  
  const [frontImagePreview, setFrontImagePreview] = useState(null);
  const [backImagePreview, setBackImagePreview] = useState(null);
  const [selfieImagePreview, setSelfieImagePreview] = useState(null);

  // Function to handle file selection
  const handleFileChange = (e, setImage, setPreview) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to remove selected image
  const removeImage = (setImage, setPreview) => {
    setImage(null);
    setPreview(null);
  };

  // Function to handle document submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('documentNumber', documentNumber);
    if (frontImage) formData.append('frontImage', frontImage);
    if (backImage) formData.append('backImage', backImage);
    if (selfieImage) formData.append('selfieImage', selfieImage);
    
    try {
      await dispatch(mockUploadKYCDocument(formData));
      // Reset form after successful submission
      // This would typically be handled by the reducer updating the UI state
    } catch (error) {
      console.error('KYC document upload failed:', error);
    }
  };

  const needsBackSide = ['aadhar', 'voter', 'driving'].includes(documentType);
  
  return (
    <Card className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">KYC Verification</h2>
      
      {status === 'pending' && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 flex items-start">
          <AlertTriangle size={20} className="mr-3 flex-shrink-0 mt-1" />
          <div>
            <p className="font-medium">Verification in Progress</p>
            <p className="text-sm mt-1">Your KYC documents are under review. This process typically takes 24-48 hours.</p>
          </div>
        </div>
      )}
      
      {status === 'approved' && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md text-green-800 flex items-start">
          <Check size={20} className="mr-3 flex-shrink-0 mt-1" />
          <div>
            <p className="font-medium">Verification Completed</p>
            <p className="text-sm mt-1">Your KYC has been successfully verified. You now have full access to all trading features.</p>
          </div>
        </div>
      )}
      
      {status === 'rejected' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-800 flex items-start">
          <X size={20} className="mr-3 flex-shrink-0 mt-1" />
          <div>
            <p className="font-medium">Verification Failed</p>
            <p className="text-sm mt-1">Your KYC verification was rejected. Please upload clearer documents and ensure all information is accurate.</p>
          </div>
        </div>
      )}
      
      {(status !== 'approved' && status !== 'pending') && (
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Document Type</label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aadhar">Aadhar Card</SelectItem>
                <SelectItem value="pan">PAN Card</SelectItem>
                <SelectItem value="passport">Passport</SelectItem>
                <SelectItem value="voter">Voter ID</SelectItem>
                <SelectItem value="driving">Driving License</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <DocumentTypeInfo type={documentType} />
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">{documentType.charAt(0).toUpperCase() + documentType.slice(1)} Number</label>
            <Input
              type="text"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder={`Enter your ${documentType} number`}
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Upload Method</label>
            <RadioGroup value={uploadMethod} onValueChange={setUploadMethod} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="upload" id="upload" />
                <Label htmlFor="upload">Upload Images</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="camera" id="camera" />
                <Label htmlFor="camera">Use Camera</Label>
              </div>
            </RadioGroup>
          </div>
          
          <Tabs value={uploadMethod} className="mb-6">
            <TabsContent value="upload" className="space-y-6">
              {/* Front Side Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Front Side</label>
                <div className="border-2 border-dashed rounded-md p-4">
                  {!frontImagePreview ? (
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-2">
                        <label htmlFor="front-upload" className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80">
                          <span>Upload a file</span>
                          <input 
                            id="front-upload"
                            name="front" 
                            type="file" 
                            className="sr-only" 
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, setFrontImage, setFrontImagePreview)}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                    </div>
                  ) : (
                    <div className="relative">
                      <img 
                        src={frontImagePreview}
                        alt="Front Document Preview" 
                        className="max-h-64 mx-auto rounded" 
                      />
                      <button 
                        type="button"
                        onClick={() => removeImage(setFrontImage, setFrontImagePreview)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Back Side Upload (conditional) */}
              {needsBackSide && (
                <div>
                  <label className="block text-sm font-medium mb-2">Back Side</label>
                  <div className="border-2 border-dashed rounded-md p-4">
                    {!backImagePreview ? (
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-2">
                          <label htmlFor="back-upload" className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80">
                            <span>Upload a file</span>
                            <input 
                              id="back-upload"
                              name="back" 
                              type="file" 
                              className="sr-only" 
                              accept="image/*"
                              onChange={(e) => handleFileChange(e, setBackImage, setBackImagePreview)}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                      </div>
                    ) : (
                      <div className="relative">
                        <img 
                          src={backImagePreview}
                          alt="Back Document Preview" 
                          className="max-h-64 mx-auto rounded" 
                        />
                        <button 
                          type="button"
                          onClick={() => removeImage(setBackImage, setBackImagePreview)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Selfie Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Your Selfie</label>
                <div className="border-2 border-dashed rounded-md p-4">
                  {!selfieImagePreview ? (
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-2">
                        <label htmlFor="selfie-upload" className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80">
                          <span>Upload a file</span>
                          <input 
                            id="selfie-upload"
                            name="selfie" 
                            type="file" 
                            className="sr-only" 
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, setSelfieImage, setSelfieImagePreview)}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                    </div>
                  ) : (
                    <div className="relative">
                      <img 
                        src={selfieImagePreview}
                        alt="Selfie Preview" 
                        className="max-h-64 mx-auto rounded" 
                      />
                      <button 
                        type="button"
                        onClick={() => removeImage(setSelfieImage, setSelfieImagePreview)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="camera">
              <div className="space-y-6">
                {/* Camera capture functionality would be implemented here */}
                <div className="text-center p-6 border rounded-md">
                  <Camera size={48} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Camera functionality will be implemented in the next phase.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6">
            <Button 
              type="submit" 
              disabled={isLoading || !documentNumber || !frontImage || (needsBackSide && !backImage) || !selfieImage}
              className="w-full"
            >
              {isLoading ? 'Uploading...' : 'Submit Documents'}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
};

export default KYCUploadForm;
