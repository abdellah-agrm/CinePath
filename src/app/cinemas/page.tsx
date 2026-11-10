"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Phone, Film, Clock, ChevronRight, Navigation } from "lucide-react";

interface CinemaItem {
  id: string;
  name: string;
  slug: string;
  city: string;
  address: string;
  phone: string;
  hallsCount: number;
  features: string[];
  image: string;
}

const CINEMAS: CinemaItem[] = [
  {
    id: "c1",
    name: "CinePath Anfa",
    slug: "cinepath-anfa",
    city: "Casablanca",
    address: "Boulevard d'Anfa, Casablanca",
    phone: "+212 522 00 11 22",
    hallsCount: 8,
    features: ["IMAX", "Dolby Atmos", "VIP Lounge", "Valet Parking"],
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "c2",
    name: "CinePath Agdal",
    slug: "cinepath-agdal",
    city: "Rabat",
    address: "Avenue Fal Ould Oumeir, Agdal, Rabat",
    phone: "+212 537 00 33 44",
    hallsCount: 6,
    features: ["4DX", "Laser Projection", "Popcorn Bar"],
    image:
      "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "c3",
    name: "CinePath Guéliz",
    slug: "cinepath-gueliz",
    city: "Marrakech",
    address: "Avenue Mohammed V, Guéliz, Marrakech",
    phone: "+212 524 00 55 66",
    hallsCount: 5,
    features: ["VIP Recliners", "Dolby 7.1", "Café Lounge"],
    image:
      "https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=800&auto=format&fit=crop&q=80",
  },
];

export default function CinemasPage() {
  const [selectedCity, setSelectedCity] = useState("ALL");

  const filtered = CINEMAS.filter(
    (c) => selectedCity === "ALL" || c.city.toLowerCase() === selectedCity.toLowerCase()
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Our Theatres</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choose your nearest cinema to view today&apos;s showtimes and available screens
          </p>
        </div>

        {/* City Filter */}
        <div className="flex items-center gap-2">
          {["ALL", "Casablanca", "Rabat", "Marrakech"].map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                selectedCity === city
                  ? "bg-primary text-white shadow-sm"
                  : "border border-border bg-card text-muted-foreground hover:text-white"
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Cinemas Grid */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((cinema) => (
          <div
            key={cinema.id}
            className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card transition hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10"
          >
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cinema.image}
                alt={cinema.name}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3 rounded-full bg-background/80 backdrop-blur px-3 py-1 text-xs font-bold text-white flex items-center gap-1">
                <MapPin className="h-3 w-3 text-primary" />
                {cinema.city}
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-between p-6">
              <div>
                <h2 className="text-xl font-bold text-white group-hover:text-primary transition">
                  {cinema.name}
                </h2>
                <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1.5">
                  <Navigation className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                  <span>{cinema.address}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>{cinema.phone}</span>
                </p>

                {/* Features badges */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {cinema.features.map((feat) => (
                    <span
                      key={feat}
                      className="rounded-lg bg-background/60 border border-border px-2.5 py-1 text-[10px] font-medium text-muted-foreground"
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 border-t border-border/60 pt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Film className="h-3.5 w-3.5" /> {cinema.hallsCount} Screens
                </span>

                <Link
                  href={`/movies`}
                  className="inline-flex items-center gap-1 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary/90 transition"
                >
                  View Showtimes
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

