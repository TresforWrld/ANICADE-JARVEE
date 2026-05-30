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
    rate: Number(USER_CONFIG.ttsRate || RAW_JARVIS_CONFIG.TTS_RATE || 0.92),
    pitch: Number(USER_CONFIG.ttsPitch || RAW_JARVIS_CONFIG.TTS_PITCH || 0.78),
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
  clockText: document.getElementById("clockText"),
  bandwidthVal: document.getElementById("bandwidthVal"),
  packetLoss: document.getElementById("packetLoss"),
  coreTemp: document.getElementById("coreTemp"),
  entropyVal: document.getElementById("entropyVal"),
  streamHex: document.getElementById("streamHex")
};

function init() {
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
  if (/\b(stop|enough|cancel|silence)\b/.test(lower)) {
    stopSpeech();
    rememberCommand(transcript);
    return;
  }

  if (state.speech.speaking && isLikelyLoopback(transcript)) return;

  const wakeWord = String(USER_CONFIG.WAKE_WORD || USER_CONFIG.wakeWord || "jarvis").toLowerCase();
  const command = lower.startsWith(wakeWord) ? transcript.slice(wakeWord.length).trim() : transcript;
  runCommand(command || transcript);
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

function runCommand(rawCommand) {
  const command = String(rawCommand || "").trim();
  if (!command) return;
  rememberCommand(command);

  const lower = command.toLowerCase();

  if (/\b(system check|status report|diagnostic|diagnostics)\b/.test(lower)) {
    speakText(buildSystemReport());
    return;
  }

  if (/\b(read|report|summarize|summarise).*\b(telemetry|dashboard|vitals|biometric|signal)\b/.test(lower)) {
    speakText(buildTelemetryReport());
    return;
  }

  if (/\b(log|history|recent commands)\b/.test(lower)) {
    const recent = state.commandHistory.slice(-5).map(item => item.command).join(". ");
    speakText(recent ? `Recent command history: ${recent}.` : "No command history has been requested or stored for this session.");
    return;
  }

  if (/\b(play|pause|next).*\b(music|song|track|audio)\b|\b(music|song|track|audio)\b/.test(lower)) {
    handleMusicCommand(lower);
    return;
  }

  if (/\b(map|atlas|route|directions|location)\b/.test(lower)) {
    const target = command.replace(/^(open|show|find|route|map|atlas|directions|location|to|for|\s)+/ig, "").trim();
    speakText(target ? `Atlas request received for ${target}. Dashboard telemetry remains active.` : "Atlas is ready for a destination by voice.");
    return;
  }

  if (/\b(schematic|schema|diagram|blueprint)\b/.test(lower)) {
    const subject = command.replace(/^(open|show|render|create|a|an|the|schematic|schema|diagram|blueprint|for|of|\s)+/ig, "").trim();
    speakText(subject ? `Schematic request queued for ${subject}.` : "Schematic engine is standing by for a subject.");
    return;
  }

  if (/\b(who are you|what can you do|capabilities)\b/.test(lower)) {
    speakText("I am operating in voice first mode. I can report system state, read telemetry, manage audio playback, and route spoken commands without on screen controls.");
    return;
  }

  speakText(`Command received: ${command}.`);
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

function buildStartupGreeting() {
  const salutation = getTimeSalutation();
  return `${salutation}, ${USER_CONFIG.userName}. Signal analysis is online. Biometric telemetry is streaming. Particle field is stable. Natural JARVIS voice profile is locked. I am entering continuous listening now.`;
}

function buildSystemReport() {
  const t = state.telemetry;
  const mic = state.audio.analyser ? "microphone spectrum live" : "microphone spectrum modeled until permission is available";
  const recognition = state.speech.recognition ? "continuous listening armed" : "speech recognition unavailable in this browser";
  return `System check complete. ${mic}. ${recognition}. Uplink ${t.bandwidth.toFixed(2)} gigabytes per second, packet loss ${t.packetLoss.toFixed(4)} percent, core thermal ${t.coreTemp.toFixed(1)} degrees.`;
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
  const base = state.telemetry.heartRate / 100;
  for (let i = 0; i < bars.length; i += 1) {
    const impulse = Math.max(0, Math.sin((now / 120) - i * 0.38));
    const wave = Math.sin(now / 310 + i * 0.72) * 0.18 + 0.42;
    bars[i].style.height = `${Math.max(8, (wave + impulse * base) * 46)}px`;
    bars[i].style.opacity = String(0.38 + impulse * 0.52);
  }
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
  els.clockText.textContent = new Date().toLocaleTimeString([], { hour12: false });
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

function smooth(current, target, amount) {
  return current + (target - current) * amount;
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
