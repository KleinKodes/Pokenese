# Pokenese — Deployment & Testing Guide

## Table of Contents

1. [Local Development Setup](#1-local-development-setup)
2. [Running the Full Stack with Docker](#2-running-the-full-stack-with-docker)
3. [Pokemon Data: Scraping & Seeding](#3-pokemon-data-scraping--seeding)
4. [Audio (TTS) Setup](#4-audio-tts-setup)
5. [Production Deployment](#5-production-deployment)
6. [Testing](#6-testing)
7. [Environment Variables Reference](#7-environment-variables-reference)

---

## 1. Local Development Setup

### Prerequisites

- Node.js 20+ and npm 10+
- Python 3.12+
- PostgreSQL 16+ (or use Docker — recommended)

### 1a. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env and set at minimum:
#   DATABASE_URL=postgresql+asyncpg://pokenese:pokenese@localhost:5432/pokenese
#   SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_hex(32))">
#   SEED_SALT=<any random string — keep consistent>

# Start PostgreSQL (if not using Docker)
# Then create the database:
createdb -U pokenese pokenese   # adjust user/host as needed

# Run database migrations
python scripts/migrate.py

# Seed the daily challenges (1 year of dates)
python scripts/seed_daily.py

# Start the backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at: http://localhost:8000/docs

### 1b. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy and configure environment
cp .env.local.example .env.local
# Edit .env.local:
#   NEXT_PUBLIC_API_URL=http://localhost:8000
#   NEXT_PUBLIC_APP_URL=http://localhost:3000

# Start the development server
npm run dev
```

Frontend available at: http://localhost:3000

---

## 2. Running the Full Stack with Docker

This is the simplest way to get everything running:

```bash
cd backend

# Build and start postgres + backend
docker compose up --build

# In another terminal, run migrations + seed:
docker compose exec backend python scripts/migrate.py
docker compose exec backend python scripts/seed_daily.py
```

Then start the frontend separately:

```bash
cd frontend
npm install
npm run dev
```

Or build the frontend for production:

```bash
npm run build && npm start
```

### Docker services
| Service | Port | Notes |
|---------|------|-------|
| PostgreSQL | 5432 | User: pokenese, DB: pokenese |
| Backend API | 8000 | API docs at /docs |
| Frontend (manual) | 3000 | Run `npm run dev` or `npm start` |

---

## 3. Pokemon Data: Scraping & Seeding

The game includes sample data for 20 Pokémon (#1–#20) to work out of the box. To get all 1025 Pokémon, run the scraping script:

### Scrape all Pokémon (required for full gameplay)

```bash
cd backend
source venv/bin/activate

# This takes ~10–20 minutes due to rate limiting (PokéAPI + Bulbapedia)
python scripts/scrape_pokemon.py

# Output files:
#   backend/data/pokemon.json          (backend scoring data)
#   frontend/src/data/pokemon.ts       (frontend TypeScript constants)
```

The scraper:
- Fetches English names, types, generation, category, evolution chains, and sprites from **PokéAPI** (pokeapi.co)
- Fetches Traditional Chinese names from **Bulbapedia**
- Generates Simplified Chinese, Pinyin, and IPA using the `pypinyin` library
- Is **resumable** — uses a local `.scraper_cache/` directory; interrupted runs can be restarted
- Rate-limits to 100ms between requests to avoid bans

After scraping, re-run the seed script to ensure all 1025 Pokémon are used in daily scheduling:

```bash
python scripts/seed_daily.py
```

### Convert existing `pokemon.ts` to backend JSON (if needed)

```bash
python scripts/generate_pokemon_json.py
# Reads frontend/src/data/pokemon.ts → writes backend/data/pokemon.json
```

---

## 4. Audio (TTS) Setup

Pokenese uses a **layered audio approach** to speak Chinese Pokémon names:

### Layer 1: Pre-recorded audio files (optional)
Place `.mp3` files in `frontend/public/audio/` named by National Dex number (e.g. `006.mp3`). If a Pokémon's `audio_filename` field is set and the file exists, it will be played.

### Layer 2: Web Speech API (default, free, no setup needed)
For all Pokémon where `audio_filename` is `null`, the game automatically uses the browser's built-in **Web Speech API** (`SpeechSynthesis`) to speak the Simplified Chinese name (`name_zh_simplified`) using `lang: 'zh-CN'`. This requires:

- A modern browser (Chrome, Firefox, Safari, Edge all support it)
- A Chinese (Mandarin) TTS voice installed on the user's OS:
  - **macOS**: Built-in — "Ting-Ting" or "Meijia" (Mandarin voices are pre-installed)
  - **Windows**: Settings → Time & Language → Speech → Add voices → "Chinese (Simplified, China)"
  - **Android/iOS**: Usually pre-installed with system language packs
  - **Linux**: Install `espeak-ng` with Chinese support

The `useAudio` hook (`frontend/src/hooks/useAudio.ts`) handles voice selection automatically. It prefers `zh-CN` voices and falls back to any `zh-*` voice if needed.

### Voices loading delay (Chrome)
Chrome loads voices asynchronously. The hook listens for the `voiceschanged` event and retries voice selection. No action required.

---

## 5. Production Deployment

### Recommended: Vercel (frontend) + Railway (backend + DB)

#### Frontend on Vercel

1. Connect your GitHub repo to Vercel
2. Set the **root directory** to `frontend`
3. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```
4. Deploy — Vercel auto-detects Next.js

#### Backend + Database on Railway

1. Create a new Railway project
2. Add a **PostgreSQL** service
3. Add a **new service** from your GitHub repo, root path: `backend`
4. Set environment variables:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}  (Railway auto-wires this)
   SECRET_KEY=<generate: python -c "import secrets; print(secrets.token_hex(32))">
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   REFRESH_TOKEN_EXPIRE_DAYS=30
   CORS_ORIGINS=https://your-app.vercel.app
   ENVIRONMENT=production
   SEED_SALT=<random string, keep stable>
   ```
5. Set the **start command** to:
   ```
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
6. After first deploy, run migrations and seed via Railway CLI or the Railway shell:
   ```bash
   python scripts/migrate.py
   python scripts/seed_daily.py
   ```

#### Alternative: Render.com

Both frontend and backend can be hosted on Render with similar configuration. Use their **Static Site** tier for the Next.js export, or **Web Service** for full SSR.

### Production Checklist

- [ ] Set `SECRET_KEY` to a cryptographically random 32-byte hex string
- [ ] Set `SEED_SALT` to a stable random string (changing it invalidates the daily schedule)
- [ ] Set `ENVIRONMENT=production` (disables /docs and /redoc)
- [ ] Set `CORS_ORIGINS` to exactly your frontend URL (no trailing slash)
- [ ] Run `python scripts/scrape_pokemon.py` to get all 1025 Pokémon
- [ ] Run `python scripts/seed_daily.py` to seed at least 1 year of daily challenges
- [ ] Configure HTTPS on both services (Vercel and Railway provide this automatically)

---

## 6. Testing

### Backend — Manual API Testing

With the backend running (`uvicorn app.main:app --reload`):

```bash
# Health check
curl http://localhost:8000/health

# Register a user
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"trainer1","password":"testpass123"}'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'

# Get today's daily challenges (anonymous)
curl http://localhost:8000/api/v1/daily/today

# Get today's daily challenges (authenticated — copy access_token from login response)
curl http://localhost:8000/api/v1/daily/today \
  -H "Authorization: Bearer <access_token>"

# Submit a daily guess
curl -X POST http://localhost:8000/api/v1/daily/guess \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-05-25","challenge_num":1,"guess":"Bulbasaur"}'

# Get challenge state
curl http://localhost:8000/api/v1/challenge/state \
  -H "Authorization: Bearer <access_token>"

# Get next challenge pokemon
curl http://localhost:8000/api/v1/challenge/next \
  -H "Authorization: Bearer <access_token>"

# View interactive API docs
open http://localhost:8000/docs
```

### Backend — Automated Tests

```bash
cd backend
source venv/bin/activate
pip install pytest pytest-asyncio httpx

# Run tests (test files should be placed in backend/tests/)
pytest

# Run with coverage
pip install pytest-cov
pytest --cov=app --cov-report=html
```

### Frontend — Manual Testing

```bash
cd frontend
npm run dev

# Open http://localhost:3000 in a browser
```

**Golden path testing checklist:**

1. **Home screen**: Mode cards appear, clicking each navigates correctly
2. **Daily mode**:
   - Chinese name displays with pinyin
   - Audio button plays TTS (check browser console if no sound — voice may need to load)
   - Guess input: type partial name, autocomplete dropdown appears with sprites
   - Wrong guess: shows in history, hint card animates in
   - Correct guess: confetti, score count-up, "Next" button
   - All 3 challenges: final results screen with share button
3. **Challenge mode**:
   - Progress shows "Pokémon N / 20" (or 1025 if full data scraped)
   - Run reset dialog appears on 0-score failure
4. **Glossary**: Shows discovered Pokémon; undiscovered as silhouettes
5. **Settings drawer**: All toggles work; theme switch applies immediately
6. **Auth**: Register, login, logout flow
7. **Mobile**: At <768px, bottom nav appears, cards stack vertically

### Frontend — Build Verification

```bash
cd frontend
npm run build   # Should complete with zero TypeScript errors
npm run lint    # Should pass ESLint checks
```

### Scoring Logic Verification

The scoring rules are:

| Scenario | Score |
|----------|-------|
| Correct on guess 1 (0 hints) | 3000 |
| Correct on guess 2 (1 hint) | 2400 |
| Correct on guess 3 (2 hints) | 1800 |
| Correct on guess 4 (3 hints) | 1200 |
| Correct on guess 5 (4 hints) | 600 |
| Wrong × 5, same evolution line | 300 |
| Wrong × 5, full type match | 200 |
| Wrong × 5, partial type match | 100 |
| Wrong × 5, shared Chinese character | 50 |
| Wrong × 5, no proximity | 0 (challenge mode: run resets) |

---

## 7. Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL asyncpg connection string |
| `SECRET_KEY` | Yes | — | 32-byte hex string for JWT signing |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | 60 | JWT access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | 30 | JWT refresh token lifetime |
| `CORS_ORIGINS` | No | http://localhost:3000 | Comma-separated allowed frontend origins |
| `ENVIRONMENT` | No | development | Set to `production` to disable API docs |
| `SEED_SALT` | No | (default) | Salt for daily challenge seeding — keep stable |

### Frontend (`frontend/.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | http://localhost:8000 | Backend API base URL |
| `NEXT_PUBLIC_APP_URL` | Yes | http://localhost:3000 | Frontend app URL (for share links) |

---

## Troubleshooting

**"No voices available" for TTS audio**
The Web Speech API requires a Mandarin voice to be installed. On macOS it's built-in. On other systems, install a Chinese TTS voice package. The speaker button will still show but produce no audio if no voice is found.

**Daily challenges return 404**
The `daily_challenges` table must be seeded before playing. Run `python scripts/seed_daily.py` from the backend directory.

**Scoring returns wrong results for all-5-failure cases**
The backend needs `data/pokemon.json` to evaluate proximity. After scraping, regenerate it with `python scripts/generate_pokemon_json.py`. The sample JSON covers only the first 20 Pokémon.

**CORS errors in browser**
Set `CORS_ORIGINS` in the backend `.env` to exactly match the frontend URL (including protocol, no trailing slash). Example: `CORS_ORIGINS=https://pokenese.vercel.app`.

**Build fails on `Noto_Sans_SC`**
The `latin` subset is used for the font definition in Next.js (the actual Chinese characters are loaded via font display ranges). The Chinese characters render correctly via CSS `font-family` fallback to the browser's Noto Sans SC installation.
