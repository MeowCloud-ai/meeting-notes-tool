import { describe, it, expect, vi, beforeEach } from 'vitest';
import { showCompliancePrompt, removeOverlay, resetSkipPreference } from './compliance';

const mockGet = vi.fn();
const mockSet = vi.fn();
const mockRemove = vi.fn();

vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: mockGet,
      set: mockSet,
      remove: mockRemove,
    },
  },
});

describe('compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    mockGet.mockImplementation((_key: string, cb: (result: Record<string, unknown>) => void) => {
      cb({});
    });
  });

  it('shows overlay with prompt text', async () => {
    const promise = showCompliancePrompt();

    expect(document.getElementById('meowmeet-compliance-overlay')).toBeTruthy();
    expect(document.body.textContent).toContain('此通話將被 MeowMeet 錄音');

    // Click confirm to resolve
    document.getElementById('meowmeet-confirm-btn')?.click();
    const result = await promise;
    expect(result).toBe(true);
  });

  it('resolves false on cancel', async () => {
    const promise = showCompliancePrompt();
    document.getElementById('meowmeet-cancel-btn')?.click();
    const result = await promise;
    expect(result).toBe(false);
  });

  it('removes overlay on confirm', async () => {
    const promise = showCompliancePrompt();
    document.getElementById('meowmeet-confirm-btn')?.click();
    await promise;
    expect(document.getElementById('meowmeet-compliance-overlay')).toBeNull();
  });

  it('saves skip preference when checkbox checked', async () => {
    const promise = showCompliancePrompt();
    const checkbox = document.getElementById('meowmeet-skip-checkbox') as HTMLInputElement;
    checkbox.checked = true;
    document.getElementById('meowmeet-confirm-btn')?.click();
    await promise;
    expect(mockSet).toHaveBeenCalledWith({ 'meowmeet-skip-compliance': true });
  });

  it('auto-confirms when skip preference is set', async () => {
    mockGet.mockImplementation((_key: string, cb: (result: Record<string, unknown>) => void) => {
      cb({ 'meowmeet-skip-compliance': true });
    });

    const result = await showCompliancePrompt();
    expect(result).toBe(true);
    expect(document.getElementById('meowmeet-compliance-overlay')).toBeNull();
  });

  it('removeOverlay removes the element', () => {
    const el = document.createElement('div');
    el.id = 'meowmeet-compliance-overlay';
    document.body.appendChild(el);

    removeOverlay();
    expect(document.getElementById('meowmeet-compliance-overlay')).toBeNull();
  });

  it('resetSkipPreference calls storage.remove', () => {
    resetSkipPreference();
    expect(mockRemove).toHaveBeenCalledWith('meowmeet-skip-compliance');
  });
});
