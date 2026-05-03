'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isReady } = useAuth();

  useEffect(() => {
    if (isReady && !user) {
      router.replace('/auth/login');
    }
  }, [isReady, router, user]);

  if (!isReady || !user) {
    return (
      <main className="container-main grid min-h-[calc(100vh-4rem)] place-items-center py-10">
        <div className="flex items-center gap-3 text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin text-coral" />
          Loading
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
