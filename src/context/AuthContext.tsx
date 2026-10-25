import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import {
  signInWithGooglePopup,
  firebaseSignOut,
  getCachedAccessToken,
  initFirebaseAuth,
  isUserCancelledAuth,
} from '../services/firebaseAuth';

export interface User {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  createdAt: string;
  lastLogin: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  login: (email?: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  getGoogleAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getGoogleAccessToken = async (): Promise<string | null> => {
    return getCachedAccessToken();
  };

  const signInWithGoogle = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await signInWithGooglePopup();
      if (!res || !res.user) {
        return false;
      }

      const syncRes = await apiFetch('/api/auth/google/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: {
            uid: res.user.uid,
            email: res.user.email,
            displayName: res.user.displayName,
            photoURL: res.user.photoURL,
          },
          accessToken: res.accessToken,
        }),
      });

      if (syncRes.ok) {
        const data = await syncRes.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          if (data.token) localStorage.setItem('emailguard_token', data.token);
          return true;
        }
      }
      return false;
    } catch (err: any) {
      if (isUserCancelledAuth(err)) {
        return false;
      }
      console.error('[AUTH] Google Sign-In error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email || 'nareshkarothia@gmail.com' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          if (data.token) localStorage.setItem('emailguard_token', data.token);
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('[AUTH] Login failure:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Check existing session on mount
  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const res = await apiFetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user && isMounted) {
            setUser(data.user);
            if (data.token) localStorage.setItem('emailguard_token', data.token);
            return;
          }
        }
      } catch (err) {
        console.warn('[AUTH] Session check error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    checkSession();

    // Listen to Firebase auth changes to keep session aligned
    const unsubscribe = initFirebaseAuth((firebaseUser, token) => {
      if (firebaseUser && !user && isMounted) {
        // Sync session if Firebase has a user
        apiFetch('/api/auth/google/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
            },
            accessToken: token,
          }),
        })
          .then((r) => r.json())
          .then((d) => {
            if (d.authenticated && d.user && isMounted) {
              setUser(d.user);
              if (d.token) localStorage.setItem('emailguard_token', d.token);
            }
          })
          .catch(() => {});
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      localStorage.removeItem('emailguard_token');
      await firebaseSignOut();
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('[AUTH] Logout failure:', err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        logout,
        login,
        signInWithGoogle,
        getGoogleAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
