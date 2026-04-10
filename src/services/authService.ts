import { supabase } from "./supabaseClient";
import type { Session, User } from "@supabase/supabase-js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthResult {
  success: boolean;
  error?: string;
  needsEmailConfirmation?: boolean;
}

type ProviderSettings = {
  google?: boolean;
};

async function getProviderSettings(): Promise<ProviderSettings | null> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data?.external ?? null;
  } catch {
    return null;
  }
}

// ─── Email / Password ────────────────────────────────────────────────────────

export async function signUpWithEmail(
  email: string,
  password: string,
  metadata?: { username?: string; phone?: string }
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata, // stored in user.user_metadata
    },
  });

  if (error) return { success: false, error: error.message };

  // Supabase returns a user with identities=[] when the email already exists
  // but "Confirm email" is enabled — treat as duplicate
  if (
    data.user &&
    data.user.identities &&
    data.user.identities.length === 0
  ) {
    return {
      success: false,
      error: "An account with this email already exists.",
    };
  }

  // If email confirmation is required, the session will be null
  const needsEmailConfirmation = !data.session;
  return { success: true, needsEmailConfirmation };
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── OAuth (Google) ──────────────────────────────────────────────────────────

export async function signInWithGoogle(): Promise<AuthResult> {
  const providers = await getProviderSettings();

  if (providers && !providers.google) {
    return {
      success: false,
      error:
        "Google sign-in is disabled in Supabase. Enable Google provider in Supabase Dashboard > Authentication > Providers.",
    };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) {
    return {
      success: false,
      error:
        error.message ||
        "Google sign-in failed. Verify Google provider and redirect URL settings in Supabase.",
    };
  }
  // Browser will redirect — this return is only reached in error scenarios
  return { success: true };
}

// ─── Password Reset ─────────────────────────────────────────────────────────

export async function sendPasswordReset(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updatePassword(newPassword: string): Promise<AuthResult> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ─── Session helpers ─────────────────────────────────────────────────────────

export async function getSession(): Promise<Session | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.access_token ?? null;
}

export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
