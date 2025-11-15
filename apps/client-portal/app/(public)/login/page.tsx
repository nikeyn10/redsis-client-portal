'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader } from '@/components/ui/Loader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

// Direct Monday API call
async function callMondayAPI(query: string, variables?: Record<string, any>) {
  const response = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': process.env.NEXT_PUBLIC_MONDAY_API_TOKEN || '',
      'API-Version': '2023-10'
    },
    body: JSON.stringify({ query, variables })
  });

  const result = await response.json();
  
  if (result.errors) {
    console.error('Monday API errors:', result.errors);
    throw new Error(result.errors[0]?.message || 'Monday API error');
  }
  
  return result;
}

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
      // Query User board to authenticate
      const query = `
        query GetUsers($boardId: [ID!]!) {
          boards(ids: $boardId) {
            items_page(limit: 100) {
              items {
                id
                name
                column_values {
                  id
                  text
                  value
                }
              }
            }
          }
        }
      `;

      const response = await callMondayAPI(query, {
        boardId: ['18379351659'] // User board ID
      });

      if (response.data?.boards?.[0]?.items_page?.items) {
        const users = response.data.boards[0].items_page.items;
        
        // Find user by email and password
        const user = users.find((item: any) => {
          const cols = item.column_values.reduce((acc: any, col: any) => {
            acc[col.id] = col.text || col.value;
            return acc;
          }, {});
          
          const userEmail = cols.email_mkxpm2m0 || '';
          const userPassword = cols.text_mkxpxyrr || '';
          
          return userEmail.toLowerCase() === email.toLowerCase() && userPassword === password;
        });

        if (user) {
          // Get user data
          const userCols = user.column_values.reduce((acc: any, col: any) => {
            acc[col.id] = col.text || col.value;
            return acc;
          }, {});

          const companyName = userCols.dropdown_mkxpsjwd || '';

          // Now fetch the company's ticket board ID from Company board
          let ticketBoardId = '18379040651'; // Default fallback

          if (companyName) {
            try {
              const companyQuery = `
                query GetCompanies($boardId: [ID!]!) {
                  boards(ids: $boardId) {
                    items_page(limit: 100) {
                      items {
                        id
                        name
                        column_values {
                          id
                          text
                          value
                        }
                      }
                    }
                  }
                }
              `;

              const companyResponse = await callMondayAPI(companyQuery, {
                boardId: ['18379404757'] // Company board ID
              });

              if (companyResponse.data?.boards?.[0]?.items_page?.items) {
                const companies = companyResponse.data.boards[0].items_page.items;
                
                // Find the company by name
                const company = companies.find((item: any) => item.name === companyName);
                
                if (company) {
                  const companyCols = company.column_values.reduce((acc: any, col: any) => {
                    acc[col.id] = col.text || col.value;
                    return acc;
                  }, {});
                  
                  // Get the board ID from dropdown_mkxpakmh column
                  const boardIdFromCompany = companyCols.dropdown_mkxpakmh;
                  
                  if (boardIdFromCompany) {
                    ticketBoardId = boardIdFromCompany;
                    console.log(`✅ Found company ticket board: ${ticketBoardId} for ${companyName}`);
                  } else {
                    console.warn(`⚠️ Company "${companyName}" has no ticket board ID set`);
                  }
                }
              }
            } catch (err) {
              console.error('Failed to fetch company board ID:', err);
              // Continue with default board ID
            }
          }

          // Store authentication
          localStorage.setItem('magic_token', `user-${user.id}-${Date.now()}`);
          localStorage.setItem('client_email', email);
          localStorage.setItem('client_board_id', ticketBoardId);
          localStorage.setItem('user_name', user.name);
          localStorage.setItem('user_company', companyName);

          setStatus('success');
          setTimeout(() => {
            router.push('/client/dashboard');
          }, 1000);
        } else {
          setError('Invalid email or password');
          setStatus('form');
        }
      } else {
        setError('Unable to authenticate. Please try again.');
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