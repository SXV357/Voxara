import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SessionRow } from '@/components/SessionRow';
import { usePolling } from '@/hooks/usePolling';
import { fetchSessions } from '@/lib/sessionsApi';
import type { SessionSummary } from '@/types';

function hasProcessingSession(sessions: SessionSummary[]): boolean {
  return sessions.some((session) => session.status === 'processing');
}

export function DashboardPage() {
  const navigate = useNavigate();

  const fetcher = useCallback(() => fetchSessions(), []);
  const { data: sessions } = usePolling(fetcher, 5000, hasProcessingSession);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-display font-semibold text-ink">Your Sessions</h1>
        <Button onClick={() => navigate('/voice-acting/scenarios')}>
          New Session
        </Button>
      </div>

      {sessions === null ? null : sessions.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-card bg-studio-surface py-16 text-center">
          <p className="max-w-md text-body text-muted">
            You haven't recorded a session yet. Pick a scenario and give it a
            take — your feedback will show up here.
          </p>
          <Button onClick={() => navigate('/voice-acting/scenarios')}>
            New Session
          </Button>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-input-border/60 rounded-card bg-studio-surface">
          {sessions.map((session) => (
            <SessionRow
              key={session.id}
              session={session}
              onClick={(id) => navigate(`/sessions/${id}/feedback`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
