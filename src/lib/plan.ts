import { supabase } from './supabase';

export interface Usage {
  used: number;
  limit: number;
  resetAt: Date;
}

export interface CanRecordResult {
  allowed: boolean;
  reason?: string;
  usage: Usage;
}

const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  starter: 30,
  pro: 100,
  business: 9999,
};

export class PlanManager {
  async canRecord(userId: string): Promise<CanRecordResult> {
    const usage = await this.getUsage(userId);

    if (usage.used >= usage.limit) {
      return {
        allowed: false,
        reason: '本月錄音額度已用完，請升級方案',
        usage,
      };
    }

    return { allowed: true, usage };
  }

  async incrementUsage(userId: string): Promise<void> {
    // Reset if needed first
    await this.maybeResetMonthly(userId);

    const { error } = await supabase.rpc('increment_recording_count', {
      p_user_id: userId,
    });

    // Fallback if RPC not available
    if (error) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('monthly_recording_count')
        .eq('id', userId)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            monthly_recording_count: profile.monthly_recording_count + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      }
    }
  }

  async getUsage(userId: string): Promise<Usage> {
    await this.maybeResetMonthly(userId);

    const { data, error } = await supabase
      .from('profiles')
      .select('plan_type, monthly_recording_count, monthly_reset_at')
      .eq('id', userId)
      .single();

    if (error || !data) {
      throw new Error(`Failed to get usage: ${error?.message}`);
    }

    const limit = PLAN_LIMITS[data.plan_type] ?? 3;

    return {
      used: data.monthly_recording_count,
      limit,
      resetAt: new Date(data.monthly_reset_at),
    };
  }

  private async maybeResetMonthly(userId: string): Promise<void> {
    const { data } = await supabase
      .from('profiles')
      .select('monthly_reset_at')
      .eq('id', userId)
      .single();

    if (!data) return;

    const resetAt = new Date(data.monthly_reset_at);
    const now = new Date();

    if (now >= resetAt) {
      // Calculate next reset: first day of next month
      const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      await supabase
        .from('profiles')
        .update({
          monthly_recording_count: 0,
          monthly_reset_at: nextReset.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', userId);
    }
  }
}

export const planManager = new PlanManager();
