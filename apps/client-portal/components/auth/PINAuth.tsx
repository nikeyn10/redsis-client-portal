'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Loader } from '@/components/ui/Loader';
import { Lock, AlertCircle } from 'lucide-react';
import { fetchUserByEmail } from '@/lib/monday-api';
import { COLUMN_IDS } from '@/lib/monday-config';

interface User {
  id: string;
  name: string;
  pin?: string;
}

interface PINAuthProps {
  onSuccess: (userId: string, userName: string) => void;
  onError?: (error: string) => void;
}

const PINAuth: React.FC<PINAuthProps> = ({ onSuccess, onError }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPINUsers();
  }, []);

  const loadPINUsers = async () => {
    try {
      setLoadingUsers(true);
      
      // Fetch all users from Monday.com
      const response = await fetch('/api/users/pin-users');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load users');
      }

      // Filter for PIN users only
      const pinUsers = data.users.filter((user: any) => {
        const userTypeCol = user.column_values.find((col: any) => 
          col.id === COLUMN_IDS.USERS.USER_TYPE
        );
        return userTypeCol?.text?.toLowerCase() === 'pin user';
      });

      const formattedUsers = pinUsers.map((user: any) => ({
        id: user.id,
        name: user.name,
        pin: user.column_values.find((col: any) => 
          col.id === COLUMN_IDS.USERS.PIN
        )?.text
      }));

      setUsers(formattedUsers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load users';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handlePINSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId || !pin) {
      setError('Please select a user and enter PIN');
      return;
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Find selected user
      const user = users.find(u => u.id === selectedUserId);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Verify PIN
      if (user.pin !== pin) {
        throw new Error('Incorrect PIN');
      }

      // Success
      onSuccess(user.id, user.name);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      onError?.(errorMessage);
      
      // Clear PIN on error
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handlePINChange = (value: string) => {
    // Only allow digits, max 4 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    setPin(cleaned);
    setError(null);
  };

  if (loadingUsers) {
    return (
      <Card>
        <div className="p-8 text-center space-y-4">
          <Loader />
          <p className="text-gray-600">Loading users...</p>
        </div>
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card>
        <div className="p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 mx-auto text-gray-400" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">No PIN Users Available</h3>
            <p className="text-gray-600">
              There are no users configured for PIN authentication.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-purple-100 rounded-full">
            <Lock className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold">Sign in with PIN</h2>
          <p className="text-gray-600">
            Select your name and enter your 4-digit PIN
          </p>
        </div>

        <form onSubmit={handlePINSubmit} className="space-y-4">
          <Select
            label="Select User"
            value={selectedUserId}
            onChange={(e) => {
              setSelectedUserId(e.target.value);
              setError(null);
            }}
            required
          >
            <option value="">Choose your name...</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>

          <div>
            <Input
              type="password"
              label="4-Digit PIN"
              value={pin}
              onChange={(e) => handlePINChange(e.target.value)}
              placeholder="••••"
              required
              maxLength={4}
              pattern="\d{4}"
              className="text-center text-2xl tracking-widest"
              disabled={!selectedUserId}
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter your personal 4-digit code
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={loading || !selectedUserId || pin.length !== 4} 
            className="w-full"
          >
            {loading ? (
              <>
                <Loader className="mr-2" />
                Verifying...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Forgot your PIN? Contact your administrator.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default PINAuth;
