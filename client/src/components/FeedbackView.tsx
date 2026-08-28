import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DimensionPips } from '@/components/DimensionPips';
import { humanizeDimension } from '@/lib/utils';
import type { Feedback } from '@/types';

interface FeedbackViewProps {
  feedback: Feedback;
}

export function FeedbackView({ feedback }: FeedbackViewProps) {
  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-card bg-studio-surface p-5">
        <h2 className="mb-2 text-headline font-semibold text-ink">Summary</h2>
        <p className="max-w-[70ch] text-body text-ink">{feedback.summary}</p>
      </section>

      <section className="rounded-card bg-studio-surface p-5">
        <h2 className="mb-4 text-headline font-semibold text-ink">Dimension Scores</h2>
        <div className="flex flex-col gap-4">
          {feedback.dimensions.map((dim) => (
            <div key={dim.dimension} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-4">
                <span className="text-title font-medium text-ink">
                  {humanizeDimension(dim.dimension)}
                </span>
                <DimensionPips score={dim.score} />
              </div>
              <p className="max-w-[70ch] text-body text-muted">{dim.rationale}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-card bg-studio-surface p-5">
        <h2 className="mb-3 text-headline font-semibold text-ink">Strengths</h2>
        <ul className="flex flex-col gap-2">
          {feedback.strengths.map((strength, i) => (
            <li key={i} className="flex items-start gap-2 text-body text-ink">
              <Check className="mt-0.5 size-4 shrink-0 text-studio-crimson" aria-hidden="true" />
              {strength}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-card bg-studio-surface p-5">
        <h2 className="mb-3 text-headline font-semibold text-ink">Growth Areas</h2>
        <div className="flex flex-col gap-4">
          {feedback.growth_areas.map((area, i) => (
            <div key={i} className="flex flex-col gap-2">
              <p className="text-body text-ink">{area.issue}</p>
              <Badge className="w-fit rounded-pip border-transparent bg-coaching-amber text-label font-medium text-ink hover:bg-coaching-amber">
                {area.where}
              </Badge>
              <p className="max-w-[70ch] text-body text-muted">{area.suggestion}</p>
            </div>
          ))}
        </div>
      </section>

      {feedback.pronunciation_notes && (
        <section className="rounded-card bg-studio-surface p-5">
          <h2 className="mb-2 text-headline font-semibold text-ink">
            Pronunciation &amp; Mic Notes
          </h2>
          <p className="max-w-[70ch] text-body text-ink">{feedback.pronunciation_notes}</p>
        </section>
      )}
    </div>
  );
}
