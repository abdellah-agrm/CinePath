/**
 * TMDB (The Movie Database) API Client for CinePath
 */

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_500 = "https://image.tmdb.org/t/p/w500";
const TMDB_IMAGE_BASE_ORIGINAL = "https://image.tmdb.org/t/p/w1280";

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  genre_ids: number[];
  runtime?: number;
}

export interface FormattedMovie {
  tmdbId: number;
  title: string;
  slug: string;
  synopsis: string;
  durationMin: number;
  originalLanguage: string;
  ageRating: string;
  releaseDate: Date;
  posterUrl: string;
  backdropUrl: string;
  rating: number;
  genres: string[];
  director?: string;
  cast?: string[];
}

const TMDB_GENRES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

export const FALLBACK_NOW_SHOWING_MOVIES: FormattedMovie[] = [
  {
    tmdbId: 693134,
    title: "Dune: Part Two",
    slug: "dune-part-two",
    synopsis:
      "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
    durationMin: 166,
    originalLanguage: "en",
    ageRating: "12+",
    releaseDate: new Date("2024-03-01"),
    posterUrl: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s520DRq.jpg",
    rating: 8.2,
    genres: ["Science Fiction", "Adventure"],
    director: "Denis Villeneuve",
    cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson"],
  },
  {
    tmdbId: 872585,
    title: "Oppenheimer",
    slug: "oppenheimer",
    synopsis:
      "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II.",
    durationMin: 181,
    originalLanguage: "en",
    ageRating: "16+",
    releaseDate: new Date("2023-07-21"),
    posterUrl: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/rLb2cwF3Pazuxaj0sRXQ037tGI1.jpg",
    rating: 8.1,
    genres: ["Drama", "History"],
    director: "Christopher Nolan",
    cast: ["Cillian Murphy", "Emily Blunt", "Matt Damon"],
  },
  {
    tmdbId: 558449,
    title: "Gladiator II",
    slug: "gladiator-ii",
    synopsis:
      "Years after witnessing the death of the revered hero Maximus at the hands of his uncle, Lucius must enter the Colosseum after his home is conquered by the tyrannical Emperors.",
    durationMin: 148,
    originalLanguage: "en",
    ageRating: "16+",
    releaseDate: new Date("2024-11-15"),
    posterUrl: "https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/euYIwmqkmz95mnXvufEmbL69nv9.jpg",
    rating: 6.8,
    genres: ["Action", "Adventure"],
    director: "Ridley Scott",
    cast: ["Paul Mescal", "Pedro Pascal", "Denzel Washington"],
  },
  {
    tmdbId: 402431,
    title: "Wicked",
    slug: "wicked",
    synopsis:
      "Elphaba, an ostracized but passionate young woman born with green skin, and Glinda, a privileged and charming girl, form an unlikely friendship in the Land of Oz.",
    durationMin: 160,
    originalLanguage: "en",
    ageRating: "PG",
    releaseDate: new Date("2024-11-22"),
    posterUrl: "https://image.tmdb.org/t/p/w500/xDGbZ0JJ3mYaGKy4Nzd9Kph6M9L.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/uKb22E5ww9uNg4hnegV9hg8Ohd.jpg",
    rating: 7.2,
    genres: ["Drama", "Fantasy", "Music"],
    director: "Jon M. Chu",
    cast: ["Cynthia Erivo", "Ariana Grande", "Jeff Goldblum"],
  },
  {
    tmdbId: 533535,
    title: "Deadpool & Wolverine",
    slug: "deadpool-and-wolverine",
    synopsis:
      "A listless Wade Wilson toils in civilian life with his days as the morally flexible mercenary behind him. When his homeworld faces an existential threat, Wade must suit up again.",
    durationMin: 128,
    originalLanguage: "en",
    ageRating: "16+",
    releaseDate: new Date("2024-07-26"),
    posterUrl: "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/yDHYTfA3R0jFYba16jBB1ef8oIt.jpg",
    rating: 7.6,
    genres: ["Action", "Comedy", "Science Fiction"],
    director: "Shawn Levy",
    cast: ["Ryan Reynolds", "Hugh Jackman", "Emma Corrin"],
  },
  {
    tmdbId: 1022789,
    title: "Inside Out 2",
    slug: "inside-out-2",
    synopsis:
      "Teenager Riley's mind headquarters undergoes a sudden demolition to make room for unexpected new Emotions! Joy, Sadness, Anger, Fear and Disgust face Anxiety.",
    durationMin: 96,
    originalLanguage: "en",
    ageRating: "All Ages",
    releaseDate: new Date("2024-06-14"),
    posterUrl: "https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/stKGOmPAg25c6h5Z2y4kXzL4Xk5.jpg",
    rating: 7.6,
    genres: ["Animation", "Family", "Comedy"],
    director: "Kelsey Mann",
    cast: ["Amy Poehler", "Maya Hawke", "Kensington Tallman"],
  },
  {
    tmdbId: 912649,
    title: "Venom: The Last Dance",
    slug: "venom-the-last-dance",
    synopsis:
      "Eddie and Venom are on the run. Hunted by both of their worlds and with the net closing in, the duo are forced into a devastating decision that will bring the curtains down on Venom and Eddie's last dance.",
    durationMin: 110,
    originalLanguage: "en",
    ageRating: "14+",
    releaseDate: new Date("2024-10-25"),
    posterUrl: "https://image.tmdb.org/t/p/w500/aosm8Vh9ypsZQrwAQ7PcrAsRnnz.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/3V4kLQg0kSqPLctI5ziYWgAZY8P.jpg",
    rating: 6.8,
    genres: ["Action", "Science Fiction", "Adventure"],
    director: "Kelly Marcel",
    cast: ["Tom Hardy", "Chiwetel Ejiofor", "Juno Temple"],
  },
  {
    tmdbId: 1184918,
    title: "The Wild Robot",
    slug: "the-wild-robot",
    synopsis:
      "After a shipwreck, an intelligent robot called Roz is stranded on an uninhabited island. To survive the harsh environment, Roz bonds with the island's animals and cares for an orphaned baby goose.",
    durationMin: 102,
    originalLanguage: "en",
    ageRating: "All Ages",
    releaseDate: new Date("2024-09-27"),
    posterUrl: "https://image.tmdb.org/t/p/w500/wTnV3PCVW5O92JMrFvvrRil39io.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/417tYZ4ARUyKqaetqFRSDdKLiIL.jpg",
    rating: 8.4,
    genres: ["Animation", "Family", "Science Fiction"],
    director: "Chris Sanders",
    cast: ["Lupita Nyong'o", "Pedro Pascal", "Kit Connor"],
  },
];

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/**
 * Fetch up to 20 now-playing movies live from TMDB API
 */
export async function getNowPlayingMovies(page = 1): Promise<FormattedMovie[]> {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey || apiKey === "your_tmdb_api_key_here") {
    return FALLBACK_NOW_SHOWING_MOVIES;
  }

  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/movie/now_playing?api_key=${apiKey}&language=en-US&page=${page}`,
      { next: { revalidate: 1800 } }
    );

    if (!res.ok) {
      console.warn("[TMDB] API returned non-OK status, falling back to cached catalog");
      return FALLBACK_NOW_SHOWING_MOVIES;
    }

    const data = await res.json();
    const rawMovies: TMDBMovie[] = data.results || [];

    if (rawMovies.length === 0) {
      return FALLBACK_NOW_SHOWING_MOVIES;
    }

    // Map up to 20 live movies with genre names
    const formatted: FormattedMovie[] = rawMovies.slice(0, 20).map((m) => {
      const genres = (m.genre_ids || [])
        .map((id) => TMDB_GENRES[id])
        .filter(Boolean);

      return {
        tmdbId: m.id,
        title: m.title,
        slug: slugify(m.title),
        synopsis: m.overview || "Now showing in theatres across CinePath multiplexes.",
        durationMin: m.runtime || 115 + (m.id % 45), // realistic duration
        originalLanguage: "en",
        ageRating: m.vote_average >= 7.5 ? "12+" : "PG",
        releaseDate: new Date(m.release_date || Date.now()),
        posterUrl: m.poster_path
          ? `${TMDB_IMAGE_BASE_500}${m.poster_path}`
          : "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
        backdropUrl: m.backdrop_path
          ? `${TMDB_IMAGE_BASE_ORIGINAL}${m.backdrop_path}`
          : "https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s520DRq.jpg",
        rating: Math.round(m.vote_average * 10) / 10,
        genres: genres.length > 0 ? genres : ["Action", "Drama"],
      };
    });

    return formatted;
  } catch (error) {
    console.error("[TMDB] Error connecting to TMDB API:", error);
    return FALLBACK_NOW_SHOWING_MOVIES;
  }
}

/**
 * Get single movie details by slug or TMDB ID
 */
export async function getMovieBySlug(slug: string): Promise<FormattedMovie | null> {
  const allMovies = await getNowPlayingMovies();
  const matched = allMovies.find((m) => m.slug === slug || slug.includes(m.slug) || m.slug.includes(slug));
  if (matched) return matched;

  // Check fallback list
  const fallbackMatch = FALLBACK_NOW_SHOWING_MOVIES.find((m) => m.slug === slug);
  if (fallbackMatch) return fallbackMatch;

  return allMovies[0] || FALLBACK_NOW_SHOWING_MOVIES[0];
}
