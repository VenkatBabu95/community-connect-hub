import { supabase } from "@/integrations/supabase/client";

export type AppRole = 'admin' | 'student';

export interface AuthUser {
  id: string;
  email?: string;
  username: string;
  displayName?: string;
  role: AppRole;
}

export async function signIn(username: string, password: string) {
  // Username is used as email format for Supabase auth
  const email = `${username.toLowerCase()}@college.local`;
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name')
    .eq('user_id', user.id)
    .maybeSingle();

  // Get role using RPC
  const { data: role } = await supabase
    .rpc('get_user_role', { _user_id: user.id });

  if (!profile) return null;

  return {
    id: user.id,
    email: user.email,
    username: profile.username,
    displayName: profile.display_name || profile.username,
    role: (role as AppRole) || 'student',
  };
}

export async function updateOnlineStatus(isOnline: boolean) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('profiles')
    .update({ 
      is_online: isOnline, 
      last_seen: new Date().toISOString() 
    })
    .eq('user_id', user.id);
}
