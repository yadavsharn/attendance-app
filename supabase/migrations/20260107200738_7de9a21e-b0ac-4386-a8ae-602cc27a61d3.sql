-- Fix overly permissive RLS policy on attendance_logs
DROP POLICY IF EXISTS "Authenticated users can insert logs" ON public.attendance_logs;

-- Create more restrictive insert policy - only allow inserting logs for the user's own employee record
CREATE POLICY "Users can insert their own attendance logs"
  ON public.attendance_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id = public.get_user_employee_id(auth.uid()) 
    OR public.has_role(auth.uid(), 'admin')
  );