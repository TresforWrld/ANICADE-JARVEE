# ANICADE JARVIS

ANICADE JARVIS is a browser-based, voice-first command center for screen reading, camera analysis, maps, search, news, schematics, music, reminders, local memory, and generated visual concepts.

The current build recreates `index.html` from the supplied A.E.G.I.S.-style neural core template and keeps the existing static app architecture: `index.html`, `styles.css`, `app.js`, `maps.html`, `schematics.html`, service worker, and local config.

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

Chrome or Edge is recommended. Browser speech recognition, microphone, screen capture, local files, and install prompts work best on `127.0.0.1`, `localhost`, or HTTPS.

## Startup And Voice

On load, JARVIS attempts a startup sound, particle activation, a spoken greeting, and microphone startup. Modern browsers may still block speech audio or microphone capture until permission is granted; when that happens, click the orb once and allow microphone access.

The visual core no longer shows noisy text like `Listening`, `Thinking`, or `I heard you` during normal operation. The particles and HUD state carry the interaction.

## Truth Enforcement

JARVIS should not report that a panel opened unless the app actually made it visible. If a browser permission, popup, API, or surface is unavailable, the assistant should say so directly instead of pretending the action completed.

Examples:

| Say | Result |
| --- | --- |
| `open map` | Opens the ATLAS surface using `maps.html` |
| `switch to satellite view` | Switches ATLAS to satellite tiles |
| `show oil lines` | Displays the tactical pipeline overlay |
| `open schematics` | Opens the SCHEMA viewer |
| `open music` | Opens the ECHO music panel |
| `play music` | Plays the selected playlist track when browser media playback is allowed |
| `search the web for AI news` | Retrieves a summary and queues live results |
| `open search results` | Opens the live search panel inside the app surface |
| `latest technology news` | Opens a PULSE news feed in the output panel |
| `take a screenshot` | Starts screen share, waits for a real frame, then saves it |
| `scroll down` / `scroll to bottom` | Scrolls the active app surface or page |
| `remember that ...` | Stores a local memory note |

## Real Diagnostics

The neural synapse readout now uses browser-exposed runtime data instead of invented percentages:

| Diagnostic | Source |
| --- | --- |
| JS heap load | `performance.memory`, when supported |
| Network type/speed/RTT | `navigator.connection`, when supported |
| Latency fallback | Navigation timing / local performance timer |
| Runtime | Actual app session timer |

Some system-level values such as CPU temperature, GPU load, per-core CPU, and OS process load are not available to a static browser page without a desktop bridge or backend agent.

## Modules

| Module | Purpose |
| --- | --- |
| `ATLAS` | Tactical maps, route calculation, satellite/roads/night/oil/swamp/traffic overlays |
| `PULSE` | Web search and live news summaries |
| `SCHEMA` | Interactive schematics and architecture viewer |
| `ECHO` | Music panel, playlist, repeat, upload, visualizer |
| `VISION` | Camera, screen share, image upload, OCR/AI analysis |
| `FORGE` | File/code oriented assistance through local files and text prompts |
| `NEXUS` | Business, schedule, reminder, and connected-app status |

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
| `index.html` | Rebuilt neural command-center shell |
| `styles.css` | Holographic layout, panels, particles, responsive UI |
| `app.js` | Voice routing, truth checks, search, maps, music, memory, vision |
| `maps.html` | Leaflet-based ATLAS tactical map |
| `schematics.html` | Interactive SCHEMA viewer |
| `manifest.json` | PWA metadata |
| `sw.js` | Offline shell cache |
| `config.example.js` | Safe configuration template |
| `start-anicade.ps1` / `start-anicade.bat` | Local launchers |

## Browser Limits

This is still a static frontend. Reliable always-on wake word, CPU/GPU telemetry, native OS app control, background reminders, and unrestricted automatic startup audio require a desktop companion app, browser extension, or backend service.
