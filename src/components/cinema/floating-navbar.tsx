"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Search, User as UserIcon, Ticket, LogOut, Shield, Scan, ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export function FloatingNavbar() {
  const pathname = usePathname();
  const { user, role, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<"FR" | "EN">("FR");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (pathname?.startsWith("/booking")) {
    return null;
  }

  return (
    <>
      {/* Soft Vignette Overlay at the very top for perfect legibility over light backdrops */}
      <div className="no-print pointer-events-none fixed inset-x-0 top-0 z-40 h-28 bg-gradient-to-b from-black/80 via-black/40 to-transparent transition-opacity duration-300" />

      <header
        className={`no-print fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-white/[0.08] bg-[#09090b]/85 backdrop-blur-2xl shadow-2xl py-3"
            : "bg-transparent py-4"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Brand Logo & Primary Navigation */}
          <div className="flex items-center gap-8 lg:gap-10">
            <Link
              href="/"
              className="flex items-center active:scale-[0.98] transition-transform"
              aria-label="CinePath"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo/CinePath_Bear_White_Full_Logo.png"
                alt="CinePath"
                className="h-12 sm:h-14 w-auto object-contain transition-transform duration-200 hover:scale-[1.02]"
              />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-neutral-200">
              <Link
                href="/movies"
                className="hover:text-white transition-colors"
              >
                Films
              </Link>
              <Link
                href="/cinemas"
                className="hover:text-white transition-colors"
              >
                Cinémas
              </Link>
              <Link
                href="/terms"
                className="hover:text-white transition-colors"
              >
                Offres
              </Link>
            </nav>
          </div>

          {/* Right: Circular Icon Controls (Search, Account, Language) */}
          <div className="flex items-center gap-3">
            {/* Search Icon Button */}
            <Link
              href="/movies"
              aria-label="Rechercher un film"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white active:scale-[0.94] transition-all cursor-pointer shadow-sm"
            >
              <Search className="h-4 w-4" />
            </Link>

            {/* Account / User Button */}
            <div className="relative">
              {user ? (
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Menu profil"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#feca00] text-black font-extrabold text-xs active:scale-[0.94] transition-all cursor-pointer shadow-md shadow-[#feca00]/20"
                >
                  {user.fullName.charAt(0).toUpperCase()}
                </button>
              ) : (
                <Link
                  href="/login"
                  aria-label="Se connecter"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white active:scale-[0.94] transition-all cursor-pointer shadow-sm"
                >
                  <UserIcon className="h-4 w-4" />
                </Link>
              )}

              {/* User Dropdown Menu */}
              {user && menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-3 w-60 origin-top-right rounded-2xl border border-white/10 bg-[#121215]/95 backdrop-blur-2xl p-2 shadow-2xl z-50 text-xs">
                    <div className="border-b border-white/[0.08] px-3 py-2.5">
                      <p className="font-bold text-white truncate">{user.fullName}</p>
                      <p className="text-[11px] text-neutral-400 truncate">{user.email}</p>
                    </div>

                    <div className="py-1 space-y-0.5">
                      <Link
                        href="/tickets"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-neutral-300 hover:bg-white/[0.08] hover:text-white transition-all font-semibold"
                      >
                        <Ticket className="h-4 w-4 text-[#feca00]" />
                        <span>Mes Billets & Réservations</span>
                      </Link>

                      {(role === "STAFF" || role === "ADMIN") && (
                        <Link
                          href="/staff/validate"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-[#feca00] hover:bg-[#feca00]/10 transition-all font-semibold"
                        >
                          <Scan className="h-4 w-4" />
                          <span>Scanner de billets</span>
                        </Link>
                      )}

                      {role === "ADMIN" && (
                        <Link
                          href="/admin"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-rose-400 hover:bg-rose-500/10 transition-all font-semibold"
                        >
                          <Shield className="h-4 w-4" />
                          <span>Administration</span>
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-white/[0.08] pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-rose-400 hover:bg-rose-500/15 transition-all font-semibold cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Se déconnecter</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Language Dropdown (FR ▾) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 px-3 py-2 text-xs font-bold text-white active:scale-[0.94] transition-all cursor-pointer shadow-sm"
              >
                <span>{currentLang}</span>
                <ChevronDown className={`h-3 w-3 text-neutral-300 transition-transform ${langOpen ? "rotate-180" : ""}`} />
              </button>

              {langOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                  <div className="absolute right-0 mt-3 w-28 rounded-xl border border-white/10 bg-[#121215]/95 backdrop-blur-2xl p-1.5 shadow-2xl z-50 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentLang("FR");
                        setLangOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-1.5 rounded-lg transition-colors ${
                        currentLang === "FR" ? "bg-[#feca00] text-black" : "text-neutral-300 hover:bg-white/10"
                      }`}
                    >
                      <span>Français</span>
                      <span>FR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentLang("EN");
                        setLangOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-1.5 rounded-lg transition-colors mt-0.5 ${
                        currentLang === "EN" ? "bg-[#feca00] text-black" : "text-neutral-300 hover:bg-white/10"
                      }`}
                    >
                      <span>English</span>
                      <span>EN</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

