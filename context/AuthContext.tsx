'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { apiRequest } from '@/lib/client-api';

type AuthUser = {
  id: string;
  username: string;
  email?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isReady: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (payload: {
    username: string;
    password: string;
    email?: string;
  }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'english-learn-auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { user: AuthUser; token: string };
        setUser(parsed.user);
        setToken(parsed.token);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsReady(true);
  }, []);

  const persist = useCallback((nextUser: AuthUser, nextToken: string) => {
    setUser(nextUser);
    setToken(nextToken);
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user: nextUser, token: nextToken })
    );
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const data = await apiRequest<{
        token: string;
        user: AuthUser;
      }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      persist(data.user, data.token);
    },
    [persist]
  );

  const register = useCallback(
    async (payload: { username: string; password: string; email?: string }) => {
      const data = await apiRequest<{
        token: string;
        user_id: string;
        username: string;
      }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      persist(
        {
          id: data.user_id,
          username: data.username,
          email: payload.email,
        },
        data.token
      );
    },
    [persist]
  );

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({ user, token, isReady, login, register, logout }),
    [user, token, isReady, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
