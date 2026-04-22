import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { api } from '../../lib/api';
import type { AuthResponse } from '../../types';

type AuthState = AuthResponse | null;

type AuthContextValue = {
  session: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const STORAGE_KEY = 'vehicle-control-session';
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthState>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSession(JSON.parse(stored) as AuthResponse);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      async login(email, password) {
        const response = await api.login(email, password);
        setSession(response);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(response));
      },
      logout() {
        setSession(null);
        window.localStorage.removeItem(STORAGE_KEY);
      },
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return context;
}
