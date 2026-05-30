import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ─── FadeIn ───────────────────────────────────────────────────────────────────

interface FadeInProps {
  delay?: number;
  duration?: number;
  children: React.ReactNode;
  className?: string;
}

function FadeIn({
  delay = 0,
  duration = 1000,
  children,
  className = "",
}: FadeInProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className={`transition-opacity ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── AnimatedHeading ──────────────────────────────────────────────────────────

interface AnimatedHeadingProps {
  text: string; // use \n for line breaks
  className?: string;
  style?: React.CSSProperties;
}

function AnimatedHeading({
  text,
  className = "",
  style,
}: AnimatedHeadingProps) {
  const charDelay = 30;
  const startDelay = 200;
  const lines = text.split("\n");

  // Pre-compute total chars in previous lines for stagger offset
  const lineLengths = lines.map((l) => l.length);

  return (
    <h1 className={className} style={style}>
      {lines.map((line, lineIndex) => {
        const prevChars = lineLengths
          .slice(0, lineIndex)
          .reduce((a, b) => a + b, 0);
        const words = line.split(" ");

        // helper to compute total chars in previous words on this line
        const charsBeforeWord = (wIndex: number) =>
          words.slice(0, wIndex).reduce((a, b) => a + b.length, 0);

        return (
          <span key={lineIndex} className="block">
            {words.map((word, wIndex) => (
              <span key={wIndex} className="inline-block mr-2">
                {word.split("").map((char, charIndex) => {
                  const delay =
                    startDelay +
                    (prevChars + charsBeforeWord(wIndex) + charIndex) *
                      charDelay;
                  return (
                    <AnimatedChar key={`${wIndex}-${charIndex}`} delay={delay}>
                      {char === " " ? "\u00A0" : char}
                    </AnimatedChar>
                  );
                })}
              </span>
            ))}
          </span>
        );
      })}
    </h1>
  );
}

interface AnimatedCharProps {
  delay: number;
  children: string;
}

function AnimatedChar({ delay, children }: AnimatedCharProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <span
      className="inline-block"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-18px)",
        transition: "opacity 500ms ease, transform 500ms ease",
      }}
    >
      {children}
    </span>
  );
}

// ─── HeroPage ─────────────────────────────────────────────────────────────────

export default function HeroPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* ── Background Video — raw, no overlays ── */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4"
          type="video/mp4"
        />
      </video>

      {/* ── All content above video ── */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* ── Navbar ── */}
        <div className="px-6 md:px-12 lg:px-16 pt-6">
          <div className="liquid-glass rounded-xl px-4 py-2 flex items-center justify-between">
            {/* Logo */}
            <span className="text-2xl font-semibold tracking-tight text-white">
              NeoScape Properties
            </span>

            {/* Center nav — desktop only */}
            <nav className="hidden md:flex items-center gap-8 text-sm text-white">
              <button
                onClick={() => navigate("/properties")}
                className="hover:text-gray-300 transition-colors duration-300"
              >
                Browse Properties
              </button>
              <button
                onClick={() => navigate("/tenant/login")}
                className="hover:text-gray-300 transition-colors duration-300"
              >
                Tenant Portal
              </button>
              <button
                onClick={() => navigate("/admin/login")}
                className="hover:text-gray-300 transition-colors duration-300"
              >
                Admin Management
              </button>
            </nav>

            {/* CTA */}
            <button
              onClick={() => navigate("/properties")}
              className="bg-white text-black px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              View Listings
            </button>
          </div>
        </div>

        {/* ── Hero Content ── */}
        <div className="flex-1 flex flex-col justify-end px-6 md:px-12 lg:px-16 pb-12 lg:pb-16">
          <div className="lg:grid lg:grid-cols-2 lg:items-end">
            {/* Left column */}
            <div>
              {/* Main heading */}
              <AnimatedHeading
                text={"Find and manage\nyour premium space."}
                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-normal mb-4"
                style={{ letterSpacing: "-0.04em" }}
              />

              {/* Subheading */}
              <FadeIn delay={800} duration={1000} className="mb-5">
                <p className="text-base md:text-lg text-gray-300 max-w-xl">
                  Discover curated luxury properties, secure your next room, and
                  manage your tenancy with absolute transparency.
                </p>
              </FadeIn>

              {/* Button row */}
              <FadeIn delay={1200} duration={1000}>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => navigate("/properties")}
                    className="bg-white text-black px-6 sm:px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                  >
                    Explore Properties
                  </button>
                  <button
                    onClick={() => navigate("/tenant/login")}
                    className="liquid-glass border border-white/20 text-white px-6 sm:px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-black transition-colors duration-300"
                  >
                    Tenant Portal
                  </button>
                </div>
              </FadeIn>
            </div>

            {/* Right column intentionally removed (tag card) */}
          </div>
        </div>
      </div>
    </div>
  );
}
