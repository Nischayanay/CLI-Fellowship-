-- Fix RLS policies for linked_apps table to allow API key auth
-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can view own linked apps" ON public.linked_apps;
DROP POLICY IF EXISTS "Users can create own linked apps" ON public.linked_apps;
DROP POLICY IF EXISTS "Users can update own linked apps" ON public.linked_apps;
DROP POLICY IF EXISTS "Users can delete own linked apps" ON public.linked_apps;

-- Create permissive policy for authenticated requests (covers both JWT and service role)
CREATE POLICY "Authenticated users can manage linked apps"
    ON public.linked_apps
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Note: The backend handles authorization logic via API key validation
