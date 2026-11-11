"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, User, Phone, Check, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/auth-context";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasMinLength || !hasUppercase || !hasNumber) {
      setError("Veuillez respecter les critères de sécurité du mot de passe.");
      return;
    }

    if (!isMatch) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      const res = await register({
        fullName,
        email,
        password,
        phone: phone || undefined,
      });

      if (res.success) {
        router.push(callbackUrl);
      } else {
        setError(res.error || "Impossible de créer le compte");
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-28 sm:pt-36 pb-16 bg-[#0a0a0a] text-white">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Créer mon compte
          </h1>
          <p className="text-xs sm:text-sm text-[#9ca3af] max-w-sm mx-auto">
            Réservez vos places en quelques secondes et retrouvez tous vos e-billets.
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#141414] p-6 sm:p-8 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-[#e51923]/15 border border-[#e51923]/30 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300">Prénom et Nom</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-[#8c8c8c]" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Abdellah"
                  className="w-full rounded-[8px] border border-white/10 bg-[#0a0a0a] pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-[#737373] focus:border-[#ffc61a] focus:outline-none"
                />
              </div>
            </div>

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
                  className="w-full rounded-[8px] border border-white/10 bg-[#0a0a0a] pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-[#737373] focus:border-[#ffc61a] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300">Téléphone (Optionnel)</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-[#8c8c8c]" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+212 6 00 00 00 00"
                  className="w-full rounded-[8px] border border-white/10 bg-[#0a0a0a] pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-[#737373] focus:border-[#ffc61a] focus:outline-none"
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
                  className="w-full rounded-[8px] border border-white/10 bg-[#0a0a0a] pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-[#737373] focus:border-[#ffc61a] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300">Confirmer le mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#8c8c8c]" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-[8px] border border-white/10 bg-[#0a0a0a] pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-[#737373] focus:border-[#ffc61a] focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#0a0a0a] p-3.5 space-y-1.5 text-xs text-[#9ca3af]">
              <div className={`flex items-center gap-2 ${hasMinLength ? "text-emerald-400 font-bold" : ""}`}>
                <Check className="h-3.5 w-3.5" />
                <span>8 caractères minimum</span>
              </div>
              <div className={`flex items-center gap-2 ${hasUppercase ? "text-emerald-400 font-bold" : ""}`}>
                <Check className="h-3.5 w-3.5" />
                <span>Au moins 1 majuscule</span>
              </div>
              <div className={`flex items-center gap-2 ${hasNumber ? "text-emerald-400 font-bold" : ""}`}>
                <Check className="h-3.5 w-3.5" />
                <span>Au moins 1 chiffre</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !hasMinLength || !hasUppercase || !hasNumber || !isMatch}
              className="flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#ffc61a] hover:bg-[#ffd147] py-3.5 text-xs sm:text-sm font-bold text-[#0a0a0a] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Création du compte...</span>
                </>
              ) : (
                <>
                  <span>Créer mon compte</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 text-xs text-[#9ca3af]">
            Vous avez déjà un compte ?{" "}
            <Link href="/login" className="font-bold text-[#ffc61a] hover:underline">
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
          <Loader2 className="h-8 w-8 animate-spin text-[#ffc61a]" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
