import { supabase } from './supabase';
import { SegmentUploader } from './upload';
import { triggerSegmentTranscription, triggerStitchTranscripts } from './api';
import { deriveTitle } from './title-utils';
import type { RecordingStatus } from '../types/database';

export const MAX_RECORDING_DURATION_MS = 60 * 60 * 1000; // 60 minutes
export const DURATION_WARNING_MS = 55 * 60 * 1000; // 55 minutes warning

export interface RecordingSession {
  recordingId: string;
  segmentCount: number;
  status: RecordingStatus;
}

export class RecordingManager {
  private uploader: SegmentUploader;
  private session: RecordingSession | null = null;
  private maxDurationTimer: ReturnType<typeof setTimeout> | null = null;
  private warningTimer: ReturnType<typeof setTimeout> | null = null;
  private onWarningCallback: (() => void) | null = null;
  private onAutoStopCallback: (() => void) | null = null;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.uploader = new SegmentUploader(userId);
  }

  setOnWarning(callback: () => void): void {
    this.onWarningCallback = callback;
  }

  setOnAutoStop(callback: () => void): void {
    this.onAutoStopCallback = callback;
  }

  startDurationTimers(): void {
    this.clearDurationTimers();

    this.warningTimer = setTimeout(() => {
      this.onWarningCallback?.();
    }, DURATION_WARNING_MS);

    this.maxDurationTimer = setTimeout(() => {
      this.onAutoStopCallback?.();
    }, MAX_RECORDING_DURATION_MS);
  }

  clearDurationTimers(): void {
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = null;
    }
  }

  async createRecording(tabUrl: string | null, tabTitle: string | null): Promise<string> {
    const { data, error } = await supabase
      .from('recordings')
      .insert({
        user_id: this.userId,
        title: deriveTitle(tabUrl, tabTitle),
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

  /**
   * Handle a segment that arrives during recording.
   * Uploads to storage, creates a recording_segments row, and triggers per-segment transcription.
   */
  async handleSegment(blob: Blob): Promise<void> {
    if (!this.session) throw new Error('No active session');

    const index = this.session.segmentCount;
    this.session.segmentCount++;

    const storagePath = `${this.userId}/${this.session.recordingId}/segment_${index}.webm`;

    // Insert segment row
    await supabase.from('recording_segments').insert({
      recording_id: this.session.recordingId,
      segment_index: index,
      storage_path: storagePath,
      status: 'uploading',
    });

    try {
      await this.uploader.uploadSegment(this.session.recordingId, index, blob);

      // Mark uploaded
      await supabase
        .from('recording_segments')
        .update({ status: 'uploaded' })
        .eq('recording_id', this.session.recordingId)
        .eq('segment_index', index);

      // Update recording segment count
      await supabase
        .from('recordings')
        .update({ segment_count: this.session.segmentCount })
        .eq('id', this.session.recordingId);

      // Trigger per-segment transcription in background (fire and forget)
      triggerSegmentTranscription(this.session.recordingId, index).catch((err) =>
        console.error(`Segment ${index} transcription trigger failed:`, err),
      );
    } catch {
      // Upload failed — segment is cached in IndexedDB for retry
      await supabase
        .from('recording_segments')
        .update({ status: 'failed' })
        .eq('recording_id', this.session.recordingId)
        .eq('segment_index', index);
    }
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

    // Trigger final stitch — this waits for all segments to be transcribed, then merges
    const recordingId = this.session.recordingId;
    triggerStitchTranscripts(recordingId).catch((err) => {
      console.error('Stitch transcripts failed:', err);
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
