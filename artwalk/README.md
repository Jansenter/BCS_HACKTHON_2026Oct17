# 🎨 ArtWalk — Your Personal City Art Storyteller

Turn an ordinary walk into a cultural adventure. Hackathon MVP for **Downtown Vancouver**, built on the City of Vancouver Public Art Registry open data.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build → dist/
npm run preview    # serve the build
```

Node 20+ recommended. No API keys needed.

## What's in the MVP

| Feature | Where |
|---|---|
| **Interactive art map** — all 138 in-place Downtown artworks, category filters, search, "near me" | `src/components/ExploreView.tsx`, `ArtMap.tsx` |
| **Two themed walking tours** — *Waterfront Wonders* (8 stops, ~60 min) and *Heritage Heart* (9 stops, ~50 min) | `src/data/tours.ts`, `TourView.tsx` |
| **Artwork stories** — description + project statement, artist credit, location hints, source link | `StoryPanel.tsx` |
| **Audio narration** — Web Speech API, play/pause/speed, sentence-level highlighting, tap any sentence to jump | `src/lib/speech.ts` |
| **Tour progress** — mark visited, progress bar, completion screen with share, saved in LocalStorage | `src/lib/storage.ts`, `Completion.tsx` |
| **Stretch: Discovery challenges** — observation prompt per stop + a fact-based question generated from the registry record | `Challenge.tsx`, `src/lib/challenge.ts` |
| Walking directions per stop (OpenStreetMap), live location, "You're here" detection (< 60 m) | `src/lib/route.ts`, `geo.ts` |

Deep links work: `#/tour/waterfront?art=24` opens a tour straight at a story.

## Data pipeline

```
data/public-art.json  ──npm run data──▶  src/data/artworks.json   (138 Downtown works, cleaned)
```

`scripts/build-data.mjs` filters to `geo_local_area = Downtown`, `status = In place`, with coordinates; decodes HTML entities; and resolves artist IDs to names. Change `NEIGHBOURHOOD` in that script to target another area (e.g. `Mount Pleasant`, `Strathcona`).

### Honesty notes (the export has gaps)

- **No photos.** The export's `photourl` is empty for every record, so each artwork gets a deterministic generative cover (`ArtCover.tsx`) and a prominent **"See photos on City registry ↗"** link.
- **Artists are IDs only.** Names in `ARTIST_NAMES` were taken only from text inside the registry records themselves (each line cites the record). Three tour stops carry a `curatedArtist` credit, shown in the UI with a "curator credit" tag. Everything else honestly says "Artist not named in open data". To fill this in properly, merge the companion **public-art-artists** dataset from opendata.vancouver.ca in `build-data.mjs`.
- **Trivia never invents facts** — questions are generated from the record's material or installation year, and the answer cites the source field.

## Walking routes

By default the tour path is a dashed straight line between stops, with distances estimated (× 1.3 street-grid factor) and a link to OSM walking directions for each stop. For real street routing, copy `.env.example` to `.env` and add a free [openrouteservice](https://openrouteservice.org) key:

```
VITE_ORS_API_KEY=your_key
```

The route is fetched once and cached in LocalStorage, so the demo still works offline afterwards.

## Deploy

Static site — no server needed.

- **Vercel:** import the repo → framework "Vite" → deploy.
- **Netlify:** build command `npm run build`, publish directory `dist`.

Hash routing means no rewrite rules are needed.

## Demo script (3 minutes)

1. Home → **Start "Waterfront Wonders"** — the whole route appears on the map.
2. Tap **Start here: Angel of Victory** → hit **Listen**; the transcript highlights as it reads.
3. Do the **Look closer** challenge, tap **Mark as visited**, then **Next stop →**.
4. Back on the list, tick the rest → completion screen with stats and **Share**.
5. **Wander freely** → filter *Totem poles*, search "Marega", tap a dot.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · React Leaflet (OpenStreetMap / CARTO tiles) · Web Speech API · LocalStorage.

## Attribution

Contains information licensed under the Open Government Licence – Vancouver. Map data © OpenStreetMap contributors, tiles © CARTO.
