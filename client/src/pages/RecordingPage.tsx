import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Mic, Pause, Play, RotateCcw, Square } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useAudioRecorder, type RecorderError } from '@/hooks/useAudioRecorder';
import { RecordingStatusIndicator } from '@/components/RecordingStatusIndicator';
import { WaveformCarousel } from '@/components/WaveformCarousel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, humanizeDimension } from '@/lib/utils';
import type { Scenario, VoiceActingProfile } from '@/types';

type PageStatus = 'loading' | 'ready' | 'not-found' | 'error';
type SubmitStatus = 'idle' | 'submitting' | 'error';

const MIN_PANEL_WIDTH = 380;
const MAX_PANEL_WIDTH = 480;
const DEFAULT_PANEL_WIDTH = 420;

const ERROR_COPY: Record<RecorderError, string> = {
  'permission-denied':
    "Voxara needs mic access to record. Allow it in your browser's address bar, then try again.",
  'no-device': 'No microphone found. Connect one and try again.',
  unsupported:
    "This browser doesn't support in-app recording. Try the latest Chrome, Firefox, or Safari.",
  unknown: 'Something went wrong starting the recording. Try again.',
};

export function RecordingPage() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const { user, session } = useAuth();
  const navigate = useNavigate();

  const [pageStatus, setPageStatus] = useState<PageStatus>('loading');
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [goals, setGoals] = useState('');
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
  const [isDragging, setIsDragging] = useState(false);

  const recorder = useAudioRecorder();

  function handleDividerPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
  }

  function handleDividerPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) return;
    const containerLeft =
      e.currentTarget.parentElement?.getBoundingClientRect().left ?? 0;
    const next = e.clientX - containerLeft;
    setPanelWidth(Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, next)));
  }

  function handleDividerPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);
  }

  useEffect(() => {
    if (!session || !scenarioId) return;
    let cancelled = false;
    setPageStatus('loading');

    fetch(`/api/scenarios/${scenarioId}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((res) => {
        if (cancelled) return null;
        if (res.status === 404) {
          setPageStatus('not-found');
          return null;
        }
        if (!res.ok) {
          setPageStatus('error');
          return null;
        }
        return res.json() as Promise<Scenario>;
      })
      .then((data) => {
        if (cancelled || !data) return;
        setScenario(data);
        setPageStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setPageStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [session, scenarioId]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('voice_acting_profile')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        const profile = data?.voice_acting_profile as VoiceActingProfile | null;
        setGoals(profile?.goals ?? '');
      });
  }, [user]);

  async function handleSubmit() {
    if (!recorder.audioBlob || !session || !scenarioId) return;
    setSubmitStatus('submitting');

    try {
      const formData = new FormData();
      formData.append('audio', recorder.audioBlob, 'recording.webm');
      formData.append('scenario_id', scenarioId);

      const res = await fetch('/api/sessions/voice-acting', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });

      if (!res.ok) {
        setSubmitStatus('error');
        return;
      }

      const data: { session_id: string } = await res.json();
      navigate(`/sessions/${data.session_id}/feedback`);
    } catch {
      setSubmitStatus('error');
    }
  }

  function handleReRecord() {
    setSubmitStatus('idle');
    recorder.reset();
  }

  if (pageStatus === 'loading') return null;

  if (pageStatus === 'not-found' || pageStatus === 'error') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-headline font-semibold text-ink">
          {pageStatus === 'not-found'
            ? "This scenario doesn't exist."
            : 'Something went wrong loading this scenario.'}
        </p>
        <Button
          variant="outline"
          onClick={() => navigate('/voice-acting/scenarios')}
        >
          Back to scenarios
        </Button>
      </div>
    );
  }

  if (!scenario) return null;

  return (
    <div
      className={cn(
        'flex h-full',
        isDragging && 'cursor-col-resize select-none',
      )}
    >
      <section
        style={{ width: panelWidth }}
        className="shrink-0 overflow-y-auto p-8"
      >
        <h1
          className="mb-4 text-display font-semibold text-ink"
          style={{ textWrap: 'balance' }}
        >
          {scenario.title}
        </h1>

        <div className="mb-6 flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {scenario.dimensions.map((dimension) => (
              <Badge
                key={dimension}
                className="rounded-pip border-transparent bg-coaching-amber text-label font-medium text-ink hover:bg-coaching-amber"
              >
                {humanizeDimension(dimension)}
              </Badge>
            ))}
          </div>
          {goals && <p className="text-body text-muted">Your goal: {goals}</p>}
        </div>

        <p className="mb-6 text-body text-ink">{scenario.context}</p>

        <h2 className="mb-2 text-title font-medium text-ink">Script</h2>
        <div className="whitespace-pre-wrap rounded-card bg-studio-surface p-5 text-body text-ink">
          {scenario.script}
        </div>
      </section>

      <div
        onPointerDown={handleDividerPointerDown}
        onPointerMove={handleDividerPointerMove}
        onPointerUp={handleDividerPointerUp}
        className="group relative w-[10px] shrink-0 cursor-col-resize select-none"
      >
        <div className="mx-auto h-full w-px bg-input-border/60 transition-colors group-hover:bg-ink/40" />
      </div>

      <section className="flex min-w-0 flex-1 flex-col items-center justify-center gap-8 overflow-y-auto p-8">
        {recorder.error && (
          <div className="flex flex-col items-center gap-4 text-center">
            <p role="alert" className="max-w-sm text-body text-studio-crimson">
              {ERROR_COPY[recorder.error]}
            </p>
            {recorder.error !== 'unsupported' && (
              <Button variant="outline" onClick={recorder.start}>
                Try Again
              </Button>
            )}
          </div>
        )}

        {!recorder.error && recorder.status !== 'stopped' && (
          <>
            <RecordingStatusIndicator
              status={recorder.status}
              elapsedMs={recorder.elapsedMs}
            />

            <div className="h-16 w-full max-w-md">
              {(recorder.status === 'recording' ||
                recorder.status === 'paused') && (
                <WaveformCarousel
                  stream={recorder.stream}
                  active={recorder.status === 'recording'}
                  className="h-full"
                />
              )}
            </div>

            <div className="flex items-center gap-3">
              {recorder.status === 'idle' && (
                <Button size="lg" onClick={recorder.start}>
                  <Mic /> Start Recording
                </Button>
              )}
              {recorder.status === 'recording' && (
                <>
                  <Button size="lg" variant="outline" onClick={recorder.pause}>
                    <Pause /> Pause
                  </Button>
                  <Button size="lg" onClick={recorder.stop}>
                    <Square /> Stop
                  </Button>
                </>
              )}
              {recorder.status === 'paused' && (
                <>
                  <Button size="lg" onClick={recorder.resume}>
                    <Play /> Resume
                  </Button>
                  <Button size="lg" variant="outline" onClick={recorder.stop}>
                    <Square /> Stop
                  </Button>
                </>
              )}
            </div>
          </>
        )}

        {!recorder.error &&
          recorder.status === 'stopped' &&
          recorder.audioUrl && (
            <div className="flex w-full max-w-md flex-col items-center gap-6">
              <audio className="w-full" controls src={recorder.audioUrl} />

              {submitStatus === 'error' && (
                <p role="alert" className="text-body text-studio-crimson">
                  Something went wrong submitting your recording. Try again.
                </p>
              )}

              {submitStatus === 'submitting' ? (
                <p className="text-body text-muted">
                  Submitting — processing may take 20–40 seconds…
                </p>
              ) : (
                <div className="flex items-center gap-3">
                  <Button size="lg" variant="outline" onClick={handleReRecord}>
                    <RotateCcw /> Re-record
                  </Button>
                  <Button size="lg" onClick={handleSubmit}>
                    Submit for Feedback
                  </Button>
                </div>
              )}
            </div>
          )}
      </section>
    </div>
  );
}
