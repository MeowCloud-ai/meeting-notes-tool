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
const mockRpc = vi.mocked(supabase.rpc);

function mockProfileSelect(data: Record<string, unknown> | null, error: Record<string, unknown> | null = null) {
  mockFrom.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data, error }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
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
    mockProfileSelect({
      plan_type: 'free',
      monthly_recording_count: 0,
      monthly_reset_at: futureReset,
    });
  });

  describe('getUsage', () => {
    it('returns usage for free plan', async () => {
      const usage = await manager.getUsage(userId);
      expect(usage.used).toBe(0);
      expect(usage.limit).toBe(3);
    });

    it('returns usage for starter plan', async () => {
      mockProfileSelect({
        plan_type: 'starter',
        monthly_recording_count: 5,
        monthly_reset_at: futureReset,
      });

      const usage = await manager.getUsage(userId);
      expect(usage.used).toBe(5);
      expect(usage.limit).toBe(30);
    });

    it('throws on error', async () => {
      mockProfileSelect(null, { message: 'Not found' });
      await expect(manager.getUsage(userId)).rejects.toThrow('Failed to get usage');
    });
  });

  describe('canRecord', () => {
    it('allows recording when under limit', async () => {
      const result = await manager.canRecord(userId);
      expect(result.allowed).toBe(true);
    });

    it('blocks at limit (3/3)', async () => {
      mockProfileSelect({
        plan_type: 'free',
        monthly_recording_count: 3,
        monthly_reset_at: futureReset,
      });

      const result = await manager.canRecord(userId);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('額度已用完');
    });
  });

  describe('incrementUsage', () => {
    it('calls RPC to increment', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null } as ReturnType<typeof mockRpc> extends Promise<infer T> ? T : never);

      await manager.incrementUsage(userId);
      expect(mockRpc).toHaveBeenCalledWith('increment_recording_count', { p_user_id: userId });
    });

    it('falls back on RPC error', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'Not found' } } as ReturnType<typeof mockRpc> extends Promise<infer T> ? T : never);

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { monthly_recording_count: 2, monthly_reset_at: futureReset },
              error: null,
            }),
          }),
        }),
        update: mockUpdate,
      } as ReturnType<typeof mockFrom>);

      await manager.incrementUsage(userId);
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('monthly reset', () => {
    it('resets count when past reset date', async () => {
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
