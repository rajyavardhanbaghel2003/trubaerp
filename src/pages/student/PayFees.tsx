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
        .order('due_date', { ascending: true });

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

  const handlePaymentComplete = async () => {
    const transactionId = `TXN${Date.now()}`;
    const receiptNumber = `RCP${Date.now()}`;

    try {
      const { error: paymentError } = await supabase.from('payments').insert({
        user_id: user?.id,
        fee_id: paymentModal.feeId,
        amount: paymentModal.amount,
        payment_method: 'card',
        transaction_id: transactionId,
        receipt_number: receiptNumber,
        status: 'completed',
      });

      if (paymentError) throw paymentError;

      const { error: feeError } = await supabase
        .from('fees')
        .update({ status: 'paid' })
        .eq('id', paymentModal.feeId);

      if (feeError) throw feeError;

      toast.success('Payment successful!');
      fetchFees();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    }
  };

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
        onPaymentComplete={handlePaymentComplete}
      />
    </DashboardLayout>
  );
}
