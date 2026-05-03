'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { Input } from '@/components/shared/Input';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(username, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="container-main grid min-h-[calc(100vh-4rem)] place-items-center py-10">
      <Card className="w-full max-w-md">
        <div className="mb-6">
          <div className="mb-4 inline-flex rounded-md bg-coral/15 p-3 text-coral">
            <LogIn className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">Login</h1>
          <p className="mt-2 text-sm text-slate-400">
            Continue your AVCN practice sessions.
          </p>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Input
            autoComplete="username"
            label="Username"
            name="username"
            onChange={(event) => setUsername(event.target.value)}
            required
            value={username}
          />
          <Input
            autoComplete="current-password"
            label="Password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
          {error ? (
            <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          ) : null}
          <Button isLoading={isLoading} type="submit">
            Login
          </Button>
        </form>

        <p className="mt-5 text-sm text-slate-400">
          New account?{' '}
          <Link className="font-semibold text-coral" href="/auth/register">
            Register
          </Link>
        </p>
      </Card>
    </main>
  );
}
