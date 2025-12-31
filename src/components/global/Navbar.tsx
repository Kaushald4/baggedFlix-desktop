import { Link, useLocation } from "react-router";
import { Tv, List, Film, Download, Clock, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/providers/ThemeProvider";

export function Navbar() {
  const location = useLocation();
  const pathname = location.pathname;
  const { theme, setTheme } = useTheme();

  const links = [
    { href: "/movies", label: "Movies", icon: Film },
    { href: "/series", label: "TV Shows", icon: Tv },
    { href: "/watchlist", label: "Watchlist", icon: List },
    { href: "/downloads", label: "My Downloads", icon: Download },
    { href: "/history", label: "History", icon: Clock },
  ];

  return (
    <nav
      style={{
        paddingTop: "var(--safe-top)",
        paddingBottom: "var(--safe-bottom)",
        paddingLeft: "var(--safe-left)",
        paddingRight: "var(--safe-right)",
        // minHeight: "100vh",
        boxSizing: "border-box",
      }}
      className="fixed top-0 left-0 right-0 z-50 block"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 md:h-20 items-center justify-between">
          {/* Logo */}
          <div className="shrink-0">
            <Link
              to="/"
              className="text-2xl font-black tracking-tighter neon-text bg-clip-text text-transparent bg-linear-to-r from-primary to-primary/50"
            >
              BaggedFlix
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2",
                      isActive
                        ? "bg-primary/20 text-primary shadow-[0_0_15px_rgba(var(--primary),0.5)] border border-primary/50"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Theme Toggle & Mobile History */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
            <div className="md:hidden">
              <Link to="/history">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "rounded-full",
                    pathname === "/history"
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground"
                  )}
                >
                  <Clock className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Glass Background Gradient */}
      <div className="absolute inset-0 -z-10 bg-background/80 backdrop-blur-xl border-b border-border" />
    </nav>
  );
}
