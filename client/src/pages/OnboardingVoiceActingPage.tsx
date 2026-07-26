import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SUBTYPES = [
  'Commercial',
  'Audiobook',
  'Character & Animation',
  'Narration',
];

const EXPERIENCE_LEVELS = [
  'Just starting out',
  'Some experience',
  'Intermediate',
];

export function OnboardingVoiceActingPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [subtypes, setSubtypes] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState('');
  const [goals, setGoals] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggleSubtype(subtype: string, checked: boolean) {
    setSubtypes((prev) =>
      checked ? [...prev, subtype] : prev.filter((s) => s !== subtype),
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (subtypes.length === 0) {
      setError('Select at least one area.');
      return;
    }

    if (!experienceLevel) {
      setError('Select an experience level.');
      return;
    }

    if (!goals.trim()) {
      setError("Tell us what you're working on.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/onboarding/voice-acting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          subtypes,
          experience_level: experienceLevel,
          goals,
        }),
      });

      if (!res.ok) {
        setError('Something went wrong. Try again.');
        return;
      }

      navigate('/voice-acting/scenarios');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-12">
      <Card className="w-full max-w-xl shadow-lift">
        <CardHeader className="p-8 pb-2">
          <CardTitle className="text-4xl font-semibold text-ink">
            Tell us about your voice acting
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 pt-2">
          <form onSubmit={handleSubmit} className="flex flex-col gap-7">
            <div className="flex flex-col gap-3">
              <Label className="text-sm">What areas are you focused on?</Label>
              <div className="flex flex-col gap-3">
                {SUBTYPES.map((subtype) => (
                  <div key={subtype} className="flex items-center gap-3">
                    <Checkbox
                      id={subtype}
                      className="h-5 w-5"
                      checked={subtypes.includes(subtype)}
                      onCheckedChange={(checked) =>
                        toggleSubtype(subtype, checked === true)
                      }
                    />
                    <Label htmlFor={subtype} className="text-base font-normal">
                      {subtype}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="experience-level" className="text-sm">
                Experience level
              </Label>
              <Select
                value={experienceLevel}
                onValueChange={setExperienceLevel}
                required
              >
                <SelectTrigger id="experience-level" className="h-12 text-base">
                  <SelectValue placeholder="Select an experience level" />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="goals" className="text-sm">
                What are you working on?
              </Label>
              <Textarea
                id="goals"
                required
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="e.g. reducing filler words, mic technique, character differentiation…"
                className="min-h-[120px] text-base"
              />
            </div>

            {error && (
              <p role="alert" className="text-base text-studio-crimson">
                {error}
              </p>
            )}

            <Button type="submit" disabled={submitting} size="lg">
              {submitting ? 'Please wait…' : 'Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
