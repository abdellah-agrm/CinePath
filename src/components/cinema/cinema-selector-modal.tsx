"use client";

import { useState } from "react";
import { MapPin, Check, X } from "lucide-react";

export interface CinemaOption {
  id: string;
  name: string;
  city: string;
  address: string;
  features: string[];
}

export const CINEMAS: CinemaOption[] = [
  {
    id: "pathe-californie",
    name: "Pathé Californie",
    city: "Casablanca",
    address: "Casablanca CT 1029 Aïn Chock",
    features: ["IMAX Laser", "4DX", "Dolby Atmos", "VIP Lounge"],
  },
  {
    id: "pathe-dar-essalam",
    name: "Pathé Dar Essalam",
    city: "Rabat",
    address: "Avenue Mohammed VI, Souissi, Rabat",
    features: ["4DX", "Dolby Atmos", "Laser Projection"],
  },
  {
    id: "pathe-gueliz",
    name: "Pathé Guéliz",
    city: "Marrakech",
    address: "Boulevard Mohamed V, Guéliz, Marrakech",
    features: ["IMAX Laser", "Dolby Atmos", "PMR"],
  },
];

interface CinemaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCinemaId: string;
  onSelectCinema: (cinema: CinemaOption) => void;
}

export function CinemaSelectorModal({
  isOpen,
  onClose,
  selectedCinemaId,
  onSelectCinema,
}: CinemaSelectorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-[#121215] p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#feca00]/15 text-[#feca00] border border-[#feca00]/25">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Choisir votre cinéma</h3>
              <p className="text-xs text-neutral-400">Consultez les séances et films disponibles près de chez vous</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Cinemas List */}
        <div className="space-y-3">
          {CINEMAS.map((cinema) => {
            const isSelected = cinema.id === selectedCinemaId;
            return (
              <button
                key={cinema.id}
                type="button"
                onClick={() => {
                  onSelectCinema(cinema);
                  onClose();
                }}
                className={`w-full text-left rounded-2xl p-4 border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? "border-[#feca00] bg-[#feca00]/10 shadow-lg shadow-[#feca00]/10"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-sm">{cinema.name}</span>
                    <span className="text-[11px] font-semibold text-neutral-400">({cinema.city})</span>
                  </div>
                  <p className="text-xs text-neutral-400">{cinema.address}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {cinema.features.map((feat) => (
                      <span
                        key={feat}
                        className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-bold text-neutral-300"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>

                {isSelected && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#feca00] text-black">
                    <Check className="h-4 w-4 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

