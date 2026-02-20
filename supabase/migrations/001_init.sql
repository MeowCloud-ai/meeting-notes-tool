-- Users extension (Supabase Auth handles users, this is profile)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text,
  plan_type text not null default 'free' check (plan_type in ('free', 'starter', 'pro', 'business')),
  monthly_recording_count int not null default 0,
  monthly_reset_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recordings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null default 'Untitled Recording',
  duration_seconds int,
  status text not null default 'recording' check (status in ('recording', 'uploading', 'transcribing', 'summarizing', 'completed', 'failed')),
  segment_count int not null default 0,
  tab_url text,
  tab_title text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.transcripts (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid references public.recordings(id) on delete cascade not null,
  content text not null,
  speakers jsonb default '[]',
  language text not null default 'zh-TW',
  word_count int,
  created_at timestamptz not null default now()
);

create table public.summaries (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid references public.recordings(id) on delete cascade not null,
  highlights text[] not null default '{}',
  action_items jsonb not null default '[]',
  key_dialogues jsonb not null default '[]',
  raw_summary text,
  model text not null default 'gemini-flash',
  created_at timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.recordings enable row level security;
alter table public.transcripts enable row level security;
alter table public.summaries enable row level security;

-- Profiles: users can only see/edit their own
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Recordings: users can CRUD their own
create policy "Users can view own recordings" on public.recordings for select using (auth.uid() = user_id);
create policy "Users can insert own recordings" on public.recordings for insert with check (auth.uid() = user_id);
create policy "Users can update own recordings" on public.recordings for update using (auth.uid() = user_id);
create policy "Users can delete own recordings" on public.recordings for delete using (auth.uid() = user_id);

-- Transcripts: through recording ownership
create policy "Users can view own transcripts" on public.transcripts for select using (
  exists (select 1 from public.recordings where id = recording_id and user_id = auth.uid())
);
create policy "Users can insert own transcripts" on public.transcripts for insert with check (
  exists (select 1 from public.recordings where id = recording_id and user_id = auth.uid())
);

-- Summaries: through recording ownership
create policy "Users can view own summaries" on public.summaries for select using (
  exists (select 1 from public.recordings where id = recording_id and user_id = auth.uid())
);
create policy "Users can insert own summaries" on public.summaries for insert with check (
  exists (select 1 from public.recordings where id = recording_id and user_id = auth.uid())
);

-- Storage bucket
insert into storage.buckets (id, name, public) values ('recordings', 'recordings', false);
create policy "Users can upload own recordings" on storage.objects for insert with check (
  bucket_id = 'recordings' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "Users can view own recordings" on storage.objects for select using (
  bucket_id = 'recordings' and auth.uid()::text = (storage.foldername(name))[1]
);
