-- Recording segments table for per-segment transcription
CREATE TABLE IF NOT EXISTS recording_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID REFERENCES recordings(id) ON DELETE CASCADE NOT NULL,
  segment_index INT NOT NULL,
  storage_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploaded'
    CHECK (status IN ('uploading','uploaded','transcribing','transcribed','failed')),
  transcript_content TEXT,
  speakers JSONB DEFAULT '[]',
  word_count INT,
  last_speaker_id INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  transcribed_at TIMESTAMPTZ,
  UNIQUE(recording_id, segment_index)
);

ALTER TABLE recording_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_segments" ON recording_segments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM recordings r WHERE r.id = recording_segments.recording_id
    AND r.user_id = auth.uid()
  ));

CREATE POLICY "users_insert_segments" ON recording_segments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM recordings r WHERE r.id = recording_segments.recording_id
    AND r.user_id = auth.uid()
  ));

CREATE POLICY "service_role_all_segments" ON recording_segments FOR ALL
  USING (auth.role() = 'service_role');
