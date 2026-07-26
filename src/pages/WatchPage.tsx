import { WatchPlayer } from "@/components/global/WatchPlayer";
import { ArrowLeft, Info, Star, Server, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
import { useEffect, useState, useMemo } from "react";
import { Meta, fetchMetaDetails } from "@/lib/api";
import {
  fetchMovieSources,
  fetchTvSources,
  cinezoSourceName,
} from "@/lib/cinezoApi";
import { invoke } from "@tauri-apps/api/core";
import { cn } from "@/lib/utils";

interface ServerOption {
  id: string;
  label: string;
  quality: string;
  url: string;
  isDirectFile: boolean;
  server: string;
}

export default function WatchPage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const navState = (location.state || null) as {
    streamLink?: string | null;
    meta?: Meta | null;
  } | null;

  const season = searchParams.get("season") ?? "1";
  const episode = searchParams.get("episode") ?? "1";

  const contentId = type === "movie" ? id : `${id}-s${season}-e${episode}`;

  const [meta, setMeta] = useState<Meta | null>(navState?.meta ?? null);
  const [servers, setServers] = useState<ServerOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const videos = useMemo(() => {
    if (!meta?.videos) return [];
    return meta.videos.filter((v) => v.season > 0);
  }, [meta?.videos]);

  const metaInfo = useMemo(() => ({
    metaId: id, type,
    title: meta?.name || "Unknown Title",
    poster: meta?.poster || "",
    background: meta?.background || meta?.poster || "",
    season: type === "series" ? parseInt(season) : undefined,
    episode: type === "series" ? parseInt(episode) : undefined,
    description: meta?.description || "",
    year: meta?.year || "",
    runtime: meta?.runtime || "",
    imdbRating: meta?.imdbRating || "",
    genre: meta?.genre || [],
    imdbId: meta?.imdb_id || "",
  }), [meta, type, id, season, episode]);

  const episodeInfo = type === "series"
    ? videos.find((v) => v.season === parseInt(season) && v.episode === parseInt(episode))
    : null;

  const episodeTitle = episodeInfo?.name || `Episode ${episode}`;
  const episodeDescription = episodeInfo?.overview || episodeInfo?.description || "";

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      let resolvedMeta = navState?.meta ?? null;
      if (!resolvedMeta) {
        try { resolvedMeta = await fetchMetaDetails(type!, id!); } catch {}
      }
      if (cancelled) return;
      if (resolvedMeta) setMeta(resolvedMeta);

      let vsembedLink = navState?.streamLink ?? null;
      if (!vsembedLink) {
        try {
          const s = type === "series" ? Number(season) || 1 : undefined;
          const e = type === "series" ? Number(episode) || 1 : undefined;
          vsembedLink = await invoke<string | null>("get_stream_link", {
            id, contentType: type, webUrl: "http://localhost:4000", season: s, episode: e,
          });
        } catch {}
      }
      if (cancelled) return;

      const tmdbId = resolvedMeta?.moviedb_id || resolvedMeta?.imdb_id?.replace("tt", "") || null;
      const newServers: ServerOption[] = [];
      if (vsembedLink) {
        newServers.push({ id: "vsembed", label: "Default Server", quality: "", url: vsembedLink, isDirectFile: false, server: "vsembed" });
      }
      if (tmdbId) {
        try {
          const result = type === "movie"
            ? await fetchMovieSources(tmdbId)
            : await fetchTvSources(tmdbId, parseInt(season), parseInt(episode));
          if (result?.sources) {
            let idx = 0;
            for (const s of result.sources) {
              if (!s.url) continue;
              const refererParam = s.referer ? `&referer=${encodeURIComponent(s.referer)}` : "";
              const proxyUrl = `http://localhost:4000/api/stream?url=${encodeURIComponent(s.url)}${refererParam}`;

              // Fetch the proxy — it forwards the Referer and rewrites all child URLs
              let m3u8: string;
              try {
                const resp = await fetch(proxyUrl);
                if (!resp.ok) continue;
                m3u8 = await resp.text();
              } catch {
                continue;
              }

              newServers.push({ id: `cinezo-${idx}`, label: s.label || `Server ${newServers.length + 1}`, quality: s.quality || "Auto", url: m3u8, isDirectFile: false, server: cinezoSourceName });
              idx++;
            }
          }
        } catch {}
      }
      if (cancelled) return;

      if (newServers.length === 0) {
        setError("No servers available for this content.");
      } else {
        setServers(newServers);
        setSelectedId(newServers[0].id);
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [type, id, season, episode]);

  const activeServer = servers.find((s) => s.id === selectedId);
  const showLoading = loading && servers.length === 0;

  return (
    <div style={{ paddingTop: "var(--safe-top)" }} className="min-h-screen bg-background mt-15 md:mt-20">
      <div className="relative w-full bg-black">
        <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 dark:from-black/80 to-transparent">
          <Button onClick={() => navigate(-1)} variant="ghost" size="sm" className="text-white dark:text-white hover:bg-white/10 dark:hover:bg-white/10 gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="text-white dark:text-white hover:bg-white/10 dark:hover:bg-white/10">
              <Info className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="w-full aspect-video md:aspect-[21/9] bg-black">
          {showLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-white">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-gray-400">Loading servers...</p>
            </div>
          ) : error && !activeServer ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-white">
              <div className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center mb-4">
                <Info className="w-8 h-8 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Stream not available</h1>
              <p className="text-gray-400 text-center max-w-md">{error}</p>
              <Link to={`/${type}/${id}`} className="mt-6">
                <Button variant="outline" className="border-white/20 text-white bg-primary/20 hover:text-white hover:bg-primary/50">Back to Details</Button>
              </Link>
            </div>
          ) : activeServer ? (
            <WatchPlayer id="player" file={activeServer.url} isDirectFile={activeServer.isDirectFile} contentId={contentId!} meta={metaInfo as any} videos={[]} />
          ) : null}
        </div>

        {servers.length > 0 && (
          <div className="bg-black/80 border-t border-white/10 px-4 py-3">
            <div className="flex items-center gap-2 overflow-x-auto">
              <Server className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-400 mr-1 shrink-0 whitespace-nowrap">Servers:</span>
              {servers.map((srv) => (
                <button key={srv.id} onClick={() => setSelectedId(srv.id)}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                    selectedId === srv.id ? "bg-primary text-primary-foreground" : "bg-white/10 text-gray-300 hover:bg-white/20"
                  )}>
                  {srv.quality && <span className="opacity-80">{srv.quality}</span>}
                  <span>{srv.label}</span>
                  {srv.server === "vsembed" && <span className="opacity-50">vsembed</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="hidden md:block relative w-32 h-48 shrink-0 rounded-md overflow-hidden shadow-lg">
            {meta?.poster && <img src={meta.poster} alt={metaInfo.title} className="object-cover" />}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{meta?.name || "Unknown Title"}</h1>
            {type === "series" && <p className="text-lg text-muted-foreground mb-4">S{season} E{episode} • {episodeTitle}</p>}
            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
              {metaInfo.imdbRating && <div className="flex items-center gap-1 text-green-400 font-semibold"><Star className="w-4 h-4 fill-current" /><span>{metaInfo.imdbRating} Match</span></div>}
              {metaInfo.year && <span className="text-muted-foreground">{metaInfo.year}</span>}
              {metaInfo.runtime && type === "movie" && <span className="text-muted-foreground">{metaInfo.runtime}</span>}
              {episodeInfo?.released && type === "series" && <span className="text-muted-foreground">{new Date(episodeInfo.released).toLocaleDateString()}</span>}
              {metaInfo.genre?.slice(0, 2).map((g) => <Badge key={g} variant="secondary" className="bg-white/10 text-foreground border-white/10 text-xs">{g}</Badge>)}
            </div>
            {meta?.description && (
              <p className="text-muted-foreground text-sm md:text-base line-clamp-3 mb-4">
                {type === "series" && episodeDescription ? episodeDescription : meta.description}
              </p>
            )}
            <div className="flex gap-3">
              <Link to={`/${type}/${id}`}><Button variant="outline" className="border-white/20 bg-white/5 text-foreground hover:bg-white/10"><Info className="w-4 h-4 mr-2" />More Info</Button></Link>
            </div>
          </div>
        </div>
      </div>

      {type === "series" && videos.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 border-t border-white/10">
          <h2 className="text-xl font-bold text-foreground mb-4">Episodes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.filter((v) => v.season === parseInt(season)).sort((a, b) => a.episode - b.episode).map((ep) => {
              const isCurrent = ep.episode === parseInt(episode);
              const href = `/watch/${type}/${id}?season=${season}&episode=${ep.episode}`;
              return (
                <Link key={ep.id || `${id}-s${season}-e${ep.episode}`} to={href}
                  className={`flex gap-3 p-3 rounded-lg transition-colors ${isCurrent ? "bg-white/10 border border-white/20" : "bg-white/5 hover:bg-white/10 border border-transparent"}`}>
                  <div className="relative w-24 aspect-video rounded overflow-hidden bg-black/50 shrink-0">
                    {ep.thumbnail ? <img src={ep.thumbnail} alt={ep.name || `Episode ${ep.episode}`} className="object-cover" /> : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground"><span className="text-xs">{ep.episode}</span></div>
                    )}
                    {isCurrent && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                          <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-foreground">{ep.episode}.</span>
                      <span className="text-sm text-muted-foreground truncate">{ep.name || `Episode ${ep.episode}`}</span>
                    </div>
                    {ep.released && <p className="text-xs text-muted-foreground">{new Date(ep.released).toLocaleDateString()}</p>}
                    {isCurrent && <Badge variant="secondary" className="mt-2 bg-primary/20 text-primary border-primary/20 text-xs">Playing</Badge>}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
