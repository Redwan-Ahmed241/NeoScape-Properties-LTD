import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { Loader2 } from "lucide-react";

/**
 * AuthCallbackPage
 *
 * This page handles the redirect from Supabase after:
 * - OAuth sign-in (Google, GitHub, etc.)
 * - Email confirmation links
 *
 * Supabase appends tokens as a URL hash fragment (#access_token=...&refresh_token=...).
 * The Supabase client automatically detects and processes these tokens when
 * `detectSessionInUrl: true` is set (our default).
 *
 * This page simply waits for the session to be established, then redirects home.
 */
const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase JS client reads the hash fragment automatically.
        // We just need to check if it resulted in a valid session.
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          setError(sessionError.message);
          return;
        }

        if (session) {
          // Session established — go home
          navigate("/", { replace: true });
        } else {
          // No session yet — might be email confirmation.
          // Wait a moment then redirect to login.
          setTimeout(() => navigate("/login", { replace: true }), 2000);
        }
      } catch (err: any) {
        setError(err.message || "Authentication failed");
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 p-8 bg-white rounded-xl shadow-sm max-w-sm">
          <div className="text-red-500 text-lg font-semibold">
            Authentication Error
          </div>
          <p className="text-gray-600 text-sm">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="text-pink-600 hover:text-pink-700 text-sm font-medium"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <Loader2 className="animate-spin h-10 w-10 text-pink-500 mx-auto" />
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
