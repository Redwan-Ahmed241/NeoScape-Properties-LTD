import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../services/supabaseClient";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AppUser {
  id: string;
  email: string;
  username: string;
  phone?: string;
  profileImage?: string;
  role?: string;
}

export interface AuthContextType {
  /** Supabase session (null when logged out or still loading) */
  session: Session | null;
  /** Convenience user object derived from the Supabase user + metadata */
  user: AppUser | null;
  /** True while the initial session check is in progress */
  loading: boolean;
  /** Shorthand for session !== null */
  isAuthenticated: boolean;
  /** Sign in with email + password */
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  /** Sign out and clear session */
  logout: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextType | null>(null);

// ─── Hook ────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return context;
};

// ─── Helper: derive AppUser from Supabase user ──────────────────────────────

function toAppUser(user: User): AppUser {
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? "",
    username:
      meta.username ?? meta.full_name ?? user.email?.split("@")[0] ?? "",
    phone: meta.phone ?? user.phone ?? undefined,
    profileImage: meta.avatar_url ?? meta.profileImage ?? undefined,
    role: meta.role ?? "customer",
  };
}

// ─── Provider hook (internal) ────────────────────────────────────────────────

export const useAuthProvider = (): AuthContextType => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get the existing session on mount
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ? toAppUser(s.user) : null);
      setLoading(false);
    });

    // 2. Listen for auth state changes (login, logout, token refresh, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ? toAppUser(s.user) : null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────

  const login = async (credentials: {
    email: string;
    password: string;
  }): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      if (error) {
        console.error("Login failed:", error.message);
        return false;
      }
      // onAuthStateChange will update session/user automatically
      return true;
    } catch (err) {
      console.error("Login failed:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────────────

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    // onAuthStateChange will clear session/user
  };

  return {
    session,
    user,
    loading,
    isAuthenticated: !!session,
    login,
    logout,
  };
};
