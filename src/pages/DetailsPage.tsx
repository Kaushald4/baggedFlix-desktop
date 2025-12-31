"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchMetaDetails, Meta } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Play,
  Star,
  Calendar,
  Clock,
  ArrowLeft,
  Loader2,
  Plus,
  Check,
} from "lucide-react";

import { useWatchHistoryStore } from "@/store/useWatchHistoryStore";

import { useWatchlistStore } from "@/store/useWatchlistStore";
import { Link, useNavigate, useParams } from "react-router";
import { invoke } from "@tauri-apps/api/core";

export default function DetailsPage() {
  const params = useParams<{ type: string; id: string }>();
  const { type, id } = params as { type: string; id: string };
  const [meta, setMeta] = useState<Meta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } =
    useWatchlistStore();
  const { getProgress } = useWatchHistoryStore();
  const [isPlayLoading, setIsPlayLoading] = useState(false);
  const [loadingEpisodeId, setLoadingEpisodeId] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleBack = () => {
    const hasHistory =
      typeof window !== "undefined" &&
      window.history &&
      window.history.length > 1;

    if (hasHistory) {
      navigate(-1);
      return;
    }

    navigate(type === "series" ? "/series" : "/movies");
  };

  const handlePlayClick = async (href: string) => {
    if (!type || !id) return;

    setIsPlayLoading(true);

    try {
      const [, queryString] = href.split("?");
      const search = new URLSearchParams(queryString || "");

      const season =
        type === "series" ? Number(search.get("season") || 1) : undefined;
      const episode =
        type === "series" ? Number(search.get("episode") || 1) : undefined;

      const streamLink = await invoke<string | null>("get_stream_link", {
        id,
        contentType: type,
        webUrl: "http://localhost:4000",
        season,
        episode,
      });

      navigate(href, {
        state: {
          streamLink,
          meta,
        },
      });
    } catch (e) {
      console.error("Error fetching stream link:", e);
      navigate(href);
    } finally {
      setIsPlayLoading(false);
    }
  };

  const handleEpisodePlayClick = async (href: string, episodeId: string) => {
    setLoadingEpisodeId(episodeId);

    try {
      const [, queryString] = href.split("?");
      const search = new URLSearchParams(queryString || "");

      const season = Number(search.get("season"));
      const episode = Number(search.get("episode"));

      const streamLink = await invoke<string | null>("get_stream_link", {
        id,
        contentType: type,
        webUrl: "http://localhost:4000",
        season,
        episode,
      });

      navigate(href, {
        state: {
          streamLink,
          meta,
        },
      });
    } catch (e) {
      console.error("Error fetching stream link:", e);
      navigate(href);
    } finally {
      setLoadingEpisodeId(null);
    }
  };

  const resumeState = useMemo(() => {
    if (!meta) return null;

    if (type === "movie") {
      const progress = getProgress(id);
      if (progress > 0) {
        return {
          label: "Resume",
          href: `/watch/${type}/${id}`,
          progress,
          percentage: Math.min((progress / (120 * 60)) * 100, 100), // Assume 2h for movie
        };
      }
    } else if (type === "series" && meta.videos) {
      // Find the last watched episode
      let lastWatched = null;
      let maxIndex = -1;

      for (const video of meta.videos) {
        const episodeId = `${id}-s${video.season}-e${video.episode}`;
        const progress = getProgress(episodeId);
        if (progress > 0) {
          const index = video.season * 10000 + video.episode;
          if (index > maxIndex) {
            maxIndex = index;
            lastWatched = {
              ...video,
              progress,
              episodeId,
            };
          }
        }
      }

      if (lastWatched) {
        return {
          label: `Resume S${lastWatched.season}:E${lastWatched.episode}`,
          href: `/watch/${type}/${id}?season=${lastWatched.season}&episode=${lastWatched.episode}`,
          progress: lastWatched.progress,
          percentage: Math.min((lastWatched.progress / (25 * 60)) * 100, 100), // Assume 25m for episode
        };
      }
    }

    return {
      label: "Watch Now",
      href: `/watch/${type}/${id}`,
      progress: 0,
      percentage: 0,
    };
  }, [meta, type, id, getProgress]);

  useEffect(() => {
    const loadDetails = async () => {
      if (type && id) {
        setIsLoading(true);
        const data = await fetchMetaDetails(type, id);
        setMeta(data);
        setIsLoading(false);
      }
    };
    loadDetails();
  }, [type, id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <h1 className="text-2xl font-bold mb-4">Content not found</h1>
        <Link to="/movies">
          <Button variant="outline">Go Back</Button>
        </Link>
      </div>
    );
  }

  const seasons = meta.videos
    ? Array.from(new Set(meta.videos.map((v) => v.season)))
        .sort((a, b) => a - b)
        .filter((s) => s !== 0)
    : [];

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Hero Section with Backdrop */}
      <div className="relative h-[50vh] md:h-[70vh] w-full overflow-hidden mb-12">
        <div className="absolute inset-0 h-[90vh] md:h-[40vh]">
          <img
            src={meta.background || meta.poster}
            alt={meta.name}
            className="object-cover h-full w-full"
          />
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-r from-background via-background/40 to-transparent" />
        </div>

        {/* Navigation Back */}
        <div className="fixed top-38 left-4 z-50 md:top-24 md:left-8">
          <Button
            onClick={handleBack}
            variant="ghost"
            size="icon"
            className="rounded-full bg-black/20 dark:bg-slate-500 dark:hover:bg-gray-800 dark:text-white backdrop-blur-md hover:bg-white/10 text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-12 container mx-auto">
          <div className="flex flex-col md:flex-row gap-8 items-end">
            {/* Poster (Hidden on mobile, visible on desktop) */}
            <div className="hidden md:block relative w-64 h-96 rounded-xl overflow-hidden shadow-2xl border border-white/10 shrink-0">
              <img src={meta.poster} alt={meta.name} className="object-cover" />
            </div>

            {/* Text Content */}
            <div className="flex-1 space-y-4 mb-4 md:mb-0">
              <div className="flex flex-wrap gap-2 mb-2">
                {meta.genre?.map((g) => (
                  <Badge
                    key={g}
                    variant="secondary"
                    className="bg-primary/20 text-primary border-primary/20 backdrop-blur-md"
                  >
                    {g}
                  </Badge>
                ))}
              </div>

              <h1 className="text-4xl md:text-6xl font-black tracking-tight  neon-text">
                {meta.name}
              </h1>

              <div className="flex items-center gap-4 text-sm md:text-base dark:text-gray-300 text-black">
                {meta.year && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{meta.year}</span>
                  </div>
                )}
                {meta.runtime && (
                  <div className="flex items-center gap-1 dark:text-gray-300 text-black">
                    <Clock className="w-4 h-4" />
                    <span>{meta.runtime}</span>
                  </div>
                )}
                {meta.imdbRating && (
                  <div className="flex items-center gap-1 dark:text-yellow-400 text-black">
                    <Star className="w-4 h-4 fill-current" />
                    <span>{meta.imdbRating}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  size="lg"
                  className="relative overflow-hidden bg-primary hover:bg-primary/80 text-primary-foreground rounded-full px-8 shadow-[0_0_20px_rgba(var(--primary),0.5)]"
                  onClick={() =>
                    handlePlayClick(resumeState?.href || `/watch/${type}/${id}`)
                  }
                  disabled={isPlayLoading}
                >
                  <div className="relative z-10 flex items-center">
                    {isPlayLoading ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-5 h-5 mr-2 fill-current" />
                    )}
                    {resumeState?.label || "Watch Now"}
                  </div>
                  {resumeState && resumeState.progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                      <div
                        className="h-full bg-white"
                        style={{ width: `${resumeState.percentage}%` }}
                      />
                    </div>
                  )}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur-md"
                  onClick={() => {
                    if (isInWatchlist(meta.id)) {
                      removeFromWatchlist(meta.id);
                    } else {
                      addToWatchlist(meta);
                    }
                  }}
                >
                  {isInWatchlist(meta.id) ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      In Watchlist
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Add to Watchlist
                    </>
                  )}
                </Button>
                {/* <DownloadButton
                  id={meta.id}
                  type={meta.type}
                  title={meta.name}
                /> */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Description & Cast */}
          <div className="lg:col-span-2 space-y-12">
            <section>
              <h2 className="text-2xl font-bold mb-4 text-primary">Synopsis</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {meta.description}
              </p>
            </section>

            {meta.cast && meta.cast.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6 text-primary">Cast</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {meta.cast.map((actor, index) => (
                    <div
                      key={index}
                      className="bg-card/30 border border-white/5 rounded-lg p-3 flex items-center gap-3 hover:bg-card/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                        {actor.charAt(0)}
                      </div>
                      <span className="text-sm font-medium truncate">
                        {actor}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Trailers Section */}
            {meta.trailers && meta.trailers.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6 text-primary">
                  Trailers
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {meta.trailers.map((trailer, index) => (
                    <a
                      key={index}
                      href={`https://www.youtube.com/watch?v=${trailer.source}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group relative aspect-video rounded-xl overflow-hidden border border-white/10"
                    >
                      <img
                        src={`https://img.youtube.com/vi/${trailer.source}/mqdefault.jpg`}
                        alt="Trailer thumbnail"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-primary/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 text-white fill-current" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-linear-to-t from-black/80 to-transparent">
                        <span className="text-sm font-medium text-white truncate block">
                          Trailer {index + 1}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Episodes Section */}
            {meta.videos && meta.videos.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6 text-primary">
                  Episodes
                </h2>
                <Tabs defaultValue={seasons[0]?.toString()} className="w-full">
                  <ScrollArea className="w-full whitespace-nowrap rounded-md border border-white/10 bg-card/20 p-1 mb-4">
                    <TabsList className="bg-transparent h-auto p-0 gap-2">
                      {seasons.map((season) => (
                        <TabsTrigger
                          key={season}
                          value={season.toString()}
                          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 rounded-md"
                        >
                          Season {season}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>

                  {seasons.map((season) => (
                    <TabsContent
                      key={season}
                      value={season.toString()}
                      className="space-y-4"
                    >
                      {meta.videos
                        ?.filter((v) => v.season === season)
                        .sort((a, b) => a.episode - b.episode)
                        .map((episode) => {
                          // Construct unique ID for episode progress tracking
                          const episodeId = `${id}-s${season}-e${episode.episode}`;
                          const progress = getProgress(episodeId);
                          const progressPercentage = progress
                            ? Math.min((progress / (25 * 60)) * 100, 100) // Assuming 25 mins avg duration if unknown
                            : 0;

                          return (
                            <div
                              key={episode.id}
                              className="bg-card/30 border border-white/5 rounded-lg p-4 flex flex-col sm:flex-row gap-4 hover:bg-card/50 transition-colors group/card"
                            >
                              <Link
                                to={`/watch/${type}/${id}?season=${season}&episode=${episode.episode}`}
                                className="relative w-full sm:w-40 aspect-video rounded-md overflow-hidden bg-black/50 shrink-0 group/episode"
                              >
                                {episode.thumbnail ? (
                                  <img
                                    src={episode.thumbnail}
                                    alt={
                                      episode.name ||
                                      `Episode ${episode.episode}`
                                    }
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center h-full text-muted-foreground">
                                    <Play className="w-8 h-8 opacity-50" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/episode:opacity-100 transition-opacity flex items-center justify-center">
                                  <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center group-hover/episode:scale-110 transition-transform">
                                    <Play className="w-5 h-5 text-white fill-current" />
                                  </div>
                                </div>
                                {progress > 0 && (
                                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                                    <div
                                      className="h-full bg-primary"
                                      style={{
                                        width: `${progressPercentage}%`,
                                      }}
                                    />
                                  </div>
                                )}
                              </Link>
                              <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div>
                                      <h4 className="font-bold text-lg truncate text-foreground">
                                        {episode.episode}.{" "}
                                        {episode.name ||
                                          `Episode ${episode.episode}`}
                                      </h4>
                                      <p className="text-sm text-muted-foreground">
                                        {new Date(
                                          episode.released
                                        ).toLocaleDateString()}
                                      </p>
                                    </div>
                                    {/* {episode && episode.rating > 0 && (
                                      <Badge
                                        variant="outline"
                                        className="border-yellow-500/50 text-yellow-500"
                                      >
                                        <Star className="w-3 h-3 mr-1 fill-current" />
                                        {episode &&
                                          episode?.rating &&
                                          Number(episode?.rating).toFixed(1)}
                                      </Badge>
                                    )} */}
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                    {episode.overview ||
                                      episode.description ||
                                      "No description available."}
                                  </p>
                                </div>

                                <div className="flex items-center gap-3 mt-auto opacity-100 md:opacity-0 md:group-hover/card:opacity-100 transition-opacity">
                                  <Button
                                    size="sm"
                                    className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
                                    onClick={() =>
                                      handleEpisodePlayClick(
                                        `/watch/${type}/${id}?season=${season}&episode=${episode.episode}`,
                                        episodeId
                                      )
                                    }
                                    disabled={loadingEpisodeId === episodeId}
                                  >
                                    {loadingEpisodeId === episodeId ? (
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                      <Play className="w-4 h-4 mr-2 fill-current" />
                                    )}
                                    {progress > 0
                                      ? "Resume Episode"
                                      : "Play Episode"}
                                  </Button>
                                  {/* <DownloadButton
                                    id={episode.id?.split(":")?.[0]}
                                    type="series"
                                    title={`${meta.name} - S${season}E${episode.episode}`}
                                    // size="icon"
                                  /> */}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </TabsContent>
                  ))}
                </Tabs>
              </section>
            )}
          </div>

          {/* Right Column: Info & Crew */}
          <div className="space-y-8">
            <div className="bg-card/20 backdrop-blur-md border border-white/10 rounded-xl p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Director
                </h3>
                <div className="flex flex-wrap gap-2">
                  {meta.director?.map((d, i) => (
                    <span key={i} className="text-foreground font-medium">
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Writers
                </h3>
                <div className="flex flex-wrap gap-2">
                  {meta.writer?.map((w, i) => (
                    <span key={i} className="text-foreground font-medium">
                      {w}
                      {i < (meta.writer?.length || 0) - 1 ? "," : ""}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Country
                </h3>
                <p className="text-foreground font-medium">{meta.country}</p>
              </div>

              {meta.status && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Status
                  </h3>
                  <p className="text-foreground font-medium">{meta.status}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Awards
                </h3>
                <p className="text-foreground font-medium text-sm">
                  {meta.awards}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
