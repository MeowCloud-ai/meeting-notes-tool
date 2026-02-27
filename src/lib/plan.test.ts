import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

import { supabase } from './supabase';
import { PlanManager } from './plan';

const mockFrom = vi.mocked(supabase.from);

function mockUsageSelect(data: Record<string, unknown> | null, error: Record<string, unknown> | null = null) {
  mockFrom.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data, error }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
    upsert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'upsert failed' } }),
      }),
    }),
  } as ReturnType<typeof mockFrom>);
}

describe('PlanManager', () => {
  let manager: PlanManager;
  const userId = 'user-1';
  const futureReset = new Date(Date.now() + 86400000).toISOString();

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new PlanManager();
    mockUsageSelect({
      plan_type: 'free',
      monthly_minutes_used: 0,
      monthly_recording_count: 0,
      monthly_reset_at: futureReset,
    });
  });

  describe('getUsage', () => {
    it('returns usage for free plan (30 min limit)', async () => {
      const usage = await manager.getUsage(userId);
      expect(usage.minutesUsed).toBe(0);
      expect(usage.minutesLimit).toBe(30);
    });

    it('returns usage for starter plan (300 min limit)', async () => {
      mockUsageSelect({
        plan_type: 'starter',
        monthly_minutes_used: 50,
        monthly_recording_count: 5,
        monthly_reset_at: futureReset,
      });

      const usage = await manager.getUsage(userId);
      expect(usage.minutesUsed).toBe(50);
      expect(usage.minutesLimit).toBe(300);
    });

    it('returns defaults when row missing and upsert fails', async () => {
      mockUsageSelect(null, { message: 'Not found' });
      const usage = await manager.getUsage(userId);
      expect(usage.minutesUsed).toBe(0);
      expect(usage.minutesLimit).toBe(30);
    });
  });

  describe('canRecord', () => {
    it('allows recording when under limit', async () => {
      const result = await manager.canRecord(userId);
      expect(result.allowed).toBe(true);
    });

    it('blocks when minutes exhausted (30/30)', async () => {
      mockUsageSelect({
        plan_type: 'free',
        monthly_minutes_used: 30,
        monthly_recording_count: 3,
        monthly_reset_at: futureReset,
      });

      const result = await manager.canRecord(userId);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('時間已用完');
    });
  });

  describe('addMinutes', () => {
    it('adds minutes to usage', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { monthly_minutes_used: 10, monthly_recording_count: 2, monthly_reset_at: futureReset },
              error: null,
            }),
          }),
        }),
        update: mockUpdate,
      } as ReturnType<typeof mockFrom>);

      await manager.addMinutes(userId, 5);
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('monthly reset', () => {
    it('resets when past reset date', async () => {
      const pastReset = new Date(Date.now() - 86400000).toISOString();
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                plan_type: 'free',
                monthly_minutes_used: 25,
                monthly_recording_count: 3,
                monthly_reset_at: pastReset,
              },
              error: null,
            }),
          }),
        }),
        update: mockUpdate,
      } as ReturnType<typeof mockFrom>);

      await manager.getUsage(userId);
      expect(mockUpdate).toHaveBeenCalled();
    });
  });
});
