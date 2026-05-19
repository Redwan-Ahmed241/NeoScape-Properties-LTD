import { useState } from "react";
import { motion, type Variants } from "motion/react";
import { Circle, Eye, EyeOff, Check } from "lucide-react";

// ─── Reusable Components ────────────────────────────────────────────────────

interface StepItemProps {
  number: number;
  text: string;
  active?: boolean;
}

function StepItem({ number, text, active = false }: StepItemProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-300 ${
        active
          ? "bg-white text-black border border-white"
          : "bg-brand-gray text-white"
      }`}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
          active ? "bg-black text-white" : "bg-white/10 text-white/40"
        }`}
      >
        {active ? <Check className="h-3 w-3" strokeWidth={3} /> : number}
      </span>
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}

interface InputGroupProps {
  label: string;
  placeholder: string;
  type: string;
  rightElement?: React.ReactNode;
}

function InputGroup({
  label,
  placeholder,
  type,
  rightElement,
}: InputGroupProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-white">{label}</label>
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl bg-brand-gray px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200"
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Animation Variants ──────────────────────────────────────────────────────

const heroContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const heroItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <main className="flex min-h-screen w-full bg-black selection:bg-white/30 p-2 transition-all duration-500 lg:h-screen lg:overflow-hidden lg:p-4">
      {/* ── Left Column (Hero) ── */}
      <div className="relative hidden w-[52%] flex-col items-center justify-end pb-32 px-12 rounded-3xl overflow-hidden shadow-2xl h-full lg:flex">
        {/* Background Video — no overlay */}
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_081238_406ed0e3-5d83-436e-a512-0bbff7ec5b95.mp4"
            type="video/mp4"
          />
        </video>

        {/* Hero Content */}
        <motion.div
          className="relative z-10 w-full max-w-xs space-y-8"
          variants={heroContainer}
          initial="hidden"
          animate="show"
        >
          {/* Brand / Logo */}
          <motion.div variants={heroItem} className="flex items-center gap-2">
            <Circle className="h-5 w-5 fill-white text-white" />
            <span className="text-xl font-semibold tracking-tight text-white">
              NeoScape Properties
            </span>
          </motion.div>

          {/* Heading Block */}
          <motion.div variants={heroItem} className="space-y-2">
            <h1 className="text-4xl font-medium tracking-tight text-white whitespace-nowrap">
              Welcome Back
            </h1>
            <p className="text-sm leading-relaxed text-white/60 px-4">
              Sign in to continue managing your workspace and profile.
            </p>
          </motion.div>

          {/* Steps */}
          <motion.div variants={heroItem} className="space-y-2">
            <StepItem number={1} text="Access your dashboard" active />
            <StepItem number={2} text="Manage your properties" />
            <StepItem number={3} text="Continue your journey" />
          </motion.div>
        </motion.div>
      </div>

      {/* ── Right Column (Form) ── */}
      <div className="flex flex-1 flex-col items-center justify-center py-12 lg:py-6 px-4 sm:px-12 lg:px-16 xl:px-24 overflow-y-auto lg:overflow-hidden">
        <motion.div
          className="w-full max-w-xl space-y-8 lg:space-y-6 sm:space-y-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="space-y-1.5">
            <h2 className="text-3xl font-medium tracking-tight text-white">
              Sign In
            </h2>
            <p className="text-sm text-white/40">
              Enter your credentials to access your account.
            </p>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            {/* Email */}
            <InputGroup
              label="Email"
              placeholder="you@example.com"
              type="email"
            />

            {/* Password */}
            <InputGroup
              label="Password"
              placeholder="••••••••"
              type={showPassword ? "text" : "password"}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-white/40 hover:text-white/70 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
            />

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex cursor-pointer items-center gap-2.5 select-none">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={rememberMe ? "true" : "false"}
                  onClick={() => setRememberMe((v) => !v)}
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all duration-200 ${
                    rememberMe
                      ? "border-white bg-white"
                      : "border-white/20 bg-transparent"
                  }`}
                >
                  {rememberMe && (
                    <Check className="h-2.5 w-2.5 text-black" strokeWidth={3} />
                  )}
                </button>
                <span className="text-sm text-white/60">Remember me</span>
              </label>

              <button
                type="button"
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="mt-4 h-14 w-full rounded-xl bg-white font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.98]"
            >
              Sign In
            </button>
          </form>

          {/* Footer Link */}
          <p className="text-center text-sm text-white/40">
            New to NeoScape Properties ?{" "}
            <button
              type="button"
              className="font-medium text-white hover:text-white/80 transition-colors"
            >
              Create an account
            </button>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
