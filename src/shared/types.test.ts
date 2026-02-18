import { describe, it, expect } from 'vitest'
import type { AudioSegment, MeetingSession, AppSettings } from './types'

describe('Type definitions', () => {
  it('should create a valid AudioSegment', () => {
    const segment: AudioSegment = {
      id: 'seg-001',
      startTime: 0,
      endTime: 180000,
      filePath: '/tmp/chunk-001.wav',
      status: 'recording'
    }
    expect(segment.id).toBe('seg-001')
    expect(segment.status).toBe('recording')
  })

  it('should create a valid MeetingSession', () => {
    const session: MeetingSession = {
      id: 'meeting-001',
      startedAt: Date.now(),
      segments: []
    }
    expect(session.segments).toHaveLength(0)
    expect(session.endedAt).toBeUndefined()
  })

  it('should create valid AppSettings with defaults', () => {
    const settings: AppSettings = {
      audioInputDevice: 'BlackHole 2ch',
      chunkIntervalMinutes: 3,
      whisperModel: 'small',
      language: 'zh',
      googleDocsFolder: 'MeowMeet Notes',
      emailRecipients: ['test@example.com']
    }
    expect(settings.chunkIntervalMinutes).toBe(3)
    expect(settings.whisperModel).toBe('small')
  })
})
