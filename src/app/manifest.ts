import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CinePath - Cinema Booking Platform",
    short_name: "CinePath",
    description: "Real-time seat selection, cinema showtimes, and digital HMAC QR passes",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#feca00",
    orientation: "portrait",
    categories: ["entertainment", "tickets", "movies"],
    icons: [
      {
        src: "/logo/CinePath_Bear_Black_Icon.png",
        sizes: "520x520",
        type: "image/png",
        purpose: "any",
      },
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

