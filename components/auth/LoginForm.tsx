'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, Shield, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="space-y-3 mb-8">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-xl font-bold text-primary">✓</span>
          </div>
          <h1 className="text-3xl font-bold">TaskFlow</h1>
        </div>
        <p className="text-muted-foreground text-base">
          Sign in to your account to manage tasks
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6 border-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Sign in as</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setEmail('admin@task.com');
                setPassword('admin123');
              }}
              className="p-4 border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-center space-y-2"
            >
              <Shield className="h-5 w-5 mx-auto text-primary" />
              <div className="font-semibold text-sm">Admin</div>
              <div className="text-xs text-muted-foreground">Full access</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('member1@task.com');
                setPassword('admin123');
              }}
              className="p-4 border-2 border-border rounded-lg hover:border-accent hover:bg-accent/5 transition-all text-center space-y-2"
            >
              <Users className="h-5 w-5 mx-auto text-accent" />
              <div className="font-semibold text-sm">Member</div>
              <div className="text-xs text-muted-foreground">Limited access</div>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="h-11 bg-input border-border"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="h-11 bg-input border-border"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg transition-shadow"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground mt-6 text-center">
        Don't have an account?{' '}
        <Link href="/register" className="font-semibold text-primary hover:underline transition-colors">
          Create one
        </Link>
      </p>

      <div className="mt-8 pt-8 border-t border-border space-y-3 bg-primary/5 rounded-lg p-4">
        <p className="font-semibold text-sm text-foreground">Demo Credentials</p>
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Admin</span>
            <code className="bg-background px-2 py-1 rounded text-foreground">admin@task.com</code>
          </div>
          <div className="flex items-center justify-between">
            <span>Member</span>
            <code className="bg-background px-2 py-1 rounded text-foreground">member1@task.com</code>
          </div>
          <p className="text-center mt-2">Password: <code className="bg-background px-2 py-1 rounded">demo123</code></p>
        </div>
      </div>
    </div>
  );
}
