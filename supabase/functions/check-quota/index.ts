import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Plan limits in MINUTES per month
const PLAN_LIMITS_MINUTES: Record<string, number> = {
  free: 30,
  starter: 300,
  pro: 1500,
  business: 99999,
};

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { data: usage, error: usageError } = await supabase
      .from('meet_usage')
      .select('plan_type, monthly_minutes_used, monthly_recording_count, monthly_reset_at')
      .eq('user_id', user.id)
      .single();

    if (usageError || !usage) {
      return new Response(JSON.stringify({ error: 'Usage not found' }), { status: 404 });
    }

    // Check if monthly reset needed
    const resetAt = new Date(usage.monthly_reset_at);
    const now = new Date();
    let minutesUsed = usage.monthly_minutes_used ?? 0;

    if (now >= resetAt) {
      const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      await supabase
        .from('meet_usage')
        .update({
          monthly_recording_count: 0,
          monthly_minutes_used: 0,
          monthly_reset_at: nextReset.toISOString(),
        })
        .eq('user_id', user.id);
      minutesUsed = 0;
    }

    const limitMinutes = PLAN_LIMITS_MINUTES[usage.plan_type] ?? 30;
    const allowed = minutesUsed < limitMinutes;

    return new Response(
      JSON.stringify({
        allowed,
        usage: {
          minutesUsed,
          minutesLimit: limitMinutes,
          recordingCount: usage.monthly_recording_count,
          resetAt: resetAt.toISOString(),
        },
        reason: allowed ? undefined : '本月錄音時間已用完，請升級方案',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500 }
    );
  }
});
