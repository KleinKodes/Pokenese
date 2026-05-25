'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useUserStore } from '../../store/userStore';
import apiClient from '../../lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useUserStore();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.register({ email, username, password });
      setUser(response.user, response.access_token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', response.access_token);
      }
      router.push('/');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container flex items-center justify-center min-h-[70vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-accent-red/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserPlus size={28} className="text-accent-red" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Create account</h1>
          <p className="text-text-muted mt-1">Sync progress across devices</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-text-secondary mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-border-default bg-bg-input text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors min-h-[48px]"
            />
          </div>

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-text-secondary mb-1.5"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              placeholder="Trainer123"
              minLength={3}
              maxLength={20}
              className="w-full px-4 py-3 rounded-xl border border-border-default bg-bg-input text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors min-h-[48px]"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-text-secondary mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                minLength={8}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-border-default bg-bg-input text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors min-h-[48px]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-text-primary transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-text-secondary mb-1.5"
            >
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Repeat password"
              className="w-full px-4 py-3 rounded-xl border border-border-default bg-bg-input text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors min-h-[48px]"
            />
          </div>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-color-error text-sm"
              role="alert"
            >
              {error}
            </motion.p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
          >
            Create Account
          </Button>
        </form>

        <p className="text-center text-text-muted text-sm mt-6">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-accent-blue hover:text-text-primary transition-colors font-medium"
          >
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
