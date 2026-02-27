-- Issue #44: Google SSO + 自動建組織
-- When a user signs in and has no org, auto-create one and make them admin.
-- This is done via a DB function called from the edge function after sign-in.

CREATE OR REPLACE FUNCTION public.ensure_user_org(p_user_id UUID, p_email TEXT, p_name TEXT)
RETURNS JSON AS $$
DECLARE
  v_org_id UUID;
  v_member_id UUID;
  v_result JSON;
BEGIN
  -- Check if user already has an org membership
  SELECT om.org_id INTO v_org_id
  FROM org_members om
  WHERE om.user_id = p_user_id
  LIMIT 1;

  IF v_org_id IS NOT NULL THEN
    -- Already in an org
    SELECT json_build_object('org_id', v_org_id, 'created', false) INTO v_result;
    RETURN v_result;
  END IF;

  -- Create a new organization
  INSERT INTO organizations (name, owner_id)
  VALUES (COALESCE(p_name, split_part(p_email, '@', 1)) || ' 的團隊', p_user_id)
  RETURNING id INTO v_org_id;

  -- Add user as admin member
  INSERT INTO org_members (org_id, user_id, role)
  VALUES (v_org_id, p_user_id, 'admin')
  RETURNING id INTO v_member_id;

  -- Update user's app_metadata with org_id
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('org_id', v_org_id::text)
  WHERE id = p_user_id;

  SELECT json_build_object('org_id', v_org_id, 'created', true) INTO v_result;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
