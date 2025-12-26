import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TransactionTable } from '@/components/dashboard/TransactionTable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  student_name: string;
  student_email: string;
  fee_type: string;
  amount: number;
  paid_at: string;
  receipt_number: string;
  payment_method: string;
  status: string;
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      // Fetch payments with fee info
      const { data, error } = await supabase
        .from('payments')
        .select(`*, fees(fee_type)`)
        .order('paid_at', { ascending: false });

      if (error) throw error;

      // Fetch all profiles to map user_id to names
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email');

      if (profilesError) throw profilesError;

      // Create a map for quick lookup
      const profileMap = new Map(
        (profiles || []).map(p => [p.user_id, { full_name: p.full_name, email: p.email }])
      );

      setTransactions(
        (data || []).map((p: any) => {
          const profile = profileMap.get(p.user_id);
          return {
            id: p.id,
            student_name: profile?.full_name || 'Unknown',
            student_email: profile?.email || 'N/A',
            fee_type: p.fees?.fee_type || 'Fee',
            amount: p.amount,
            paid_at: p.paid_at,
            receipt_number: p.receipt_number,
            payment_method: p.payment_method,
            status: p.status,
          };
        })
      );
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">View all payment transactions and audit logs</p>
        </div>

        <TransactionTable transactions={transactions} loading={loading} />
      </div>
    </DashboardLayout>
  );
}
