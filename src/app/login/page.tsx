"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, Shield, Scan, User, ArrowRight, Loader2, AlertCircle } from "lucide-react";
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
      ? "Accès réservé aux administrateurs."
      : deniedReason === "staff_only"
      ? "Accès réservé au personnel habilité."
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
        setError(res.error || "Identifiants incorrects");
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
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
        setError("Impossible de charger le compte démo.");
      }
    } catch (err: any) {
      setError(err.message || "Erreur de connexion démo");
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-28 sm:pt-36 pb-16 bg-[#0a0a0a] text-white">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Mon compte Pathé
          </h1>
          <p className="text-xs sm:text-sm text-[#9ca3af] max-w-sm mx-auto">
            Connectez-vous pour retrouver vos e-billets, votre Cinécarte et vos réservations.
          </p>
        </div>

        {/* Quick Role Switcher */}
        <div className="rounded-xl border border-white/[0.08] bg-[#141414] p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-300">
            <span>Connexion rapide (Démo)</span>
            <span className="text-[10px] text-[#9ca3af] bg-white/5 px-2 py-0.5 rounded">
              1-Clic
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo("CUSTOMER")}
              disabled={loading || !!demoLoading}
              className="flex flex-col items-center justify-center gap-1 rounded-lg border border-[#ffc61a]/30 bg-[#ffc61a]/10 p-2.5 text-center text-xs font-bold text-[#ffc61a] hover:bg-[#ffc61a]/20 active:scale-[0.97] transition-all cursor-pointer"
            >
              {demoLoading === "CUSTOMER" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <User className="h-4 w-4" />
              )}
              <span>Spectateur</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("STAFF")}
              disabled={loading || !!demoLoading}
              className="flex flex-col items-center justify-center gap-1 rounded-lg border border-white/15 bg-white/5 p-2.5 text-center text-xs font-bold text-white hover:bg-white/10 active:scale-[0.97] transition-all cursor-pointer"
            >
              {demoLoading === "STAFF" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Scan className="h-4 w-4" />
              )}
              <span>Contrôleur</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("ADMIN")}
              disabled={loading || !!demoLoading}
              className="flex flex-col items-center justify-center gap-1 rounded-lg border border-white/15 bg-white/5 p-2.5 text-center text-xs font-bold text-white hover:bg-white/10 active:scale-[0.97] transition-all cursor-pointer"
            >
              {demoLoading === "ADMIN" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Standard Email/Password Login Form */}
        <div className="rounded-xl border border-white/[0.08] bg-[#141414] p-6 sm:p-8 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-[#e51923]/15 border border-[#e51923]/30 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300">Adresse e-mail</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[#8c8c8c]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="abdellah.agrm@gmail.com"
                  className="w-full rounded-[8px] border border-white/10 bg-[#0a0a0a] pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-[#737373] focus:border-[#ffc61a] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#8c8c8c]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-[8px] border border-white/10 bg-[#0a0a0a] pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-[#737373] focus:border-[#ffc61a] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !!demoLoading}
              className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#ffc61a] hover:bg-[#ffd147] py-3.5 text-xs sm:text-sm font-bold text-[#0a0a0a] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 text-xs text-[#9ca3af]">
            Pas encore de compte ?{" "}
            <Link href="/register" className="font-bold text-[#ffc61a] hover:underline">
              Créer un compte
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
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
          <Loader2 className="h-8 w-8 animate-spin text-[#ffc61a]" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
