-- Fix infinite recursion in memberships policy

-- 1. Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users can view members of their organization" ON memberships;

-- 2. Create a specific function to get user's organizations
-- SECURITY DEFINER allows this function to run with owner privileges, bypassing RLS recursion
CREATE OR REPLACE FUNCTION get_auth_user_org_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT organization_id FROM memberships WHERE user_id = auth.uid();
$$;

-- 3. Re-create the policy using the security definer function
CREATE POLICY "Users can view members of their organization" 
    ON memberships FOR SELECT 
    USING (
        organization_id IN (SELECT get_auth_user_org_ids())
    );

-- 4. Also fix organizations policy just in case (it was querying memberships directly too)
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;

CREATE POLICY "Users can view their own organization" 
    ON organizations FOR SELECT 
    USING (
        id IN (SELECT get_auth_user_org_ids())
        OR owner_id = auth.uid()
    );
