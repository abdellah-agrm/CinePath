"use client";

import Link from "next/link";
import { useState } from "react";
import { Film, User as UserIcon, LogOut, Shield, Scan, ChevronDown } from "lucide-react";
import { useAuth, UserRole } from "@/context/auth-context";

export function Navbar() {
  const { user, role, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

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
          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary border border-primary/20">
            Customer
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white font-bold shadow-md shadow-primary/30">
            <Film className="h-5 w-5" />
          </span>
          <span className="text-xl font-bold tracking-tight text-white">
            Cine<span className="text-primary">Path</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/movies" className="text-muted-foreground hover:text-white transition">
            Movies
          </Link>
          <Link href="/cinemas" className="text-muted-foreground hover:text-white transition">
            Cinemas
          </Link>
          <Link href="/tickets" className="text-muted-foreground hover:text-white transition">
            My Tickets
          </Link>

          {/* Role-Specific Quick Links */}
          {(role === "STAFF" || role === "ADMIN") && (
            <Link
              href="/staff/validate"
              className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition font-medium"
            >
              <Scan className="h-4 w-4" />
              <span>Gate Scanner</span>
            </Link>
          )}

          {role === "ADMIN" && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-red-400 hover:text-red-300 transition font-semibold"
            >
              <Shield className="h-4 w-4" />
              <span>Admin Console</span>
            </Link>
          )}
        </nav>

        {/* User Account / Auth Actions */}
        <div className="relative flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2.5 rounded-lg border border-border bg-card/60 px-3 py-1.5 text-sm font-medium hover:bg-card transition"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[120px] truncate">{user.fullName}</span>
                {getRoleBadge(user.role)}
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card p-2 shadow-xl z-50">
                    <div className="border-b border-border px-3 py-2">
                      <p className="text-xs font-semibold text-white truncate">{user.fullName}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                    </div>

                    <div className="py-1 text-xs">
                      <Link
                        href="/tickets"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-white transition"
                      >
                        🎟️ My Tickets
                      </Link>

                      {(role === "STAFF" || role === "ADMIN") && (
                        <Link
                          href="/staff/validate"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-amber-400 hover:bg-muted transition"
                        >
                          <Scan className="h-3.5 w-3.5" /> Staff Gate Scanner
                        </Link>
                      )}

                      {role === "ADMIN" && (
                        <Link
                          href="/admin"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-red-400 hover:bg-muted transition"
                        >
                          <Shield className="h-3.5 w-3.5" /> Admin Dashboard
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-border pt-1">
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 transition"
                      >
                        <LogOut className="h-3.5 w-3.5" /> Sign Out
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
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted transition"
              >
                <UserIcon className="h-4 w-4" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/register"
                className="hidden sm:inline-flex items-center rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90 transition shadow-sm shadow-primary/30"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

