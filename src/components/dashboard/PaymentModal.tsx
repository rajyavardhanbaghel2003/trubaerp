import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, CheckCircle, Loader2, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import confetti from 'canvas-confetti';

interface FeeBreakdown {
  tuition_fee: number;
  library_fee: number;
  lab_fee: number;
  other_charges: number;
}

interface PendingFee {
  id: string;
  semester: number;
  academic_year: string;
  amount: number;
  tuition_fee: number;
  library_fee: number;
  lab_fee: number;
  other_charges: number;
}

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  feeType: string;
  feeId?: string;
  pendingFees?: PendingFee[];
  breakdown?: FeeBreakdown;
  onPaymentComplete: (feeIds: string[]) => void;
}

type PaymentStep = 'form' | 'processing' | 'success';

export function PaymentModal({ 
  open, 
  onOpenChange, 
  amount,
  feeType,
  feeId,
  pendingFees = [],
  breakdown,
  onPaymentComplete 
}: PaymentModalProps) {
  const [step, setStep] = useState<PaymentStep>('form');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      // Reset selection when modal opens
      if (feeId) {
        setSelectedFeeIds([feeId]);
      } else if (pendingFees.length > 0) {
        setSelectedFeeIds([pendingFees[0].id]);
      }
    }
  }, [open, feeId, pendingFees]);

  const handleFeeToggle = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedFeeIds(prev => [...prev, id]);
    } else {
      setSelectedFeeIds(prev => prev.filter(fid => fid !== id));
    }
  };

  const selectAll = () => {
    setSelectedFeeIds(pendingFees.map(f => f.id));
  };

  const selectedFeesData = pendingFees.filter(f => selectedFeeIds.includes(f.id));
  
  const totalAmount = selectedFeesData.reduce((sum, f) => sum + f.amount, 0);
  const totalBreakdown = selectedFeesData.reduce(
    (acc, f) => ({
      tuition_fee: acc.tuition_fee + f.tuition_fee,
      library_fee: acc.library_fee + f.library_fee,
      lab_fee: acc.lab_fee + f.lab_fee,
      other_charges: acc.other_charges + f.other_charges,
    }),
    { tuition_fee: 0, library_fee: 0, lab_fee: 0, other_charges: 0 }
  );

  const currentBreakdown = selectedFeesData.length > 0 ? totalBreakdown : breakdown;
  const currentAmount = selectedFeesData.length > 0 ? totalAmount : amount;

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedFeeIds.length === 0) {
      return;
    }
    
    setStep('processing');
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setStep('success');
    triggerConfetti();
    
    // Auto-close after success animation
    setTimeout(() => {
      onPaymentComplete(selectedFeeIds);
      handleClose();
    }, 2500);
  };

  const handleClose = () => {
    setStep('form');
    setCardNumber('');
    setExpiry('');
    setCvv('');
    setName('');
    setSelectedFeeIds([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Pay {feeType}
                </DialogTitle>
              </DialogHeader>

              {/* Multi-Semester Selection */}
              {pendingFees.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Select Semesters to Pay</Label>
                    {pendingFees.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs">
                        Select All ({pendingFees.length})
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                    {pendingFees.map((fee) => (
                      <div key={fee.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={fee.id}
                          checked={selectedFeeIds.includes(fee.id)}
                          onCheckedChange={(checked) => handleFeeToggle(fee.id, checked === true)}
                        />
                        <label 
                          htmlFor={fee.id} 
                          className="flex-1 text-sm cursor-pointer flex justify-between"
                        >
                          <span>Semester {fee.semester} - {fee.academic_year}</span>
                          <span className="font-medium">₹{fee.amount.toLocaleString()}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                  {selectedFeeIds.length > 1 && (
                    <p className="text-sm text-muted-foreground">
                      {selectedFeeIds.length} semesters selected
                    </p>
                  )}
                </div>
              )}

              {/* Fee Breakdown */}
              <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Fee Breakdown</p>
                {currentBreakdown && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tuition Fee</span>
                      <span>₹{(currentBreakdown.tuition_fee || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Library Fee</span>
                      <span>₹{(currentBreakdown.library_fee || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lab Fee</span>
                      <span>₹{(currentBreakdown.lab_fee || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Other Charges</span>
                      <span>₹{(currentBreakdown.other_charges || 0).toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t border-border flex justify-between font-semibold">
                      <span>Total Amount</span>
                      <span className="text-primary text-lg">₹{currentAmount.toLocaleString()}</span>
                    </div>
                  </div>
                )}
                {!currentBreakdown && (
                  <p className="text-3xl font-bold text-primary">₹{currentAmount.toLocaleString()}</p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Cardholder Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="card">Card Number</Label>
                  <div className="relative">
                    <Input
                      id="card"
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      maxLength={19}
                      required
                    />
                    <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      maxLength={5}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      type="password"
                      placeholder="•••"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      maxLength={3}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
                  <Lock className="w-3 h-3" />
                  <span>Your payment is secured with 256-bit encryption</span>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={selectedFeeIds.length === 0}
                >
                  {selectedFeeIds.length === 0 
                    ? 'Select fees to pay' 
                    : `Confirm Payment - ₹${currentAmount.toLocaleString()}`
                  }
                </Button>
              </form>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-primary/30"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>
              <h3 className="mt-6 text-lg font-semibold">Processing Payment</h3>
              <p className="text-muted-foreground mt-2">Please wait while we process your payment...</p>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-20 h-20 rounded-full bg-success flex items-center justify-center"
              >
                <CheckCircle className="w-10 h-10 text-success-foreground" />
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 text-lg font-semibold text-success"
              >
                Payment Successful!
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground mt-2"
              >
                {selectedFeeIds.length > 1 
                  ? `${selectedFeeIds.length} receipts have been generated.`
                  : 'Your receipt has been generated.'
                }
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
