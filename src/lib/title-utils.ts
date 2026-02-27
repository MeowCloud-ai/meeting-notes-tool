/**
 * Derive a meaningful recording title from tab URL and title.
 */

/**
 * Extract a smart title based on the source of the recording.
 *
 * - Google Meet → extract meeting name from page title
 * - LINE → "LINE 通話"
 * - Other → formatted date/time
 */
export function deriveTitle(tabUrl: string | null, tabTitle: string | null): string {
  if (tabUrl && isGoogleMeet(tabUrl)) {
    return extractMeetTitle(tabTitle) ?? formatDateTimeTitle(new Date());
  }

  if (tabUrl && isLineCall(tabUrl)) {
    return 'LINE 通話';
  }

  if (tabUrl && isZoom(tabUrl)) {
    return extractZoomTitle(tabTitle) ?? formatDateTimeTitle(new Date());
  }

  if (tabUrl && isTeams(tabUrl)) {
    return extractTeamsTitle(tabTitle) ?? formatDateTimeTitle(new Date());
  }

  // Fallback: date/time format
  return formatDateTimeTitle(new Date());
}

export function isGoogleMeet(url: string): boolean {
  return /^https:\/\/meet\.google\.com\//.test(url);
}

export function isLineCall(url: string): boolean {
  return /^https:\/\/(call|line)\.line\.me\//.test(url) || /line\.me.*call/i.test(url);
}

export function isZoom(url: string): boolean {
  return /^https:\/\/[a-z0-9-]*\.?zoom\.us\//.test(url);
}

export function isTeams(url: string): boolean {
  return /^https:\/\/teams\.microsoft\.com\//.test(url);
}

/**
 * Google Meet page titles follow pattern: "Meeting Name - Google Meet"
 */
export function extractMeetTitle(tabTitle: string | null): string | null {
  if (!tabTitle) return null;

  // Remove " - Google Meet" suffix
  const cleaned = tabTitle.replace(/\s*[-–—]\s*Google Meet\s*$/i, '').trim();

  // If nothing left or just "Meet", use null
  if (!cleaned || /^(meet|google meet)$/i.test(cleaned)) return null;

  return cleaned;
}

/**
 * Zoom titles: "Meeting Name - Zoom"
 */
export function extractZoomTitle(tabTitle: string | null): string | null {
  if (!tabTitle) return null;
  const cleaned = tabTitle.replace(/\s*[-–—]\s*Zoom\s*$/i, '').trim();
  if (!cleaned || /^zoom$/i.test(cleaned)) return null;
  return cleaned;
}

/**
 * Teams titles: "Meeting Name | Microsoft Teams"
 */
export function extractTeamsTitle(tabTitle: string | null): string | null {
  if (!tabTitle) return null;
  const cleaned = tabTitle.replace(/\s*\|\s*Microsoft Teams\s*$/i, '').trim();
  if (!cleaned || /^microsoft teams$/i.test(cleaned)) return null;
  return cleaned;
}

/**
 * Format a date as a human-readable title in zh-TW locale.
 * e.g., "2026/02/27 21:30 錄音"
 */
export function formatDateTimeTitle(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}/${m}/${d} ${h}:${min} 錄音`;
}
