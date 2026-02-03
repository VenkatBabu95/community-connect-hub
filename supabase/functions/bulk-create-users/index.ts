import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify the caller is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if caller is admin
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { users } = await req.json();

    if (!users || !Array.isArray(users) || users.length === 0) {
      return new Response(JSON.stringify({ error: 'Users array required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let created = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const user of users) {
      const { username, password, displayName } = user;

      if (!username || !password) {
        failed++;
        errors.push(`${username || 'unknown'}: Missing credentials`);
        continue;
      }

      const email = `${username.toLowerCase()}@college.local`;

      try {
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

        if (createError) {
          failed++;
          errors.push(`${username}: ${createError.message}`);
          continue;
        }

        // Create profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            user_id: newUser.user.id,
            username: username.toLowerCase(),
            display_name: displayName || null,
          });

        if (profileError) {
          await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
          failed++;
          errors.push(`${username}: Profile creation failed`);
          continue;
        }

        // Create student role
        await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: newUser.user.id,
            role: 'student',
          });

        created++;
      } catch (e) {
        failed++;
        errors.push(`${username}: Unexpected error`);
      }
    }

    return new Response(
      JSON.stringify({ created, failed, errors: errors.slice(0, 10) }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
