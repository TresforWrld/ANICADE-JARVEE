# ANICADE JARVIS — Product Requirements Document
## Version 2.0 · ANICADE TECH · Tresfor Zulu
**Status:** READY TO BUILD · **Classification:** INTERNAL — CORE PRODUCT

---

## 0. North Star

> **JARVIS must feel like a person who lives in your machine — not a website you visit.**

Every decision in this document flows from that sentence. JARVIS is not a chatbot. It is not a dashboard. It is a permanently-on, voice-native AI agent that reads your screen, controls your files, reads your email, replies to WhatsApp, manages your calendar, and speaks back with a single locked voice — all without the user ever touching a button. The UI exists only to confirm what JARVIS is doing, never to prompt the user to do anything manually.

---

## 1. What Is Wrong With v1 (Honest Audit)

| Problem | Impact |
|---|---|
| Manual buttons everywhere — contradicts "voice first" | User must click to do anything meaningful |
| Voice selector visible in UI | Breaks immersion; JARVIS should just sound like JARVIS |
| Fullscreen top bar overlays the orb | The most important visual element gets blocked |
| Pollinations AI is slow and inconsistent | Responses feel sluggish; long pauses break the conversational feel |
| No real integrations — Calendar/WhatsApp/Email are mock data | Entirely fake; trust-destroying once discovered |
| OCR via Tesseract.js is slow and low-accuracy | Screen reading fails on complex layouts |
| No local file access | Can't edit a Word doc, rename a folder, or open a directory |
| Conversation memory resets on page close | JARVIS forgets everything between sessions |
| Self-transcription loopback still fires occasionally | JARVIS talks to itself |
| Persona system is largely ignored | All three personas sound identical |
| Clap wake is unreliable (basic threshold) | Triggers on ambient noise, misses real claps |
| No streaming — full response generated then spoken | 2–4 second silence before JARVIS speaks |
| Status bar in fullscreen obscures the orb | The centrepiece of the UI is hidden |
| Tools grid and manual panels should be voice-only | All panels should be hidden by default, shown on command |

---

## 2. Guiding Principles for v2

1. **Voice is the only input that matters.** Every feature must be triggerable by voice. Buttons are emergency fallbacks only, hidden by default.
2. **JARVIS speaks first.** Streaming must begin within 400ms of the user finishing a sentence.
3. **The UI confirms; it does not prompt.** Panels slide in when JARVIS wants to show something (a schedule, a document, an email). They slide away when the task is done.
4. **One voice. Always.** No selector. JARVIS picks `Google UK English Male` or `Daniel` silently at boot and stays there.
5. **Real data or nothing.** Mock app data must be replaced with live OAuth integrations. If an integration is unavailable, JARVIS says so honestly.
6. **Memory is permanent.** Conversation context, user facts, and preferences survive tab closes, reboots, and device switches.
7. **Local-first with cloud sync.** Everything works offline. Cloud sync adds persistence and cross-device capability.

---

## 3. Target Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    ANICADE JARVIS v2                     │
│                                                          │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────┐  │
│  │  Voice Core │   │  Vision Core │   │  Agent Core  │  │
│  │             │   │              │   │              │  │
│  │ Always-On   │   │ Screen Share │   │ Gemini Flash │  │
│  │ VAD (RNN)   │   │ Gemini Pro   │   │ + Claude API │  │
│  │ Streaming   │   │ Vision API   │   │ Tool calling │  │
│  │ TTS Buffer  │   │ OCR fallback │   │ Memory store │  │
│  └─────────────┘   └──────────────┘   └──────────────┘  │
│           │                │                   │         │
│           └────────────────┴───────────────────┘         │
│                            │                             │
│                   ┌────────────────┐                     │
│                   │  Integration   │                     │
│                   │  Layer         │                     │
│                   │                │                     │
│                   │ Google OAuth   │                     │
│                   │ Calendar API   │                     │
│                   │ Gmail API      │                     │
│                   │ WA Web JS      │                     │
│                   │ Facebook Graph │                     │
│                   │ File System    │                     │
│                   │ Access API     │                     │
│                   └────────────────┘                     │
│                            │                             │
│                   ┌────────────────┐                     │
│                   │  Memory Layer  │                     │
│                   │                │                     │
│                   │ IndexedDB      │                     │
│                   │ (facts, logs,  │                     │
│                   │  files, sched) │                     │
│                   │ JSONBin sync   │                     │
│                   └────────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Voice Core — Requirements

### 4.1 Wake Word Detection
- Replace simple keyword matching with a **VAD (Voice Activity Detection)** approach using the `@ricky0123/vad-web` library (RNNoise-based, runs entirely in-browser via WASM).
- Wake word: `"JARVIS"` — hardcoded, not configurable via UI (can be changed in `config.js`).
- VAD fires only when human speech starts. Microphone is always open but CPU cost stays near zero when silent.
- Additional trigger: double-clap (use proper spectral peak detection at 1.2–3.5kHz, not amplitude threshold).

### 4.2 Speech Recognition
- Primary: `webkitSpeechRecognition` (Chromium) with `continuous: true`, `interimResults: true`.
- Secondary (mobile/Safari fallback): `SpeechRecognition` standard API.
- Interim results drive a live transcript display in the UI that appears while the user is speaking.
- Self-transcription guard: cancel all recognition results that fire within 2.5s of speech synthesis end AND score >0.35 Levenshtein similarity to last spoken text.

### 4.3 Speech Synthesis — JARVIS Voice Only
- On boot: silently scan `window.speechSynthesis.getVoices()`.
- Priority order: `Google UK English Male` → `Daniel` → `Arthur` → first `en-GB` voice available.
- **Do not expose voice selection in UI. Do not log voice name in captions.**
- All other voices are discarded. `voiceSelect` element is removed from the DOM entirely.
- Rate: `1.05`, Pitch: `0.92` — slightly lower and slightly faster than default for authority.

### 4.4 Streaming TTS Pipeline (Critical for Speed)
Current v1 waits for the full AI response before speaking. This must be replaced:

```
AI Response Stream → Sentence Chunker → TTS Queue → Audio Output
```

1. Begin streaming from AI API (Gemini or Claude).
2. As each sentence (or ~60-character chunk ending in punctuation) arrives, push to TTS queue.
3. TTS queue speaks chunk 1 while chunk 2 is still being generated.
4. **Target: first word spoken within 400ms of user finishing speech.**

### 4.5 Interruption Handling
- User can say `"stop"` or `"enough"` mid-response to immediately cancel TTS and recognition.
- Use `speechSynthesis.cancel()` and reset state cleanly.
- Do not restart voice listening for 300ms after cancellation.

---

## 5. AI Engine — Requirements

### 5.1 Primary Model: Gemini 2.0 Flash
Use Gemini 2.0 Flash for **all multimodal tasks** (screen reading, image analysis) because it:
- Has native vision capability
- Returns first token in ~300ms
- Is free-tier friendly
- Supports streaming via Server-Sent Events

API endpoint:
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent
```

### 5.2 Secondary Model: Claude claude-sonnet-4-20250514 (Text/Reasoning)
Use Claude Sonnet via Anthropic API for **complex reasoning, writing, and agentic tasks** (drafting emails, summarising documents, structured planning). Claude's strength is long-context comprehension and nuanced writing.

```js
// Streaming from Anthropic
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    stream: true,
    system: JARVIS_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }]
  })
});
```

### 5.3 Model Router
JARVIS must decide which model to call based on the task:

| Task | Model | Why |
|---|---|---|
| Screen reading / OCR | Gemini Flash Vision | Multimodal, fast |
| General Q&A / chat | Gemini Flash | Speed |
| Long document summary | Claude Sonnet | Context window, quality |
| Email drafting | Claude Sonnet | Nuanced writing |
| Real-time search results summary | Gemini Flash | Speed |
| Math / logic problems | Claude Sonnet | Reasoning |
| Image ad generation | Pollinations (prompt from Gemini) | Free image gen |

### 5.4 System Prompt (JARVIS Persona — Non-Negotiable)
```
You are JARVIS — the AI of ANICADE TECH, built by Tresfor Zulu. 
You are a highly capable, permanently-on voice assistant. 
You are British, witty, precise, and loyal. You address the user as "Sir."
You never mention your underlying model, APIs, or technical stack.
You never say "I am an AI" or "As a language model."
You speak in complete, natural sentences as if in real-time conversation.
You keep responses concise unless depth is explicitly requested.
You have access to the user's calendar, email, files, and screen.
You remember everything the user tells you across sessions.
When asked to perform an action (send email, create file, add event), you confirm 
the action and its outcome naturally in speech.
```

### 5.5 Persistent Memory
- Store a structured memory object in IndexedDB: `{ facts: [], preferences: {}, recentTopics: [] }`.
- After each conversation turn, extract notable facts (name mentions, preferences, decisions) and append to memory.
- Inject the last 10 memory facts into every AI system prompt.
- User can say `"forget that"` or `"clear your memory"` to wipe specific entries.

---

## 6. Integration Layer — Requirements

### 6.1 Google Calendar & Gmail

**Authentication:**
Use Google Identity Services (GIS) OAuth 2.0 PKCE flow. On first run JARVIS says:
> *"Sir, I'll need your Google account to access your calendar and email. Opening the authorisation window now."*

```js
// Scopes needed
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/gmail.modify'
];
```

**Calendar Commands:**
- `"What's on my calendar today / tomorrow / this week"`
- `"Add a meeting with [name] at [time] on [date]"`
- `"Cancel my 3pm"`
- `"Move Tuesday's standup to Thursday"`
- `"Am I free at 2pm?"`

**Gmail Commands:**
- `"Read my latest emails"`
- `"Any emails from [person/company]?"`
- `"Reply to [sender] saying [message]"` — JARVIS drafts, reads it back, confirms before sending
- `"Delete that / Archive that"`
- `"Send an email to [name] about [subject]"`

**Implementation Notes:**
- Cache the last 20 calendar events and 30 emails in IndexedDB for offline/fast access.
- Refresh cache on wake and every 5 minutes when tab is active.
- Never auto-send email without reading it back and getting verbal confirmation from user: *"Shall I send that, Sir?"*

### 6.2 WhatsApp

**Approach:** WhatsApp does not have a public API for personal accounts. Two options, in order of preference:

**Option A (Recommended): whatsapp-web.js via a local Electron/Node server**
- JARVIS (when running as a desktop PWA via Electron) spawns a local Node server with `whatsapp-web.js`.
- QR code scan on first launch pairs the user's WhatsApp account.
- JARVIS can then: read recent chats, send messages, read unread messages.
- Voice commands: `"Read my WhatsApp messages"`, `"Reply to [name] on WhatsApp saying [message]"`.

**Option B (Browser fallback): Web Share Target + Deep Link**
- On mobile, open `https://wa.me/[number]?text=[message]` which hands off to the WhatsApp app.
- On desktop, open `https://web.whatsapp.com` and use screen-reading to identify conversation content.

**For PRD purposes, implement Option B first (Phase 1), then Option A in Phase 2.**

### 6.3 Facebook

**Authentication:** Facebook Graph API, App ID required.

**Scope:** `pages_messaging`, `user_posts`, `pages_read_engagement`

**Commands:**
- `"Read my Facebook notifications"`
- `"What's new on Facebook"`
- `"Post to Facebook: [text]"` — confirm before posting

**Note:** Facebook Graph API requires App Review for most personal messaging scopes. In Phase 1, implement notifications and feed reads only. Messaging requires approved app.

### 6.4 File System Access API (Local Files & Directories)

This is the most powerful and distinguishing feature. The **File System Access API** is supported in Chrome/Edge and allows true read/write access to the local file system without Electron.

```js
// Open a directory
const dirHandle = await window.showDirectoryPicker();
await dirHandle.requestPermission({ mode: 'readwrite' });

// Read a file
const fileHandle = await dirHandle.getFileHandle('report.txt');
const file = await fileHandle.getFile();
const text = await file.text();

// Write a file
const writable = await fileHandle.createWritable();
await writable.write('Updated content here');
await writable.close();
```

**Voice Commands — File System:**
- `"Open my documents folder"` → shows folder contents panel
- `"Read [filename]"` → reads the file aloud / shows in output panel
- `"Edit [filename]"` → opens inline editor panel
- `"Create a new file called [name]"` → creates file in current directory
- `"Delete [filename]"` → confirms before deleting
- `"Rename [filename] to [new name]"`
- `"Open [filename] in [app]"` → if PWA, hands off to OS; if browser, opens in new tab

**Implementation:**
- Store `FileSystemDirectoryHandle` in IndexedDB for persistence (re-grant permission on next session).
- Show a file tree panel in the UI when a directory is opened — panel auto-hides after 30s inactivity.
- Support `.txt`, `.md`, `.json`, `.csv`, `.html`, `.js`, `.css`, `.py` for inline reading/editing.
- For `.docx`, `.pdf`, read-only extraction via existing Tesseract/docx-reader approach.

---

## 7. UI/UX Overhaul — Requirements

### 7.1 Core Philosophy: Invisible Until Needed

The default state of ANICADE JARVIS is a **black screen with a single pulsing orb**. Nothing else is visible. No header. No panels. No buttons. No text. Just the orb.

Panels slide in from appropriate edges **only when JARVIS has something to show**:
- Calendar events → slide in from right
- File tree → slide in from left
- Email → slide in from right
- Transcript / captions → fade in at bottom
- Screen analysis result → fade in above orb

All panels auto-dismiss after 15 seconds of no interaction, or when user says `"close that"` / `"hide that"`.

### 7.2 Remove These Elements Permanently

| Element | Action |
|---|---|
| Header bar (brand + status + install button) | **Remove entirely.** JARVIS announces its own status verbally. |
| Voice Profile selector (`<select>`) | **Remove from DOM.** Voice is locked to JARVIS silently. |
| Language selector (visible) | Move to hidden `config.js` only. |
| Tool cards grid (School, Reply, Ad Banner, Animal) | **Remove as permanent UI.** Show as a slide-in panel only when user asks `"show tools"`. |
| Voice Settings `<details>` accordion | Replace with voice-only configuration. |
| All `<button>` elements except emergency fallbacks | Hide by default. Accessible only via keyboard shortcut or specific voice command `"show controls"`. |
| Music panel (always visible) | Hide. Show only when music is playing or user says `"show music player"`. |
| Schedule list (always visible) | Hide. Show only when user says `"show my schedule"`. |
| README / manual tabs section | Hide. Show only when user says `"show help"`. |
| Footer | Remove entirely. |
| Status text "Systems Active" | Replaced by orb colour state only. |
| Clap Wake button | Remove. Enable/disable by voice: `"enable clap wake"`. |
| Fullscreen button | Tap anywhere on the black background to enter fullscreen. |

### 7.3 Fullscreen Mode — Fix the Overlay Problem

**Current problem:** The fullscreen top bar (`fs-topbar`) with "ANICADE.VISION / CORE STABLE / VOICE VISION MEMORY" overlays the entire top third of the screen and covers the orb on smaller screens.

**Fix:**
1. Remove `fs-topbar` entirely from fullscreen mode.
2. Remove `fs-stats-grid` (the bottom stats bar) from default state. Show it only when user says `"system status"`.
3. Remove `fs-floating-label` elements (SYNAPTIC LOAD, NEURAL LINK). These are decorative noise.
4. The fullscreen view is: **black background → animated orb → live transcript text below it**. That is all.
5. The transcript text fades in when JARVIS is speaking and fades out 5 seconds after speech ends.

```css
/* FULLSCREEN — CLEAN STATE */
.fullscreen-orb-overlay {
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fs-topbar,
.fs-stats-grid,
.fs-floating-label,
.btn-exit-fullscreen {
  display: none; /* Hidden by default */
}

/* Show exit button only on mouse movement */
.fullscreen-orb-overlay:hover .btn-exit-fullscreen {
  display: flex;
  animation: fadeIn 0.3s ease;
}

/* Show stats only on voice command */
.fullscreen-orb-overlay.show-stats .fs-stats-grid {
  display: grid;
}
```

### 7.4 Orb States

| State | Orb Appearance |
|---|---|
| Standby | Slow blue pulse, 50% opacity |
| Listening | Fast red pulse, ring expands with mic volume |
| Thinking | Gold rotation animation |
| Speaking | Gold/cyan alternating glow, scales with audio amplitude |
| Error | Brief red flash, returns to standby |
| Integration active | Ring colour matches integration (green=calendar, blue=email) |

### 7.5 Transcript Display
- Show the live interim transcript (user speaking) as faint text above the orb.
- Show JARVIS's response below the orb as it streams in.
- Both fade out 8 seconds after the exchange ends.
- Font: Orbitron for JARVIS responses, Rajdhani for user transcript.
- No scrolling log visible by default — JARVIS says `"show conversation"` to reveal the full log.

### 7.6 Slide-In Panels (Contextual UI)
Each panel has the same structure: slides in, shows content, auto-dismisses.

```
Panel types:
• file-panel (left) — directory tree + file viewer
• calendar-panel (right) — today/tomorrow events
• email-panel (right) — email list / email body
• schedule-panel (right) — reminders
• music-panel (bottom) — now playing + controls
• output-panel (bottom) — latest answer, copy button
• settings-panel (left) — wake word, API keys, integrations
• tools-panel (centre) — quick action cards (on request)
```

Each panel has a close button AND voice dismiss (`"close that"`, `"hide it"`, `"thanks"`, `"got it"`).

---

## 8. Local-First Desktop Mode (Electron/Tauri)

For full local file access, WhatsApp integration, and system-level capabilities, ANICADE JARVIS should ship as a **desktop application** in Phase 2. Recommended: **Tauri** (smaller bundle than Electron, Rust backend, web frontend).

Phase 1 delivers the browser PWA with File System Access API.
Phase 2 delivers the Tauri desktop app with:
- whatsapp-web.js integration
- Native file system (no permission prompts)
- Tray icon + always-on-top orb mode
- System audio capture (screen reading without screen share)
- Startup on login
- OS notification integration

---

## 9. Performance Requirements

| Metric | Target |
|---|---|
| Wake word to first spoken word | < 800ms |
| Simple Q&A response start | < 400ms (streaming) |
| Screen read (OCR + analysis) | < 3 seconds |
| Calendar fetch (cached) | < 200ms |
| Email fetch (cached) | < 300ms |
| Panel slide-in animation | 200ms ease-out |
| Voice recognition lag | < 150ms (interim results) |
| Memory note save | < 50ms (IndexedDB) |

---

## 10. Command Reference — Complete v2 List

### Core Voice
| Command | Action |
|---|---|
| `"JARVIS"` / `"Hey JARVIS"` | Wake / acknowledge |
| `"Stop"` / `"Enough"` | Cancel current speech |
| `"Go to sleep"` / `"Standby"` | Pause listening, orb dims |
| `"Wake up"` | Resume from standby |
| `"What can you do"` | JARVIS reads capability summary |

### Screen & Vision
| Command | Action |
|---|---|
| `"Read my screen"` | OCR + Gemini Vision analysis |
| `"What's on my screen"` | Same as above |
| `"Explain this"` | Explain current screen content |
| `"Help me with this"` | School/homework analysis |
| `"Suggest a reply"` | Draft reply from visible message |
| `"Summarise this page"` | Summarise current screen content |
| `"Take a screenshot"` | Capture and save |
| `"Share my screen"` | Opens screen share prompt |
| `"Stop screen sharing"` | Ends screen share |

### Files & Directories
| Command | Action |
|---|---|
| `"Open my [folder name] folder"` | Opens directory picker |
| `"Show my files"` | Opens file tree panel |
| `"Read [filename]"` | Opens and reads file |
| `"Edit [filename]"` | Opens inline editor |
| `"Create a file called [name]"` | Creates new file |
| `"Save this"` | Saves current edit |
| `"Delete [filename]"` | Confirms then deletes |
| `"Rename [filename] to [new name]"` | Renames file |
| `"Find [term] in my files"` | Searches open directory |

### Calendar
| Command | Action |
|---|---|
| `"What's on today"` | Reads today's events |
| `"What's on tomorrow"` | Reads tomorrow's events |
| `"What's this week look like"` | Reads week summary |
| `"Am I free at [time]"` | Checks for conflicts |
| `"Add [event] at [time] on [date]"` | Creates calendar event |
| `"Cancel my [event]"` | Deletes event |
| `"Move [event] to [new time]"` | Reschedules |
| `"Remind me about [thing] at [time]"` | Adds reminder |

### Email
| Command | Action |
|---|---|
| `"Read my emails"` | Reads last 5 unread |
| `"Any emails from [person]"` | Filters by sender |
| `"Read that email"` | Reads current email |
| `"Reply saying [message]"` | Drafts reply, reads back, confirms |
| `"Send an email to [person] about [subject]"` | Full email compose flow |
| `"Archive that"` | Archives current email |
| `"Delete that"` | Deletes current email |
| `"Mark as read"` | Marks email read |
| `"Forward this to [person]"` | Forwards email |

### WhatsApp
| Command | Action |
|---|---|
| `"Read my WhatsApp"` | Reads recent unread messages |
| `"Any messages from [name] on WhatsApp"` | Filters by contact |
| `"Reply to [name] on WhatsApp saying [message]"` | Opens WA with pre-filled text |
| `"Open WhatsApp"` | Opens WhatsApp web |

### Music
| Command | Action |
|---|---|
| `"Play music"` | Plays current/first track |
| `"Pause"` / `"Stop music"` | Pauses playback |
| `"Next track"` / `"Skip"` | Next song |
| `"Play [song title]"` | Plays specific track |
| `"Play song number [n]"` | Plays by playlist index |
| `"Volume up"` / `"Volume down"` | Adjusts volume |
| `"Repeat this song"` | Loops current track |
| `"Repeat playlist"` | Loops all tracks |
| `"Show playlist"` / `"List songs"` | Shows music panel |
| `"Add music"` | Opens file picker for audio |

### Settings & Memory
| Command | Action |
|---|---|
| `"Remember [fact]"` | Stores to persistent memory |
| `"What do you remember"` | Reads recent memory notes |
| `"Forget [fact]"` | Removes specific memory |
| `"Clear your memory"` | Wipes all stored facts |
| `"Dark mode"` / `"Light mode"` | Switches theme |
| `"Particles on"` / `"Particles off"` | Toggles background effects |
| `"System check"` | Reports all system statuses |
| `"Clear logs"` | Clears conversation history |
| `"Show settings"` | Opens settings panel |
| `"Connect Google"` | Triggers Google OAuth |
| `"Connect WhatsApp"` | Opens WA QR code or web |
| `"Enable clap wake"` | Activates clap detection |
| `"Show controls"` | Reveals emergency button fallback |

### Scheduling
| Command | Action |
|---|---|
| `"Add schedule [title] at [time]"` | Creates reminder |
| `"What's scheduled"` / `"List schedules"` | Shows schedule panel |
| `"Clear schedules"` | Removes all reminders |
| `"Remove the [title] reminder"` | Deletes specific reminder |

### UI Controls
| Command | Action |
|---|---|
| `"Fullscreen"` / `"Immersive mode"` | Enters fullscreen orb view |
| `"Exit fullscreen"` | Returns to normal view |
| `"Show tools"` | Shows quick tools panel |
| `"Show help"` | Shows command guide |
| `"Show conversation"` | Shows caption log |
| `"Hide that"` / `"Close that"` / `"Got it"` | Dismisses current panel |
| `"Show stats"` | Shows system stats in fullscreen |

---

## 11. Edge Cases & Failure Modes

### Voice
- **Accented speech misrecognition:** Implement fuzzy matching with Levenshtein distance ≤2 for wake word. Do not require exact match.
- **Multiple people talking:** When ambient speech detected that doesn't start with wake word, ignore it. Only respond to utterances that begin with `"JARVIS"` when in standby.
- **Loud environment / music playing:** Reduce confidence threshold; if ambient noise >60dB average, raise the detection bar.
- **JARVIS talks to itself (loopback):** Guard: check both `speechSynthesis.speaking` AND a 2.5s cooldown timer after speech ends before accepting new recognition results.
- **Microphone permission denied:** JARVIS shows a single screen-level overlay with simple text: "Microphone access required. Click to grant." One button, no further UI.
- **No speech recognition support (Safari iOS):** Fall back to a single large text input field. JARVIS says: *"Voice isn't available here, Sir. You can type your command."*

### Integrations
- **Google OAuth token expired:** Silently refresh using refresh token. If refresh fails, say: *"My Google access has expired, Sir. I'll need you to re-authenticate."* Then trigger OAuth.
- **Gmail rate limit hit:** Cache results, inform user: *"I've reached the Gmail request limit for now, Sir. Results are from [X minutes] ago."*
- **Calendar event conflict:** When adding event, always check existing events first. Say: *"You have [event] at that time, Sir. Shall I find the next available slot?"*
- **WhatsApp not connected (Phase 1):** Open WhatsApp Web and say: *"I've opened WhatsApp Web for you, Sir. Full native integration is coming in the desktop app."*
- **No internet / offline:** JARVIS detects offline state and says: *"I'm offline, Sir. I can still read your screen, manage local files, and access cached calendar data."*

### File System
- **Permission revoked between sessions:** On load, attempt to re-verify stored directory handle. If denied, say: *"I've lost access to your files, Sir. Say 'open my files' to reconnect."*
- **File too large:** If file >10MB, warn: *"That file is quite large, Sir — [X]MB. Reading just the first section."* Then read first 5000 characters.
- **Binary files (images, executables):** Detect MIME type before reading. For images, show in vision feed. For binaries, say: *"That's a binary file, Sir. I can't read it directly, but I can open it."*
- **File name conflicts on create:** Check existence before write. Say: *"A file named [X] already exists. Shall I overwrite it or create [X]_2?"*

### AI Model
- **Gemini API key missing/invalid:** Fall back to Pollinations immediately. Log error silently.
- **Claude API unavailable:** Fall back to Gemini Flash for all tasks.
- **Both models unavailable:** Fall back to Pollinations. Inform user: *"My cloud connections are offline, Sir. Using my offline mode."*
- **Response contains markdown/code:** Strip `**`, `##`, ` ``` ` etc. from text-to-speech. Show formatted version in output panel only.
- **Response too long:** TTS reads first 3 sentences, then says: *"There's more — I've saved the full answer to your output panel, Sir."*
- **Model hallucination on calendar/email:** Always present AI-synthesised calendar/email data as clearly coming from the live API fetch. Never generate fake event names.

### Scheduling
- **Alarm fires while JARVIS is already speaking:** Queue the alarm. Fire it as soon as current speech ends.
- **Multiple alarms at same minute:** Read all of them sequentially: *"Sir, two reminders: [A] and [B]."*
- **Browser tab not active when alarm fires:** Use the Web Notifications API to push a system notification with the reminder title.

---

## 12. Privacy & Security

- **No audio is ever transmitted without explicit user command.** Microphone stream stays local for VAD/clap detection. Audio only goes to Speech Recognition API when user has triggered listening.
- **API keys stored in `config.js` only**, never in localStorage, never logged, never in version control.
- **OAuth tokens stored in IndexedDB** (not localStorage — more secure against XSS).
- **Email content is never logged to the caption area** — only sender name and subject. Full body shown in slide-in panel only.
- **File paths and content are never sent to any server** unless user explicitly asks JARVIS to analyse a file via AI, in which case JARVIS says: *"I'll send this to the AI for analysis, Sir. Shall I proceed?"*
- GDPR note: If this is ever deployed for other users, a privacy policy is required covering speech processing and Google API access.

---

## 13. Phase Plan

### Phase 1 — Foundation (4–6 weeks)
- [ ] Remove all visible buttons/panels (voice-first UI)
- [ ] Lock JARVIS voice (no selector)
- [ ] Fix fullscreen mode (remove top bar and stats overlay)
- [ ] Implement streaming TTS pipeline (sentence chunking)
- [ ] Replace Pollinations with Gemini Flash streaming + Claude fallback
- [ ] Add VAD-based wake word (vad-web library)
- [ ] Implement persistent memory (IndexedDB)
- [ ] File System Access API (read/write local files)
- [ ] Slide-in panel system
- [ ] Real Google Calendar integration (OAuth + API)
- [ ] Real Gmail integration

### Phase 2 — Integrations (4–6 weeks)
- [ ] WhatsApp Web screen reading via Vision API
- [ ] Facebook Graph API (notifications + feed)
- [ ] Electron/Tauri desktop wrapper
- [ ] whatsapp-web.js native integration
- [ ] System notifications (Web Notifications API)
- [ ] Cross-device sync (JSONBin or Supabase)
- [ ] Offline-first caching for all integrations

### Phase 3 — Intelligence (Ongoing)
- [ ] Proactive JARVIS (suggests actions, notices patterns)
- [ ] Long-term user profile (learns your preferences)
- [ ] Agentic task chains (multi-step: "draft, review, then send")
- [ ] Custom skill plugins (user-defined voice commands → JS functions)
- [ ] Web agent mode (JARVIS browses on your behalf)

---

## 14. File Structure (v2)

```
ANICADE-JARVIS/
├── index.html          # Minimal shell — just orb + transcript
├── styles.css          # Orb + panel system only
├── app.js              # Main orchestrator
├── config.js           # API keys, wake word, model selection (gitignored)
├── modules/
│   ├── voice.js        # VAD, STT, TTS, streaming pipeline
│   ├── ai.js           # Model router, Gemini, Claude, Pollinations
│   ├── memory.js       # IndexedDB memory + sync
│   ├── integrations/
│   │   ├── google.js   # OAuth, Calendar, Gmail
│   │   ├── whatsapp.js # WA Web + whatsapp-web.js bridge
│   │   └── facebook.js # Graph API
│   ├── filesystem.js   # File System Access API
│   ├── scheduler.js    # Alarms, reminders, notifications
│   ├── commands.js     # Voice command router + fuzzy matcher
│   └── particles.js    # Canvas effects (extracted)
├── panels/
│   ├── calendar.html   # Calendar panel fragment
│   ├── email.html      # Email panel fragment
│   ├── files.html      # File tree panel fragment
│   ├── music.html      # Music panel fragment
│   └── settings.html   # Settings panel fragment
├── sw.js               # Service worker (offline cache)
├── manifest.json       # PWA manifest
└── README.md
```

---

## 15. Success Criteria

ANICADE JARVIS v2 is complete when:

1. A user can sit in front of their machine, say `"JARVIS"`, and have it respond within 800ms — every time.
2. A user can say `"What's on my calendar today"` and get real data from Google Calendar.
3. A user can say `"Read my latest email"` and have JARVIS read the subject and sender of their most recent unread Gmail.
4. A user can say `"Open my projects folder"` and then `"Read the readme file"` and hear its contents.
5. A user can say `"Fullscreen"` and see only the orb on a black background — no overlaid bars or buttons.
6. A user can ask any general knowledge question and receive a streaming response that starts speaking within 400ms.
7. A user can say `"Remember that I prefer dark mode always"` and on next session, JARVIS automatically applies dark mode without being asked.
8. The entire session can be completed without touching the mouse or keyboard once.

---

*Built by ANICADE TECH · Tresfor Zulu · Lusaka/Kabwe, Zambia*
*Document version: 2.0 · May 2026*
