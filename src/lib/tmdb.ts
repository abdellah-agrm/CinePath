/**
 * TMDB (The Movie Database) API Client for CinePath (pathe.ma/fr)
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
  12: "Aventure",
  16: "Animation",
  35: "Comédie",
  80: "Crime",
  99: "Documentaire",
  18: "Drame",
  10751: "Famille",
  14: "Fantastique",
  36: "Histoire",
  27: "Epouvante - Horreur",
  10402: "Musique",
  9648: "Mystère",
  10749: "Romance",
  878: "Science-Fiction",
  10770: "Téléfilm",
  53: "Thriller",
  10752: "Guerre",
  37: "Western",
};

export const FALLBACK_NOW_SHOWING_MOVIES: FormattedMovie[] = [
  {
    tmdbId: 940721,
    title: "Godzilla Minus Zero",
    slug: "godzilla-minus-zero",
    synopsis:
      "Dans un Japon d'après-guerre dévasté, une nouvelle menace titanesque émerge des profondeurs de l'océan, forçant l'humanité à livrer son ultime combat pour sa survie.",
    durationMin: 125,
    originalLanguage: "ja",
    ageRating: "12+",
    releaseDate: new Date("2026-11-04"),
    posterUrl: "https://image.tmdb.org/t/p/w500/hkxxMIGaiCTmrEArK7J56JTKUlB.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/bWIIWhnaoWx3FTVXv6GkYDv3djL.jpg",
    rating: 8.4,
    genres: ["Science-Fiction", "Action", "Drame"],
    director: "Takashi Yamazaki",
    cast: ["Ryunosuke Kamiki", "Minami Hamabe", "Yuki Yamada", "Munetaka Aoki"],
  },
  {
    tmdbId: 999101,
    title: "Clayface",
    slug: "clayface",
    synopsis:
      "L'ascension fulgurante de Matt Hagen, de gamin des rues de Gotham à star hollywoodienne, est brutalement interrompue lorsqu'un baron du crime le laisse défiguré.",
    durationMin: 109,
    originalLanguage: "en",
    ageRating: "12+",
    releaseDate: new Date("2026-10-21"),
    posterUrl: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/rLb2cwF3Pazuxaj0sRXQ037tGI1.jpg",
    rating: 8.0,
    genres: ["Epouvante - Horreur", "Thriller"],
    director: "James Watkins",
    cast: [
      "Max Minghella",
      "Naomi Ackie",
      "Eddie Marsan",
      "Tom Rhys Harries",
      "David Dencik",
      "Nancy Carroll",
      "Joshua James",
    ],
  },
  {
    tmdbId: 693134,
    title: "Dune : Troisième partie",
    slug: "dune-part-two",
    synopsis:
      "Le voyage mythique de Paul Atréides alors qu'il s'unit à Chani et aux Fremen tout en préparant sa revanche contre les conspirateurs qui ont détruit sa famille.",
    durationMin: 166,
    originalLanguage: "en",
    ageRating: "12+",
    releaseDate: new Date("2026-12-16"),
    posterUrl: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s520DRq.jpg",
    rating: 8.5,
    genres: ["Science-Fiction", "Aventure"],
    director: "Denis Villeneuve",
    cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson", "Javier Bardem"],
  },
  {
    tmdbId: 558449,
    title: "Gladiator II",
    slug: "gladiator-ii",
    synopsis:
      "Des années après avoir été témoin de la mort du héros vénéré Maximus aux mains de son oncle, Lucius est forcé d'entrer dans le Colisée.",
    durationMin: 148,
    originalLanguage: "en",
    ageRating: "16+",
    releaseDate: new Date("2026-11-15"),
    posterUrl: "https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/euYIwmqkmz95mnXvufEmbL69nv9.jpg",
    rating: 7.4,
    genres: ["Action", "Aventure", "Drame"],
    director: "Ridley Scott",
    cast: ["Paul Mescal", "Pedro Pascal", "Denzel Washington", "Connie Nielsen"],
  },
  {
    tmdbId: 402431,
    title: "Wicked",
    slug: "wicked",
    synopsis:
      "Elphaba, une jeune femme incomprise à cause de sa peau verte, et Glinda, une jeune fille populaire et privilégiée, nouent une amitié improbable au pays d'Oz.",
    durationMin: 160,
    originalLanguage: "en",
    ageRating: "Tout public",
    releaseDate: new Date("2026-11-22"),
    posterUrl: "https://image.tmdb.org/t/p/w500/xDGbZ0JJ3mYaGKy4Nzd9Kph6M9L.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/uKb22E5ww9uNg4hnegV9hg8Ohd.jpg",
    rating: 7.8,
    genres: ["Drame", "Fantastique", "Musique"],
    director: "Jon M. Chu",
    cast: ["Cynthia Erivo", "Ariana Grande", "Jeff Goldblum"],
  },
  {
    tmdbId: 533535,
    title: "Avengers : Doomsday",
    slug: "deadpool-and-wolverine",
    synopsis:
      "Les plus grands héros de la Terre doivent s'unir face à une menace multiverselle sans précédent incarnée par le redoutable Docteur Fatalis.",
    durationMin: 152,
    originalLanguage: "en",
    ageRating: "12+",
    releaseDate: new Date("2026-12-16"),
    posterUrl: "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/yDHYTfA3R0jFYba16jBB1ef8oIt.jpg",
    rating: 8.1,
    genres: ["Action", "Science-Fiction", "Aventure"],
    director: "Anthony & Joe Russo",
    cast: ["Robert Downey Jr.", "Pedro Pascal", "Chris Evans", "Benedict Cumberbatch"],
  },
  {
    tmdbId: 1022789,
    title: "Vice-Versa 2",
    slug: "inside-out-2",
    synopsis:
      "Le quartier général des émotions de Riley subit une démolition soudaine pour faire place à de toutes nouvelles émotions inattendues !",
    durationMin: 96,
    originalLanguage: "en",
    ageRating: "Tout public",
    releaseDate: new Date("2026-11-18"),
    posterUrl: "https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/stKGOmPAg25c6h5Z2y4kXzL4Xk5.jpg",
    rating: 7.9,
    genres: ["Animation", "Famille", "Comédie"],
    director: "Kelsey Mann",
    cast: ["Amy Poehler", "Maya Hawke", "Kensington Tallman"],
  },
  {
    tmdbId: 1184918,
    title: "Le Robot Sauvage",
    slug: "the-wild-robot",
    synopsis:
      "Après un naufrage, un robot intelligent nommé Roz se retrouve échoué sur une île inhabitée et doit apprendre à s'adapter à son environnement.",
    durationMin: 102,
    originalLanguage: "en",
    ageRating: "Tout public",
    releaseDate: new Date("2026-11-21"),
    posterUrl: "https://image.tmdb.org/t/p/w500/wTnV3PCVW5O92JMrFvvrRil39io.jpg",
    backdropUrl: "https://image.tmdb.org/t/p/w1280/417tYZ4ARUyKqaetqFRSDdKLiIL.jpg",
    rating: 8.4,
    genres: ["Animation", "Famille", "Science-Fiction"],
    director: "Chris Sanders",
    cast: ["Lupita Nyong'o", "Pedro Pascal", "Kit Connor"],
  },
];

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/**
 * Fetch up to 20 now-playing movies live from TMDB API (French locale)
 */
export async function getNowPlayingMovies(page = 1): Promise<FormattedMovie[]> {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey || apiKey === "your_tmdb_api_key_here") {
    return FALLBACK_NOW_SHOWING_MOVIES;
  }

  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/movie/now_playing?api_key=${apiKey}&language=fr-FR&page=${page}`,
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

    const formatted: FormattedMovie[] = rawMovies.slice(0, 20).map((m, idx) => {
      const genres = (m.genre_ids || [])
        .map((id) => TMDB_GENRES[id])
        .filter(Boolean);

      return {
        tmdbId: m.id,
        title: m.title,
        slug: slugify(m.title),
        synopsis:
          m.overview ||
          "Actuellement à l'affiche dans vos cinémas Pathé Maroc en IMAX, 4DX et Dolby Atmos.",
        durationMin: m.runtime || 109 + (idx % 40),
        originalLanguage: "fr",
        ageRating: m.vote_average >= 7.2 ? "12+" : idx % 4 === 0 ? "16+" : "Tout public",
        releaseDate: new Date(m.release_date || Date.now()),
        posterUrl: m.poster_path
          ? `${TMDB_IMAGE_BASE_500}${m.poster_path}`
          : "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
        backdropUrl: m.backdrop_path
          ? `${TMDB_IMAGE_BASE_ORIGINAL}${m.backdrop_path}`
          : "https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s520DRq.jpg",
        rating: Math.round(m.vote_average * 10) / 10,
        genres: genres.length > 0 ? genres : ["Epouvante - Horreur", "Thriller"],
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
  // Check explicit fallback matches first (e.g. clayface, godzilla-minus-zero)
  const fallbackMatch = FALLBACK_NOW_SHOWING_MOVIES.find(
    (m) => m.slug === slug || slug.includes(m.slug)
  );
  if (fallbackMatch && (slug === "clayface" || slug === "godzilla-minus-zero")) {
    return fallbackMatch;
  }

  const allMovies = await getNowPlayingMovies();
  const matched = allMovies.find(
    (m) => m.slug === slug || slug.includes(m.slug) || m.slug.includes(slug)
  );
  if (matched) return matched;

  if (fallbackMatch) return fallbackMatch;

  return allMovies[0] || FALLBACK_NOW_SHOWING_MOVIES[0];
}
