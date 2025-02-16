'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AccessCode() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/auth/verify-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessCode }),
      });

      if (response.ok) {
        // Store access verification in localStorage
        localStorage.setItem('accessVerified', 'true');
        // Redirect to the original destination or signup
        const callbackUrl = searchParams.get('callbackUrl');
        router.push(callbackUrl || '/auth/signup');
      } else {
        const data = await response.json();
        setError(data.error || 'Invalid access code');
      }
    } catch  {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-background">
      <div className="max-w-md w-full space-y-8 p-8 bg-dark-surface/80 backdrop-blur-sm border border-white/5 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary">
            Enter Access Code
          </h2>
          <p className="mt-2 text-center text-sm text-text-secondary">
            Please enter the access code to continue
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <input
              type="text"
              required
              className="appearance-none rounded-[8px] relative block w-full px-4 py-2.5 border border-[#2C2C2E] focus:border-brand-primary/20 focus:ring-1 focus:ring-brand-primary/20 bg-dark-surface text-text-primary placeholder:text-text-tertiary"
              placeholder="Access Code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-status-error text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-brand-primary hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary/50 transition-colors duration-200 shadow-lg shadow-brand-primary/20 hover:shadow-xl hover:shadow-brand-primary/30"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 