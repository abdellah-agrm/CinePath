import { CinemaLoader } from "@/components/cinema/cinema-loader";

export default function MovieDetailLoading() {
  return (
    <CinemaLoader
      message="Chargement de votre film..."
      submessage="Préparation de la séance et des formats IMAX & 4DX"
      fullScreen={true}
    />
  );
}
