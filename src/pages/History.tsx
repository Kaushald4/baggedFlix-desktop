import { useWatchHistoryStore } from "@/store/useWatchHistoryStore";
import { Button } from "@/components/ui/button";
import { Play, Trash2, Clock, Download, Upload, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router";

export default function HistoryPage() {
  const { history, removeFromHistory, importHistory } = useWatchHistoryStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const historyItems = Object.values(history).sort(
    (a, b) => b.lastWatchedAt - a.lastWatchedAt
  );

  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(history, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `baggedFlix_history_${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("History exported successfully");
    } catch (error) {
      console.error("Export failed", error);
      toast.error("Failed to export history");
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        importHistory(parsed);
        toast.success("History imported successfully");
      } catch (error) {
        console.error("Import failed", error);
        toast.error("Failed to import history. Invalid file format.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 pt-20 px-4 md:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/20">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground neon-text">
                Watch History
              </h1>
              <p className="text-muted-foreground">
                Continue where you left off
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".json"
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="border-white/20 dark:border-white/20 hover:bg-white/10 dark:hover:bg-white/10"
            >
              <Upload className="w-4 h-4 mr-2" /> Import
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              className="border-white/20 dark:border-white/20 hover:bg-white/10 dark:hover:bg-white/10"
            >
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>
        </div>

        {/* Content */}
        {historyItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-card/30 dark:bg-card/30 flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No watch history yet
            </h2>
            <p className="text-muted-foreground max-w-md">
              Start watching movies and shows to build your history.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
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
                <Link key={item.id} to={href} className="group/card">
                  <div className="relative aspect-video rounded-md overflow-hidden bg-card/30 dark:bg-card/30">
                    {item.poster ? (
                      <img
                        src={item.poster}
                        alt={item.title}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-card/30 dark:bg-card/30 flex items-center justify-center">
                        <Play className="w-8 h-8 opacity-20" />
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
                    <div className="absolute inset-0 bg-black/40 dark:bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="icon"
                        className="rounded-full bg-primary text-primary-foreground hover:bg-primary/80"
                        onClick={(e) => {
                          e.preventDefault();
                          setLoadingId(item.id);
                          navigate(href);
                        }}
                        disabled={loadingId === item.id}
                      >
                        {loadingId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4 fill-current" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="rounded-full"
                        onClick={(e) => {
                          e.preventDefault();
                          removeFromHistory(item.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <h3 className="font-medium text-sm truncate text-foreground">
                      {item.title}
                    </h3>
                    {item.type === "series" && (
                      <p className="text-xs text-muted-foreground">
                        S{item.season} E{item.episode}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(item.lastWatchedAt).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
