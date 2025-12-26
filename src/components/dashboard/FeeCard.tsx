import { motion } from 'framer-motion';
import { Calendar, CreditCard, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FeeCardProps {
  id: string;
  feeType: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  academicYear: string;
  semester: number;
  tuitionFee?: number;
  libraryFee?: number;
  labFee?: number;
  otherCharges?: number;
  onPayClick: (id: string, amount: number, feeType: string, breakdown?: {
    tuition_fee: number;
    library_fee: number;
    lab_fee: number;
    other_charges: number;
  }) => void;
  delay?: number;
}

export function FeeCard({ 
  id,
  feeType, 
  amount, 
  dueDate, 
  status, 
  academicYear,
  semester,
  tuitionFee = 0,
  libraryFee = 0,
  labFee = 0,
  otherCharges = 0,
  onPayClick,
  delay = 0 
}: FeeCardProps) {
  const isOverdue = new Date(dueDate) < new Date() && status === 'pending';
  const currentStatus = isOverdue ? 'overdue' : status;

  const statusStyles = {
    pending: 'payment-badge-pending',
    paid: 'payment-badge-paid',
    overdue: 'payment-badge-overdue',
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const breakdown = {
    tuition_fee: tuitionFee,
    library_fee: libraryFee,
    lab_fee: labFee,
    other_charges: otherCharges,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        "bg-card rounded-xl p-5 border transition-all duration-300 hover:shadow-lg",
        currentStatus === 'overdue' && "border-destructive/30 bg-destructive/5",
        currentStatus === 'pending' && "border-pending/30",
        currentStatus === 'paid' && "border-success/30"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">{feeType}</h3>
          <p className="text-sm text-muted-foreground">
            {academicYear} • Semester {semester}
          </p>
        </div>
        <span className={cn(statusStyles[currentStatus], "flex items-center gap-1")}>
          {currentStatus === 'overdue' && <AlertTriangle className="w-3 h-3" />}
          {currentStatus === 'overdue' ? 'Overdue' : currentStatus === 'paid' ? 'Paid' : 'Pending'}
        </span>
      </div>

      {/* Fee Breakdown */}
      {currentStatus !== 'paid' && (tuitionFee > 0 || libraryFee > 0 || labFee > 0 || otherCharges > 0) && (
        <div className="mb-4 p-3 rounded-lg bg-muted/30 text-sm space-y-1">
          {tuitionFee > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tuition</span>
              <span>₹{tuitionFee.toLocaleString()}</span>
            </div>
          )}
          {libraryFee > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Library</span>
              <span>₹{libraryFee.toLocaleString()}</span>
            </div>
          )}
          {labFee > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lab</span>
              <span>₹{labFee.toLocaleString()}</span>
            </div>
          )}
          {otherCharges > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Other</span>
              <span>₹{otherCharges.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className={cn(
            "text-3xl font-bold",
            currentStatus === 'overdue' ? "text-destructive" : "text-primary"
          )}>
            ₹{amount.toLocaleString()}
          </p>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Due: {formatDate(dueDate)}</span>
          </div>
        </div>

        {status !== 'paid' && (
          <Button 
            onClick={() => onPayClick(id, amount, feeType, breakdown)}
            className="gap-2"
            variant={currentStatus === 'overdue' ? 'destructive' : 'default'}
          >
            <CreditCard className="w-4 h-4" />
            Pay Now
          </Button>
        )}
      </div>
    </motion.div>
  );
}
