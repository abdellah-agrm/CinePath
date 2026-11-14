"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export function CinemaFooter() {
  const pathname = usePathname();
  const [lang, setLang] = useState<"FR" | "EN">("FR");

  if (pathname?.startsWith("/booking")) {
    return null;
  }

  return (
    <footer className="no-print print:hidden border-t border-white/[0.08] bg-[#0a0a0a] text-xs text-[#8c8c8c] pb-20 md:pb-12">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-12 pt-14 pb-4">
        {/* Top Row: Brand Logo on Left, Separate FR / EN Square Buttons on Right */}
        <div className="flex items-center justify-between gap-6 pb-10">
          <Link href="/" className="flex items-center" aria-label="CinePath">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/CinePath_Bear_White_Full_Logo.png"
              alt="CinePath"
              className="h-14 sm:h-20 w-auto object-contain logo-screen-blend"
            />
          </Link>

          {/* Separate FR and EN buttons matching pathe_home.png & pathe_movie_page.png */}
          <div className="flex items-center gap-2 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setLang("FR")}
              className={`rounded-[6px] border px-3 py-1.5 transition-colors cursor-pointer ${
                lang === "FR"
                  ? "border-white/15 bg-white/10 text-white"
                  : "border-white/10 bg-transparent text-[#8c8c8c] hover:text-white"
              }`}
            >
              FR
            </button>
            <button
              type="button"
              onClick={() => setLang("EN")}
              className={`rounded-[6px] border px-3 py-1.5 transition-colors cursor-pointer ${
                lang === "EN"
                  ? "border-white/15 bg-white/10 text-white"
                  : "border-white/10 bg-transparent text-[#8c8c8c] hover:text-white"
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* 5-Column Sitemap Links matching pathe_home.png */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 pb-12">
          {/* Col 1: Les nouveautés à l'affiche */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-white text-[11.5px]">
              Les nouveautés à l&apos;affiche
            </h3>
            <ul className="space-y-2 text-[11px] text-[#8c8c8c]">
              <li>
                <Link href="/movies" className="hover:text-white transition-colors">
                  Tous les films
                </Link>
              </li>
              <li>
                <Link href="/#les-plus-attendus" className="hover:text-white transition-colors">
                  Les plus attendus
                </Link>
              </li>
              <li>
                <Link href="/movies" className="hover:text-white transition-colors">
                  Aya et Hadi
                </Link>
              </li>
              <li>
                <Link href="/movies" className="hover:text-white transition-colors">
                  Stylish / ستايلش
                </Link>
              </li>
              <li>
                <Link href="/movies" className="hover:text-white transition-colors">
                  Autisto
                </Link>
              </li>
              <li>
                <Link href="/movies" className="hover:text-white transition-colors">
                  Scrooge / Ebenezer
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2: Cinémas dans vos villes */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-white text-[11.5px]">
              Cinémas dans vos villes
            </h3>
            <ul className="space-y-2 text-[11px] text-[#8c8c8c]">
              <li>
                <Link href="/cinemas" className="hover:text-white transition-colors">
                  Pathé Californie
                </Link>
              </li>
              <li>
                <Link href="/cinemas" className="hover:text-white transition-colors">
                  Pathé Dar Essalam
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: A propos */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-white text-[11.5px]">
              A propos
            </h3>
            <ul className="space-y-2 text-[11px] text-[#8c8c8c]">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Offres B2B
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Offre anniversaire
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Projection scolaire
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  L&apos;expérience Pathé
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Liens utiles */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-white text-[11.5px]">
              Liens utiles
            </h3>
            <ul className="space-y-2 text-[11px] text-[#8c8c8c]">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Paramétrer vos cookies
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Conditions Générales
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Politique CVD
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors leading-relaxed">
                  Charte de protection des données personnelles
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Mentions Légales
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: VOUS AVEZ DES QUESTIONS ? */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-white text-[11px] uppercase tracking-wide">
              VOUS AVEZ DES QUESTIONS ?
            </h3>
            <ul className="space-y-2 text-[11px] text-[#8c8c8c]">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Comment fonctionne la carte 5 places ?
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors leading-relaxed">
                  Quelles sont les expériences &amp; technologies proposées par le cinéma Pathé Casablanca ?
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Centre d&apos;aide
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Centered Social Icons & Copyright Line matching pathe_home.png & pathe_movie_page.png */}
        <div className="pt-4 flex flex-col items-center justify-center gap-3 text-center">
          {/* Social Icons (Facebook, LinkedIn, Instagram, TikTok) */}
          <div className="flex items-center justify-center gap-4 text-white">
            {/* Facebook */}
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="hover:text-[#ffc61a] transition-colors"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
              </svg>
            </a>

            {/* LinkedIn */}
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="hover:text-[#ffc61a] transition-colors"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="hover:text-[#ffc61a] transition-colors"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
              </svg>
            </a>

            {/* TikTok */}
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noreferrer"
              aria-label="TikTok"
              className="hover:text-[#ffc61a] transition-colors"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" />
              </svg>
            </a>
            {/* GitHub */}
            <a
              href="https://github.com/abdellah-agrm"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub de Abdellah Agourram"
              className="hover:text-[#ffc61a] transition-colors"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            </a>
          </div>

          <p className="text-[11px] text-[#737373]">
            Les Cinémas Pathé Maroc © {new Date().getFullYear()} Tous droits réservés ® — Conçu et développé par{" "}
            <a
              href="https://github.com/abdellah-agrm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#ffc61a] hover:underline font-semibold"
            >
              Abdellah Agourram
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
