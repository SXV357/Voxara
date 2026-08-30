import { supabase } from '@/lib/supabase';
import type { SessionDetail, SessionSummary } from '@/types';

/**
 * Backend fetchers for the /api/sessions/* pipeline, consumed by DashboardPage
 * and FeedbackPage through usePolling. Return the SessionSummary / SessionDetail
 * shapes from types.ts as-is.
 */

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not authenticated');
  return { Authorization: `Bearer ${token}` };
}

export async function fetchSessions(): Promise<SessionSummary[]> {
  const res = await fetch('/api/sessions/', { headers: await authHeaders() });
  if (!res.ok) throw new Error(`Failed to load sessions (${res.status})`);
  return res.json() as Promise<SessionSummary[]>;
}

export async function fetchSessionDetail(id: string): Promise<SessionDetail> {
  const res = await fetch(`/api/sessions/${id}`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to load session ${id} (${res.status})`);
  return res.json() as Promise<SessionDetail>;
}
