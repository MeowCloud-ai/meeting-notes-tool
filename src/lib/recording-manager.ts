import { supabase } from './supabase';
import { SegmentUploader } from './upload';
import { triggerTranscription } from './api';
import type { RecordingStatus } from '../types/database';

export interface RecordingSession {
  recordingId: string;
  segmentCount: number;
  status: RecordingStatus;
}

export class RecordingManager {
  private uploader: SegmentUploader;
  private session: RecordingSession | null = null;

  constructor(userId: string) {
    this.uploader = new SegmentUploader(userId);
  }

  async createRecording(tabUrl: string | null, tabTitle: string | null): Promise<string> {
    const { data, error } = await supabase
      .from('recordings')
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id ?? '',
        title: tabTitle ?? 'Untitled Recording',
        status: 'recording' as RecordingStatus,
        segment_count: 0,
        tab_url: tabUrl,
        tab_title: tabTitle,
        duration_seconds: null,
        completed_at: null,
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create recording: ${error?.message}`);
    }

    this.session = {
      recordingId: data.id,
      segmentCount: 0,
      status: 'recording',
    };

    return data.id;
  }

  async handleSegment(blob: Blob): Promise<void> {
    if (!this.session) throw new Error('No active session');

    const index = this.session.segmentCount;
    this.session.segmentCount++;

    try {
      await this.uploader.uploadSegment(this.session.recordingId, index, blob);
    } catch {
      // Segment was cached in IndexedDB by uploader
    }

    await supabase
      .from('recordings')
      .update({ segment_count: this.session.segmentCount })
      .eq('id', this.session.recordingId);
  }

  async completeRecording(durationSeconds: number): Promise<void> {
    if (!this.session) throw new Error('No active session');

    await supabase
      .from('recordings')
      .update({
        status: 'uploading' as RecordingStatus,
        duration_seconds: durationSeconds,
        completed_at: new Date().toISOString(),
      })
      .eq('id', this.session.recordingId);

    // Flush any cached segments
    try {
      await this.uploader.flushCache();
    } catch {
      // Will retry later
    }

    this.session.status = 'uploading';

    // Auto-trigger transcription after upload
    const recordingId = this.session.recordingId;
    triggerTranscription(recordingId).catch((err) => {
      console.error('Auto-transcription failed:', err);
    });
  }

  async failRecording(reason: string): Promise<void> {
    if (!this.session) return;

    await supabase
      .from('recordings')
      .update({ status: 'failed' as RecordingStatus })
      .eq('id', this.session.recordingId);

    console.error('Recording failed:', reason);
    this.session = null;
  }

  getSession(): RecordingSession | null {
    return this.session ? { ...this.session } : null;
  }
}
