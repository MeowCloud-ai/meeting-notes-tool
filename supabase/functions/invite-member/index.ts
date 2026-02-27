import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

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

    const { email, role = 'member' } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email required' }), { status: 400 });
    }

    // Check user is admin of an org
    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!membership) {
      return new Response(JSON.stringify({ error: 'Not an admin' }), { status: 403 });
    }

    // Check if already invited
    const { data: existing } = await supabase
      .from('org_invitations')
      .select('id')
      .eq('org_id', membership.org_id)
      .eq('email', email)
      .eq('status', 'pending')
      .single();

    if (existing) {
      return new Response(JSON.stringify({ error: 'Already invited' }), { status: 409 });
    }

    // Create invitation
    const { data: invitation, error: insertError } = await supabase
      .from('org_invitations')
      .insert({
        org_id: membership.org_id,
        invited_by: user.id,
        email,
        role: role === 'admin' ? 'admin' : 'member',
      })
      .select('id, token, expires_at')
      .single();

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, invitation }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500 }
    );
  }
});
