'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      console.log('SignIn - Attempting sign in with:', { email });
      const result = await signIn('credentials', {
        email,
        password: accessCode,
        redirect: false,
        callbackUrl: '/dashboard'
      });
      
      console.log('SignIn - Result:', result);

      if (!result?.ok) {
        setError(result?.error || 'Invalid access code or email');
        return;
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('SignIn - Error:', error);
      setError('An error occurred while signing in. Please check the console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-background">
      <div className="max-w-md w-full space-y-8 p-8 bg-dark-surface/80 backdrop-blur-sm border border-white/5 rounded-xl shadow-lg">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
            <span className="text-white font-bold text-xl">L</span>
          </div>
          <span className="text-xl font-semibold bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent">Lumeo</span>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Welcome to Lumeo
          </h2>
          <p className="text-text-secondary mb-8">
            Enter your email and access code to continue
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-lg shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-[8px] relative block w-full px-4 py-2.5 border border-[#2C2C2E] focus:border-brand-primary/20 focus:ring-1 focus:ring-brand-primary/20 bg-dark-surface text-text-primary placeholder:text-text-tertiary"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="accessCode" className="sr-only">
                Access Code
              </label>
              <input
                id="accessCode"
                name="accessCode"
                type="password"
                required
                className="appearance-none rounded-[8px] relative block w-full px-4 py-2.5 border border-[#2C2C2E] focus:border-brand-primary/20 focus:ring-1 focus:ring-brand-primary/20 bg-dark-surface text-text-primary placeholder:text-text-tertiary"
                placeholder="Access Code"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-status-error text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-brand-primary hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary/50 transition-colors duration-200 shadow-lg shadow-brand-primary/20 hover:shadow-xl hover:shadow-brand-primary/30"
            >
              {isLoading ? 'Please wait...' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 