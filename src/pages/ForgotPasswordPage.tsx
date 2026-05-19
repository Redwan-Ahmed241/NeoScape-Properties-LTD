"use client";

import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, type Variants } from "motion/react";
import { Circle, ArrowLeft, Check } from "lucide-react";
import { sendPasswordReset } from "../services/authService";

const heroContainer: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
};
const heroItem: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

function StepItem({ number, text, active = false }: { number: number; text: string; active?: boolean }) {
    return (
        <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-300 ${active ? "bg-white text-black border border-white" : "bg-[#1A1A1A] text-white"}`}>
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${active ? "bg-black text-white" : "bg-white/10 text-white/40"}`}>
                {active ? <Check className="h-3 w-3" strokeWidth={3} /> : number}
            </span>
            <span className="text-sm font-medium">{text}</span>
        </div>
    );
}

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        const result = await sendPasswordReset(email);
        setIsLoading(false);
        if (!result.success) {
            setError(result.error || "Failed to send reset email.");
        } else {
            setSent(true);
        }
    };

    return (
        <main className="flex min-h-screen w-full bg-black selection:bg-white/30 p-2 transition-all duration-500 lg:h-screen lg:overflow-hidden lg:p-4">
            {/* Left Column */}
            <div className="relative hidden w-[52%] flex-col items-center justify-end pb-32 px-12 rounded-3xl overflow-hidden shadow-2xl h-full lg:flex">
                <video className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline>
                    <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_081238_406ed0e3-5d83-436e-a512-0bbff7ec5b95.mp4" type="video/mp4" />
                </video>
                <motion.div className="relative z-10 w-full max-w-xs space-y-8" variants={heroContainer} initial="hidden" animate="show">
                    <motion.div variants={heroItem} className="flex items-center gap-2">
                        <Circle className="h-5 w-5 fill-white text-white" />
                        <span className="text-xl font-semibold tracking-tight text-white">NeoScape Properties</span>
                    </motion.div>
                    <motion.div variants={heroItem} className="space-y-2">
                        <h1 className="text-4xl font-medium tracking-tight text-white whitespace-nowrap">Reset Password</h1>
                        <p className="text-sm leading-relaxed text-white/60 px-4">We'll send a secure link to your email address.</p>
                    </motion.div>
                    <motion.div variants={heroItem} className="space-y-2">
                        <StepItem number={1} text="Enter your email" active />
                        <StepItem number={2} text="Check your inbox" />
                        <StepItem number={3} text="Set a new password" />
                    </motion.div>
                </motion.div>
            </div>

            {/* Right Column */}
            <div className="flex flex-1 flex-col items-center justify-center py-12 lg:py-6 px-4 sm:px-12 lg:px-16 xl:px-24 overflow-y-auto lg:overflow-hidden">
                <motion.div className="w-full max-w-xl space-y-8 lg:space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, ease: "easeOut" }}>
                    <button onClick={() => navigate("/admin/login")} className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors">
                        <ArrowLeft className="h-4 w-4" /> Back to Sign In
                    </button>

                    <div className="space-y-1.5">
                        <h2 className="text-3xl font-medium tracking-tight text-white">Forgot Password</h2>
                        <p className="text-sm text-white/40">Enter your email and we'll send you a reset link.</p>
                    </div>

                    {sent ? (
                        <div className="flex flex-col items-center gap-4 py-8 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20">
                                <Check className="h-6 w-6 text-green-400" strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="text-white font-medium">Check your inbox</p>
                                <p className="text-sm text-white/40 mt-1">A password reset link has been sent to <span className="text-white/70">{email}</span>.</p>
                            </div>
                            <button onClick={() => navigate("/admin/login")} className="mt-2 text-sm font-medium text-white hover:text-white/80 transition-colors">
                                Return to Sign In
                            </button>
                        </div>
                    ) : (
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="email" className="text-sm font-medium text-white">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                    className="h-11 w-full rounded-xl bg-[#1A1A1A] px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200"
                                />
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                                    <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="mt-4 h-14 w-full rounded-xl bg-white font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <><svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> Sending...</>
                                ) : "Send Reset Link"}
                            </button>
                        </form>
                    )}
                </motion.div>
            </div>
        </main>
    );
};

export default ForgotPasswordPage;
