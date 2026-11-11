"use client";

import Link from "next/link";
import { useState } from "react";
import { Film, User as UserIcon, LogOut, Shield, Scan, ChevronDown, Search, Globe, Ticket } from "lucide-react";
import { useAuth, UserRole } from "@/context/auth-context";

export function Navbar() {
  const { user, role, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<"FR" | "EN">("FR");

  const getRoleBadge = (userRole: UserRole) => {
    switch (userRole) {
      case "ADMIN":
        return (
          <span className="flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-400 border border-red-500/20">
            <Shield className="h-3 w-3" /> Admin
          </span>
        );
      case "STAFF":
        return (
          <span className="flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
            <Scan className="h-3 w-3" /> Staff
          </span>
        );
      default:
        return (
          <span className="rounded bg-amber-400/10 px-2 py-0.5 text-xs font-semibold text-amber-400 border border-amber-400/20">
            Membre
          </span>
        );
    }
  };

  return (
    <header className="no-print print:hidden sticky top-0 z-50 border-b border-white/[0.08] bg-[#09090b]/90 backdrop-blur-xl transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Logo & Main Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center active:scale-[0.98] transition-transform" aria-label="CinePath">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/CinePath_Bear_White_Full_Logo.png"
              alt="CinePath"
              className="h-10 sm:h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
            />
          </Link>

          {/* Desktop Navigation Links (Films, Cinémas, Offres) */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-semibold">
            <Link
              href="/movies"
              className="rounded-xl px-4 py-1.5 text-neutral-300 hover:text-white hover:bg-white/[0.06] active:scale-[0.97] transition-all"
            >
              Films
            </Link>
            <Link
              href="/cinemas"
              className="rounded-xl px-4 py-1.5 text-neutral-300 hover:text-white hover:bg-white/[0.06] active:scale-[0.97] transition-all"
            >
              Cinémas
            </Link>
            <Link
              href="/terms"
              className="rounded-xl px-4 py-1.5 text-neutral-300 hover:text-white hover:bg-white/[0.06] active:scale-[0.97] transition-all"
            >
              Offres
            </Link>

            {/* Quick Staff / Admin Navigation */}
            {(role === "STAFF" || role === "ADMIN") && (
              <Link
                href="/staff/validate"
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-amber-400 hover:bg-amber-400/10 active:scale-[0.97] transition-all font-bold text-xs border border-amber-400/20 ml-2"
              >
                <Scan className="h-3.5 w-3.5" />
                <span>Scanner</span>
              </Link>
            )}

            {role === "ADMIN" && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-red-400 hover:bg-red-500/10 active:scale-[0.97] transition-all font-bold text-xs border border-red-500/20 ml-1"
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Admin</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Right: Search, Account & Language */}
        <div className="flex items-center gap-3">
          {/* Search Trigger Button */}
          <Link
            href="/movies"
            aria-label="Rechercher un film"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-neutral-300 hover:text-white hover:bg-white/[0.08] active:scale-[0.95] transition-all"
          >
            <Search className="h-4 w-4" />
          </Link>

          {/* User Account / Auth Actions */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Menu utilisateur"
                aria-expanded={menuOpen}
                className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-card/70 px-3 py-1.5 text-sm font-semibold hover:bg-card active:scale-[0.97] transition-all cursor-pointer shadow-sm hover:border-white/20"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400/20 text-xs font-black text-amber-400 ring-1 ring-amber-400/30">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[120px] truncate">{user.fullName}</span>
                {getRoleBadge(user.role)}
                <ChevronDown className={`h-3.5 w-3.5 text-neutral-400 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`} />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-white/[0.12] bg-[#121215]/95 backdrop-blur-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="border-b border-white/[0.08] px-3 py-2.5">
                      <p className="text-xs font-bold text-white truncate">{user.fullName}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                    </div>

                    <div className="py-1 text-xs space-y-0.5">
                      <Link
                        href="/tickets"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-neutral-300 hover:bg-white/[0.08] hover:text-white active:scale-[0.98] transition-all"
                      >
                        <Ticket className="h-4 w-4 text-amber-400" />
                        <span>Mes Billets</span>
                      </Link>

                      {(role === "STAFF" || role === "ADMIN") && (
                        <Link
                          href="/staff/validate"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-amber-400 hover:bg-amber-500/10 active:scale-[0.98] transition-all"
                        >
                          <Scan className="h-3.5 w-3.5" /> Scanner de contrôle
                        </Link>
                      )}

                      {role === "ADMIN" && (
                        <Link
                          href="/admin"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-red-400 hover:bg-red-500/10 active:scale-[0.98] transition-all"
                        >
                          <Shield className="h-3.5 w-3.5" /> Console Administrateur
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-white/[0.08] pt-1">
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/15 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" /> Se déconnecter
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-1.5 text-xs sm:text-sm font-semibold hover:bg-white/[0.08] hover:border-white/20 active:scale-[0.97] transition-all"
              >
                <UserIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Connexion</span>
              </Link>
              <Link
                href="/register"
                className="hidden sm:inline-flex items-center rounded-xl bg-[#feca00] hover:bg-[#ffd633] px-4 py-1.5 text-xs sm:text-sm font-black text-black active:scale-[0.97] transition-all shadow-md shadow-[#feca00]/20"
              >
                S&apos;inscrire
              </Link>
            </div>
          )}

          {/* Language Selector Dropdown (FR / EN) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-bold text-neutral-300 hover:text-white hover:bg-white/[0.08] active:scale-[0.96] transition-all cursor-pointer"
            >
              <span>{currentLang}</span>
              <ChevronDown className="h-3 w-3 text-neutral-400" />
            </button>
            {langOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                <div className="absolute right-0 mt-2 w-28 rounded-xl border border-white/10 bg-[#121215] p-1.5 shadow-xl z-50 text-xs font-bold">
                  <button
                    onClick={() => {
                      setCurrentLang("FR");
                      setLangOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-1.5 rounded-lg transition-colors ${
                      currentLang === "FR" ? "bg-amber-400 text-black" : "text-neutral-300 hover:bg-white/10"
                    }`}
                  >
                    <span>Français</span>
                    <span>FR</span>
                  </button>
                  <button
                    onClick={() => {
                      setCurrentLang("EN");
                      setLangOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-1.5 rounded-lg transition-colors mt-0.5 ${
                      currentLang === "EN" ? "bg-amber-400 text-black" : "text-neutral-300 hover:bg-white/10"
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
  );
}
