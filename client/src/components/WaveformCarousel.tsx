import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const BAR_COUNT = 56;
const IDLE_LEVEL = 0.04;

interface WaveformCarouselProps {
  stream: MediaStream | null;
  active: boolean;
  className?: string;
}

// The one deliberate exception to DESIGN.md's "single continuous animation"
// rule — see DESIGN.md's Recording State Indicator section. Gated strictly
// to the active-recording state so it never runs as page decoration.
export function WaveformCarousel({
  stream,
  active,
  className,
}: WaveformCarouselProps) {
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const levelsRef = useRef<number[]>(new Array(BAR_COUNT).fill(IDLE_LEVEL));
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!stream || prefersReducedMotion) return;

    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.6;
    source.connect(analyser);
    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;
    audioCtx.resume().catch(() => {});

    return () => {
      audioCtx.close();
      audioCtxRef.current = null;
      analyserRef.current = null;
    };
  }, [stream, prefersReducedMotion]);

  useEffect(() => {
    const analyser = analyserRef.current;
    if (!active || !analyser || prefersReducedMotion) return;

    const data = new Uint8Array(analyser.fftSize);

    function tick() {
      if (!analyser) return;
      analyser.getByteTimeDomainData(data);

      let sumSquares = 0;
      for (let i = 0; i < data.length; i++) {
        const centered = (data[i] - 128) / 128;
        sumSquares += centered * centered;
      }
      const rms = Math.sqrt(sumSquares / data.length);
      const level = Math.max(IDLE_LEVEL, Math.min(1, rms * 5));

      const levels = levelsRef.current;
      levels.push(level);
      levels.shift();

      levels.forEach((lvl, i) => {
        const bar = barRefs.current[i];
        if (bar) bar.style.height = `${lvl * 100}%`;
      });

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, stream, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return (
      <p className="text-body text-muted" role="status">
        Capturing audio…
      </p>
    );
  }

  return (
    <div
      className={cn('flex h-full items-center gap-[2px]', className)}
      aria-hidden="true"
    >
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            barRefs.current[i] = el;
          }}
          className="min-w-[2px] flex-1 rounded-full bg-studio-crimson/70 transition-[height] duration-75 ease-out"
          style={{ height: `${IDLE_LEVEL * 100}%` }}
        />
      ))}
    </div>
  );
}
