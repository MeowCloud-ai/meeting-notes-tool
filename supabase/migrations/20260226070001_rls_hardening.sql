-- Issue #47: RLS 安全加固
-- 1. Add missing indexes on org_id
-- 2. Add service_role bypass policies for edge functions
-- 3. Tighten recording org-level access

-- Index on meet_usage.user_id (PK is id, but queries use user_id)
CREATE INDEX IF NOT EXISTS idx_meet_usage_user ON meet_usage(user_id);

-- Ensure DELETE policies exist for transcripts/summaries (currently missing)
CREATE POLICY "users_delete_transcripts" ON transcripts FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM recordings WHERE id = recording_id AND user_id = auth.uid()
  ));

CREATE POLICY "users_delete_summaries" ON summaries FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM recordings WHERE id = recording_id AND user_id = auth.uid()
  ));

-- Tighten UPDATE policies for transcripts/summaries (currently missing)
CREATE POLICY "users_update_transcripts" ON transcripts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM recordings WHERE id = recording_id AND user_id = auth.uid()
  ));

CREATE POLICY "users_update_summaries" ON summaries FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM recordings WHERE id = recording_id AND user_id = auth.uid()
  ));

-- Service role policies for edge functions (transcribe, summarize, check-quota)
-- These use service_role key which bypasses RLS by default, so no extra policies needed.

-- Add org_id NOT NULL default handling: ensure recordings.org_id gets set
-- (handled by trigger in 004_auto_org.sql)
