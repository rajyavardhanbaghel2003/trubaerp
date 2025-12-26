import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CreditCard, Receipt, TrendingUp } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { FeeCard } from '@/components/dashboard/FeeCard';
import { PaymentModal } from '@/components/dashboard/PaymentModal';
import { ReceiptTable } from '@/components/dashboard/ReceiptTable';
import { StatCardSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface Payment {
  id: string;
  fee_id: string;
  amount: number;
  paid_at: string;
  receipt_number: string;
  payment_method: string;
  status: string;
  fee_type: string;
}

interface FeeBreakdown {
  tuition_fee: number;
  library_fee: number;
  lab_fee: number;
  other_charges: number;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [fees, setFees] = useState<Fee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState<{
    open: boolean;
    feeId: string;
    amount: number;
    feeType: string;
    breakdown?: FeeBreakdown;
  }>({ open: false, feeId: '', amount: 0, feeType: '' });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [feesRes, paymentsRes] = await Promise.all([
        supabase.from('fees').select('*').eq('user_id', user?.id).order('due_date', { ascending: true }),
        supabase.from('payments').select('*, fees(fee_type)').eq('user_id', user?.id).order('paid_at', { ascending: false }),
      ]);

      if (feesRes.error) throw feesRes.error;
      if (paymentsRes.error) throw paymentsRes.error;

      setFees(feesRes.data || []);
      setPayments(
        (paymentsRes.data || []).map((p: any) => ({
          ...p,
          fee_type: p.fees?.fee_type || 'Fee',
        }))
      );
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handlePayClick = (feeId: string, amount: number, feeType: string, breakdown?: FeeBreakdown) => {
    setPaymentModal({ open: true, feeId, amount, feeType, breakdown });
  };

  const handlePaymentComplete = async (feeId: string) => {
    const transactionId = `TXN${Date.now()}`;
    const receiptNumber = `RCP${Date.now()}`;
    const fee = fees.find(f => f.id === feeId);

    if (!fee) return;

    try {
      // Create payment record
      const { error: paymentError } = await supabase.from('payments').insert({
        user_id: user?.id,
        fee_id: feeId,
        amount: fee.amount,
        payment_method: 'card',
        transaction_id: transactionId,
        receipt_number: receiptNumber,
        status: 'completed',
      });

      if (paymentError) throw paymentError;

      // Update fee status
      const { error: feeError } = await supabase
        .from('fees')
        .update({ status: 'paid' })
        .eq('id', feeId);

      if (feeError) throw feeError;

      // Immediately update local state to remove the paid fee from pending
      setFees(prevFees => prevFees.map(f => 
        f.id === feeId ? { ...f, status: 'paid' } : f
      ));

      toast.success('Payment successful! Receipt generated.');
      
      // Refetch to ensure data consistency
      await fetchData();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    }
  };

  const pendingFees = fees.filter(f => f.status === 'pending');
  const totalOutstanding = pendingFees.reduce((sum, fee) => sum + Number(fee.amount), 0);
  const totalPaid = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0);
  const overdueFees = pendingFees.filter(f => new Date(f.due_date) < new Date());

  // Prepare pending fees for modal semester selector
  const pendingFeesForModal = pendingFees.map(f => ({
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
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Manage your fees and payments</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array(4).fill(0).map((_, i) => <StatCardSkeleton key={i} />)
          ) : (
            <>
              <StatCard
                title="Total Outstanding"
                value={`₹${totalOutstanding.toLocaleString()}`}
                subtitle={`${pendingFees.length} pending fees`}
                icon={AlertTriangle}
                variant={totalOutstanding > 0 ? 'pending' : 'success'}
                delay={0}
              />
              <StatCard
                title="Total Paid"
                value={`₹${totalPaid.toLocaleString()}`}
                subtitle="This academic year"
                icon={CreditCard}
                variant="success"
                delay={0.1}
              />
              <StatCard
                title="Receipts"
                value={payments.length}
                subtitle="Payment records"
                icon={Receipt}
                variant="primary"
                delay={0.2}
              />
              <StatCard
                title="Overdue"
                value={overdueFees.length}
                subtitle={overdueFees.length > 0 ? 'Fees past due date' : 'All fees on time'}
                icon={TrendingUp}
                variant={overdueFees.length > 0 ? 'warning' : 'default'}
                delay={0.3}
              />
            </>
          )}
        </div>

        {/* Current Dues Card */}
        {totalOutstanding > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-pending" />
                  Current Dues
                </h2>
                <p className="text-4xl font-bold text-primary mt-2">
                  ₹{totalOutstanding.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {pendingFees.length} semester(s) pending payment
                </p>
              </div>
              <button
                onClick={() => setPaymentModal({ 
                  open: true, 
                  feeId: pendingFees[0]?.id || '', 
                  amount: totalOutstanding, 
                  feeType: 'Semester Fees',
                  breakdown: pendingFees[0] ? {
                    tuition_fee: Number(pendingFees[0].tuition_fee || 0),
                    library_fee: Number(pendingFees[0].library_fee || 0),
                    lab_fee: Number(pendingFees[0].lab_fee || 0),
                    other_charges: Number(pendingFees[0].other_charges || 0),
                  } : undefined
                })}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Pay Now
              </button>
            </div>
          </motion.div>
        )}

        {/* Pending Fees */}
        {pendingFees.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Pending Fees</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingFees.map((fee, index) => (
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
          </div>
        )}

        {/* Payment History */}
        <ReceiptTable payments={payments} loading={loading} />
      </div>

      <PaymentModal
        open={paymentModal.open}
        onOpenChange={(open) => setPaymentModal({ ...paymentModal, open })}
        amount={paymentModal.amount}
        feeType={paymentModal.feeType}
        feeId={paymentModal.feeId}
        pendingFees={pendingFeesForModal}
        breakdown={paymentModal.breakdown}
        onPaymentComplete={handlePaymentComplete}
      />
    </DashboardLayout>
  );
}
