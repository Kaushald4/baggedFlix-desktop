export function Footer() {
  return (
    <footer className="w-full py-6 px-4 mt-8 border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto text-center text-sm text-muted-foreground">
        <p className="mb-2">
          BaggedFlix does not host any files on its servers. All content is
          provided by non-affiliated third parties.
        </p>
        <p className="text-xs opacity-70">
          We strictly scrape publicly available content links and display them
          here for your convenience.
        </p>
      </div>
    </footer>
  );
}
