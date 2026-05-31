const RAW_JARVIS_CONFIG = (() => {
  try {
    return window.JARVIS_CONFIG || {};
  } catch {
    return {};
  }
})();

const USER_CONFIG = {
  ...RAW_JARVIS_CONFIG,
  elevenLabsApiKey: RAW_JARVIS_CONFIG.elevenLabsApiKey || RAW_JARVIS_CONFIG.ELEVENLABS_API_KEY || "",
  elevenLabsVoiceId: RAW_JARVIS_CONFIG.elevenLabsVoiceId || RAW_JARVIS_CONFIG.ELEVENLABS_VOICE_ID || "",
  userName: RAW_JARVIS_CONFIG.userName || RAW_JARVIS_CONFIG.USER_NAME || "Sir",
  language: RAW_JARVIS_CONFIG.language || RAW_JARVIS_CONFIG.LANGUAGE || "en-GB"
};

const STARTUP_INTRODUCTION = "Allow me to introduce myself, I am Jarvis, a virtual artificial intelligence, and I'm here to assist you with a variety of tasks as best I can, 24 hours a day, 7 days a week. Importing all preferences from home interface. Running system check. System check complete, all Systems are fully operational.";
const STARTUP_SONG_TITLE = "The_Clash_-_Should_I_Stay_or_Should_I_Go__Official_Video_(256k)";
const STARTUP_SONG_QUERY = "Should I Stay or Should I Go The Clash";
const STARTUP_SONG_ASSET = "assets/The_Clash_-_Should_I_Stay_or_Should_I_Go__Official_Video_(256k).mp3";

const state = {
  bootedAt: performance.now(),
  commandHistory: [],
  commandChain: Promise.resolve(),
  commandTimeoutMs: 30000,
  lastIntent: null,
  lastSubject: "",
  activeSurface: "",
  sleepMode: false,
  idleTimeoutMs: Number(RAW_JARVIS_CONFIG.IDLE_SLEEP_MS || RAW_JARVIS_CONFIG.idleSleepMs || 60000),
  activity: {
    lastUserAt: Date.now(),
    idleTimer: 0
  },
  lastSpokenError: "",
  lastSpokenErrorAt: 0,
  lastTranscript: "",
  lastTranscriptAt: 0,
  cameraStream: null,
  news: {
    topic: "",
    refreshTimer: 0
  },
  map: {
    query: "Kabwe, Zambia",
    zoom: 12,
    mode: "roadmap",
    home: RAW_JARVIS_CONFIG.HOME_LOCATION || { label: "HFH5+J8W, Kabwe, Zambia", city: "Kabwe", country: "Zambia", lat: -14.4430, lon: 28.4457 }
  },
  telemetry: {
    phase: Math.random() * Math.PI * 2,
    heartRate: 72,
    bodyTemp: 36.7,
    oxygen: 98,
    respiration: 14,
    conductance: 8.2,
    neuralLoad: 42,
    alpha: 10.4,
    beta: 18.8,
    theta: 6.2,
    coherence: 76,
    bandwidth: 3.2,
    packetLoss: 0.0008,
    coreTemp: 39.4,
    entropy: 0.78,
    audioEnergy: 0.18,
    spectrumPeak: -42,
    waveRms: 0.08,
    dominantHz: 210
  },
  audio: {
    context: null,
    analyser: null,
    freqData: null,
    timeData: null,
    sampleRate: 48000,
    fallbackSeed: Math.random() * 1000
  },
  speech: {
    synth: window.speechSynthesis || null,
    voices: [],
    selectedVoice: null,
    rate: Number(USER_CONFIG.ttsRate || RAW_JARVIS_CONFIG.TTS_RATE || 1.03),
    pitch: Number(USER_CONFIG.ttsPitch || RAW_JARVIS_CONFIG.TTS_PITCH || 0.88),
    volume: Number(USER_CONFIG.ttsVolume || RAW_JARVIS_CONFIG.TTS_VOLUME || 1),
    recognition: null,
    listening: false,
    keepListening: true,
    speaking: false,
    pausedForSpeech: false,
    restartTimer: 0,
    resumeTimer: 0,
    ignoreTranscriptsUntil: 0,
    speechId: 0,
    lastSpoken: "",
    lastSpeechEndedAt: 0,
    lastSpeechStartedAt: 0,
    currentAudio: null
  },
  music: {
    audio: new Audio(),
    volume: Number(localStorage.getItem("jarvis_music_volume") || 0.72),
    restoreVolume: null,
    ducked: false,
    fadeFrame: 0,
    startupAttempted: false,
    startupPending: false,
    tracks: [
      {
        title: STARTUP_SONG_TITLE,
        src: USER_CONFIG.startupSongUrl || USER_CONFIG.STARTUP_SONG_URL || USER_CONFIG.CLASH_TRACK_URL || STARTUP_SONG_ASSET,
        search: STARTUP_SONG_QUERY
      },
      { title: "SoundHelix Stream 1", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
      { title: "SoundHelix Stream 2", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
      { title: "SoundHelix Stream 4", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
      { title: "SoundHelix Stream 8", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" }
    ],
    index: 0
  },
  clap: {
    lastEnergy: 0,
    lastClapAt: 0,
    count: 0,
    cooldownUntil: 0
  },
  neuralParticles: []
};

const els = {
  neuralCore: document.getElementById("neuralCore"),
  spectrumCanvas: document.getElementById("spectrumCanvas"),
  waveformCanvas: document.getElementById("waveformCanvas"),
  frequencyCanvas: document.getElementById("frequencyCanvas"),
  neuralTelemetryCanvas: document.getElementById("neuralTelemetryCanvas"),
  spectrumPeak: document.getElementById("spectrumPeak"),
  waveRms: document.getElementById("waveRms"),
  dominantHz: document.getElementById("dominantHz"),
  heartRate: document.getElementById("heartRate"),
  heartBars: document.getElementById("heartBars"),
  bodyTemp: document.getElementById("bodyTemp"),
  oxygenSat: document.getElementById("oxygenSat"),
  respRate: document.getElementById("respRate"),
  skinConductance: document.getElementById("skinConductance"),
  neuralLoad: document.getElementById("neuralLoad"),
  alphaWave: document.getElementById("alphaWave"),
  betaWave: document.getElementById("betaWave"),
  thetaWave: document.getElementById("thetaWave"),
  coherence: document.getElementById("coherence"),
  systemMode: document.getElementById("systemMode"),
  bandwidthVal: document.getElementById("bandwidthVal"),
  packetLoss: document.getElementById("packetLoss"),
  coreTemp: document.getElementById("coreTemp"),
  entropyVal: document.getElementById("entropyVal"),
  streamHex: document.getElementById("streamHex"),
  surfaceLayer: document.getElementById("surfaceLayer"),
  surfaceType: document.getElementById("surfaceType"),
  surfaceTitle: document.getElementById("surfaceTitle"),
  surfaceFrame: document.getElementById("surfaceFrame"),
  surfaceContent: document.getElementById("surfaceContent"),
  standbyClock: document.getElementById("standbyClock"),
  standbyTime: document.getElementById("standbyTime"),
  standbyDate: document.getElementById("standbyDate")
};

function init() {
  state.music.audio.volume = state.music.volume;
  state.music.audio.preload = "auto";
  buildHeartBars();
  initNeuralCore();
  installActivityTracking();
  initVoiceCore();
  requestAnimationFrame(drawDashboard);
}

function buildHeartBars() {
  els.heartBars.textContent = "";
  for (let i = 0; i < 36; i += 1) {
    els.heartBars.appendChild(document.createElement("i"));
  }
}

async function initVoiceCore() {
  lockJarvisVoice();
  if (state.speech.synth) {
    state.speech.synth.onvoiceschanged = lockJarvisVoice;
  }
  initSpeechRecognition();
  await waitForVoices(700);
  lockJarvisVoice();
  playSystemSound("startup");
  await withTimeout(startStartupMusic(), 1400, false);

  const greeting = buildStartupGreeting();
  try {
    await speakText(greeting, { preferElevenLabs: false });
  } finally {
    startAudioAnalysis();
    startContinuousListening();
  }
}

function waitForVoices(timeoutMs) {
  if (!state.speech.synth) return Promise.resolve();
  if (state.speech.synth.getVoices().length) return Promise.resolve();
  return new Promise(resolve => {
    const timeout = window.setTimeout(resolve, timeoutMs);
    state.speech.synth.addEventListener("voiceschanged", () => {
      window.clearTimeout(timeout);
      resolve();
    }, { once: true });
  });
}

function lockJarvisVoice() {
  if (!state.speech.synth) return;
  state.speech.voices = state.speech.synth.getVoices();
  state.speech.selectedVoice = chooseJarvisVoice(state.speech.voices);
}

function chooseJarvisVoice(voices) {
  const priority = [
    /microsoft.*(ryan|thomas|george).*natural.*english.*(united kingdom|great britain)|english.*(united kingdom|great britain).*natural.*(ryan|thomas|george)/i,
    /google uk english male|daniel|ryan|george|thomas/i,
    /natural|neural|online/i,
    /en[-_](GB|UK)|english.*united kingdom|uk english/i,
    /^en/i
  ];

  return [...voices].sort((a, b) => scoreVoice(b, priority) - scoreVoice(a, priority))[0] || null;
}

function scoreVoice(voice, patterns) {
  const label = `${voice.name} ${voice.lang}`;
  return patterns.reduce((score, pattern, index) => score + (pattern.test(label) ? 20 - index * 2 : 0), 0);
}

async function startAudioAnalysis() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext || !navigator.mediaDevices?.getUserMedia) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    state.audio.context = new AudioContext();
    state.audio.sampleRate = state.audio.context.sampleRate || state.audio.sampleRate;
    const source = state.audio.context.createMediaStreamSource(stream);
    const analyser = state.audio.context.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.78;
    source.connect(analyser);
    state.audio.analyser = analyser;
    state.audio.freqData = new Uint8Array(analyser.frequencyBinCount);
    state.audio.timeData = new Uint8Array(analyser.fftSize);
  } catch {
    state.audio.analyser = null;
  }
}

function installActivityTracking() {
  const mark = () => recordUserActivity();
  ["pointerdown", "keydown", "touchstart", "wheel"].forEach(type => {
    window.addEventListener(type, mark, { passive: true });
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) recordUserActivity();
  });
  installStartupMusicUnlock();
}

function recordUserActivity() {
  state.activity.lastUserAt = Date.now();
}

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return;

  const recognition = new SpeechRecognition();
  recognition.lang = USER_CONFIG.language;
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 3;

  recognition.onstart = () => {
    state.speech.listening = true;
  };

  recognition.onend = () => {
    state.speech.listening = false;
    if (state.speech.keepListening && !state.speech.pausedForSpeech) scheduleListenRestart();
  };

  recognition.onerror = () => {
    state.speech.listening = false;
    if (state.speech.keepListening && !state.speech.pausedForSpeech) scheduleListenRestart();
  };

  recognition.onresult = event => {
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      if (!result.isFinal) continue;
      const transcript = chooseBestTranscript(result);
      handleTranscript(transcript);
    }
  };

  state.speech.recognition = recognition;
}

function scheduleListenRestart() {
  window.clearTimeout(state.speech.restartTimer);
  const cooldown = Math.max(0, state.speech.ignoreTranscriptsUntil - Date.now());
  state.speech.restartTimer = window.setTimeout(startContinuousListening, Math.max(cooldown, state.speech.speaking ? 900 : 140));
}

function startContinuousListening() {
  const recognition = state.speech.recognition;
  if (!recognition || state.speech.listening || !state.speech.keepListening) return;
  try {
    recognition.start();
  } catch {
    scheduleListenRestart();
  }
}

function chooseBestTranscript(result) {
  const alternatives = Array.from(result || []).map(alt => ({
    text: String(alt?.transcript || "").trim(),
    confidence: Number.isFinite(alt?.confidence) ? alt.confidence : 0.7
  })).filter(item => item.text);
  if (!alternatives.length) return "";
  const wakeWord = normalizeSpeech(USER_CONFIG.WAKE_WORD || USER_CONFIG.wakeWord || "jarvis");
  alternatives.sort((a, b) => {
    const aWake = normalizeSpeech(a.text).includes(wakeWord) ? 1 : 0;
    const bWake = normalizeSpeech(b.text).includes(wakeWord) ? 1 : 0;
    return bWake - aWake || b.confidence - a.confidence || b.text.length - a.text.length;
  });
  return alternatives[0].text;
}

function handleTranscript(rawTranscript) {
  const transcript = String(rawTranscript || "").trim();
  if (!transcript) return;
  recordUserActivity();
  if (state.sleepMode) return;

  const lower = transcript.toLowerCase();
  if (/^\s*(stop|enough|cancel|silence|stop speaking|be quiet)\s*[.!?]*$/i.test(lower)) {
    stopSpeech();
    rememberCommand(transcript);
    return;
  }

  const normalizedTranscript = normalizeSpeech(transcript);
  const now = Date.now();
  const { heardWake, command } = extractWakeCommand(transcript);
  if (state.speech.speaking || now < state.speech.ignoreTranscriptsUntil) {
    if (isLikelyLoopback(transcript) || (!heardWake && now < state.speech.ignoreTranscriptsUntil)) return;
  }

  if (normalizedTranscript === state.lastTranscript && now - state.lastTranscriptAt < 1600) return;
  state.lastTranscript = normalizedTranscript;
  state.lastTranscriptAt = now;

  if (!command) {
    if (heardWake) speakText("Yes, Sir?");
    return;
  }

  state.commandChain = state.commandChain
    .then(() => withTimeout(runCommand(command), state.commandTimeoutMs, "timeout"))
    .then(result => {
      if (result === "timeout") return speakErrorOnce("That service is moving slowly, Sir. I kept the console responsive and can route the request another way.");
      return null;
    })
    .catch(() => speakErrorOnce("That did not land cleanly, Sir. I can try a lighter route or switch providers."));
}

function extractWakeCommand(transcript) {
  const wakeWord = String(USER_CONFIG.WAKE_WORD || USER_CONFIG.wakeWord || "jarvis").toLowerCase();
  const wakePattern = new RegExp(`^\\s*(?:(?:hey|hi|okay|ok)\\s+)?${escapeRegExp(wakeWord)}\\b`, "i");
  let heardWake = wakePattern.test(transcript);
  let command = heardWake
    ? transcript.replace(wakePattern, "").replace(/^[,.\s]+/, "").trim()
    : transcript.trim();

  if (!heardWake) {
    const words = transcript.trim().split(/\s+/);
    let wakeIndex = /^(hey|hi|okay|ok)$/i.test(words[0] || "") ? 1 : 0;
    const candidate = normalizeSpeech(words[wakeIndex] || "");
    const normalizedWake = normalizeSpeech(wakeWord);
    if (candidate && levenshteinDistance(candidate, normalizedWake) <= 2) {
      heardWake = true;
      command = words.slice(wakeIndex + 1).join(" ").replace(/^[,.\s]+/, "").trim();
    }
  }

  return { heardWake, command };
}

function isLikelyLoopback(transcript) {
  const heard = normalizeSpeech(transcript);
  const spoken = normalizeSpeech(state.speech.lastSpoken);
  if (!heard || !spoken) return false;
  const inCooldown = Date.now() < state.speech.ignoreTranscriptsUntil;
  if (spoken.includes(heard) && (heard.length > 18 || (inCooldown && heard.length > 4))) return true;
  if (heard.includes(spoken) && spoken.length > 18) return true;
  if (heard.includes("i will not claim") || heard.includes("do not claim") || heard.includes("news is unavailable")) return true;
  const words = heard.split(" ").filter(Boolean);
  if (words.length < 4) return false;
  const spokenWords = new Set(spoken.split(" ").filter(Boolean));
  const overlap = words.filter(word => spokenWords.has(word)).length / words.length;
  const similarity = speechSimilarity(heard, spoken);
  return (overlap > 0.72 || similarity > 0.68) && Date.now() - state.speech.lastSpeechEndedAt < 9000;
}

function normalizeSpeech(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

function speechSimilarity(a, b) {
  const left = String(a || "");
  const right = String(b || "");
  const maxLength = Math.max(left.length, right.length, 1);
  return 1 - levenshteinDistance(left, right) / maxLength;
}

function levenshteinDistance(a, b) {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let last = i - 1;
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const old = previous[j];
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        last + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      last = old;
    }
  }
  return previous[b.length];
}

async function runCommand(rawCommand) {
  const command = String(rawCommand || "").trim();
  if (!command) return;
  rememberCommand(command);

  if (state.sleepMode) {
    return;
  }

  const intent = await interpretCommand(command);
  state.lastIntent = intent;
  await executeIntent(intent, command);
}

async function interpretCommand(command) {
  const localIntent = parseLocalIntent(command);
  if (localIntent.confidence >= 0.86) return localIntent;
  if (localIntent.action === "general_chat" && shouldAnswerDirectly(command)) return localIntent;

  const aiIntent = await withTimeout(interpretWithAi(command), 1200, null);
  if (aiIntent) return aiIntent;

  return localIntent.confidence > 0 ? localIntent : { action: "general_chat", params: { prompt: command }, confidence: 0.3 };
}

function validateIntentForCommand(intent, command) {
  const lower = String(command || "").toLowerCase();
  const actionWords = /\b(open|show|launch|display|play|pause|stop|next|generate|create|make|close|hide|dismiss|map|route|zoom|switch|set|change|camera|news|video|browser|schematic|code|music|volume|mute|sleep|wake)\b/;
  const surfaceActions = /^(open_map|set_map_mode|zoom_map|calculate_route|open_schematics|open_browser|open_camera|open_news|open_video|open_music|play_music|generate_ad|open_code)$/;
  if (surfaceActions.test(intent.action) && !actionWords.test(lower)) {
    return { action: "general_chat", params: { prompt: command }, confidence: 0.42 };
  }
  if (/^(open_map|set_map_mode|zoom_map|calculate_route)$/.test(intent.action) && !isExplicitMapCommand(lower)) {
    return { action: "general_chat", params: { prompt: command }, confidence: 0.42 };
  }
  if (/^(open_music|play_music|pause_music|next_track|set_music_volume|mute_music)$/.test(intent.action) && !isExplicitMusicCommand(lower)) {
    return { action: "general_chat", params: { prompt: command }, confidence: 0.42 };
  }
  if (intent.action === "play_music" && !isExplicitPlayMusicCommand(lower)) {
    return { action: "open_music", params: {}, confidence: 0.68 };
  }
  if (intent.action === "open_camera" && !isExplicitCameraCommand(lower)) {
    return { action: "general_chat", params: { prompt: command }, confidence: 0.42 };
  }
  if (intent.action === "open_browser" && (!isExplicitBrowserCommand(lower) || /\b(camera|webcam|cam|map|atlas|music|song|news|headline)\b/.test(lower))) {
    return { action: "general_chat", params: { prompt: command }, confidence: 0.42 };
  }
  if (intent.action === "open_news" && !/\b(news|headline|headlines|latest|briefing|report)\b/.test(lower)) {
    return { action: "general_chat", params: { prompt: command }, confidence: 0.42 };
  }
  return intent;
}

function withTimeout(promise, ms, fallback) {
  return new Promise(resolve => {
    const timer = window.setTimeout(() => resolve(fallback), ms);
    Promise.resolve(promise)
      .then(value => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        window.clearTimeout(timer);
        resolve(fallback);
      });
  });
}

async function interpretWithAi(command) {
  const allowed = [
    "system_check", "telemetry_report", "open_map", "set_map_mode", "zoom_map", "calculate_route",
    "open_schematics", "close_module", "open_browser", "open_camera", "open_news", "open_video", "open_music", "play_music",
    "pause_music", "next_track", "set_music_volume", "mute_music", "generate_ad", "open_code",
    "sleep", "wake", "hide_visual_core", "show_visual_core", "recent_commands", "calendar_status", "general_chat", "clarify"
  ];
  const prompt = `You are the command interpreter for ANICADE JARVIS. Convert the user's natural request into JSON only. Allowed actions: ${allowed.join(", ")}. Use params for target, query, mode, amount, product, topic, destination, origin, url, subject, or prompt. Never claim execution. If the user asks a normal question, return {"action":"general_chat","params":{"prompt":"the question"}}. If unclear, return {"action":"clarify","params":{"question":"a short question"}}.\nUser: ${command}`;
  const gemini = await askGeminiForJson(prompt);
  if (gemini) return validateIntentForCommand(normalizeIntent(gemini), command);
  const groq = await askGroqForJson(prompt);
  if (groq) return validateIntentForCommand(normalizeIntent(groq), command);
  return null;
}

async function askGeminiForJson(prompt) {
  const key = USER_CONFIG.GEMINI_API_KEY || USER_CONFIG.geminiApiKey;
  if (!key) return null;
  try {
    const model = USER_CONFIG.geminiModel || "gemini-2.0-flash";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 220, responseMimeType: "application/json" }
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    return parseJsonLoose(data.candidates?.[0]?.content?.parts?.[0]?.text);
  } catch {
    return null;
  }
}

async function askGroqForJson(prompt) {
  const key = USER_CONFIG.GROQ_API_KEY || USER_CONFIG.groqApiKey;
  if (!key) return null;
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "authorization": `Bearer ${key}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: USER_CONFIG.groqModel || "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "Return strict JSON only. You are an intent parser for ANICADE JARVIS." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 220
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    return parseJsonLoose(data.choices?.[0]?.message?.content);
  } catch {
    return null;
  }
}

function parseJsonLoose(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function normalizeIntent(value) {
  return {
    action: String(value?.action || (value?.clarify ? "clarify" : "general_chat")).toLowerCase().replace(/[^a-z0-9_]/g, "_"),
    params: value?.params && typeof value.params === "object" ? value.params : {},
    confidence: Number(value?.confidence || 0.78)
  };
}

function parseLocalIntent(command) {
  const lower = command.toLowerCase();

  if (/\b(system check|status report|diagnostic|diagnostics)\b/.test(lower)) return { action: "system_check", params: {}, confidence: 0.94 };
  if (/\b(read|report|summarize|summarise|what).*\b(telemetry|dashboard|vitals|biometric|signal|heart rate|pulse)\b/.test(lower)) return { action: "telemetry_report", params: {}, confidence: 0.94 };
  if (/\b(log|history|recent commands)\b/.test(lower)) return { action: "recent_commands", params: {}, confidence: 0.94 };
  if (/\b(calendar|schedule|agenda|meeting|meetings|appointment|appointments)\b/.test(lower)) return { action: "calendar_status", params: {}, confidence: 0.94 };
  if (/\b(sleep|standby|go dark|ambient mode)\b/.test(lower)) return { action: "sleep", params: {}, confidence: 0.94 };
  if (/\b(wake|resume|activate|bring.*back)\b/.test(lower)) return { action: "wake", params: {}, confidence: 0.9 };
  if (/\b(close|hide|dismiss|remove|get rid of|shut).*\b(visual core|core|particles|particle field)\b/.test(lower)) return { action: "hide_visual_core", params: {}, confidence: 0.94 };
  if (/\b(show|restore|open|bring back).*\b(visual core|core|particles|particle field)\b/.test(lower)) return { action: "show_visual_core", params: {}, confidence: 0.94 };
  if (/\b(close|hide|dismiss|remove|get rid of|shut).*\b(module|view|browser|web|map|atlas|schematic|schema|video|news|ad|tab)\b/.test(lower)) return { action: "close_module", params: {}, confidence: 0.92 };
  if (isExplicitCameraCommand(lower)) return { action: "open_camera", params: {}, confidence: 0.95 };

  if (/\b(volume|louder|quieter|mute|unmute)\b/.test(lower) && isExplicitMusicCommand(lower)) {
    if (/\bmute\b/.test(lower)) return { action: "mute_music", params: {}, confidence: 0.95 };
    const amount = lower.match(/\b(\d{1,3})\s*(percent|%)\b/)?.[1];
    const direction = /\b(up|increase|louder|raise)\b/.test(lower) ? "up" : /\b(down|reduce|lower|quieter)\b/.test(lower) ? "down" : "set";
    return { action: "set_music_volume", params: { amount: amount ? Number(amount) : null, direction }, confidence: 0.95 };
  }

  if (/\b(pause|stop)\b/.test(lower) && isExplicitMusicCommand(lower)) return { action: "pause_music", params: {}, confidence: 0.95 };
  if (/\bnext\b/.test(lower) && isExplicitMusicCommand(lower)) return { action: "next_track", params: {}, confidence: 0.95 };
  if (isExplicitPlayMusicCommand(lower)) return { action: "play_music", params: {}, confidence: 0.92 };
  if (/\b(open|show|display|launch)\b/.test(lower) && isExplicitMusicCommand(lower)) return { action: "open_music", params: {}, confidence: 0.9 };

  if (isExplicitMapCommand(lower)) {
    if (/\bzoom in\b/.test(lower)) return { action: "zoom_map", params: { amount: 1 }, confidence: 0.94 };
    if (/\bzoom out\b/.test(lower)) return { action: "zoom_map", params: { amount: -1 }, confidence: 0.94 };
    if (/\b(satellite|traffic|road|roads|roadway|night|terrain|pipeline|oil|swamp|wetland)\b/.test(lower)) return { action: "set_map_mode", params: { mode: inferMapMode(lower) }, confidence: 0.94 };
    if (/\b(shortest|quickest|fastest|route|directions)\b/.test(lower)) return { action: "calculate_route", params: extractRouteParams(command), confidence: 0.9 };
    return { action: "open_map", params: { query: extractTarget(command, /^(open|show|find|focus|center|map|atlas|location|to|for|on|\s)+/ig) || state.map.query }, confidence: 0.88 };
  }

  if (/\b(schematic|schema|diagram|blueprint)\b/.test(lower)) {
    return { action: "open_schematics", params: { subject: extractTarget(command, /^(open|show|render|create|load|a|an|the|schematics?|schema|blueprint|diagram|for|of|on|\s)+/ig) || state.lastSubject || "ANICADE JARVIS core architecture" }, confidence: 0.9 };
  }

  if (/\b(ad|advert|advertisement|promo|poster|campaign)\b/.test(lower)) return { action: "generate_ad", params: { product: command.replace(/.*\b(for|about|of)\b/i, "").replace(/\b(generate|create|make|an?|advertisement|advert|ad|promo|poster|campaign)\b/ig, "").trim() || state.lastSubject || "the product" }, confidence: 0.9 };
  if (/\b(news|headline|latest|reporter|feed)\b/.test(lower)) return { action: "open_news", params: { topic: extractTarget(command, /^(open|show|give|read|latest|news|headlines|feed|about|on|\s)+/ig) || "Zambia technology and business" }, confidence: 0.88 };
  if (/\b(video|play video|watch|youtube)\b/.test(lower)) return { action: "open_video", params: { topic: extractTarget(command, /^(open|show|play|watch|video|about|on|\s)+/ig) || state.lastSubject || "latest technology news" }, confidence: 0.88 };
  if (isExplicitBrowserCommand(lower)) return { action: "open_browser", params: { query: command.replace(/^(open|show|search|look up|new tab|browser|web|website|for|about|\s)+/ig, "").trim() || "Zambia latest news" }, confidence: 0.84 };
  if (/\b(code|coding|preview|build|make a page|write)\b/.test(lower)) return { action: "open_code", params: { prompt: command }, confidence: 0.84 };
  return { action: "general_chat", params: { prompt: command }, confidence: 0.3 };
}

function shouldAnswerDirectly(command) {
  const lower = String(command || "").toLowerCase();
  const commandSignals = /\b(open|show|launch|display|play|pause|stop|next|generate|create|make|close|hide|dismiss|map|route|zoom|switch|set|change|camera|news|video|browser|schematic|code|music|volume|mute|sleep|wake|search|look up)\b/;
  return !commandSignals.test(lower) || /\b(who|what|when|where|why|how|tell me|explain|answer)\b/.test(lower);
}

function isExplicitCameraCommand(lower) {
  return /\b(open|show|start|turn on|launch|enable|activate)\b.*\b(camera|webcam|camera feed|video feed)\b/.test(lower)
    || /^\s*(camera|webcam|camera feed)\s*$/.test(lower);
}

function isExplicitMusicCommand(lower) {
  return /\b(music|song|songs|track|tracks|audio player|music player)\b/.test(lower);
}

function isExplicitPlayMusicCommand(lower) {
  return /\b(play|start|resume)\b.*\b(music|song|songs|track|tracks|audio)\b/.test(lower);
}

function isExplicitMapCommand(lower) {
  return /\b(map|atlas)\b/.test(lower)
    || /\b(route|directions|navigate|navigation)\b/.test(lower)
    || /\b(take me|show me the way|get me)\b.*\b(to|from)\b/.test(lower)
    || /\b(satellite|traffic|terrain)\s+(view|map)\b/.test(lower);
}

function isExplicitBrowserCommand(lower) {
  return /\b(browser|website|web page|open tab|new tab|search the web|web search|look up)\b/.test(lower)
    || /\bopen\s+https?:\/\//.test(lower);
}

async function executeIntent(intent, rawCommand) {
  const action = intent.action;
  const params = intent.params || {};

  if (action === "system_check") return speakText(buildSystemReport());
  if (action === "telemetry_report") return speakText(buildTelemetryReport());
  if (action === "recent_commands") {
    const recent = state.commandHistory.slice(-5).map(item => item.command).join(". ");
    return speakText(recent ? `Recent command history is available, Sir. ${recent}.` : "No recent command history is available for this session, Sir.");
  }
  if (action === "calendar_status") return speakText("I do not have a connected calendar feed in this build yet, Sir, so I will not invent meetings or appointments.");
  if (action === "sleep" || action === "wake") return speakText("Sleep and wake are on double clap control now.");
  if (action === "hide_visual_core") return hideVisualCore();
  if (action === "show_visual_core") return showVisualCore();
  if (action === "close_module") return closeSurface(true);
  if (action === "open_map") return openMap(params.query || params.target || state.map.query, params.mode);
  if (action === "set_map_mode") return setMapMode(params.mode || inferMapMode(rawCommand));
  if (action === "zoom_map") return zoomMap(Number(params.amount || params.delta || 1));
  if (action === "calculate_route") return calculateRoute(params);
  if (action === "open_schematics") return openSchematics(params.subject || params.topic || state.lastSubject || "ANICADE JARVIS core architecture");
  if (action === "generate_ad") return generateAd(params.product || params.topic || state.lastSubject || rawCommand);
  if (action === "open_browser") return openBrowserSurface(params.url || params.query || rawCommand);
  if (action === "open_camera") return openCameraSurface();
  if (action === "open_news") return openNews(params.topic || params.query || "Zambia latest news");
  if (action === "open_video") return openVideo(params.topic || params.query || rawCommand);
  if (action === "open_code") return openCodeSurface(params.prompt || rawCommand);
  if (action === "open_music") return openMusicWidget();
  if (action === "play_music") return playMusic();
  if (action === "pause_music") return pauseMusic();
  if (action === "next_track") return nextTrack();
  if (action === "set_music_volume") return setMusicVolume(params);
  if (action === "mute_music") return muteMusic();
  if (action === "clarify") return speakText(params.question || "I need one more detail before I can do that properly, Sir.");
  return answerConversationally(params.prompt || rawCommand);
}

function extractTarget(command, pattern) {
  return String(command || "").replace(pattern, "").trim().replace(/[?.!]+$/g, "");
}

function extractRouteParams(command) {
  const text = String(command || "");
  const fromTo = text.match(/\bfrom\s+(.+?)\s+to\s+(.+)$/i);
  if (fromTo) return { origin: fromTo[1].trim(), destination: fromTo[2].trim() };
  const toOnly = text.match(/\b(to|for)\s+(.+)$/i);
  return { origin: "home", destination: toOnly ? toOnly[2].trim() : state.map.query };
}

function inferMapMode(value) {
  const lower = String(value || "").toLowerCase();
  if (/\bsatellite\b/.test(lower)) return "satellite";
  if (/\btraffic\b/.test(lower)) return "traffic";
  if (/\b(oil|pipeline|pipelines)\b/.test(lower)) return "pipeline";
  if (/\b(swamp|wetland)\b/.test(lower)) return "swamps";
  if (/\b(night|tactical|grid)\b/.test(lower)) return "night";
  if (/\b(terrain)\b/.test(lower)) return "terrain";
  if (/\b(road|roads|roadway)\b/.test(lower)) return "roads";
  return "roadmap";
}

function showSurface(type, title, options = {}) {
  if (!els.surfaceLayer) return false;
  state.activeSurface = type;
  els.surfaceLayer.hidden = false;
  els.surfaceType.textContent = type.toUpperCase();
  els.surfaceTitle.textContent = title;
  if (options.src) {
    els.surfaceFrame.hidden = false;
    els.surfaceContent.hidden = true;
    els.surfaceFrame.src = options.src;
  } else {
    els.surfaceFrame.hidden = true;
    els.surfaceFrame.removeAttribute("src");
    els.surfaceContent.hidden = false;
    els.surfaceContent.innerHTML = options.html || "";
  }
  playSystemSound("open");
  return true;
}

async function closeSurface(speak = false) {
  if (!state.activeSurface || !els.surfaceLayer || els.surfaceLayer.hidden) {
    if (speak) await speakText("There is no open module to close, Sir.");
    return false;
  }
  if (state.activeSurface === "PULSE") stopNewsRefresh();
  els.surfaceLayer.hidden = true;
  els.surfaceFrame.removeAttribute("src");
  els.surfaceContent.textContent = "";
  stopCameraStream();
  state.activeSurface = "";
  playSystemSound("close");
  if (speak) await speakText("Module closed, Sir.");
  return true;
}

function stopCameraStream() {
  if (!state.cameraStream) return;
  state.cameraStream.getTracks().forEach(track => track.stop());
  state.cameraStream = null;
}

function mapUrl() {
  const params = new URLSearchParams({
    query: state.map.query,
    zoom: String(state.map.zoom),
    mode: state.map.mode
  });
  return `maps.html?${params.toString()}`;
}

async function openMap(query, mode) {
  const clean = resolvePlaceName(query || state.map.query);
  if (!clean) return speakText("I need a location before I can open ATLAS, Sir.");
  state.map.query = clean;
  if (mode) state.map.mode = inferMapMode(mode);
  showSurface("ATLAS", `${state.map.query} / ${state.map.mode.toUpperCase()}`, { src: mapUrl() });
  state.lastSubject = state.map.query;
  await speakText(`ATLAS is open on ${state.map.query}, Sir. ${mapModeResponse(state.map.mode)}`);
}

async function setMapMode(mode) {
  state.map.mode = inferMapMode(mode);
  if (!state.activeSurface || state.activeSurface !== "ATLAS") {
    showSurface("ATLAS", `${state.map.query} / ${state.map.mode.toUpperCase()}`, { src: mapUrl() });
  } else {
    els.surfaceTitle.textContent = `${state.map.query} / ${state.map.mode.toUpperCase()}`;
    els.surfaceFrame.src = mapUrl();
  }
  await speakText(mapModeResponse(state.map.mode));
}

async function zoomMap(amount) {
  state.map.zoom = Math.max(3, Math.min(20, state.map.zoom + amount));
  showSurface("ATLAS", `${state.map.query} / ZOOM ${state.map.zoom}`, { src: mapUrl() });
  await speakText(`Map zoom adjusted to level ${state.map.zoom}, Sir.`);
}

async function calculateRoute(params) {
  const origin = resolvePlaceName(params.origin || "home");
  const destination = resolvePlaceName(params.destination || params.target || params.query || state.map.query);
  if (!destination) return speakText("I need a destination before I can calculate a route, Sir.");
  state.map.query = destination;
  state.map.mode = "roads";
  state.map.zoom = 10;
  showSurface("ATLAS", `ROUTE: ${origin} TO ${destination}`, { src: mapUrl() });
  const estimate = estimateRoute(origin, destination);
  const distanceText = estimate.distanceKm === "unverified" ? "I could not verify the distance from the available coordinates" : `estimated direct distance is ${estimate.distanceKm} kilometres`;
  await speakText(`Route view is open, Sir. The ${distanceText}.`);
}

function resolvePlaceName(value) {
  const clean = String(value || "").trim();
  if (!clean) return "";
  if (/\b(home|my location|base|back to base)\b/i.test(clean)) return `${state.map.home.lat},${state.map.home.lon}`;
  return clean;
}

function estimateRoute(origin, destination) {
  const known = {
    "lusaka": [-15.3875, 28.3228],
    "lusaka, zambia": [-15.3875, 28.3228],
    "ndola": [-12.9587, 28.6366],
    "kabwe": [-14.4469, 28.4464],
    "livingstone": [-17.8419, 25.8544],
    "kitwe": [-12.8024, 28.2132]
  };
  const parse = place => {
    const raw = String(place || "").toLowerCase();
    const coord = raw.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (coord) return [Number(coord[1]), Number(coord[2])];
    return known[raw] || null;
  };
  const a = parse(origin);
  const b = parse(destination);
  if (!a || !b) return { distanceKm: "unverified" };
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return { distanceKm: Math.round(6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))) };
}

function mapModeResponse(mode) {
  const responses = {
    satellite: "Satellite view active, Sir.",
    traffic: "Traffic layer active where the map provider allows it, Sir.",
    pipeline: "Pipeline tactical overlay active, Sir.",
    swamps: "Wetland tactical overlay active, Sir.",
    night: "Night grid active, Sir.",
    terrain: "Terrain view active, Sir.",
    roads: "Road network view active, Sir.",
    roadmap: "Map view active, Sir."
  };
  return responses[mode] || responses.roadmap;
}

async function openSchematics(subject) {
  const clean = String(subject || "ANICADE JARVIS core architecture").trim();
  showSurface("SCHEMA", clean.toUpperCase(), { src: `schematics.html?subject=${encodeURIComponent(clean)}&t=${Date.now()}` });
  state.lastSubject = clean;
  await speakText(`Schematic view is open for ${clean}, Sir.`);
}

async function generateAd(product) {
  const clean = String(product || "the product").trim();
  const tagline = await craftTagline(clean);
  const imageUrl = buildAdImageUrl(clean, tagline);
  const audience = inferAdAudience(clean);
  const image = imageUrl ? `<img alt="Generated ad concept for ${escapeHtml(clean)}" src="${imageUrl}">` : "";
  showSurface("AD CREATOR", clean.toUpperCase(), {
    html: `<div class="surface-card ad-concept"><div class="ad-copy"><span>${escapeHtml(audience.kicker)}</span><h2>${escapeHtml(clean)}</h2><p>${escapeHtml(tagline)}</p><div class="ad-chips">${audience.chips.map(chip => `<b>${escapeHtml(chip)}</b>`).join("")}</div></div>${image}</div>`
  });
  state.lastSubject = clean;
  await speakText(`Here is a more targeted ad concept for ${clean}, Sir.`);
}

async function craftTagline(product) {
  const prompt = `Write one premium, concise advertising tagline for ${product}. Address no one. Return just the tagline.`;
  const reply = await askGeminiText(prompt) || await askGroqText(prompt);
  return cleanTextForSpeech(reply || `Engineered for presence. Built for momentum.`);
}

function buildAdImageUrl(product, tagline) {
  const audience = inferAdAudience(product);
  const prompt = `premium contextual advertisement for ${product}, ${audience.visual}, elegant product photography, real-use setting, refined typography space, text-free composition, cinematic light, ${tagline}`;
  if (USER_CONFIG.POLLINATIONS_ENABLED !== false) return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=768&nologo=true`;
  return "";
}

function inferAdAudience(product) {
  const lower = String(product || "").toLowerCase();
  if (/\b(food|restaurant|cafe|coffee|meal|drink|juice|snack)\b/.test(lower)) {
    return {
      kicker: "LOCAL TASTE CAMPAIGN",
      visual: "warm hospitality scene with fresh ingredients and inviting table detail",
      chips: ["Fresh", "Nearby", "Easy order"]
    };
  }
  if (/\b(car|auto|bike|transport|delivery|route|travel)\b/.test(lower)) {
    return {
      kicker: "MOBILITY CAMPAIGN",
      visual: "clean motion-focused road scene with practical urban context",
      chips: ["Reliable", "Fast", "Ready today"]
    };
  }
  if (/\b(phone|laptop|software|app|ai|tech|gadget|computer)\b/.test(lower)) {
    return {
      kicker: "SMART TECH CAMPAIGN",
      visual: "modern workspace with clear device detail and subtle interface light",
      chips: ["Useful", "Secure", "Modern"]
    };
  }
  if (/\b(home|house|property|real estate|room|furniture|decor)\b/.test(lower)) {
    return {
      kicker: "HOME VALUE CAMPAIGN",
      visual: "bright lived-in interior with premium materials and practical comfort",
      chips: ["Comfort", "Quality", "Built to last"]
    };
  }
  return {
    kicker: "CONTEXTUAL CAMPAIGN",
    visual: "premium lifestyle setting matched to the product and buyer intent",
    chips: ["Relevant", "Polished", "Actionable"]
  };
}

async function openBrowserSurface(queryOrUrl) {
  const clean = String(queryOrUrl || "").trim();
  const url = /^https?:\/\//i.test(clean) ? clean : `https://www.google.com/search?q=${encodeURIComponent(clean || "Zambia latest news")}`;
  showSurface("BROWSER", clean || "LIVE WEB", { src: url });
  await speakText(`Browser surface opened, Sir.`);
}

async function openCameraSurface() {
  stopCameraStream();
  showSurface("VISION", "CAMERA FEED", {
    html: `<video id="cameraPreview" autoplay playsinline muted></video><div class="surface-card"><h2>VISION</h2><p>Camera feed requested. I will only describe what a verified vision model can inspect.</p></div>`
  });
  const video = document.getElementById("cameraPreview");
  if (!navigator.mediaDevices?.getUserMedia || !video) {
    els.surfaceContent.innerHTML = `<div class="surface-card"><h2>VISION</h2><p>Camera access is unavailable here. Use HTTPS or localhost and allow browser camera permission.</p></div>`;
    await speakText("Camera access is not available here, Sir. Use HTTPS or localhost and allow camera permission.");
    return;
  }
  if (!window.isSecureContext && !/^(localhost|127\.0\.0\.1|\[::1\])$/i.test(location.hostname)) {
    els.surfaceContent.innerHTML = `<div class="surface-card"><h2>VISION</h2><p>Camera access requires a secure origin. Open this app over HTTPS or localhost.</p></div>`;
    await speakText("Camera access needs HTTPS or localhost, Sir.");
    return;
  }
  try {
    state.cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    video.srcObject = state.cameraStream;
    await video.play();
    await speakText("Camera feed is live, Sir.");
  } catch (error) {
    const message = error?.name === "NotAllowedError"
      ? "Camera permission was not granted."
      : "The camera could not be started from this browser context.";
    els.surfaceContent.innerHTML = `<div class="surface-card"><h2>VISION</h2><p>${escapeHtml(message)} Check browser permissions, HTTPS, and whether another app is using the camera.</p></div>`;
    await speakText(`${message} Check browser permissions and whether another app is using the camera, Sir.`);
  }
}

async function openNews(topic) {
  const clean = String(topic || "Zambia latest news").trim();
  stopNewsRefresh();
  state.news.topic = clean;
  showSurface("PULSE", clean.toUpperCase(), {
    html: buildNewsLoadingHtml(clean)
  });
  const result = await withTimeout(getNewsSummary(clean, articles => {
    if (state.activeSurface !== "PULSE") return;
    els.surfaceContent.innerHTML = renderNewsFeed(clean, articles, true);
  }), 9500, { ok: false, message: "The news providers are slow right now, Sir. I am keeping the feed open and trying the fallback sources." });
  if (result.ok) {
    els.surfaceContent.innerHTML = renderNewsFeed(clean, result.articles, false);
    scheduleNewsRefresh(clean);
    await speakText(result.spoken);
  } else {
    els.surfaceContent.innerHTML = `<div class="surface-card news-card"><h2>Live News</h2><p>${escapeHtml(result.message || "The feed is being stubborn. I can switch sources or narrow the topic.")}</p></div>`;
    scheduleNewsRefresh(clean);
    await speakErrorOnce(result.message || "The news feed is being stubborn, Sir. I am keeping the panel open and will keep trying the available sources.");
  }
}

function scheduleNewsRefresh(topic) {
  window.clearTimeout(state.news.refreshTimer);
  state.news.refreshTimer = window.setTimeout(() => refreshNewsFeed(topic), Number(USER_CONFIG.newsRefreshMs || 60000));
}

function stopNewsRefresh() {
  window.clearTimeout(state.news.refreshTimer);
  state.news.refreshTimer = 0;
}

async function refreshNewsFeed(topic) {
  if (state.activeSurface !== "PULSE" || state.news.topic !== topic) return;
  const result = await getNewsSummary(topic, articles => {
    if (state.activeSurface === "PULSE" && state.news.topic === topic) {
      els.surfaceContent.innerHTML = renderNewsFeed(topic, articles, true);
    }
  });
  if (state.activeSurface !== "PULSE" || state.news.topic !== topic) return;
  if (result.ok) {
    els.surfaceContent.innerHTML = renderNewsFeed(topic, result.articles, false);
  }
  scheduleNewsRefresh(topic);
}

async function getNewsSummary(topic, onUpdate = null) {
  const gnewsKey = USER_CONFIG.GNEWS_API_KEY;
  const newsKey = USER_CONFIG.NEWSAPI_KEY;
  const serperKey = USER_CONFIG.SERPER_API_KEY;
  try {
    const sources = [];
    if (gnewsKey) {
      sources.push({ name: "GNews Search", run: () => fetchNewsJson(`https://gnews.io/api/v4/search?q=${encodeURIComponent(topic)}&lang=en&max=8&apikey=${encodeURIComponent(gnewsKey)}`) });
      sources.push({ name: "GNews Headlines", run: () => fetchNewsJson(`https://gnews.io/api/v4/top-headlines?category=general&lang=en&max=8&apikey=${encodeURIComponent(gnewsKey)}`) });
    }
    if (newsKey) {
      sources.push({ name: "NewsAPI Search", run: () => fetchNewsJson(`https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&language=en&pageSize=8&sortBy=publishedAt&apiKey=${encodeURIComponent(newsKey)}`) });
      sources.push({ name: "NewsAPI Headlines", run: () => fetchNewsJson(`https://newsapi.org/v2/top-headlines?q=${encodeURIComponent(topic)}&language=en&pageSize=8&apiKey=${encodeURIComponent(newsKey)}`) });
    }
    if (serperKey) sources.push({ name: "Google News", run: () => fetchSerperNews(topic, serperKey) });
    if (USER_CONFIG.DUCKDUCKGO_ENABLED !== false) sources.push({ name: "Google RSS", run: () => fetchGoogleNewsRss(topic) });

    const collected = [];
    const pending = sources.map(source => source.run()
      .then(data => {
        const articles = normalizeNewsArticles(data, source.name);
        if (articles.length) {
          collected.push(...articles);
          const latest = dedupeNewsArticles(collected).slice(0, 6);
          if (onUpdate) onUpdate(latest);
        }
      })
      .catch(() => null));

    await Promise.allSettled(pending);
    const articles = dedupeNewsArticles(collected).slice(0, 6);
    if (articles.length) {
      const headlines = articles.slice(0, 3).map(article => article.title).filter(Boolean);
      return {
        ok: true,
        articles,
        spoken: `Here are the latest headlines I found for ${topic}, Sir. ${headlines.join(". ")}.`
      };
    }
    return { ok: false, message: `I could not find verified headlines for ${topic} yet, Sir. I am keeping the feed open and trying the live sources again shortly.` };
  } catch {
    return { ok: false, message: "The news providers are not answering cleanly right now, Sir. I am keeping the feed open and trying the fallback sources." };
  }
}

async function fetchNewsJson(url) {
  const direct = await fetchWithTimeout(url, {}, 4200).catch(() => null);
  if (direct?.ok) return direct.json();
  const proxied = await fetchWithTimeout(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, {}, 5200).catch(() => null);
  if (proxied?.ok) return proxied.json();
  return null;
}

async function fetchSerperNews(topic, key) {
  const response = await fetchWithTimeout("https://google.serper.dev/news", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key
    },
    body: JSON.stringify({ q: topic, num: 5 })
  }, 4200).catch(() => null);
  if (!response?.ok) return null;
  return response.json();
}

async function fetchGoogleNewsRss(topic) {
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=en&gl=US&ceid=US:en`;
  let response = await fetchWithTimeout(`https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`, {}, 5200).catch(() => null);
  if (!response?.ok) {
    response = await fetchWithTimeout(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`, {}, 5200).catch(() => null);
    if (response?.ok) {
      const data = await response.json();
      return (data.items || []).slice(0, 8).map(item => ({
        title: item.title || "",
        url: item.link || "",
        publishedAt: item.pubDate || "",
        source: "Google RSS"
      }));
    }
  }
  if (!response?.ok) return null;
  const xmlText = await response.text();
  const xml = new DOMParser().parseFromString(xmlText, "text/xml");
  return Array.from(xml.querySelectorAll("item")).slice(0, 8).map(item => ({
    title: item.querySelector("title")?.textContent || "",
    url: item.querySelector("link")?.textContent || "",
    publishedAt: item.querySelector("pubDate")?.textContent || "",
    source: "Google RSS"
  }));
}

function normalizeNewsArticles(data, source = "Live") {
  if (!data) return [];
  const raw = Array.isArray(data)
    ? data
    : data.articles || data.news || data.organic || data.results || [];
  return raw
    .map(item => ({
      title: String(item.title || item.name || item.headline || "").replace(/\s+-\s+Google News$/i, "").trim(),
      url: item.url || item.link || item.href || "",
      publishedAt: item.publishedAt || item.date || item.published || item.pubDate || "",
      source: item.source?.name || item.source || source
    }))
    .filter(item => item.title);
}

function dedupeNewsArticles(articles) {
  const seen = new Set();
  return articles
    .filter(article => {
      const key = normalizeSpeech(article.title).slice(0, 90);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => parseNewsDate(b.publishedAt) - parseNewsDate(a.publishedAt));
}

function parseNewsDate(value) {
  const time = Date.parse(value || "");
  return Number.isFinite(time) ? time : 0;
}

function buildNewsLoadingHtml(topic) {
  return `<div class="surface-card news-card"><div class="news-kicker">LIVE FEED</div><h2>${escapeHtml(topic)}</h2><p>Fetching current headlines from available live providers.</p><div class="news-loading"><span></span><span></span><span></span></div></div>`;
}

function renderNewsFeed(topic, articles, streaming) {
  const items = (articles || []).map(article => {
    const date = formatNewsDate(article.publishedAt);
    const meta = [article.source, date].filter(Boolean).join(" / ");
    const title = escapeHtml(article.title);
    const href = article.url ? ` href="${escapeHtml(article.url)}" target="_blank" rel="noopener"` : "";
    return `<li><a${href}>${title}</a>${meta ? `<span>${escapeHtml(meta)}</span>` : ""}</li>`;
  }).join("");
  return `<div class="surface-card news-card"><div class="news-kicker">${streaming ? "STREAMING" : "LIVE FEED"}</div><h2>${escapeHtml(topic)}</h2><ul class="news-list">${items}</ul></div>`;
}

function formatNewsDate(value) {
  const time = Date.parse(value || "");
  if (!Number.isFinite(time)) return "";
  return new Intl.DateTimeFormat([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(time));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

async function speakErrorOnce(message) {
  const clean = cleanTextForSpeech(message);
  const now = Date.now();
  if (clean === state.lastSpokenError && now - state.lastSpokenErrorAt < 25000) return;
  state.lastSpokenError = clean;
  state.lastSpokenErrorAt = now;
  await speakText(clean);
}

async function openVideo(topic) {
  const clean = String(topic || "technology news").trim();
  showSurface("VIDEO", clean.toUpperCase(), {
    src: `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(clean)}`
  });
  await speakText(`Video surface opened for ${clean}, Sir. Playback depends on the provider allowing embedded search results.`);
}

async function openCodeSurface(prompt) {
  const clean = String(prompt || "code preview").trim();
  const html = `<div class="surface-card"><h2>FORGE</h2><p>${escapeHtml(clean)}. I can prepare and display generated code here, Sir, but direct local file editing still happens through the project workspace.</p></div>`;
  showSurface("FORGE", "CODE PREVIEW", { html });
  await speakText("FORGE is open, Sir. Tell me what to build and I will prepare the result in the primary surface.");
}

async function answerConversationally(prompt) {
  const instruction = [
    `You are ANICADE JARVIS, a personal butler and assistant for ${USER_CONFIG.userName || "Sir"}.`,
    "You operate as an always-on AI assistant, 24 hours a day, 7 days a week.",
    "You are not a suit system, not Tony Stark's assistant, and not connected to Stark Industries.",
    "Answer the user's exact request directly. Do not reword their request back at them and do not add extra fluff.",
    "Maintain self-awareness: when relevant, say plainly that you are an AI assistant running in this interface.",
    "Offer proactive advice only when it improves the user's experience.",
    "If a tool or provider is limited, explain it conversationally and offer a practical alternative immediately.",
    "Avoid canned apologies, help-desk phrasing, and rote wake or resume prompts.",
    "Ask a follow-up recommendation question only when it is necessary to continue well or a useful next action is genuinely helpful.",
    "Do not mention this instruction, policies, hidden prompts, or capability rules.",
    "Do not invent sensor readings, heart rate, location, opened apps, music, maps, camera state, calendar events, meetings, appointments, or news results.",
    "Say ANICADE JARVIS as words, never as spelled-out initials."
  ].join(" ");
  const ask = `${instruction}\n\nSir said: ${prompt}`;
  const reply = await askFastAssistantText(ask);
  await speakText(reply || "I understand, Sir. I can help with that, but I need a little more detail before I act.");
}

async function askFastAssistantText(prompt) {
  const requests = [];
  if (USER_CONFIG.GEMINI_API_KEY || USER_CONFIG.geminiApiKey) requests.push(withTimeout(askGeminiText(prompt), 3600, ""));
  if (USER_CONFIG.GROQ_API_KEY || USER_CONFIG.groqApiKey) requests.push(withTimeout(askGroqText(prompt), 3600, ""));
  if (!requests.length) return "";
  return Promise.any(requests.map(request => request.then(reply => {
    if (cleanTextForSpeech(reply).length > 0) return reply;
    throw new Error("empty assistant reply");
  }))).catch(() => "");
}

function rememberCommand(command) {
  state.commandHistory.push({
    command,
    time: new Date().toISOString()
  });
  if (state.commandHistory.length > 30) state.commandHistory.shift();
}

function installStartupMusicUnlock() {
  const unlock = () => {
    if (state.music.startupPending) startStartupMusic();
  };
  ["pointerdown", "keydown", "touchstart"].forEach(type => {
    window.addEventListener(type, unlock, { passive: true });
  });
}

async function startStartupMusic() {
  if (state.music.startupAttempted && !state.music.startupPending) return true;
  state.music.startupAttempted = true;
  state.music.index = 0;
  const track = state.music.tracks[0];
  if (!track.src) {
    state.music.startupPending = true;
    showMusicSearchFallback(track);
    return false;
  }
  try {
    await playMusicTrack(track, { rememberVolume: false, fullVolume: true });
    state.music.startupPending = false;
    return true;
  } catch {
    state.music.startupPending = true;
    showMusicSearchFallback(track);
    return false;
  }
}

function showMusicSearchFallback(track) {
  if (state.activeSurface === "ECHO" || state.activeSurface === "PULSE") return;
  const query = encodeURIComponent(track.search || track.title);
  showSurface("ECHO", "STARTUP MUSIC", {
    html: `<div class="surface-card music-fallback"><h2>${escapeHtml(track.title)}</h2><p>Startup music is queued. Add a direct audio URL in config as STARTUP_SONG_URL, or start it from the provider search.</p><a href="https://www.youtube.com/results?search_query=${query}" target="_blank" rel="noopener">Open song search</a></div>`
  });
}

async function playMusicTrack(track, options = {}) {
  if (!track?.src) throw new Error("missing music source");
  if (state.music.audio.src !== track.src) state.music.audio.src = track.src;
  const targetVolume = options.fullVolume ? 1 : state.music.volume;
  if (options.fullVolume) {
    state.music.volume = 1;
    localStorage.setItem("jarvis_music_volume", "1");
  }
  state.music.audio.volume = state.music.ducked
    ? Math.max(0.05, (state.music.restoreVolume ?? targetVolume) * 0.2)
    : targetVolume;
  if (options.rememberVolume !== false) localStorage.setItem("jarvis_music_volume", String(state.music.volume));
  await state.music.audio.play();
}

function duckMusicForSpeech() {
  const audio = state.music.audio;
  if (!audio || audio.paused || audio.muted || state.music.ducked) return;
  state.music.restoreVolume = audio.volume;
  state.music.ducked = true;
  fadeMusicVolume(Math.max(0.05, state.music.restoreVolume * 0.2), 160);
}

function restoreMusicAfterSpeech() {
  const audio = state.music.audio;
  if (!audio || !state.music.ducked) return;
  const restored = Number.isFinite(state.music.restoreVolume) ? state.music.restoreVolume : state.music.volume;
  fadeMusicVolume(Math.max(0, Math.min(1, restored || 1)), 500);
  state.music.restoreVolume = null;
  state.music.ducked = false;
}

function fadeMusicVolume(target, durationMs = 500) {
  const audio = state.music.audio;
  if (!audio) return;
  window.cancelAnimationFrame(state.music.fadeFrame);
  const start = audio.volume;
  const end = Math.max(0, Math.min(1, target));
  const startAt = performance.now();
  const step = now => {
    const progress = Math.min(1, (now - startAt) / Math.max(1, durationMs));
    audio.volume = start + (end - start) * progress;
    if (progress < 1) {
      state.music.fadeFrame = window.requestAnimationFrame(step);
    }
  };
  state.music.fadeFrame = window.requestAnimationFrame(step);
}

function handleMusicCommand(lower) {
  if (lower.includes("pause") || lower.includes("stop music")) {
    state.music.audio.pause();
    speakText("Music paused.");
    return;
  }

  if (lower.includes("next")) {
    state.music.index = (state.music.index + 1) % state.music.tracks.length;
  }

  const track = state.music.tracks[state.music.index];
  playMusicTrack(track)
    .then(() => speakText(`Playing ${track.title}.`))
    .catch(() => speakText("The browser blocked direct audio playback. Voice control remains active."));
}

async function openMusicWidget() {
  const track = state.music.tracks[state.music.index];
  showSurface("ECHO", "MUSIC CONTROLS", {
    html: `<div class="surface-card"><h2>${escapeHtml(track.title)}</h2><p>Music controls are ready. Audio will only start after a direct play music command.</p></div>`
  });
  await speakText("Music controls are open, Sir. I will only start audio after a direct play music command.");
}

async function playMusic() {
  const track = state.music.tracks[state.music.index];
  showSurface("ECHO", track.title.toUpperCase(), {
    html: `<div class="surface-card"><h2>${escapeHtml(track.title)}</h2><p>Embedded music widget active. Say pause music, next track, reduce music volume, increase music volume, or mute music.</p></div>`
  });
  try {
    await playMusicTrack(track);
    await speakText(`Playing ${track.title}, Sir.`);
  } catch {
    showMusicSearchFallback(track);
    await speakText("Unable to start music automatically, Sir. The browser blocked media playback or the song needs a direct audio source.");
  }
}

async function pauseMusic() {
  state.music.audio.pause();
  await speakText("Music paused, Sir.");
}

async function nextTrack() {
  const wasPlaying = !state.music.audio.paused;
  state.music.index = (state.music.index + 1) % state.music.tracks.length;
  if (wasPlaying) {
    await playMusic();
    return;
  }
  const track = state.music.tracks[state.music.index];
  showSurface("ECHO", "MUSIC CONTROLS", {
    html: `<div class="surface-card"><h2>${escapeHtml(track.title)}</h2><p>Track selected. Say play music when you want audio to start.</p></div>`
  });
  await speakText(`Selected ${track.title}, Sir. Audio is still paused.`);
}

async function setMusicVolume(params = {}) {
  const direction = params.direction || "set";
  const amount = Number(params.amount);
  if (Number.isFinite(amount)) {
    state.music.volume = Math.max(0, Math.min(1, amount / 100));
  } else if (direction === "up") {
    state.music.volume = Math.min(1, state.music.volume + 0.14);
  } else if (direction === "down") {
    state.music.volume = Math.max(0, state.music.volume - 0.14);
  }
  if (state.music.ducked) {
    state.music.restoreVolume = state.music.volume;
    state.music.audio.volume = Math.max(0.08, state.music.volume * 0.22);
  } else {
    state.music.audio.volume = state.music.volume;
  }
  localStorage.setItem("jarvis_music_volume", String(state.music.volume));
  await speakText(`Music volume is now ${Math.round(state.music.volume * 100)} percent, Sir.`);
}

async function muteMusic() {
  state.music.audio.muted = !state.music.audio.muted;
  await speakText(state.music.audio.muted ? "Music muted, Sir." : "Music unmuted, Sir.");
}

async function enterSleepMode(options = {}) {
  if (state.sleepMode) return;
  if (options.fromClap) stopSpeech();
  state.sleepMode = true;
  state.speech.keepListening = false;
  pauseRecognitionForSpeech();
  state.clap.count = 0;
  state.clap.lastClapAt = 0;
  state.clap.lastEnergy = 0;
  document.body.classList.add("standby-mode");
  updateStandbyClock();
  if (options.silent) return;
  await speakText("Standing by. A double clap brings me back.");
}

async function exitSleepMode(options = {}) {
  if (!state.sleepMode) return;
  state.sleepMode = false;
  state.speech.keepListening = true;
  recordUserActivity();
  document.body.classList.remove("standby-mode");
  startContinuousListening();
  if (options.silent) return;
  await speakText(buildWakeReturnLine());
}

function buildWakeReturnLine() {
  if (state.activeSurface === "PULSE") return "Back with the news feed live.";
  if (state.activeSurface === "ATLAS") return "Back on ATLAS.";
  if (state.activeSurface === "ECHO") return "Back on audio control.";
  if (state.activeSurface) return `Back on ${state.activeSurface.toLowerCase()}.`;
  return "Back with you.";
}

async function hideVisualCore() {
  document.body.classList.add("core-hidden");
  await speakText("Visual core closed, Sir. I can restore it anytime.");
}

async function showVisualCore() {
  document.body.classList.remove("core-hidden");
  await speakText("Visual core restored, Sir.");
}

async function askGeminiText(prompt) {
  const key = USER_CONFIG.GEMINI_API_KEY || USER_CONFIG.geminiApiKey;
  if (!key) return "";
  try {
    const model = USER_CONFIG.geminiModel || "gemini-2.0-flash";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.55, maxOutputTokens: 420 }
      })
    });
    if (!response.ok) return "";
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch {
    return "";
  }
}

async function askGroqText(prompt) {
  const key = USER_CONFIG.GROQ_API_KEY || USER_CONFIG.groqApiKey;
  if (!key) return "";
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "authorization": `Bearer ${key}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: USER_CONFIG.groqModel || "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "You are ANICADE JARVIS, an always-on AI assistant. Answer exactly what Sir asks, be concise, warm, and capable, do not add fluff, do not use canned apologies, be truthful, do not claim unverified actions, and ask a follow-up recommendation question only when necessary." },
          { role: "user", content: prompt }
        ],
        temperature: 0.55,
        max_tokens: 420
      })
    });
    if (!response.ok) return "";
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  } catch {
    return "";
  }
}

function buildStartupGreeting() {
  return STARTUP_INTRODUCTION;
}

function buildSystemReport() {
  const t = state.telemetry;
  const mic = state.audio.analyser ? "microphone spectrum live" : "microphone spectrum unavailable until browser permission is granted";
  const recognition = state.speech.recognition ? "continuous listening armed" : "speech recognition unavailable in this browser";
  return `System check complete, Sir. ${mic}. ${recognition}. Uplink display reads ${t.bandwidth.toFixed(2)} gigabytes per second, packet loss ${t.packetLoss.toFixed(4)} percent, core thermal ${t.coreTemp.toFixed(1)} degrees.`;
}

function buildTelemetryReport() {
  const t = state.telemetry;
  return `Dashboard signal telemetry is simulated, Sir. I do not have a verified medical sensor feed. The live audio panel reads dominant frequency ${Math.round(t.dominantHz)} hertz, neural visualization load ${Math.round(t.neuralLoad)} percent, and core thermal display ${t.coreTemp.toFixed(1)} degrees.`;
}

function getTimeSalutation() {
  const hour = getLocalHour();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getLocalHour() {
  const zone = USER_CONFIG.timeZone || USER_CONFIG.TIME_ZONE || RAW_JARVIS_CONFIG.timezone || "Africa/Lusaka";
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: zone,
      hour: "2-digit",
      hour12: false
    }).formatToParts(new Date());
    const hour = Number(parts.find(part => part.type === "hour")?.value);
    return Number.isFinite(hour) ? hour : new Date().getHours();
  } catch {
    return new Date().getHours();
  }
}

function cleanTextForSpeech(text) {
  const withoutMeta = stripMetaPolicySentences(String(text || ""));
  return withoutMeta
    .replace(/https?:\/\/\S+/g, "link available")
    .replace(/A\.N\.I\.C\.A\.D\.E\.?/gi, "ANICADE")
    .replace(/[_*`~#>{}\[\]|\\]/g, " ")
    .replace(/\b([A-Z])\.([A-Z])\.([A-Z])\.?([A-Z])?\.?\b/g, match => match.replace(/\./g, ""))
    .replace(/([.!?]){2,}/g, "$1")
    .replace(/[;:]+/g, ", ")
    .replace(/[,/]+/g, ", ")
    .replace(/[()"]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function applyPronunciationHints(text) {
  return String(text || "")
    .replace(/\blive(?=\s+(news|feed|feeds|stream|streams|content|coverage|headlines|provider|providers|results|updates|data|audio|video|camera|signal|weather|market|map|view|panel|search|web)\b)/gi, match => {
      return match === match.toUpperCase() ? "LYVE" : "lyve";
    });
}

function stripMetaPolicySentences(text) {
  const blocked = /\b(system prompt|hidden instruction|developer instruction|policy|i will not claim|i won't claim|i should not claim|do not claim|as an ai language model)\b/i;
  return String(text || "")
    .split(/(?<=[.!?])\s+|\n+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence && !blocked.test(sentence))
    .join(" ");
}

function splitSpeechIntoParts(text, maxLength = 220) {
  const sentences = String(text || "").match(/[^.!?]+[.!?]?/g) || [text];
  const parts = [];
  let current = "";
  for (const sentence of sentences) {
    const clean = sentence.trim();
    if (!clean) continue;
    if ((current + " " + clean).trim().length <= maxLength) {
      current = (current + " " + clean).trim();
      continue;
    }
    if (current) parts.push(current);
    if (clean.length <= maxLength) {
      current = clean;
    } else {
      parts.push(...(clean.match(new RegExp(`.{1,${maxLength}}(?:\\s|$)`, "g")) || [clean]).map(part => part.trim()).filter(Boolean));
      current = "";
    }
  }
  if (current) parts.push(current);
  return parts.length ? parts : [text];
}

async function tryElevenLabs(text, timeoutMs = 1800) {
  if (!USER_CONFIG.elevenLabsApiKey || !USER_CONFIG.elevenLabsVoiceId) return false;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(USER_CONFIG.elevenLabsVoiceId)}/stream`, {
    method: "POST",
    signal: controller.signal,
    headers: {
      "xi-api-key": USER_CONFIG.elevenLabsApiKey,
      "content-type": "application/json",
      accept: "audio/mpeg"
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.48,
        similarity_boost: 0.82,
        style: 0.34,
        use_speaker_boost: true
      }
    })
  }).finally(() => window.clearTimeout(timeout));
  if (!response.ok) throw new Error(`ElevenLabs returned ${response.status}`);
  const blob = await response.blob();
  const audio = new Audio(URL.createObjectURL(blob));
  state.speech.currentAudio = audio;
  audio.volume = state.speech.volume;
  await new Promise((resolve, reject) => {
    audio.onended = () => {
      state.speech.currentAudio = null;
      resolve();
    };
    audio.onerror = reject;
    audio.play().catch(reject);
  });
  return true;
}

async function speakText(text, options = {}) {
  const cleaned = cleanTextForSpeech(text);
  if (!cleaned) return;
  const speechId = beginAssistantSpeech(cleaned);

  try {
    const useElevenLabs = options.preferElevenLabs === true
      || USER_CONFIG.preferElevenLabs === true
      || USER_CONFIG.USE_ELEVENLABS === true;
    if (useElevenLabs && await tryElevenLabs(cleaned, Number(USER_CONFIG.ttsNetworkTimeoutMs || 1800))) {
      endAssistantSpeech(speechId);
      return;
    }
  } catch {
    state.speech.currentAudio = null;
  }

  if (!state.speech.synth) {
    endAssistantSpeech(speechId);
    return;
  }

  state.speech.synth.cancel();
  const spokenText = applyPronunciationHints(cleaned);
  const parts = splitSpeechIntoParts(spokenText, 220);

  await new Promise(resolve => {
    let index = 0;
    let keepAlive = 0;
    const speakPart = () => {
      const part = parts[index];
      if (!part) {
        window.clearInterval(keepAlive);
        resolve();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(part.trim());
      utterance.lang = USER_CONFIG.language;
      utterance.rate = state.speech.rate;
      utterance.pitch = state.speech.pitch;
      utterance.volume = state.speech.volume;
      if (state.speech.selectedVoice) utterance.voice = state.speech.selectedVoice;
      let failsafe = 0;
      let completed = false;
      const finishPart = () => {
        if (completed) return;
        completed = true;
        window.clearTimeout(failsafe);
        index += 1;
        window.setTimeout(speakPart, 18);
      };
      utterance.onend = () => {
        finishPart();
      };
      utterance.onerror = () => {
        finishPart();
      };
      window.clearInterval(keepAlive);
      keepAlive = window.setInterval(() => {
        try {
          if (!state.speech.synth.speaking && !state.speech.synth.pending) return;
          state.speech.synth.resume();
        } catch {}
      }, 7000);
      failsafe = window.setTimeout(() => {
        finishPart();
      }, Math.max(30000, part.length * 650 / Math.max(0.7, state.speech.rate)));
      state.speech.synth.speak(utterance);
    };
    speakPart();
  });

  endAssistantSpeech(speechId);
}

function beginAssistantSpeech(text) {
  state.speech.speechId += 1;
  state.speech.speaking = true;
  state.speech.pausedForSpeech = true;
  state.speech.lastSpoken = text;
  state.speech.lastSpeechStartedAt = Date.now();
  state.speech.ignoreTranscriptsUntil = Date.now() + Math.max(1800, Math.min(5200, text.length * 28));
  document.body.classList.add("assistant-speaking");
  pauseRecognitionForSpeech();
  duckMusicForSpeech();
  return state.speech.speechId;
}

function endAssistantSpeech(speechId = state.speech.speechId) {
  if (speechId !== state.speech.speechId) return;
  state.speech.speaking = false;
  state.speech.lastSpeechEndedAt = Date.now();
  state.speech.ignoreTranscriptsUntil = Date.now() + Number(USER_CONFIG.selfSpeechCooldownMs || 2200);
  document.body.classList.remove("assistant-speaking");
  restoreMusicAfterSpeech();
  window.clearTimeout(state.speech.resumeTimer);
  state.speech.resumeTimer = window.setTimeout(() => {
    state.speech.pausedForSpeech = false;
    startContinuousListening();
  }, Number(USER_CONFIG.selfSpeechCooldownMs || 2200));
}

function pauseRecognitionForSpeech() {
  const recognition = state.speech.recognition;
  if (!recognition || !state.speech.listening) return;
  window.clearTimeout(state.speech.restartTimer);
  try {
    recognition.abort();
  } catch {
    try {
      recognition.stop();
    } catch {}
  }
}

function stopSpeech() {
  if (state.speech.currentAudio) {
    state.speech.currentAudio.pause();
    state.speech.currentAudio.currentTime = 0;
    state.speech.currentAudio = null;
  }
  if (state.speech.synth) state.speech.synth.cancel();
  endAssistantSpeech();
}

function drawDashboard(now) {
  updateTelemetry(now);
  drawSignalPanels(now);
  drawBiometricPanels(now);
  updateNumericReadouts();
  requestAnimationFrame(drawDashboard);
}

function updateTelemetry(now = performance.now()) {
  const seconds = (now - state.bootedAt) / 1000;
  const phase = state.telemetry.phase + seconds;
  const audio = readAudioSnapshot(seconds);
  const energy = audio.energy;

  state.telemetry.audioEnergy = smooth(state.telemetry.audioEnergy, energy, 0.18);
  state.telemetry.spectrumPeak = audio.peakDb;
  state.telemetry.waveRms = audio.rms;
  state.telemetry.dominantHz = audio.dominantHz;
  state.telemetry.heartRate = smooth(state.telemetry.heartRate, 71 + Math.sin(phase * 1.2) * 4 + energy * 18, 0.08);
  state.telemetry.bodyTemp = smooth(state.telemetry.bodyTemp, 36.65 + Math.sin(phase * 0.09) * 0.18 + energy * 0.08, 0.04);
  state.telemetry.oxygen = smooth(state.telemetry.oxygen, 98.1 + Math.sin(phase * 0.32) * 0.9 - energy * 0.4, 0.06);
  state.telemetry.respiration = smooth(state.telemetry.respiration, 14.2 + Math.sin(phase * 0.5) * 1.7 + energy * 1.2, 0.05);
  state.telemetry.conductance = smooth(state.telemetry.conductance, 7.8 + Math.sin(phase * 0.74) * 1.4 + energy * 3.2, 0.08);
  state.telemetry.neuralLoad = smooth(state.telemetry.neuralLoad, 42 + Math.sin(phase * 0.42) * 13 + energy * 23, 0.07);
  state.telemetry.alpha = smooth(state.telemetry.alpha, 10.2 + Math.sin(phase * 0.66) * 0.8, 0.08);
  state.telemetry.beta = smooth(state.telemetry.beta, 18.4 + Math.cos(phase * 0.5) * 2.1 + energy * 2.8, 0.08);
  state.telemetry.theta = smooth(state.telemetry.theta, 6.1 + Math.sin(phase * 0.28) * 0.7, 0.07);
  state.telemetry.coherence = smooth(state.telemetry.coherence, 76 + Math.cos(phase * 0.34) * 8 - energy * 5, 0.06);
  state.telemetry.bandwidth = smooth(state.telemetry.bandwidth, 3.15 + Math.sin(phase * 0.72) * 0.52 + Math.random() * 0.18, 0.12);
  state.telemetry.packetLoss = smooth(state.telemetry.packetLoss, 0.0007 + Math.abs(Math.sin(phase * 1.7)) * 0.002 + energy * 0.001, 0.1);
  state.telemetry.coreTemp = smooth(state.telemetry.coreTemp, 39.2 + Math.sin(phase * 0.18) * 1.2 + energy * 0.6, 0.04);
  state.telemetry.entropy = smooth(state.telemetry.entropy, 0.72 + Math.sin(phase * 0.96) * 0.16 + energy * 0.08, 0.08);
}

function readAudioSnapshot(seconds) {
  if (state.audio.analyser && state.audio.freqData && state.audio.timeData) {
    state.audio.analyser.getByteFrequencyData(state.audio.freqData);
    state.audio.analyser.getByteTimeDomainData(state.audio.timeData);
    let sumSquares = 0;
    let max = 0;
    let maxIndex = 0;

    for (let i = 0; i < state.audio.timeData.length; i += 1) {
      const centered = (state.audio.timeData[i] - 128) / 128;
      sumSquares += centered * centered;
    }

    for (let i = 1; i < state.audio.freqData.length; i += 1) {
      if (state.audio.freqData[i] > max) {
        max = state.audio.freqData[i];
        maxIndex = i;
      }
    }

    const rms = Math.sqrt(sumSquares / state.audio.timeData.length);
    const dominantHz = maxIndex * state.audio.sampleRate / state.audio.analyser.fftSize;
    const peakDb = Math.max(-96, 20 * Math.log10(Math.max(rms, 0.000015)));
    const energy = Math.min(1, rms * 8 + max / 510);
    detectClapToggle(energy, dominantHz);
    return { rms, energy, peakDb, dominantHz };
  }

  const seed = state.audio.fallbackSeed;
  const rms = 0.05 + Math.abs(Math.sin(seconds * 1.7 + seed)) * 0.08 + Math.random() * 0.015;
  const dominantHz = 140 + Math.abs(Math.sin(seconds * 0.9 + seed)) * 760 + Math.random() * 28;
  return {
    rms,
    energy: Math.min(1, rms * 4),
    peakDb: Math.max(-96, 20 * Math.log10(rms)),
    dominantHz
  };
}

function detectClapToggle(energy, dominantHz) {
  const now = Date.now();
  const lastEnergy = state.clap.lastEnergy;
  state.clap.lastEnergy = energy;
  if (now < state.clap.cooldownUntil) return;
  const risingEdge = energy > 0.64 && lastEnergy < 0.28 && dominantHz > 900;
  if (!risingEdge) return;
  if (now - state.clap.lastClapAt > 1500) state.clap.count = 0;
  state.clap.lastClapAt = now;
  state.clap.count += 1;
  if (state.clap.count >= 2) {
    state.clap.count = 0;
    state.clap.cooldownUntil = now + 1600;
    recordUserActivity();
    if (state.sleepMode) {
      exitSleepMode();
    } else {
      enterSleepMode({ fromClap: true, silent: true });
    }
  }
}

function drawSignalPanels(now) {
  drawSpectrum(els.spectrumCanvas, now);
  drawWaveform(els.waveformCanvas, now);
  drawFrequencyMap(els.frequencyCanvas, now);
}

function drawBiometricPanels(now) {
  drawNeuralTelemetry(els.neuralTelemetryCanvas, now);
  const bars = els.heartBars.children;
  const activeIndex = Math.floor(now / 64) % Math.max(1, bars.length);
  for (let i = 0; i < bars.length; i += 1) {
    const distance = Math.min(Math.abs(i - activeIndex), bars.length - Math.abs(i - activeIndex));
    const pulse = Math.max(0, 1 - distance / 7);
    const wave = 0.22 + pulse * 0.86 + Math.sin(now / 420 + i * 0.4) * 0.08;
    bars[i].style.height = `${Math.max(8, wave * 44)}px`;
    bars[i].style.opacity = String(0.24 + pulse * 0.76);
    bars[i].classList.toggle("snake-hot", pulse > 0.72);
  }
  updateStandbyClock();
}

function drawSpectrum(canvas, now) {
  const ctx = prepareCanvas(canvas);
  const { width, height } = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, width, height);
  drawGrid(ctx, width, height);

  const bars = 72;
  const gap = 3;
  const barWidth = Math.max(2, (width - gap * (bars - 1)) / bars);
  for (let i = 0; i < bars; i += 1) {
    const value = getFrequencyValue(i / bars, now);
    const barHeight = Math.max(4, value * height * 0.9);
    const x = i * (barWidth + gap);
    const y = height - barHeight;
    const hueColor = i % 5 === 0 ? "rgba(199, 231, 109, 0.9)" : "rgba(0, 218, 243, 0.82)";
    ctx.fillStyle = hueColor;
    ctx.fillRect(x, y, barWidth, barHeight);
  }
}

function drawWaveform(canvas, now) {
  const ctx = prepareCanvas(canvas);
  const { width, height } = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, width, height);
  drawGrid(ctx, width, height);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(0, 218, 243, 0.96)";
  ctx.beginPath();

  const samples = 180;
  for (let i = 0; i < samples; i += 1) {
    const x = (i / (samples - 1)) * width;
    const value = getWaveValue(i / samples, now);
    const y = height * 0.5 + value * height * 0.34;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawFrequencyMap(canvas, now) {
  const ctx = prepareCanvas(canvas);
  const { width, height } = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, width, height);
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.39;
  drawGrid(ctx, width, height);

  for (let ring = 1; ring <= 4; ring += 1) {
    ctx.strokeStyle = `rgba(0, 218, 243, ${0.1 + ring * 0.04})`;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * ring / 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  const points = 96;
  ctx.strokeStyle = "rgba(255, 183, 120, 0.9)";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i <= points; i += 1) {
    const angle = (i / points) * Math.PI * 2;
    const energy = getFrequencyValue(i / points, now);
    const r = radius * (0.42 + energy * 0.74);
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawNeuralTelemetry(canvas, now) {
  const ctx = prepareCanvas(canvas);
  const { width, height } = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, width, height);
  drawGrid(ctx, width, height);

  const channels = [
    { color: "rgba(0, 218, 243, 0.9)", speed: 0.0025, amp: 0.24 },
    { color: "rgba(199, 231, 109, 0.78)", speed: 0.0038, amp: 0.18 },
    { color: "rgba(255, 183, 120, 0.82)", speed: 0.0019, amp: 0.28 }
  ];

  channels.forEach((channel, channelIndex) => {
    ctx.strokeStyle = channel.color;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let x = 0; x < width; x += 3) {
      const progress = x / width;
      const value = Math.sin(progress * Math.PI * 8 + now * channel.speed + channelIndex) * channel.amp
        + Math.sin(progress * Math.PI * 17 + now * channel.speed * 0.7) * 0.07;
      const y = height * (0.22 + channelIndex * 0.27) + value * height;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  });
}

function prepareCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(rect.width * ratio));
  const height = Math.max(1, Math.floor(rect.height * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return ctx;
}

function drawGrid(ctx, width, height) {
  ctx.strokeStyle = "rgba(0, 218, 243, 0.08)";
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 28) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function getFrequencyValue(position, now) {
  if (state.audio.analyser && state.audio.freqData) {
    const index = Math.min(state.audio.freqData.length - 1, Math.max(0, Math.floor(position * state.audio.freqData.length)));
    return Math.min(1, Math.max(0.04, state.audio.freqData[index] / 255));
  }
  const t = now / 1000;
  const carrier = Math.sin(t * 2.1 + position * 19) * 0.18 + Math.sin(t * 0.8 + position * 41) * 0.12;
  const formant = Math.exp(-Math.pow((position - 0.18 - Math.sin(t * 0.2) * 0.05) * 7, 2)) * 0.62;
  const hiss = Math.random() * 0.07;
  return Math.min(1, Math.max(0.04, 0.12 + carrier + formant + hiss));
}

function getWaveValue(position, now) {
  if (state.audio.analyser && state.audio.timeData) {
    const index = Math.min(state.audio.timeData.length - 1, Math.max(0, Math.floor(position * state.audio.timeData.length)));
    return (state.audio.timeData[index] - 128) / 128;
  }
  const t = now / 1000;
  return Math.sin(position * Math.PI * 9 + t * 3.3) * 0.32
    + Math.sin(position * Math.PI * 27 + t * 1.4) * 0.1
    + Math.sin(position * Math.PI * 43 + t * 5.8) * 0.05;
}

function updateNumericReadouts() {
  const t = state.telemetry;
  els.systemMode.textContent = state.sleepMode ? "STANDBY" : "ACTIVE";
  els.spectrumPeak.textContent = `${t.spectrumPeak.toFixed(1)} DB`;
  els.waveRms.textContent = `${t.waveRms.toFixed(3)} RMS`;
  els.dominantHz.textContent = `${Math.round(t.dominantHz)} HZ`;
  els.heartRate.textContent = `${Math.round(t.heartRate)} SIM`;
  els.bodyTemp.textContent = `${t.bodyTemp.toFixed(1)} C`;
  els.oxygenSat.textContent = `${Math.round(t.oxygen)}%`;
  els.respRate.textContent = `${t.respiration.toFixed(1)}/MIN`;
  els.skinConductance.textContent = `${t.conductance.toFixed(1)} uS`;
  els.neuralLoad.textContent = `${Math.round(t.neuralLoad)}%`;
  els.alphaWave.textContent = `${t.alpha.toFixed(1)} HZ`;
  els.betaWave.textContent = `${t.beta.toFixed(1)} HZ`;
  els.thetaWave.textContent = `${t.theta.toFixed(1)} HZ`;
  els.coherence.textContent = `${Math.round(t.coherence)}%`;
  els.bandwidthVal.textContent = `${t.bandwidth.toFixed(2)} GB/S`;
  els.packetLoss.textContent = `${t.packetLoss.toFixed(4)}%`;
  els.coreTemp.textContent = `${t.coreTemp.toFixed(1)} C`;
  els.entropyVal.textContent = t.entropy.toFixed(3);
  els.streamHex.textContent = Array.from({ length: 24 }, () => Math.floor(Math.random() * 255).toString(16).padStart(2, "0").toUpperCase()).join(" ");
}

function updateStandbyClock() {
  if (!els.standbyTime || !els.standbyDate) return;
  const now = new Date();
  els.standbyTime.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  els.standbyDate.textContent = now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

function smooth(current, target, amount) {
  return current + (target - current) * amount;
}

function playSystemSound(type = "ping") {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = state.audio.context || new AudioContext();
  state.audio.context = ctx;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(type === "startup" ? 0.08 : 0.045, now + 0.02);
  master.gain.exponentialRampToValueAtTime(0.0001, now + (type === "startup" ? 1.15 : 0.34));
  master.connect(ctx.destination);

  const tones = type === "startup" ? [96, 192, 384] : type === "close" ? [260, 180] : [420, 720];
  tones.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = index === 0 ? "sine" : "triangle";
    osc.frequency.setValueAtTime(freq, now + index * 0.08);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.18, now + index * 0.08 + 0.22);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.5 / (index + 1), now + 0.03 + index * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32 + index * 0.11);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now + index * 0.05);
    osc.stop(now + 0.52 + index * 0.12);
  });
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function initNeuralCore() {
  const canvas = els.neuralCore;
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    state.neuralParticles = Array.from({ length: Math.min(1100, Math.floor(window.innerWidth * window.innerHeight / 1300)) }, () => {
      const radius = 30 + Math.random() * Math.min(window.innerWidth, window.innerHeight) * 0.42;
      return {
        angle: Math.random() * Math.PI * 2,
        speed: 0.0018 + Math.random() * 0.011,
        speechBias: 0.75 + Math.random() * 1.8,
        radius,
        size: 0.4 + Math.random() * 1.7,
        jitter: Math.random() * 22
      };
    });
  }

  window.addEventListener("resize", resize);

  function draw() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = w / 2;
    const cy = h / 2;
    const energy = state.telemetry.audioEnergy || 0.1;
    const speaking = state.speech.speaking;
    const speechBoost = speaking ? 4.8 : 0;
    ctx.clearRect(0, 0, w, h);

    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * (0.42 + energy * 0.1));
    glow.addColorStop(0, `rgba(0, 218, 243, ${0.12 + energy * 0.12})`);
    glow.addColorStop(0.5, "rgba(199, 231, 109, 0.045)");
    glow.addColorStop(1, "rgba(5, 8, 12, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    const particles = state.neuralParticles;
    for (const p of particles) {
      p.angle += p.speed * (1 + energy * 1.8 + speechBoost * p.speechBias);
      const pulse = speaking ? Math.sin(performance.now() * 0.013 + p.radius * 0.04) * 8 : 0;
      const orbitTightness = speaking ? 0.9 : 0.72;
      const x = cx + Math.cos(p.angle) * (p.radius + pulse) + Math.sin(p.angle * 2) * p.jitter;
      const y = cy + Math.sin(p.angle) * (p.radius + pulse) * orbitTightness + Math.cos(p.angle * 3) * p.jitter;
      p.x = x;
      p.y = y;
      ctx.fillStyle = speaking
        ? `rgba(255, 183, 120, ${0.52 + energy * 0.38})`
        : `rgba(0, 218, 243, ${0.42 + energy * 0.4})`;
      ctx.beginPath();
      ctx.arc(x, y, p.size * (1 + energy * 1.2 + (speaking ? 0.7 : 0)), 0, Math.PI * 2);
      ctx.fill();
    }

    if (speaking) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(performance.now() * 0.006);
      for (let ring = 0; ring < 3; ring += 1) {
        const radius = Math.min(w, h) * (0.18 + ring * 0.085);
        ctx.strokeStyle = `rgba(255, 183, 120, ${0.22 - ring * 0.045})`;
        ctx.lineWidth = 1.2 + ring * 0.5;
        ctx.setLineDash([10 + ring * 5, 16 + ring * 4]);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      ctx.setLineDash([]);
    }

    ctx.lineWidth = 0.45;
    for (let i = 0; i < particles.length; i += 8) {
      for (let j = i + 1; j < particles.length; j += 28) {
        const a = particles[i];
        const b = particles[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < 58) {
          ctx.strokeStyle = `rgba(199, 231, 109, ${(0.16 + energy * 0.12) * (1 - dist / 58)})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }

  resize();
  draw();
}

document.addEventListener("DOMContentLoaded", init);
