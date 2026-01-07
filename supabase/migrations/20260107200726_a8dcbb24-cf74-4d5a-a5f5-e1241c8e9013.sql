-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'employee');

-- Create employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  date_of_joining DATE NOT NULL DEFAULT CURRENT_DATE,
  azure_face_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for RBAC (security best practice - separate from profile)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day')),
  confidence_score DECIMAL(5,4),
  source TEXT DEFAULT 'face_recognition',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Create attendance_logs table for audit trail
CREATE TABLE public.attendance_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  azure_response JSONB,
  confidence_score DECIMAL(5,4),
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create departments table for normalization
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance_settings table for configurable rules
CREATE TABLE public.attendance_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.attendance_settings (setting_key, setting_value, description) VALUES
  ('work_start_time', '09:00', 'Standard work start time'),
  ('late_threshold_minutes', '15', 'Minutes after work start to mark as late'),
  ('confidence_threshold', '0.6', 'Minimum confidence score for face recognition'),
  ('work_end_time', '18:00', 'Standard work end time');

-- Insert default departments
INSERT INTO public.departments (name, description) VALUES
  ('Engineering', 'Software Development and IT'),
  ('Human Resources', 'HR and People Operations'),
  ('Finance', 'Finance and Accounting'),
  ('Marketing', 'Marketing and Communications'),
  ('Operations', 'Business Operations');

-- Enable RLS on all tables
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_settings ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's employee record
CREATE OR REPLACE FUNCTION public.get_user_employee_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.employees WHERE user_id = _user_id LIMIT 1
$$;

-- RLS Policies for employees
CREATE POLICY "Admins can do everything with employees"
  ON public.employees FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view employees"
  ON public.employees FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Employees can view their own record"
  ON public.employees FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for attendance
CREATE POLICY "Admins can do everything with attendance"
  ON public.attendance FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view all attendance"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Employees can view their own attendance"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (employee_id = public.get_user_employee_id(auth.uid()));

CREATE POLICY "Employees can insert their own attendance"
  ON public.attendance FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = public.get_user_employee_id(auth.uid()));

-- RLS Policies for attendance_logs
CREATE POLICY "Admins can view all logs"
  ON public.attendance_logs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Employees can view their own logs"
  ON public.attendance_logs FOR SELECT
  TO authenticated
  USING (employee_id = public.get_user_employee_id(auth.uid()));

CREATE POLICY "Authenticated users can insert logs"
  ON public.attendance_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for departments (read-only for all authenticated users)
CREATE POLICY "Anyone can view departments"
  ON public.departments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage departments"
  ON public.departments FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for attendance_settings
CREATE POLICY "Anyone can view settings"
  ON public.attendance_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage settings"
  ON public.attendance_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_settings_updated_at
  BEFORE UPDATE ON public.attendance_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();