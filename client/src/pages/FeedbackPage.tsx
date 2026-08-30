import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeedbackSkeleton } from '@/components/FeedbackSkeleton';
import { FeedbackView } from '@/components/FeedbackView';
import { TranscriptView } from '@/components/TranscriptView';
import { usePolling } from '@/hooks/usePolling';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { fetchSessionDetail } from '@/lib/sessionsApi';
import type { SessionDetail } from '@/types';

function isProcessing(session: SessionDetail): boolean {
  return session.status === 'processing';
}

export function FeedbackPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const prefersReducedMotion = usePrefersReducedMotion();

  const fetcher = useCallback(() => {
    if (!sessionId) return Promise.reject(new Error('Missing session id'));
    return fetchSessionDetail(sessionId);
  }, [sessionId]);

  const { data: sessionData } = usePolling(fetcher, 3000, isProcessing);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1
          className="text-display font-semibold text-ink"
          style={{ textWrap: 'balance' }}
        >
          {sessionData?.scenario.title ?? 'Your Session'}
        </h1>
        <Button
          variant="outline"
          onClick={() => navigate('/voice-acting/scenarios')}
        >
          New Session
        </Button>
      </div>

      {sessionData?.status === 'failed' ? (
        <div className="flex flex-col items-start gap-4 rounded-card bg-studio-surface p-8">
          <div>
            <h2 className="mb-2 text-headline font-semibold text-ink">
              We hit a snag reviewing this take.
            </h2>
            <p className="max-w-[65ch] text-body text-muted">
              Something interrupted processing on our end — your recording is
              safe, but we weren't able to put feedback together this time. This
              isn't about your performance; it's on us.
            </p>
          </div>
          <Button
            onClick={() =>
              navigate(`/voice-acting/record/${sessionData.scenario.id}`)
            }
          >
            Try Recording Again
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="feedback">
          <TabsList className="mb-6 bg-studio-surface">
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
          </TabsList>

          <TabsContent value="feedback">
            {sessionData?.status === 'complete' && sessionData.feedback ? (
              <FeedbackView feedback={sessionData.feedback} />
            ) : (
              <FeedbackSkeleton
                dimensions={sessionData?.scenario.dimensions ?? []}
                fadeIn={!prefersReducedMotion}
              />
            )}
          </TabsContent>

          <TabsContent value="transcript">
            {sessionData?.status === 'complete' && sessionData.transcript ? (
              <TranscriptView transcript={sessionData.transcript} />
            ) : (
              <p className="text-body text-muted">
                Your transcript will appear here as soon as processing finishes.
              </p>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
