import { CinemaLoader } from "@/components/cinema/cinema-loader";

export default function GlobalLoading() {
  return (
    <CinemaLoader
      message="Chargement de votre séance..."
      submessage="CinePath Multiplex · Vos cinémas au Maroc"
      fullScreen={true}
    />
  );
}
