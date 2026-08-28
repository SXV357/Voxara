import { Badge } from '@/components/ui/badge';
import { humanizeDimension } from '@/lib/utils';
import type { SessionSummary } from '@/types';

interface SessionRowProps {
  session: SessionSummary;
  onClick: (id: string) => void;
}

const PROCESSING_BADGE = 'Reviewing your take…';
const FAILED_LABEL = "Couldn't finish review";
const PROCESSING_PREVIEW = 'Your coach is reviewing this one now…';
const FAILED_PREVIEW = "We weren't able to generate feedback for this one.";

function formatSessionDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function SessionRow({ session, onClick }: SessionRowProps) {
  const previewText =
    session.status === 'complete'
      ? session.feedback_summary
      : session.status === 'processing'
        ? PROCESSING_PREVIEW
        : FAILED_PREVIEW;

  return (
    <button
      type="button"
      onClick={() => onClick(session.id)}
      className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-studio-warm"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-3">
          <span className="truncate text-title font-medium text-ink">
            {session.scenario_title}
          </span>
          {session.status === 'processing' && (
            <Badge className="shrink-0 rounded-pip border-transparent bg-coaching-amber text-label font-medium text-ink hover:bg-coaching-amber">
              {PROCESSING_BADGE}
            </Badge>
          )}
          {session.status === 'failed' && (
            <span className="shrink-0 text-label font-medium text-studio-crimson">
              {FAILED_LABEL}
            </span>
          )}
        </div>
        <p className="line-clamp-1 text-body text-muted">{previewText}</p>
      </div>
      <span className="shrink-0 text-label text-muted">
        {humanizeDimension(session.mode)} · {formatSessionDate(session.created_at)}
      </span>
    </button>
  );
}
