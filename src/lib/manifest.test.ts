import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

describe('manifest.json', () => {
  const manifestPath = resolve(__dirname, '../../manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

  it('is valid JSON with required fields', () => {
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe('MeowMeet');
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(manifest.description).toBeTruthy();
  });

  it('has required permissions', () => {
    expect(manifest.permissions).toContain('tabCapture');
    expect(manifest.permissions).toContain('storage');
    expect(manifest.permissions).toContain('identity');
    expect(manifest.permissions).toContain('offscreen');
  });

  it('has action with popup', () => {
    expect(manifest.action.default_popup).toBe('popup.html');
  });

  it('has background service worker', () => {
    expect(manifest.background.service_worker).toBeTruthy();
    expect(manifest.background.type).toBe('module');
  });

  it('has all icon sizes', () => {
    for (const size of ['16', '32', '48', '128']) {
      expect(manifest.icons[size]).toBeTruthy();
      const iconPath = resolve(__dirname, '../../', manifest.icons[size]);
      expect(existsSync(iconPath)).toBe(true);
    }
  });

  it('has offline_enabled', () => {
    expect(manifest.offline_enabled).toBe(true);
  });
});
