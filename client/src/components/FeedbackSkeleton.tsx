import { DimensionPips } from '@/components/DimensionPips';
import { cn, humanizeDimension } from '@/lib/utils';

interface FeedbackSkeletonProps {
  dimensions: string[];
  fadeIn: boolean;
}

export function FeedbackSkeleton({ dimensions, fadeIn }: FeedbackSkeletonProps) {
  return (
    <div className={cn('flex flex-col gap-5', fadeIn && 'animate-fade-in')}>
      <section className="rounded-card bg-studio-surface p-5">
        <h2 className="mb-2 text-headline font-semibold text-ink">Summary</h2>
        <p className="max-w-[70ch] text-body text-muted">
          Reviewing your take — this usually takes 20–40 seconds. We're listening for
          pacing, tone, and the moments that stand out.
        </p>
      </section>

      <section className="rounded-card bg-studio-surface p-5">
        <h2 className="mb-4 text-headline font-semibold text-ink">Dimension Scores</h2>
        <div className="flex flex-col gap-3">
          {dimensions.map((dimension) => (
            <div key={dimension} className="flex items-center justify-between gap-4">
              <span className="text-title font-medium text-ink">
                {humanizeDimension(dimension)}
              </span>
              <DimensionPips score={0} />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-card bg-studio-surface p-5">
        <h2 className="mb-2 text-headline font-semibold text-ink">Strengths</h2>
        <p className="text-body text-muted">
          Your strengths will show up here once review wraps up.
        </p>
      </section>

      <section className="rounded-card bg-studio-surface p-5">
        <h2 className="mb-2 text-headline font-semibold text-ink">Growth Areas</h2>
        <p className="text-body text-muted">
          Your growth areas will show up here once review wraps up.
        </p>
      </section>
    </div>
  );
}
