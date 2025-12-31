"use client";

import { useWatchHistoryStore } from "@/store/useWatchHistoryStore";
import { Button } from "@/components/ui/button";
import {
  Play,
  ChevronRight,
  Info,
  Plus,
  Loader2,
  Star,
  ChevronLeft,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useInfiniteContent } from "@/hooks/useStreamio";
import { Meta } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router";

interface ContentRowProps {
  title: string;
  type: "movie" | "series";
  limit?: number;
  onPlay?: (item: Meta) => void;
}

function ContentRow({ title, type, limit = 10, onPlay }: ContentRowProps) {
  const { data, isLoading } = useInfiniteContent(type);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const items = data?.pages.flatMap((page) => page).slice(0, limit) || [];

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const checkScroll = () => {
    if (scrollRef.current) {
      setShowLeftArrow(scrollRef.current.scrollLeft > 10);
      setShowRightArrow(
        scrollRef.current.scrollLeft <
          scrollRef.current.scrollWidth - scrollRef.current.clientWidth - 10
      );
    }
  };

  useEffect(() => {
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener("scroll", checkScroll);
      checkScroll();
      return () => ref.removeEventListener("scroll", checkScroll);
    }
  }, [items]);

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">
          {title}
        </h2>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              className="w-[160px] md:w-[200px] h-[240px] md:h-[300px] flex-shrink-0 rounded-md"
            />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="space-y-4 group/row">
      <h2 className="text-xl md:text-2xl font-bold text-foreground">{title}</h2>
      <div className="relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 z-20 bg-black/50 dark:bg-black/50 hover:bg-black/80 dark:hover:bg-black/80 px-2 flex items-center justify-center transition-all opacity-0 group-hover/row:opacity-100"
          >
            <ChevronLeft className="w-8 h-8 text-foreground" />
          </button>
        )}

        {/* Content Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth py-4 px-1"
        >
          {items.map((item) => {
            if (!item) return null;
            return (
              <Link
                key={item.id}
                to={`/${item?.type}/${item?.id}`}
                className="flex-shrink-0 w-[140px] md:w-[180px] lg:w-[200px] group/card"
              >
                <div className="relative aspect-[2/3] rounded-md overflow-hidden transition-all duration-300 group-hover/card:scale-105 group-hover/card:z-10">
                  <img
                    src={item.poster}
                    alt={item.name}
                    className="object-cover"
                    sizes="(max-width: 768px) 140px, (max-width: 1200px) 180px, 200px"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 dark:bg-black/60 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          onPlay?.(item);
                        }}
                        className="bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/80 transition-colors"
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                      <button className="bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {item.imdbRating && (
                        <div className="flex items-center gap-1 text-green-400">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{item.imdbRating}</span>
                        </div>
                      )}
                      {item.year && (
                        <span className="text-muted-foreground">
                          {item.year}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground truncate group-hover/card:text-foreground transition-colors">
                  {item.name}
                </p>
              </Link>
            );
          })}
        </div>

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-0 z-20 bg-black/50 dark:bg-black/50 hover:bg-black/80 dark:hover:bg-black/80 px-2 flex items-center justify-center transition-all opacity-0 group-hover/row:opacity-100"
          >
            <ChevronRight className="w-8 h-8 text-foreground" />
          </button>
        )}
      </div>
    </section>
  );
}

function HeroBanner() {
  const { data: moviesData } = useInfiniteContent("movie");
  const { data: seriesData } = useInfiniteContent("series");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const allItems = [
    ...(moviesData?.pages.flatMap((page) => page) || []),
    ...(seriesData?.pages.flatMap((page) => page) || []),
  ].slice(0, 10);

  const currentItem = allItems[currentIndex];

  useEffect(() => {
    if (allItems.length > 1) {
      const interval = setInterval(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % allItems.length);
          setIsTransitioning(false);
        }, 500);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [allItems.length]);

  if (!currentItem) {
    return (
      <div className="relative h-[70vh] md:h-[85vh] bg-gradient-to-b from-background to-black">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  return (
    <div
      style={{
        paddingTop: "var(--safe-top)",
      }}
      className="relative h-[70vh] md:h-[85vh] overflow-hidden"
    >
      {/* Background Image with Gradient Overlay */}
      <div
        className="absolute inset-0"
        style={{
          paddingTop: "var(--safe-top)",
        }}
      >
        <img
          src={currentItem.background || currentItem.poster}
          alt={currentItem.name}
          className={`object-cover transition-opacity duration-500 h-[80vh] ${
            isTransitioning ? "opacity-50" : "opacity-100"
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center px-4 md:px-12 lg:px-16">
        <div className="max-w-2xl space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
              {currentItem.name}
            </h1>
            <div className="flex items-center gap-4 text-sm md:text-base">
              {currentItem.imdbRating && (
                <div className="flex items-center gap-1 text-green-400 font-semibold">
                  <Star className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                  <span>{currentItem.imdbRating} Match</span>
                </div>
              )}
              {currentItem.year && (
                <span className="text-muted-foreground">
                  {currentItem.year}
                </span>
              )}
              {currentItem.runtime && (
                <span className="text-muted-foreground">
                  {currentItem.runtime}
                </span>
              )}
              {currentItem.genre?.slice(0, 2).map((g) => (
                <Badge
                  key={g}
                  variant="secondary"
                  className="bg-white/20 dark:bg-white/20 text-foreground border-white/10 dark:border-white/10"
                >
                  {g}
                </Badge>
              ))}
            </div>
          </div>

          <p className="text-base md:text-lg text-muted-foreground line-clamp-3 md:line-clamp-4">
            {currentItem.description}
          </p>

          <div className="flex gap-3 pt-4">
            <Link to={`/${currentItem?.type}/${currentItem?.id}`}>
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/80 px-8 py-6 text-lg font-semibold rounded-md"
              >
                <Play className="mr-2 w-5 h-5 fill-current" />
                Play
              </Button>
            </Link>
            <Button
              size="lg"
              variant="secondary"
              className="bg-white/10 dark:bg-white/10 text-foreground hover:bg-white/20 dark:hover:bg-white/20 px-8 py-6 text-lg font-semibold rounded-md backdrop-blur-sm border border-white/20 dark:border-white/20"
            >
              <Info className="mr-2 w-5 h-5" />
              More Info
            </Button>
          </div>
        </div>
      </div>

      {/* Dots Indicator */}
      {/* {allItems.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {allItems.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-foreground w-8"
                  : "bg-foreground/50 hover:bg-foreground/70"
              }`}
            />
          ))}
        </div>
      )} */}
    </div>
  );
}

export default function Home() {
  const { history } = useWatchHistoryStore();
  // const { addToWatchlist, removeFromWatchlist, isInWatchlist } =
  //   useWatchlistStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const historyItems = Object.values(history)
    .sort((a, b) => b.lastWatchedAt - a.lastWatchedAt)
    .slice(0, 8);

  const handlePlay = (item: Meta) => {
    setLoadingId(item.id);
    navigate(`/watch/${item.type}/${item.id}`);
  };

  // const handleToggleWatchlist = (item: Meta, e: React.MouseEvent) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   if (isInWatchlist(item.id)) {
  //     removeFromWatchlist(item.id);
  //   } else {
  //     addToWatchlist(item);
  //   }
  // };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Banner */}
      <HeroBanner />

      {/* Content Rows */}
      <div className="relative z-10 -mt-32 pb-20 px-4 md:px-12 lg:px-16 space-y-12">
        {/* Continue Watching */}
        {historyItems.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">
              Continue Watching
            </h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth py-4 px-1">
              {historyItems.map((item) => {
                const progressPercentage = Math.min(
                  (item.timestamp /
                    (item.duration || (item.type === "movie" ? 7200 : 1500))) *
                    100,
                  100
                );

                const href =
                  item.type === "movie"
                    ? `/movie/${item.metaId}`
                    : `/series/${item.metaId}?season=${item.season}&episode=${item.episode}`;

                return (
                  <Link
                    key={item.id}
                    to={href}
                    className="flex-shrink-0 w-[200px] md:w-[250px] group/card"
                  >
                    <div className="relative aspect-video rounded-md overflow-hidden bg-card/30">
                      {item.poster ? (
                        <img
                          src={item.poster}
                          alt={item.title}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-card/30 flex items-center justify-center">
                          <Play className="w-12 h-12 opacity-20" />
                        </div>
                      )}
                      {/* Progress Bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50 dark:bg-black/50">
                        <div
                          className="h-full bg-red-600 dark:bg-red-600"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 dark:bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          size="icon"
                          className="rounded-full bg-primary text-primary-foreground hover:bg-primary/80"
                          onClick={() => {
                            setLoadingId(item.id);
                            navigate(href);
                          }}
                          disabled={loadingId === item.id}
                        >
                          {loadingId === item.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Play className="w-5 h-5 fill-current" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1">
                      <h3 className="font-semibold text-sm truncate text-foreground">
                        {item.title}
                      </h3>
                      {item.type === "series" && (
                        <p className="text-xs text-muted-foreground">
                          S{item.season} E{item.episode}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Content Rows */}
        <ContentRow title="Trending Movies" type="movie" onPlay={handlePlay} />
        <ContentRow
          title="Popular TV Shows"
          type="series"
          onPlay={handlePlay}
        />
        <ContentRow
          title="New Releases"
          type="movie"
          limit={8}
          onPlay={handlePlay}
        />
        <ContentRow
          title="Top Rated Series"
          type="series"
          limit={8}
          onPlay={handlePlay}
        />
      </div>
    </div>
  );
}
