import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { OnboardingVoiceActingPage } from '@/pages/OnboardingVoiceActingPage';
import { ScenarioSelectionPage } from '@/pages/ScenarioSelectionPage';
import { RecordingPage } from '@/pages/RecordingPage';
import { FeedbackPage } from '@/pages/FeedbackPage';
import { ProfilePage } from '@/pages/ProfilePage';
import DesignSystemPreview from './DesignSystemPreview';

export default function App() {
  if (window.location.hash === '#design-preview')
    return <DesignSystemPreview />;

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route
                path="/onboarding/voice-acting"
                element={<OnboardingVoiceActingPage />}
              />
              <Route
                path="/voice-acting/scenarios"
                element={<ScenarioSelectionPage />}
              />
              <Route
                path="/voice-acting/record/:scenarioId"
                element={<RecordingPage />}
              />
              <Route
                path="/sessions/:sessionId/feedback"
                element={<FeedbackPage />}
              />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
