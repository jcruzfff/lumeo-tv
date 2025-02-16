'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/dashboard'); // Redirect to dashboard
        router.refresh();
      }
    } catch  {
      setError('An error occurred during sign in');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-background">
      <div className="max-w-md w-full space-y-8 p-8 bg-dark-surface/80 backdrop-blur-sm border border-white/5 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-[8px] relative block w-full px-4 py-2.5 border border-[#2C2C2E] focus:border-brand-primary/20 focus:ring-1 focus:ring-brand-primary/20 bg-dark-surface text-text-primary placeholder:text-text-tertiary"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-status-error text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-brand-primary hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary/50 transition-colors duration-200 shadow-lg shadow-brand-primary/20 hover:shadow-xl hover:shadow-brand-primary/30"
            >
              Sign in
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-text-secondary">
              Don&apos;t have an account?{' '}
              <a href="/auth/signup" className="text-brand-primary hover:text-brand-primary/90 transition-colors">
                Sign up
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
} 