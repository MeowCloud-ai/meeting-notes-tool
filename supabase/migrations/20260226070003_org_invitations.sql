-- Issue #45: 團隊邀請機制

CREATE TABLE IF NOT EXISTS org_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(org_id, email, status)
);

ALTER TABLE org_invitations ENABLE ROW LEVEL SECURITY;

-- Admins can view invitations for their org
CREATE POLICY "admins_view_invitations" ON org_invitations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM org_members
    WHERE org_members.org_id = org_invitations.org_id
    AND org_members.user_id = auth.uid()
    AND org_members.role = 'admin'
  ));

-- Admins can insert invitations
CREATE POLICY "admins_insert_invitations" ON org_invitations FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM org_members
    WHERE org_members.org_id = org_invitations.org_id
    AND org_members.user_id = auth.uid()
    AND org_members.role = 'admin'
  ));

-- Admins can update (cancel) invitations
CREATE POLICY "admins_update_invitations" ON org_invitations FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM org_members
    WHERE org_members.org_id = org_invitations.org_id
    AND org_members.user_id = auth.uid()
    AND org_members.role = 'admin'
  ));

-- Index
CREATE INDEX IF NOT EXISTS idx_org_invitations_email ON org_invitations(email);
CREATE INDEX IF NOT EXISTS idx_org_invitations_token ON org_invitations(token);
CREATE INDEX IF NOT EXISTS idx_org_invitations_org ON org_invitations(org_id);

-- Function to accept invite (called by edge function)
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token UUID, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_invite RECORD;
  v_result JSON;
BEGIN
  SELECT * INTO v_invite FROM org_invitations
  WHERE token = p_token AND status = 'pending' AND expires_at > now();

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Invalid or expired invitation');
  END IF;

  -- Check if user already in org
  IF EXISTS (SELECT 1 FROM org_members WHERE org_id = v_invite.org_id AND user_id = p_user_id) THEN
    UPDATE org_invitations SET status = 'accepted', accepted_at = now() WHERE id = v_invite.id;
    RETURN json_build_object('success', true, 'org_id', v_invite.org_id, 'already_member', true);
  END IF;

  -- Add to org
  INSERT INTO org_members (org_id, user_id, role)
  VALUES (v_invite.org_id, p_user_id, v_invite.role);

  -- Update invitation
  UPDATE org_invitations SET status = 'accepted', accepted_at = now() WHERE id = v_invite.id;

  -- Update user app_metadata
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('org_id', v_invite.org_id::text)
  WHERE id = p_user_id;

  RETURN json_build_object('success', true, 'org_id', v_invite.org_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
