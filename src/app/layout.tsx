import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { PWARegister } from "@/components/pwa-register";
import { AuthProvider } from "@/context/auth-context";
import { FloatingNavbar } from "@/components/cinema/floating-navbar";
import { CinemaFooter } from "@/components/cinema-footer";
import { MobileNav } from "@/components/mobile-nav";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Les Cinémas Pathé Maroc · Films, Séances & Réservation en ligne",
  description:
    "Consultez les films à l'affiche, les horaires des séances en IMAX, 4DX et Dolby Atmos, et réservez vos places en temps réel dans vos cinémas Pathé Maroc.",
  icons: {
    icon: "/logo/CinePath_Bear_Black_Icon.png",
    shortcut: "/logo/CinePath_Bear_Black_Icon.png",
    apple: "/logo/CinePath_Bear_Black_Icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CinePath",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`dark ${plusJakartaSans.variable} ${barlowCondensed.variable}`}
      suppressHydrationWarning
    >
      <body
        className="flex min-h-screen flex-col bg-[#0a0a0a] font-sans text-white antialiased"
        suppressHydrationWarning
      >
        <AuthProvider>
          {/* Floating Transparent Navigation Bar */}
          <FloatingNavbar />

          {/* Content */}
          <main className="flex-1">{children}</main>

          {/* Unified Cinema Footer */}
          <CinemaFooter />

          {/* Mobile Bottom Navigation (Hidden on /booking) */}
          <MobileNav />

          {/* PWA Offline & Install Prompt */}
          <PWARegister />
        </AuthProvider>
      </body>
    </html>
  );
}
