export type PlanType = 'free' | 'starter' | 'pro' | 'business';

export type RecordingStatus =
  | 'recording'
  | 'uploading'
  | 'transcribing'
  | 'summarizing'
  | 'completed'
  | 'failed';

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  plan_type: PlanType;
  monthly_recording_count: number;
  monthly_reset_at: string;
  created_at: string;
  updated_at: string;
}

export interface Recording {
  id: string;
  user_id: string;
  title: string;
  duration_seconds: number | null;
  status: RecordingStatus;
  segment_count: number;
  tab_url: string | null;
  tab_title: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface Speaker {
  id: string;
  name: string;
}

export interface Transcript {
  id: string;
  recording_id: string;
  content: string;
  speakers: Speaker[];
  language: string;
  word_count: number | null;
  created_at: string;
}

export interface ActionItem {
  text: string;
  assignee: string | null;
  due_date: string | null;
}

export interface KeyDialogue {
  speaker: string;
  text: string;
  timestamp_seconds: number | null;
}

export interface Summary {
  id: string;
  recording_id: string;
  highlights: string[];
  action_items: ActionItem[];
  key_dialogues: KeyDialogue[];
  raw_summary: string | null;
  model: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at' | 'monthly_reset_at'> &
          Partial<Pick<Profile, 'created_at' | 'updated_at' | 'monthly_reset_at'>>;
        Update: Partial<Omit<Profile, 'id'>>;
      };
      recordings: {
        Row: Recording;
        Insert: Omit<Recording, 'id' | 'created_at'> &
          Partial<Pick<Recording, 'id' | 'created_at'>>;
        Update: Partial<Omit<Recording, 'id'>>;
      };
      transcripts: {
        Row: Transcript;
        Insert: Omit<Transcript, 'id' | 'created_at'> &
          Partial<Pick<Transcript, 'id' | 'created_at'>>;
        Update: Partial<Omit<Transcript, 'id'>>;
      };
      summaries: {
        Row: Summary;
        Insert: Omit<Summary, 'id' | 'created_at'> &
          Partial<Pick<Summary, 'id' | 'created_at'>>;
        Update: Partial<Omit<Summary, 'id'>>;
      };
    };
  };
}
