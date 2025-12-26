-- Fix critical security vulnerability: Users can self-assign admin role

-- Step 1: Drop the dangerous INSERT policy that allows users to insert their own role
DROP POLICY IF EXISTS "Users can insert their own role during signup" ON public.user_roles;

-- Step 2: Update the handle_new_user function to ALWAYS assign 'student' role
-- Never trust user-provided metadata for role assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert profile for new user
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'New User'),
    NEW.email
  );
  
  -- SECURITY FIX: Always assign 'student' role - never trust user metadata
  -- Admin roles must be assigned by existing admins through secure RPC
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$function$;

-- Step 3: Create an admin-only function to change user roles (for future use)
CREATE OR REPLACE FUNCTION public.admin_set_user_role(_target_user_id uuid, _new_role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow admins to call this function
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Only admins can change user roles';
  END IF;
  
  -- Update or insert the role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user_id, _new_role)
  ON CONFLICT (user_id) 
  DO UPDATE SET role = _new_role;
  
  RETURN true;
END;
$function$;