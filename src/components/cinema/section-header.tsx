"use client";

import { ChevronRight } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  cinemaName?: string;
  stackCinemaBelow?: boolean;
  onCinemaClick?: () => void;
  scrollProgress?: number; // 0 to 1
  showProgress?: boolean;
}

export function SectionHeader({
  title,
  cinemaName,
  stackCinemaBelow = false,
  onCinemaClick,
  scrollProgress = 0,
  showProgress = true,
}: SectionHeaderProps) {
  // Determine active segment (0, 1, or 2)
  const activeSegment = scrollProgress < 0.34 ? 0 : scrollProgress < 0.67 ? 1 : 2;

  return (
    <div className="flex items-end justify-between pb-3.5 pt-2">
      {/* Left: Title & Cinema Selector Trigger */}
      <div>
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <h2 className="text-[17px] sm:text-[19px] font-extrabold text-white tracking-tight inline-flex items-center gap-1 cursor-pointer hover:text-neutral-200 transition-colors">
            <span>{title}</span>
            <ChevronRight className="h-4 w-4 text-white stroke-[2.5] translate-y-[1px]" />
          </h2>

          {cinemaName && !stackCinemaBelow && (
            <button
              type="button"
              onClick={onCinemaClick}
              className="inline-flex items-center gap-1 text-[13px] sm:text-[14px] font-normal text-[#9ca3af] hover:text-white transition-colors cursor-pointer"
            >
              <span>{cinemaName}</span>
              <ChevronRight className="h-3.5 w-3.5 text-[#9ca3af] stroke-[2] translate-y-[1px]" />
            </button>
          )}
        </div>

        {cinemaName && stackCinemaBelow && (
          <button
            type="button"
            onClick={onCinemaClick}
            className="mt-0.5 block text-left text-[13px] font-normal text-[#9ca3af] hover:text-white transition-colors cursor-pointer"
          >
            {cinemaName}
          </button>
        )}
      </div>

      {/* Right: Segmented Thin Progress Bar matching pathe_home.png */}
      {showProgress && (
        <div className="hidden sm:flex items-center gap-1 pb-1">
          {[0, 1, 2].map((seg) => (
            <span
              key={seg}
              className={`h-[2px] rounded-full transition-colors duration-200 ${
                activeSegment === seg ? "w-7 bg-white" : "w-8 bg-white/20"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
