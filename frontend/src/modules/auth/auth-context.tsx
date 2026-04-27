import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { api, setUnauthorizedHandler } from '../../lib/api';
import { connectSocket, disconnectSocket, resetSocketReconnectAttempts } from '../../lib/socket';
import type { AuthResponse } from '../../types';
import {
  clearLegacyAuthStorage,
  clearStoredAccessToken,
  readStoredAccessToken,
  writeStoredAccessToken,
} from './auth-storage';

type AuthState = AuthResponse | null;

type AuthContextValue = {
  session: AuthState;
  isHydrating: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  logoutWithApi: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthState>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setSession(null);
      clearStoredAccessToken();
      clearLegacyAuthStorage();
      disconnectSocket();
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

  useEffect(() => {
    const bootstrapSession = async () => {
      clearLegacyAuthStorage();
      const accessToken = readStoredAccessToken();

      if (!accessToken) {
        setIsHydrating(false);
        return;
      }

      try {
        const user = await api.getCurrentUser(accessToken);
        setSession({ accessToken, user });
        connectSocket();
      } catch {
        clearStoredAccessToken();
        setSession(null);
      } finally {
        setIsHydrating(false);
      }
    };

    void bootstrapSession();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isHydrating,
      async login(email, password) {
        const response = await api.login(email, password);
        setSession(response);
        writeStoredAccessToken(response.accessToken);
        resetSocketReconnectAttempts();
        connectSocket();
      },
      logout() {
        setSession(null);
        clearStoredAccessToken();
        clearLegacyAuthStorage();
        disconnectSocket();
      },
      async logoutWithApi() {
        const currentToken = session?.accessToken;

        try {
          if (currentToken) {
            await api.logout(currentToken);
          }
        } catch {
        } finally {
          setSession(null);
          clearStoredAccessToken();
          clearLegacyAuthStorage();
          disconnectSocket();
        }
      },
    }),
    [isHydrating, session],
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
