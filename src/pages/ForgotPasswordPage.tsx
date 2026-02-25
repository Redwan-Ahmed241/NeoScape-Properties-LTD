import React, { useState, useMemo } from "react";
import { sendPasswordReset } from "../services/authService";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { ArrowLeft, Mail, Loader2, KeyRound, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import HomePage from "./HomePage";

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const result = await sendPasswordReset(email);
      if (!result.success) {
        setError(result.error || "Failed to send reset email");
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const homePageBackground = useMemo(
    () => (
      <div className="fixed inset-0 z-0 pointer-events-none">
        <HomePage />
      </div>
    ),
    [],
  );

  return (
    <>
      {homePageBackground}

      <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 z-10">
        <div className="w-full max-w-sm relative pointer-events-auto">
          <button
            onClick={() => navigate("/")}
            className="absolute -top-10 right-0 text-gray-700 hover:text-gray-900 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>

          <Card className="border-0 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] bg-white/90 backdrop-blur-md relative rounded-3xl">
            <div className="text-center pt-6 pb-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl shadow-lg mb-2">
                <KeyRound className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Reset Password
              </h2>
              <p className="mt-1 text-xs text-gray-600">
                {success
                  ? "Check your inbox for the reset link"
                  : "Enter your email and we'll send you a reset link"}
              </p>
            </div>

            <CardContent className="space-y-4 pb-6 px-6">
              {success ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-4 rounded-lg border border-green-200">
                    <svg
                      className="w-5 h-5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      We sent a password reset link to <strong>{email}</strong>.
                      Please check your email (and spam folder).
                    </span>
                  </div>
                  <div className="text-center">
                    <Link
                      to="/login"
                      className="text-sm font-medium text-pink-600 hover:text-pink-700"
                    >
                      &larr; Back to Sign In
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-xs font-medium">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-8 h-10 text-sm border-gray-200 focus:border-pink-500 focus:ring-pink-500"
                        placeholder="you@example.com"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                      <svg
                        className="w-5 h-5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin mr-2 h-5 w-5" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>

                  <div className="text-center pt-2">
                    <Link
                      to="/login"
                      className="text-sm font-medium text-gray-600 hover:text-gray-800 inline-flex items-center"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Back to Sign In
                    </Link>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
