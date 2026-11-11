"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { BookingStudio } from "@/components/cinema/booking-studio";

function BookingContent() {
  const params = useParams();
  const showtimeId = params.showtimeId as string;

  return <BookingStudio showtimeId={showtimeId} />;
}

export default function SeatSelectionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#09090b] text-neutral-400">
          <Loader2 className="h-8 w-8 animate-spin text-[#feca00]" />
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
