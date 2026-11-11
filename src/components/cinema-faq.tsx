"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: "carte-5-places",
    question: "Comment fonctionne la carte 5 places ?",
    answer:
      "La carte 5 places vous permet de profiter de 5 séances à tarif préférentiel dans nos cinémas. Elle est rechargeable en ligne ou en caisse, valable tous les jours de la semaine et utilisable jusqu'à 5 places par séance pour venir accompagné.",
  },
  {
    id: "experiences-technologies",
    question: "Quelles sont les expériences & technologies proposées par le cinéma Pathé Casablanca ?",
    answer:
      "Le cinéma Pathé Californie Casablanca propose les technologies les plus immersives : IMAX Laser avec écran géant et son immersif sur mesure, 4DX avec sièges en mouvement et effets sensoriels (vent, eau, lumière, odeurs), Dolby Atmos et salons VIP.",
  },
  {
    id: "programmation-semaine",
    question: "À partir de quand peut-on consulter la programmation de la semaine ?",
    answer:
      "La programmation de la semaine cinématographique (du mercredi au mardi suivant) est mise en ligne chaque lundi soir ou mardi matin. Les avant-premières et événements spéciaux sont ouverts à la réservation plusieurs semaines à l'avance.",
  },
];

export function CinemaFAQ() {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="border-t border-white/[0.08] bg-[#0a0a0a] py-16 sm:py-20">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Column: Tilted yellow speech bubble + Help CTA matching pathe_home.png */}
          <div className="lg:col-span-5 flex items-start gap-4">
            {/* Tilted Gold/Yellow Speech Bubble SVG */}
            <div className="pt-1 shrink-0">
              <svg
                className="h-7 w-7 text-[#d99f1c] -rotate-12"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M3 4h18a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-5 4v-4H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
              </svg>
            </div>

            <div className="space-y-2.5">
              <h2 className="text-2xl sm:text-[26px] font-extrabold text-white tracking-tight leading-tight">
                Vous avez une question ?
              </h2>
              <p className="text-[13px] text-[#9ca3af] leading-relaxed">
                Accédez à notre Aide en ligne pour trouver la réponse.
              </p>
              <div className="pt-2">
                <Link
                  href="/terms"
                  className="inline-flex items-center gap-2 rounded-[8px] bg-[#1a1a1a] hover:bg-[#262626] px-4 py-2.5 text-xs font-bold text-white transition-colors active:scale-[0.97]"
                >
                  <span>Accéder au centre d&apos;aide</span>
                  <ChevronRight className="h-3.5 w-3.5 text-white stroke-[2.5]" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Minimalist Divider Accordion matching pathe_home.png */}
          <div className="lg:col-span-7 divide-y divide-white/[0.08]">
            {FAQ_ITEMS.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div key={item.id} className="py-4 first:pt-0">
                  <button
                    type="button"
                    onClick={() => toggle(item.id)}
                    className="flex w-full items-center justify-between py-1.5 text-left text-[13px] sm:text-[14px] font-bold text-white hover:text-[#ffc61a] transition-colors cursor-pointer"
                  >
                    <span className="pr-6 leading-snug">{item.question}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-white shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-[#ffc61a]" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="pt-2.5 pb-1 pr-6 text-xs sm:text-[13px] text-[#9ca3af] leading-relaxed">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
