// src/components/wallet/PaymentIntegrationModal.jsx

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui";

// Mock functions for development
const mockDepositFunds = (details) => ({ 
  type: 'MOCK_DEPOSIT_FUNDS', 
  payload: details
});

const mockWithdrawFunds = (details) => ({ 
  type: 'MOCK_WITHDRAW_FUNDS', 
  payload: details
});

const PaymentIntegrationModal = ({ type, onClose }) => {
  const dispatch = useDispatch();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // UPI payment details
  const [upiId, setUpiId] = useState('');
  
  // Card payment details
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');
  
  // Bank details for withdrawals
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');

  const handleAmountChange = (e) => {
    // Only allow numbers and a single decimal point
    const value = e.target.value.replace(/[^0-9.]/g, '');
    if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
      setAmount(value);
    }
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      return;
    }

    setIsProcessing(true);
    
    try {
      if (type === 'deposit') {
        // Create payment details based on the selected payment method
        const paymentDetails = {
          amount: parseFloat(amount),
          method: paymentMethod,
          ...(paymentMethod === 'upi' && { upiId }),
          ...(paymentMethod === 'card' && { 
            cardNumber, 
            expiryDate,
            cvv,
            nameOnCard
          })
        };
        
        await dispatch(mockDepositFunds(paymentDetails));
      } else {
        // Withdrawal details
        const withdrawalDetails = {
          amount: parseFloat(amount),
          bankDetails: {
            accountNumber,
            ifscCode,
            accountHolderName,
            bankName
          }
        };
        
        await dispatch(mockWithdrawFunds(withdrawalDetails));
      }
      
      onClose();
    } catch (error) {
      console.error('Payment processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{type === 'deposit' ? 'Add Funds' : 'Withdraw Funds'}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Amount (₹)
            </label>
            <Input
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="Enter amount"
              className="w-full"
            />
          </div>
          
          {type === 'deposit' ? (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Payment Method
              </label>
              <Tabs defaultValue="upi" onValueChange={setPaymentMethod}>
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="upi">UPI</TabsTrigger>
                  <TabsTrigger value="card">Card</TabsTrigger>
                  <TabsTrigger value="netbanking">Netbanking</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upi">
                  <Input
                    placeholder="Enter UPI ID"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                  />
                </TabsContent>
                
                <TabsContent value="card">
                  <div className="space-y-3">
                    <Input
                      placeholder="Card Number"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="MM/YY"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                      />
                      <Input
                        placeholder="CVV"
                        type="password"
                        maxLength={3}
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                      />
                    </div>
                    <Input
                      placeholder="Name on Card"
                      value={nameOnCard}
                      onChange={(e) => setNameOnCard(e.target.value)}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="netbanking">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Bank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hdfc">HDFC Bank</SelectItem>
                      <SelectItem value="sbi">State Bank of India</SelectItem>
                      <SelectItem value="icici">ICICI Bank</SelectItem>
                      <SelectItem value="axis">Axis Bank</SelectItem>
                      <SelectItem value="kotak">Kotak Mahindra Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Account Holder Name
                </label>
                <Input
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="Enter account holder name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Account Number
                </label>
                <Input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Enter account number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  IFSC Code
                </label>
                <Input
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  placeholder="Enter IFSC code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Bank Name
                </label>
                <Input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Enter bank name"
                />
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex-col sm:flex-row sm:justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!amount || parseFloat(amount) <= 0 || isProcessing}
            className={type === 'deposit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
          >
            {isProcessing ? 'Processing...' : type === 'deposit' ? 'Add Funds' : 'Withdraw Funds'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentIntegrationModal;
