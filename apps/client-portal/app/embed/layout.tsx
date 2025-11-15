'use client';

import { useEffect } from 'react';

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Log when embed layout mounts
    console.log('Embed layout mounted');
    console.log('Window location:', window.location.href);
    console.log('Is in iframe:', window.self !== window.top);
    
    // Check if Monday SDK is available
    if (typeof window !== 'undefined') {
      console.log('Window object available');
      // Add a small delay to ensure Monday SDK loads
      setTimeout(() => {
        console.log('Checking for Monday SDK...');
        const mondayScript = document.querySelector('script[src*="monday"]');
        console.log('Monday script found:', !!mondayScript);
      }, 1000);
    }
  }, []);

  return (
    <div className="monday-embed-container" style={{ minHeight: '100vh', background: '#fff' }}>
      {children}
    </div>
  );
}
