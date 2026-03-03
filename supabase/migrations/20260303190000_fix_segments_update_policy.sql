-- Fix: allow users to update their own recording segments (status, etc.)
CREATE POLICY "users_update_segments" ON recording_segments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM recordings r WHERE r.id = recording_segments.recording_id
    AND r.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM recordings r WHERE r.id = recording_segments.recording_id
    AND r.user_id = auth.uid()
  ));
