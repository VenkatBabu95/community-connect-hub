import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthUser, getCurrentUser, signIn, signOut, updateOnlineStatus } from '@/lib/auth';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(async () => {
            const authUser = await getCurrentUser();
            setUser(authUser);
            if (authUser) {
              await updateOnlineStatus(true);
            }
            setIsLoading(false);
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // Then get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        setIsLoading(false);
      }
    });

    // Update online status on window events
    const handleBeforeUnload = () => {
      updateOnlineStatus(false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const login = async (username: string, password: string) => {
    await signIn(username, password);
  };

  const logout = async () => {
    await updateOnlineStatus(false);
    await signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAdmin: user?.role === 'admin',
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
