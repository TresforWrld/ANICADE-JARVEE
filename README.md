# ANICADE JARVEE

<div align="center">
  <svg width="520" height="170" viewBox="0 0 520 170" fill="none" xmlns="http://www.w3.org/2000/svg">
    <style>
      .ring { transform-origin: 260px 72px; animation: spin 16s linear infinite; }
      .ring2 { transform-origin: 260px 72px; animation: spinReverse 10s linear infinite; }
      .orb { animation: pulse 1.7s ease-in-out infinite alternate; filter: url(#glow); }
      .title { font-family: Orbitron, Arial, sans-serif; font-size: 28px; font-weight: 800; fill: #C6A85C; letter-spacing: 4px; text-anchor: middle; }
      .sub { font-family: Arial, sans-serif; font-size: 13px; fill: #94A3B8; letter-spacing: 2px; text-anchor: middle; }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes spinReverse { to { transform: rotate(-360deg); } }
      @keyframes pulse { from { opacity: .68; r: 30; } to { opacity: 1; r: 42; } }
    </style>
    <defs>
      <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="9" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <radialGradient id="orb" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#00BFFF"/>
        <stop offset="70%" stop-color="#006EA6" stop-opacity=".7"/>
        <stop offset="100%" stop-color="#0B1C2D" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <circle class="ring" cx="260" cy="72" r="58" stroke="#C6A85C" stroke-width="1.5" stroke-dasharray="18 10"/>
    <circle class="ring2" cx="260" cy="72" r="42" stroke="#00BFFF" stroke-width="1.2" stroke-dasharray="10 8"/>
    <circle class="orb" cx="260" cy="72" r="34" fill="url(#orb)"/>
    <text class="title" x="260" y="132">ANICADE JARVEE</text>
    <text class="sub" x="260" y="154">VOICE AI SCREEN READER AND LOCAL-FIRST PWA</text>
  </svg>

  <br>
  <img src="https://img.shields.io/badge/PWA-Offline%20Ready-00BFFF?style=for-the-badge" alt="PWA Offline Ready">
  <img src="https://img.shields.io/badge/OCR-Tesseract.js-C6A85C?style=for-the-badge" alt="Tesseract OCR">
  <img src="https://img.shields.io/badge/Voice-Speech%20API-13C27A?style=for-the-badge" alt="Speech API">
</div>

## Overview

ANICADE JARVEE is a browser-based AI assistant for reading screens, summarizing uploaded screenshots, answering voice questions, generating ad banners, playing ambient music, and keeping local logs. It is designed as an installable PWA with local-first settings and optional developer-side API configuration in `app.js`.

## Highlights

- Screen, camera, and uploaded-image OCR analysis
- Voice command orb with wake word, persona, language, and voice profile controls
- Copyable answer output tab for clean assistant responses
- Local conversation logs with a one-click Clear Logs control
- Music streamer with play, pause, next, volume commands, and local audio upload
- Voice commands for screen sharing, animal sound translation, system diagnostics, math, date, time, notifications, and small talk
- Service worker caching for offline app shell support
- SEO metadata, `robots.txt`, `sitemap.xml`, and WebApplication JSON-LD

## Quick Start

Run from a secure context so browser media permissions work:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000` in Chrome, Edge, or Safari. Use the orb or say the wake word after enabling voice input.

## Useful Voice Commands

| Command | Result |
| --- | --- |
| `read screen` | Runs OCR on the active screen, camera, or uploaded image |
| `share screen` | Opens the browser screen sharing prompt |
| `define recursion` | Gives a concise definition |
| `what is 18 * 42` | Solves simple math locally |
| `play music` / `next track` / `volume up` | Controls the music streamer |
| `decode animal sound` | Starts the microphone-based acoustic decoder |
| `system check` | Reports mic, speech, visual input, service worker, and OCR readiness |
| `clear logs` | Clears local conversation history |

## Privacy

By default, logs, preferences, reminders, custom wake word, and answer history stay in the browser through `localStorage`. The UI does not expose API keys or JSONbin credentials. If you want cloud services later, add keys directly in the `USER_CONFIG` block inside `app.js`.

## Files

- `index.html` - app shell, controls, metadata, and README-style manual
- `styles.css` - responsive HUD styling, accessibility focus states, themes, and animations
- `app.js` - voice, OCR, assistant, music, notifications, settings, and storage logic
- `manifest.json` - installable PWA metadata
- `sw.js` - service worker cache strategies
- `robots.txt` and `sitemap.xml` - search engine discovery

## Notes

Speech recognition and speech synthesis depend on the browser and operating system. OCR loads Tesseract.js on demand, so the first scan may take longer than later scans.
