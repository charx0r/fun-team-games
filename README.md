# 🌍 Squint Games

**Squint Games** is a real-time multiplayer geography puzzle game built for in-person engineering team meetings. Everyone opens the game on their own laptop, one person creates a room, others join with a 4-character code. Teams are auto-assigned and you play 4 rounds × 4 puzzle types × 30 seconds per question — 16 questions in about 8–10 minutes.

Every player sees the same screen: the puzzle, the timer, the answer options, and the team scoreboard. No projector. No phones. Just laptops.

## Quick start

```bash
# Install everything (root + server + client)
npm run install-all

# Dev mode (Vite + server with HMR)
npm run dev

# OR production mode — builds client then starts server on port 3000
npm start
```

Open **http://localhost:3000** in Chrome. For teammates on the same WiFi, share `http://<your-local-ip>:3000`.

## How to play

1. **Host**: open the URL, click **Create Room**, pick a name. A 4-character code appears (e.g. `GQ7X`).
2. **Team members**: open the same URL, click **Join Room**, enter the code + your name.
3. When 4+ players have joined, the admin clicks **Start Game**.
4. Teams are auto-assigned (2 teams at 4–8 players, 3 at 9–12, 4 at 13+).
5. Play 4 rounds:
   - **Scrambled Satellite** — a landmark chopped into a 4×4 grid; hints snap tiles into place every 10s.
   - **Zoom & Enhance** — starts zoomed way in, zooms out over 30s.
   - **Map Jigsaw** — a country outline drifts together from scattered pieces.
   - **What's Wrong?** — a landmark with a deliberate subtle error; hint pulses at 20s.
6. Each question: 30s to pick A/B/C/D. Faster correct answers score more (100 base + up to 50 speed bonus).
7. Between rounds: team leaderboard. At the end: podium + MVP + confetti.

## Network setup

All players must be on the same WiFi. Find your LAN IP:

- **macOS / Linux**: `ifconfig` or `ip addr` — look for something like `192.168.x.x`
- **Windows**: `ipconfig` — look for the IPv4 address

Share `http://<that-ip>:3000`. If your firewall blocks the connection, allow inbound TCP on port 3000 for Node.

## Customizing questions

All questions live in `server/questions/`:

| File | Round |
|------|-------|
| `scrambledSatellite.js` | Round 1 |
| `zoomEnhance.js`        | Round 2 |
| `mapJigsaw.js`          | Round 3 |
| `whatsWrong.js`         | Round 4 |

Each file exports an array of question objects. The format is documented inline in each file. To swap art, drop new SVGs into `client/public/assets/landmarks/` and update the `image` field. For jigsaw questions, pieces are inline SVG path strings — you can hand-author them or trace with any vector editor.

The server NEVER sends `correctAnswer` until after the timer expires, so answers can't be peeked via devtools.

## Deploy to Azure Container Apps

A single always-on container works perfectly (WebSockets supported, in-memory rooms stay put).

```bash
# one-time: az login && az account set --subscription <your-sub-id>
./deploy-azure.sh
```

The script runs `az containerapp up` from the included `Dockerfile`, then pins the app to `minReplicas=1, maxReplicas=1` so there's exactly one replica running 24/7. Override defaults with env vars:

```bash
RESOURCE_GROUP=my-rg LOCATION=westeurope APP_NAME=squint-games ./deploy-azure.sh
```

At the end it prints the public HTTPS URL — share that link directly with your team (no VPN / same-WiFi needed).

### Notes

- **Don't scale beyond 1 replica** without adding the Socket.IO Redis adapter — rooms live in-memory on a single container.
- **Consumption plan** works; billing is roughly CPU/memory × uptime. One small replica pinned on is a few dollars/month.
- WebSockets work out of the box on ACA's HTTP ingress — no extra config needed.

## Tech stack

- **Server**: Node.js + Express + Socket.IO (in-memory state, no DB)
- **Client**: React + Vite, plain CSS, Web Audio for sounds, canvas confetti
- **Assets**: All 16 SVG illustrations are bundled — no external APIs

## Project layout

```
fun-team-games/
├── server/           Express + Socket.IO + gameEngine + question data
├── client/           Vite React app (single page, phase-driven)
│   ├── src/pages/    Home, Lobby, TeamReveal, RoundIntro, Game, Leaderboard, FinalResults
│   ├── src/components/  Timer, AnswerButtons, ScrambledGrid, ZoomReveal, JigsawPuzzle, SpotDifference, Podium, Confetti…
│   └── public/assets/landmarks/  16 SVG illustrations
└── package.json      Root scripts: dev / build / start
```

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run install-all` | Install root + server + client dependencies |
| `npm run dev`         | Concurrently run Vite dev server (5173) + backend (3000) |
| `npm run build`       | Build the client to `client/dist/` |
| `npm start`           | Install, build, and start the prod server on port 3000 |

Have fun. 🌍
