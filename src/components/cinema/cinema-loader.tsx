"use client";

interface CinemaLoaderProps {
  message?: string;
  submessage?: string;
  fullScreen?: boolean;
  compact?: boolean;
  theme?: "light" | "dark";
}

export function CinemaLoader({
  message = "Préparation de votre film...",
  submessage = "Séances en temps réel · IMAX & 4DX",
  fullScreen = true,
  compact = false,
  theme = "dark",
}: CinemaLoaderProps) {
  const isLight = theme === "light";

  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden select-none transition-colors duration-300 ${
        isLight
          ? compact
            ? "w-full py-12 px-4 bg-transparent text-[#1c1e24]"
            : fullScreen
            ? "min-h-screen w-full px-4 bg-[#f8f9fa] text-[#1c1e24]"
            : "min-h-[60vh] w-full py-14 px-4 bg-[#f8f9fa] text-[#1c1e24]"
          : compact
          ? "min-h-[340px] w-full py-12 px-4 bg-[#0a0a0a] text-white"
          : fullScreen
          ? "min-h-screen w-full px-4 bg-[#0a0a0a] text-white"
          : "min-h-[75vh] w-full py-16 px-4 bg-[#0a0a0a] text-white"
      }`}
      role="status"
      aria-live="polite"
    >
      {/* Ambient Spotlight & Glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {isLight ? (
          <div className="h-64 w-64 sm:h-80 sm:w-80 rounded-full bg-[#ffc61a]/20 blur-[80px] animate-cinema-glow" />
        ) : (
          <>
            <div className="h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-[#ffc61a]/10 blur-[100px] animate-cinema-glow" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/40 to-[#0a0a0a]" />
          </>
        )}
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm sm:max-w-md mx-auto">
        {/* Animated Brand Logo Container */}
        <div className="relative mb-5 flex items-center justify-center">
          {/* Subtle Halo Ring */}
          <div
            className={`absolute -inset-4 rounded-3xl blur-xl animate-pulse ${
              isLight ? "bg-[#ffc61a]/25" : "bg-[#ffc61a]/10"
            }`}
          />

          {/* Official CinePath Bear Logo (Light theme uses /logo/CinePath_Bear_Full_Logo.png) */}
          <div className="relative flex items-center justify-center animate-cinema-pulse">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                isLight
                  ? "/logo/CinePath_Bear_Full_Logo.png"
                  : "/logo/CinePath_Bear_White_Full_Logo.png"
              }
              alt="CinePath"
              className={`h-16 sm:h-20 w-auto object-contain ${
                isLight
                  ? "filter drop-shadow-[0_6px_20px_rgba(255,198,26,0.35)]"
                  : "filter drop-shadow-[0_8px_24px_rgba(255,198,26,0.25)]"
              }`}
              loading="eager"
            />
          </div>
        </div>

        {/* Cinematic Golden Shimmer Progress Bar */}
        <div
          className={`relative w-44 sm:w-56 h-1.5 rounded-full overflow-hidden mb-4 ${
            isLight ? "bg-zinc-200" : "bg-white/[0.08]"
          }`}
        >
          <div
            className="absolute inset-y-0 w-2/3 rounded-full bg-gradient-to-r from-transparent via-[#ffc61a] to-transparent animate-cinema-shimmer"
            style={{ willChange: "transform" }}
          />
        </div>

        {/* Status Messages */}
        <h3
          className={`text-base sm:text-lg font-black tracking-tight mb-1.5 flex items-center justify-center gap-1.5 ${
            isLight ? "text-[#1c1e24]" : "text-white"
          }`}
        >
          <span>{message}</span>
        </h3>

        {submessage && (
          <p
            className={`text-xs sm:text-[13px] font-medium tracking-wide max-w-xs leading-relaxed ${
              isLight ? "text-zinc-500" : "text-neutral-400"
            }`}
          >
            {submessage}
          </p>
        )}

        {/* Live Status Indicator Pill */}
        <div
          className={`mt-5 flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
            isLight
              ? "border border-zinc-200/90 bg-white/95 text-zinc-600 shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
              : "border border-white/[0.08] bg-white/[0.03] text-neutral-300"
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffc61a] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ffc61a]" />
          </span>
          <span
            className={`tracking-wider uppercase text-[10px] font-bold ${
              isLight ? "text-zinc-600" : "text-neutral-400"
            }`}
          >
            CinePath Multiplex
          </span>
        </div>
      </div>
    </div>
  );
}
