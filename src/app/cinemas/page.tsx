"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, ChevronRight, Accessibility } from "lucide-react";

interface CinemaItem {
  id: string;
  name: string;
  slug: string;
  city: string;
  address: string;
  hallsCount: number;
  features: string[];
  image: string;
}

const CINEMAS: CinemaItem[] = [
  {
    id: "pathe-californie",
    name: "Pathé Californie",
    slug: "pathe-californie",
    city: "Casablanca",
    address: "Casablanca CT 1029 Aïn Chock",
    hallsCount: 8,
    features: ["IMAX", "4DX", "Dolby Atmos", "VIP", "PMR"],
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "pathe-dar-essalam",
    name: "Pathé Dar Essalam",
    slug: "pathe-dar-essalam",
    city: "Rabat",
    address: "Avenue Mohammed VI, Souissi, Rabat",
    hallsCount: 6,
    features: ["4DX", "Dolby Atmos", "Projection Laser", "PMR"],
    image:
      "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=80",
  },
];

export default function CinemasPage() {
  const [selectedCity, setSelectedCity] = useState("ALL");

  const filtered = CINEMAS.filter(
    (c) => selectedCity === "ALL" || c.city.toLowerCase() === selectedCity.toLowerCase()
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-28 sm:pt-36 pb-20">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-12">
        {/* Header & City Filter */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/[0.08] pb-8">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Nos cinémas au Maroc
            </h1>
            <p className="text-xs sm:text-sm text-[#9ca3af] mt-1">
              Découvrez les salles IMAX, 4DX et Dolby Atmos de nos cinémas Pathé au Maroc.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {[
              { label: "Tous les cinémas", value: "ALL" },
              { label: "Casablanca", value: "Casablanca" },
              { label: "Rabat", value: "Rabat" },
            ].map((city) => (
              <button
                key={city.value}
                type="button"
                onClick={() => setSelectedCity(city.value)}
                className={`rounded-[6px] px-4 py-2 text-xs font-bold transition-colors cursor-pointer active:scale-[0.97] ${
                  selectedCity === city.value
                    ? "bg-[#ffc61a] text-[#0a0a0a]"
                    : "bg-[#1a1a1a] hover:bg-[#252525] text-[#a3a3a3] hover:text-white"
                }`}
              >
                {city.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cinemas Cards */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((cinema) => (
            <div
              key={cinema.id}
              className="group flex flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#141414] hover:border-white/20 transition-colors"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cinema.image}
                  alt={cinema.name}
                  className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/30" />
                <div className="absolute top-3 left-3 rounded-[6px] bg-black/70 backdrop-blur-md px-3 py-1 text-xs font-bold text-white flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#ffc61a]" />
                  <span>{cinema.city}</span>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-6">
                <div className="space-y-2.5">
                  <h2 className="text-xl font-extrabold text-white group-hover:text-[#ffc61a] transition-colors">
                    {cinema.name}
                  </h2>
                  <p className="text-xs text-[#9ca3af]">{cinema.address}</p>

                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    {cinema.features.map((feat) => (
                      <span
                        key={feat}
                        className="rounded-[4px] bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white uppercase tracking-wide"
                      >
                        {feat}
                      </span>
                    ))}
                    <Accessibility className="h-4 w-4 text-[#9ca3af] ml-1" />
                  </div>
                </div>

                <div className="mt-6 border-t border-white/[0.08] pt-4 flex items-center justify-between">
                  <span className="text-xs text-[#9ca3af]">
                    {cinema.hallsCount} salles équipées
                  </span>

                  <Link
                    href="/movies"
                    className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#ffc61a] hover:bg-[#ffd147] px-4 py-2.5 text-xs font-bold text-[#0a0a0a] active:scale-[0.97] transition-transform cursor-pointer"
                  >
                    <span>Voir les séances</span>
                    <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
