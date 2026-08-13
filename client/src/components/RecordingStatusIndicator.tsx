import { cn, formatElapsed } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import type { RecorderStatus } from '@/hooks/useAudioRecorder';

interface RecordingStatusIndicatorProps {
  status: RecorderStatus;
  elapsedMs: number;
}

const ANNOUNCEMENTS: Record<RecorderStatus, string> = {
  idle: 'Ready to record.',
  recording: 'Recording started.',
  paused: 'Recording paused.',
  stopped: 'Recording stopped.',
};

export function RecordingStatusIndicator({
  status,
  elapsedMs,
}: RecordingStatusIndicatorProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isLive = status === 'recording' || status === 'paused';
  const pulsing = status === 'recording' && !prefersReducedMotion;

  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          'h-[10px] w-[10px] shrink-0 rounded-full',
          isLive ? 'bg-studio-crimson' : 'bg-muted',
          pulsing && 'animate-recording-pulse',
        )}
        aria-hidden="true"
      />
      <span className="text-title font-medium tabular-nums text-ink">
        {formatElapsed(elapsedMs)}
      </span>
      <span className="sr-only" role="status">
        {ANNOUNCEMENTS[status]}
      </span>
    </div>
  );
}
