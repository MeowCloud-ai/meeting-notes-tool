const INDICATOR_ID = 'meowmeet-recording-indicator';

export function showRecordingIndicator(): void {
  if (document.getElementById(INDICATOR_ID)) return;

  const indicator = document.createElement('div');
  indicator.id = INDICATOR_ID;
  indicator.textContent = '🔴 MeowMeet 錄音中';
  Object.assign(indicator.style, {
    position: 'fixed',
    top: '8px',
    right: '8px',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontFamily: 'system-ui, sans-serif',
    fontWeight: '500',
    zIndex: '2147483647',
    pointerEvents: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  });

  document.body.appendChild(indicator);
}

export function hideRecordingIndicator(): void {
  document.getElementById(INDICATOR_ID)?.remove();
}
