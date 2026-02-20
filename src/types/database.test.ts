import { describe, it, expect } from 'vitest';
import type { Profile, Recording, Transcript, Summary, Database } from './database';

describe('Database types', () => {
  it('Profile type has correct shape', () => {
    const profile: Profile = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      display_name: 'Test User',
      plan_type: 'free',
      monthly_recording_count: 0,
      monthly_reset_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };
    expect(profile.plan_type).toBe('free');
  });

  it('Recording type has correct shape', () => {
    const recording: Recording = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      title: 'Test Recording',
      duration_seconds: 300,
      status: 'completed',
      segment_count: 5,
      tab_url: 'https://meet.google.com/abc',
      tab_title: 'Meeting',
      created_at: '2024-01-01T00:00:00Z',
      completed_at: '2024-01-01T00:05:00Z',
    };
    expect(recording.status).toBe('completed');
  });

  it('Transcript type has correct shape', () => {
    const transcript: Transcript = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      recording_id: '123e4567-e89b-12d3-a456-426614174001',
      content: 'Hello world',
      speakers: [{ id: '1', name: 'Speaker 1' }],
      language: 'zh-TW',
      word_count: 2,
      created_at: '2024-01-01T00:00:00Z',
    };
    expect(transcript.language).toBe('zh-TW');
  });

  it('Summary type has correct shape', () => {
    const summary: Summary = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      recording_id: '123e4567-e89b-12d3-a456-426614174001',
      highlights: ['Key point 1'],
      action_items: [{ text: 'Follow up', assignee: null, due_date: null }],
      key_dialogues: [{ speaker: 'Speaker 1', text: 'Important', timestamp_seconds: 60 }],
      raw_summary: 'Summary text',
      model: 'gemini-flash',
      created_at: '2024-01-01T00:00:00Z',
    };
    expect(summary.model).toBe('gemini-flash');
  });

  it('Database type structure is valid', () => {
    const _db: Database['public']['Tables']['profiles']['Row'] = {
      id: '123',
      email: 'test@test.com',
      display_name: null,
      plan_type: 'pro',
      monthly_recording_count: 5,
      monthly_reset_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };
    expect(_db.plan_type).toBe('pro');
  });
});
