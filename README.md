# ANICADE Voice Assistant

ANICADE is a browser-based, voice-first command center for conversation, camera preview, maps, search, news, schematics, music, local memory, and generated visual concepts. It runs as a static PWA served locally on port **8000** (default).

## Download from GitHub and run locally

These steps work for a **ZIP download** (Code → Download ZIP) or a `git clone`. No build step is required.

### 1. Prerequisites

| Requirement | Notes |
| --- | --- |
| **Node.js 18+** (recommended) | [https://nodejs.org](https://nodejs.org) — used by `local-server.js` |
| **Chrome or Edge** | Speech recognition, microphone, and media work best on `127.0.0.1` or HTTPS |
| **PowerShell** (Windows) | Built in on Windows 10/11; used by the setup and start scripts |

On macOS/Linux you can use `npm start` after setup instead of the `.bat` / `.ps1` launchers.

### 2. Unzip and open the folder

Extract the ZIP, then open the project folder in File Explorer or your terminal.

### 3. First-time setup (creates `config.js`)

**Windows (recommended):**

```powershell
cd "C:\path\to\Read Screen And assist"
.\install.ps1
```

Or double-click `install.bat`.

Setup will:

- Check that Node.js is installed
- Copy `config.example.js` → `config.js` if `config.js` does not exist yet
- Optionally start the local server

**Any OS (Node only):**

```bash
cd /path/to/project
cp config.example.js config.js   # macOS/Linux
npm run setup                    # Windows: runs install.ps1
```

### 4. Add API keys (optional)

Edit `config.js` in a text editor. Fill only the providers you need. **Do not commit `config.js`** — it is listed in `.gitignore`.

If you skip keys, the UI still loads; voice, maps, and built-in commands work, while AI search, news, weather, and premium TTS need the matching keys.

Never paste real keys into GitHub issues, screenshots, or the public repo. Rotate any key that was exposed.

### 5. Start the app

**Windows:**

```powershell
.\start-anicade.ps1
```

Or double-click `start-anicade.bat`.

If `config.js` is missing, the start scripts print a warning and the app still runs using the `config.example.js` fallback (no real API keys). Run `install.ps1` or copy `config.example.js` to `config.js` to fix that.

**Any OS:**

```bash
npm start
```

The server prints a URL like:

```text
http://127.0.0.1:8000/index.html
```

If port 8000 is busy, `start-anicade.ps1` tries the next free port and opens that URL.

### 6. Browser permissions

On first load, allow the microphone when prompted. Some browsers block speech until you click once in the page. Say the wake word (default: **assistant**) or use the on-screen controls.

### Troubleshooting (local)

| Problem | What to do |
| --- | --- |
| `config.js` missing / 404 | Run `install.ps1` or copy `config.example.js` to `config.js` manually |
| Node not found | Install Node.js LTS, reopen the terminal, run setup again |
| Page blank or scripts fail | Use `http://127.0.0.1:8000/index.html`, not `file://` |
| Voice does not listen | Use Chrome/Edge, allow mic, click the page once, check wake word in `config.js` |

## Optional: deploy on GitHub Pages

The workflow `.github/workflows/pages.yml` builds a `config.js` from **repository secrets** on push to `main` / `master`. It does not use your local `config.js`.

1. Push the repo to GitHub.
2. **Settings → Pages → Build and deployment**: source **GitHub Actions**.
3. **Settings → Secrets and variables → Actions** — add only what you need, for example:

   `GEMINI_API_KEY`, `GROQ_API_KEY`, `SERPER_API_KEY`, `BRAVE_SEARCH_API_KEY`, `GNEWS_API_KEY`, `NEWSAPI_KEY`, `OPENWEATHER_API_KEY`, `WEATHERAPI_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `GOOGLE_CLIENT_ID`, `FACEBOOK_APP_ID`, `JSONBIN_ID`, `JSONBIN_KEY`, `JSONBIN_ACCESS_KEY`

4. Push to `main` (or run the workflow manually). Open the Pages URL from the Actions run.

Treat Pages secrets like production credentials; restrict repo access and rotate keys if leaked.

## Startup and voice

On load, the assistant plays a short startup cue, speaks a greeting, and starts continuous listening when the browser allows it. Status text stays minimal during normal use.

Startup MP3 (`The_Clash_-_Should_I_Stay_or_Should_I_Go__Official_Video_(256k).mp3`) is optional and not included in the repo. Voice and the rest of the UI work without it. Set `STARTUP_SONG_URL` in `config.js` for a direct audio URL, or add the file locally with that name.

Tuning in `config.js` (see `config.example.js`):

- `selfSpeechCooldownMs` — pause before the mic restarts after the assistant speaks (lower = snappier; default `1100`)
- `speechChunkMaxChars` — browser TTS chunk size (larger = fewer gaps; default `360`)
- `ELEVENLABS_*` — optional premium voice (uses turbo model from example when keys are set)

## Reliability

The assistant avoids interrupting normal answers with provider failure chatter. If a permission, network request, or embed fails, it keeps the conversation going and shows a small status or fallback panel.

| Say | Result |
| --- | --- |
| `open map` | Opens ATLAS (`maps.html`) |
| `switch to satellite view` | Satellite tiles |
| `show oil lines` | Pipeline overlay |
| `open schematics` | SCHEMA viewer |
| `open music` | ECHO music panel |
| `play music` | Plays track when the browser allows media |
| `search the web for AI news` | In-app browser/search |
| `latest technology news` | News feed in the output panel |
| `standby` | Standby; clap or wake phrase returns |
| `wake up` | Leaves standby |

## Modules

| Module | Purpose |
| --- | --- |
| `ATLAS` | Maps, routes, satellite/roads/night/oil/swamp/traffic overlays |
| `PULSE` | Live news summaries |
| `SCHEMA` | Schematics viewer |
| `ECHO` | Music panel and playlist controls |
| `VISION` | Camera preview with retry |
| `FORGE` | File/code oriented assistance |

## Configuration reference

Copy `config.example.js` to `config.js` for local use.

```text
GEMINI_API_KEY
GROQ_API_KEY
COHERE_API_KEY
SERPER_API_KEY
BRAVE_SEARCH_API_KEY
OPENWEATHER_API_KEY
WEATHERAPI_KEY
GNEWS_API_KEY
NEWSAPI_KEY
STABILITY_AI_KEY
OCRSPACE_API_KEY
ELEVENLABS_API_KEY
ELEVENLABS_VOICE_ID
```

## Project files

| File | Purpose |
| --- | --- |
| `index.html` | Command-center shell; loads `config.js` with fallback to `config.example.js` |
| `app.js` | Voice routing, intents, search, maps, memory, fallbacks |
| `local-server.js` | Static file server (default port 8000) |
| `config.example.js` | Safe template (committed) |
| `config.js` | Your keys (local only, gitignored) |
| `install.ps1` / `install.bat` | First-time setup |
| `start-anicade.ps1` / `start-anicade.bat` | Start server and open browser |
| `package.json` | `npm start`, `npm run setup` |
| `.github/workflows/pages.yml` | GitHub Pages deploy |

## Browser limits

This is a static frontend. OS-level control, background reminders, and unrestricted autoplay may require a desktop companion, extension, or backend.

Honest empty states (not invented data):

| Ask about | Response |
| --- | --- |
| Calendar / meetings | No calendar connected |
| Reminders / alarms | No reminder service |
| Tasks / todos | No task list |
| Daily briefing | Real time + empty calendar/tasks; news/weather only with keys |
| Dashboard vitals | Simulated (SIM); audio spectrum is real when mic is allowed |

## License

MIT — see [LICENSE](LICENSE).
