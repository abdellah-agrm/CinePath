"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { BookingStudio } from "@/components/cinema/booking-studio";
import { CinemaLoader } from "@/components/cinema/cinema-loader";

function BookingContent() {
  const params = useParams();
  const showtimeId = params.showtimeId as string;

  return <BookingStudio showtimeId={showtimeId} />;
}

export default function SeatSelectionPage() {
  return (
    <Suspense
      fallback={
        <CinemaLoader
          message="Sélection de vos places..."
          submessage="Chargement de la salle en temps réel"
          fullScreen={true}
        />
      }
    >
      <BookingContent />
    </Suspense>
  );
}
