'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AccessPage() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessCode }),
      });

      if (!response.ok) {
        throw new Error('Invalid access code');
      }

      // Redirect to sign in page after successful verification
      router.push('/auth/signin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#161618]">
      <div className="w-full max-w-md p-8 bg-[#1F1F21] rounded-2xl border border-[#2C2C2E]">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
            <span className="text-white font-bold text-xl">L</span>
          </div>
          <span className="text-xl font-semibold bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent">Lumeo</span>
        </div>

        <h1 className="text-2xl font-bold text-text-primary mb-2">Enter Access Code</h1>
        <p className="text-text-secondary mb-8">Please enter your access code to continue</p>

        <form onSubmit={handleAccessSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Access Code"
              className="w-full px-4 py-3 rounded-lg border border-[#2C2C2E] focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-none bg-dark-surface text-text-primary placeholder:text-text-tertiary"
              required
            />
          </div>

          {error && (
            <div className="text-status-error text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded-lg font-medium text-white transition-colors ${
              isLoading
                ? 'bg-brand-primary/50 cursor-not-allowed'
                : 'bg-brand-primary hover:bg-brand-primary/90'
            }`}
          >
            {isLoading ? 'Verifying...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
} 