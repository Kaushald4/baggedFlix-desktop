import axios from "axios";

export interface CinezoSource {
  label: string;
  quality: string;
  server: string;
  scraperName: string;
  accessible: boolean;
  url: string;
  referer: string;
  proxiedUrl: string;
  type?: string;
  origin?: string;
}

export interface CinezoTrack {
  file: string;
  label: string;
  kind: string;
}

export interface CinezoRoot {
  tmdbId: string;
  type: string;
  totalSources: number;
  sources: CinezoSource[];
  tracks: CinezoTrack[];
}

const CINEZO_BASE = "https://api.cinezo.live";

export const cinezoSourceName = "Cinezo";

export async function fetchMovieSources(tmdbId: string | number): Promise<CinezoRoot | null> {
  try {
    const url = `${CINEZO_BASE}/movie/sources?tmdb=${tmdbId}`;
    const resp = await axios.get<CinezoRoot>(url);
    return resp.data;
  } catch (e) {
    console.error("Failed to fetch cinezo movie sources:", e);
    return null;
  }
}

export async function fetchTvSources(
  tmdbId: string | number,
  season: number,
  episode: number,
): Promise<CinezoRoot | null> {
  try {
    const url = `${CINEZO_BASE}/tv/sources?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
    const resp = await axios.get<CinezoRoot>(url);
    return resp.data;
  } catch (e) {
    console.error("Failed to fetch cinezo tv sources:", e);
    return null;
  }
}
