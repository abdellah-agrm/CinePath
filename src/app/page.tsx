import { getNowPlayingMovies } from "@/lib/tmdb";
import { HomeCinemaView } from "@/components/cinema/home-cinema-view";
import { CinemaFAQ } from "@/components/cinema-faq";

export const revalidate = 1800; // 30 minutes cache revalidation

export default async function HomePage() {
  const allMovies = await getNowPlayingMovies();

  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen">
      {/* Dynamic Cinema View with Hero & Carousels matching pathe_home.png */}
      <HomeCinemaView movies={allMovies} />

      {/* Interactive FAQ Accordion matching pathe_home.png */}
      <CinemaFAQ />
    </div>
  );
}
