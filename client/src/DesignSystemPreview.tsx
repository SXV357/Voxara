import { useState, useEffect } from 'react';

const tokens = {
  color: {
    studioCrimson: 'oklch(0.50 0.170 27)',
    coachingAmber: 'oklch(0.68 0.140 72)',
    canvas: 'oklch(0.980 0.008 72)',
    studioSurface: 'oklch(0.945 0.016 72)',
    studioWarm: 'oklch(0.900 0.028 72)',
    ink: 'oklch(0.15 0.025 27)',
    muted: 'oklch(0.50 0.018 27)',
    inputBorder: 'oklch(0.85 0.010 27)',
  },
  spacing: [4, 8, 12, 16, 20, 24, 32, 48, 64],
  radius: { button: '6px', card: '8px', input: '6px' },
  shadow: {
    float: '0 2px 8px oklch(0.15 0.025 27 / 0.08)',
    lift: '0 4px 16px oklch(0.15 0.025 27 / 0.12)',
  },
  transition: '150ms ease-out',
};

const font = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";

const S = {
  page: {
    fontFamily: font,
    background: tokens.color.canvas,
    color: tokens.color.ink,
    minHeight: '100vh',
    padding: '48px 32px',
    maxWidth: '900px',
    margin: '0 auto',
  } as React.CSSProperties,

  sectionGap: { marginBottom: '64px' } as React.CSSProperties,

  sectionLabel: {
    fontFamily: font,
    fontSize: '0.75rem',
    fontWeight: 500,
    letterSpacing: '0.01em',
    color: tokens.color.muted,
    marginBottom: '24px',
    borderBottom: `1px solid ${tokens.color.inputBorder}`,
    paddingBottom: '8px',
  } as React.CSSProperties,

  row: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '16px',
    alignItems: 'flex-start',
  } as React.CSSProperties,
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={S.sectionGap}>
      <div style={S.sectionLabel}>{title}</div>
      {children}
    </div>
  );
}

function TypeScale() {
  const specs = [
    {
      name: 'Display',
      tag: 'h1',
      size: '1.75rem',
      weight: 600,
      lh: 1.2,
      note: '28px · weight 600 · lh 1.2',
    },
    {
      name: 'Headline',
      tag: 'h2',
      size: '1.25rem',
      weight: 600,
      lh: 1.3,
      note: '20px · weight 600 · lh 1.3',
    },
    {
      name: 'Title',
      tag: 'h3',
      size: '1rem',
      weight: 500,
      lh: 1.4,
      note: '16px · weight 500 · lh 1.4',
    },
    {
      name: 'Body',
      tag: 'p',
      size: '0.875rem',
      weight: 400,
      lh: 1.6,
      note: '14px · weight 400 · lh 1.6',
    },
    {
      name: 'Label',
      tag: 'span',
      size: '0.75rem',
      weight: 500,
      lh: 1.4,
      note: '12px · weight 500 · lh 1.4 · ls 0.01em',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {specs.map(({ name, size, weight, lh, note }) => (
        <div
          key={name}
          style={{ display: 'flex', alignItems: 'baseline', gap: '24px' }}
        >
          <div
            style={{
              fontFamily: font,
              fontSize: size,
              fontWeight: weight,
              lineHeight: lh,
              letterSpacing: name === 'Label' ? '0.01em' : undefined,
              color: tokens.color.ink,
              flex: 1,
            }}
          >
            {name === 'Display' && 'Session Feedback — Take 3'}
            {name === 'Headline' && 'Vocal Clarity & Projection'}
            {name === 'Title' && 'Growth Areas'}
            {name === 'Body' &&
              'Your pacing in the final monologue felt rushed — the audience needs space to land with you on that last line. Try a two-beat hold before "and I never looked back."'}
            {name === 'Label' && 'recorded 3 min ago · scene 4'}
          </div>
          <div
            style={{
              fontFamily: font,
              fontSize: '0.75rem',
              color: tokens.color.muted,
              whiteSpace: 'nowrap',
              minWidth: '220px',
            }}
          >
            {name} · {note}
          </div>
        </div>
      ))}
    </div>
  );
}

function ColorPalette() {
  const swatches = [
    {
      name: 'Studio Crimson',
      label: 'Primary',
      value: tokens.color.studioCrimson,
      textColor: 'white',
    },
    {
      name: 'Coaching Amber',
      label: 'Secondary',
      value: tokens.color.coachingAmber,
      textColor: 'white',
    },
    {
      name: 'Canvas',
      label: 'Background',
      value: tokens.color.canvas,
      textColor: tokens.color.ink,
      border: tokens.color.inputBorder,
    },
    {
      name: 'Studio Surface',
      label: 'Card / Panel',
      value: tokens.color.studioSurface,
      textColor: tokens.color.ink,
      border: tokens.color.inputBorder,
    },
    {
      name: 'Studio Warm',
      label: 'Hover / Active',
      value: tokens.color.studioWarm,
      textColor: tokens.color.ink,
      border: tokens.color.inputBorder,
    },
    {
      name: 'Ink',
      label: 'Body Text',
      value: tokens.color.ink,
      textColor: 'white',
    },
    {
      name: 'Muted',
      label: 'Secondary Text',
      value: tokens.color.muted,
      textColor: 'white',
    },
    {
      name: 'Input Border',
      label: 'Field Border',
      value: tokens.color.inputBorder,
      textColor: tokens.color.ink,
    },
  ];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
      {swatches.map(({ name, label, value, textColor, border }) => (
        <div
          key={name}
          style={{
            background: value,
            border: border ? `1px solid ${border}` : undefined,
            borderRadius: '8px',
            padding: '16px',
            minWidth: '140px',
            color: textColor,
          }}
        >
          <div
            style={{
              fontFamily: font,
              fontSize: '0.75rem',
              fontWeight: 500,
              opacity: 0.8,
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontFamily: font,
              fontSize: '0.875rem',
              fontWeight: 600,
              marginTop: '4px',
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontFamily: font,
              fontSize: '0.65rem',
              marginTop: '8px',
              opacity: 0.7,
              wordBreak: 'break-word',
            }}
          >
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

function ButtonVariants() {
  const [hoveredPrimary, setHoveredPrimary] = useState(false);
  const [hoveredGhost, setHoveredGhost] = useState(false);

  const baseBtn: React.CSSProperties = {
    fontFamily: font,
    fontSize: '0.875rem',
    fontWeight: 500,
    padding: '10px 20px',
    borderRadius: tokens.radius.button,
    cursor: 'pointer',
    border: 'none',
    transition: `background ${tokens.transition}`,
    lineHeight: 1.4,
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <button
          style={{
            ...baseBtn,
            background: hoveredPrimary
              ? 'oklch(0.40 0.170 27)'
              : tokens.color.studioCrimson,
            color: 'white',
            outline: 'none',
          }}
          onMouseEnter={() => setHoveredPrimary(true)}
          onMouseLeave={() => setHoveredPrimary(false)}
          onFocus={(e) => {
            (e.target as HTMLElement).style.outline =
              `2px solid ${tokens.color.studioCrimson}`;
            (e.target as HTMLElement).style.outlineOffset = '2px';
          }}
          onBlur={(e) => {
            (e.target as HTMLElement).style.outline = 'none';
          }}
        >
          Start Recording
        </button>
        <span
          style={{
            fontFamily: font,
            fontSize: '0.65rem',
            color: tokens.color.muted,
          }}
        >
          Primary (hover me)
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <button
          style={{
            ...baseBtn,
            background: hoveredGhost ? tokens.color.studioWarm : 'transparent',
            color: tokens.color.ink,
            border: `1px solid ${tokens.color.inputBorder}`,
            transition: `background ${tokens.transition}`,
          }}
          onMouseEnter={() => setHoveredGhost(true)}
          onMouseLeave={() => setHoveredGhost(false)}
        >
          View Details
        </button>
        <span
          style={{
            fontFamily: font,
            fontSize: '0.65rem',
            color: tokens.color.muted,
          }}
        >
          Ghost / Secondary
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <button
          style={{
            ...baseBtn,
            background: tokens.color.studioSurface,
            color: tokens.color.muted,
            border: `1px solid ${tokens.color.inputBorder}`,
            cursor: 'not-allowed',
          }}
          disabled
        >
          Theatre Mode
        </button>
        <span
          style={{
            fontFamily: font,
            fontSize: '0.65rem',
            color: tokens.color.muted,
          }}
        >
          Disabled
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <button
          style={{
            ...baseBtn,
            background: 'transparent',
            padding: 0,
            color: tokens.color.studioCrimson,
            border: 'none',
          }}
          onFocus={(e) => {
            (e.target as HTMLElement).style.outline =
              `2px solid ${tokens.color.studioCrimson}`;
            (e.target as HTMLElement).style.outlineOffset = '2px';
          }}
          onBlur={(e) => {
            (e.target as HTMLElement).style.outline = 'none';
          }}
        >
          Focus me →
        </button>
        <span
          style={{
            fontFamily: font,
            fontSize: '0.65rem',
            color: tokens.color.muted,
          }}
        >
          Focus (tab here)
        </span>
      </div>
    </div>
  );
}

function SampleCard() {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
      {/* Static card */}
      <div
        style={{
          background: tokens.color.studioSurface,
          borderRadius: tokens.radius.card,
          padding: '16px',
          maxWidth: '300px',
        }}
      >
        <div
          style={{
            fontFamily: font,
            fontSize: '1.25rem',
            fontWeight: 600,
            lineHeight: 1.3,
            color: tokens.color.ink,
          }}
        >
          Voice Acting — Scene 4
        </div>
        <div
          style={{
            fontFamily: font,
            fontSize: '0.75rem',
            fontWeight: 500,
            color: tokens.color.muted,
            marginTop: '4px',
          }}
        >
          recorded 12 min ago · 2m 14s
        </div>
        <div
          style={{
            fontFamily: font,
            fontSize: '0.875rem',
            lineHeight: 1.6,
            color: tokens.color.ink,
            marginTop: '12px',
            maxWidth: '65ch',
          }}
        >
          Strong emotional grounding in the opening. Your breath control is
          improving — the pause before "not anymore" landed cleanly this time.
        </div>
        <div style={{ marginTop: '16px' }}>
          <ScorePips score={4} label="Vocal Clarity" />
        </div>
      </div>

      {/* Interactive session card (hover float) */}
      <div
        style={{
          background: hovered
            ? tokens.color.studioWarm
            : tokens.color.studioSurface,
          borderRadius: tokens.radius.card,
          padding: '20px',
          maxWidth: '300px',
          cursor: 'pointer',
          boxShadow: hovered ? tokens.shadow.float : 'none',
          transition: `background ${tokens.transition}, box-shadow ${tokens.transition}`,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          style={{
            fontFamily: font,
            fontSize: '0.75rem',
            fontWeight: 500,
            color: tokens.color.muted,
            marginBottom: '8px',
          }}
        >
          Feedback Dimension Card · hover for Float shadow
        </div>
        <div
          style={{
            fontFamily: font,
            fontSize: '1rem',
            fontWeight: 500,
            color: tokens.color.ink,
          }}
        >
          Emotional Authenticity
        </div>
        <div style={{ marginTop: '12px' }}>
          <ScorePips score={3} label="Score" />
        </div>
        <div
          style={{
            fontFamily: font,
            fontSize: '0.875rem',
            lineHeight: 1.6,
            color: tokens.color.ink,
            marginTop: '12px',
          }}
        >
          The final beat feels performed rather than felt. Try anchoring to a
          specific memory before the line.
        </div>
      </div>
    </div>
  );
}

function ScorePips({ score, label }: { score: number; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div
        style={{
          fontFamily: font,
          fontSize: '0.75rem',
          fontWeight: 500,
          letterSpacing: '0.01em',
          color: tokens.color.muted,
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', gap: '4px' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '20px',
              height: '5px',
              borderRadius: '4px',
              background:
                i < score
                  ? tokens.color.studioCrimson
                  : tokens.color.studioSurface,
              border:
                i < score ? 'none' : `1px solid ${tokens.color.inputBorder}`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function SampleForm() {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState('');
  const inputBase: React.CSSProperties = {
    fontFamily: font,
    fontSize: '0.875rem',
    padding: '10px 12px',
    borderRadius: tokens.radius.input,
    background: tokens.color.studioSurface,
    color: tokens.color.ink,
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
    transition: `border-color ${tokens.transition}`,
  };

  return (
    <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
      {/* Normal + focus */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          minWidth: '220px',
        }}
      >
        <label
          style={{
            fontFamily: font,
            fontSize: '0.75rem',
            fontWeight: 500,
            letterSpacing: '0.01em',
            color: tokens.color.ink,
          }}
        >
          Session Title
        </label>
        <input
          type="text"
          placeholder="e.g. Chekhov Scene Study"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            ...inputBase,
            border: `1px solid ${focused ? tokens.color.ink : tokens.color.inputBorder}`,
          }}
        />
        <span
          style={{
            fontFamily: font,
            fontSize: '0.65rem',
            color: tokens.color.muted,
          }}
        >
          {focused ? 'Focus: border → Ink' : 'Default state'}
        </span>
      </div>

      {/* Error state */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          minWidth: '220px',
        }}
      >
        <label
          style={{
            fontFamily: font,
            fontSize: '0.75rem',
            fontWeight: 500,
            letterSpacing: '0.01em',
            color: tokens.color.ink,
          }}
        >
          Scene Number
        </label>
        <input
          type="text"
          defaultValue="xyz"
          onFocus={() => {}}
          onBlur={() => {}}
          style={{
            ...inputBase,
            border: `1px solid ${tokens.color.studioCrimson}`,
          }}
        />
        <span
          style={{
            fontFamily: font,
            fontSize: '0.75rem',
            color: tokens.color.studioCrimson,
          }}
        >
          Must be a number between 1 and 99.
        </span>
      </div>

      {/* Disabled */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          minWidth: '220px',
        }}
      >
        <label
          style={{
            fontFamily: font,
            fontSize: '0.75rem',
            fontWeight: 500,
            letterSpacing: '0.01em',
            color: tokens.color.muted,
          }}
        >
          Theatre Mode (unavailable)
        </label>
        <input
          type="text"
          placeholder="Coming soon"
          disabled
          style={{
            ...inputBase,
            border: `1px solid ${tokens.color.inputBorder}`,
            color: tokens.color.muted,
            cursor: 'not-allowed',
          }}
        />
      </div>
    </div>
  );
}

function SpacingScale() {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '24px',
        alignItems: 'flex-end',
      }}
    >
      {tokens.spacing.map((size) => (
        <div
          key={size}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: `${size}px`,
              height: `${size}px`,
              background: tokens.color.studioCrimson,
              borderRadius: '2px',
              opacity: 0.8,
            }}
          />
          <span
            style={{
              fontFamily: font,
              fontSize: '0.65rem',
              color: tokens.color.muted,
            }}
          >
            {size}px
          </span>
        </div>
      ))}
    </div>
  );
}

function MotionDemo() {
  const [hovered, setHovered] = useState(false);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => {}, 1000);
    return () => clearInterval(id);
  }, [recording]);

  return (
    <div
      style={{
        display: 'flex',
        gap: '48px',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
      }}
    >
      {/* Hover transition on ghost button */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          style={{
            fontFamily: font,
            fontSize: '0.875rem',
            fontWeight: 500,
            padding: '10px 20px',
            borderRadius: tokens.radius.button,
            border: `1px solid ${tokens.color.inputBorder}`,
            background: hovered ? tokens.color.studioWarm : 'transparent',
            color: tokens.color.ink,
            cursor: 'pointer',
            transition: `background ${tokens.transition}`,
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          Hover me
        </button>
        <span
          style={{
            fontFamily: font,
            fontSize: '0.65rem',
            color: tokens.color.muted,
          }}
        >
          Ghost hover · 150ms ease-out
        </span>
      </div>

      {/* Recording pulse */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: recording
                ? tokens.color.studioCrimson
                : tokens.color.muted,
              animation: recording
                ? 'recordingPulse 1s ease-in-out infinite'
                : 'none',
            }}
          />
          <button
            style={{
              fontFamily: font,
              fontSize: '0.875rem',
              fontWeight: 500,
              padding: '8px 16px',
              borderRadius: tokens.radius.button,
              background: recording
                ? tokens.color.studioCrimson
                : 'transparent',
              color: recording ? 'white' : tokens.color.ink,
              border: recording
                ? 'none'
                : `1px solid ${tokens.color.inputBorder}`,
              cursor: 'pointer',
              transition: `background ${tokens.transition}, color ${tokens.transition}`,
            }}
            onClick={() => setRecording((r) => !r)}
          >
            {recording ? 'Stop' : 'Record'}
          </button>
        </div>
        <span
          style={{
            fontFamily: font,
            fontSize: '0.65rem',
            color: tokens.color.muted,
          }}
        >
          Recording pulse · 1s ease-in-out · opacity 1→0.4→1
        </span>
      </div>
    </div>
  );
}

function ShadowDemo() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
      {[
        {
          key: 'float',
          label: 'Float shadow',
          desc: 'On hover · interactive cards',
          value: tokens.shadow.float,
        },
        {
          key: 'lift',
          label: 'Lift shadow',
          desc: 'Dropdowns / overlays',
          value: tokens.shadow.lift,
        },
      ].map(({ key, label, desc, value }) => (
        <div
          key={key}
          style={{
            background:
              hovered === key
                ? tokens.color.studioWarm
                : tokens.color.studioSurface,
            borderRadius: tokens.radius.card,
            padding: '20px',
            width: '200px',
            cursor: 'pointer',
            boxShadow: hovered === key ? value : 'none',
            transition: `background ${tokens.transition}, box-shadow ${tokens.transition}`,
          }}
          onMouseEnter={() => setHovered(key)}
          onMouseLeave={() => setHovered(null)}
        >
          <div
            style={{
              fontFamily: font,
              fontSize: '0.875rem',
              fontWeight: 500,
              color: tokens.color.ink,
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontFamily: font,
              fontSize: '0.75rem',
              color: tokens.color.muted,
              marginTop: '4px',
            }}
          >
            {desc}
          </div>
          <div
            style={{
              fontFamily: font,
              fontSize: '0.65rem',
              color: tokens.color.muted,
              marginTop: '8px',
              wordBreak: 'break-word',
            }}
          >
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DesignSystemPreview() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
        @keyframes recordingPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input { display: block; }
      `}</style>
      <div style={S.page}>
        <div style={{ marginBottom: '48px' }}>
          <h1
            style={{
              fontFamily: font,
              fontSize: '1.75rem',
              fontWeight: 600,
              lineHeight: 1.2,
              color: tokens.color.ink,
            }}
          >
            Voxara Design System
          </h1>
          <p
            style={{
              fontFamily: font,
              fontSize: '0.875rem',
              lineHeight: 1.6,
              color: tokens.color.muted,
              marginTop: '8px',
            }}
          >
            Reference preview — throwaway page, no production content.
          </p>
        </div>

        <Section title="01 · Typography Scale · Plus Jakarta Sans">
          <TypeScale />
        </Section>

        <Section title="02 · Color Palette">
          <ColorPalette />
        </Section>

        <Section title="03 · Button Variants">
          <ButtonVariants />
        </Section>

        <Section title="04 · Card Component">
          <SampleCard />
        </Section>

        <Section title="05 · Form Inputs">
          <SampleForm />
        </Section>

        <Section title="06 · Spacing Scale (4px base)">
          <SpacingScale />
        </Section>

        <Section title="07 · Shadow Vocabulary">
          <ShadowDemo />
        </Section>

        <Section title="08 · Motion & Transition (150ms ease-out)">
          <MotionDemo />
        </Section>

        <Section title="Signature · Feedback Score Pips">
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            {(
              [
                'Vocal Clarity',
                'Emotional Authenticity',
                'Pacing & Rhythm',
                'Breath Control',
                'Character Commitment',
              ] as const
            ).map((dim, i) => (
              <ScorePips key={dim} score={i + 1} label={dim} />
            ))}
          </div>
        </Section>
      </div>
    </>
  );
}
