import { describe, it, expect } from 'vitest';
import {
  deriveTitle,
  isGoogleMeet,
  isLineCall,
  isZoom,
  isTeams,
  extractMeetTitle,
  extractZoomTitle,
  extractTeamsTitle,
  formatDateTimeTitle,
} from './title-utils';

describe('title-utils', () => {
  describe('isGoogleMeet', () => {
    it('matches meet.google.com', () => {
      expect(isGoogleMeet('https://meet.google.com/abc-defg-hij')).toBe(true);
    });
    it('rejects other URLs', () => {
      expect(isGoogleMeet('https://www.google.com')).toBe(false);
    });
  });

  describe('isLineCall', () => {
    it('matches call.line.me', () => {
      expect(isLineCall('https://call.line.me/123')).toBe(true);
    });
    it('matches line.me with call', () => {
      expect(isLineCall('https://line.me/call/abc')).toBe(true);
    });
    it('rejects other URLs', () => {
      expect(isLineCall('https://www.line.me/en')).toBe(false);
    });
  });

  describe('isZoom', () => {
    it('matches zoom.us', () => {
      expect(isZoom('https://zoom.us/j/123')).toBe(true);
      expect(isZoom('https://us02web.zoom.us/j/123')).toBe(true);
    });
  });

  describe('isTeams', () => {
    it('matches teams.microsoft.com', () => {
      expect(isTeams('https://teams.microsoft.com/l/meetup/123')).toBe(true);
    });
  });

  describe('extractMeetTitle', () => {
    it('extracts title from Google Meet tab title', () => {
      expect(extractMeetTitle('Weekly Standup - Google Meet')).toBe('Weekly Standup');
    });
    it('handles em-dash', () => {
      expect(extractMeetTitle('Sprint Review — Google Meet')).toBe('Sprint Review');
    });
    it('returns null for bare "Meet"', () => {
      expect(extractMeetTitle('Meet')).toBeNull();
      expect(extractMeetTitle('Google Meet')).toBeNull();
    });
    it('returns null for null input', () => {
      expect(extractMeetTitle(null)).toBeNull();
    });
  });

  describe('extractZoomTitle', () => {
    it('extracts title', () => {
      expect(extractZoomTitle('Team Sync - Zoom')).toBe('Team Sync');
    });
    it('returns null for bare Zoom', () => {
      expect(extractZoomTitle('Zoom')).toBeNull();
    });
  });

  describe('extractTeamsTitle', () => {
    it('extracts title', () => {
      expect(extractTeamsTitle('Project Review | Microsoft Teams')).toBe('Project Review');
    });
  });

  describe('formatDateTimeTitle', () => {
    it('formats date correctly', () => {
      const date = new Date(2026, 1, 27, 21, 30);
      expect(formatDateTimeTitle(date)).toBe('2026/02/27 21:30 錄音');
    });
  });

  describe('deriveTitle', () => {
    it('derives Google Meet title', () => {
      expect(
        deriveTitle('https://meet.google.com/abc', 'Design Review - Google Meet'),
      ).toBe('Design Review');
    });

    it('derives LINE title', () => {
      expect(deriveTitle('https://call.line.me/123', 'LINE')).toBe('LINE 通話');
    });

    it('falls back to date/time for unknown URLs', () => {
      const title = deriveTitle('https://example.com', 'Some Page');
      expect(title).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2} 錄音$/);
    });

    it('falls back to date/time for null URL', () => {
      const title = deriveTitle(null, null);
      expect(title).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2} 錄音$/);
    });
  });
});
