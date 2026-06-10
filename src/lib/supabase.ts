// Supabase Cloud Sync
// This provides real-time cloud backup and multi-device sync

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = SUPABASE_URL ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

// Auth functions (email/password)
export async function signUp(email: string, password: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}

// Sync functions
export async function syncToCloud(entries: unknown[], customers: unknown[]) {
  if (!supabase) return false;
  const user = await getCurrentUser();
  if (!user) return false;

  const { error } = await supabase.from('user_data').upsert({
    user_id: user.id,
    entries: JSON.stringify(entries),
    customers: JSON.stringify(customers),
    updated_at: new Date().toISOString(),
  });

  return !error;
}

export async function syncFromCloud(): Promise<{ entries: unknown[]; customers: unknown[] } | null> {
  if (!supabase) return null;
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase.from('user_data')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !data) return null;

  return {
    entries: JSON.parse(data.entries || '[]'),
    customers: JSON.parse(data.customers || '[]'),
  };
}
