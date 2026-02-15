-- Create organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create memberships table
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'staff')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Add sharing column to consultations
ALTER TABLE consultations 
ADD COLUMN is_shared_with_shop BOOLEAN DEFAULT false;

-- Add RLS policies

-- Organizations: Everyone can read their own organization
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own organization" 
    ON organizations FOR SELECT 
    USING (
        id IN (
            SELECT organization_id FROM memberships WHERE user_id = auth.uid()
        )
        OR owner_id = auth.uid()
    );

CREATE POLICY "Owners can update their organization" 
    ON organizations FOR UPDATE
    USING (owner_id = auth.uid());

-- Memberships: Users can view members of their organization
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view members of their organization" 
    ON memberships FOR SELECT 
    USING (
        organization_id IN (
            SELECT organization_id FROM memberships WHERE user_id = auth.uid()
        )
    );

-- Consultations: Shared consultations are visible to organization members
CREATE POLICY "Users can view shared consultations in their organization" 
    ON consultations FOR SELECT 
    USING (
        is_shared_with_shop = true 
        AND 
        designer_id IN (
            SELECT user_id FROM memberships 
            WHERE organization_id IN (
                SELECT organization_id FROM memberships WHERE user_id = auth.uid()
            )
        )
    );

-- Indexes for performance
CREATE INDEX idx_memberships_user ON memberships(user_id);
CREATE INDEX idx_memberships_org ON memberships(organization_id);
CREATE INDEX idx_consultations_shared ON consultations(is_shared_with_shop) WHERE is_shared_with_shop = true;
