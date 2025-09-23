import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Set provisional user immediately for snappier UX
          setUser({
            id: session.user.id,
            email: session.user.email,
            isAnonymous: !session.user.email,
            createdAt: new Date().toISOString()
          });
          // Ensure DB record in background
          handleUser(session.user).catch(err => console.error('Error ensuring user record:', err));
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          // Set provisional user immediately
          setUser({
            id: session.user.id,
            email: session.user.email,
            isAnonymous: !session.user.email,
            createdAt: new Date().toISOString()
          });
          // Background ensure
          handleUser(session.user).catch(err => console.error('Error ensuring user record:', err));
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleUser = async (supabaseUser: SupabaseUser) => {
    try {
      // Check if user exists in our users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (existingUser) {
        setUser({
          id: existingUser.id,
          email: existingUser.email,
          isAnonymous: existingUser.is_anonymous,
          createdAt: existingUser.created_at
        });
      } else {
        // Create new user record
        const { data: newUser, error } = await supabase
          .from('users')
          .insert({
            id: supabaseUser.id,
            email: supabaseUser.email,
            is_anonymous: !supabaseUser.email
          })
          .select()
          .single();

        if (error) throw error;

        setUser({
          id: newUser.id,
          email: newUser.email,
          isAnonymous: newUser.is_anonymous,
          createdAt: newUser.created_at
        });
      }
    } catch (error) {
      console.error('Error handling user:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const signInAnonymously = async () => {
    try {
      // Generate a random anonymous user ID
      const anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('🔐 Creating anonymous user:', anonymousId);
      
      // Create anonymous user in our database
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: anonymousId,
          email: null,
          is_anonymous: true
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating anonymous user:', error);
        throw error;
      }

      console.log('✅ Anonymous user created:', data);

      setUser({
        id: data.id,
        email: data.email,
        isAnonymous: true,
        createdAt: data.created_at
      });
    } catch (error) {
      console.error('Error creating anonymous user:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    signInAnonymously
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
