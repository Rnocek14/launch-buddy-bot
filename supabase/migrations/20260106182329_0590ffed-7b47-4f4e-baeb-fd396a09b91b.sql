-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Service role can insert discovery metrics" ON public.discovery_metrics;
DROP POLICY IF EXISTS "Admins can view discovery metrics" ON public.discovery_metrics;

-- Recreate the policies
CREATE POLICY "Service role can insert discovery metrics" 
ON public.discovery_metrics 
FOR INSERT 
TO service_role
WITH CHECK (true);

CREATE POLICY "Admins can view discovery metrics" 
ON public.discovery_metrics 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- TASK 2: BUILD ORGANIZATIONS/TEAMS
-- =====================================================

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    industry TEXT,
    employee_count TEXT,
    billing_email TEXT,
    stripe_customer_id TEXT,
    subscription_tier TEXT DEFAULT 'enterprise_starter',
    subscription_status TEXT DEFAULT 'trialing',
    max_seats INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create organization roles enum
DO $$ BEGIN
    CREATE TYPE public.org_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create organization members table
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role org_role NOT NULL DEFAULT 'member',
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(organization_id, user_id)
);

-- Create organization invites table
CREATE TABLE IF NOT EXISTS public.organization_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role org_role NOT NULL DEFAULT 'member',
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(organization_id, email)
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;

-- Helper function to check org membership
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = org_id AND user_id = user_uuid
    )
$$;

-- Helper function to check org admin/owner role
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = org_id 
        AND user_id = user_uuid 
        AND role IN ('owner', 'admin')
    )
$$;

-- Organizations RLS policies
CREATE POLICY "Org members can view their organization" 
ON public.organizations 
FOR SELECT 
TO authenticated
USING (public.is_org_member(id, auth.uid()));

CREATE POLICY "Org admins can update their organization" 
ON public.organizations 
FOR UPDATE 
TO authenticated
USING (public.is_org_admin(id, auth.uid()))
WITH CHECK (public.is_org_admin(id, auth.uid()));

CREATE POLICY "Authenticated users can create organizations" 
ON public.organizations 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Organization members RLS policies
CREATE POLICY "Org members can view team" 
ON public.organization_members 
FOR SELECT 
TO authenticated
USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Org admins can manage members" 
ON public.organization_members 
FOR ALL 
TO authenticated
USING (public.is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Users can insert themselves as owner" 
ON public.organization_members 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid() AND role = 'owner');

-- Organization invites RLS policies
CREATE POLICY "Org admins can manage invites" 
ON public.organization_invites 
FOR ALL 
TO authenticated
USING (public.is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Invited users can view their invite" 
ON public.organization_invites 
FOR SELECT 
TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- =====================================================
-- TASK 3: BULK EMPLOYEE SCANNING
-- =====================================================

-- Create employee scans table for org-level scanning
CREATE TABLE IF NOT EXISTS public.employee_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    employee_email TEXT NOT NULL,
    employee_name TEXT,
    department TEXT,
    scan_status TEXT DEFAULT 'pending',
    services_found INTEGER DEFAULT 0,
    high_risk_services INTEGER DEFAULT 0,
    risk_score INTEGER,
    last_scanned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(organization_id, employee_email)
);

-- Create org scan jobs table
CREATE TABLE IF NOT EXISTS public.org_scan_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    initiated_by UUID NOT NULL REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending',
    total_employees INTEGER DEFAULT 0,
    scanned_employees INTEGER DEFAULT 0,
    failed_scans INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_scan_jobs ENABLE ROW LEVEL SECURITY;

-- Employee scans RLS policies
CREATE POLICY "Org members can view employee scans" 
ON public.employee_scans 
FOR SELECT 
TO authenticated
USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Org admins can manage employee scans" 
ON public.employee_scans 
FOR ALL 
TO authenticated
USING (public.is_org_admin(organization_id, auth.uid()));

-- Org scan jobs RLS policies
CREATE POLICY "Org members can view scan jobs" 
ON public.org_scan_jobs 
FOR SELECT 
TO authenticated
USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Org admins can manage scan jobs" 
ON public.org_scan_jobs 
FOR ALL 
TO authenticated
USING (public.is_org_admin(organization_id, auth.uid()));

-- =====================================================
-- TASK 4: OFFBOARDING AUDIT REPORTS
-- =====================================================

-- Create offboarding reports table
CREATE TABLE IF NOT EXISTS public.offboarding_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    employee_scan_id UUID REFERENCES public.employee_scans(id) ON DELETE SET NULL,
    employee_email TEXT NOT NULL,
    employee_name TEXT,
    department TEXT,
    termination_date DATE,
    generated_by UUID NOT NULL REFERENCES auth.users(id),
    report_data JSONB DEFAULT '{}',
    services_to_revoke JSONB DEFAULT '[]',
    high_priority_count INTEGER DEFAULT 0,
    medium_priority_count INTEGER DEFAULT 0,
    low_priority_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'generated',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.offboarding_reports ENABLE ROW LEVEL SECURITY;

-- Offboarding reports RLS policies
CREATE POLICY "Org members can view offboarding reports" 
ON public.offboarding_reports 
FOR SELECT 
TO authenticated
USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Org admins can manage offboarding reports" 
ON public.offboarding_reports 
FOR ALL 
TO authenticated
USING (public.is_org_admin(organization_id, auth.uid()));

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_organization_members_updated_at ON public.organization_members;
CREATE TRIGGER update_organization_members_updated_at
BEFORE UPDATE ON public.organization_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_employee_scans_updated_at ON public.employee_scans;
CREATE TRIGGER update_employee_scans_updated_at
BEFORE UPDATE ON public.employee_scans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_org_scan_jobs_updated_at ON public.org_scan_jobs;
CREATE TRIGGER update_org_scan_jobs_updated_at
BEFORE UPDATE ON public.org_scan_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_offboarding_reports_updated_at ON public.offboarding_reports;
CREATE TRIGGER update_offboarding_reports_updated_at
BEFORE UPDATE ON public.offboarding_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_employee_scans_org_id ON public.employee_scans(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_scan_jobs_org_id ON public.org_scan_jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_offboarding_reports_org_id ON public.offboarding_reports(organization_id);