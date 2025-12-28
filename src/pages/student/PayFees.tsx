import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FeeCard } from '@/components/dashboard/FeeCard';
import { PaymentModal } from '@/components/dashboard/PaymentModal';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CreditCard } from 'lucide-react';

interface Fee {
  id: string;
  fee_type: string;
  amount: number;
  due_date: string;
  status: string;
  academic_year: string;
  semester: number;
  tuition_fee: number;
  library_fee: number;
  lab_fee: number;
  other_charges: number;
}

export default function PayFees() {
  const { user } = useAuth();
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState<{
    open: boolean;
    feeId: string;
    amount: number;
    feeType: string;
  }>({ open: false, feeId: '', amount: 0, feeType: '' });

  useEffect(() => {
    if (user) {
      fetchFees();
    }
  }, [user]);

  const fetchFees = async () => {
    try {
      const { data, error } = await supabase
        .from('fees')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'pending')
        .order('semester', { ascending: true });

      if (error) throw error;
      setFees(data || []);
    } catch (error) {
      console.error('Error fetching fees:', error);
      toast.error('Failed to load fees');
    } finally {
      setLoading(false);
    }
  };

  const handlePayClick = (feeId: string, amount: number, feeType: string) => {
    setPaymentModal({ open: true, feeId, amount, feeType });
  };

  const handlePaymentComplete = async (feeIds: string[]) => {
    try {
      const successfulIds: string[] = [];

      for (const feeId of feeIds) {
        const fee = fees.find(f => f.id === feeId);
        if (!fee) continue;

        const transactionId = `TXN${Date.now()}_${feeId.slice(0, 8)}`;
        const receiptNumber = `RCP${Date.now()}_${feeId.slice(0, 8)}`;

        // Insert payment – trigger auto-marks fee as 'paid'
        const { error: paymentError } = await supabase.from('payments').insert({
          user_id: user?.id,
          fee_id: feeId,
          amount: fee.amount,
          payment_method: 'card',
          transaction_id: transactionId,
          receipt_number: receiptNumber,
          status: 'completed',
        });

        if (paymentError) {
          console.error('Payment error for fee:', feeId, paymentError);
          toast.error(`Payment for Semester ${fee.semester} failed.`);
          continue;
        }

        successfulIds.push(feeId);
      }

      if (successfulIds.length > 0) {
        // Remove paid fees from local state immediately
        setFees(prevFees => prevFees.filter(f => !successfulIds.includes(f.id)));
        toast.success(
          successfulIds.length > 1
            ? `${successfulIds.length} semesters paid successfully!`
            : 'Payment successful!'
        );
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    }
  };

  // Prepare pending fees for modal
  const pendingFeesForModal = fees.map(f => ({
    id: f.id,
    semester: f.semester,
    academic_year: f.academic_year,
    amount: Number(f.amount),
    tuition_fee: Number(f.tuition_fee || 0),
    library_fee: Number(f.library_fee || 0),
    lab_fee: Number(f.lab_fee || 0),
    other_charges: Number(f.other_charges || 0),
  }));

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Pay Fees</h1>
          <p className="text-muted-foreground">View and pay your pending fees</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-5 border">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48 mb-4" />
                <Skeleton className="h-10 w-28" />
              </div>
            ))}
          </div>
        ) : fees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CreditCard className="w-10 h-10 text-success" />
            </div>
            <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground">You have no pending fees at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fees.map((fee, index) => (
              <FeeCard
                key={fee.id}
                id={fee.id}
                feeType={fee.fee_type}
                amount={Number(fee.amount)}
                dueDate={fee.due_date}
                status={fee.status as 'pending' | 'paid' | 'overdue'}
                academicYear={fee.academic_year}
                semester={fee.semester}
                tuitionFee={Number(fee.tuition_fee || 0)}
                libraryFee={Number(fee.library_fee || 0)}
                labFee={Number(fee.lab_fee || 0)}
                otherCharges={Number(fee.other_charges || 0)}
                onPayClick={handlePayClick}
                delay={index * 0.1}
              />
            ))}
          </div>
        )}
      </div>

      <PaymentModal
        open={paymentModal.open}
        onOpenChange={(open) => setPaymentModal({ ...paymentModal, open })}
        amount={paymentModal.amount}
        feeType={paymentModal.feeType}
        feeId={paymentModal.feeId}
        pendingFees={pendingFeesForModal}
        onPaymentComplete={handlePaymentComplete}
      />
    </DashboardLayout>
  );
}
