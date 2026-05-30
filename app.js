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
  userName: RAW_JARVIS_CONFIG.userName || RAW_JARVIS_CONFIG.USER_NAME || "Sir"
};

const state = {
  activePanel: "",
  panelOpenAt: 0,
  map: {
    query: "London, United Kingdom",
    zoom: 12,
    mode: "roadmap"
  },
  schematicIndex: 0,
  speech: {
    synth: window.speechSynthesis || null,
    voices: [],
    selectedVoice: null,
    rate: Number(localStorage.getItem("jarvis_tts_rate") || 0.86),
    pitch: Number(localStorage.getItem("jarvis_tts_pitch") || 0.82),
    recognition: null,
    listening: false
  },
  music: {
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
  commandInput: document.getElementById("commandInput"),
  btnRunCommand: document.getElementById("btnRunCommand"),
  btnListen: document.getElementById("btnListen"),
  statusText: document.getElementById("statusText"),
  clockText: document.getElementById("clockText"),
  coreStatus: document.getElementById("coreStatus"),
  activeModule: document.getElementById("activeModule"),
  moduleSummary: document.getElementById("moduleSummary"),
  heartRate: document.getElementById("heartRate"),
  heartBars: document.getElementById("heartBars"),
  bandwidthVal: document.getElementById("bandwidthVal"),
  bandwidthMeter: document.getElementById("bandwidthMeter"),
  streamHex: document.getElementById("streamHex"),
  commandLog: document.getElementById("commandLog"),
  mapFrame: document.getElementById("mapFrame"),
  mapQuery: document.getElementById("mapQuery"),
  mapMode: document.getElementById("mapMode"),
  mapSubtitle: document.getElementById("mapSubtitle"),
  btnMapGo: document.getElementById("btnMapGo"),
  btnMapZoomIn: document.getElementById("btnMapZoomIn"),
  btnMapZoomOut: document.getElementById("btnMapZoomOut"),
  schematicFrame: document.getElementById("schematicFrame"),
  schematicSubject: document.getElementById("schematicSubject"),
  schematicSubtitle: document.getElementById("schematicSubtitle"),
  btnSchematicGo: document.getElementById("btnSchematicGo"),
  btnSchematicNext: document.getElementById("btnSchematicNext"),
  codeEditor: document.getElementById("codeEditor"),
  codePreview: document.getElementById("codePreview"),
  btnRunCode: document.getElementById("btnRunCode"),
  btnLoadSample: document.getElementById("btnLoadSample"),
  musicAudio: document.getElementById("musicAudio"),
  musicStatus: document.getElementById("musicStatus"),
  trackTitle: document.getElementById("trackTitle"),
  playlist: document.getElementById("playlist"),
  btnMusicPlay: document.getElementById("btnMusicPlay"),
  btnMusicPause: document.getElementById("btnMusicPause"),
  btnMusicNext: document.getElementById("btnMusicNext"),
  musicUpload: document.getElementById("musicUpload"),
  voiceSelect: document.getElementById("voiceSelect"),
  voiceRate: document.getElementById("voiceRate"),
  voicePitch: document.getElementById("voicePitch"),
  voiceName: document.getElementById("voiceName"),
  ttsText: document.getElementById("ttsText"),
  btnSpeakSample: document.getElementById("btnSpeakSample"),
  btnStopSpeech: document.getElementById("btnStopSpeech")
};

const schematicSubjects = [
  "modular AI assistant architecture",
  "solar microgrid control system",
  "drone delivery routing network",
  "smart home security stack",
  "satellite ground station",
  "quantum-safe payment gateway",
  "water treatment plant",
  "classroom learning platform"
];

function init() {
  buildHeartBars();
  initNeuralCore();
  initPanels();
  initMaps();
  initSchematics();
  initCodeLab();
  initMusic();
  initVoice();
  initCommands();
  updateHUD();
  setInterval(updateHUD, 130);
  renderCodePreview();
  logLine("Core loaded. Command surfaces are ready.");
}

function buildHeartBars() {
  els.heartBars.innerHTML = "";
  for (let i = 0; i < 28; i += 1) {
    const bar = document.createElement("i");
    bar.style.height = `${8 + Math.random() * 28}px`;
    bar.style.animationDelay = `${i * 42}ms`;
    els.heartBars.appendChild(bar);
  }
}

function updateHUD() {
  const now = new Date();
  els.clockText.textContent = now.toLocaleTimeString([], { hour12: false });
  els.heartRate.textContent = `${Math.round(68 + Math.random() * 8)} BPM`;
  els.bandwidthVal.textContent = `${(2.8 + Math.random() * 2.8).toFixed(2)} GB/S`;
  els.bandwidthMeter.style.width = `${62 + Math.random() * 32}%`;
  els.streamHex.textContent = Array.from({ length: 6 }, () => Math.floor(Math.random() * 255).toString(16).padStart(2, "0").toUpperCase()).join(" ");
}

function initNeuralCore() {
  const canvas = els.neuralCore;
  const ctx = canvas.getContext("2d");
  const pointer = { x: 0, y: 0, active: false };

  function resize() {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    state.neuralParticles = Array.from({ length: Math.min(900, Math.floor(window.innerWidth * window.innerHeight / 1600)) }, () => {
      const radius = 35 + Math.random() * Math.min(window.innerWidth, window.innerHeight) * 0.34;
      return {
        angle: Math.random() * Math.PI * 2,
        speed: 0.002 + Math.random() * 0.012,
        radius,
        size: 0.4 + Math.random() * 1.6,
        jitter: Math.random() * 18
      };
    });
  }

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", event => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  });

  function draw() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = w / 2;
    const cy = h / 2;
    ctx.clearRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.52);
    glow.addColorStop(0, "rgba(0, 218, 243, 0.18)");
    glow.addColorStop(0.55, "rgba(0, 104, 237, 0.06)");
    glow.addColorStop(1, "rgba(16, 20, 26, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    const particles = state.neuralParticles;
    for (const p of particles) {
      p.angle += p.speed;
      let x = cx + Math.cos(p.angle) * p.radius + Math.sin(p.angle * 2) * p.jitter;
      let y = cy + Math.sin(p.angle) * p.radius * 0.72 + Math.cos(p.angle * 3) * p.jitter;
      if (pointer.active) {
        const dx = pointer.x - x;
        const dy = pointer.y - y;
        const dist = Math.hypot(dx, dy);
        if (dist < 180 && dist > 0) {
          const push = (180 - dist) / 180;
          x -= (dx / dist) * push * 30;
          y -= (dy / dist) * push * 30;
        }
      }
      p.x = x;
      p.y = y;
      ctx.fillStyle = "rgba(0, 218, 243, 0.74)";
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.lineWidth = 0.45;
    for (let i = 0; i < particles.length; i += 7) {
      for (let j = i + 1; j < particles.length; j += 26) {
        const a = particles[i];
        const b = particles[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < 54) {
          ctx.strokeStyle = `rgba(176, 198, 255, ${0.18 * (1 - dist / 54)})`;
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

function initPanels() {
  document.querySelectorAll(".tab-button").forEach(button => {
    button.addEventListener("click", event => {
      event.stopPropagation();
      openPanel(button.dataset.panel);
    });
  });

  document.querySelectorAll("[data-close-panel]").forEach(button => {
    button.addEventListener("click", event => {
      event.stopPropagation();
      closePanels();
    });
  });

  document.querySelectorAll(".surface-panel").forEach(panel => {
    panel.addEventListener("click", event => event.stopPropagation());
  });

  document.addEventListener("click", event => {
    if (!state.activePanel) return;
    if (Date.now() - state.panelOpenAt < 250) return;
    const clickedInteractive = event.target.closest(".surface-panel, .command-tabs, .center-command");
    if (!clickedInteractive) closePanels();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closePanels();
  });
}

function openPanel(name) {
  document.querySelectorAll(".surface-panel").forEach(panel => panel.classList.remove("open"));
  document.querySelectorAll(".tab-button").forEach(button => button.classList.toggle("active", button.dataset.panel === name));
  const panel = document.querySelector(`.surface-panel[data-panel-name="${name}"]`);
  if (!panel) return false;
  panel.classList.add("open");
  state.activePanel = name;
  state.panelOpenAt = Date.now();
  els.activeModule.textContent = name.toUpperCase();
  els.moduleSummary.textContent = panel.querySelector(".surface-header p")?.textContent || "Panel open.";
  logLine(`Opened ${name.toUpperCase()} panel.`);
  return true;
}

function closePanels() {
  document.querySelectorAll(".surface-panel").forEach(panel => panel.classList.remove("open"));
  document.querySelectorAll(".tab-button").forEach(button => button.classList.remove("active"));
  state.activePanel = "";
  els.activeModule.textContent = "CORE";
  els.moduleSummary.textContent = "No module is open.";
}

function initMaps() {
  els.btnMapGo.addEventListener("click", event => {
    event.stopPropagation();
    focusMap(els.mapQuery.value, els.mapMode.value);
  });
  els.mapQuery.addEventListener("keydown", event => {
    if (event.key === "Enter") focusMap(els.mapQuery.value, els.mapMode.value);
  });
  els.mapMode.addEventListener("change", event => focusMap(els.mapQuery.value, event.target.value));
  els.btnMapZoomIn.addEventListener("click", () => zoomMap(1));
  els.btnMapZoomOut.addEventListener("click", () => zoomMap(-1));
}

function buildMapUrl() {
  const params = new URLSearchParams({
    query: state.map.query,
    zoom: String(state.map.zoom),
    mode: state.map.mode
  });
  return `maps.html?${params.toString()}`;
}

function focusMap(query, mode = state.map.mode) {
  const clean = String(query || "").trim();
  if (!clean || /\b(my location|home location|creator location)\b/i.test(clean)) {
    speakText("I do not have a stored private location. Tell me the city or coordinates to open.");
    logLine("Map request ignored: no private location is stored.");
    return;
  }
  state.map.query = clean;
  state.map.mode = mode || "roadmap";
  els.mapQuery.value = state.map.query;
  els.mapMode.value = state.map.mode;
  els.mapSubtitle.textContent = `Showing ${state.map.query} at zoom ${state.map.zoom}.`;
  animateFrame(els.mapFrame.closest(".iframe-shell"));
  els.mapFrame.src = buildMapUrl();
  openPanel("maps");
  updateCore(`ATLAS focused on ${state.map.query}.`);
  speakText(`Opening map for ${state.map.query}.`);
}

function zoomMap(delta) {
  state.map.zoom = Math.max(3, Math.min(20, state.map.zoom + delta));
  focusMap(state.map.query, state.map.mode);
}

function initSchematics() {
  els.btnSchematicGo.addEventListener("click", event => {
    event.stopPropagation();
    openSchematic(els.schematicSubject.value);
  });
  els.schematicSubject.addEventListener("keydown", event => {
    if (event.key === "Enter") openSchematic(els.schematicSubject.value);
  });
  els.btnSchematicNext.addEventListener("click", event => {
    event.stopPropagation();
    state.schematicIndex = (state.schematicIndex + 1) % schematicSubjects.length;
    openSchematic(schematicSubjects[state.schematicIndex]);
  });
}

function openSchematic(subject) {
  const clean = String(subject || "").trim() || schematicSubjects[state.schematicIndex];
  els.schematicSubject.value = clean;
  els.schematicSubtitle.textContent = `Rendering schematic for ${clean}.`;
  animateFrame(els.schematicFrame.closest(".iframe-shell"));
  els.schematicFrame.src = `schematics.html?subject=${encodeURIComponent(clean)}&t=${Date.now()}`;
  openPanel("schematics");
  updateCore(`SCHEMA rendered ${clean}.`);
  speakText(`Rendering schematic for ${clean}.`);
}

function initCodeLab() {
  els.btnRunCode.addEventListener("click", event => {
    event.stopPropagation();
    runCodePreview();
  });
  els.btnLoadSample.addEventListener("click", event => {
    event.stopPropagation();
    loadCodeSample();
    runCodePreview();
  });
  loadCodeSample();
}

function loadCodeSample() {
  els.codeEditor.value = `<!doctype html>
<html>
<head>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #06101c;
      color: #c3f5ff;
      font-family: system-ui, sans-serif;
    }
    .demo { text-align: center; }
    .pulse {
      width: 120px;
      height: 120px;
      margin: 0 auto 18px;
      background: conic-gradient(#00daf3, #b0c6ff, #ffb778, #00daf3);
      clip-path: polygon(50% 0, 100% 28%, 100% 72%, 50% 100%, 0 72%, 0 28%);
      animation: spin 5s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="demo">
    <div class="pulse"></div>
    <h1>Live Preview Online</h1>
    <p>Code executed inside the preview frame.</p>
  </div>
</body>
</html>`;
}

function runCodePreview() {
  renderCodePreview();
  openPanel("code");
  updateCore("FORGE code preview executed.");
  logLine("Code preview executed.");
}

function renderCodePreview() {
  els.codePreview.srcdoc = els.codeEditor.value;
}

function initMusic() {
  els.musicAudio.addEventListener("play", () => {
    els.musicStatus.textContent = "Playing direct stream.";
    updateCore(`Playing ${state.music.tracks[state.music.index].title}.`);
  });
  els.musicAudio.addEventListener("pause", () => {
    els.musicStatus.textContent = "Paused.";
  });
  els.musicAudio.addEventListener("ended", nextTrack);
  els.btnMusicPlay.addEventListener("click", playMusic);
  els.btnMusicPause.addEventListener("click", () => els.musicAudio.pause());
  els.btnMusicNext.addEventListener("click", nextTrack);
  els.musicUpload.addEventListener("change", event => {
    const files = Array.from(event.target.files || []);
    for (const file of files) {
      state.music.tracks.push({ title: file.name, src: URL.createObjectURL(file) });
    }
    renderPlaylist();
    logLine(`${files.length} uploaded audio track(s) added.`);
  });
  loadTrack(0);
  renderPlaylist();
}

function renderPlaylist() {
  els.playlist.innerHTML = "";
  state.music.tracks.forEach((track, index) => {
    const row = document.createElement("button");
    row.className = `track-row${index === state.music.index ? " active" : ""}`;
    row.type = "button";
    row.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(track.title)}</strong>`;
    row.addEventListener("click", event => {
      event.stopPropagation();
      loadTrack(index);
      playMusic();
    });
    els.playlist.appendChild(row);
  });
}

function loadTrack(index) {
  state.music.index = (index + state.music.tracks.length) % state.music.tracks.length;
  const track = state.music.tracks[state.music.index];
  els.musicAudio.src = track.src;
  els.trackTitle.textContent = track.title;
  renderPlaylist();
}

function playMusic() {
  openPanel("music");
  els.musicAudio.play().catch(err => {
    els.musicStatus.textContent = "Browser blocked autoplay. Press Play again.";
    logLine(`Music play blocked: ${err.message}`);
  });
}

function nextTrack() {
  loadTrack(state.music.index + 1);
  playMusic();
}

function initVoice() {
  els.voiceRate.value = String(state.speech.rate);
  els.voicePitch.value = String(state.speech.pitch);
  if (state.speech.synth) {
    state.speech.synth.onvoiceschanged = refreshVoices;
    refreshVoices();
  }
  els.voiceRate.addEventListener("input", event => {
    state.speech.rate = Number(event.target.value);
    localStorage.setItem("jarvis_tts_rate", String(state.speech.rate));
  });
  els.voicePitch.addEventListener("input", event => {
    state.speech.pitch = Number(event.target.value);
    localStorage.setItem("jarvis_tts_pitch", String(state.speech.pitch));
  });
  els.voiceSelect.addEventListener("change", () => {
    state.speech.selectedVoice = state.speech.voices.find(voice => voice.name === els.voiceSelect.value) || null;
    els.voiceName.textContent = getVoiceLabel(state.speech.selectedVoice);
  });
  els.btnSpeakSample.addEventListener("click", () => speakText(els.ttsText.value, { forceBrowser: false }));
  els.btnStopSpeech.addEventListener("click", stopSpeech);
  initSpeechRecognition();
}

function refreshVoices() {
  if (!state.speech.synth) return;
  state.speech.voices = state.speech.synth.getVoices();
  const preferred = choosePreferredVoice(state.speech.voices);
  state.speech.selectedVoice = preferred;
  els.voiceSelect.innerHTML = state.speech.voices.map(voice => `<option value="${escapeHtml(voice.name)}">${escapeHtml(getVoiceLabel(voice))}</option>`).join("");
  if (preferred) els.voiceSelect.value = preferred.name;
  els.voiceName.textContent = getVoiceLabel(preferred);
}

function choosePreferredVoice(voices) {
  const saved = localStorage.getItem("jarvis_voice_name");
  if (saved) {
    const exact = voices.find(voice => voice.name === saved);
    if (exact) return exact;
  }
  const priority = [
    /natural|neural|premium/i,
    /daniel|george|libby|sonia|serena|kate|ryan/i,
    /en-GB|English \(United Kingdom\)|UK English/i,
    /google uk english/i
  ];
  return voices
    .filter(voice => /en[-_](GB|UK)|English.*United Kingdom|UK English/i.test(`${voice.lang} ${voice.name}`))
    .sort((a, b) => scoreVoice(b, priority) - scoreVoice(a, priority))[0]
    || voices.find(voice => /^en/i.test(voice.lang))
    || voices[0]
    || null;
}

function scoreVoice(voice, patterns) {
  const label = `${voice.name} ${voice.lang}`;
  return patterns.reduce((score, pattern, index) => score + (pattern.test(label) ? 10 - index : 0), 0);
}

function getVoiceLabel(voice) {
  if (!voice) return "Browser default";
  return `${voice.name} (${voice.lang || "unknown"})`;
}

function cleanTextForSpeech(text) {
  return String(text || "")
    .replace(/https?:\/\/\S+/g, "link available on screen")
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
        stability: 0.42,
        similarity_boost: 0.78,
        style: 0.35,
        use_speaker_boost: true
      }
    })
  });
  if (!response.ok) throw new Error(`ElevenLabs returned ${response.status}`);
  const blob = await response.blob();
  const audio = new Audio(URL.createObjectURL(blob));
  audio.volume = 1;
  await audio.play();
  return true;
}

async function speakText(text, options = {}) {
  const cleaned = cleanTextForSpeech(text);
  if (!cleaned) return;
  els.statusText.textContent = "Speaking";
  els.coreStatus.textContent = cleaned;
  try {
    if (!options.forceBrowser && await tryElevenLabs(cleaned)) return;
  } catch (err) {
    logLine(`ElevenLabs unavailable, using browser voice: ${err.message}`);
  }
  if (!state.speech.synth) return;
  state.speech.synth.cancel();
  const parts = cleaned.match(/.{1,180}(?:\s|$)/g) || [cleaned];
  let index = 0;
  const speakPart = () => {
    const part = parts[index];
    if (!part) {
      els.statusText.textContent = "Ready";
      return;
    }
    const utterance = new SpeechSynthesisUtterance(part.trim());
    utterance.lang = "en-GB";
    utterance.rate = state.speech.rate;
    utterance.pitch = state.speech.pitch;
    utterance.volume = 1;
    if (state.speech.selectedVoice) utterance.voice = state.speech.selectedVoice;
    utterance.onend = () => {
      index += 1;
      setTimeout(speakPart, 90);
    };
    utterance.onerror = () => {
      index += 1;
      speakPart();
    };
    state.speech.synth.speak(utterance);
  };
  speakPart();
}

function stopSpeech() {
  if (state.speech.synth) state.speech.synth.cancel();
  els.statusText.textContent = "Ready";
}

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    els.btnListen.disabled = true;
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = "en-GB";
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.onstart = () => {
    state.speech.listening = true;
    els.statusText.textContent = "Listening";
    els.btnListen.textContent = "Stop";
  };
  recognition.onend = () => {
    state.speech.listening = false;
    els.statusText.textContent = "Ready";
    els.btnListen.textContent = "Mic";
  };
  recognition.onresult = event => {
    const transcript = event.results?.[0]?.[0]?.transcript || "";
    els.commandInput.value = transcript;
    runCommand(transcript);
  };
  state.speech.recognition = recognition;
  els.btnListen.addEventListener("click", () => {
    if (state.speech.listening) recognition.stop();
    else recognition.start();
  });
}

function initCommands() {
  els.btnRunCommand.addEventListener("click", () => runCommand(els.commandInput.value));
  els.commandInput.addEventListener("keydown", event => {
    if (event.key === "Enter") runCommand(els.commandInput.value);
  });
}

function runCommand(rawCommand) {
  const command = String(rawCommand || "").trim();
  if (!command) return;
  const lower = command.toLowerCase();
  logLine(`> ${command}`);

  if (/\b(close|dismiss|hide)\b/.test(lower)) {
    closePanels();
    speakText("Panel closed.");
    return;
  }

  if (/\b(map|maps|atlas|location|route|directions|satellite|traffic|road)\b/.test(lower)) {
    if (/\bzoom in\b/.test(lower)) return zoomMap(1);
    if (/\bzoom out\b/.test(lower)) return zoomMap(-1);
    const mode = lower.includes("satellite") ? "satellite" : lower.includes("traffic") ? "traffic" : lower.includes("road") ? "roads" : state.map.mode;
    const query = command
      .replace(/^(jarvis\s*)?(open|show|launch|display|focus|find)?\s*(google\s*)?(maps?|atlas|location|directions|route)\s*(for|of|to|on)?/i, "")
      .replace(/\b(satellite|traffic|roadmap|road view|roads view|map view)\b/ig, "")
      .trim() || state.map.query;
    focusMap(query, mode);
    return;
  }

  if (/\b(schematic|schematics|schema|blueprint|diagram)\b/.test(lower)) {
    const subject = command
      .replace(/^(jarvis\s*)?(open|show|load|render|display|create)?\s*(a|an|the)?\s*(schematics?|schema|blueprint|diagram)\s*(for|of|on)?/i, "")
      .trim() || "modular AI assistant architecture";
    openSchematic(subject);
    return;
  }

  if (/\b(code|coding|preview|forge|execute|run code)\b/.test(lower)) {
    openPanel("code");
    if (lower.includes("sample")) {
      loadCodeSample();
      runCodePreview();
    } else {
      updateCore("FORGE code lab ready.");
      speakText("Code lab is open. Press run code to execute the live preview.");
    }
    return;
  }

  if (/\b(music|play|pause|next track|song|audio)\b/.test(lower)) {
    if (lower.includes("pause") || lower.includes("stop music")) {
      els.musicAudio.pause();
      speakText("Music paused.");
    } else if (lower.includes("next")) {
      nextTrack();
      speakText("Next track.");
    } else {
      playMusic();
      speakText("Playing direct audio stream.");
    }
    return;
  }

  if (/\b(voice|tts|speak|say|read)\b/.test(lower)) {
    openPanel("voice");
    const phrase = command.replace(/^(jarvis\s*)?(speak|say|read|tts)\s*/i, "").trim();
    if (phrase && phrase !== command) speakText(phrase);
    else speakText("Voice controls are open. I am using a smoother British English profile.");
    return;
  }

  if (/\b(log|history)\b/.test(lower)) {
    openPanel("log");
    speakText("Command log opened.");
    return;
  }

  updateCore(`Command noted: ${command}`);
  openPanel("log");
  speakText(`I heard ${command}. Use map, schematic, code, music, or voice commands.`);
}

function updateCore(message) {
  els.coreStatus.textContent = message;
  els.statusText.textContent = "Ready";
  logLine(message);
}

function logLine(message) {
  const stamp = new Date().toLocaleTimeString([], { hour12: false });
  els.commandLog.textContent += `\n[${stamp}] ${message}`;
  els.commandLog.scrollTop = els.commandLog.scrollHeight;
}

function animateFrame(shell) {
  if (!shell) return;
  shell.classList.remove("transitioning");
  void shell.offsetWidth;
  shell.classList.add("transitioning");
  setTimeout(() => shell.classList.remove("transitioning"), 950);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

window.addEventListener("message", event => {
  if (!event.data || typeof event.data !== "object") return;
  if (event.data.type === "schematic_ready") logLine(`Schematic ready: ${event.data.subject}`);
  if (event.data.type === "map_ready") logLine(`Map ready: ${event.data.query}`);
});

document.addEventListener("DOMContentLoaded", init);
