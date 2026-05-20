"use client";

import type React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

/**
 * AuthenticatedLayout
 *
 * Wraps all protected routes with the same cinematic video background
 * used on the landing page. The Navbar is pinned to the top; page content
 * scrolls inside the frosted content area below it.
 *
 * Structure:
 *   <div> (full-screen shell)
 *     <video>          ← persistent background, never remounts
 *     <div z-10>       ← content layer above video
 *       <Navbar />     ← sticky, frosted glass
 *       <main>         ← scrollable page outlet
 *         <Outlet />   ← VillaListPage / VillaRoomsPage / etc.
 *       </main>
 *     </div>
 *   </div>
 */
const AuthenticatedLayout: React.FC = () => {
    return (
        <div className="relative min-h-screen bg-black text-white overflow-hidden">

            {/* ── Persistent background video — same as landing page ── */}
            <video
                className="fixed inset-0 w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                /* Use the same cinematic video as the hero */
                src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4"
            />

            {/* ── Dark scrim so content stays readable over the video ── */}
            <div
                className="fixed inset-0"
                style={{ background: "rgba(5,5,5,0.72)" }}
            />

            {/* ── All UI above the video ── */}
            <div className="relative z-10 flex flex-col min-h-screen">

                {/* Navbar — sticky, frosted glass */}
                <Navbar />

                {/* Page content — scrollable */}
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>

            </div>
        </div>
    );
};

export default AuthenticatedLayout;
