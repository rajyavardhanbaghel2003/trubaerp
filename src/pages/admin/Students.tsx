import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentTable } from '@/components/dashboard/StudentTable';
import { AddStudentModal } from '@/components/dashboard/AddStudentModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Student {
  id: string;
  full_name: string;
  email: string;
  student_id: string | null;
  department: string | null;
  semester: number | null;
  phone: string | null;
  total_due: number;
  total_paid: number;
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      // Get all profiles with student role
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Get fees and payments for each student
      const studentsWithData = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: fees } = await supabase
            .from('fees')
            .select('amount, status')
            .eq('user_id', profile.user_id);

          const { data: payments } = await supabase
            .from('payments')
            .select('amount')
            .eq('user_id', profile.user_id)
            .eq('status', 'completed');

          const total_due = (fees || [])
            .filter(f => f.status === 'pending')
            .reduce((sum, f) => sum + Number(f.amount), 0);

          const total_paid = (payments || [])
            .reduce((sum, p) => sum + Number(p.amount), 0);

          return {
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            student_id: profile.student_id,
            department: profile.department,
            semester: profile.semester,
            phone: profile.phone,
            total_due,
            total_paid,
          };
        })
      );

      setStudents(studentsWithData);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-muted-foreground">Manage student records and view fee status</p>
        </div>

        <StudentTable 
          students={students} 
          loading={loading} 
          onAddStudent={() => setShowAddModal(true)}
        />
        
        <AddStudentModal
          open={showAddModal}
          onOpenChange={setShowAddModal}
          onSuccess={fetchStudents}
        />
      </div>
    </DashboardLayout>
  );
}
