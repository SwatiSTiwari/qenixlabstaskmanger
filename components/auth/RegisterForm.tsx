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

export function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register(name, email, password, role);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
          Create an account to start managing tasks
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
          <Label className="text-sm font-semibold">Account Type</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`p-4 border-2 rounded-lg transition-all text-center space-y-2 ${
                role === 'admin'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-primary/5'
              }`}
            >
              <Shield className={`h-5 w-5 mx-auto ${role === 'admin' ? 'text-primary' : 'text-muted-foreground'}`} />
              <div className={`font-semibold text-sm ${role === 'admin' ? 'text-primary' : 'text-foreground'}`}>Admin</div>
              <div className="text-xs text-muted-foreground">Full access</div>
            </button>
            <button
              type="button"
              onClick={() => setRole('member')}
              className={`p-4 border-2 rounded-lg transition-all text-center space-y-2 ${
                role === 'member'
                  ? 'border-accent bg-accent/5'
                  : 'border-border hover:border-accent/50 hover:bg-accent/5'
              }`}
            >
              <Users className={`h-5 w-5 mx-auto ${role === 'member' ? 'text-accent' : 'text-muted-foreground'}`} />
              <div className={`font-semibold text-sm ${role === 'member' ? 'text-accent' : 'text-foreground'}`}>Member</div>
              <div className="text-xs text-muted-foreground">Limited access</div>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-semibold">Full Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isLoading}
            className="h-11 bg-input border-border"
          />
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
            minLength={6}
            className="h-11 bg-input border-border"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg transition-shadow"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground mt-6 text-center">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
