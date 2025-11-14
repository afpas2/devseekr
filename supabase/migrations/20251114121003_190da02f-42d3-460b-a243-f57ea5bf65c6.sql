-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Project owners can add members" ON project_members;

-- Create a new policy that allows both project owners and users with accepted invitations to add members
CREATE POLICY "Project owners and invited users can add members"
ON project_members
FOR INSERT
WITH CHECK (
  -- Project owners can add anyone
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_members.project_id
    AND projects.owner_id = auth.uid()
  )
  OR
  -- Users can add themselves if they have an accepted invitation
  (
    project_members.user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM project_invitations
      WHERE project_invitations.project_id = project_members.project_id
      AND project_invitations.recipient_id = auth.uid()
      AND project_invitations.status = 'accepted'
    )
  )
);