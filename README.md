# ANICADE JARVIS

<div align="center">
  <img src="assets/icon.svg" width="116" height="116" alt="ANICADE JARVIS orb icon">

  <h3>Voice-first screen reader, visual assistant, and installable PWA</h3>

  <p>
    <img src="https://img.shields.io/badge/Mode-Voice%20First-00BFFF?style=for-the-badge" alt="Voice First">
    <img src="https://img.shields.io/badge/PWA-Installable-C6A85C?style=for-the-badge" alt="Installable PWA">
    <img src="https://img.shields.io/badge/Hosting-GitHub%20Pages-13C27A?style=for-the-badge" alt="GitHub Pages">
  </p>
</div>

ANICADE JARVIS is a browser-based assistant designed around the v2.1 PRD: the orb is the main interface, voice is the primary input, the JARVIS voice is locked silently, and camera/screen/file actions can be triggered without hunting through manual controls.

## Quick Start

### Run On A PC

Download or clone the repo, then double-click:

```text
start-anicade.bat
```

Or run it from PowerShell:

```powershell
.\start-anicade.ps1
```

The launcher starts a local static server and opens the app at `http://127.0.0.1:8000/index.html`. Camera, microphone, screen sharing, and PWA install prompts work best on `localhost`, `127.0.0.1`, or HTTPS.

### Run With npm

```powershell
npm start
```

If PowerShell blocks npm scripts on your PC, run:

```powershell
npm.cmd start
```

Then open:

```text
http://127.0.0.1:8000
```

### Install On Phone

1. Deploy the repo to GitHub Pages or another HTTPS host.
2. Open the site in Chrome, Edge, or Safari on the phone.
3. Use the browser menu and choose `Add to Home Screen` or `Install app`.
4. Allow microphone and camera permissions when JARVIS asks.

## GitHub Pages

This repo includes `.github/workflows/pages.yml`. Push to `main` or `master`, enable GitHub Pages from Actions, and the workflow publishes the static app.

Private keys should go into GitHub repository secrets:

```text
GEMINI_API_KEY
CLAUDE_API_KEY
GOOGLE_CLIENT_ID
FACEBOOK_APP_ID
JSONBIN_ID
JSONBIN_KEY
JSONBIN_ACCESS_KEY
```

For local development, copy `config.example.js` to `config.js`. The real `config.js` is ignored by git.

## Voice Core

| Say | Result |
| --- | --- |
| `JARVIS` / `Hey JARVIS` | Wake acknowledgement |
| `Go to sleep` / `Standby` | Dims the orb and waits for wake word |
| `Wake up` | Leaves standby |
| `Stop` / `Enough` | Cancels speech |
| `Open camera` | Starts the rear camera |
| `Front camera` | Starts the front camera |
| `Switch camera` | Flips front/rear camera |
| `Camera scan` | Opens camera and reads the frame |
| `Take a photo` | Saves the active visual frame |
| `Close camera` | Stops the camera stream |
| `Share screen` | Opens the browser screen-share prompt |
| `Read screen` | Runs visual OCR/AI analysis |
| `Open file` | Opens the local file picker |
| `Show tools` / `Show help` | Reveals contextual panels |
| `Install app` | Opens the PWA install prompt when available |

## What It Can Do

```mermaid
flowchart LR
  Voice["Voice command"] --> Router["Command router"]
  Router --> Screen["Screen share"]
  Router --> Camera["Camera scan"]
  Router --> Files["Local files"]
  Router --> Music["Music"]
  Router --> Notes["Memory and schedules"]
  Screen --> Output["Spoken answer + output panel"]
  Camera --> Output
  Files --> Output
```

## Project Files

| File | Purpose |
| --- | --- |
| `index.html` | Static app shell and contextual panels |
| `styles.css` | Orb UI, tech background, responsive layout |
| `app.js` | Voice routing, speech, camera, OCR, memory, PWA logic |
| `manifest.json` | Installable PWA metadata |
| `sw.js` | Offline app shell service worker |
| `config.example.js` | Safe public config template |
| `start-anicade.ps1` / `start-anicade.bat` | PC launchers |
| `.github/workflows/pages.yml` | GitHub Pages deployment |

## Notes

This is a static app. There is no Node/Express backend in production. Anything secret belongs in local `config.js` or GitHub Actions secrets, never in committed source.
