"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

/* ─── Types ────────────────────────────────────────────────── */

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: 'admin' | 'user';
  isAdmin: boolean;

  /** Sign up with email + password. Returns the user on success. */
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error?: string }>;

  /** Sign in with email + password. */
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error?: string }>;

  /** Sign out the current user. */
  signOut: () => Promise<void>;

  /** Sign in with OAuth provider. */
  signInWithProvider: (provider: "google" | "apple") => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* ─── Provider ─────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const isAdmin = role === 'admin';
  const router = useRouter();

  const syncProfile = async (currentUser: User) => {
    try {
      const userId = currentUser.id;
      const email = currentUser.email || '';
      const fullName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || 'User';
      const avatarUrl = currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || null;
      const expectedRole = email === 'garapatisurya07@gmail.com' ? 'admin' : 'user';

      // 1. Fetch current profile
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (fetchError) {
        console.warn('Error fetching user profile:', fetchError.message);
        return;
      }

      if (!profile) {
        // 2. Profile does not exist, insert it!
        console.log('Profile record not found. Creating automatic profile...');
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: email,
            full_name: fullName,
            avatar_url: avatarUrl,
            role: expectedRole
          });

        if (insertError) {
          console.warn('Failed to auto-create profile:', insertError.message);
        } else {
          setRole(expectedRole);
        }
      } else {
        // 3. Profile exists, update role or info if needed
        const needsUpdate = !profile.email || !profile.full_name || (profile.role !== expectedRole);
        if (needsUpdate) {
          console.log('Syncing existing profile details...');
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              email: email || profile.email,
              full_name: fullName || profile.full_name,
              avatar_url: avatarUrl || profile.avatar_url,
              role: expectedRole
            })
            .eq('id', userId);

          if (updateError) {
            console.warn('Failed to update profile during sync:', updateError.message);
          }
        }
        setRole(profile.role as 'admin' | 'user' || expectedRole);
      }
    } catch (e) {
      console.warn('Exception in profile syncing:', e);
    }
  };

  /* ── Bootstrap: read existing session ──── */

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await syncProfile(currentUser);
      } else {
        setRole('user');
      }
      setLoading(false);
    };

    getSession();

    /* ── Listen for auth state changes ─────── */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      const currentUser = newSession?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await syncProfile(currentUser);
      } else {
        setRole('user');
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /* ── Sign up ───────────────────────────── */

  const signUp = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    return {};
  };

  /* ── Sign in ───────────────────────────── */

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    return {};
  };

  /* ── Sign out ──────────────────────────── */

  const signOut = async () => {
    setRole('user');
    await supabase.auth.signOut();
    router.push("/login");
  };


  /* ── OAuth providers ───────────────────── */

  const signInWithProvider = async (provider: "google" | "apple") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        role,
        isAdmin,
        signUp,
        signIn,
        signOut,
        signInWithProvider,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ─── Hook ─────────────────────────────────────────────────── */

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
