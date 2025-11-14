-- Add communication_link field to projects table
ALTER TABLE projects ADD COLUMN communication_link text;

COMMENT ON COLUMN projects.communication_link IS 'Link for team communication (Discord, Slack, etc.)';