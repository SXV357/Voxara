import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDisplayName } from '@/lib/utils';
import type { VoiceActingProfile } from '@/types';
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

interface ProfileResponse {
  voice_acting_profile: VoiceActingProfile | null;
}

export function ProfilePage() {
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subtypes, setSubtypes] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState('');
  const [goals, setGoals] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const displayName = getDisplayName(user);

  useEffect(() => {
    if (!session) return;

    fetch('/api/profile/', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((res) => res.json())
      .then((data: ProfileResponse) => {
        const profile = data.voice_acting_profile;
        if (profile) {
          setSubtypes(profile.subtypes);
          setExperienceLevel(profile.experience_level);
          setGoals(profile.goals);
        }
      })
      .finally(() => setLoading(false));
  }, [session]);

  function toggleSubtype(subtype: string, checked: boolean) {
    setSubtypes((prev) =>
      checked ? [...prev, subtype] : prev.filter((s) => s !== subtype),
    );
  }

  async function handleSave() {
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

    setSaving(true);
    try {
      const res = await fetch('/api/profile/voice-acting', {
        method: 'PATCH',
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

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <div className="p-8">
      <h1 className="mb-1 text-display font-semibold text-ink">Profile</h1>
      <p className="mb-6 text-body text-muted">
        {displayName ? `${displayName} · ` : ''}
        {user?.email}
      </p>

      <Card className="w-full max-w-xl shadow-lift">
        <CardHeader className="p-8 pb-2">
          <CardTitle className="text-headline font-semibold text-ink">
            Voice acting profile
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 pt-2">
          <div className="flex flex-col gap-7">
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

            <div className="flex items-center gap-3">
              <Button onClick={handleSave} disabled={saving} size="lg">
                {saving ? 'Saving…' : 'Save'}
              </Button>
              {saved && (
                <span role="status" className="text-base text-muted">
                  Saved!
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
