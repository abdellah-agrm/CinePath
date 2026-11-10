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
}

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
  },
];

/**
 * Fetch movies currently playing in theatres from TMDB
 */
export async function getNowPlayingMovies(page = 1): Promise<FormattedMovie[]> {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey || apiKey === "your_tmdb_api_key_here") {
    return FALLBACK_NOW_SHOWING_MOVIES;
  }

  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/movie/now_playing?api_key=${apiKey}&language=en-US&page=${page}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      return FALLBACK_NOW_SHOWING_MOVIES;
    }

    const data = await res.json();
    const rawMovies: TMDBMovie[] = data.results || [];

    const detailedMovies = await Promise.all(
      rawMovies.slice(0, 8).map(async (m) => {
        try {
          const detailRes = await fetch(
            `${TMDB_BASE_URL}/movie/${m.id}?api_key=${apiKey}&language=en-US`
          );
          const detail = detailRes.ok ? await detailRes.json() : {};
          const genreNames = detail.genres?.map((g: any) => g.name) || ["Action"];

          return {
            tmdbId: m.id,
            title: m.title,
            slug: m.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)+/g, ""),
            synopsis: m.overview || "No synopsis available.",
            durationMin: detail.runtime || 120,
            originalLanguage: "en",
            ageRating: detail.adult ? "18+" : "12+",
            releaseDate: new Date(m.release_date || Date.now()),
            posterUrl: m.poster_path
              ? `${TMDB_IMAGE_BASE_500}${m.poster_path}`
              : "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
            backdropUrl: m.backdrop_path
              ? `${TMDB_IMAGE_BASE_ORIGINAL}${m.backdrop_path}`
              : "https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s520DRq.jpg",
            rating: Math.round(m.vote_average * 10) / 10,
            genres: genreNames,
          };
        } catch {
          return null;
        }
      })
    );

    const valid = detailedMovies.filter((m): m is FormattedMovie => m !== null);
    return valid.length > 0 ? valid : FALLBACK_NOW_SHOWING_MOVIES;
  } catch (error) {
    console.error("Failed to connect to TMDB API:", error);
    return FALLBACK_NOW_SHOWING_MOVIES;
  }
}

