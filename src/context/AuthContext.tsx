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
  const router = useRouter();

  /* ── Bootstrap: read existing session ──── */

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    };

    getSession();

    /* ── Listen for auth state changes ─────── */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
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
