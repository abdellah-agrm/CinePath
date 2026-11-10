import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Film, Ticket, MapPin, User as UserIcon } from "lucide-react";
import { PWARegister } from "@/components/pwa-register";
import { AuthProvider } from "@/context/auth-context";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "CinePath - Cinema Booking Platform",
  description: "Browse movies, check showtimes, select seats in real-time, and book tickets.",
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
    <html lang="en" className="dark">
      <body className="flex min-h-screen flex-col bg-background text-foreground antialiased">
        <AuthProvider>
          {/* Navigation Bar with Auth State & Roles */}
          <Navbar />

          {/* Content */}
          <main className="flex-1">{children}</main>

          {/* Desktop Footer */}
          <footer className="border-t border-border bg-card/40 py-8 text-xs text-muted-foreground hidden md:block">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">CinePath</span>
                <span>© {new Date().getFullYear()} All rights reserved.</span>
              </div>

              <div className="flex items-center gap-6">
                <Link href="/terms" className="hover:text-white transition">
                  Terms of Sale
                </Link>
                <Link href="/privacy" className="hover:text-white transition">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </footer>

          {/* Mobile Bottom Navigation */}
          <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border bg-background/95 backdrop-blur md:hidden">
            <Link href="/" className="flex flex-col items-center gap-1 text-xs text-primary">
              <Film className="h-5 w-5" />
              <span>Movies</span>
            </Link>
            <Link href="/cinemas" className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-white">
              <MapPin className="h-5 w-5" />
              <span>Cinemas</span>
            </Link>
            <Link href="/tickets" className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-white">
              <Ticket className="h-5 w-5" />
              <span>Tickets</span>
            </Link>
            <Link href="/login" className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-white">
              <UserIcon className="h-5 w-5" />
              <span>Account</span>
            </Link>
          </nav>

          {/* PWA Offline & Install Prompt */}
          <PWARegister />
        </AuthProvider>
      </body>
    </html>
  );
}
