-- MeowMeet Schema (共用 MeowCRM Supabase: euycsevjwwisgtbmemsx)
-- 不影響 MeowCRM 現有表 (organizations, org_members, customers, contacts, tasks, activities)

-- Recordings
CREATE TABLE IF NOT EXISTS recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Recording',
  duration_seconds INT,
  status TEXT NOT NULL DEFAULT 'recording'
    CHECK (status IN ('recording','uploading','transcribing','summarizing','completed','failed')),
  segment_count INT NOT NULL DEFAULT 0,
  tab_url TEXT,
  tab_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Transcripts
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID REFERENCES recordings(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  speakers JSONB DEFAULT '[]',
  language TEXT NOT NULL DEFAULT 'zh-TW',
  word_count INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Summaries
CREATE TABLE IF NOT EXISTS summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID REFERENCES recordings(id) ON DELETE CASCADE NOT NULL,
  highlights TEXT[] NOT NULL DEFAULT '{}',
  action_items JSONB NOT NULL DEFAULT '[]',
  key_dialogues JSONB NOT NULL DEFAULT '[]',
  raw_summary TEXT,
  model TEXT NOT NULL DEFAULT 'gemini-flash',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Meet Usage (用量追蹤，不建獨立 profiles)
CREATE TABLE IF NOT EXISTS meet_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_type TEXT NOT NULL DEFAULT 'free'
    CHECK (plan_type IN ('free','starter','pro','business')),
  monthly_recording_count INT NOT NULL DEFAULT 0,
  monthly_reset_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE meet_usage ENABLE ROW LEVEL SECURITY;

-- Recordings: 個人 + 同組織可看
CREATE POLICY "users_view_recordings" ON recordings FOR SELECT
  USING (user_id = auth.uid() OR org_id = (auth.jwt()->'app_metadata'->>'org_id')::UUID);
CREATE POLICY "users_insert_recordings" ON recordings FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "users_update_recordings" ON recordings FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "users_delete_recordings" ON recordings FOR DELETE
  USING (user_id = auth.uid());

-- Transcripts: 透過 recording 權限
CREATE POLICY "users_view_transcripts" ON transcripts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM recordings
    WHERE id = recording_id
    AND (user_id = auth.uid() OR org_id = (auth.jwt()->'app_metadata'->>'org_id')::UUID)
  ));
CREATE POLICY "users_insert_transcripts" ON transcripts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM recordings WHERE id = recording_id AND user_id = auth.uid()
  ));

-- Summaries: 透過 recording 權限
CREATE POLICY "users_view_summaries" ON summaries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM recordings
    WHERE id = recording_id
    AND (user_id = auth.uid() OR org_id = (auth.jwt()->'app_metadata'->>'org_id')::UUID)
  ));
CREATE POLICY "users_insert_summaries" ON summaries FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM recordings WHERE id = recording_id AND user_id = auth.uid()
  ));

-- Meet Usage: 自己的
CREATE POLICY "users_view_usage" ON meet_usage FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "users_update_usage" ON meet_usage FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "users_insert_usage" ON meet_usage FOR INSERT WITH CHECK (user_id = auth.uid());

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('recordings', 'recordings', false) ON CONFLICT DO NOTHING;
CREATE POLICY "users_upload_recordings" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "users_view_recordings_storage" ON storage.objects FOR SELECT
  USING (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recordings_user ON recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_recordings_org ON recordings(org_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_recording ON transcripts(recording_id);
CREATE INDEX IF NOT EXISTS idx_summaries_recording ON summaries(recording_id);
