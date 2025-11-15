'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader } from '@/components/ui/Loader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'form' | 'loading' | 'success' | 'error'>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Check for magic link parameters (backward compatibility)
    const token = searchParams.get('token');
    const emailParam = searchParams.get('email');
    const boardId = searchParams.get('boardId');

    if (token && emailParam && boardId) {
      console.log('Magic link detected - storing credentials');
      localStorage.setItem('magic_token', token);
      localStorage.setItem('client_email', emailParam);
      localStorage.setItem('client_board_id', boardId);
      setStatus('success');
      setTimeout(() => {
        router.push('/client/dashboard');
      }, 1000);
    }
  }, [searchParams, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatus('loading');

    try {
      // Call the server-side login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed. Please try again.');
        setStatus('form');
        return;
      }

      if (data.success && data.user) {
        // Store authentication
        localStorage.setItem('magic_token', data.user.token);
        localStorage.setItem('client_email', data.user.email);
        localStorage.setItem('client_board_id', data.user.ticketBoardId);
        localStorage.setItem('user_name', data.user.name);
        localStorage.setItem('user_company', data.user.company);

        setStatus('success');
        setTimeout(() => {
          router.push('/client/dashboard');
        }, 1000);
      } else {
        setError('Invalid response from server');
        setStatus('form');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
      setStatus('form');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in" style={{ backgroundColor: 'var(--ibacs-dark)' }}>
      <div className="w-full max-w-md rounded-xl p-8 shadow-2xl" style={{
        backgroundColor: 'var(--ibacs-secondary)',
        border: '1px solid var(--ibacs-tertiary)',
      }}>
        <div className="text-center mb-8">
          {/* RedsisLab Logo */}
          <div className="flex items-center justify-center rounded-lg mb-6" style={{
            width: '64px',
            height: '64px',
            backgroundColor: 'var(--redsislab-yellow)',
            boxShadow: 'var(--shadow-yellow)',
            margin: '0 auto',
          }}>
            <span className="font-bold text-3xl" style={{ color: 'var(--text-inverse)' }}>R</span>
          </div>

          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            RedsisLab Client Portal
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Sign in to access your support tickets
          </p>
        </div>

        {status === 'loading' && (
          <div className="space-y-4 text-center">
            <Loader size="lg" />
            <p style={{ color: 'var(--text-secondary)' }}>Authenticating...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4 text-center animate-slide-up">
            <div className="text-6xl">✓</div>
            <p className="font-semibold text-lg" style={{ color: 'var(--ibacs-green)' }}>
              Successfully authenticated!
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Redirecting to dashboard...
            </p>
          </div>
        )}

        {status === 'form' && (
          <form onSubmit={handleLogin} className="space-y-6 animate-slide-up">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@company.com"
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />

            {error && (
              <div className="p-4 rounded-lg" style={{
                backgroundColor: 'var(--ibacs-primary)',
                border: '1px solid var(--ibacs-red)',
              }}>
                <p className="text-sm" style={{ color: 'var(--ibacs-red)' }}>
                  {error}
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
            >
              Sign In
            </Button>

            <div className="pt-4 text-center">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                🔒 Secure authentication via Monday.com
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--ibacs-dark)' }}>
        <div className="text-center">
          <Loader size="lg" />
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}