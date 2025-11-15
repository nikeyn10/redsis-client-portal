'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/client';
import { getCurrentUserFromToken } from '@/lib/auth';
import { Button } from './ui/Button';
import { LogOut, User } from 'lucide-react';

export default function TopNav() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const user = getCurrentUserFromToken();
    if (user) {
      setUserName(user.email);
    }
  }, []);

  const handleLogout = () => {
    authApi.logout();
    router.push('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-xl font-bold text-monday-blue hover:text-monday-blue-dark transition-colors"
            >
              REDSIS Portal
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <User size={18} />
              <span>{userName}</span>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <LogOut size={18} />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
