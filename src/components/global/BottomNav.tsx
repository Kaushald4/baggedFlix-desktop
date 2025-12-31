import { Link, useLocation } from "react-router";
import { Home, Tv, List, Download } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const location = useLocation();
  const pathname = location.pathname;

  const links = [
    { href: "/movies", label: "Movies", icon: Home },
    { href: "/series", label: "TV Shows", icon: Tv },
    { href: "/watchlist", label: "Watchlist", icon: List },
    { href: "/downloads", label: "Downloads", icon: Download },
  ];

  return (
    <div className="fixed bottom-bar bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-white/10 dark:border-white/10 md:hidden">
      <div className="flex justify-around items-center h-16">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive =
            pathname === link.href ||
            (link.href === "/movies" && pathname === "/");

          return (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-300",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "neon-text")} />
              <span className="text-xs font-medium">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
