'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Mail, Check, AlertCircle } from 'lucide-react';

interface MagicLinkAuthProps {
  onSuccess: (email: string, token: string) => void;
  onError?: (error: string) => void;
}

const MagicLinkAuth: React.FC<MagicLinkAuthProps> = ({ onSuccess, onError }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyingToken, setVerifyingToken] = useState(false);

  // Check if we're verifying a token from URL
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token) {
      verifyMagicLink(token);
    }
  }, []);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call Monday Code function to generate magic link
      const response = await fetch('/api/auth/magic-link/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send magic link');
      }

      setLinkSent(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send magic link';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const verifyMagicLink = async (token: string) => {
    try {
      setVerifyingToken(true);
      setError(null);

      // Call Monday Code function to verify token
      const response = await fetch('/api/auth/magic-link/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid or expired magic link');
      }

      // Extract email from token payload
      const email = data.email;
      
      // Success - call parent callback
      onSuccess(email, token);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify magic link';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setVerifyingToken(false);
    }
  };

  if (verifyingToken) {
    return (
      <Card>
        <div className="p-8 text-center space-y-4">
          <Loader />
          <p className="text-gray-600">Verifying your magic link...</p>
        </div>
      </Card>
    );
  }

  if (linkSent) {
    return (
      <Card>
        <div className="p-8 space-y-4">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Check your email</h2>
            <p className="text-gray-600">
              We've sent a magic link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Click the link in your email to sign in. The link will expire in 24 hours.
            </p>
          </div>
          <div className="pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setLinkSent(false);
                setEmail('');
              }}
              className="w-full"
            >
              Use a different email
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-blue-100 rounded-full">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold">Sign in with Email</h2>
          <p className="text-gray-600">
            Enter your email and we'll send you a secure login link
          </p>
        </div>

        <form onSubmit={handleSendMagicLink} className="space-y-4">
          <Input
            type="email"
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            required
            autoFocus
          />

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <Button type="submit" disabled={loading || !email} className="w-full">
            {loading ? (
              <>
                <Loader className="mr-2" />
                Sending...
              </>
            ) : (
              'Send magic link'
            )}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            No password required. Just click the link we send you.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default MagicLinkAuth;
