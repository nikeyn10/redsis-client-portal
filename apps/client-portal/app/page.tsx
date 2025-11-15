'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to client portal login
    router.push('/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center animate-fade-in" style={{ backgroundColor: 'var(--ibacs-dark)' }}>
      <div className="text-center">
        <div className="flex items-center justify-center rounded-lg mb-4" style={{
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
        <p style={{ color: 'var(--text-secondary)' }}>Redirecting...</p>
      </div>
    </div>
  );
}