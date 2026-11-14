"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Home,
  Check,
  ChevronRight,
  ChevronDown,
  Accessibility,
  Loader2,
  Minus,
  Plus,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { CinemaLoader } from "@/components/cinema/cinema-loader";

interface SeatItem {
  id: string;
  rowLabel: string;
  seatNumber: number;
  gridRow: number;
  gridCol: number;
  isBooked: boolean;
  type: "STANDARD" | "CHAISE_LONGUE";
}

interface SelectedSeat {
  id: string;
  label: string;
  row: string;
  col: number;
}

interface TariffCount {
  normal: number;
  etudiant: number;
}

const TARIFF_PRICES = {
  normal: 90,
  etudiant: 75,
};

interface BookingStudioProps {
  showtimeId: string;
}

/* ============================================================================
   CUSTOM SVG SEAT ICONS MATCHING pathe_booking_02.png, 03.png & hover PNGs
   ============================================================================ */
function StandardSeatSvg({
  status,
  isHovered,
}: {
  status: "available" | "occupied" | "selected";
  isHovered?: boolean;
}) {
  if (status === "selected") {
    return (
      <svg className="w-6 h-5 sm:w-7 sm:h-6" viewBox="0 0 28 24" fill="none">
        {/* Outer backrest & armrests */}
        <path
          d="M4 8C4 4.5 6.5 2 10 2H18C21.5 2 24 4.5 24 8V18C24 20 22.5 21.5 20.5 21.5H7.5C5.5 21.5 4 20 4 18V8Z"
          fill="#48c78e"
          stroke="#257953"
          strokeWidth="1.6"
        />
        {/* Inner cushion */}
        <path
          d="M7.5 9C7.5 7.5 8.5 6.5 10 6.5H18C19.5 6.5 20.5 7.5 20.5 9V20.5H7.5V9Z"
          fill="#48c78e"
          stroke="#257953"
          strokeWidth="1.3"
        />
        {/* White Checkmark */}
        <path
          d="M10.5 13.5L13 16L17.5 11"
          stroke="#ffffff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (status === "occupied") {
    return (
      <svg className="w-6 h-5 sm:w-7 sm:h-6" viewBox="0 0 28 24" fill="none">
        <path
          d="M4 8C4 4.5 6.5 2 10 2H18C21.5 2 24 4.5 24 8V18C24 20 22.5 21.5 20.5 21.5H7.5C5.5 21.5 4 20 4 18V8Z"
          fill="#efefef"
          stroke="#cccccc"
          strokeWidth="1.6"
        />
        {/* Person head & shoulders inside occupied seat matching hover booked seat.png */}
        <circle cx="14" cy="10" r="3" stroke="#cccccc" strokeWidth="1.4" fill="#f7f7f7" />
        <path
          d="M9 20.5C9 17.2 11.2 15 14 15C16.8 15 19 17.2 19 20.5"
          stroke="#cccccc"
          strokeWidth="1.4"
          fill="none"
        />
      </svg>
    );
  }

  // Available seat (softens on hover as in hover available seat.png)
  const fill = isHovered ? "#fdf4d7" : "#ffecb3";
  const stroke = isHovered ? "#dfc06c" : "#d4a024";

  return (
    <svg className="w-6 h-5 sm:w-7 sm:h-6" viewBox="0 0 28 24" fill="none">
      <path
        d="M4 8C4 4.5 6.5 2 10 2H18C21.5 2 24 4.5 24 8V18C24 20 22.5 21.5 20.5 21.5H7.5C5.5 21.5 4 20 4 18V8Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.6"
      />
      <path
        d="M7.5 9C7.5 7.5 8.5 6.5 10 6.5H18C19.5 6.5 20.5 7.5 20.5 9V20.5H7.5V9Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.4"
      />
    </svg>
  );
}

function ChaiseLongueSeatSvg({
  status,
  isHovered,
}: {
  status: "available" | "occupied" | "selected";
  isHovered?: boolean;
}) {
  const fill =
    status === "selected"
      ? "#48c78e"
      : status === "occupied"
      ? "#efefef"
      : isHovered
      ? "#fdf4d7"
      : "#ffecb3";
  const stroke =
    status === "selected"
      ? "#257953"
      : status === "occupied"
      ? "#cccccc"
      : isHovered
      ? "#dfc06c"
      : "#d4a024";

  return (
    <svg className="w-6 h-8 sm:w-7 sm:h-9" viewBox="0 0 28 36" fill="none">
      {/* Upper armrests & backrest */}
      <path
        d="M3 8C3 4.5 5.5 2 9 2H19C22.5 2 25 4.5 25 8V14C25 15.5 24 16.5 22.5 16.5H5.5C4 16.5 3 15.5 3 14V8Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.6"
      />
      {/* Extended lounger legrest cushion */}
      <path
        d="M6.5 8.5C6.5 7 7.5 6 9 6H19C20.5 6 21.5 7 21.5 8.5V31C21.5 32.7 20.2 34 18.5 34H9.5C7.8 34 6.5 32.7 6.5 31V8.5Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
      />
      {status === "selected" && (
        <path
          d="M10.5 19.5L13 22L17.5 17"
          stroke="#ffffff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export function BookingStudio({ showtimeId }: BookingStudioProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // URL Query Parameters
  const queryMovie = searchParams.get("movie") || "clayface";
  const queryTime = searchParams.get("time") || "23:45";
  const queryHall = searchParams.get("hall") || "Salle 3";
  const queryFmt = searchParams.get("fmt") || "VOSTFR";
  const queryDate = searchParams.get("date") || "mercredi 11 novembre 2026";
  const queryIsoDate = searchParams.get("isoDate") || new Date().toISOString().split("T")[0];

  // Step state: 1 = Places (pathe_booking_02/03), 2 = Tarifs (pathe_booking_04), 3 = E-billets (pathe_booking_05)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Movie & Session Details
  const [movieTitle, setMovieTitle] = useState("Now Showing");
  const [movieBackdrop, setMovieBackdrop] = useState("/posters/clayface.jpg");
  const [moviePoster, setMoviePoster] = useState("/posters/clayface.jpg");
  const [ageRating, setAgeRating] = useState("12");
  const [cinemaName, setCinemaName] = useState("CinePath Anfa");
  const [hallName, setHallName] = useState(queryHall || "Hall 1 (IMAX)");
  const [sessionTime, setSessionTime] = useState(queryTime || "20:00");
  const [sessionFormat, setSessionFormat] = useState(queryFmt === "4DX" ? "VOSTFR" : queryFmt || "IMAX 2D");
  const [sessionDate, setSessionDate] = useState(queryDate || "Aujourd'hui");
  const [sessionIsoDate, setSessionIsoDate] = useState(queryIsoDate || new Date().toISOString());

  // Backend Connectivity & Error State
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isLoadingBackend, setIsLoadingBackend] = useState(true);

  // Distributed Lock Token (Stable in session storage)
  const [lockToken] = useState<string>(() => {
    if (typeof window !== "undefined") {
      let t = sessionStorage.getItem("cinepath_lock_token");
      if (!t) {
        t = `usr_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
        sessionStorage.setItem("cinepath_lock_token", t);
      }
      return t;
    }
    return `usr_${Date.now()}`;
  });

  // Seats State
  const [seats, setSeats] = useState<SeatItem[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
  const [hoveredSeat, setHoveredSeat] = useState<SeatItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Step 2 Tariffs State
  const [tariffs, setTariffs] = useState<TariffCount>({
    normal: 0,
    etudiant: 0,
  });
  const [showCinecarteInput, setShowCinecarteInput] = useState(false);
  const [cinecarteCode, setCinecarteCode] = useState("");
  const [cinecarteApplied, setCinecarteApplied] = useState(false);

  // Step 3 Checkout State (Sanitized: NO hardcoded personal name or personal email)
  const [customerEmail, setCustomerEmail] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("cinepath_guest_email") || "";
    }
    return "";
  });
  const [customerName, setCustomerName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // 1. Load Real Showtime & Seats from PostgreSQL / Redis Backend
  useEffect(() => {
    let isMounted = true;
    async function loadBackendData() {
      try {
        setIsLoadingBackend(true);
        setBackendError(null);

        const res = await fetch(`/api/showtimes/${showtimeId}/seats`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(
            json.message || "Impossible de charger la séance depuis le serveur cinéma."
          );
        }

        if (!isMounted) return;

        const st = json.data.showtime;
        if (st) {
          setMovieTitle(st.movieTitle || "Now Showing");
          setMoviePoster(st.posterUrl || "/posters/clayface.jpg");
          setMovieBackdrop(st.posterUrl || "/posters/clayface.jpg");
          setCinemaName(st.cinemaName || "CinePath Anfa");
          setHallName(st.hallName || "Hall 1 (IMAX)");
          setSessionTime(st.startTime || "20:00");
          setSessionFormat(st.format || "IMAX 2D");
        }

        if (Array.isArray(json.data.seats) && json.data.seats.length > 0) {
          const mapped: SeatItem[] = json.data.seats.map((s: any) => ({
            id: s.id,
            rowLabel: s.rowLabel,
            seatNumber: s.seatNumber,
            gridRow: s.gridRow,
            gridCol: s.gridCol,
            isBooked: Boolean(s.isBooked || s.isLocked),
            type: s.type === "VIP" ? "CHAISE_LONGUE" : "STANDARD",
          }));
          setSeats(mapped);
        }
      } catch (err: any) {
        console.error("[BookingStudio] Backend connection failure:", err);
        if (isMounted) {
          setBackendError(
            err.message || "Le serveur de billetterie cinéma est indisponible. Réservations suspendues."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingBackend(false);
        }
      }
    }

    loadBackendData();
    return () => {
      isMounted = false;
    };
  }, [showtimeId]);

  // 2. Real-Time Redis Seat Locking on Selection
  useEffect(() => {
    if (selectedSeats.length === 0) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/showtimes/${showtimeId}/lock-seats`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            seatIds: selectedSeats.map((s) => s.label),
            lockToken,
          }),
        });
        const data = await res.json();
        if (!res.ok && res.status === 409) {
          setFormError("Certains sièges sélectionnés sont déjà retenus par un autre client.");
        }
      } catch (e) {
        console.warn("[BookingStudio] Redis seat locking network error:", e);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedSeats, showtimeId, lockToken]);

  useEffect(() => {
    if (user?.email) {
      setCustomerEmail(user.email);
      setCustomerName(user.fullName || "");
    }
  }, [user]);

  const totalTariffsCount = tariffs.normal + tariffs.etudiant;
  const remainingTariffsToAssign = Math.max(0, selectedSeats.length - totalTariffsCount);

  const totalPrice = useMemo(() => {
    let sum =
      tariffs.normal * TARIFF_PRICES.normal +
      tariffs.etudiant * TARIFF_PRICES.etudiant;

    if (cinecarteApplied) {
      sum = Math.max(0, sum - 20);
    }
    return sum;
  }, [tariffs, cinecarteApplied]);

  const handleSelectSeat = (seat: SeatItem) => {
    if (seat.isBooked) return;

    const exists = selectedSeats.find((s) => s.id === seat.id);
    let newSelected: SelectedSeat[];

    if (exists) {
      newSelected = selectedSeats.filter((s) => s.id !== seat.id);
    } else {
      if (selectedSeats.length >= 8) return;
      newSelected = [
        ...selectedSeats,
        {
          id: seat.id,
          label: `${seat.rowLabel}${seat.seatNumber}`,
          row: seat.rowLabel,
          col: seat.seatNumber,
        },
      ];
    }

    setSelectedSeats(newSelected);
    // Automatically pre-assign normal rate to selected seats so Step 2 "Continuer" is immediately ready
    setTariffs({ normal: newSelected.length, etudiant: 0 });
  };

  const adjustTariff = (type: keyof TariffCount, delta: number) => {
    setTariffs((prev) => {
      const current = prev[type];
      const next = current + delta;
      if (next < 0) return prev;

      const otherTotal = type === "normal" ? prev.etudiant : prev.normal;
      if (delta > 0 && otherTotal + next > selectedSeats.length) {
        return prev;
      }

      return {
        ...prev,
        [type]: next,
      };
    });
  };

  const handleFinalPayment = async () => {
    if (!acceptedTerms) {
      setFormError("Veuillez accepter les Conditions Générales de Vente des Cinémas Pathé.");
      return;
    }

    if (!customerEmail || !customerEmail.includes("@")) {
      setFormError("Veuillez saisir une adresse email valide pour la réception de votre billet.");
      return;
    }

    setFormError(null);
    setIsProcessing(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showtimeId,
          seats: selectedSeats.map((s) => s.label),
          lockToken,
          customerEmail,
          customerName: customerName || "Guest",
          totalAmount: totalPrice > 0 ? totalPrice : selectedSeats.length * 90,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "La réservation a été rejetée par le serveur de billetterie.");
      }

      const confirmedBooking = data.booking;

      // Sync with localStorage for instant offline access
      try {
        localStorage.setItem("cinepath_guest_email", customerEmail);
        localStorage.setItem(`cinepath_booking_${confirmedBooking.reference}`, JSON.stringify(confirmedBooking));
        const existing = localStorage.getItem("cinepath_user_tickets");
        const list = existing ? JSON.parse(existing) : [];
        localStorage.setItem("cinepath_user_tickets", JSON.stringify([confirmedBooking, ...list]));
      } catch (err) {
        console.warn("Storage write error", err);
      }

      router.push(`/tickets/${confirmedBooking.reference}`);
    } catch (err: any) {
      console.error("[BookingStudio] Booking failed:", err);
      setFormError(err.message || "Le paiement et la réservation ont échoué. Le serveur cinéma est indisponible.");
    } finally {
      setIsProcessing(false);
    }
  };

  const freeSeatsCount = seats.filter((s) => !s.isBooked).length || 104;

  return (
    <div className="min-h-screen bg-[#f8f8f8] text-[#1c1e24] flex flex-col lg:flex-row select-none">
      {/* =========================================================================
          LEFT SIDEBAR: Persistent Dark Film & Ticket Summary
          (Matches pathe_booking_02.png, 03.png, 04.png, 05.png 1:1)
         ========================================================================= */}
      <aside className="w-full lg:w-[320px] xl:w-[340px] bg-[#181b20] text-white flex flex-col shrink-0 lg:min-h-screen">
        {/* Top Backdrop Header */}
        <div
          className={`relative px-6 pt-5 ${
            step === 1 ? "pb-10" : "pb-7"
          } text-center overflow-hidden bg-[#181b20]`}
        >
          {/* Dimmed Movie Backdrop Image */}
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={movieBackdrop}
              alt={movieTitle}
              className="h-full w-full object-cover opacity-40"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(24,27,32,0.35) 0%, rgba(24,27,32,0.75) 65%, #181b20 100%)",
              }}
            />
          </div>

          {/* Top Bar: Home / Back Button on Left + Centered White Brand Logo */}
          <div className="relative z-10 flex items-center justify-between">
            {step === 1 ? (
              <Link
                href="/"
                aria-label="Retour à l'accueil"
                className="h-10 w-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-transform"
              >
                <Home className="h-4 w-4 fill-white text-white" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setStep((prev) => (prev === 3 ? 2 : 1))}
                aria-label="Étape précédente"
                className="h-10 w-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
              </button>
            )}

            <Link href="/" className="mx-auto pr-10 flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo/CinePath_Bear_White_Full_Logo.png"
                alt="CinePath"
                className="h-12 w-auto object-contain logo-screen-blend"
              />
            </Link>
          </div>

          {/* Step 2 Poster Thumbnail (Shown in pathe_booking_04.png) */}
          {step === 2 && (
            <div className="relative z-10 mt-3 mb-3 mx-auto w-[104px] aspect-[2/3] rounded-[6px] overflow-hidden shadow-2xl border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={moviePoster}
                alt={movieTitle}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          {/* Movie Title + Cinema Name */}
          <div className={`relative z-10 ${step === 2 ? "mt-2" : "mt-16"} space-y-1`}>
            <div className="flex items-center justify-center gap-1.5">
              <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                {movieTitle}
              </h1>
              {step === 1 && (
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9.5px] font-black text-[#181b20]">
                  {ageRating}
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-300 font-normal">{cinemaName}</p>

            {/* "Changer de film" Pill Button in Step 1 (pathe_booking_02.png & 03.png) */}
            {step === 1 && (
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => router.push("/movies")}
                  className="rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md px-5 py-2 text-xs font-bold text-white active:scale-95 transition-all cursor-pointer"
                >
                  Changer de film
                </button>
              </div>
            )}
          </div>
        </div>

        {/* STEP 1 SIDEBAR DETAILS ROWS (Cinéma, Date, Séance - pathe_booking_02.png & 03.png) */}
        {step === 1 && (
          <div className="flex-1 bg-[#181b20] divide-y divide-white/[0.08] border-t border-white/[0.08]">
            <div
              onClick={() => router.push("/cinemas")}
              className="px-5 py-5 flex items-center justify-between hover:bg-white/[0.03] transition-colors cursor-pointer"
            >
              <div>
                <p className="text-xs text-neutral-400">Cinéma</p>
                <p className="text-base font-medium text-white mt-1">{cinemaName}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-white stroke-[2]" />
            </div>

            <div
              onClick={() => router.push(`/movies/${queryMovie}`)}
              className="px-5 py-5 flex items-center justify-between hover:bg-white/[0.03] transition-colors cursor-pointer"
            >
              <div className="min-w-0 pr-3">
                <p className="text-xs text-neutral-400">Date</p>
                <p className="text-base font-medium text-white mt-1 truncate">
                  {sessionDate}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-white stroke-[2] shrink-0" />
            </div>

            <div
              onClick={() => router.push(`/movies/${queryMovie}`)}
              className="px-5 py-5 flex items-center justify-between hover:bg-white/[0.03] transition-colors cursor-pointer"
            >
              <div className="space-y-1">
                <p className="text-xs text-neutral-400">Séance</p>
                <p className="text-white">
                  <span className="text-lg font-bold">{sessionTime}</span>{" "}
                  <span className="text-xs font-medium uppercase ml-1">{sessionFormat}</span>
                </p>
                <Accessibility className="h-4 w-4 text-neutral-400 my-1" />
                <p className="text-xs text-neutral-400">Fin prévue à 01:54</p>
              </div>
              <ChevronRight className="h-4 w-4 text-white stroke-[2] shrink-0" />
            </div>
          </div>
        )}

        {/* STEP 2 & 3 SIDEBAR TICKET SUMMARY & RECEIPT (pathe_booking_04.png & 05.png) */}
        {step > 1 && (
          <div className="flex-1 flex flex-col justify-between bg-white">
            <div>
              {/* Slate-Gray Ticket Stub Section (#3c4048) */}
              <div className="relative bg-[#3c4048] px-5 pt-4 pb-7 text-white">
                <Accessibility className="h-4 w-4 text-neutral-300 mb-3" />

                {/* 3-Column Date | Time | Places Grid */}
                <div className="grid grid-cols-3 text-center divide-x divide-white/20 my-4">
                  <div className="px-1">
                    <p className="text-sm sm:text-base font-extrabold text-white">13/11</p>
                    <p className="text-[10px] font-medium uppercase text-neutral-200 mt-0.5">
                      VENDREDI
                    </p>
                  </div>
                  <div className="px-1">
                    <p className="text-sm sm:text-base font-extrabold text-white">{sessionTime}</p>
                    <p className="text-[10px] font-medium uppercase text-neutral-200 mt-0.5">
                      {sessionFormat}
                    </p>
                  </div>
                  <div className="px-1">
                    <p className="text-sm sm:text-base font-extrabold text-white">
                      {selectedSeats.length}
                    </p>
                    <p className="text-[10px] font-medium uppercase text-neutral-200 mt-0.5">
                      PLACE{selectedSeats.length > 1 ? "S" : ""}
                    </p>
                  </div>
                </div>

                {/* "Modifier ma place" Pill Button */}
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full rounded-full bg-white/25 hover:bg-white/35 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  Modifier ma place
                </button>

                {/* Scalloped Semicircle Perforated Edge at Bottom of #3c4048 */}
                <div
                  className="absolute bottom-0 inset-x-0 h-2.5"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 10px 10px, #ffffff 6px, transparent 6.5px)",
                    backgroundSize: "20px 10px",
                    backgroundRepeat: "repeat-x",
                  }}
                />
              </div>

              {/* White "Mon tarif" Receipt Block in Step 3 (pathe_booking_05.png) */}
              {step === 3 && (
                <div className="bg-white text-[#1c1e24] px-5 py-5 space-y-3">
                  <h4 className="text-xs sm:text-sm font-black text-[#1c1e24]">Mon tarif</h4>
                  <div className="space-y-2 text-xs sm:text-sm font-bold text-[#1c1e24]">
                    {tariffs.normal > 0 && (
                      <div className="flex items-center justify-between">
                        <span>
                          {tariffs.normal}x &nbsp; <span className="font-normal">Normal</span>
                        </span>
                        <span>{(tariffs.normal * TARIFF_PRICES.normal).toFixed(2)}د.م</span>
                      </div>
                    )}
                    {tariffs.etudiant > 0 && (
                      <div className="flex items-center justify-between">
                        <span>
                          {tariffs.etudiant}x &nbsp; <span className="font-normal">Etudiant</span>
                        </span>
                        <span>{(tariffs.etudiant * TARIFF_PRICES.etudiant).toFixed(2)}د.م</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Yellow "Total à régler" Box on Left Sidebar (pathe_booking_04.png & 05.png) */}
            <div className="bg-[#fbd361] text-[#1c1e24] px-5 py-5 flex items-center justify-between mt-auto">
              <span className="text-xs sm:text-sm font-medium text-[#1c1e24]">Total à régler</span>
              <span className="text-lg sm:text-xl font-black text-[#1c1e24]">
                {totalPrice.toFixed(2)}د.م
              </span>
            </div>
          </div>
        )}
      </aside>

      {/* =========================================================================
          RIGHT MAIN AREA: Crisp Light Theme Booking Canvas (#f8f8f8)
          (Matches pathe_booking_02.png, 03.png, 04.png, 05.png 1:1)
         ========================================================================= */}
      <div className="flex-1 flex flex-col justify-between min-h-screen bg-[#f8f8f8] text-[#1c1e24] relative">
        {/* Top Bar: Salle 3 ♿ on Left | FR pill + User Avatar + ? Circle on Right */}
        <div className="flex items-start justify-between px-6 sm:px-10 pt-4 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1c1e24]">
            <span>{hallName}</span>
            <Accessibility className="h-4 w-4 text-[#1c1e24]" />
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[#1c1e24] text-white px-3.5 py-1 text-xs font-bold">
                FR
              </span>

              {/* User Avatar Circle (Gray silhouette in Step 1/2, Dark+Yellow in Step 3 as in pathe_booking_05.png) */}
              {step === 3 || user ? (
                <div className="h-11 w-11 rounded-full bg-[#252830] flex items-center justify-center overflow-hidden">
                  <svg className="h-9 w-9 text-[#ffc61a] mt-2" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                </div>
              ) : (
                <div className="h-11 w-11 rounded-full bg-[#e4e4e7] flex items-center justify-center overflow-hidden">
                  <svg className="h-9 w-9 text-white mt-2" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                </div>
              )}
            </div>

            {/* Yellow Help (?) Circle */}
            <button
              type="button"
              aria-label="Aide"
              className="h-10 w-10 rounded-full bg-[#ffc61a] hover:bg-[#ffcf33] text-[#1c1e24] font-medium text-base shadow-md flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            >
              ?
            </button>
          </div>
        </div>

        {/* Backend Error Banner */}
        {backendError && (
          <div className="mx-6 sm:mx-10 my-2 rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-center justify-between text-rose-800 text-xs sm:text-sm font-semibold shadow-sm">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-600 animate-ping" />
              <span>{backendError}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-rose-600 text-white px-3 py-1 text-xs font-bold hover:bg-rose-700 transition"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* =======================================================================
            STEP 1: SEAT SELECTION ("Sélectionnez vos places")
            Matches pathe_booking_02.png, 03.png, hover available/booked seat.png
           ======================================================================= */}
        {step === 1 && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="px-4 sm:px-10 flex-1 flex flex-col items-center">
              {/* Heading */}
              <div className="text-center mb-6 -mt-6">
                <h2 className="text-2xl sm:text-[32px] font-black text-[#1c1e24] tracking-tight">
                  Sélectionnez vos places
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                  {freeSeatsCount} places libres
                </p>
              </div>

              {/* White Rounded Seat Map Container */}
              <div className="relative w-full max-w-[1040px] rounded-2xl border border-zinc-200/80 bg-white px-4 sm:px-12 py-8 flex flex-col items-center shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
                {isLoadingBackend ? (
                  <div className="w-full py-8">
                    <CinemaLoader
                      message="Chargement des sièges en temps réel..."
                      submessage="Vérification de la disponibilité et des réservations"
                      fullScreen={false}
                      compact={true}
                      theme="light"
                    />
                  </div>
                ) : backendError ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto gap-3">
                    <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xl">!</div>
                    <h3 className="text-base font-bold text-neutral-800">Serveur de billetterie indisponible</h3>
                    <p className="text-xs text-neutral-500">{backendError}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-2 rounded-xl bg-[#1c1e24] text-white px-5 py-2 text-xs font-bold hover:bg-neutral-800 transition"
                    >
                      Réessayer la connexion
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Hover Seat Tooltip (Matches hover available seat.png & hover booked seat.png 1:1) */}
                    {hoveredSeat && tooltipPos && (
                      <div
                        className="absolute pointer-events-none z-30 flex items-stretch rounded-xl bg-white shadow-[0_6px_24px_rgba(0,0,0,0.16)] overflow-hidden transition-all duration-75"
                        style={{
                          left: `${tooltipPos.x}px`,
                          top: `${tooltipPos.y - 56}px`,
                          transform: "translateX(-50%)",
                        }}
                      >
                        <div className="bg-[#488ee6] text-white font-bold text-xs sm:text-sm px-3.5 py-2 flex items-center justify-center min-w-[44px]">
                          {hoveredSeat.rowLabel}
                          {hoveredSeat.seatNumber}
                        </div>
                        <div className="bg-white px-4 py-1.5 flex flex-col items-center justify-center text-center min-w-[138px]">
                          <span className="text-xs sm:text-[13px] font-normal text-[#1c1e24] leading-tight">
                            Fauteuil standard
                          </span>
                          <span
                            className={`text-[11px] font-medium uppercase leading-tight mt-0.5 ${
                              hoveredSeat.isBooked ? "text-[#e6193c]" : "text-[#009933]"
                            }`}
                          >
                            {hoveredSeat.isBooked ? "RÉSERVÉ" : "LIBRE"}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Amphitheater Seat Grid */}
                    <div className="space-y-2 overflow-x-auto max-w-full py-2">
                      {(Array.from(new Set(seats.map((s) => s.rowLabel))).sort().length > 0
                        ? Array.from(new Set(seats.map((s) => s.rowLabel))).sort()
                        : ["A", "B", "C", "D", "E", "F", "G"]
                      ).map((rowLetter) => {
                        const rowSeats = seats.filter((s) => s.rowLabel === rowLetter);

                        return (
                          <div
                            key={rowLetter}
                            className="flex items-center justify-center gap-1 sm:gap-1.5"
                          >
                            {rowSeats.map((seat) => {
                              const isSelected = selectedSeats.some((s) => s.id === seat.id);
                              const isHovered = hoveredSeat?.id === seat.id;
                              const status = isSelected
                                ? "selected"
                                : seat.isBooked
                                ? "occupied"
                                : "available";

                              // Add aisle gap in Row A before col 11 to match pathe_booking_02.png
                              const hasLeftGap = rowLetter === "A" && seat.seatNumber === 11;

                              return (
                            <div
                              key={seat.id}
                              className={`relative ${hasLeftGap ? "ml-6 sm:ml-8" : ""}`}
                              onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const container = e.currentTarget.closest(".rounded-2xl");
                                const containerRect = container?.getBoundingClientRect();
                                if (containerRect) {
                                  setTooltipPos({
                                    x: rect.left - containerRect.left + rect.width / 2,
                                    y: rect.top - containerRect.top,
                                  });
                                }
                                setHoveredSeat(seat);
                              }}
                              onMouseLeave={() => {
                                setHoveredSeat(null);
                                setTooltipPos(null);
                              }}
                            >
                              <button
                                type="button"
                                disabled={seat.isBooked}
                                onClick={() => handleSelectSeat(seat)}
                                aria-label={`Siège ${seat.rowLabel}${seat.seatNumber}`}
                                className={`p-0.5 sm:p-1 flex items-center justify-center transition-all duration-100 touch-manipulation select-none ${
                                  seat.isBooked
                                    ? "cursor-not-allowed opacity-40"
                                    : "cursor-pointer active:scale-90 hover:scale-110"
                                }`}
                              >
                                {seat.type === "CHAISE_LONGUE" ? (
                                  <ChaiseLongueSeatSvg status={status} isHovered={isHovered} />
                                ) : (
                                  <StandardSeatSvg status={status} isHovered={isHovered} />
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                {/* Curved Golden Screen Line ("Écran") matching pathe_booking_02.png */}
                <div className="w-full max-w-[440px] pt-10 pb-1 flex items-center justify-center">
                  <div className="relative w-full flex items-center justify-center">
                    <svg className="w-full h-6" viewBox="0 0 440 24" fill="none">
                      {/* Left curved wing */}
                      <path
                        d="M4 10 Q 95 19 185 19"
                        stroke="#d4a024"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                      {/* Right curved wing */}
                      <path
                        d="M255 19 Q 345 19 436 10"
                        stroke="#d4a024"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-xs font-medium text-[#d4a024] bg-white px-3 translate-y-1">
                      Écran
                    </span>
                  </div>
                </div>
                  </>
                )}
              </div>

              {/* Legend & "Mes consentements" Row below White Card */}
              <div className="w-full max-w-[1040px] flex flex-wrap items-center justify-between gap-4 py-5 text-xs text-[#1c1e24]">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="scale-90">
                      <StandardSeatSvg status="selected" />
                    </div>
                    <span className="font-medium">Mes places</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="scale-90">
                      <StandardSeatSvg status="available" />
                    </div>
                    <span className="font-medium">Places libres</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="scale-90">
                      <StandardSeatSvg status="occupied" />
                    </div>
                    <span className="font-medium">Places occupées</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="rounded-full bg-[#efefef] hover:bg-[#e4e4e7] px-4 py-2 text-xs font-medium text-[#1c1e24] transition-colors cursor-pointer"
                >
                  Mes consentements
                </button>
              </div>
            </div>

            {/* Bottom Sticky Bar when seat(s) selected (pathe_booking_03.png) */}
            {selectedSeats.length > 0 && (
              <div className="sticky bottom-0 inset-x-0 w-full z-40">
                {/* White Seat Summary Strip */}
                <div className="bg-white border-t border-zinc-200/80 px-6 py-2.5 flex items-center justify-between text-xs font-bold text-[#1c1e24]">
                  <div className="flex items-center gap-1.5">
                    <span>
                      {selectedSeats.length} place{selectedSeats.length > 1 ? "s" : ""} réservée
                      {selectedSeats.length > 1 ? "s" : ""}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-[#1c1e24]" />
                  </div>
                  <span className="font-extrabold text-[#1c1e24]">
                    {selectedSeats.map((s) => s.label).join(", ")}
                  </span>
                </div>

                {/* Full-Width Yellow CTA Button ("Réserver ma place →") */}
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full bg-[#ffc61a] hover:bg-[#ffcf33] text-[#1c1e24] py-4 flex items-center justify-center gap-3 font-black text-sm sm:text-base transition-colors cursor-pointer"
                >
                  <span>
                    Réserver {selectedSeats.length > 1 ? "mes places" : "ma place"}
                  </span>
                  <span className="text-lg leading-none">→</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* =======================================================================
            STEP 2: TARIFFS SELECTION ("Sélectionnez vos tarifs")
            Matches pathe_booking_04.png 1:1
           ======================================================================= */}
        {step === 2 && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="px-4 sm:px-10 flex-1 flex flex-col items-center">
              <div className="text-center mb-8 -mt-6">
                <h2 className="text-2xl sm:text-[32px] font-black text-[#1c1e24] tracking-tight">
                  Sélectionnez vos tarifs
                </h2>
              </div>

              <div className="w-full max-w-[820px] space-y-5">
                {/* Card 1: Cinécarte Box with Golden Speed Stripes on Right */}
                <div className="relative rounded-xl bg-white border border-zinc-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 overflow-hidden">
                  {/* Decorative Golden Speed-Lines on the Right matching pathe_booking_04.png */}
                  <div
                    className="pointer-events-none absolute right-0 top-0 bottom-0 w-72 opacity-80"
                    style={{
                      background:
                        "repeating-linear-gradient(180deg, rgba(250,204,21,0.55) 0px, rgba(250,204,21,0.55) 4px, rgba(254,240,138,0.25) 4px, rgba(254,240,138,0.25) 9px)",
                      maskImage: "linear-gradient(to left, black 35%, transparent 100%)",
                      WebkitMaskImage: "linear-gradient(to left, black 35%, transparent 100%)",
                    }}
                  />

                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-md">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-[#1c1e24]">Cinécarte</h3>
                        {cinecarteApplied && (
                          <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                            Appliquée (-20 د.م)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        Utilisez votre Cinécarte en ligne ! Il vous suffit de rentrer le code qui
                        figure sur votre carte (16 caractères)
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCinecarteInput(!showCinecarteInput)}
                      className="rounded-lg bg-[#191d24] hover:bg-[#262c36] text-white text-xs font-bold px-6 py-3 shrink-0 transition-colors cursor-pointer shadow-sm"
                    >
                      Saisir le code
                    </button>
                  </div>

                  {showCinecarteInput && (
                    <div className="relative z-10 mt-4 pt-4 border-t border-zinc-100 flex items-center gap-2">
                      <input
                        type="text"
                        value={cinecarteCode}
                        onChange={(e) => setCinecarteCode(e.target.value)}
                        placeholder="Code Cinécarte à 16 caractères..."
                        className="flex-1 rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs text-[#1c1e24] focus:outline-none focus:border-[#ffc61a]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (cinecarteCode.trim().length >= 4) {
                            setCinecarteApplied(true);
                            setShowCinecarteInput(false);
                          }
                        }}
                        className="rounded-lg bg-[#ffc61a] px-4 py-2 text-xs font-bold text-[#1c1e24] cursor-pointer"
                      >
                        Valider
                      </button>
                    </div>
                  )}
                </div>

                {/* Card 2: Tariffs Stepper (Normal 90.00 د.م, Etudiant 75.00 د.م) */}
                <div className="rounded-xl bg-white border border-zinc-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.03)] px-6 py-6 space-y-6">
                  {/* Normal Row */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-extrabold text-[#1c1e24] w-20 shrink-0">
                      Normal
                    </span>

                    {/* Horizontal Leader Line matching pathe_booking_04.png */}
                    <div className="flex-1 h-[1px] bg-zinc-200 mx-4 sm:mx-8" />

                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-xs sm:text-sm font-extrabold text-[#1c1e24]">
                        {TARIFF_PRICES.normal}.00د.م
                      </span>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => adjustTariff("normal", -1)}
                          aria-label="Retirer un tarif Normal"
                          className="h-9 w-9 rounded-full border border-zinc-300 text-zinc-400 hover:border-zinc-500 hover:text-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Minus className="h-4 w-4 stroke-[2]" />
                        </button>
                        <span
                          className={`w-6 text-center text-lg font-black ${
                            tariffs.normal > 0 ? "text-[#1c1e24]" : "text-zinc-400"
                          }`}
                        >
                          {tariffs.normal}
                        </span>
                        <button
                          type="button"
                          onClick={() => adjustTariff("normal", 1)}
                          aria-label="Ajouter un tarif Normal"
                          className="h-9 w-9 rounded-full bg-[#ffc61a] hover:bg-[#ffcf33] text-[#1c1e24] flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Plus className="h-4 w-4 stroke-[2]" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Etudiant Row */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-extrabold text-[#1c1e24] w-20 shrink-0">
                      Etudiant
                    </span>

                    {/* Horizontal Leader Line */}
                    <div className="flex-1 h-[1px] bg-zinc-200 mx-4 sm:mx-8" />

                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-xs sm:text-sm font-extrabold text-[#1c1e24]">
                        {TARIFF_PRICES.etudiant}.00د.م
                      </span>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => adjustTariff("etudiant", -1)}
                          aria-label="Retirer un tarif Etudiant"
                          className="h-9 w-9 rounded-full border border-zinc-300 text-zinc-400 hover:border-zinc-500 hover:text-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Minus className="h-4 w-4 stroke-[2]" />
                        </button>
                        <span
                          className={`w-6 text-center text-lg font-black ${
                            tariffs.etudiant > 0 ? "text-[#1c1e24]" : "text-zinc-400"
                          }`}
                        >
                          {tariffs.etudiant}
                        </span>
                        <button
                          type="button"
                          onClick={() => adjustTariff("etudiant", 1)}
                          aria-label="Ajouter un tarif Etudiant"
                          className="h-9 w-9 rounded-full bg-[#ffc61a] hover:bg-[#ffcf33] text-[#1c1e24] flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Plus className="h-4 w-4 stroke-[2]" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mes consentements pill aligned bottom-right above footer bar */}
              <div className="w-full max-w-[1040px] flex justify-end mt-auto py-5">
                <button
                  type="button"
                  className="rounded-full bg-[#efefef] hover:bg-[#e4e4e7] px-4 py-2 text-xs font-medium text-[#1c1e24] transition-colors cursor-pointer"
                >
                  Mes consentements
                </button>
              </div>
            </div>

            {/* Bottom Bar for Step 2 (Matches pathe_booking_04.png) */}
            {remainingTariffsToAssign > 0 ? (
              <div className="w-full bg-[#fae39c] text-[#1c1e24] py-5 text-center font-black text-sm sm:text-base">
                {remainingTariffsToAssign} tarif{remainingTariffsToAssign > 1 ? "s" : ""} restant
                {remainingTariffsToAssign > 1 ? "s" : ""} à sélectionner
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-full bg-[#ffc61a] hover:bg-[#ffcf33] text-[#1c1e24] py-5 flex items-center justify-center gap-3 font-black text-sm sm:text-base transition-colors cursor-pointer"
              >
                <span>Continuer</span>
                <span className="text-lg leading-none">→</span>
              </button>
            )}
          </div>
        )}

        {/* =======================================================================
            STEP 3: E-TICKETS & CHECKOUT ("Récupérez vos e-billets")
            Matches pathe_booking_05.png 1:1
           ======================================================================= */}
        {step === 3 && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="px-4 sm:px-10 flex-1 flex flex-col items-center">
              {/* Heading */}
              <div className="text-center mb-8 -mt-6">
                <h2 className="text-2xl sm:text-[32px] font-black text-[#1c1e24] tracking-tight">
                  Récupérez vos e-billets
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                  Connectez-vous à votre compte pour retrouver vos e-billets
                </p>
              </div>

              {/* White Account & CGV Card (Matches pathe_booking_05.png 1:1) */}
              <div className="w-full max-w-[780px] rounded-xl bg-white border border-zinc-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 sm:p-8 space-y-5">
                {user ? (
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-[#1c1e24]">
                      Vous êtes connecté en tant que {user.fullName || customerName || "Client CinePath"}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-600 mt-1">
                      Vous recevrez vos e-billets à l&apos;adresse{" "}
                      <span className="font-bold text-zinc-700">{user.email || customerEmail}</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-[#1c1e24]">
                        Coordonnées de réception de vos e-billets
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Aucun compte obligatoire. Vos e-billets officiels avec QR code d&apos;accès vous seront envoyés immédiatement.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#1c1e24] uppercase tracking-wide">
                        Adresse email de réception *
                      </label>
                      <input
                        type="email"
                        required
                        value={customerEmail}
                        onChange={(e) => {
                          setCustomerEmail(e.target.value);
                          if (formError) setFormError(null);
                        }}
                        placeholder="votre.email@domaine.com"
                        className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-[#1c1e24] placeholder:text-zinc-400 focus:outline-none focus:border-[#ffc61a] focus:ring-2 focus:ring-[#ffc61a]/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#1c1e24] uppercase tracking-wide">
                        Nom complet (optionnel)
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="ex. Client Pathé"
                        className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-[#1c1e24] placeholder:text-zinc-400 focus:outline-none focus:border-[#ffc61a]"
                      />
                    </div>
                  </div>
                )}

                {/* Gray Terms Box */}
                <div className="rounded-lg bg-[#f7f7f7] p-4">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={acceptedTerms}
                      onClick={() => setAcceptedTerms(!acceptedTerms)}
                      className={`h-5 w-5 rounded flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                        acceptedTerms
                          ? "bg-[#ffc61a] text-white"
                          : "border-2 border-zinc-300 bg-white"
                      }`}
                    >
                      {acceptedTerms && <Check className="h-3.5 w-3.5 stroke-[3] text-white" />}
                    </button>

                    <span className="text-xs sm:text-[13px] text-zinc-600">
                      J&apos;accepte les{" "}
                      <Link
                        href="/terms"
                        target="_blank"
                        className="underline text-zinc-700 hover:text-[#1c1e24]"
                      >
                        Conditions Générales de Vente
                      </Link>{" "}
                      des Cinémas Pathé
                    </span>
                  </label>
                </div>

                {formError && (
                  <p className="text-xs font-bold text-[#e6193c]">{formError}</p>
                )}
              </div>

              {/* Mes consentements pill aligned bottom-right */}
              <div className="w-full max-w-[1040px] flex justify-end mt-auto py-5">
                <button
                  type="button"
                  className="rounded-full bg-[#efefef] hover:bg-[#e4e4e7] px-4 py-2 text-xs font-medium text-[#1c1e24] transition-colors cursor-pointer"
                >
                  Mes consentements
                </button>
              </div>
            </div>

            {/* Bottom Full-Width Yellow CTA Bar ("Continuer et payer →" - pathe_booking_05.png) */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleFinalPayment}
              className="w-full bg-[#ffc61a] hover:bg-[#ffcf33] text-[#1c1e24] py-5 flex items-center justify-center gap-3 font-black text-sm sm:text-base transition-colors cursor-pointer disabled:opacity-60"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-[#1c1e24]" />
                  <span>Validation de vos e-billets...</span>
                </>
              ) : (
                <>
                  <span>Continuer et payer</span>
                  <span className="text-lg leading-none">→</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
