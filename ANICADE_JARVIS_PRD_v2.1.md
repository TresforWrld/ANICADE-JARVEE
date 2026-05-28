# ANICADE JARVIS — Product Requirements Document
## Version 2.1 · ANICADE TECH · Tresfor Zulu
**Status:** IN PROGRESS — REBUILDING FROM v1 · **Hosting:** GitHub Pages (`tresforwrld.github.io/ANICADE-JARVEE`)

---

> ⚠️ **CURRENT STATE NOTICE**
> The live version at `https://tresforwrld.github.io/ANICADE-JARVEE/` is currently **non-functional** in several critical areas:
> - AI responses are slow and inconsistent (Pollinations fallback timing out)
> - Real integrations (Calendar, Gmail, WhatsApp) return mock data only
> - Fullscreen top bar overlays the orb
> - Voice selection is exposed when it should not be
> - No persistent memory between sessions
> - No local file access
>
> This PRD defines the complete rebuild to fix all of these.

---

## 0. North Star

> **JARVIS must feel like a person who lives in your machine — not a website you visit.**

JARVIS is not a chatbot. It is not a dashboard. It is a permanently-on, voice-native AI agent that reads your screen, controls your files, reads your email, replies to WhatsApp, manages your calendar, and speaks back in one locked voice — all without the user ever touching a button. The UI exists only to confirm what JARVIS is doing, never to prompt the user to do anything manually.

---

## 1. What Is Wrong With v1 (Honest Audit)

| Problem | Impact |
|---|---|
| Manual buttons everywhere — contradicts "voice first" | User must click to do anything meaningful |
| Voice selector visible in UI | Breaks immersion; JARVIS should just sound like JARVIS |
| Fullscreen top bar overlays the orb on all screen sizes | The most important visual element gets blocked |
| Pollinations AI is slow and crashes under load | Long silences break conversational feel |
| No real integrations — Calendar/WhatsApp/Email are mock data | Trust-destroying once user realises |
| OCR via Tesseract.js is slow and low-accuracy | Screen reading fails on complex layouts |
| No local file access | Can't read, edit, or manage local files |
| Conversation memory resets on page close | JARVIS forgets everything |
| Self-transcription loopback fires on its own speech | JARVIS talks to itself |
| No streaming — full response generated before speaking | 2–4 second silence every single reply |
| Plain black fullscreen background | Boring, not consistent with the tech aesthetic |
| No camera open by voice | A core voice-first feature is missing |
| GitHub Pages is a static host | Backend integrations must all use client-side OAuth or external free services |

---

## 2. Guiding Principles for v2

1. **Voice is the only input that matters.** Every feature must be triggerable by voice. Buttons are emergency fallbacks only, hidden by default.
2. **JARVIS speaks first.** Streaming must begin within 400ms of the user finishing a sentence.
3. **The UI confirms; it does not prompt.** Panels slide in when JARVIS has something to show. They slide away automatically.
4. **One voice. Always.** JARVIS voice is locked silently at boot. No selector. No choice.
5. **Real data or nothing.** Mock data must be replaced. If an integration is unavailable, JARVIS says so honestly.
6. **Memory is permanent.** Context and preferences survive tab closes and reboots.
7. **Always beautiful.** The background is a living tech environment — never plain black.
8. **GitHub Pages constraint.** There is no server. Every integration must work entirely client-side using OAuth + CORS-friendly APIs. No Node.js. No Express. No server secrets.

---

## 3. GitHub Pages Hosting — What This Means For The Build

GitHub Pages serves **static files only** — HTML, CSS, JS, images. There is no server runtime. This has these consequences:

| Requirement | Solution |
|---|---|
| No server to store API keys securely | All keys live in `config.js` (gitignored locally, injected via GitHub Secrets in CI) |
| No backend OAuth server | Use OAuth 2.0 PKCE flow — designed for public clients with no server |
| No database | IndexedDB (local) + JSONBin (cloud sync via API) |
| No server-side AI proxy | Call AI APIs directly from the browser (Gemini and Pollinations are CORS-friendly) |
| No WhatsApp server | Browser fallback (WA Web deep link) in Phase 1; Electron app in Phase 2 |
| No WebSockets server | Use Server-Sent Events or polling on AI APIs |

**Important:** Never commit `config.js` to GitHub. Add it to `.gitignore`. Use GitHub Actions secrets + a build step to inject keys if needed for production deployment.

---

## 4. JARVIS Voice — Lock & Configuration

### 4.1 Voice Selection (Silent, No UI)

On every boot, JARVIS silently runs this priority scan:

```js
// modules/voice.js — boot sequence

function lockJARVISVoice() {
  const voices = window.speechSynthesis.getVoices();

  // Priority order — first match wins
  const JARVIS_PRIORITY = [
    v => v.name === 'Google UK English Male',
    v => v.name === 'Daniel',
    v => v.name === 'Arthur',
    v => v.name === 'Google UK English',
    v => v.lang === 'en-GB' && v.name.toLowerCase().includes('male'),
    v => v.lang === 'en-GB',
    v => v.lang.startsWith('en'),
    v => true // absolute fallback — any voice
  ];

  for (const matcher of JARVIS_PRIORITY) {
    const match = voices.find(matcher);
    if (match) {
      state.lockedVoice = match;
      console.log('[JARVIS] Voice locked:', match.name); // console only, never UI
      return;
    }
  }
}
```

### 4.2 TTS Parameters

```js
utterance.voice  = state.lockedVoice;
utterance.rate   = 1.05;   // Slightly faster than default — authoritative
utterance.pitch  = 0.92;   // Slightly lower — calm and commanding
utterance.volume = 1.0;
```

### 4.3 What To Remove From The DOM

- Delete `<select id="voiceSelect">` and its `<label>` entirely.
- Delete the `Advanced Voice Profile` control group.
- Delete the `Language` selector from the UI (keep it in `config.js` only).
- Delete `initVoiceSettings()` function's UI rendering logic. Keep only the silent `lockJARVISVoice()` call.

---

## 5. API Keys — Configuration File

Create `config.js` in the project root. Add `config.js` to `.gitignore` immediately.
Copy `config.example.js` to `config.js` and fill in your keys.

```js
// config.js — DO NOT COMMIT TO GITHUB
// Copy config.example.js → config.js and fill in your keys

const JARVIS_CONFIG = {

  // ── AI MODELS ──────────────────────────────────────────────────────────────
  // Primary: Gemini 2.0 Flash (multimodal, fast, free tier)
  // Get key: https://aistudio.google.com/app/apikey
  GEMINI_API_KEY:        'YOUR_GEMINI_API_KEY_HERE',

  // Secondary: Groq (ultra-fast LLaMA, free tier — 14,400 req/day)
  // Get key: https://console.groq.com/keys
  GROQ_API_KEY:          'YOUR_GROQ_API_KEY_HERE',

  // Tertiary: Cohere (free tier — 1000 req/month)
  // Get key: https://dashboard.cohere.com/api-keys
  COHERE_API_KEY:        'YOUR_COHERE_API_KEY_HERE',

  // Quaternary: Pollinations (no key needed — leave as-is)
  POLLINATIONS_ENABLED:  true,

  // ── GOOGLE SERVICES ────────────────────────────────────────────────────────
  // Google OAuth Client ID (Calendar + Gmail — free)
  // Get: https://console.cloud.google.com → APIs & Services → Credentials
  // Enable: Google Calendar API + Gmail API
  // Set authorised JS origins to: https://tresforwrld.github.io
  GOOGLE_CLIENT_ID:      'YOUR_GOOGLE_CLIENT_ID_HERE',

  // ── WEB SEARCH ─────────────────────────────────────────────────────────────
  // Primary: Brave Search API (free — 2,000 req/month)
  // Get key: https://api.search.brave.com/register
  BRAVE_SEARCH_API_KEY:  'YOUR_BRAVE_SEARCH_API_KEY_HERE',

  // Secondary: Serper (free — 100 req/month)
  // Get key: https://serper.dev
  SERPER_API_KEY:        'YOUR_SERPER_API_KEY_HERE',

  // Tertiary: DuckDuckGo Instant Answer (no key needed — leave as-is)
  DUCKDUCKGO_ENABLED:    true,

  // ── WEATHER ────────────────────────────────────────────────────────────────
  // Primary: OpenWeatherMap (free — 60 calls/min, 1M calls/month)
  // Get key: https://openweathermap.org/api → free tier
  OPENWEATHER_API_KEY:   'YOUR_OPENWEATHER_API_KEY_HERE',

  // Secondary: WeatherAPI (free — 1M calls/month)
  // Get key: https://www.weatherapi.com/signup.aspx
  WEATHERAPI_KEY:        'YOUR_WEATHERAPI_KEY_HERE',

  // ── NEWS ───────────────────────────────────────────────────────────────────
  // Primary: GNews (free — 100 req/day)
  // Get key: https://gnews.io
  GNEWS_API_KEY:         'YOUR_GNEWS_API_KEY_HERE',

  // Secondary: NewsAPI (free developer tier — 100 req/day)
  // Get key: https://newsapi.org/register
  NEWSAPI_KEY:           'YOUR_NEWSAPI_KEY_HERE',

  // ── CLOUD SYNC / DATABASE ──────────────────────────────────────────────────
  // JSONBin (free — 10,000 req/month)
  // Get: https://jsonbin.io → sign up, create a bin
  JSONBIN_BIN_ID:        'YOUR_JSONBIN_BIN_ID_HERE',
  JSONBIN_MASTER_KEY:    'YOUR_JSONBIN_MASTER_KEY_HERE',
  JSONBIN_ACCESS_KEY:    'YOUR_JSONBIN_ACCESS_KEY_HERE',

  // ── IMAGE GENERATION ───────────────────────────────────────────────────────
  // Primary: Pollinations (no key — completely free, unlimited)
  // Secondary: Stability AI (free — 25 credits/month)
  // Get key: https://platform.stability.ai/account/keys
  STABILITY_AI_KEY:      'YOUR_STABILITY_AI_KEY_HERE',

  // ── OCR / VISION ───────────────────────────────────────────────────────────
  // Primary: Gemini Vision (uses GEMINI_API_KEY above)
  // Secondary: OCR.space (free — 25,000 req/month)
  // Get key: https://ocr.space/ocrapi/freekey
  OCRSPACE_API_KEY:      'YOUR_OCRSPACE_API_KEY_HERE',

  // ── WAKE WORD ──────────────────────────────────────────────────────────────
  // Do not change unless you know what you're doing
  WAKE_WORD:             'jarvis',

  // ── MISC ───────────────────────────────────────────────────────────────────
  // Your name — JARVIS uses this to address you
  USER_NAME:             'Sir',

};
```

---

## 6. Complete Free API Reference

Every API listed below has a **genuinely usable free tier** — enough for personal daily use.

---

### 6.1 AI Language Models (LLM) — Fallback Chain

JARVIS calls these in order. If one fails or is rate-limited, it moves to the next instantly.

| Priority | Service | Free Tier | Speed | Best For | Get Key |
|---|---|---|---|---|---|
| 1 | **Gemini 2.0 Flash** | 15 req/min, 1M tokens/day | ⚡⚡⚡ | Vision + general | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| 2 | **Groq** (LLaMA 3.1 70B) | 14,400 req/day, 6000 tokens/min | ⚡⚡⚡⚡ | Speed — fastest text LLM | [console.groq.com](https://console.groq.com/keys) |
| 3 | **Cohere Command R** | 1,000 req/month, 20 req/min | ⚡⚡ | Reasoning + summaries | [dashboard.cohere.com](https://dashboard.cohere.com/api-keys) |
| 4 | **Pollinations** | Unlimited, no key | ⚡ | Last resort, no registration | Automatic |

**Why 4 models:** Gemini and Groq cover 99% of traffic. Cohere and Pollinations are safety nets for rate-limit spikes. Never let JARVIS go silent because one API is busy.

**Groq API call (text, ultra-fast streaming):**
```js
const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${JARVIS_CONFIG.GROQ_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'llama-3.1-70b-versatile',
    messages: [{ role: 'system', content: JARVIS_SYSTEM_PROMPT },
               { role: 'user', content: userMessage }],
    stream: true,
    max_tokens: 400,
    temperature: 0.5
  })
});
// Parse SSE stream → sentence chunks → TTS queue
```

---

### 6.2 Speech Recognition — Fallback Chain

| Priority | Service | Free Tier | Notes |
|---|---|---|---|
| 1 | **Web Speech API** (`webkitSpeechRecognition`) | Free, unlimited | Built into Chrome/Edge. No key. Best latency. |
| 2 | **AssemblyAI** | $0.001/min (generous trial credits) | Better accuracy on accents. HTTPS streaming. |
| 3 | **Deepgram** | 200 hours free | Excellent accent handling. Streaming support. |

For GitHub Pages (browser-only), Web Speech API is the primary and should cover all normal use. AssemblyAI/Deepgram are Phase 2 (requires a proxy or CORS-friendly endpoint).

---

### 6.3 Speech Synthesis (TTS) — JARVIS Voice

| Priority | Service | Free Tier | Notes |
|---|---|---|---|
| 1 | **Web Speech Synthesis API** | Free, unlimited | Built-in browser. `Google UK English Male` / `Daniel` voice. No latency. |
| 2 | **ElevenLabs** | 10,000 characters/month | Best voice quality available. Requires an API call. |
| 3 | **Google TTS** (via Gemini API key) | Free tier included | If Web Speech Synthesis not available. |

**Phase 1:** Web Speech Synthesis only — zero latency, no key needed, works offline.
**Phase 2:** Add ElevenLabs as optional premium upgrade. JARVIS says: *"Upgraded voice active, Sir."*

Get ElevenLabs key: [elevenlabs.io](https://elevenlabs.io) (free account)

---

### 6.4 Google Calendar & Gmail — Free OAuth

**Cost:** Free. Google Cloud has no cost for personal OAuth use up to quota limits (vastly higher than personal daily use).

**Setup steps:**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project: `ANICADE-JARVIS`
3. Enable APIs: **Google Calendar API** + **Gmail API**
4. Credentials → Create OAuth 2.0 Client ID → Web Application
5. Authorised JavaScript origins: `https://tresforwrld.github.io`
6. Authorised redirect URIs: `https://tresforwrld.github.io/ANICADE-JARVEE/`
7. Copy the Client ID into `config.js`

**PKCE OAuth flow (no server required):**
```js
// modules/integrations/google.js

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send'
].join(' ');

function triggerGoogleAuth() {
  const codeVerifier  = generateCodeVerifier();   // PKCE
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  const params = new URLSearchParams({
    client_id:             JARVIS_CONFIG.GOOGLE_CLIENT_ID,
    redirect_uri:          window.location.href,
    response_type:         'code',
    scope:                 SCOPES,
    code_challenge:        codeChallenge,
    code_challenge_method: 'S256',
    access_type:           'offline',
    prompt:                'consent'
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}
```

**Free quota limits (more than enough for personal use):**
- Calendar API: 1,000,000 requests/day
- Gmail API: 1,000,000,000 quota units/day (reading = 5 units, sending = 100 units)

---

### 6.5 Web Search — Fallback Chain

| Priority | Service | Free Tier | Notes |
|---|---|---|---|
| 1 | **Brave Search API** | 2,000 req/month | Best quality. Returns full results. |
| 2 | **Serper** (Google Results) | 100 req/month | Gets actual Google results. Fast. |
| 3 | **DuckDuckGo Instant Answer** | Unlimited, no key | Quick facts only. No full search results. |
| 4 | **Wikipedia REST API** | Unlimited, no key | Good for knowledge questions. |

Get Brave key: [api.search.brave.com/register](https://api.search.brave.com/register)
Get Serper key: [serper.dev](https://serper.dev)

```js
// modules/ai.js — search router

async function searchWeb(query) {
  // Try Brave first
  try {
    const result = await braveSearch(query);
    if (result) return result;
  } catch {}

  // Try Serper
  try {
    const result = await serperSearch(query);
    if (result) return result;
  } catch {}

  // Try DuckDuckGo
  try {
    const result = await duckduckgoSearch(query);
    if (result) return result;
  } catch {}

  // Try Wikipedia
  return await wikipediaSummary(query);
}
```

---

### 6.6 Weather

| Priority | Service | Free Tier | Notes |
|---|---|---|---|
| 1 | **OpenWeatherMap** | 60 calls/min, 1M calls/month | Current + 5-day forecast. |
| 2 | **WeatherAPI** | 1M calls/month | Covers Zambia well. |
| 3 | **Open-Meteo** | Unlimited, no key | Open source. Forecast only. |

Get OpenWeatherMap key: [openweathermap.org/api](https://openweathermap.org/api)
Get WeatherAPI key: [weatherapi.com/signup.aspx](https://www.weatherapi.com/signup.aspx)
Open-Meteo: [open-meteo.com](https://open-meteo.com) — no key required.

---

### 6.7 News

| Priority | Service | Free Tier | Notes |
|---|---|---|---|
| 1 | **GNews** | 100 req/day | Clean API. Supports Zambia region. |
| 2 | **NewsAPI** | 100 req/day (developer) | Good global coverage. |
| 3 | **RSS2JSON** | 500 req/day, no key | Converts any RSS feed to JSON. |

Get GNews key: [gnews.io](https://gnews.io)
Get NewsAPI key: [newsapi.org/register](https://newsapi.org/register)
RSS2JSON: [rss2json.com](https://rss2json.com) — free, no key needed for basic use.

---

### 6.8 WhatsApp

| Phase | Method | Cost | Notes |
|---|---|---|---|
| Phase 1 | **Deep Link fallback** | Free | `https://wa.me/[number]?text=[message]` opens WA app/web |
| Phase 1 | **Web.WhatsApp.com screen read** | Free | JARVIS reads WA Web via Vision API when screen is shared |
| Phase 2 | **whatsapp-web.js** (Electron/Tauri) | Free | Full native read + send. Requires desktop app wrapper. |

**Phase 1 implementation:**
```js
function openWhatsApp(number = '', message = '') {
  const url = number
    ? `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
    : 'https://web.whatsapp.com';
  window.open(url, '_blank');
  speakText(number
    ? `Opening WhatsApp with your message ready to send, Sir.`
    : `Opening WhatsApp Web, Sir.`
  );
}
```

---

### 6.9 Facebook

| Phase | Method | Notes |
|---|---|---|
| Phase 1 | **Screen read via Vision API** | JARVIS reads FB when screen is shared |
| Phase 2 | **Facebook Graph API** | Requires App Review for messaging scope |

**Graph API free setup:**
1. [developers.facebook.com](https://developers.facebook.com) → Create App → Consumer type
2. Add products: Facebook Login, Pages API
3. Scopes for Phase 2: `user_posts`, `pages_messaging` (requires review)
4. App ID + User Token go into `config.js`

---

### 6.10 OCR / Vision — Fallback Chain

| Priority | Service | Free Tier | Notes |
|---|---|---|---|
| 1 | **Gemini Vision API** | 15 req/min, 1500 req/day | Best accuracy. Uses same Gemini key. |
| 2 | **OCR.space** | 25,000 req/month | Good fallback. Server-side OCR. |
| 3 | **Tesseract.js** | Unlimited, no key | Client-side. Slower but fully offline. |

Get OCR.space key: [ocr.space/ocrapi/freekey](https://ocr.space/ocrapi/freekey)

---

### 6.11 Image Generation

| Priority | Service | Free Tier | Notes |
|---|---|---|---|
| 1 | **Pollinations.ai** | Unlimited, no key | `https://image.pollinations.ai/prompt/[encoded-prompt]` |
| 2 | **Stability AI** | 25 credits/month | Much better quality than Pollinations. |
| 3 | **Hugging Face** (SDXL) | Limited free inference | Good quality when Stability quota is used. |

Get Stability key: [platform.stability.ai/account/keys](https://platform.stability.ai/account/keys)
Get Hugging Face key: [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

---

### 6.12 Database / Cloud Sync

| Priority | Service | Free Tier | Notes |
|---|---|---|---|
| 1 | **IndexedDB** | Unlimited, local | Primary store. Works offline. |
| 2 | **JSONBin** | 10,000 req/month | Cloud sync. Existing v1 integration. |
| 3 | **Supabase** | 500MB, unlimited API calls | Better for Phase 2 (user auth + real DB). |

Get Supabase: [supabase.com](https://supabase.com) — free project, no credit card.

---

## 7. AI Engine — Model Router

JARVIS decides which model to use based on task type. Failed calls automatically fall to the next model in the chain.

```
Task received
     │
     ├─ Has image/screen? ──────► Gemini Flash Vision → OCR.space → Tesseract
     │
     ├─ Speed critical?  ──────► Groq (LLaMA 70B) → Gemini Flash → Pollinations
     │
     ├─ Long doc/email?  ──────► Gemini Flash → Groq → Cohere → Pollinations
     │
     ├─ Search needed?   ──────► Brave → Serper → DuckDuckGo → Wikipedia
     │
     └─ Default          ──────► Gemini Flash → Groq → Cohere → Pollinations
```

| Task | Primary | Fallback 1 | Fallback 2 | Fallback 3 |
|---|---|---|---|---|
| Screen reading / OCR | Gemini Vision | OCR.space | Tesseract.js | — |
| General Q&A | Gemini Flash | Groq LLaMA | Cohere | Pollinations |
| Fast one-liners | Groq | Gemini Flash | Pollinations | — |
| Email drafting | Gemini Flash | Groq | Cohere | Pollinations |
| Document summary | Gemini Flash | Groq | Cohere | Pollinations |
| Web search summary | Brave + Gemini | Serper + Groq | DuckDuckGo | Wikipedia |
| Image generation | Pollinations | Stability AI | Hugging Face | — |
| Weather | OpenWeatherMap | WeatherAPI | Open-Meteo | — |
| News | GNews | NewsAPI | RSS2JSON | — |

---

## 8. Voice Core

### 8.1 Wake Word
- Wake word: `"JARVIS"` — hardcoded. Not shown in UI.
- Fuzzy matching: accept if Levenshtein distance ≤ 2 from "jarvis" (catches accents, mumbling).
- Also accepts: `"Hey JARVIS"`, `"OK JARVIS"`, `"JARVEE"`, `"JAR-VIS"`.
- VAD library: `@ricky0123/vad-web` (WASM-based, ~2% CPU at idle).

### 8.2 Camera Open By Voice

Add these voice commands to the command router:

| Command | Action |
|---|---|
| `"Open camera"` | Starts rear camera via `getUserMedia` |
| `"Start camera"` | Same as above |
| `"Camera scan"` | Opens camera and immediately begins OCR scan |
| `"Front camera"` | Opens front-facing camera |
| `"Switch camera"` | Switches between front and rear |
| `"Close camera"` / `"Stop camera"` | Stops camera stream |
| `"Take a photo"` | Captures still from camera feed |
| `"Scan this with camera"` | Opens camera and runs Gemini Vision |

```js
// In processVoiceCommand()

if (commandHasAny(intentCmd, ['open camera', 'start camera', 'camera scan',
                               'camera on', 'use camera', 'turn on camera'])) {
  const facing = lowerCmd.includes('front') ? 'user' : 'environment';
  startCameraScanner(facing);
  return;
}

if (commandHasAny(intentCmd, ['close camera', 'stop camera', 'camera off',
                               'turn off camera'])) {
  stopActiveStream();
  speakText('Camera off, Sir.');
  return;
}

if (commandHasAny(intentCmd, ['switch camera', 'flip camera', 'toggle camera'])) {
  toggleCameraFacing();
  return;
}

if (commandHasAny(intentCmd, ['take a photo', 'take photo', 'snap', 'capture'])) {
  takeVisualSnapshot();
  speakText('Photo captured, Sir.');
  return;
}
```

```js
// Updated startCameraScanner to accept facing param

async function startCameraScanner(facingMode = 'environment') {
  stopActiveStream();
  try {
    state.mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: facingMode } },
      audio: false
    });
    // ... rest of existing camera setup
    state.currentCameraFacing = facingMode;
    speakText(facingMode === 'user'
      ? 'Front camera active, Sir.'
      : 'Camera active, Sir. Point it at what you need me to analyse.'
    );
  } catch (err) {
    speakText('Camera access denied, Sir. Please allow camera permission and try again.');
  }
}

function toggleCameraFacing() {
  const next = state.currentCameraFacing === 'user' ? 'environment' : 'user';
  startCameraScanner(next);
}
```

### 8.3 Streaming TTS Pipeline

```
Gemini/Groq SSE stream → Sentence chunker → TTS queue → Audio output
        ↓
 First sentence arrives (~300ms)
        ↓
 Immediately pushed to Web Speech API
        ↓
 JARVIS starts speaking while rest still generating
```

```js
// modules/voice.js — streaming TTS

const ttsQueue = [];
let ttsActive  = false;

function pushToTTSQueue(sentence) {
  if (!sentence.trim()) return;
  ttsQueue.push(sentence.trim());
  if (!ttsActive) drainTTSQueue();
}

function drainTTSQueue() {
  if (!ttsQueue.length) { ttsActive = false; return; }
  ttsActive = true;
  const sentence = ttsQueue.shift();
  const utterance = new SpeechSynthesisUtterance(cleanTextForSpeech(sentence));
  utterance.voice  = state.lockedVoice;
  utterance.rate   = 1.05;
  utterance.pitch  = 0.92;
  utterance.onend  = () => drainTTSQueue();
  utterance.onerror = () => drainTTSQueue();
  window.speechSynthesis.speak(utterance);
}

// Stream parser — fires pushToTTSQueue on each complete sentence
function streamToTTS(readable) {
  let buffer = '';
  const reader = readable.getReader();
  const decoder = new TextDecoder();

  async function read() {
    const { done, value } = await reader.read();
    if (done) { if (buffer.trim()) pushToTTSQueue(buffer); return; }
    buffer += decoder.decode(value, { stream: true });
    // Split on sentence boundaries
    const chunks = buffer.split(/(?<=[.!?])\s+/);
    buffer = chunks.pop(); // Keep last incomplete sentence in buffer
    chunks.forEach(chunk => pushToTTSQueue(chunk));
    read();
  }
  read();
}
```

---

## 9. UI/UX Overhaul

### 9.1 Default State — Orb Only

The default state is a **single orb** centred on a living tech background. No header. No panels. No buttons. Nothing else visible.

Panels appear only when JARVIS decides to show them. They auto-dismiss.

### 9.2 Remove These Elements

| Element | Action |
|---|---|
| `<header class="app-header">` entire element | Delete |
| `<select id="voiceSelect">` and its label | Delete |
| `<select id="langSelect">` and its label | Delete |
| All `.tool-card` buttons (School, Reply, Ad, Animal) | Hidden by default. Show only on `"show tools"`. |
| `.advanced-settings-details` (Voice Settings accordion) | Delete visible version. Voice-only config. |
| `.music-panel` | Hidden. Show on voice command or when music starts. |
| `.scheduler-container` | Hidden. Show on `"show my schedule"`. |
| `.readme-panel` (manual tabs) | Hidden. Show on `"show help"`. |
| `<footer class="app-footer">` | Delete |
| `#statusDot` / `#statusText` | Removed. Orb colour handles all status. |
| `#btnToggleClap` | Removed. Voice-only: `"enable clap wake"`. |
| `#btnToggleFullScreen` | Removed. Tap background or say `"fullscreen"`. |
| `#voiceSubstatus` paragraph (instructions) | Removed. JARVIS gives instructions verbally. |
| `.voice-controls-grid` | Delete. All replaced with voice commands. |

### 9.3 Fullscreen Mode Fix

**Current problem:** `fs-topbar` and `fs-stats-grid` block the orb. `fs-floating-label` elements are decorative noise.

**Fix — CSS only:**

```css
/* FULLSCREEN — CLEAN BASE STATE */
.fullscreen-orb-overlay {
  background: transparent; /* Background handled by tech layer below */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Remove all overlay elements by default */
.fs-topbar,
.fs-stats-grid,
.fs-floating-label {
  display: none !important;
}

/* Exit button: hidden until mouse moves */
.btn-exit-fullscreen {
  display: none;
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.fullscreen-orb-overlay:hover .btn-exit-fullscreen {
  display: flex;
  opacity: 1;
}

/* Show stats only when JARVIS says "show stats" */
.fullscreen-orb-overlay.show-stats .fs-stats-grid {
  display: grid;
}

/* Transcript below orb — replaces all the decorative labels */
.fs-live-transcript {
  position: absolute;
  bottom: 15%;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  max-width: 600px;
  padding: 0 20px;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.fs-live-transcript.visible {
  opacity: 1;
}

.fs-user-transcript {
  font-family: 'Rajdhani', sans-serif;
  font-size: 16px;
  color: rgba(212, 228, 250, 0.55);
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.fs-jarvis-response {
  font-family: 'Orbitron', sans-serif;
  font-size: 18px;
  color: #C6A85C;
  text-shadow: 0 0 12px rgba(198, 168, 92, 0.5);
  line-height: 1.5;
  letter-spacing: 1.5px;
}
```

### 9.4 Tech-Themed Background (Not Plain Black)

The background must feel like a living system environment. Never static. Never plain.

**Recommended approach — three layered backgrounds:**

**Layer 1 — Animated mesh gradient base:**
```css
body, .fullscreen-orb-overlay {
  background:
    radial-gradient(ellipse at 15% 25%, rgba(0, 80, 160, 0.22) 0%, transparent 45%),
    radial-gradient(ellipse at 85% 75%, rgba(0, 40, 120, 0.18) 0%, transparent 40%),
    radial-gradient(ellipse at 50% 50%, rgba(0, 15, 45, 0.95) 0%, rgba(2, 8, 20, 1) 100%);
  background-color: #020814; /* Deep space navy — NOT #000 */
}
```

**Layer 2 — Animated circuit grid:**
```css
.tech-grid-overlay {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(0, 191, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 191, 255, 0.04) 1px, transparent 1px);
  background-size: 60px 60px;
  animation: gridPulse 8s ease-in-out infinite;
}

@keyframes gridPulse {
  0%, 100% { opacity: 0.4; }
  50%       { opacity: 0.9; }
}
```

**Layer 3 — Scanning line effect:**
```css
.scan-line {
  position: fixed;
  top: -100%;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(0, 191, 255, 0.6) 30%,
    rgba(198, 168, 92, 0.4) 50%,
    rgba(0, 191, 255, 0.6) 70%,
    transparent 100%
  );
  animation: scanDown 12s linear infinite;
  pointer-events: none;
  z-index: 1;
}

@keyframes scanDown {
  from { top: -2px; }
  to   { top: 100vh; }
}
```

**Layer 4 — Corner HUD brackets (static, CSS only):**
```css
.hud-corners::before,
.hud-corners::after {
  content: '';
  position: fixed;
  width: 40px;
  height: 40px;
  pointer-events: none;
  z-index: 2;
}

.hud-corners::before {
  top: 16px;
  left: 16px;
  border-top: 1.5px solid rgba(0, 191, 255, 0.4);
  border-left: 1.5px solid rgba(0, 191, 255, 0.4);
}

.hud-corners::after {
  bottom: 16px;
  right: 16px;
  border-bottom: 1.5px solid rgba(198, 168, 92, 0.3);
  border-right: 1.5px solid rgba(198, 168, 92, 0.3);
}
```

**Combined result:** Deep space navy base → subtle blue circuit grid → slow scanning line → faint HUD brackets in corners → existing stardust canvas on top. This looks like a legitimate sci-fi control room, not a plain black page.

### 9.5 Orb States

| State | Orb Appearance |
|---|---|
| Standby | Slow blue pulse, 50% opacity |
| Listening | Fast red pulse, ring expands with mic volume in real-time |
| Thinking | Gold slow rotation, pulsing inner glow |
| Speaking | Gold/cyan alternating glow, scales with audio amplitude |
| Camera active | Teal ring with camera icon in orb pulse |
| Error | Red flash × 3, returns to standby |
| Integration active | Ring colour = green (calendar), blue (email), green-olive (WhatsApp) |

---

## 10. Camera Voice Commands (Full List)

| Voice Command | Action |
|---|---|
| `"Open camera"` | Starts rear camera, shows in feed |
| `"Start camera"` | Same |
| `"Camera scan"` | Opens camera, immediately runs Gemini Vision OCR |
| `"Front camera"` | Opens front-facing camera |
| `"Back camera"` / `"Rear camera"` | Opens rear camera |
| `"Switch camera"` / `"Flip camera"` | Toggles between front and rear |
| `"Take a photo"` / `"Snap"` / `"Capture"` | Saves a still from current camera feed |
| `"Close camera"` / `"Stop camera"` / `"Camera off"` | Stops stream, clears feed |
| `"Read what the camera sees"` | Runs OCR + Gemini Vision on current camera frame |
| `"Scan this with camera"` | Same as above |
| `"What is this?"` (with camera active) | Gemini Vision describes the object in frame |
| `"Translate this"` (with camera active) | Reads text via OCR + translates if non-English |

---

## 11. Complete Voice Command Reference

### Core
| Command | Action |
|---|---|
| `"JARVIS"` / `"Hey JARVIS"` | Wake / acknowledge |
| `"Stop"` / `"Enough"` | Cancel current speech immediately |
| `"Go to sleep"` / `"Standby"` | Pause listening, orb dims to 20% |
| `"Wake up"` | Resume from standby |
| `"What can you do"` | JARVIS reads capability summary |

### Screen & Vision
| Command | Action |
|---|---|
| `"Read my screen"` | OCR + Gemini Vision on shared screen |
| `"What's on my screen"` | Same |
| `"Explain this"` | Explains current screen content |
| `"Help me with this"` | School/homework mode |
| `"Suggest a reply"` | Drafts reply from visible message |
| `"Summarise this page"` | Summarises current screen |
| `"Take a screenshot"` | Saves screen capture |
| `"Share my screen"` | Opens screen share prompt |
| `"Stop screen sharing"` | Ends screen share |

### Camera (New in v2)
| Command | Action |
|---|---|
| `"Open camera"` | Starts rear camera |
| `"Front camera"` | Starts front camera |
| `"Switch camera"` | Toggles facing |
| `"Camera scan"` | Camera → immediate Vision analysis |
| `"Take a photo"` | Captures still |
| `"Close camera"` | Stops stream |
| `"What is this?"` | Gemini Vision identifies object |

### Files & Directories
| Command | Action |
|---|---|
| `"Open my [folder] folder"` | Opens directory picker |
| `"Show my files"` | Opens file tree panel |
| `"Read [filename]"` | Opens and reads file aloud |
| `"Edit [filename]"` | Opens inline editor |
| `"Create a file called [name]"` | Creates new file |
| `"Save this"` | Saves current edit |
| `"Delete [filename]"` | Confirms then deletes |
| `"Rename [filename] to [new name]"` | Renames file |
| `"Find [term] in my files"` | Searches open directory |

### Calendar
| Command | Action |
|---|---|
| `"What's on today"` | Reads today's events from Google Calendar |
| `"What's on tomorrow"` | Reads tomorrow's events |
| `"What's this week look like"` | Week summary |
| `"Am I free at [time]"` | Checks for conflicts |
| `"Add [event] at [time] on [date]"` | Creates event |
| `"Cancel my [event]"` | Deletes event |
| `"Move [event] to [new time]"` | Reschedules |

### Email
| Command | Action |
|---|---|
| `"Read my emails"` | Reads last 5 unread Gmail |
| `"Any emails from [person]"` | Filter by sender |
| `"Reply saying [message]"` | Drafts reply, reads back, confirms before send |
| `"Send an email to [person] about [subject]"` | Full compose flow |
| `"Archive that"` | Archives current email |
| `"Delete that"` | Deletes current email |

### WhatsApp
| Command | Action |
|---|---|
| `"Read my WhatsApp"` | Opens WA Web / reads screen (Phase 1) |
| `"Reply to [name] on WhatsApp saying [message]"` | Opens WA with pre-filled text |
| `"Open WhatsApp"` | Opens WhatsApp Web |

### Music
| Command | Action |
|---|---|
| `"Play music"` | Plays current track |
| `"Pause"` / `"Stop music"` | Pauses playback |
| `"Next"` / `"Skip"` | Next track |
| `"Play [song title]"` | Plays by title |
| `"Volume up"` / `"Volume down"` | Adjusts volume |
| `"Repeat this song"` | Loops current track |
| `"Show playlist"` | Shows music panel |
| `"Add music"` | Opens audio file picker |

### Weather & News
| Command | Action |
|---|---|
| `"What's the weather"` | Current conditions + today's forecast |
| `"Weather in [city]"` | Weather for specific location |
| `"What's the news"` | Top 3 news headlines |
| `"Tech news"` / `"Sports news"` | Category-filtered news |
| `"News in Zambia"` | Regional news filter |

### Settings & Memory
| Command | Action |
|---|---|
| `"Remember [fact]"` | Stores to persistent memory |
| `"What do you remember"` | Reads recent memory |
| `"Forget [fact]"` | Removes specific memory |
| `"Dark mode"` / `"Light mode"` | Theme switch |
| `"Particles on"` / `"Particles off"` | Toggles effects |
| `"System check"` | Reports all system statuses |
| `"Clear logs"` | Clears conversation history |
| `"Show settings"` | Opens settings panel |
| `"Connect Google"` | Triggers Google OAuth |
| `"Enable clap wake"` | Activates clap detection |
| `"Show controls"` | Reveals emergency manual controls |

### UI
| Command | Action |
|---|---|
| `"Fullscreen"` / `"Immersive mode"` | Enters fullscreen orb view |
| `"Exit fullscreen"` | Returns to normal view |
| `"Show tools"` | Shows quick action panel |
| `"Show help"` | Shows command reference panel |
| `"Show conversation"` | Shows caption log |
| `"Close that"` / `"Hide it"` / `"Got it"` | Dismisses current panel |
| `"Show stats"` | Shows system stats in fullscreen |

---

## 12. API Token Exhaustion Strategy

Never let JARVIS go silent because one API ran out. The router must:

1. Track API call count per session in memory (not localStorage).
2. Track estimated remaining quota based on known free limits.
3. When primary is at 80% of estimated quota, begin routing to secondary.
4. When primary fails with a 429 or 401, immediately mark it as exhausted for the session and use the fallback — no retry.
5. At session end (page close), reset counters.

```js
// modules/ai.js — quota tracker

const quotaTracker = {
  gemini:    { used: 0, limit: 1400 }, // Conservative estimate of daily free limit
  groq:      { used: 0, limit: 14000 },
  cohere:    { used: 0, limit: 1000 },
  brave:     { used: 0, limit: 2000 },
  serper:    { used: 0, limit: 100 },
  gnews:     { used: 0, limit: 100 },
  openweather:{ used: 0, limit: 50000 },
};

function isQuotaAvailable(service) {
  const t = quotaTracker[service];
  return t ? t.used < t.limit * 0.9 : true; // 90% threshold
}

function recordCall(service) {
  if (quotaTracker[service]) quotaTracker[service].used++;
}
```

---

## 13. Edge Cases & Failure Modes

### Voice
- **Accented speech:** Fuzzy matching, Levenshtein ≤ 2 on all command matching.
- **JARVIS talking to itself:** Block recognition results for 2.5s after TTS ends. Levenshtein guard on transcript vs last spoken text.
- **Mic permission denied:** Single full-screen prompt: "Microphone required. [Allow Access] button." Nothing else shown.
- **Safari iOS (no Web Speech API):** Show single text input. Say: *"Voice isn't available here, Sir. You can type."*

### Camera
- **No rear camera (desktop):** Fall back to front camera. Say: *"Using your webcam, Sir."*
- **Camera permission denied:** Say: *"Camera access blocked, Sir. Please allow it in your browser settings."*
- **Camera and screen share both active:** Stop screen share before starting camera. Say: *"Switching to camera, Sir."*
- **Poor lighting for OCR:** Say: *"The image is too dark to read clearly, Sir. Could you improve the lighting?"*

### Integrations
- **Google token expired:** Silently refresh. If refresh fails: *"My Google access expired, Sir. Reconnecting now."* → trigger OAuth.
- **Calendar conflict:** *"You have [X] at that time, Sir. Shall I find the next free slot?"*
- **Gmail rate limit:** Serve from cache. *"I'm using cached email data from [X] minutes ago, Sir."*
- **All AI models down:** Serve local knowledge answers only. Say: *"My AI connections are offline, Sir. I can still help with local tasks."*

### File System
- **Permission revoked:** *"I've lost file access, Sir. Say 'open my files' to reconnect."*
- **File > 10MB:** *"That file is [X]MB, Sir. Reading the first section."* → first 5000 characters.
- **Binary file:** *"That's a binary file, Sir. I can't read it, but I can open it for you."*
- **File name conflict on create:** *"A file named [X] exists. Overwrite it or create [X]_2?"*

### GitHub Pages Specific
- **API keys accidentally committed:** Add a `git hooks` pre-commit check that scans for `config.js` in staged files and blocks the commit if found.
- **CORS errors on API calls:** Gemini, Groq, Brave, DuckDuckGo, and Pollinations are all CORS-friendly from browser. Any service that is not can be routed through `https://corsproxy.io/?` as a last resort.
- **Service Worker caching stale API responses:** Never cache API responses in the service worker. Cache only `index.html`, `styles.css`, `app.js`, fonts, and the orb image.

---

## 14. Privacy & Security

- **Microphone:** Always on for VAD. Audio only sent to Web Speech API when user is actively speaking to JARVIS after wake word.
- **Camera:** Off by default. Activated only by voice command or button. Stream never sent anywhere without explicit analysis command.
- **API keys:** In `config.js` only. Never in localStorage. Never logged. `.gitignore` must list `config.js`.
- **OAuth tokens:** Stored in IndexedDB only (not localStorage — safer against XSS).
- **Email content:** Never logged to the visible caption area. Shown in slide-in panel only. Never sent to any third-party AI unless user says *"read and analyse this email."*
- **File content:** Never sent to any API without explicit verbal confirmation from user.

---

## 15. Phase Plan

### Phase 1 — Foundation (4–6 weeks)
- [ ] Remove all visible buttons/panels — voice-first UI
- [ ] Lock JARVIS voice (Google UK English Male / Daniel)
- [ ] Fix fullscreen mode — remove top bar and stats overlay
- [ ] Replace plain black with tech-themed background (grid + scan line + mesh gradient)
- [ ] Implement streaming TTS pipeline (sentence chunking)
- [ ] Replace Pollinations with Gemini Flash streaming + Groq fallback
- [ ] Add camera open by voice (front + rear + switch + scan)
- [ ] VAD-based wake word (`@ricky0123/vad-web`)
- [ ] Persistent memory (IndexedDB)
- [ ] File System Access API (read/write local files)
- [ ] Slide-in panel system (contextual UI)
- [ ] Real Google Calendar integration (OAuth PKCE + API)
- [ ] Real Gmail integration
- [ ] Weather API integration (OpenWeatherMap → WeatherAPI fallback)
- [ ] News API integration (GNews → NewsAPI → RSS2JSON)
- [ ] API quota tracker + auto-fallback router
- [ ] `config.js` with all API key slots

### Phase 2 — Integrations (4–6 weeks)
- [ ] WhatsApp Web screen reading via Vision API
- [ ] Facebook Graph API (notifications + feed)
- [ ] ElevenLabs premium voice option
- [ ] Electron/Tauri desktop wrapper
- [ ] whatsapp-web.js native WhatsApp integration
- [ ] Web Notifications API (alarms fire even when tab is not active)
- [ ] Cross-device sync (JSONBin → Supabase migration)

### Phase 3 — Intelligence (Ongoing)
- [ ] Proactive JARVIS (notices patterns, makes suggestions)
- [ ] Long-term user profile
- [ ] Agentic task chains (multi-step: *"draft, review, send"*)
- [ ] Custom skill plugins (user-defined voice commands)
- [ ] Web agent mode (JARVIS browses on your behalf)

---

## 16. File Structure (v2)

```
ANICADE-JARVIS/
├── index.html              # Minimal shell — orb + tech background + panels
├── styles.css              # Orb, panel system, tech background, fullscreen fix
├── app.js                  # Main orchestrator
├── config.js               # ← ADD TO .gitignore. All API keys go here.
├── config.example.js       # ← Commit this. Template with empty key slots.
├── .gitignore              # Must include: config.js, node_modules, .env
├── modules/
│   ├── voice.js            # VAD, STT, TTS, streaming pipeline, JARVIS voice lock
│   ├── ai.js               # Model router, Gemini, Groq, Cohere, Pollinations
│   ├── memory.js           # IndexedDB memory + JSONBin sync
│   ├── integrations/
│   │   ├── google.js       # OAuth PKCE, Calendar API, Gmail API
│   │   ├── whatsapp.js     # Deep link (Phase 1) / whatsapp-web.js (Phase 2)
│   │   └── facebook.js     # Graph API
│   ├── filesystem.js       # File System Access API
│   ├── scheduler.js        # Alarms, reminders, Web Notifications
│   ├── commands.js         # Voice command router + fuzzy matcher + camera
│   ├── search.js           # Brave → Serper → DuckDuckGo → Wikipedia chain
│   ├── weather.js          # OpenWeatherMap → WeatherAPI → Open-Meteo chain
│   ├── news.js             # GNews → NewsAPI → RSS2JSON chain
│   └── particles.js        # Canvas effects (tech background + orb particles)
├── panels/
│   ├── calendar.html       # Calendar slide-in panel
│   ├── email.html          # Email slide-in panel
│   ├── files.html          # File tree slide-in panel
│   ├── music.html          # Music player panel
│   ├── settings.html       # Settings panel (API key input, connect Google)
│   └── tools.html          # Quick tools panel (shown on "show tools")
├── sw.js                   # Service worker — cache app shell only, never API responses
├── manifest.json           # PWA manifest
└── README.md
```

---

## 17. Success Criteria

ANICADE JARVIS v2 is complete when:

1. A user can say `"JARVIS"` and get a response within 800ms — every time.
2. The background is a tech-themed living environment, not plain black.
3. Fullscreen mode shows only the orb and transcript — no overlaid bars.
4. Voice is always JARVIS (`Google UK English Male` or `Daniel`) with no selector visible.
5. `"Open camera"` opens the camera. `"Front camera"` opens the front camera. `"Camera scan"` reads what the camera sees.
6. `"What's on my calendar today"` returns real Google Calendar data.
7. `"Read my latest email"` reads the sender and subject of the most recent Gmail.
8. `"Open my projects folder"` → `"Read the readme file"` → JARVIS reads it.
9. Asking the same question when Gemini is rate-limited still gets a response (Groq fallback fires automatically).
10. The entire session — from wake to file editing to email reply — can complete without the user touching a mouse or keyboard once.

---

*Built by ANICADE TECH · Tresfor Zulu · Lusaka/Kabwe, Zambia*
*Hosted: `https://tresforwrld.github.io/ANICADE-JARVEE/`*
*Document version: 2.1 · May 2026*
