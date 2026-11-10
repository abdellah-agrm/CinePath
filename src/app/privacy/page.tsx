import Link from "next/link";
import { ArrowLeft, Lock, Database, EyeOff } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 pb-24">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <h1 className="text-3xl font-extrabold text-white tracking-tight">
        Privacy & GDPR Policy
      </h1>
      <p className="text-xs text-muted-foreground mt-1">
        CinePath Data Protection · Compliant with GDPR & Local Privacy Laws
      </p>

      <div className="mt-8 space-y-8 text-sm text-muted-foreground leading-relaxed">
        <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <EyeOff className="h-4 w-4 text-primary" />
            1. Guest Checkout & Minimal Data Collection
          </h2>
          <p>
            CinePath is designed with a privacy-first, guest-first philosophy. To purchase cinema tickets, you are only required to provide an email address where your encrypted tickets and receipt will be delivered.
          </p>
          <p>
            We do not sell, rent, or monetize your personal details with third-party advertising networks.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="h-4 w-4 text-emerald-400" />
            2. Payment Security & PCI Compliance
          </h2>
          <p>
            Payment information (card numbers, expiration dates, and security codes) is processed directly by <strong>Stripe Inc.</strong> through end-to-end encrypted fields. CinePath never stores or logs your raw card details on our servers.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="h-4 w-4 text-amber-400" />
            3. Right to Erasure (GDPR)
          </h2>
          <p>
            Under GDPR regulations, you have the right to request a full export or permanent deletion of your customer record and past booking logs at any time by contacting our data protection officer.
          </p>
        </section>
      </div>
    </div>
  );
}

