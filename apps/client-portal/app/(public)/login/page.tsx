'use client';

import { Suspense, useState } from 'react';
import { Loader } from '@/components/ui/Loader';
import MagicLinkAuth from '@/components/auth/MagicLinkAuth';
import PINAuth from '@/components/auth/PINAuth';

function LoginContent() {
  const [authMethod, setAuthMethod] = useState<'magic-link' | 'pin'>('magic-link');

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

        {/* Auth Method Toggle */}
        <div className="flex gap-2 mb-6 p-1 rounded-lg" style={{ backgroundColor: 'var(--ibacs-primary)' }}>
          <button
            type="button"
            onClick={() => setAuthMethod('magic-link')}
            className="flex-1 py-2 px-4 rounded-md transition-all text-sm font-medium"
            style={{
              backgroundColor: authMethod === 'magic-link' ? 'var(--ibacs-blue)' : 'transparent',
              color: authMethod === 'magic-link' ? 'var(--text-inverse)' : 'var(--text-secondary)',
            }}
          >
            Email Link
          </button>
          <button
            type="button"
            onClick={() => setAuthMethod('pin')}
            className="flex-1 py-2 px-4 rounded-md transition-all text-sm font-medium"
            style={{
              backgroundColor: authMethod === 'pin' ? 'var(--ibacs-blue)' : 'transparent',
              color: authMethod === 'pin' ? 'var(--text-inverse)' : 'var(--text-secondary)',
            }}
          >
            PIN Login
          </button>
        </div>

        {/* Authentication Components */}
        <div className="animate-slide-up">
          {authMethod === 'magic-link' ? (
            <MagicLinkAuth />
          ) : (
            <PINAuth />
          )}
        </div>

        <div className="pt-6 text-center">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            🔒 Secure authentication via Monday.com
          </p>
        </div>
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