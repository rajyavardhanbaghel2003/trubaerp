import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateStudentRequest {
  email: string;
  password: string;
  fullName: string;
  studentId?: string;
  department?: string;
  semester?: number;
  phone?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the requester is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Create client with user's token to verify admin role
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user: requestingUser } } = await userClient.auth.getUser();
    if (!requestingUser) {
      return new Response(
        JSON.stringify({ error: 'Invalid user token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin using the has_role function
    const { data: isAdmin } = await userClient.rpc('has_role', {
      _user_id: requestingUser.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Only admins can create students' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: CreateStudentRequest = await req.json();
    const { email, password, fullName, studentId, department, semester, phone } = body;

    if (!email || !password || !fullName) {
      return new Response(
        JSON.stringify({ error: 'Email, password, and full name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client with service role key (won't affect current session)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Create the user using admin API
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { full_name: fullName }
    });

    if (authError) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newUserId = authData.user.id;

    // Update the profile with additional info (profile is auto-created by trigger)
    // Wait a moment for trigger to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    const { error: profileError } = await adminClient
      .from('profiles')
      .update({
        student_id: studentId || null,
        department: department || null,
        semester: semester || null,
        phone: phone || null,
      })
      .eq('user_id', newUserId);

    if (profileError) {
      console.error('Profile update error:', profileError);
    }

    // Create 8 semester fees (₹80,000 each)
    const currentYear = new Date().getFullYear();
    const semesterFees = [];
    
    for (let sem = 1; sem <= 8; sem++) {
      const academicYear = `${currentYear + Math.floor((sem - 1) / 2)}-${currentYear + Math.floor((sem - 1) / 2) + 1}`;
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + (sem - 1) * 6);
      
      semesterFees.push({
        user_id: newUserId,
        fee_type: `Semester ${sem} Fees`,
        amount: 80000,
        tuition_fee: 60000,
        library_fee: 5000,
        lab_fee: 10000,
        other_charges: 5000,
        semester: sem,
        academic_year: academicYear,
        due_date: dueDate.toISOString().split('T')[0],
        status: 'pending',
      });
    }

    const { error: feesError } = await adminClient.from('fees').insert(semesterFees);
    
    if (feesError) {
      console.error('Fees creation error:', feesError);
      return new Response(
        JSON.stringify({ 
          success: true, 
          userId: newUserId,
          warning: 'Student created but fees could not be assigned'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: newUserId,
        message: 'Student created with 8 semester fees (₹80,000 each)'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
