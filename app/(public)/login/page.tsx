'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api/client';
import { Loader } from '@/components/ui/Loader';
import { Card } from '@/components/ui/Card';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const portalId = searchParams.get('portal_id');
    const token = searchParams.get('token');

    if (!portalId || !token) {
      setStatus('error');
      setError('Invalid magic link. Please check your email for the correct link.');
      return;
    }

    // Authenticate
    authApi
      .authenticateWithMagicLink(portalId, token)
      .then(() => {
        setStatus('success');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      })
      .catch((err) => {
        setStatus('error');
        setError(err.response?.data?.detail || 'Authentication failed. Please try again.');
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            REDSIS Client Portal
          </h1>

          {status === 'loading' && (
            <div className="space-y-4">
              <Loader size="lg" />
              <p className="text-gray-600">Authenticating...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="text-green-600 text-5xl">✓</div>
              <p className="text-gray-900 font-medium">Successfully authenticated!</p>
              <p className="text-gray-600 text-sm">Redirecting to dashboard...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="text-red-600 text-5xl">✕</div>
              <p className="text-gray-900 font-medium">Authentication Failed</p>
              <p className="text-red-600 text-sm">{error}</p>
              <p className="text-gray-500 text-xs mt-4">
                Please contact support if you continue to experience issues.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}