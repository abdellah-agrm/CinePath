import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CinePath - Cinema Booking Platform",
    short_name: "CinePath",
    description: "Real-time seat selection, cinema showtimes, and digital HMAC QR passes",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#e11d48",
    orientation: "portrait",
    categories: ["entertainment", "tickets", "movies"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}

