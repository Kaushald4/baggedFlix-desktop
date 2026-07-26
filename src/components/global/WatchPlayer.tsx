"use client";

import Player from "@/components/global/Player";
import { useWatchHistoryStore } from "@/store/useWatchHistoryStore";
import { useCallback, useEffect, useState } from "react";
import { Video } from "@/lib/api";
import { fetchSubtitles } from "@/lib/subtitleApi";

interface WatchPlayerProps {
  id: string;
  file: string;
  isDirectFile?: boolean;
  contentId: string;
  meta: {
    metaId: string;
    type: string;
    title: string;
    poster: string;
    background?: string;
    season?: number;
    episode?: number;
    imdbId?: string;
  };
  videos?: Video[];
}

export function WatchPlayer({
  id,
  file,
  isDirectFile = false,
  contentId,
  meta,
  videos = [],
}: WatchPlayerProps) {
  const updateProgress = useWatchHistoryStore((state) => state.updateProgress);
  const getProgress = useWatchHistoryStore((state) => state.getProgress);
  const startTime = getProgress(contentId);
  const [subtitleUrl, setSubtitleUrl] = useState<string | null>(null);

  // Fetch subtitles
  useEffect(() => {
    const loadSubtitles = async () => {
      if (!meta.imdbId) return;
      try {
        const result = await fetchSubtitles(
          meta.imdbId.replace("tt", ""),
          meta.type as "movie" | "series",
          meta.season,
          meta.episode
        );

        if (result.subtitleUrl) {
          setSubtitleUrl(result.subtitleUrl);
        }
      } catch (error) {
        console.error("Error fetching subtitles:", error);
      }
    };

    loadSubtitles();
  }, [meta.imdbId, meta.type, meta.season, meta.episode]);

  const handleTimeUpdate = useCallback(
    (time: number) => {
      updateProgress(contentId, time, meta);
    },
    [contentId, updateProgress, meta]
  );

  const playerTitle =
    meta.type === "series" && meta.season && meta.episode
      ? `${meta.title} - S${meta.season} E${meta.episode}`
      : meta.title;

  return (
    <Player
      id={id}
      file={file}
      isDirectFile={isDirectFile}
      onTimeUpdate={handleTimeUpdate}
      startTime={startTime}
      title={playerTitle}
      subtitle={subtitleUrl}
      videos={meta.type === "series" ? videos : undefined}
      currentSeason={meta.season}
      currentEpisode={meta.episode}
      metaId={meta.metaId}
    />
  );
}
