import { useEffect, useState } from 'react';
import { DollarSign, Users, AlertCircle, TrendingUp } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { TransactionTable } from '@/components/dashboard/TransactionTable';
import { StatCardSkeleton } from '@/components/ui/skeleton';
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

interface Stats {
  totalRevenue: number;
  pendingDues: number;
  activeStudents: number;
  transactionCount: number;
}

export default function AdminDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    pendingDues: 0,
    activeStudents: 0,
    transactionCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Set up real-time subscription for payments
    const channel = supabase
      .channel('payments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments'
        },
        (payload) => {
          console.log('Real-time update:', payload);
          fetchData(); // Refetch data on any payment change
          if (payload.eventType === 'INSERT') {
            toast.success('New payment received!');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all payments with fee info
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select(`*, fees(fee_type)`)
        .order('paid_at', { ascending: false })
        .limit(50);

      if (paymentsError) throw paymentsError;

      // Fetch all profiles to map user_id to names
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email');

      if (profilesError) throw profilesError;

      // Create a map for quick lookup
      const profileMap = new Map(
        (profiles || []).map(p => [p.user_id, { full_name: p.full_name, email: p.email }])
      );

      // Fetch all fees for pending dues
      const { data: fees, error: feesError } = await supabase
        .from('fees')
        .select('amount, status');

      if (feesError) throw feesError;

      // Fetch student count (only users with student role)
      const { data: studentRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role', 'student');

      if (rolesError) throw rolesError;

      // Calculate stats
      const totalRevenue = (payments || [])
        .filter((p: any) => p.status === 'completed')
        .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

      const pendingDues = (fees || [])
        .filter((f: any) => f.status === 'pending')
        .reduce((sum: number, f: any) => sum + Number(f.amount), 0);

      setStats({
        totalRevenue,
        pendingDues,
        activeStudents: studentRoles?.length || 0,
        transactionCount: payments?.length || 0,
      });

      setTransactions(
        (payments || []).map((p: any) => {
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
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of fee collections and student records</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array(4).fill(0).map((_, i) => <StatCardSkeleton key={i} />)
          ) : (
            <>
              <StatCard
                title="Total Revenue"
                value={`₹${stats.totalRevenue.toLocaleString()}`}
                subtitle="All time collections"
                icon={DollarSign}
                variant="success"
                delay={0}
              />
              <StatCard
                title="Pending Dues"
                value={`₹${stats.pendingDues.toLocaleString()}`}
                subtitle="Outstanding fees"
                icon={AlertCircle}
                variant="pending"
                delay={0.1}
              />
              <StatCard
                title="Active Students"
                value={stats.activeStudents}
                subtitle="Registered students"
                icon={Users}
                variant="primary"
                delay={0.2}
              />
              <StatCard
                title="Transactions"
                value={stats.transactionCount}
                subtitle="Total payments"
                icon={TrendingUp}
                variant="default"
                delay={0.3}
              />
            </>
          )}
        </div>

        {/* Recent Transactions - Real-time */}
        <TransactionTable transactions={transactions} loading={loading} />
      </div>
    </DashboardLayout>
  );
}
