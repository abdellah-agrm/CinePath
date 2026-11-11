"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, Ticket, MapPin, User as UserIcon } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();

  // Hide mobile navigation in the dedicated booking flow
  if (pathname?.startsWith("/booking")) {
    return null;
  }

  return (
    <nav className="no-print print:hidden fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-white/[0.1] bg-background/85 backdrop-blur-2xl md:hidden px-2 shadow-2xl">
      <Link
        href="/"
        className="flex flex-col items-center gap-1 text-[11px] font-bold text-[#feca00] active:scale-[0.92] transition-transform"
      >
        <Film className="h-5 w-5" />
        <span>Films</span>
      </Link>
      <Link
        href="/cinemas"
        className="flex flex-col items-center gap-1 text-[11px] font-semibold text-neutral-400 hover:text-white active:scale-[0.92] transition-all"
      >
        <MapPin className="h-5 w-5" />
        <span>Cinémas</span>
      </Link>
      <Link
        href="/tickets"
        className="flex flex-col items-center gap-1 text-[11px] font-semibold text-neutral-400 hover:text-white active:scale-[0.92] transition-all"
      >
        <Ticket className="h-5 w-5" />
        <span>Billets</span>
      </Link>
      <Link
        href="/login"
        className="flex flex-col items-center gap-1 text-[11px] font-semibold text-neutral-400 hover:text-white active:scale-[0.92] transition-all"
      >
        <UserIcon className="h-5 w-5" />
        <span>Compte</span>
      </Link>
    </nav>
  );
}

