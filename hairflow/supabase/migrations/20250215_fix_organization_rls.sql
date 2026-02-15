-- Allow users to create organizations
CREATE POLICY "Users can create organizations" 
    ON organizations FOR INSERT 
    WITH CHECK (auth.uid() = owner_id);

-- Allow users to join organizations (create memberships)
-- We rely on the API to validate invite codes and business logic
CREATE POLICY "Users can create memberships" 
    ON memberships FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Allow owners to delete members
CREATE POLICY "Owners can remove members" 
    ON memberships FOR DELETE 
    USING (
        organization_id IN (
            SELECT id FROM organizations WHERE owner_id = auth.uid()
        )
    );
