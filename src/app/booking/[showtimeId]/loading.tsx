import { CinemaLoader } from "@/components/cinema/cinema-loader";

export default function BookingLoading() {
  return (
    <CinemaLoader
      message="Sélection de vos places..."
      submessage="Chargement du plan de salle en temps réel"
      fullScreen={true}
      theme="light"
    />
  );
}

