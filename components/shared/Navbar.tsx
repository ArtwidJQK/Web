'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, GraduationCap, LayoutDashboard, LogOut, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/shared/Button';
import { cn } from '@/lib/utils';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/practice', label: 'Practice', icon: BookOpen },
  { href: '/exam-select', label: 'Exam', icon: GraduationCap },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isReady } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-navy/95 backdrop-blur">
      <nav className="container-main flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
        <Link className="flex items-center gap-2 text-base font-bold text-white" href="/">
          <GraduationCap className="h-5 w-5 text-coral" />
          AVCN English
        </Link>

        {isReady && user ? (
          <>
            <div className="flex flex-1 justify-center gap-1 sm:gap-2">
              {links.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    className={cn(
                      'inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white',
                      active && 'bg-slate-800 text-white'
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm text-slate-300 sm:flex">
                <User className="h-4 w-4 text-coral" />
                {user.username}
              </div>
              <Button
                aria-label="Logout"
                onClick={() => {
                  logout();
                  router.push('/auth/login');
                }}
                type="button"
                variant="ghost"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex gap-2">
            <Link className="btn-secondary rounded-md" href="/auth/login">
              Login
            </Link>
            <Link className="btn-primary rounded-md" href="/auth/register">
              Register
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
