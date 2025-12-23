import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export interface AuthContextValue {
  isLoggedIn: boolean | null;
  checkAuth: () => void;
  setLoggedOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const checkAuth = useCallback(() => {
    // ds_user_id only exists when user is logged in (contains the user ID)
    // csrftoken exists even when not logged in (used for login form CSRF protection)
    const userId = getCookie('ds_user_id');
    setIsLoggedIn(!!userId);
  }, []);

  const setLoggedOut = useCallback(() => {
    setIsLoggedIn(false);
  }, []);

  // Initial check
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Re-check when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAuth();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, checkAuth, setLoggedOut }}>
      {children}
    </AuthContext.Provider>
  );
}
