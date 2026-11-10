"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Film, Lock, Mail, Shield, Scan, User, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useAuth, UserRole } from "@/context/auth-context";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const deniedReason = searchParams.get("denied");

  const { login, quickLogin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    deniedReason === "admin_only"
      ? "You need Administrator privileges to access that page."
      : deniedReason === "staff_only"
      ? "You need Staff or Administrator privileges to access that page."
      : null
  );
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<UserRole | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        router.push(callbackUrl);
      } else {
        setError(res.error || "Invalid email or password");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: UserRole) => {
    setError(null);
    setDemoLoading(role);
    try {
      const success = await quickLogin(role);
      if (success) {
        if (role === "ADMIN") {
          router.push("/admin");
        } else if (role === "STAFF") {
          router.push("/staff/validate");
        } else {
          router.push(callbackUrl !== "/login" ? callbackUrl : "/");
        }
      } else {
        setError("Failed to sign in with demo account.");
      }
    } catch (err: any) {
      setError(err.message || "Demo login failed");
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30 shadow-lg shadow-primary/20">
            <Film className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Welcome to Cine<span className="text-primary">Path</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage bookings, tickets, and access your role privileges.
          </p>
        </div>

        {/* Quick Role Switcher */}
        <div className="rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-sm shadow-xl space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span className="uppercase tracking-wider">⚡ Quick Role Switcher</span>
            <span className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full border border-border">
              Select Profile
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo("ADMIN")}
              disabled={loading || !!demoLoading}
              className="flex flex-col items-center justify-center gap-1 rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-center text-xs font-medium text-red-400 hover:bg-red-500/20 transition disabled:opacity-50"
            >
              {demoLoading === "ADMIN" ? (
                <Loader2 className="h-4 w-4 animate-spin text-red-400" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              <span className="font-semibold">Admin</span>
              <span className="text-[9px] text-red-300/70">Full Access</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("STAFF")}
              disabled={loading || !!demoLoading}
              className="flex flex-col items-center justify-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-center text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition disabled:opacity-50"
            >
              {demoLoading === "STAFF" ? (
                <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
              ) : (
                <Scan className="h-4 w-4" />
              )}
              <span className="font-semibold">Staff</span>
              <span className="text-[9px] text-amber-300/70">Gate Scanner</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("CUSTOMER")}
              disabled={loading || !!demoLoading}
              className="flex flex-col items-center justify-center gap-1 rounded-xl border border-primary/30 bg-primary/10 p-2.5 text-center text-xs font-medium text-primary hover:bg-primary/20 transition disabled:opacity-50"
            >
              {demoLoading === "CUSTOMER" ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <User className="h-4 w-4" />
              )}
              <span className="font-semibold">Customer</span>
              <span className="text-[9px] text-primary/70">User Portal</span>
            </button>
          </div>
        </div>

        {/* Standard Email/Password Login Form */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-border bg-background/50 pl-10 pr-4 py-2.5 text-sm text-white placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border bg-background/50 pl-10 pr-4 py-2.5 text-sm text-white placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !!demoLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/30 hover:bg-primary/90 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In with Credentials</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

