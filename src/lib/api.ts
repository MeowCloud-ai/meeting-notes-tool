import { supabase } from './supabase';
import type { Transcript, Summary } from '../types/database';

export async function triggerTranscription(recordingId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('transcribe', {
    body: { recordingId },
  });

  if (error) {
    throw new Error(`Transcription failed: ${error.message}`);
  }
}

export async function triggerSummarization(recordingId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('summarize', {
    body: { recordingId },
  });

  if (error) {
    throw new Error(`Summarization failed: ${error.message}`);
  }
}

export async function getTranscript(recordingId: string): Promise<Transcript | null> {
  const { data, error } = await supabase
    .from('transcripts')
    .select('*')
    .eq('recording_id', recordingId)
    .single();

  if (error) return null;
  return data as Transcript;
}

export async function getSummary(recordingId: string): Promise<Summary | null> {
  const { data, error } = await supabase
    .from('summaries')
    .select('*')
    .eq('recording_id', recordingId)
    .single();

  if (error) return null;
  return data as Summary;
}
