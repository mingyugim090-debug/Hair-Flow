-- Function to safely find organization by invite code
-- SECURITY DEFINER allows this to run with owner privileges, bypassing RLS
CREATE OR REPLACE FUNCTION get_org_by_invite_code(code text)
RETURNS TABLE (
    id UUID,
    name TEXT
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT id, name
    FROM organizations
    WHERE invite_code = code
    LIMIT 1;
$$;
