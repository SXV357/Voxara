import { cn } from '@/lib/utils';

interface DimensionPipsProps {
  score: number;
}

const PIP_COUNT = 5;

export function DimensionPips({ score }: DimensionPipsProps) {
  return (
    <div className="flex gap-1" role="img" aria-label={`Score ${score} out of ${PIP_COUNT}`}>
      {Array.from({ length: PIP_COUNT }, (_, i) => (
        <span
          key={i}
          className={cn(
            'h-5 w-[5px] rounded-pip',
            i < score ? 'bg-studio-crimson' : 'border border-input-border bg-studio-surface',
          )}
        />
      ))}
    </div>
  );
}
