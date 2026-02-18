/** Audio segment from chunker */
export interface AudioSegment {
  id: string
  startTime: number
  endTime: number
  filePath: string
  status: 'recording' | 'transcribing' | 'done' | 'error'
  transcript?: string
  speaker?: string
}

/** Meeting session */
export interface MeetingSession {
  id: string
  startedAt: number
  endedAt?: number
  segments: AudioSegment[]
  summary?: MeetingSummary
}

/** AI-generated meeting summary */
export interface MeetingSummary {
  overview: string
  actionItems: ActionItem[]
  decisions: string[]
  keyPoints: string[]
  transcript: TranscriptEntry[]
}

/** Action item from meeting */
export interface ActionItem {
  assignee: string
  task: string
  deadline?: string
  done: boolean
}

/** Transcript entry with speaker */
export interface TranscriptEntry {
  speaker: string
  text: string
  startTime: number
  endTime: number
}

/** Application settings */
export interface AppSettings {
  audioInputDevice: string
  chunkIntervalMinutes: number
  whisperModel: 'tiny' | 'base' | 'small' | 'medium'
  language: string
  googleDocsFolder: string
  emailRecipients: string[]
}
