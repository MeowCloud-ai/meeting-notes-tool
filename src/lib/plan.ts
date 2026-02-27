import { supabase } from './supabase';

export interface Usage {
  minutesUsed: number;
  minutesLimit: number;
  recordingCount: number;
  resetAt: Date;
}

export interface CanRecordResult {
  allowed: boolean;
  reason?: string;
  usage: Usage;
}

// Plan limits in MINUTES per month
const PLAN_LIMITS_MINUTES: Record<string, number> = {
  free: 30,
  starter: 300,
  pro: 1500,
  business: 99999,
};

export class PlanManager {
  async canRecord(userId: string): Promise<CanRecordResult> {
    const usage = await this.getUsage(userId);

    if (usage.minutesUsed >= usage.minutesLimit) {
      return {
        allowed: false,
        reason: '本月錄音時間已用完，請升級方案',
        usage,
      };
    }

    return { allowed: true, usage };
  }

  async addMinutes(userId: string, minutes: number): Promise<void> {
    await this.maybeResetMonthly(userId);

    const { data } = await supabase
      .from('meet_usage')
      .select('monthly_minutes_used, monthly_recording_count')
      .eq('user_id', userId)
      .single();

    if (data) {
      await supabase
        .from('meet_usage')
        .update({
          monthly_minutes_used: (data.monthly_minutes_used ?? 0) + minutes,
          monthly_recording_count: data.monthly_recording_count + 1,
        })
        .eq('user_id', userId);
    }
  }

  async getUsage(userId: string): Promise<Usage> {
    await this.maybeResetMonthly(userId);

    let { data, error } = await supabase
      .from('meet_usage')
      .select('plan_type, monthly_minutes_used, monthly_recording_count, monthly_reset_at')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      // Auto-create usage row if missing
      const nextReset = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
      const { data: newData, error: insertErr } = await supabase
        .from('meet_usage')
        .upsert({
          user_id: userId,
          plan_type: 'free',
          monthly_recording_count: 0,
          monthly_minutes_used: 0,
          monthly_reset_at: nextReset.toISOString(),
        }, { onConflict: 'user_id' })
        .select('plan_type, monthly_minutes_used, monthly_recording_count, monthly_reset_at')
        .single();
      if (insertErr || !newData) {
        // Return defaults if all else fails
        return { minutesUsed: 0, minutesLimit: 30, recordingCount: 0, resetAt: nextReset };
      }
      data = newData;
    }

    const limitMinutes = PLAN_LIMITS_MINUTES[data.plan_type] ?? 30;

    return {
      minutesUsed: data.monthly_minutes_used ?? 0,
      minutesLimit: limitMinutes,
      recordingCount: data.monthly_recording_count,
      resetAt: new Date(data.monthly_reset_at),
    };
  }

  private async maybeResetMonthly(userId: string): Promise<void> {
    const { data } = await supabase
      .from('meet_usage')
      .select('monthly_reset_at')
      .eq('user_id', userId)
      .single();

    if (!data) return;

    const resetAt = new Date(data.monthly_reset_at);
    const now = new Date();

    if (now >= resetAt) {
      const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      await supabase
        .from('meet_usage')
        .update({
          monthly_recording_count: 0,
          monthly_minutes_used: 0,
          monthly_reset_at: nextReset.toISOString(),
        })
        .eq('user_id', userId);
    }
  }
}

export const planManager = new PlanManager();
