import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  localRegister,
  localSignIn,
  localGetSession,
  localSetSession,
  localClearSession,
  type LocalUser,
} from '../lib/localAuth';
import { authApi } from '../lib/api';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role?: 'user' | 'admin';
}

interface AuthContextType {
  currentUser: AppUser | null;
  loading: boolean;
  dbMode: boolean;        // true when API/MySQL auth is active
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setCurrentUser: (user: AppUser | null) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

function apiUserToApp(u: any): AppUser {
  return { uid: u.id, email: u.email, displayName: u.name, role: u.role };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbMode, setDbMode] = useState(false);

  // Restore session on mount — try API first, fall back to localStorage
  useEffect(() => {
    (async () => {
      try {
        const u = await authApi.me();
        setCurrentUser(apiUserToApp(u));
        setDbMode(true);
      } catch {
        // API unavailable or not logged in via API — check localStorage
        const session = localGetSession();
        if (session) setCurrentUser(session);
        setDbMode(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async (email: string, pass: string) => {
    try {
      const u = await authApi.login(email, pass);
      setCurrentUser(apiUserToApp(u));
      setDbMode(true);
    } catch (err: any) {
      // If DB unavailable (503 / network error), fall back to local auth
      if (err?.status === 503 || err?.data?.fallback || !navigator.onLine) {
        const user = localSignIn(email, pass);
        setCurrentUser(user);
        setDbMode(false);
      } else {
        throw err;
      }
    }
  };

  const signUp = async (email: string, pass: string, displayName?: string) => {
    try {
      const u = await authApi.register(displayName || email.split('@')[0], email, pass);
      setCurrentUser(apiUserToApp(u));
      setDbMode(true);
    } catch (err: any) {
      if (err?.status === 503 || err?.data?.fallback || !navigator.onLine) {
        const user = localRegister(email, pass, displayName);
        localSetSession(user);
        setCurrentUser(user);
        setDbMode(false);
      } else {
        throw err;
      }
    }
  };

  const signInWithGoogle = async () => {
    throw new Error('Google sign-in requires Firebase. Please add your Firebase config.');
  };

  const signOut = async () => {
    try { await authApi.logout(); } catch {}
    localClearSession();
    setCurrentUser(null);
    setDbMode(false);
  };

  const resetPassword = async (email: string) => {
    console.log('Password reset requested for', email);
  };

  return (
    <AuthContext.Provider value={{
      currentUser, loading, dbMode,
      signIn, signUp, signInWithGoogle, signOut, resetPassword, setCurrentUser,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
