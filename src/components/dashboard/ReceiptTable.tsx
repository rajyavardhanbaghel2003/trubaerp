import { motion } from 'framer-motion';
import { Download, FileText, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { toast } from 'sonner';
import { generateReceiptPDF } from '@/utils/pdfGenerator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

interface Payment {
  id: string;
  fee_id: string;
  fee_type: string;
  amount: number;
  paid_at: string;
  receipt_number: string;
  payment_method: string;
  status: string;
  transaction_id?: string;
}

interface ReceiptTableProps {
  payments: Payment[];
  loading: boolean;
}

export function ReceiptTable({ payments, loading }: ReceiptTableProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filteredPayments = payments.filter(payment =>
    payment.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.fee_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = async (payment: Payment) => {
    setDownloadingId(payment.id);
    
    try {
      // Fetch user profile and fee details
      const [profileResult, feeResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user?.id).maybeSingle(),
        supabase.from('fees').select('*').eq('id', payment.fee_id).maybeSingle(),
      ]);
      
      const profile = profileResult.data;
      const fee = feeResult.data;
      
      generateReceiptPDF({
        receiptNumber: payment.receipt_number,
        studentName: profile?.full_name || 'Student',
        studentId: profile?.student_id || 'N/A',
        email: profile?.email || '',
        department: profile?.department || 'N/A',
        semester: profile?.semester || 1,
        feeType: payment.fee_type,
        amount: payment.amount,
        paymentMethod: payment.payment_method,
        transactionId: payment.transaction_id || payment.id,
        paidAt: payment.paid_at,
        tuitionFee: fee?.tuition_fee || undefined,
        libraryFee: fee?.library_fee || undefined,
        labFee: fee?.lab_fee || undefined,
        otherCharges: fee?.other_charges || undefined,
      });
      
      toast.success('Receipt downloaded successfully!');
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast.error('Failed to generate receipt');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="data-table"
    >
      <div className="p-4 border-b border-border">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Payment History</h3>
            <p className="text-sm text-muted-foreground">View and download your payment receipts</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search receipts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Receipt #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Fee Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Method
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7}>
                    <TableRowSkeleton />
                  </td>
                </tr>
              ))
            ) : filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No receipts found</p>
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment, index) => (
                <motion.tr
                  key={payment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-4">
                    <span className="font-mono text-sm">{payment.receipt_number}</span>
                  </td>
                  <td className="px-4 py-4 font-medium">{payment.fee_type}</td>
                  <td className="px-4 py-4 font-semibold text-primary">
                    ₹{payment.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {formatDate(payment.paid_at)}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground capitalize">
                    {payment.payment_method}
                  </td>
                  <td className="px-4 py-4">
                    <span className="payment-badge-paid">Paid</span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(payment)}
                      disabled={downloadingId === payment.id}
                      className="text-primary hover:text-primary/80"
                    >
                      {downloadingId === payment.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      PDF
                    </Button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
