import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  starter: 30,
  pro: 100,
  business: 9999,
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

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('meet_usage')
      .select('plan_type, monthly_recording_count, monthly_reset_at')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404 });
    }

    // Check if monthly reset needed
    const resetAt = new Date(profile.monthly_reset_at);
    const now = new Date();
    let currentCount = profile.monthly_recording_count;

    if (now >= resetAt) {
      const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      await supabase
        .from('meet_usage')
        .update({
          monthly_recording_count: 0,
          monthly_reset_at: nextReset.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', user.id);
      currentCount = 0;
    }

    const limit = PLAN_LIMITS[profile.plan_type] ?? 3;
    const allowed = currentCount < limit;

    return new Response(
      JSON.stringify({
        allowed,
        usage: { used: currentCount, limit, resetAt: resetAt.toISOString() },
        reason: allowed ? undefined : '本月錄音額度已用完',
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
