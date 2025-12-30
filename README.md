# MyyFlix Desktop

![alt text](./screenshot/myyflix.png "MyyFlix")

A modern cross-platform desktop application for streaming movies and TV series, built with Tauri v2 and React. This project provides a user-friendly interface to browse, watch, and manage your favorite content with features like watchlists, watch history, and seamless streaming.

## Disclaimer

**Important Legal Notice**: This application does not host any video content. It acts as a client-side scraper and proxy for publicly available streaming sources. All content is sourced from third-party websites. Users are responsible for ensuring compliance with local laws and copyright regulations when using this application.

**Educational Purpose**: This project was developed from a security engineering perspective, involving reverse engineering of various streaming websites to identify and extract actual stream links. It serves as a learning tool to understand web scraping, API interactions, video streaming protocols (like HLS), and security concepts in modern desktop applications. This is intended solely for educational and research purposes to demonstrate technical capabilities, not for commercial use or content distribution.

## Features

- **Cross-Platform**: Runs natively on macOS, Windows, and Linux using Tauri
- **Browse Content**: Discover movies and TV series with a clean catalog interface
- **Search**: Find movies and series using IMDb IDs or other search criteria
- **Streaming Player**: Integrated video player for seamless content playback
- **Watchlist**: Save movies and series for later viewing
- **Watch History**: Track your viewing progress and history
- **Responsive Design**: Optimized for various desktop window sizes
- **Native Performance**: Rust-based backend for efficient networking and scraping
- **Proxy Streaming**: Built-in local proxy to handle HLS streams and bypass CORS restrictions

## Tech Stack

- **Core**: Tauri v2 (Rust + Webview)
- **Frontend Framework**: React + Vite
- **Language**: TypeScript (Frontend) / Rust (Backend)
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **UI Components**: Radix UI primitives via shadcn/ui
- **Networking**: Axios (Frontend) / Reqwest + Axum (Backend)
- **Scraping**: Scraper (Rust)
- **Icons**: Lucide React

## Prerequisites

- Node.js 18 or later
- Rust (latest stable)
- npm, yarn, pnpm, or bun
- System dependencies for Tauri (see [Tauri Prerequisites](https://tauri.app/start/prerequisites/))

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd myyflix
   ```

2. Install frontend dependencies:

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. Install Rust dependencies (handled automatically on first run, but you can pre-fetch):

   ```bash
   cd src-tauri
   cargo fetch
   cd ..
   ```

## Development

Run the development server (starts both Vite and the Tauri app):

```bash
npm run tauri dev
# or
yarn tauri dev
# or
pnpm tauri dev
# or
bun tauri dev
```

This will launch the desktop application window.

## Build

Build the application for production (creates an installer/executable for your OS):

```bash
npm run tauri build
```

The output binaries will be located in `src-tauri/target/release/bundle/`.

## Project Structure

```
myyflix/
├── src/                    # Frontend (React) source
│   ├── components/         # React components (UI, Global, etc.)
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries (API, utils)
│   ├── pages/              # Application pages (Home, Watch, Details)
│   ├── store/              # Zustand stores
│   ├── App.tsx             # Main React component
│   └── main.tsx            # Entry point
├── src-tauri/              # Backend (Rust) source
│   ├── src/
│   │   ├── app/            # Server setup
│   │   ├── models/         # Data models
│   │   ├── routes/         # Axum API routes (stream, extract)
│   │   ├── services/       # Business logic (scraping)
│   │   ├── stream/         # Stream proxying logic
│   │   └── main.rs         # Rust entry point
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
└── package.json            # Node.js dependencies and scripts
```

## Backend Architecture

The Tauri backend (Rust) handles:

- **Stream Extraction**: Scrapes video sources to find playable HLS links (`src-tauri/src/services/extract_service.rs`)
- **Local Proxy Server**: An embedded Axum server running on `localhost:4000` to proxy video streams and handle headers/CORS (`src-tauri/src/routes/stream.rs`)
- **Tauri Commands**: Exposes Rust functions to the frontend via `invoke` (e.g., `get_stream_link`)

## Key Components

- **Player**: Main video player component
- **WatchPlayer**: Specialized player for watch pages
- **CatalogPage**: Reusable catalog for movies/series
- **MovieCard**: Card component for content display

## State Management

The application uses Zustand for state management with the following stores:

- `useWatchHistoryStore`: Watch history management
- `useWatchlistStore`: Watchlist functionality

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## Acknowledgments

- Built with [Tauri](https://tauri.app)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
