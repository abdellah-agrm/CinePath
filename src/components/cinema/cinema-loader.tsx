"use client";

import Image from "next/image";

interface CinemaLoaderProps {
  message?: string;
  submessage?: string;
  fullScreen?: boolean;
  compact?: boolean;
}

export function CinemaLoader({
  message = "Préparation de votre film...",
  submessage = "Séances en temps réel · IMAX & 4DX",
  fullScreen = true,
  compact = false,
}: CinemaLoaderProps) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] text-white select-none ${
        fullScreen
          ? "min-h-screen w-full px-4"
          : compact
          ? "min-h-[340px] w-full py-12 px-4"
          : "min-h-[75vh] w-full py-16 px-4"
      }`}
      role="status"
      aria-live="polite"
    >
      {/* Ambient Cinematic Spotlight & Glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {/* Soft Gold/Amber Radial Glow */}
        <div className="h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-[#ffc61a]/10 blur-[100px] animate-cinema-glow" />
        {/* Soft Warm Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/40 to-[#0a0a0a]" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm sm:max-w-md mx-auto">
        {/* Animated Brand Logo Container */}
        <div className="relative mb-6 flex items-center justify-center">
          {/* Subtle Halo Ring */}
          <div className="absolute -inset-4 rounded-3xl bg-[#ffc61a]/10 blur-xl animate-pulse" />

          {/* Official CinePath Bear Logo */}
          <div className="relative flex items-center justify-center animate-cinema-pulse">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/CinePath_Bear_White_Full_Logo.png"
              alt="CinePath"
              className="h-14 sm:h-16 w-auto object-contain filter drop-shadow-[0_8px_24px_rgba(255,198,26,0.25)]"
              loading="eager"
            />
          </div>
        </div>

        {/* Cinematic Golden Shimmer Progress Bar */}
        <div className="relative w-44 sm:w-56 h-1 rounded-full bg-white/[0.08] overflow-hidden mb-5">
          <div
            className="absolute inset-y-0 w-2/3 rounded-full bg-gradient-to-r from-transparent via-[#ffc61a] to-transparent animate-cinema-shimmer"
            style={{ willChange: "transform" }}
          />
        </div>

        {/* Status Messages */}
        <h3 className="text-base sm:text-lg font-bold tracking-tight text-white mb-1.5 flex items-center justify-center gap-1.5">
          <span>{message}</span>
        </h3>

        {submessage && (
          <p className="text-xs sm:text-[13px] text-neutral-400 font-medium tracking-wide max-w-xs leading-relaxed">
            {submessage}
          </p>
        )}

        {/* Subtle Live Status Indicator */}
        <div className="mt-6 flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] font-semibold text-neutral-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffc61a] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ffc61a]" />
          </span>
          <span className="tracking-wider uppercase text-[10px] text-neutral-400">
            CinePath Multiplex
          </span>
        </div>
      </div>
    </div>
  );
}
