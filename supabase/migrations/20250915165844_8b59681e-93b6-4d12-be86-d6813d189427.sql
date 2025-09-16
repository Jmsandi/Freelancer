-- Fix RLS policies for user_roles table
CREATE POLICY "Users can view their own role" 
ON public.user_roles FOR SELECT 
USING (auth.uid() = user_id);

-- Only admins can modify roles
CREATE POLICY "Admins can manage user roles" 
ON public.user_roles FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));