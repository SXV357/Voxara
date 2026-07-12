import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Mode = 'sign-in' | 'sign-up';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Try again.';
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.6 5.6 0 0 1-2.42 3.65v3h3.9c2.28-2.1 3.54-5.2 3.54-8.89Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.9-3a7.4 7.4 0 0 1-11-3.9H1.03v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.04 14.2a7.2 7.2 0 0 1 0-4.4v-3.1H1.03a12 12 0 0 0 0 10.6l4.01-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.6 4.59 1.79l3.44-3.44A11.6 11.6 0 0 0 12 0 12 12 0 0 0 1.03 6.7l4.01 3.1A7.15 7.15 0 0 1 12 4.75Z"
      />
    </svg>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    if (mode === 'sign-in') {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setSubmitting(false);

      if (authError) {
        setError(getErrorMessage(authError));
        return;
      }

      navigate('/dashboard');
      return;
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    setSubmitting(false);

    if (authError) {
      setError(getErrorMessage(authError));
      return;
    }

    if (data.session) {
      // Supabase issued a session outright (e.g. "Confirm email" is off).
      navigate('/dashboard');
      return;
    }

    if (data.user && data.user.identities?.length === 0) {
      setError('This email is already registered. Try signing in instead.');
      return;
    }

    setInfo(
      "We've sent a confirmation link to your email. Verify it to finish creating your account.",
    );
  }

  async function handleGoogleSignIn() {
    setError(null);
    setInfo(null);
    setSubmitting(true);

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });

    setSubmitting(false);

    if (authError) {
      setError(getErrorMessage(authError));
    }
  }

  if (loading) return null;
  if (session) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <Card className="w-full max-w-sm shadow-lift">
        <CardHeader>
          <CardTitle className="text-display font-semibold text-ink">
            {mode === 'sign-in' ? 'Sign in' : 'Create an account'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={
                    mode === 'sign-in' ? 'current-password' : 'new-password'
                  }
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted transition-colors hover:text-ink"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-body text-studio-crimson">
                {error}
              </p>
            )}
            {info && (
              <p role="status" className="text-body text-muted">
                {info}
              </p>
            )}

            <Button type="submit" disabled={submitting}>
              {submitting
                ? 'Please wait…'
                : mode === 'sign-in'
                  ? 'Sign in'
                  : 'Sign up'}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-body text-muted">or</span>
            <Separator className="flex-1" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={submitting}
            onClick={handleGoogleSignIn}
          >
            <GoogleIcon />
            Continue with Google
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setError(null);
              setInfo(null);
              setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
            }}
            className="mt-4 h-auto w-fit p-0 text-body text-muted hover:bg-transparent hover:text-ink"
          >
            {mode === 'sign-in'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
