import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ReceiptTable } from '@/components/dashboard/ReceiptTable';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Payment {
  id: string;
  fee_id: string;
  amount: number;
  paid_at: string;
  receipt_number: string;
  payment_method: string;
  status: string;
  fee_type: string;
  transaction_id: string;
}

export default function Receipts() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user]);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*, fees(fee_type)')
        .eq('user_id', user?.id)
        .order('paid_at', { ascending: false });

      if (error) throw error;
      
      setPayments(
        (data || []).map((p: any) => ({
          id: p.id,
          fee_id: p.fee_id,
          amount: p.amount,
          paid_at: p.paid_at,
          receipt_number: p.receipt_number,
          payment_method: p.payment_method,
          status: p.status,
          fee_type: p.fees?.fee_type || 'Fee',
          transaction_id: p.transaction_id,
        }))
      );
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load receipts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Receipts</h1>
          <p className="text-muted-foreground">View and download your payment receipts</p>
        </div>

        <ReceiptTable payments={payments} loading={loading} />
      </div>
    </DashboardLayout>
  );
}
