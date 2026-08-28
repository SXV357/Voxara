import type { Transcript } from '@/types';

interface TranscriptViewProps {
  transcript: Transcript;
}

const WORDS_PER_GROUP = 12;

function chunk<T>(items: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    groups.push(items.slice(i, i + size));
  }
  return groups;
}

function formatTimestamp(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const wholeSeconds = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${wholeSeconds}`;
}

export function TranscriptView({ transcript }: TranscriptViewProps) {
  const groups = chunk(transcript.words, WORDS_PER_GROUP);

  return (
    <div className="flex max-w-[70ch] flex-col gap-5 rounded-card bg-studio-surface p-5">
      {groups.map((group, i) => (
        <div key={i}>
          <p className="mb-1 text-label text-muted">{formatTimestamp(group[0].start)}</p>
          <p className="text-body text-ink">{group.map((w) => w.word).join(' ')}</p>
        </div>
      ))}
    </div>
  );
}
