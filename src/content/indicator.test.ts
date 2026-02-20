import { describe, it, expect, beforeEach } from 'vitest';
import { showRecordingIndicator, hideRecordingIndicator } from './indicator';

describe('indicator', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('shows recording indicator', () => {
    showRecordingIndicator();
    const el = document.getElementById('meowmeet-recording-indicator');
    expect(el).toBeTruthy();
    expect(el?.textContent).toContain('MeowMeet 錄音中');
  });

  it('does not duplicate indicator', () => {
    showRecordingIndicator();
    showRecordingIndicator();
    const els = document.querySelectorAll('#meowmeet-recording-indicator');
    expect(els.length).toBe(1);
  });

  it('hides recording indicator', () => {
    showRecordingIndicator();
    hideRecordingIndicator();
    expect(document.getElementById('meowmeet-recording-indicator')).toBeNull();
  });

  it('hides gracefully when not showing', () => {
    hideRecordingIndicator();
    expect(document.getElementById('meowmeet-recording-indicator')).toBeNull();
  });
});
