import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ScenarioCard } from '@/components/ScenarioCard';
import type { VoiceActingProfile, ScenarioSummary } from '@/types';

type GuardStatus = 'loading' | 'needs-onboarding' | 'ready';

export function ScenarioSelectionPage() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<GuardStatus>('loading');
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);

  useEffect(() => {
    if (!user) return;

    // query doesn't infer user - goes off of JWT; request carries session JWT
    // postgREST -> postgres -> auth.uid() reads sub and RLS policy USING (id = auth.uid())
    // applies before rows returned whether .eq() is included or not

    // required data API to be enabled
    supabase
      .from('profiles')
      .select('voice_acting_profile')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        const profile = data?.voice_acting_profile as VoiceActingProfile | null;
        setStatus(profile ? 'ready' : 'needs-onboarding');
      });
  }, [user]);

  useEffect(() => {
    if (status !== 'ready' || !session) return;

    fetch('/api/scenarios/voice-acting', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((res) => res.json())
      .then((data: ScenarioSummary[]) => setScenarios(data));
  }, [status, session]);

  if (status === 'loading') return null;
  if (status === 'needs-onboarding') {
    return <Navigate to="/onboarding/voice-acting" replace />;
  }

  return (
    <div className="p-8">
      <h1 className="mb-6 text-display font-semibold text-ink">
        Voice Acting Scenarios
      </h1>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {scenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            onSelect={(id) => navigate(`/voice-acting/record/${id}`)}
          />
        ))}
      </div>
    </div>
  );
}
