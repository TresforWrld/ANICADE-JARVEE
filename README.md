# ANICADE Voice Assistant

ANICADE Voice Assistant is a browser-based, voice-first command center for conversation, camera preview, maps, search, news, schematics, music, local memory, and generated visual concepts.

The app uses a static frontend architecture: `index.html`, `styles.css`, `app.js`, `maps.html`, `schematics.html`, a service worker, and local configuration.

## Quick Start

Double-click:

```text
start-anicade.bat
```

Or run:

```powershell
.\start-anicade.ps1
```

Then open:

```text
http://127.0.0.1:8000/index.html
```

Chrome or Edge is recommended. Browser speech recognition, microphone, camera capture, install prompts, and local media playback work best on `127.0.0.1`, `localhost`, or HTTPS.

## Startup And Voice

On load, the assistant attempts a startup sound, particle activation, a spoken greeting, and microphone startup. Modern browsers may block speech audio or microphone capture until permission is granted; when that happens, click once in the app and allow microphone access.

The visual core keeps normal operation quiet. Status messages appear only as small, unobtrusive indicators.

## Reliability

The assistant should not interrupt normal responses with provider failure chatter. If a browser permission, network request, embedded page, or media feed is unavailable, the app keeps the conversation flowing and shows a small status or fallback panel.

Examples:

| Say | Result |
| --- | --- |
| `open map` | Opens the ATLAS surface using `maps.html` |
| `switch to satellite view` | Switches ATLAS to satellite tiles |
| `show oil lines` | Displays the pipeline overlay |
| `open schematics` | Opens the SCHEMA viewer |
| `open music` | Opens the ECHO music panel |
| `play music` | Plays the selected playlist track when browser media playback is allowed |
| `search the web for AI news` | Opens an in-app browser/search surface |
| `latest technology news` | Opens a live news feed in the output panel |
| `standby` | Enters standby while keeping voice wake and clap wake available |
| `wake up` | Leaves standby |

## Modules

| Module | Purpose |
| --- | --- |
| `ATLAS` | Maps, route calculation, satellite/roads/night/oil/swamp/traffic overlays |
| `PULSE` | Live news summaries |
| `SCHEMA` | Interactive schematics and architecture viewer |
| `ECHO` | Music panel and playlist controls |
| `VISION` | Camera preview with graceful retry |
| `FORGE` | File/code oriented assistance through local files and text prompts |

## Configuration

Copy `config.example.js` to `config.js` for local use and fill only the providers you need.

Do not commit real API keys. If any key has appeared in chat, screenshots, or public commits, rotate it in the provider dashboard.

Useful provider slots:

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

## Project Files

| File | Purpose |
| --- | --- |
| `index.html` | Command-center shell |
| `styles.css` | Responsive layout, panels, particles, light/dark theme |
| `app.js` | Voice routing, intent parsing, search, maps, music, memory, camera, and graceful fallbacks |
| `maps.html` | Leaflet-based ATLAS map |
| `schematics.html` | Interactive SCHEMA viewer |
| `manifest.json` | PWA metadata |
| `sw.js` | Offline shell cache |
| `config.example.js` | Safe configuration template |
| `start-anicade.ps1` / `start-anicade.bat` | Local launchers |

## Browser Limits

This is a static frontend. Native OS control, background reminders, unrestricted automatic startup audio, and system-level telemetry require a desktop companion app, browser extension, or backend service.
