import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface VoiceActingProfile {
  subtypes: string[];
  experience_level: string;
  goals: string;
}

type GuardStatus = 'loading' | 'needs-onboarding' | 'ready';

export function ScenarioSelectionPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<GuardStatus>('loading');

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

  if (status === 'loading') return null;
  if (status === 'needs-onboarding') {
    return <Navigate to="/onboarding/voice-acting" replace />;
  }

  return <div className="p-8 text-ink">Scenarios — stub</div>;
}
