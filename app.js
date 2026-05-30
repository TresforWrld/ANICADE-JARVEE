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

const state = {
  bootedAt: performance.now(),
  commandHistory: [],
  commandChain: Promise.resolve(),
  lastIntent: null,
  lastSubject: "",
  activeSurface: "",
  sleepMode: false,
  lastSpokenError: "",
  lastSpokenErrorAt: 0,
  cameraStream: null,
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
    lastSpoken: "",
    lastSpeechEndedAt: 0,
    currentAudio: null
  },
  music: {
    audio: new Audio(),
    volume: Number(localStorage.getItem("jarvis_music_volume") || 0.72),
    tracks: [
      { title: "SoundHelix Stream 1", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
      { title: "SoundHelix Stream 2", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
      { title: "SoundHelix Stream 4", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
      { title: "SoundHelix Stream 8", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" }
    ],
    index: 0
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
  buildHeartBars();
  initNeuralCore();
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

  const greeting = buildStartupGreeting();
  try {
    await speakText(greeting, { preferElevenLabs: true });
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

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return;

  const recognition = new SpeechRecognition();
  recognition.lang = USER_CONFIG.language;
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => {
    state.speech.listening = true;
  };

  recognition.onend = () => {
    state.speech.listening = false;
    if (state.speech.keepListening) scheduleListenRestart();
  };

  recognition.onerror = () => {
    state.speech.listening = false;
    if (state.speech.keepListening) scheduleListenRestart();
  };

  recognition.onresult = event => {
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      if (!result.isFinal) continue;
      const transcript = result[0]?.transcript || "";
      handleTranscript(transcript);
    }
  };

  state.speech.recognition = recognition;
}

function scheduleListenRestart() {
  window.clearTimeout(state.speech.restartTimer);
  state.speech.restartTimer = window.setTimeout(startContinuousListening, state.speech.speaking ? 700 : 180);
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

function handleTranscript(rawTranscript) {
  const transcript = String(rawTranscript || "").trim();
  if (!transcript) return;

  const lower = transcript.toLowerCase();
  if (/^\s*(stop|enough|cancel|silence|stop speaking|be quiet)\s*[.!?]*$/i.test(lower)) {
    stopSpeech();
    rememberCommand(transcript);
    return;
  }

  if (state.speech.speaking && isLikelyLoopback(transcript)) return;

  const wakeWord = String(USER_CONFIG.WAKE_WORD || USER_CONFIG.wakeWord || "jarvis").toLowerCase();
  const wakePattern = new RegExp(`^\\s*(?:(?:hey|hi|okay|ok)\\s+)?${escapeRegExp(wakeWord)}\\b`, "i");
  const command = wakePattern.test(transcript)
    ? transcript.replace(wakePattern, "").replace(/^[,.\s]+/, "").trim()
    : transcript;

  if (!command) {
    speakText("Yes, Sir?");
    return;
  }

  state.commandChain = state.commandChain
    .then(() => runCommand(command))
    .catch(() => speakErrorOnce("Something stalled on that command, Sir. Please try it once more."));
}

function isLikelyLoopback(transcript) {
  const heard = normalizeSpeech(transcript);
  const spoken = normalizeSpeech(state.speech.lastSpoken);
  if (!heard || !spoken) return false;
  if (spoken.includes(heard) && heard.length > 18) return true;
  const words = heard.split(" ").filter(Boolean);
  if (words.length < 4) return false;
  const overlap = words.filter(word => spoken.includes(word)).length / words.length;
  return overlap > 0.82 && Date.now() - state.speech.lastSpeechEndedAt < 3200;
}

function normalizeSpeech(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

async function runCommand(rawCommand) {
  const command = String(rawCommand || "").trim();
  if (!command) return;
  rememberCommand(command);

  if (state.sleepMode && !/\b(wake|resume|start|activate|jarvis|system)\b/i.test(command)) {
    await speakText("Still here, Sir. Say wake or resume when you are ready.");
    return;
  }

  const intent = await interpretCommand(command);
  state.lastIntent = intent;
  await executeIntent(intent, command);
}

async function interpretCommand(command) {
  const localIntent = parseLocalIntent(command);
  if (localIntent.confidence >= 0.86) return localIntent;

  const aiIntent = await withTimeout(interpretWithAi(command), 2200, null);
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
  if (/^(open_map|set_map_mode|zoom_map|calculate_route)$/.test(intent.action) && !/\b(map|atlas|route|directions|location|satellite|traffic|road|terrain|zoom)\b/.test(lower)) {
    return { action: "general_chat", params: { prompt: command }, confidence: 0.42 };
  }
  if (/^(open_music|play_music|pause_music|next_track|set_music_volume|mute_music)$/.test(intent.action) && !/\b(music|song|track|audio|volume|mute|player)\b/.test(lower)) {
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
    "sleep", "wake", "hide_visual_core", "show_visual_core", "recent_commands", "general_chat", "clarify"
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
  if (/\b(read|report|summarize|summarise).*\b(telemetry|dashboard|vitals|biometric|signal)\b/.test(lower)) return { action: "telemetry_report", params: {}, confidence: 0.94 };
  if (/\b(log|history|recent commands)\b/.test(lower)) return { action: "recent_commands", params: {}, confidence: 0.94 };
  if (/\b(sleep|standby|go dark|ambient mode)\b/.test(lower)) return { action: "sleep", params: {}, confidence: 0.94 };
  if (/\b(wake|resume|activate|bring.*back)\b/.test(lower)) return { action: "wake", params: {}, confidence: 0.9 };
  if (/\b(close|hide|dismiss|remove|get rid of|shut).*\b(visual core|core|particles|particle field)\b/.test(lower)) return { action: "hide_visual_core", params: {}, confidence: 0.94 };
  if (/\b(show|restore|open|bring back).*\b(visual core|core|particles|particle field)\b/.test(lower)) return { action: "show_visual_core", params: {}, confidence: 0.94 };
  if (/\b(close|hide|dismiss|remove|get rid of|shut).*\b(module|view|browser|web|map|atlas|schematic|schema|video|news|ad|tab)\b/.test(lower)) return { action: "close_module", params: {}, confidence: 0.92 };
  if (/\b(camera|webcam|cam|video feed|camera feed)\b/.test(lower)) return { action: "open_camera", params: {}, confidence: 0.95 };

  if (/\b(volume|louder|quieter|mute|unmute)\b/.test(lower) && /\b(music|audio|song|track|player)\b/.test(lower)) {
    if (/\bmute\b/.test(lower)) return { action: "mute_music", params: {}, confidence: 0.95 };
    const amount = lower.match(/\b(\d{1,3})\s*(percent|%)\b/)?.[1];
    const direction = /\b(up|increase|louder|raise)\b/.test(lower) ? "up" : /\b(down|reduce|lower|quieter)\b/.test(lower) ? "down" : "set";
    return { action: "set_music_volume", params: { amount: amount ? Number(amount) : null, direction }, confidence: 0.95 };
  }

  if (/\b(pause|stop)\b/.test(lower) && /\b(music|song|track|audio)\b/.test(lower)) return { action: "pause_music", params: {}, confidence: 0.95 };
  if (/\bnext\b/.test(lower) && /\b(music|song|track|audio)\b/.test(lower)) return { action: "next_track", params: {}, confidence: 0.95 };
  if (/\bplay\b/.test(lower) && /\b(music|song|track|audio)\b/.test(lower)) return { action: "play_music", params: {}, confidence: 0.92 };
  if (/\b(open|show|display|launch)\b/.test(lower) && /\b(music|player|audio widget)\b/.test(lower)) return { action: "open_music", params: {}, confidence: 0.9 };

  if (/\b(map|atlas|route|directions|location)\b/.test(lower)) {
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
  if (/\b(browser|web|website|search|look up|open tab|new tab)\b/.test(lower)) return { action: "open_browser", params: { query: command.replace(/^(open|show|search|look up|new tab|browser|web|website|for|about|\s)+/ig, "").trim() || "Zambia latest news" }, confidence: 0.84 };
  if (/\b(code|coding|preview|build|make a page|write)\b/.test(lower)) return { action: "open_code", params: { prompt: command }, confidence: 0.84 };
  if (/\b(that|it|there|this)\b/.test(lower) && state.lastIntent) return { action: state.lastIntent.action, params: { ...state.lastIntent.params, followUp: command }, confidence: 0.62 };
  return { action: "general_chat", params: { prompt: command }, confidence: 0.3 };
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
  if (action === "sleep") return enterSleepMode();
  if (action === "wake") return exitSleepMode();
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
  showSurface("AD CREATOR", clean.toUpperCase(), {
    html: `<div class="surface-card"><h2>${escapeHtml(clean)}</h2><p>${escapeHtml(tagline)}</p><img alt="Generated ad concept for ${escapeHtml(clean)}" src="${imageUrl}"></div>`
  });
  state.lastSubject = clean;
  await speakText(`Here is an ad concept for ${clean}, Sir. I have prepared a concise tagline and generated a visual concept.`);
}

async function craftTagline(product) {
  const prompt = `Write one premium, concise advertising tagline for ${product}. Address no one. Return just the tagline.`;
  const reply = await askGeminiText(prompt) || await askGroqText(prompt);
  return cleanTextForSpeech(reply || `Engineered for presence. Built for momentum.`);
}

function buildAdImageUrl(product, tagline) {
  const prompt = `premium futuristic advertisement for ${product}, cyan holographic JARVIS interface, cinematic product lighting, text-free composition, ${tagline}`;
  if (USER_CONFIG.POLLINATIONS_ENABLED !== false) return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=768&nologo=true`;
  return "";
}

async function openBrowserSurface(queryOrUrl) {
  const clean = String(queryOrUrl || "").trim();
  const url = /^https?:\/\//i.test(clean) ? clean : `https://www.google.com/search?q=${encodeURIComponent(clean || "Zambia latest news")}`;
  showSurface("BROWSER", clean || "LIVE WEB", { src: url });
  await speakText(`Browser surface opened, Sir.`);
}

async function openCameraSurface() {
  showSurface("VISION", "CAMERA FEED", {
    html: `<video id="cameraPreview" autoplay playsinline muted></video><div class="surface-card"><h2>VISION</h2><p>Camera feed requested. I will describe only what a verified vision model can actually inspect.</p></div>`
  });
  const video = document.getElementById("cameraPreview");
  if (!navigator.mediaDevices?.getUserMedia || !video) {
    await speakText("Camera access is not available in this browser, Sir.");
    return;
  }
  try {
    stopCameraStream();
    state.cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    video.srcObject = state.cameraStream;
    await video.play();
    await speakText("Camera feed is live, Sir.");
  } catch {
    await speakText("Camera permission was not granted, Sir.");
  }
}

async function openNews(topic) {
  const clean = String(topic || "Zambia latest news").trim();
  showSurface("PULSE", clean.toUpperCase(), {
    html: `<div class="surface-card"><h2>News Feed</h2><p>Fetching verified headlines for ${escapeHtml(clean)}.</p></div>`
  });
  const result = await withTimeout(getNewsSummary(clean), 6500, { ok: false, message: "News is taking too long to respond, Sir." });
  if (result.ok) {
    els.surfaceContent.innerHTML = `<div class="surface-card"><h2>News Feed</h2><p>${escapeHtml(result.display)}</p></div>`;
    await speakText(result.spoken);
  } else {
    await speakErrorOnce(result.message || "News is unavailable right now, Sir.");
  }
}

async function getNewsSummary(topic) {
  const gnewsKey = USER_CONFIG.GNEWS_API_KEY;
  const newsKey = USER_CONFIG.NEWSAPI_KEY;
  if (!gnewsKey && !newsKey) return { ok: false, message: "No news key is configured, Sir." };
  try {
    const urls = [];
    if (gnewsKey) urls.push(`https://gnews.io/api/v4/search?q=${encodeURIComponent(topic)}&lang=en&max=3&apikey=${encodeURIComponent(gnewsKey)}`);
    if (newsKey) urls.push(`https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&pageSize=3&apiKey=${encodeURIComponent(newsKey)}`);
    for (const directUrl of urls) {
      const data = await fetchNewsJson(directUrl);
      const articles = data?.articles || [];
      if (articles.length) {
        const headlines = articles.slice(0, 3).map(article => article.title).filter(Boolean);
        return {
          ok: true,
          display: headlines.join("\n"),
          spoken: `Here are the latest headlines I found for ${topic}, Sir. ${headlines.join(". ")}.`
        };
      }
    }
    return { ok: false, message: `I could not find verified headlines for ${topic}, Sir.` };
  } catch {
    return { ok: false, message: "News is unavailable right now, Sir." };
  }
}

async function fetchNewsJson(url) {
  const direct = await fetch(url).catch(() => null);
  if (direct?.ok) return direct.json();
  const proxied = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`).catch(() => null);
  if (proxied?.ok) return proxied.json();
  return null;
}

async function speakErrorOnce(message) {
  const clean = cleanTextForSpeech(message);
  const now = Date.now();
  if (clean === state.lastSpokenError && now - state.lastSpokenErrorAt < 12000) return;
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
  const system = "You are ANICADE JARVIS speaking to Sir. Be truthful, natural, concise but useful. Do not claim actions were performed unless they were verified. Say ANICADE JARVIS as words, never as spelled-out initials.";
  const reply = await askGeminiText(`${system}\nSir said: ${prompt}`) || await askGroqText(`${system}\nSir said: ${prompt}`);
  await speakText(reply || "I understand, Sir. I can help with that, but I need a little more detail before I act.");
}

function rememberCommand(command) {
  state.commandHistory.push({
    command,
    time: new Date().toISOString()
  });
  if (state.commandHistory.length > 30) state.commandHistory.shift();
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
  state.music.audio.src = track.src;
  state.music.audio.play()
    .then(() => speakText(`Playing ${track.title}.`))
    .catch(() => speakText("The browser blocked direct audio playback. Voice control remains active."));
}

async function playMusic() {
  const track = state.music.tracks[state.music.index];
  state.music.audio.src = track.src;
  showSurface("ECHO", track.title.toUpperCase(), {
    html: `<div class="surface-card"><h2>${escapeHtml(track.title)}</h2><p>Embedded music widget active. Say pause music, next track, reduce music volume, increase music volume, or mute music.</p></div>`
  });
  try {
    await state.music.audio.play();
    await speakText(`Playing ${track.title}, Sir.`);
  } catch {
    await speakText("Unable to start music automatically, Sir. The browser blocked media playback until it receives a trusted interaction.");
  }
}

async function pauseMusic() {
  state.music.audio.pause();
  await speakText("Music paused, Sir.");
}

async function nextTrack() {
  state.music.index = (state.music.index + 1) % state.music.tracks.length;
  await playMusic();
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
  state.music.audio.volume = state.music.volume;
  localStorage.setItem("jarvis_music_volume", String(state.music.volume));
  await speakText(`Music volume is now ${Math.round(state.music.volume * 100)} percent, Sir.`);
}

async function muteMusic() {
  state.music.audio.muted = !state.music.audio.muted;
  await speakText(state.music.audio.muted ? "Music muted, Sir." : "Music unmuted, Sir.");
}

async function enterSleepMode() {
  state.sleepMode = true;
  document.body.classList.add("standby-mode");
  updateStandbyClock();
  await speakText("Entering standby, Sir. Essential listening remains active.");
}

async function exitSleepMode() {
  state.sleepMode = false;
  document.body.classList.remove("standby-mode");
  await speakText("Systems are back online, Sir.");
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
          { role: "system", content: "You are ANICADE JARVIS. Reply naturally to Sir. Be truthful and do not claim unverified actions." },
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
  const hour = new Date().getHours();
  const options = hour < 5
    ? ["Still working late, Sir. Essential systems are active, and I am standing by.", "Good to see you, Sir. The core is stable and continuous listening is online."]
    : hour < 12
      ? ["Good morning, Sir. All systems are operational. Ready to begin.", "Morning, Sir. Signal analysis is live, the core is stable, and I am ready."]
      : hour < 18
        ? ["Good afternoon, Sir. Operations are steady, and the command layer is online.", "Afternoon, Sir. The dashboard is live and all voice systems are standing by."]
        : ["Good evening, Sir. Everything remains stable, and I am ready when you are.", "Evening, Sir. Core systems are online and the room is yours."];
  return options[Math.floor(Math.random() * options.length)];
}

function buildSystemReport() {
  const t = state.telemetry;
  const mic = state.audio.analyser ? "microphone spectrum live" : "microphone spectrum unavailable until browser permission is granted";
  const recognition = state.speech.recognition ? "continuous listening armed" : "speech recognition unavailable in this browser";
  return `System check complete, Sir. ${mic}. ${recognition}. Uplink display reads ${t.bandwidth.toFixed(2)} gigabytes per second, packet loss ${t.packetLoss.toFixed(4)} percent, core thermal ${t.coreTemp.toFixed(1)} degrees.`;
}

function buildTelemetryReport() {
  const t = state.telemetry;
  return `Telemetry reads heart rate ${Math.round(t.heartRate)} beats per minute, body temperature ${t.bodyTemp.toFixed(1)} degrees, oxygen saturation ${Math.round(t.oxygen)} percent, neural load ${Math.round(t.neuralLoad)} percent, dominant audio frequency ${Math.round(t.dominantHz)} hertz.`;
}

function getTimeSalutation() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function cleanTextForSpeech(text) {
  return String(text || "")
    .replace(/https?:\/\/\S+/g, "link available")
    .replace(/A\.N\.I\.C\.A\.D\.E\.?/gi, "ANICADE")
    .replace(/[_*`~#>{}\[\]|\\]/g, " ")
    .replace(/\b([A-Z])\.([A-Z])\.([A-Z])\.?([A-Z])?\.?\b/g, match => match.replace(/\./g, ""))
    .replace(/([.!?]){2,}/g, "$1")
    .replace(/[;:]+/g, ". ")
    .replace(/[,/]+/g, ", ")
    .replace(/[()"]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function tryElevenLabs(text) {
  if (!USER_CONFIG.elevenLabsApiKey || !USER_CONFIG.elevenLabsVoiceId) return false;
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(USER_CONFIG.elevenLabsVoiceId)}/stream`, {
    method: "POST",
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
  });
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
  state.speech.speaking = true;
  state.speech.lastSpoken = cleaned;

  try {
    if (options.preferElevenLabs !== false && await tryElevenLabs(cleaned)) {
      state.speech.speaking = false;
      state.speech.lastSpeechEndedAt = Date.now();
      return;
    }
  } catch {
    state.speech.currentAudio = null;
  }

  if (!state.speech.synth) {
    state.speech.speaking = false;
    return;
  }

  state.speech.synth.cancel();
  const parts = cleaned.match(/.{1,180}(?:\s|$)/g) || [cleaned];

  await new Promise(resolve => {
    let index = 0;
    const speakPart = () => {
      const part = parts[index];
      if (!part) {
        resolve();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(part.trim());
      utterance.lang = USER_CONFIG.language;
      utterance.rate = state.speech.rate;
      utterance.pitch = state.speech.pitch;
      utterance.volume = state.speech.volume;
      if (state.speech.selectedVoice) utterance.voice = state.speech.selectedVoice;
      utterance.onend = () => {
        index += 1;
        window.setTimeout(speakPart, 80);
      };
      utterance.onerror = () => {
        index += 1;
        speakPart();
      };
      state.speech.synth.speak(utterance);
    };
    speakPart();
  });

  state.speech.speaking = false;
  state.speech.lastSpeechEndedAt = Date.now();
}

function stopSpeech() {
  if (state.speech.currentAudio) {
    state.speech.currentAudio.pause();
    state.speech.currentAudio.currentTime = 0;
    state.speech.currentAudio = null;
  }
  if (state.speech.synth) state.speech.synth.cancel();
  state.speech.speaking = false;
  state.speech.lastSpeechEndedAt = Date.now();
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
    return { rms, energy: Math.min(1, rms * 8 + max / 510), peakDb, dominantHz };
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
  els.heartRate.textContent = `${Math.round(t.heartRate)} BPM`;
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
    ctx.clearRect(0, 0, w, h);

    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * (0.42 + energy * 0.1));
    glow.addColorStop(0, `rgba(0, 218, 243, ${0.12 + energy * 0.12})`);
    glow.addColorStop(0.5, "rgba(199, 231, 109, 0.045)");
    glow.addColorStop(1, "rgba(5, 8, 12, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    const particles = state.neuralParticles;
    for (const p of particles) {
      p.angle += p.speed * (1 + energy * 1.8);
      const x = cx + Math.cos(p.angle) * p.radius + Math.sin(p.angle * 2) * p.jitter;
      const y = cy + Math.sin(p.angle) * p.radius * 0.72 + Math.cos(p.angle * 3) * p.jitter;
      p.x = x;
      p.y = y;
      ctx.fillStyle = `rgba(0, 218, 243, ${0.42 + energy * 0.4})`;
      ctx.beginPath();
      ctx.arc(x, y, p.size * (1 + energy * 1.2), 0, Math.PI * 2);
      ctx.fill();
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
