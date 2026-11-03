import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  role: string;
  totalXp: number;
  emailVerified?: boolean;
  createdAt?: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  setSession: (token: string, user: UserProfile) => void;
  clearSession: () => void;
  refreshProfile: () => Promise<void>;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const STORAGE_TOKEN_KEY = 'attend_ai_auth_token';
const STORAGE_USER_KEY = 'attend_ai_auth_user';

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_TOKEN_KEY);
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(readStoredToken);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(() => Boolean(readStoredToken()));
  const tokenRef = useRef<string | null>(token);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const setSession = (newToken: string, newUser: UserProfile) => {
    tokenRef.current = newToken;
    setToken(newToken);
    setUser(newUser);
    setLoading(false);
    try {
      localStorage.setItem(STORAGE_TOKEN_KEY, newToken);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(newUser));
    } catch (err) {
      console.error('Failed to save session to localStorage:', err);
    }
  };

  const clearSession = () => {
    tokenRef.current = null;
    setToken(null);
    setUser(null);
    setLoading(false);
    try {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem(STORAGE_USER_KEY);
      localStorage.removeItem('attend_ai_logged_out');
    } catch (err) {
      console.error('Failed to clear session from localStorage:', err);
    }
  };

  const apiFetch = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json');
    }
    const currentToken = tokenRef.current || readStoredToken();
    if (currentToken) {
      headers.set('Authorization', `Bearer ${currentToken}`);
    }
    return fetch(url, {
      ...options,
      headers,
    });
  };

  const refreshProfile = async () => {
    const currentToken = tokenRef.current || readStoredToken();
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await apiFetch('/api/auth/session');
      if (res.status === 401) {
        clearSession();
        return;
      }
      if (!res.ok) {
        throw new Error(`Session validation failed with status ${res.status}.`);
      }

      const data = await res.json();
      if (!data.user) {
        clearSession();
        return;
      }
      setSession(currentToken, data.user);
    } catch (err) {
      console.error('Failed to refresh profile:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        setSession,
        clearSession,
        refreshProfile,
        apiFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
