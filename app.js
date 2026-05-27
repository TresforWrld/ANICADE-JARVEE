/**
 * ANICADE VISION - Core Application Logic
 * Powered by ANICADE TECH
 */

// ========================================================
// 🌌 ANICADE VISION - USER CONFIGURATION CORES
// ========================================================
const USER_CONFIG = {
  geminiApiKey: '', // <-- Paste your Gemini API Key here (optional, offline OCR/Pollinations runs if empty)
  jsonbinId: '6a160caa8ef04f45381ee4d8',
  jsonbinKey: '$2a$10$VJXQzwtVgNhMTIJiiQvpy.hG7XaRD0.H42NyZhKzeLRungeekMmpO',
  jsonbinAccessKey: '$2a$10$t1pvIZA0plsMluFZ9oGuHeEXnbeyv10dGX5p15Q0xdfXGg2fsW0.2'
};

const OBFUSCATED_DEFAULT_GEMINI_KEY = atob('QUl6YVN5RHBTMjR5OHM5bW9ja0dlbWluaUtleU9iZnVzY2F0ZWQ=');

const DEFAULT_MUSIC_PLAYLIST = [
  { title: "SoundHelix Stream 1", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { title: "SoundHelix Stream 2", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { title: "SoundHelix Stream 4", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" }
];

function loadStoredMusicPlaylist() {
  try {
    const saved = JSON.parse(localStorage.getItem('anicade_music_playlist') || 'null');
    if (Array.isArray(saved) && saved.length) {
      const usable = saved.filter(track => track && track.title && track.src && !String(track.src).startsWith('blob:'));
      if (usable.length) return usable;
    }
  } catch (err) {
    console.warn('Music playlist restore failed:', err);
  }
  return DEFAULT_MUSIC_PLAYLIST.slice();
}

const state = {
  isListening: false,
  isSpeaking: false,
  isAnalyzing: false,
  isAIspeaking: false,
  recognition: null,
  recognitionActive: false,
  speechSynthesis: window.speechSynthesis,
  selectedVoiceName: localStorage.getItem('anicade_selected_voice') || localStorage.getItem('jarvis_selected_voice') || '',
  selectedLanguage: localStorage.getItem('anicade_selected_language') || 'en-GB',
  wakeWord: localStorage.getItem('anicade_wake_word') || 'anicade',
  persona: localStorage.getItem('anicade_persona') || 'vision',
  theme: localStorage.getItem('anicade_theme') || 'dark',
  particlesEnabled: localStorage.getItem('anicade_particles') !== 'off',
  mediaStream: null,
  activeInputType: 'none', // 'screen', 'camera', 'image', 'none'
  geminiApiKey: USER_CONFIG.geminiApiKey || localStorage.getItem('anicade_gemini_key') || OBFUSCATED_DEFAULT_GEMINI_KEY,
  jsonbinId: USER_CONFIG.jsonbinId || '',
  jsonbinKey: USER_CONFIG.jsonbinKey || '',
  jsonbinAccessKey: USER_CONFIG.jsonbinAccessKey || '',
  schedules: [],
  connectedApps: JSON.parse(localStorage.getItem('anicade_connected_apps') || '{"calendar":true,"outlook":true,"whatsapp":false,"facebook":false,"tiktok":false}'),
  lastAISpokenText: '',
  lastSpeechEndedAt: 0,
  speechToken: 0,
  isSelfScreenShared: false,
  recognitionStarting: false,
  recognitionRestartTimer: null,
  pendingSearchResult: null,
  deferredPrompt: null,
  typingMode: false,
  clapWakeActive: false,
  ocrWorker: null,
  ocrWorkerLoading: false,
  audioCtx: null,
  micStream: null,
  audioSource: null,
  analyser: null,
  
  // Upgraded custom states
  conversationLogs: [],
  musicPlaylist: loadStoredMusicPlaylist(),
  currentMusicIndex: 0,
  repeatMode: localStorage.getItem('anicade_music_repeat') || 'all',
  audioPlayer: null,
  musicDbReady: false,
  musicLyrics: JSON.parse(localStorage.getItem('anicade_music_lyrics') || '{}'),
  orbParticles: null,
  fsOrbParticles: null,
  outputHistory: JSON.parse(localStorage.getItem('anicade_output_history') || '[]'),
  memoryNotes: JSON.parse(localStorage.getItem('anicade_memory_notes') || '[]'),
  animalTranslations: JSON.parse(localStorage.getItem('anicade_animal_translations') || '[]')
};

let lastRetryAction = null;

// DOM Elements
const elements = {
  // Status Bar
  statusDot: document.getElementById('statusDot'),
  statusText: document.getElementById('statusText'),
  btnInstall: document.getElementById('btnInstall'),

  // Visualizer Feed
  feedBox: document.getElementById('feedBox'),
  visionVideo: document.getElementById('visionVideo'),
  visionImage: document.getElementById('visionImage'),
  feedPlaceholder: document.getElementById('feedPlaceholder'),
  feedModeLabel: document.getElementById('feedModeLabel'),

  // Feed Controls
  btnScreenShare: document.getElementById('btnScreenShare'),
  btnCamera: document.getElementById('btnCamera'),
  fileInput: document.getElementById('fileInput'),
  documentFileInput: document.getElementById('documentFileInput'),

  // Caption Log
  captionArea: document.getElementById('captionArea'),

  // Voice Assistant Orb
  speechOrbContainer: document.getElementById('speechOrbContainer'),
  speechOrb: document.getElementById('speechOrb'),
  voiceStatusText: document.getElementById('voiceStatusText'),
  voiceSubstatus: document.getElementById('voiceSubstatus'),

  // Voice Profile & Immersion toggles
  voiceSelect: document.getElementById('voiceSelect'),
  btnToggleFullScreen: document.getElementById('btnToggleFullScreen'),
  btnToggleClap: document.getElementById('btnToggleClap'),
  clapStatusText: document.getElementById('clapStatusText'),

  // Full Screen Immersive Overlay
  fullScreenOrbOverlay: document.getElementById('fullScreenOrbOverlay'),
  btnExitFullScreen: document.getElementById('btnExitFullScreen'),
  fsOrb: document.getElementById('fsOrb'),
  fsVoiceStatus: document.getElementById('fsVoiceStatus'),
  fsVoiceSubstatus: document.getElementById('fsVoiceSubstatus'),
  fsGalaxyParticles: document.getElementById('fsGalaxyParticles'),
  fsCoreMetric: document.getElementById('fsCoreMetric'),
  fsLinkStatus: document.getElementById('fsLinkStatus'),
  fsInputStatus: document.getElementById('fsInputStatus'),
  fsMemoryMetric: document.getElementById('fsMemoryMetric'),
  fsProcessMetric: document.getElementById('fsProcessMetric'),
  fsNetworkMetric: document.getElementById('fsNetworkMetric'),

  // Quick Tools & Notebook
  toolSchool: document.getElementById('toolSchool'),
  toolReply: document.getElementById('toolReply'),
  toolAdGen: document.getElementById('toolAdGen'),
  toolImageGen: document.getElementById('toolImageGen'),
  toolAnimal: document.getElementById('toolAnimal'),
  voiceTypingBox: document.getElementById('voiceTypingBox'),
  notebookStatus: document.getElementById('notebookStatus'),
  btnCopyNote: document.getElementById('btnCopyNote'),
  btnClearNote: document.getElementById('btnClearNote'),

  // Direct Image Generation Input Group
  imageGenInputGroup: document.getElementById('imageGenInputGroup'),
  imageGenPromptInput: document.getElementById('imageGenPromptInput'),
  btnTriggerImageGen: document.getElementById('btnTriggerImageGen'),

  // App integrations switches
  chkCalendar: document.getElementById('chkCalendar'),
  chkOutlook: document.getElementById('chkOutlook'),
  chkWhatsApp: document.getElementById('chkWhatsApp'),
  chkFacebook: document.getElementById('chkFacebook'),
  chkTikTok: document.getElementById('chkTikTok'),

  // Scheduler lists
  scheduleList: document.getElementById('scheduleList'),
  schedTitle: document.getElementById('schedTitle'),
  schedTime: document.getElementById('schedTime'),
  btnAddSched: document.getElementById('btnAddSched'),

  // Ad/Visual Output Layout
  adOutputContainer: document.getElementById('adOutputContainer'),
  adImage: document.getElementById('adImage'),
  btnDownloadAd: document.getElementById('btnDownloadAd'),
  
  // Animal Scanner upgrades
  animalScannerHud: document.getElementById('animalScannerHud'),
  scannerBar: document.getElementById('scannerBar'),
  animalScannerStatus: document.getElementById('animalScannerStatus'),
  animalTypeSelect: document.getElementById('animalTypeSelect'),
  btnDecodeAnimal: document.getElementById('btnDecodeAnimal'),
  apiKeyInput: document.getElementById('apiKeyInput'),
  btnSaveKey: document.getElementById('btnSaveKey'),
  langSelect: document.getElementById('langSelect'),
  schedTitle: document.getElementById('schedTitle'),
  schedTime: document.getElementById('schedTime'),
  btnAddSched: document.getElementById('btnAddSched'),
  wakeWordInput: document.getElementById('wakeWordInput'),
  personaSelect: document.getElementById('personaSelect'),
  btnToggleTheme: document.getElementById('btnToggleTheme'),
  btnToggleParticles: document.getElementById('btnToggleParticles'),
  btnSystemCheck: document.getElementById('btnSystemCheck'),
  btnClearLogs: document.getElementById('btnClearLogs'),
  answerOutputArea: document.getElementById('answerOutputArea'),
  btnCopyOutput: document.getElementById('btnCopyOutput'),
  musicStatusLabel: document.getElementById('musicStatusLabel'),
  musicTrackTitle: document.getElementById('musicTrackTitle'),
  btnMusicPlay: document.getElementById('btnMusicPlay'),
  btnMusicPause: document.getElementById('btnMusicPause'),
  btnMusicNext: document.getElementById('btnMusicNext'),
  btnMusicRepeat: document.getElementById('btnMusicRepeat'),
  musicPlaylistList: document.getElementById('musicPlaylistList'),
  musicUploadInput: document.getElementById('musicUploadInput')
};

// Initialize Application
window.addEventListener('DOMContentLoaded', () => {
  initPWA();
  initTabs();
  initCustomization();
  initVoiceSettings();
  initSpeechRecognition();
  initAPIKey();
  initStorageAndSchedules();
  setupEventListeners();
  addLog('system', 'Systems online. ANICADE VISION Core fully operational, Sir.');
  
  // Initialize particles canvases
  initAmbientEffects();
  state.orbParticles = new OrbParticleSystem('orbCanvas');
  state.orbParticles.start();
  state.fsOrbParticles = new OrbParticleSystem('fsOrbCanvas');
  state.fsOrbParticles.start();
  initMusicLibrary();
  initFullscreenGalaxyParticles();
  
  updateOutputPanel();
  
  // Start dynamic sound visualization loop for the Orb and Outer Ring
  startVoiceVisualizer();

  // Dynamic Welcome Greeting based on time of day (1.5s delay to ensure voices are loaded)
  setTimeout(() => {
    welcomeGreeting();
  }, 1500);
});

// ==========================================
// PWA & SERVICE WORKER SETUP
// ==========================================
function initPWA() {
  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('[Service Worker] Registered successfully:', reg.scope))
      .catch(err => console.error('[Service Worker] Registration failed:', err));
  }

  // Handle Install Prompt Event
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent default mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    state.deferredPrompt = e;
    // Show the install button
    elements.btnInstall.style.display = 'inline-flex';
    addLog('system', 'Installable App prompt loaded. You can now install ANICADE VISION.');
  });

  // Track Installation Status
  window.addEventListener('appinstalled', () => {
    elements.btnInstall.style.display = 'none';
    state.deferredPrompt = null;
    speakText("Thank you for installing ANICADE VISION.");
    addLog('system', 'App installed successfully. Added to homescreen/applications.');
  });
}

// ==========================================
// NAVIGATION TABS CONTROL
// ==========================================
function initTabs() {
  const tabs = document.querySelectorAll('.readme-tab');
  const panes = document.querySelectorAll('.readme-content-pane');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active classes
      tabs.forEach(t => t.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      // Add active to selected
      tab.classList.add('active');
      const targetPane = document.getElementById(tab.dataset.tab);
      if (targetPane) targetPane.classList.add('active');
    });
  });
}

function initCustomization() {
  if (state.persona === 'jarvee') setPersona('vision');
  document.body.classList.toggle('theme-light', state.theme === 'light');
  document.body.classList.toggle('particles-disabled', !state.particlesEnabled);

  if (elements.wakeWordInput) elements.wakeWordInput.value = state.wakeWord;
  if (elements.personaSelect) elements.personaSelect.value = state.persona;
  if (elements.btnToggleParticles) elements.btnToggleParticles.textContent = state.particlesEnabled ? 'Particles On' : 'Particles Off';

  if (elements.wakeWordInput) {
    elements.wakeWordInput.addEventListener('change', () => {
      const nextWord = elements.wakeWordInput.value.trim().toLowerCase() || 'anicade';
      setWakeWord(nextWord);
      speakText(`Wake word updated to ${nextWord}, Sir.`);
    });
  }

  if (elements.personaSelect) {
    elements.personaSelect.addEventListener('change', () => {
      setPersona(elements.personaSelect.value);
      speakText("Voice persona updated, Sir.");
    });
  }

  if (elements.btnToggleTheme) elements.btnToggleTheme.addEventListener('click', toggleTheme);
  if (elements.btnToggleParticles) elements.btnToggleParticles.addEventListener('click', toggleParticles);
  if (elements.btnSystemCheck) elements.btnSystemCheck.addEventListener('click', runSystemCheck);
  if (elements.btnClearLogs) elements.btnClearLogs.addEventListener('click', clearConversationLogs);
  if (elements.btnCopyOutput) elements.btnCopyOutput.addEventListener('click', copyLatestOutput);
}

function setWakeWord(nextWord) {
  const cleanWord = String(nextWord || 'anicade').toLowerCase().replace(/[^a-z0-9 -]/g, '').trim() || 'anicade';
  state.wakeWord = cleanWord;
  localStorage.setItem('anicade_wake_word', cleanWord);
  if (elements.wakeWordInput) elements.wakeWordInput.value = cleanWord;
}

function setPersona(nextPersona) {
  const allowed = ['vision', 'mentor', 'companion'];
  state.persona = allowed.includes(nextPersona) ? nextPersona : 'vision';
  localStorage.setItem('anicade_persona', state.persona);
  if (elements.personaSelect) elements.personaSelect.value = state.persona;
}

function getFriendlyVoiceName(voiceName, lang) {
  const name = voiceName.toLowerCase();
  
  // Explicitly check for the JARVIS voice (premium British Male or Daniel)
  if (name.includes('uk english male') || name.includes('daniel') || name.includes('george') || name.includes('oliver')) {
    return "JARVIS";
  }
  if (name.includes('uk english female') || name.includes('hazel') || name.includes('susan') || name.includes('elena') || name.includes('serena')) {
    return "Friday";
  }
  if (name.includes('zira')) {
    return "Zira";
  }
  if (name.includes('david')) {
    return "David";
  }
  if (name.includes('mark')) {
    return "Mark";
  }
  if (name.includes('ravi')) {
    return "Ravi";
  }
  
  // Map generic voices to nice names based on hash or index
  const maleNames = ["Arthur", "Bruce", "Clint", "Happy", "James", "Logan", "Michael", "Peter", "Steve", "Tony"];
  const femaleNames = ["Carol", "Gwen", "Hope", "Jane", "Natasha", "Peggy", "Selina", "Wanda", "Diana", "Sarah"];
  
  // Hash calculation
  let hash = 0;
  for (let i = 0; i < voiceName.length; i++) {
    hash = voiceName.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  
  const isFemale = name.includes('female') || name.includes('girl') || name.includes('zira') || name.includes('hazel') || name.includes('susan') || name.includes('helen') || name.includes('linda') || name.includes('catherine') || name.includes('haruka') || name.includes('huihui');
  
  if (isFemale) {
    return femaleNames[hash % femaleNames.length];
  } else {
    return maleNames[hash % maleNames.length];
  }
}

// ==========================================
// SPEECH SYNTHESIS ENGINE (Voice Output)
// ==========================================
function initVoiceSettings() {
  if (!state.speechSynthesis) {
    addLog('system', 'WARNING: Voice Synthesis not supported in this browser.');
    return;
  }

  function loadVoices() {
    const voices = state.speechSynthesis.getVoices();
    elements.voiceSelect.innerHTML = '';
    
    const savedVoiceName = localStorage.getItem('anicade_selected_voice') || localStorage.getItem('jarvis_selected_voice') || '';

    // Filter premium natural voices, specifically prioritizing UK British English (en-GB)
    let gbVoices = voices.filter(v => v.lang === 'en-GB' || v.lang.startsWith('en-GB'));
    let englishVoices = voices.filter(v => v.lang.startsWith('en') && v.lang !== 'en-GB' && !v.lang.startsWith('en-GB'));
    let otherVoices = voices.filter(v => !v.lang.startsWith('en'));
    
    // Sort en-GB voices so Daniel or Google UK English Male/Female are first
    gbVoices.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aPref = aName.includes('google') || aName.includes('daniel') || aName.includes('male') || aName.includes('hazel');
      const bPref = bName.includes('google') || bName.includes('daniel') || bName.includes('male') || bName.includes('hazel');
      if (aPref && !bPref) return -1;
      if (!aPref && bPref) return 1;
      return a.name.localeCompare(b.name);
    });

    const combinedVoices = [...gbVoices, ...englishVoices, ...otherVoices];

    combinedVoices.forEach(voice => {
      const option = document.createElement('option');
      option.value = voice.name;
      const friendlyName = getFriendlyVoiceName(voice.name, voice.lang);
      option.textContent = `${friendlyName} (${voice.lang})`;
      
      // Select the saved voice if it matches, or fall back to default British voice
      if (savedVoiceName && voice.name === savedVoiceName) {
        option.selected = true;
        state.selectedVoiceName = voice.name;
      } else if (!savedVoiceName && !state.selectedVoiceName && (voice.name.includes('Google UK English Male') || voice.name.includes('Daniel') || voice.name.includes('Google UK English Female') || voice.name.includes('Hazel'))) {
        option.selected = true;
        state.selectedVoiceName = voice.name;
      }
      elements.voiceSelect.appendChild(option);
    });

    if (!state.selectedVoiceName && combinedVoices.length > 0) {
      state.selectedVoiceName = combinedVoices[0].name;
    }
    
    // Sync UI value if a voice was selected
    if (state.selectedVoiceName) {
      elements.voiceSelect.value = state.selectedVoiceName;
    }
  }

  loadVoices();
  if (state.speechSynthesis.onvoiceschanged !== undefined) {
    state.speechSynthesis.onvoiceschanged = loadVoices;
  }

  // Voice Select Event
  elements.voiceSelect.addEventListener('change', () => {
    state.selectedVoiceName = elements.voiceSelect.value;
    localStorage.setItem('anicade_selected_voice', state.selectedVoiceName);
    speakText("Voice profile updated, Sir.");
  });
}

// Speak helper with cleaning & multilingual selection
function cleanTextForSpeech(text) {
  if (!text) return "";
  let clean = text;
  // Remove markdown headers, code, tables, bold/italic, list dashes, blockquotes
  clean = clean.replace(/[*#_\-~`|>\[\]\(\)\{\}]/g, ' ');
  // Remove multiple consecutive dashes/asterisks
  clean = clean.replace(/\-{2,}/g, ' ');
  clean = clean.replace(/\*{2,}/g, ' ');
  // Remove emojis and miscellaneous pictographs
  clean = clean.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
  clean = clean.replace(/[\u{1F600}-\u{1F64F}]/gu, '');
  clean = clean.replace(/[\u{2600}-\u{27BF}]/gu, '');
  clean = clean.replace(/[\u{1F680}-\u{1F6FF}]/gu, '');
  clean = clean.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '');
  // Clean redundant whitespace
  clean = clean.replace(/\s+/g, ' ').trim();
  return clean;
}

function pickVariant(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function finishAnalyzing() {
  state.isAnalyzing = false;
  updateStatusVisuals();
}

async function fetchWithTimeout(resource, options = {}, timeout = 6500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(resource, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function getBriefOfflineFallback() {
  return pickVariant([
    "I caught the request, Sir, but the quick answer channel is busy. Try that once more in a moment.",
    "The response channel stalled, Sir. I am still responsive; send it again and I will take another pass.",
    "That answer did not come back cleanly, Sir. I am ready for the next instruction.",
    "The request reached me, but the reply did not return in time. I am standing by."
  ]);
}

function safeStartRecognition() {
  if (!state.recognition || !state.isListening || state.isAIspeaking || state.recognitionActive || state.recognitionStarting) {
    return;
  }
  state.recognitionStarting = true;
  try {
    state.recognition.start();
  } catch (err) {
    state.recognitionStarting = false;
    if (state.isListening && !state.isAIspeaking) {
      scheduleRecognitionRestart(350);
    }
  }
}

function scheduleRecognitionRestart(delay = 150) {
  if (state.recognitionRestartTimer) {
    clearTimeout(state.recognitionRestartTimer);
  }
  state.recognitionRestartTimer = setTimeout(() => {
    state.recognitionRestartTimer = null;
    safeStartRecognition();
  }, delay);
}

function speakText(text) {
  // Filter text to prevent reading aloud elements like * or ## or emojis
  const cleanedText = cleanTextForSpeech(text);
  if (!cleanedText) return;

  addLog('ai', text);
  if (!state.speechSynthesis) return;

  const speechToken = state.speechToken + 1;
  state.speechToken = speechToken;
  state.lastAISpokenText = text;

  // Cancel current speech
  state.speechSynthesis.cancel();

  // If SpeechRecognition is running, temporarily stop it to avoid self-transcription feedback
  if (state.recognition && state.isListening) {
    state.isAIspeaking = true;
    if (state.recognitionActive || state.recognitionStarting) {
      try {
        state.recognition.stop();
      } catch (err) {}
    }
  }

  const utterance = new SpeechSynthesisUtterance(cleanedText);
  
  // Select voice matched to current voice select, fallback to language engine selection
  const voices = state.speechSynthesis.getVoices();
  let matchingVoice = null;
  
  if (state.selectedVoiceName) {
    matchingVoice = voices.find(v => v.name === state.selectedVoiceName && v.lang.startsWith(state.selectedLanguage.split('-')[0]));
  }
  
  if (!matchingVoice) {
    matchingVoice = voices.find(v => v.lang.startsWith(state.selectedLanguage.split('-')[0]));
  }
  
  if (matchingVoice) {
    utterance.voice = matchingVoice;
  }
  
  // Set natural voice parameters (rate 1.0 as requested)
  utterance.rate = 1.0; 
  utterance.pitch = 1.0;

  state.isSpeaking = true;
  updateStatusVisuals();

  utterance.onstart = () => {
    if (speechToken !== state.speechToken) return;
    state.isSpeaking = true;
    updateStatusVisuals();
  };

  utterance.onend = () => {
    if (speechToken !== state.speechToken) return;
    state.isSpeaking = false;
    state.lastSpeechEndedAt = Date.now();
    if (state.isAIspeaking) {
      setTimeout(() => {
        state.isAIspeaking = false;
        updateStatusVisuals();
        scheduleRecognitionRestart(120);
      }, 120);
    } else {
      updateStatusVisuals();
    }
  };

  utterance.onerror = (e) => {
    if (speechToken !== state.speechToken) return;
    console.error('Speech synthesis error:', e);
    state.isSpeaking = false;
    state.lastSpeechEndedAt = Date.now();
    if (state.isAIspeaking) {
      setTimeout(() => {
        state.isAIspeaking = false;
        updateStatusVisuals();
        scheduleRecognitionRestart(150);
      }, 120);
    } else {
      updateStatusVisuals();
    }
  };

  // Chrome Bug Workaround: ensure synthesis engine is not paused
  if (state.speechSynthesis.paused) {
    state.speechSynthesis.resume();
  }

  state.speechSynthesis.speak(utterance);
}

// ==========================================
// SPEECH RECOGNITION ENGINE (Voice Commands)
// ==========================================
function calculateStringDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function normalizeSpeechText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\bsir\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isLikelySelfTranscription(transcript) {
  const transLower = normalizeSpeechText(transcript);
  const aiSpokenLower = normalizeSpeechText(state.lastAISpokenText);
  if (!transLower || !aiSpokenLower) return false;
  if (Date.now() - state.lastSpeechEndedAt < 1800) return true;
  if (aiSpokenLower.includes(transLower) || transLower.includes(aiSpokenLower)) return true;
  const shorter = Math.min(transLower.length, aiSpokenLower.length);
  const distance = calculateStringDistance(transLower, aiSpokenLower);
  return shorter > 8 && distance / shorter < 0.28;
}

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    addLog('system', 'WARNING: Voice Recognition not supported. Click the controls manually.');
    elements.voiceSubstatus.textContent = "Voice inputs unsupported in this browser.";
    return;
  }

  state.recognition = new SpeechRecognition();
  state.recognition.continuous = true;
  state.recognition.interimResults = false;
  state.recognition.lang = state.selectedLanguage;

  state.recognition.onstart = () => {
    state.recognitionActive = true;
    state.recognitionStarting = false;
    updateStatusVisuals();
  };

  state.recognition.onend = () => {
    state.recognitionActive = false;
    state.recognitionStarting = false;
    
    // If the system stopped recognition because AI is speaking, do not restart now (it will restart in speakText onend)
    if (state.isAIspeaking) {
      return;
    }
    
    // Automatically restart if user hasn't explicitly stopped it
    if (state.isListening) {
      scheduleRecognitionRestart(160);
    } else {
      updateStatusVisuals();
    }
  };

  state.recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    if (event.error === 'not-allowed') {
      if (elements.voiceSubstatus) {
        elements.voiceSubstatus.textContent = "Microphone permission is blocked. Click the Orb after allowing microphone access.";
      }
      stopVoiceAssistant();
    }
    if (event.error === 'audio-capture') {
      stopVoiceAssistant();
      speakText("I cannot reach the microphone right now, Sir.");
    }
    if ((event.error === 'no-speech' || event.error === 'network') && state.isListening && !state.isAIspeaking) {
      scheduleRecognitionRestart(220);
    }
  };

  state.recognition.onresult = (event) => {
    if (state.isSpeaking || state.isAIspeaking || state.isAnalyzing || (window.speechSynthesis && window.speechSynthesis.speaking)) {
      console.log("Ignoring speech result because AI is speaking/analyzing/synthesizing");
      return;
    }
    const resultIndex = event.resultIndex;
    const transcript = event.results[resultIndex][0].transcript.trim();
    if (!transcript) {
      console.log("Ignored blank speech result.");
      return;
    }
    
    // Discard microphone self-transcription loopback if it matches what the AI just spoke
    if (isLikelySelfTranscription(transcript)) {
      console.log("Discarded microphone loopback feedback:", transcript);
      return;
    }

    addLog('user', transcript);
    processVoiceCommand(transcript);
  };
}

// Toggle Voice Assistant
function toggleVoiceAssistant() {
  if (!state.recognition) {
    speakText("Voice recognition is not supported on this device, Sir.");
    return;
  }

  if (state.isListening) {
    stopVoiceAssistant();
    speakText("Standby mode engaged, Sir.");
  } else {
    startVoiceAssistant();
    speakText("Visual voice core active, Sir. State your command.");
  }
}

async function startVoiceAssistant() {
  if (!state.recognition) return;
  state.isListening = true;
  await ensureMicAnalyser();
  safeStartRecognition();
  updateStatusVisuals();
}

function stopVoiceAssistant() {
  if (!state.recognition) return;
  state.isListening = false;
  state.recognitionStarting = false;
  if (state.recognitionRestartTimer) {
    clearTimeout(state.recognitionRestartTimer);
    state.recognitionRestartTimer = null;
  }
  try {
    state.recognition.stop();
  } catch (err) {}
  updateStatusVisuals();
}

function checkVoiceWakeup(cmdLower) {
  const activeVoiceName = elements.voiceSelect.value ? getFriendlyVoiceName(elements.voiceSelect.value).toLowerCase() : 'jarvis';
  const wakeupFuzzy = [
    "jarvis", "javis", "jarves", "charvis", "java", "friday", "freeday", "fryday", "phriday", "vision", "anicade", "anycade", "anicat", "arcade", "wake up"
  ];
  if (state.wakeWord && !wakeupFuzzy.includes(state.wakeWord)) {
    wakeupFuzzy.push(state.wakeWord);
  }
  if (activeVoiceName && !wakeupFuzzy.includes(activeVoiceName)) {
    wakeupFuzzy.push(activeVoiceName);
  }
  return wakeupFuzzy.some(wake => cmdLower === wake || cmdLower === `hey ${wake}` || cmdLower === `hello ${wake}` || cmdLower === `ok ${wake}`);
}

function normalizeVoiceIntent(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\w\s:.-]/g, ' ')
    .replace(/\b(?:please|kindly|sir|anicade|vision|hey|okay|ok|can you|could you|would you)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function commandHasAny(lowerCmd, phrases) {
  return phrases.some(phrase => lowerCmd.includes(phrase));
}

// Voice Command Handler
function processVoiceCommand(cmd) {
  const lowerCmd = cmd.toLowerCase().trim();
  const intentCmd = normalizeVoiceIntent(cmd);
  if (!lowerCmd) {
    return;
  }
  if (lowerCmd === "try again" || lowerCmd === "retry" || lowerCmd === "search again") {
    if (lastRetryAction) {
      lastRetryAction();
    } else {
      speakText("There is nothing to retry yet, Sir.");
    }
    return;
  }
  if (commandHasAny(intentCmd, ["open search results", "show search results", "open live results", "show live results", "open live feed", "show live feed"])) {
    openPendingSearchResult();
    return;
  }
  
  // If in Typing/Dictation mode, everything said is typed in the Notepad unless "stop typing" is called.
  if (state.typingMode) {
    if (lowerCmd.includes("stop typing") || lowerCmd.includes("stop dictation") || lowerCmd.includes("exit notebook") || lowerCmd.includes("close notebook")) {
      state.typingMode = false;
      elements.notebookStatus.textContent = "Ready";
      elements.notebookStatus.style.color = "var(--accent)";
      speakText("Notebook dictation saved, Sir.");
      return;
    }
    // Append to notepad
    elements.voiceTypingBox.value += (elements.voiceTypingBox.value ? " " : "") + cmd;
    addLog('system', 'Notebook entry updated.');
    return;
  }

  // Quick notepad system routing
  if (lowerCmd.includes("voice typing") || lowerCmd.includes("start typing") || lowerCmd.includes("open notebook")) {
    state.typingMode = true;
    elements.notebookStatus.textContent = "Dictating...";
    elements.notebookStatus.style.color = "#FF1744";
    speakText("Notepad voice typing mode active, Sir. Go ahead and speak. Say stop typing when finished.");
    return;
  }
  if (lowerCmd.includes("clear notebook") || lowerCmd.includes("clear note")) {
    elements.voiceTypingBox.value = "";
    speakText("Notebook cleared, Sir.");
    return;
  }
  if (lowerCmd.includes("copy notebook") || lowerCmd.includes("copy note")) {
    copyNotebookText();
    return;
  }
  if (commandHasAny(intentCmd, ["stop listening", "shut down", "go to sleep", "standby", "stand by", "sleep mode", "pause assistant", "exit voice"])) {
    stopVoiceAssistant();
    speakText("Entering standby, Sir.");
    return;
  } 
  if (lowerCmd.includes("install app") || lowerCmd.includes("install application")) {
    triggerInstallPrompt();
    return;
  }
  if (handleVoiceSettingsCommand(cmd, lowerCmd)) {
    return;
  }
  if (handleAssistantUtilityCommand(cmd, lowerCmd)) {
    return;
  }
  if (commandHasAny(intentCmd, ["take screenshot", "take a screenshot", "save screenshot", "capture screenshot", "snapshot", "screen shot"])) {
    takeVisualSnapshot();
    return;
  }
  if (commandHasAny(intentCmd, ["share screen", "start screen share", "show my screen", "scan my screen", "capture screen", "read my screen"])) {
    startScreenShare();
    return;
  }
  if (commandHasAny(intentCmd, ["open file", "read file", "load file", "choose file", "upload file", "scan file"])) {
    openLocalFilePicker();
    return;
  }
  if (commandHasAny(intentCmd, ["camera scan", "start camera", "open camera", "use camera", "scan camera"])) {
    startCameraScanner();
    return;
  }
  if (lowerCmd.includes("system check") || lowerCmd.includes("diagnostics")) {
    runSystemCheck();
    return;
  }
  if (lowerCmd.startsWith("ask antigravity")) {
    analyzeActiveFeed("general", `${cmd}. Answer as an Antigravity AI routed response if no dedicated Antigravity API is configured yet, and clearly mark the source as Antigravity-ready.`);
    return;
  }
  if (lowerCmd.includes("clear schedule") || lowerCmd.includes("clear schedules") || lowerCmd.includes("delete schedules") || lowerCmd.includes("clear reminders")) {
    clearSchedules();
    return;
  }
  if (isWebSearchIntent(lowerCmd)) {
    const query = extractSearchQuery(cmd);
    searchInternet(query || cmd);
    return;
  }
  if (lowerCmd.includes("read website") || lowerCmd.includes("summarize website") || lowerCmd.includes("read url")) {
    const urlMatch = cmd.match(/https?:\/\/\S+/i);
    if (urlMatch) {
      readWebsiteInfo(urlMatch[0]);
    } else {
      speakText("Please include the website address, Sir.");
    }
    return;
  }
  if (lowerCmd.includes("clear logs") || lowerCmd.includes("clear history")) {
    clearConversationLogs();
    return;
  }
  if (lowerCmd.includes("light mode") || lowerCmd.includes("dark mode") || lowerCmd.includes("toggle theme")) {
    toggleTheme(lowerCmd.includes("light") ? "light" : lowerCmd.includes("dark") ? "dark" : null);
    return;
  }
  if (lowerCmd.includes("disable particles") || lowerCmd.includes("particles off")) {
    setParticles(false);
    return;
  }
  if (lowerCmd.includes("enable particles") || lowerCmd.includes("particles on")) {
    setParticles(true);
    return;
  }

  // App Opening Command Routing
  if (lowerCmd.startsWith("open ")) {
    const appToOpen = lowerCmd.replace("open ", "").trim();
    const normalizedApp = appToOpen.split(/\s+/)[0];
    if (openDeviceApp(normalizedApp)) {
      return;
    }
    let url = "";
    let name = "";
    
    if (appToOpen.includes("calendar")) {
      url = "https://calendar.google.com";
      name = "Google Calendar";
    } else if (appToOpen.includes("gmail") || appToOpen.includes("email") || appToOpen.includes("mail")) {
      url = "https://mail.google.com";
      name = "Gmail";
    } else if (appToOpen.includes("outlook")) {
      url = "https://outlook.live.com";
      name = "Outlook Mail";
    } else if (appToOpen.includes("whatsapp")) {
      url = "https://web.whatsapp.com";
      name = "WhatsApp Web";
    } else if (appToOpen.includes("facebook")) {
      url = "https://www.facebook.com";
      name = "Facebook";
    } else if (appToOpen.includes("tiktok")) {
      url = "https://www.tiktok.com";
      name = "TikTok";
    } else if (appToOpen.includes("youtube")) {
      url = "https://www.youtube.com";
      name = "YouTube";
    } else if (appToOpen.includes("google")) {
      url = "https://www.google.com";
      name = "Google Search";
    } else if (appToOpen.includes("github")) {
      url = "https://www.github.com";
      name = "GitHub";
    }
    
    if (url) {
      window.open(url, '_blank');
      speakText(`Opening ${name} in a new tab, Sir.`);
      addLog('system', `Opened ${name}`);
      return;
    }
  }

  // Music Command Routing
  if (lowerCmd.includes("add music") || lowerCmd.includes("upload music") || lowerCmd.includes("add song") || lowerCmd.includes("upload song") || lowerCmd.includes("add track")) {
    openMusicPicker();
    return;
  }
  if (commandHasAny(intentCmd, ["show lyrics", "display lyrics", "song lyrics", "lyrics for", "read lyrics"])) {
    handleLyricsRequest(cmd);
    return;
  }
  if (commandHasAny(intentCmd, ["what songs", "show songs", "show playlist", "list songs", "music list", "music playlist", "playlist songs"])) {
    listMusicPlaylist();
    return;
  }
  const lyricPlayMatch = cmd.match(/^(?:play\s+)?(?:the\s+)?(?:song|track|music)\s+(?:that\s+)?(?:goes|says|with lyrics|with the words)\s+(.+)/i);
  if (lyricPlayMatch) {
    playMusicByLyricFragment(lyricPlayMatch[1].trim());
    return;
  }
  const numberedPlayMatch = cmd.match(/^play\s+(?:(?:song|track|music)\s+)?(?:number\s+)?(.+)$/i);
  if (numberedPlayMatch) {
    const indexFromNumber = resolveMusicIndexFromRequest(numberedPlayMatch[1].trim());
    if (indexFromNumber !== -1) {
      playMusicAtIndex(indexFromNumber);
      return;
    }
  }
  const playTitleOnRepeat = cmd.match(/^play\s*[:\-]?\s+(.+?)\s+(?:on repeat|and repeat|repeat|loop)$/i);
  if (playTitleOnRepeat) {
    setMusicRepeatMode('one', { silent: true });
    playMusicByTitle(playTitleOnRepeat[1].trim(), { repeatOne: true });
    return;
  }
  const repeatTitle = cmd.match(/^(?:repeat|loop)\s+(.+)/i);
  if (repeatTitle && !/^(this|current)\s+(song|track)$/i.test(repeatTitle[1].trim())) {
    setMusicRepeatMode('one', { silent: true });
    playMusicByTitle(repeatTitle[1].trim(), { repeatOne: true });
    return;
  }
  const playTitle = cmd.match(/^play\s*[:\-]?\s+(.+)/i);
  if (playTitle && !/^(music|song|tune)$/i.test(playTitle[1].trim()) && !/\b(music|song|tune)$/.test(playTitle[1].trim().toLowerCase())) {
    playMusicByTitle(playTitle[1].trim());
    return;
  }
  if (commandHasAny(intentCmd, ["play music", "start music", "resume music", "play tune", "play song", "start song"])) {
    playMusic();
    return;
  }
  if (commandHasAny(intentCmd, ["stop music", "pause music", "mute music", "hold music", "stop song", "pause song"])) {
    pauseMusic();
    return;
  }
  if (commandHasAny(intentCmd, ["next song", "next track", "change music", "skip song", "skip track"])) {
    nextMusicTrack();
    return;
  }
  if (lowerCmd.includes("repeat this song") || lowerCmd.includes("repeat current song") || lowerCmd.includes("loop this song")) {
    setMusicRepeatMode('one');
    return;
  }
  if (lowerCmd.includes("repeat playlist") || lowerCmd.includes("loop playlist")) {
    setMusicRepeatMode('all');
    return;
  }
  if (lowerCmd.includes("repeat off") || lowerCmd.includes("stop repeat")) {
    setMusicRepeatMode('off');
    return;
  }
  if (lowerCmd.includes("clear music playlist") || lowerCmd.includes("clear playlist")) {
    clearMusicPlaylist();
    return;
  }
  if (lowerCmd.includes("volume up")) {
    changeMusicVolume(0.1);
    return;
  }
  if (lowerCmd.includes("volume down")) {
    changeMusicVolume(-0.1);
    return;
  }

  // Animal Sound Decoder commands
  if (lowerCmd.includes("decode animal") || lowerCmd.includes("animal sound") || lowerCmd.includes("translate dog") || lowerCmd.includes("translate cat") || lowerCmd.includes("dog saying") || lowerCmd.includes("cat saying")) {
    let animal = "detect";
    if (lowerCmd.includes("dog")) animal = "Dog";
    else if (lowerCmd.includes("cat")) animal = "Cat";
    else if (lowerCmd.includes("bird")) animal = "Bird";
    decodeAnimalSound(animal);
    return;
  }

  // Connected Apps Hub Commands
  if (lowerCmd.includes("reply to message") || lowerCmd.includes("reply to this message") || lowerCmd.includes("draft reply")) {
    const message = cmd.replace(/reply to (this )?message|draft reply|suggest reply/ig, '').trim();
    if (message) {
      draftDirectReply(message);
    } else {
      analyzeActiveFeed('reply', cmd);
    }
    return;
  }

  if (lowerCmd.includes("calendar") || lowerCmd.includes("email") || lowerCmd.includes("outlook") || lowerCmd.includes("whatsapp") || lowerCmd.includes("facebook") || lowerCmd.includes("tiktok") || lowerCmd.includes("read apps") || lowerCmd.includes("connected apps") || lowerCmd.includes("messages") || lowerCmd.includes("notification") || lowerCmd.includes("unread")) {
    let app = "";
    if (lowerCmd.includes("calendar")) app = "calendar";
    else if (lowerCmd.includes("email") || lowerCmd.includes("outlook")) app = "outlook";
    else if (lowerCmd.includes("whatsapp")) app = "whatsapp";
    else if (lowerCmd.includes("facebook")) app = "facebook";
    else if (lowerCmd.includes("tiktok")) app = "tiktok";
    else if (lowerCmd.includes("message") || lowerCmd.includes("notification") || lowerCmd.includes("unread")) app = "unread_all";
    
    const appFeedback = readConnectedApps(app);
    speakText(appFeedback);
    return;
  }

  // Schedule commands (e.g. "schedule board meeting at 15:30" or "schedule alarms at 08:00")
  if (lowerCmd.includes("schedule ") || lowerCmd.includes("add schedule") || lowerCmd.includes("add reminder") || lowerCmd.includes("remind me ")) {
    if (handleVoiceScheduleCommand(cmd)) return;
  }

  // Voice name wakeup responses
  if (checkVoiceWakeup(lowerCmd)) {
    const responses = [
      "At your service, Sir.",
      "Yes, Sir? Standing by.",
      "I am here, Sir. Command me.",
      "Visual and vocal receptors online, Sir.",
      "Always listening, Sir. How may I assist?"
    ];
    speakText(responses[Math.floor(Math.random() * responses.length)]);
    return;
  }

  // Chatbot command recognition: determine if they want to generate an ad.
  const isAdRequest = commandHasAny(intentCmd, ["generate ad", "create ad", "make ad", "design ad", "ad banner", "marketing banner", "advertising material", "advertisement"]);
  
  if (isAdRequest) {
    const productName = extractAdSubject(cmd);
    if (!productName && state.activeInputType === 'none') {
      speakText("Would you like to upload a reference image, Sir, or should I proceed without one? Say generate ad for the product or theme when ready.");
      return;
    }
    lastRetryAction = () => analyzeActiveFeed("adgen", productName);
    analyzeActiveFeed("adgen", productName);
  } else {
    const quickAnswer = handleLocalUtilityCommand(cmd, lowerCmd);
    if (quickAnswer === "ASYNC_HANDLED") {
      return;
    }
    if (quickAnswer) {
      speakText(quickAnswer);
      return;
    }
    // Determine the type of request based on natural speech queries, mapping to correct modes for better context
    let actionType = "general";
    if (lowerCmd.includes("read screen") || lowerCmd.includes("what is on my screen") || lowerCmd.includes("analyze screen") || lowerCmd.includes("read the screen") || lowerCmd.includes("scan layout")) {
      actionType = "read";
    } else if (lowerCmd.includes("school help") || lowerCmd.includes("school query") || lowerCmd.includes("solve math") || lowerCmd.includes("homework")) {
      actionType = "school";
    } else if (lowerCmd.includes("auto reply") || lowerCmd.includes("suggest reply") || lowerCmd.includes("message reply")) {
      actionType = "reply";
    }
    if (actionType === "general") {
      lastRetryAction = () => runLocalPollinations(cmd);
      runLocalPollinations(cmd);
    } else {
      lastRetryAction = () => analyzeActiveFeed(actionType, cmd);
      analyzeActiveFeed(actionType, cmd);
    }
  }
}

function handleLocalUtilityCommand(cmd, lowerCmd) {
  const localKnowledge = getLocalKnowledgeAnswer(cmd);
  if (localKnowledge) return localKnowledge;
  if (lowerCmd.includes("what time") || lowerCmd === "time" || lowerCmd.includes("current time")) {
    return `It is ${new Date().toLocaleTimeString('en-ZM', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lusaka', timeZoneName: 'short' })}, Sir.`;
  }
  if (lowerCmd.includes("what date") || lowerCmd.includes("today's date") || lowerCmd.includes("current date")) {
    return `Today is ${new Date().toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}, Sir.`;
  }
  const mathCandidate = lowerCmd.replace(/what is|calculate|solve|math|please|sir|\?/g, '').trim();
  if (/^[\d\s+\-*/().%^]+$/.test(mathCandidate) && /\d/.test(mathCandidate)) {
    try {
      const expression = mathCandidate.replace(/\^/g, '**').replace(/%/g, '/100');
      const result = Function(`"use strict"; return (${expression});`)();
      if (Number.isFinite(result)) return `The answer is ${result}, Sir.`;
    } catch (err) {}
  }
  if (lowerCmd.startsWith("define ")) {
    const retryPrompt = `Define ${cmd.replace(/^define\s+/i, '')} clearly and briefly.`;
    lastRetryAction = () => runLocalPollinations(retryPrompt);
    runLocalPollinations(retryPrompt);
    return "ASYNC_HANDLED";
  }
  if (lowerCmd.includes("weather")) {
    return "For live weather I need an internet scan, Sir. Say internet scan weather in your city.";
  }
  return "";
}

function extractAdSubject(cmd) {
  return String(cmd || '')
    .replace(/^(?:please\s+)?(?:generate|create|make|design|build)\s+(?:a\s+|an\s+)?(?:clean\s+|professional\s+|usable\s+)?(?:advertisement|advertising material|marketing banner|ad banner|ad)\s*(?:for|about|of)?\s*/i, '')
    .replace(/^(?:ad|advertisement|marketing banner)\s*(?:for|about|of)?\s*/i, '')
    .trim();
}

function isWebSearchIntent(lowerCmd) {
  const normalized = normalizeVoiceIntent(lowerCmd);
  if (/^(search|google|look up)\s+\S+/i.test(normalized)) {
    return true;
  }
  const explicitInternetPhrases = [
    "internet scan",
    "scan internet",
    "scan the internet",
    "web scan",
    "scan web",
    "scan the web",
    "online scan",
    "search the internet",
    "search internet",
    "search the web",
    "search web",
    "search online",
    "web search",
    "internet search",
    "go online and search",
    "look online",
    "look it up online",
    "google online",
    "google the web",
    "google the internet"
  ];
  return explicitInternetPhrases.some(phrase => normalized.includes(phrase));
}

function extractSearchQuery(cmd) {
  return cleanSearchQuery(cmd);
}

function draftDirectReply(messageText) {
  const prompt = `Draft a short, natural reply to this message: "${messageText}". Give only the reply text.`;
  state.isAnalyzing = true;
  updateStatusVisuals();
  callPollinationsAI(prompt, { quick: true })
    .then(reply => {
      state.isAnalyzing = false;
      updateStatusVisuals();
      speakText(reply);
    })
    .catch(() => {
      state.isAnalyzing = false;
      updateStatusVisuals();
      const fallback = "Thanks, I have seen this. I will get back to you shortly.";
      speakText(fallback);
    });
}

async function searchInternet(query) {
  query = cleanSearchQuery(query);
  if (!query) {
    speakText("What would you like me to search for, Sir?");
    return;
  }
  lastRetryAction = () => searchInternet(query);
  state.isAnalyzing = true;
  updateStatusVisuals();
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  state.pendingSearchResult = { query, url: searchUrl };
  try {
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const response = await fetchWithTimeout(ddgUrl, {}, 5500);
    const data = await response.json();
    let answer = data.AbstractText || data.Answer || '';
    if (!answer && Array.isArray(data.RelatedTopics)) {
      const topic = data.RelatedTopics.find(item => item.Text) || data.RelatedTopics.flatMap(item => item.Topics || []).find(item => item.Text);
      if (topic) answer = topic.Text;
    }
    if (!answer) {
      answer = await searchWikipediaSummary(query);
    }
    finishAnalyzing();
    if (!answer) {
      speakText(`I could not get a clean readable summary for ${query}, Sir. I can open the live results on screen if you want to see them.`);
      return;
    }
    const trimmedAnswer = answer.length > 700 ? `${answer.slice(0, 700).trim()}...` : answer;
    speakText(`${trimmedAnswer} Would you like me to open the live results on screen?`);
  } catch (err) {
    console.error('Search failed:', err);
    finishAnalyzing();
    speakText(`Search summaries are not responding cleanly, Sir. I can open the live results on screen if you want to inspect them.`);
  }
}

function cleanSearchQuery(query) {
  let cleaned = String(query || '').trim();
  const leadingFillers = /^(?:okay|ok|alright|please|hey|anicade|vision|can you|could you|kindly|now|so|sir)\b[\s,.:;-]*/i;
  while (leadingFillers.test(cleaned)) {
    cleaned = cleaned.replace(leadingFillers, '').trim();
  }
  cleaned = cleaned
    .replace(/^(?:internet|web|online)\s+scan\s*(?:for|about)?\b/i, '')
    .replace(/^scan\s+(?:the\s+)?(?:internet|web|online)\s*(?:for|about)?\b/i, '')
    .replace(/^(?:search|google)\s+(?:the\s+)?(?:internet|web)?\s*(?:for|about)?\b/i, '')
    .replace(/^look\s+up\s+(?:online\s+)?(?:for\s+)?/i, '')
    .replace(/^(?:search|google)\s+(?:for|about)\b/i, '')
    .replace(/^(?:the\s+)?(?:internet|web|online)\s+(?:for|about)\b/i, '')
    .replace(/\bplease\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  while (leadingFillers.test(cleaned)) {
    cleaned = cleaned.replace(leadingFillers, '').trim();
  }
  return cleaned;
}

function openPendingSearchResult() {
  if (!state.pendingSearchResult || !state.pendingSearchResult.url) {
    speakText("There are no live search results queued, Sir.");
    return;
  }
  window.open(state.pendingSearchResult.url, '_blank');
  speakText(`Opening the live results for ${state.pendingSearchResult.query}, Sir.`);
}

async function searchWikipediaSummary(query) {
  const openSearchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&format=json&origin=*`;
  const searchResponse = await fetchWithTimeout(openSearchUrl, {}, 5000);
  const searchData = await searchResponse.json();
  const title = searchData && searchData[1] && searchData[1][0];
  if (!title) return '';
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const summaryResponse = await fetchWithTimeout(summaryUrl, {}, 5000);
  const summaryData = await summaryResponse.json();
  return summaryData.extract || '';
}

async function readWebsiteInfo(url) {
  state.isAnalyzing = true;
  updateStatusVisuals();
  addLog('system', `Reading website: ${url}`);
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('script, style, nav, footer, header, noscript').forEach(node => node.remove());
    const title = doc.querySelector('title')?.textContent?.trim() || url;
    const text = doc.body?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 3500) || '';
    if (!text) throw new Error('No readable text');
    const summary = await callPollinationsAI(`Summarize this website titled "${title}" in under 90 words for the user: ${text}`, { quick: true });
    state.isAnalyzing = false;
    updateStatusVisuals();
    speakText(summary);
  } catch (err) {
    console.error('Website read failed:', err);
    state.isAnalyzing = false;
    updateStatusVisuals();
    window.open(url, '_blank');
    speakText("I could not read that website directly, Sir, so I opened it for you.");
  }
}

function handleVoiceSettingsCommand(cmd, lowerCmd) {
  const wakeMatch = lowerCmd.match(/(?:set|change|make)\s+(?:wake word|activation word)\s+(?:to|as)\s+(.+)/);
  if (wakeMatch) {
    setWakeWord(wakeMatch[1]);
    speakText(`Wake word set to ${state.wakeWord}, Sir.`);
    addLog('system', `Wake word changed to ${state.wakeWord}.`);
    return true;
  }

  const personaMatch = lowerCmd.match(/(?:set|change|make)\s+(?:persona|personality|voice personality)\s+(?:to|as)\s+(.+)/);
  if (personaMatch) {
    const requested = personaMatch[1];
    const persona = requested.includes('teacher') || requested.includes('mentor') ? 'mentor'
      : requested.includes('casual') || requested.includes('friend') || requested.includes('companion') ? 'companion'
      : 'vision';
    setPersona(persona);
    speakText(`Persona set to ${persona}, Sir.`);
    addLog('system', `Persona changed to ${persona}.`);
    return true;
  }
  const voiceMatch = lowerCmd.match(/(?:set|change)\s+voice\s+(?:to|as)\s+(.+)/);
  if (voiceMatch && elements.voiceSelect) {
    const requested = voiceMatch[1].trim();
    const option = Array.from(elements.voiceSelect.options).find(item => item.textContent.toLowerCase().includes(requested) || item.value.toLowerCase().includes(requested));
    if (option) {
      elements.voiceSelect.value = option.value;
      state.selectedVoiceName = option.value;
      localStorage.setItem('anicade_selected_voice', state.selectedVoiceName);
      speakText("Voice profile updated, Sir.");
    } else {
      speakText("I could not find that voice profile on this device, Sir.");
    }
    return true;
  }

  if (lowerCmd.includes("clear logs") || lowerCmd.includes("clear history")) {
    clearConversationLogs();
    return true;
  }
  if (lowerCmd.includes("copy answer") || lowerCmd.includes("copy output")) {
    copyLatestOutput();
    return true;
  }
  if (lowerCmd.includes("copy notebook") || lowerCmd.includes("copy note")) {
    copyNotebookText();
    return true;
  }
  if (lowerCmd.includes("clear notebook") || lowerCmd.includes("clear note")) {
    elements.voiceTypingBox.value = "";
    speakText("Notebook cleared, Sir.");
    return true;
  }
  if (lowerCmd.includes("light mode") || lowerCmd.includes("dark mode") || lowerCmd.includes("toggle theme")) {
    toggleTheme(lowerCmd.includes("light") ? "light" : lowerCmd.includes("dark") ? "dark" : null);
    return true;
  }
  if (lowerCmd.includes("disable particles") || lowerCmd.includes("particles off") || lowerCmd.includes("effects off")) {
    setParticles(false);
    return true;
  }
  if (lowerCmd.includes("enable particles") || lowerCmd.includes("particles on") || lowerCmd.includes("effects on")) {
    setParticles(true);
    return true;
  }
  if (lowerCmd.includes("system check") || lowerCmd.includes("diagnostics")) {
    runSystemCheck();
    return true;
  }
  const appToggleMatch = lowerCmd.match(/(?:connect|enable|disconnect|disable)\s+(calendar|outlook|whatsapp|facebook|tiktok)/);
  if (appToggleMatch) {
    const enabled = lowerCmd.includes('connect') || lowerCmd.includes('enable');
    const app = appToggleMatch[1];
    state.connectedApps[app] = enabled;
    localStorage.setItem('anicade_connected_apps', JSON.stringify(state.connectedApps));
    updateConnectedAppsUI();
    storage.syncSave();
    speakText(`${app} ${enabled ? 'connected' : 'disconnected'}, Sir.`);
    return true;
  }
  const languageMatch = lowerCmd.match(/(?:set|change)\s+language\s+(?:to|as)\s+(english uk|english us|spanish|french|german|japanese|portuguese|zulu)/);
  if (languageMatch) {
    const langMap = {
      'english uk': 'en-GB',
      'english us': 'en-US',
      spanish: 'es-ES',
      french: 'fr-FR',
      german: 'de-DE',
      japanese: 'ja-JP',
      portuguese: 'pt-BR',
      zulu: 'zu-ZA'
    };
    state.selectedLanguage = langMap[languageMatch[1]] || 'en-GB';
    localStorage.setItem('anicade_selected_language', state.selectedLanguage);
    if (elements.langSelect) elements.langSelect.value = state.selectedLanguage;
    if (state.recognition) state.recognition.lang = state.selectedLanguage;
    storage.syncSave();
    speakText("Language updated, Sir.");
    return true;
  }
  if (lowerCmd.includes("exit full screen") || lowerCmd.includes("close immersive")) {
    exitFullScreenOrb();
    speakText("Immersive mode closed, Sir.");
    return true;
  }
  if (lowerCmd.includes("full screen") || lowerCmd.includes("immersive mode")) {
    enterFullScreenOrb();
    speakText("Immersive mode active, Sir.");
    return true;
  }
  if (lowerCmd.includes("clap wake on") || lowerCmd.includes("enable clap")) {
    if (!state.clapWakeActive) startClapWake();
    return true;
  }
  if (lowerCmd.includes("clap wake off") || lowerCmd.includes("disable clap")) {
    if (state.clapWakeActive) stopClapWake();
    return true;
  }
  return false;
}

function handleAssistantUtilityCommand(cmd, lowerCmd) {
  if (lowerCmd === "help" || lowerCmd.includes("what can you do") || lowerCmd.includes("commands")) {
    speakText("I can run explicit internet scans, read websites, scan screens, open selected files, draft replies, manage schedules, play uploaded songs by title or number, remember notes, open apps, and control settings by voice, Sir.");
    return true;
  }
  if (lowerCmd.startsWith("remember ")) {
    const note = cmd.replace(/^remember\s+/i, '').trim();
    if (!note) {
      speakText("What should I remember, Sir?");
      return true;
    }
    state.memoryNotes.push({ text: note, timestamp: Date.now() });
    state.memoryNotes = state.memoryNotes.slice(-50);
    localStorage.setItem('anicade_memory_notes', JSON.stringify(state.memoryNotes));
    speakText("Remembered, Sir.");
    return true;
  }
  if (lowerCmd.includes("what do you remember") || lowerCmd.includes("list memories")) {
    if (!state.memoryNotes.length) {
      speakText("I have no saved memory notes yet, Sir.");
      return true;
    }
    speakText("You asked me to remember: " + state.memoryNotes.slice(-5).map(item => item.text).join("; "));
    return true;
  }
  if (lowerCmd.includes("clear memories") || lowerCmd.includes("forget everything")) {
    state.memoryNotes = [];
    localStorage.removeItem('anicade_memory_notes');
    speakText("Memory notes cleared, Sir.");
    return true;
  }
  if (lowerCmd.includes("list schedules") || lowerCmd.includes("read schedules") || lowerCmd.includes("what is scheduled")) {
    if (!state.schedules.length) {
      speakText("There are no schedules saved, Sir.");
      return true;
    }
    speakText("Your schedules are: " + state.schedules.map(item => `${item.title} at ${item.time}`).join("; "));
    return true;
  }
  if (lowerCmd.includes("read last answer") || lowerCmd.includes("repeat answer")) {
    const latest = state.outputHistory[state.outputHistory.length - 1];
    speakText(latest ? latest.text : "There is no previous answer yet, Sir.");
    return true;
  }
  return false;
}

function handleVoiceScheduleCommand(cmd) {
  const lowerCmd = cmd.toLowerCase();
  const timeMatch = lowerCmd.match(/\b(?:at|for)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/) || lowerCmd.match(/\b(\d{1,2})(?::(\d{2}))\s*(am|pm)?\b/);
  if (!timeMatch) {
    speakText("Tell me the schedule title and time, Sir. For example, add schedule team meeting at 3:30 PM.");
    return true;
  }

  let hours = parseInt(timeMatch[1], 10);
  const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
  const ampm = timeMatch[3];
  if (ampm) {
    if (ampm.toLowerCase() === 'pm' && hours < 12) hours += 12;
    if (ampm.toLowerCase() === 'am' && hours === 12) hours = 0;
  }
  if (hours > 23 || minutes > 59) {
    speakText("That time does not look valid, Sir.");
    return true;
  }

  const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  let title = cmd
    .replace(/add schedule|add reminder|schedule|remind me(?: to)?/i, '')
    .replace(/\b(?:at|for)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/i, '')
    .replace(/\b\d{1,2}:\d{2}\s*(?:am|pm)?\b/i, '')
    .trim();
  if (!title) title = "Voice Alert";
  addSchedule(title, timeStr);
  if (elements.schedTitle) elements.schedTitle.value = title;
  if (elements.schedTime) elements.schedTime.value = timeStr;
  return true;
}

// Background Music Controller Functions
const MUSIC_DB_NAME = 'anicade_music_library_db';
const MUSIC_STORE_NAME = 'tracks';

function openMusicDatabase() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(MUSIC_DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(MUSIC_STORE_NAME, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withMusicStore(mode, callback) {
  const db = await openMusicDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(MUSIC_STORE_NAME, mode);
    const store = transaction.objectStore(MUSIC_STORE_NAME);
    const result = callback(store);
    transaction.oncomplete = () => {
      db.close();
      resolve(result);
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

async function saveMusicFile(file) {
  const id = `local_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const title = file.name.replace(/\.[^.]+$/, '');
  await withMusicStore('readwrite', store => store.put({ id, title, blob: file, name: file.name, type: file.type }));
  return { id, title, src: URL.createObjectURL(file), local: true, persisted: true };
}

async function getMusicFile(id) {
  return new Promise(async (resolve, reject) => {
    try {
      await withMusicStore('readonly', store => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
        return request;
      });
    } catch (err) {
      reject(err);
    }
  });
}

async function clearMusicDatabase() {
  try {
    await withMusicStore('readwrite', store => store.clear());
  } catch (err) {
    console.warn('Music database clear failed:', err);
  }
}

async function initMusicLibrary() {
  const libraryMeta = JSON.parse(localStorage.getItem('anicade_music_library') || '[]');
  if (!Array.isArray(libraryMeta) || !libraryMeta.length) {
    renderMusicPlaylist();
    return;
  }
  const existingIds = new Set(state.musicPlaylist.map(track => track.id).filter(Boolean));
  for (const meta of libraryMeta) {
    if (!meta.id || existingIds.has(meta.id)) continue;
    try {
      const record = await getMusicFile(meta.id);
      if (record && record.blob) {
        state.musicPlaylist.push({
          id: record.id,
          title: record.title || meta.title,
          src: URL.createObjectURL(record.blob),
          local: true,
          persisted: true
        });
      }
    } catch (err) {
      console.warn('Stored track restore failed:', err);
    }
  }
  state.musicDbReady = true;
  renderMusicPlaylist();
}

function playMusic() {
  const track = state.musicPlaylist[state.currentMusicIndex];
  if (!track) {
    speakText("Your music playlist is empty, Sir. Upload tracks once, then I will keep the list available on this device.");
    return;
  }
  if (!state.audioPlayer) {
    state.audioPlayer = new Audio(track.src);
    state.audioPlayer.volume = 0.25; // low background volume
    state.audioPlayer.addEventListener('ended', handleMusicEnded);
  }
  state.audioPlayer.loop = state.repeatMode === 'one';
  if (state.audioPlayer.src !== track.src) state.audioPlayer.src = track.src;
  state.audioPlayer.play()
    .then(() => {
      updateMusicUI(true);
      speakText(`Playing ${track.title}, Sir.`);
    })
    .catch(err => {
      console.error("Music playback failed:", err);
      speakText("I was unable to initialize the music player, Sir.");
    });
}

function playMusicAtIndex(index) {
  if (index < 0 || index >= state.musicPlaylist.length) {
    speakText("That song number is not in the playlist, Sir.");
    return;
  }
  state.currentMusicIndex = index;
  playMusic();
}

function normalizeTrackText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\b(the|a|an|song|track|music|play|please|number)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveMusicIndexFromRequest(request) {
  const normalized = normalizeTrackText(request);
  if (!normalized) return -1;
  const ordinalMap = {
    first: 0,
    one: 0,
    second: 1,
    two: 1,
    third: 2,
    three: 2,
    fourth: 3,
    four: 3,
    fifth: 4,
    five: 4,
    sixth: 5,
    six: 5,
    seventh: 6,
    seven: 6,
    eighth: 7,
    eight: 7,
    ninth: 8,
    nine: 8,
    tenth: 9,
    ten: 9
  };
  const digitMatch = normalized.match(/\b(\d{1,3})(?:st|nd|rd|th)?\b/);
  if (digitMatch) return Number(digitMatch[1]) - 1;
  if (Object.prototype.hasOwnProperty.call(ordinalMap, normalized)) return ordinalMap[normalized];
  return -1;
}

function playMusicByTitle(title, options = {}) {
  const numberIndex = resolveMusicIndexFromRequest(title);
  if (numberIndex !== -1) {
    state.currentMusicIndex = numberIndex;
    if (options.repeatOne) setMusicRepeatMode('one', { silent: true });
    playMusic();
    return;
  }
  const normalized = normalizeTrackText(title);
  const index = findBestMusicMatch(normalized);
  if (index === -1) {
    speakText(`I could not find ${title} in the playlist, Sir. Say list songs to hear the numbered tracks, or upload it once.`);
    return;
  }
  state.currentMusicIndex = index;
  if (options.repeatOne) {
    state.repeatMode = 'one';
    localStorage.setItem('anicade_music_repeat', 'one');
  }
  playMusic();
}

function findBestMusicMatch(normalizedRequest) {
  if (!normalizedRequest) return -1;
  let bestIndex = -1;
  let bestScore = 0;
  state.musicPlaylist.forEach((track, index) => {
    const normalizedTitle = normalizeTrackText(track.title);
    let score = 0;
    if (normalizedTitle === normalizedRequest) score = 100;
    else if (normalizedTitle.includes(normalizedRequest) || normalizedRequest.includes(normalizedTitle)) score = 80;
    else {
      const requestWords = normalizedRequest.split(' ').filter(Boolean);
      const titleWords = normalizedTitle.split(' ').filter(Boolean);
      const matches = requestWords.filter(word => titleWords.some(titleWord => titleWord.includes(word) || word.includes(titleWord))).length;
      score = matches / Math.max(requestWords.length, 1) * 60;
    }
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });
  return bestScore >= 35 ? bestIndex : -1;
}

function playMusicByLyricFragment(fragment) {
  const needle = normalizeTrackText(fragment);
  if (!needle) {
    speakText("Sing or say a few words from the song, Sir.");
    return;
  }
  const index = state.musicPlaylist.findIndex(track => {
    const cachedLyrics = state.musicLyrics[track.id || track.title] || '';
    return normalizeTrackText(cachedLyrics).includes(needle) || normalizeTrackText(track.title).includes(needle);
  });
  if (index === -1) {
    speakText("I do not have matching lyrics cached yet, Sir. Ask me to show lyrics for the track first, or say list songs and choose a number.");
    return;
  }
  playMusicAtIndex(index);
}

function getCurrentTrackForLyrics(requestText = '') {
  const cleaned = String(requestText || '')
    .replace(/^(?:show|display|read|get)\s+(?:me\s+)?(?:the\s+)?lyrics(?:\s+for)?/i, '')
    .replace(/^(?:lyrics)\s+(?:for|of)?/i, '')
    .trim();
  if (cleaned) {
    const index = resolveMusicIndexFromRequest(cleaned);
    if (index !== -1 && state.musicPlaylist[index]) return state.musicPlaylist[index];
    const titleIndex = findBestMusicMatch(normalizeTrackText(cleaned));
    if (titleIndex !== -1) return state.musicPlaylist[titleIndex];
  }
  return state.musicPlaylist[state.currentMusicIndex] || null;
}

function splitArtistAndTitle(trackTitle) {
  const clean = String(trackTitle || '').replace(/\s*\[[^\]]+\]|\s*\([^)]+\)/g, '').trim();
  const parts = clean.split(/\s+-\s+|\s+by\s+/i).map(item => item.trim()).filter(Boolean);
  if (parts.length >= 2) return { artist: parts[0], title: parts.slice(1).join(' - ') };
  return { artist: '', title: clean };
}

async function handleLyricsRequest(cmd) {
  const track = getCurrentTrackForLyrics(cmd);
  if (!track) {
    speakText("There is no song selected yet, Sir.");
    return;
  }
  const lyricsKey = track.id || track.title;
  if (state.musicLyrics[lyricsKey]) {
    addLog('ai', `Lyrics for ${track.title}:\n${state.musicLyrics[lyricsKey]}`);
    speakText(`Lyrics displayed for ${track.title}, Sir.`);
    return;
  }
  const { artist, title } = splitArtistAndTitle(track.title);
  if (!artist || !title) {
    speakText(`I do not have lyrics cached for ${track.title}, Sir. Rename the file as Artist - Title, then ask again, or run an internet scan for the lyrics.`);
    return;
  }
  try {
    state.isAnalyzing = true;
    updateStatusVisuals();
    const response = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
    if (!response.ok) throw new Error('Lyrics not found');
    const data = await response.json();
    const lyrics = String(data.lyrics || '').trim();
    if (!lyrics) throw new Error('Lyrics empty');
    state.musicLyrics[lyricsKey] = lyrics;
    localStorage.setItem('anicade_music_lyrics', JSON.stringify(state.musicLyrics));
    state.isAnalyzing = false;
    updateStatusVisuals();
    addLog('ai', `Lyrics for ${track.title}:\n${lyrics}`);
    speakText(`Lyrics displayed for ${track.title}, Sir.`);
  } catch (err) {
    console.warn('Lyrics lookup failed:', err);
    state.isAnalyzing = false;
    updateStatusVisuals();
    speakText(`I could not fetch lyrics for ${track.title}, Sir. Say internet scan lyrics for ${track.title} for a live lookup.`);
  }
}

function pauseMusic() {
  if (state.audioPlayer && !state.audioPlayer.paused) {
    state.audioPlayer.pause();
    updateMusicUI(false);
    speakText("Music paused, Sir.");
  } else {
    speakText("No music is currently playing, Sir.");
  }
}

function nextMusicTrack() {
  if (!state.musicPlaylist.length) {
    speakText("Your music playlist is empty, Sir.");
    return;
  }
  state.currentMusicIndex = (state.currentMusicIndex + 1) % state.musicPlaylist.length;
  const track = state.musicPlaylist[state.currentMusicIndex];
  if (state.audioPlayer) {
    state.audioPlayer.pause();
    state.audioPlayer.src = track.src;
    state.audioPlayer.play()
      .then(() => {
        updateMusicUI(true);
        speakText(`Playing ${track.title}, Sir.`);
        addLog('system', `Switched to ${track.title}.`);
      })
      .catch(err => {
        console.error(err);
      });
  } else {
    playMusic();
  }
}

function handleMusicEnded() {
  if (state.repeatMode === 'one') {
    playMusic();
    return;
  }
  if (state.repeatMode === 'all') {
    nextMusicTrack();
  } else {
    updateMusicUI(false);
  }
}

function setMusicRepeatMode(mode, options = {}) {
  state.repeatMode = mode;
  localStorage.setItem('anicade_music_repeat', mode);
  if (state.audioPlayer) state.audioPlayer.loop = mode === 'one';
  const label = mode === 'one' ? 'current song' : mode === 'all' ? 'playlist' : 'off';
  if (!options.silent) speakText(`Music repeat set to ${label}, Sir.`);
  updateMusicUI(state.audioPlayer && !state.audioPlayer.paused);
}

function cycleMusicRepeatMode() {
  const next = state.repeatMode === 'all' ? 'one' : state.repeatMode === 'one' ? 'off' : 'all';
  setMusicRepeatMode(next);
}

function persistMusicPlaylist() {
  const serializable = state.musicPlaylist.filter(track => track.src && !track.local && !String(track.src).startsWith('blob:'));
  localStorage.setItem('anicade_music_playlist', JSON.stringify(serializable));
  const library = state.musicPlaylist
    .filter(track => track.local && track.persisted && track.id)
    .map(track => ({ id: track.id, title: track.title }));
  localStorage.setItem('anicade_music_library', JSON.stringify(library));
}

function listMusicPlaylist() {
  if (!state.musicPlaylist.length) {
    speakText("Your playlist is empty, Sir.");
    return;
  }
  const list = state.musicPlaylist.map((track, index) => `${index + 1}. ${track.title}`).join("; ");
  addLog('system', `Playlist: ${list}`);
  speakText("Your playlist contains: " + list + ". You can say play song number one, or play the first song.");
}

async function clearMusicPlaylist() {
  state.musicPlaylist = [];
  localStorage.removeItem('anicade_music_playlist');
  localStorage.removeItem('anicade_music_playlist_titles');
  localStorage.removeItem('anicade_music_library');
  await clearMusicDatabase();
  if (state.audioPlayer) state.audioPlayer.pause();
  updateMusicUI(false);
  speakText("Music playlist cleared, Sir.");
}

function openMusicPicker() {
  if (!elements.musicUploadInput) {
    speakText("Music upload is not available on this screen, Sir.");
    return;
  }
  elements.musicUploadInput.value = "";
  elements.musicUploadInput.click();
  speakText("Choose one or more audio files to add to your playlist, Sir.");
}

function changeMusicVolume(delta) {
  if (!state.audioPlayer) {
    speakText("No music is currently playing, Sir.");
    return;
  }
  state.audioPlayer.volume = Math.min(1, Math.max(0, state.audioPlayer.volume + delta));
  speakText(`Music volume set to ${Math.round(state.audioPlayer.volume * 100)} percent, Sir.`);
}

function updateMusicUI(isPlaying) {
  const track = state.musicPlaylist[state.currentMusicIndex];
  if (elements.musicTrackTitle) elements.musicTrackTitle.textContent = track ? track.title : "No track playing";
  if (elements.musicStatusLabel) elements.musicStatusLabel.textContent = isPlaying ? "Playing" : "Paused";
  if (elements.btnMusicRepeat) {
    const label = state.repeatMode === 'one' ? 'Repeat One' : state.repeatMode === 'all' ? 'Repeat All' : 'Repeat Off';
    elements.btnMusicRepeat.textContent = label;
  }
  renderMusicPlaylist();
  document.body.classList.toggle('music-playing', !!isPlaying);
}

function renderMusicPlaylist() {
  if (!elements.musicPlaylistList) return;
  if (!state.musicPlaylist.length) {
    elements.musicPlaylistList.textContent = "Playlist empty";
    return;
  }
  elements.musicPlaylistList.innerHTML = state.musicPlaylist.map((track, index) => {
    const active = index === state.currentMusicIndex ? ' active' : '';
    return `<button class="playlist-track${active}" type="button" data-track-index="${index}"><span class="playlist-track-number">${index + 1}</span><span>${escapeHTML(track.title)}</span></button>`;
  }).join('');
  elements.musicPlaylistList.querySelectorAll('.playlist-track').forEach(button => {
    button.addEventListener('click', () => {
      state.currentMusicIndex = Number(button.dataset.trackIndex);
      playMusic();
    });
  });
}

function openDeviceApp(appName) {
  const key = appName.toLowerCase();
  const appTargets = {
    calendar: ['webcal://', 'https://calendar.google.com'],
    gmail: ['mailto:', 'https://mail.google.com'],
    email: ['mailto:', 'https://mail.google.com'],
    mail: ['mailto:', 'https://mail.google.com'],
    outlook: ['ms-outlook://', 'https://outlook.live.com'],
    whatsapp: ['whatsapp://send', 'https://web.whatsapp.com'],
    facebook: ['fb://profile', 'https://www.facebook.com'],
    tiktok: ['snssdk1233://', 'https://www.tiktok.com'],
    youtube: ['vnd.youtube://', 'https://www.youtube.com'],
    spotify: ['spotify:', 'https://open.spotify.com'],
    calculator: ['calculator://'],
    settings: ['ms-settings:']
  };
  const targets = appTargets[key];
  if (!targets) return false;
  const [primary, fallback] = targets;
  try {
    window.location.href = primary;
    if (fallback) {
      setTimeout(() => window.open(fallback, '_blank'), 900);
    }
    speakText(`Opening ${key}, Sir.`);
    addLog('system', `Requested device app: ${key}.`);
    return true;
  } catch (err) {
    if (fallback) window.open(fallback, '_blank');
    return true;
  }
}

// ==========================================
// MEDIA INPUT HANDLERS (Screen, Camera, Upload)
// ==========================================
async function startScreenShare() {
  stopActiveStream();
  try {
    state.mediaStream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: "always" },
      audio: false
    });
    
    elements.visionVideo.srcObject = state.mediaStream;
    elements.visionVideo.style.display = 'block';
    elements.visionImage.style.display = 'none';
    elements.feedPlaceholder.style.display = 'none';
    elements.feedBox.classList.add('active');
    
    state.activeInputType = 'screen';
    elements.feedModeLabel.textContent = "Live Screen Feed Active";
    addLog('system', 'Visual feed link established.');
    speakText("Desktop screen successfully linked.");
    
    // Listen for stop sharing button inside native browser controls
    state.mediaStream.getVideoTracks()[0].onended = () => {
      stopActiveStream();
    };
  } catch (err) {
    console.error("Screen share error:", err);
    addLog('system', 'Visual link failed. Reverting to manual input.');
    speakText("Failed to capture screen. Try camera or image upload.");
  }
}

async function startCameraScanner() {
  stopActiveStream();
  try {
    state.mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } }, // optimized for back camera scanning
      audio: false
    });
    
    elements.visionVideo.srcObject = state.mediaStream;
    elements.visionVideo.style.display = 'block';
    elements.visionImage.style.display = 'none';
    elements.feedPlaceholder.style.display = 'none';
    elements.feedBox.classList.add('active');
    
    state.activeInputType = 'camera';
    elements.feedModeLabel.textContent = "Mobile Camera Active";
    addLog('system', 'Camera scanner active.');
    speakText("Camera active. Point your camera at the screen or notes.");
  } catch (err) {
    console.error("Camera scan error:", err);
    addLog('system', 'Camera scanner access denied.');
    speakText("Camera access denied or unavailable.");
  }
}

function handleImageUpload(e) {
  stopActiveStream();
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    elements.visionImage.src = event.target.result;
    elements.visionImage.style.display = 'block';
    elements.visionVideo.style.display = 'none';
    elements.feedPlaceholder.style.display = 'none';
    elements.feedBox.classList.add('active');
    
    state.activeInputType = 'image';
    elements.feedModeLabel.textContent = `Image: ${file.name}`;
    addLog('system', 'Visual screenshot imported.');
    speakText("Screenshot successfully imported. Say read screen to analyze.");
  };
  reader.readAsDataURL(file);
}

function openLocalFilePicker() {
  if (elements.documentFileInput) {
    elements.documentFileInput.click();
    speakText("Choose a file, Sir. I can read images and plain text files directly.");
    return;
  }
  elements.fileInput.click();
}

function handleDocumentFileUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const lowerName = file.name.toLowerCase();
  if (file.type.startsWith('image/')) {
    handleImageUpload({ target: { files: [file] } });
    return;
  }
  if (file.type.startsWith('text/') || /\.(txt|md|csv|json|rtf)$/i.test(lowerName)) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '').slice(0, 8000);
      addLog('system', `Opened file: ${file.name}`);
      analyzeActiveFeed('general', `Summarize this local file named "${file.name}" and mention key points: ${text}`);
    };
    reader.readAsText(file);
    return;
  }
  const objectUrl = URL.createObjectURL(file);
  window.open(objectUrl, '_blank');
  addLog('system', `Opened file in browser: ${file.name}`);
  speakText("I opened that file in a new tab, Sir. For deep reading, upload a text or image file.");
}

function stopActiveStream() {
  if (state.mediaStream) {
    state.mediaStream.getTracks().forEach(track => track.stop());
    state.mediaStream = null;
  }
  elements.visionVideo.srcObject = null;
  elements.visionVideo.style.display = 'none';
  elements.visionImage.style.display = 'none';
  elements.feedPlaceholder.style.display = 'flex';
  elements.feedBox.classList.remove('active');
  state.activeInputType = 'none';
  elements.feedModeLabel.textContent = "No Input Active";
  state.isSelfScreenShared = false;
}

// ==========================================
// COGNITIVE SCREEN AI ENGINE (Gemini API / Demo)
// ==========================================
// ==========================================
// COGNITIVE SCREEN AI ENGINE (Gemini API / Fallback / Chatbot)
// ==========================================

function captureFrame() {
  if (state.activeInputType === 'none') return null;
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (state.activeInputType === 'image') {
    const img = elements.visionImage;
    if (!img.complete || img.naturalWidth === 0) return null;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
  } else if (state.activeInputType === 'screen' || state.activeInputType === 'camera') {
    const video = elements.visionVideo;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
  } else {
    return null;
  }
  
  return canvas.toDataURL('image/jpeg', 0.85);
}

function takeVisualSnapshot() {
  const imageDataUrl = captureFrame();
  if (!imageDataUrl) {
    speakText("No visual source is active yet, Sir. Share the screen, start the camera, or upload an image first.");
    return;
  }
  const a = document.createElement('a');
  a.href = imageDataUrl;
  a.download = `anicade_snapshot_${Date.now()}.jpg`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  speakText("Screenshot captured, Sir.");
}

async function callGeminiAPI(imageDataUrl, promptText) {
  const apiKey = state.geminiApiKey;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const base64Data = imageDataUrl.split(',')[1];
  
  const payload = {
    contents: [
      {
        parts: [
          { text: promptText },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data
            }
          }
        ]
      }
    ]
  };

  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  }, 9000);

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
    return data.candidates[0].content.parts[0].text;
  } else {
    throw new Error('Invalid response structure from Gemini API');
  }
}

async function callGeminiTextAPI(promptText) {
  const apiKey = state.geminiApiKey;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [
      {
        parts: [
          { text: promptText }
        ]
      }
    ]
  };

  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  }, 8000);

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
    return data.candidates[0].content.parts[0].text;
  } else {
    throw new Error('Invalid response structure from Gemini API');
  }
}

const languagePrompts = {
  'en-GB': 'Respond in English (UK spelling, British elegance, witty, address the user as Sir).',
  'en-US': 'Respond in English (US style, smart, friendly, address the user as Sir).',
  'es-ES': 'Responder en español de manera muy elegante y educada, llámame Señor (Sir) al estilo de un mayordomo inteligente de ANICADE Tech.',
  'fr-FR': 'Répondre en français avec élégance et courtoisie. Appelez l’utilisateur Monsieur (Sir).',
  'de-DE': 'Antworte auf Deutsch, höflich, professionell und nenne mich Sir.',
  'ja-JP': '日本語で丁寧かつスマートに応答してください。ユーザーを「旦那様 (Sir)」と呼んでください。',
  'pt-BR': 'Responder em português de forma polida e inteligente, chamando o usuário de Senhor (Sir).',
  'zu-ZA': 'Phendula ngesiZulu, ngendlela enenhlonipho nehlakaniphile, ukhulume nomsebenzisi njengo "Mnumzane" (Sir).'
};

function getPersonaPrompt() {
  const prompts = {
    vision: 'Persona: polished tactical assistant with concise, confident phrasing.',
    mentor: 'Persona: patient teacher who explains step by step without talking down to the user.',
    companion: 'Persona: relaxed conversational companion who handles small talk naturally.'
  };
  return prompts[state.persona] || prompts.vision;
}

function isDashboardLayout(text) {
  if (!text) return false;
  const keywords = ["anicade vision", "tactical caption logs", "voice command orb", "anicade visual core", "quick tools", "tactical manual"];
  const lowerText = text.toLowerCase();
  let matches = 0;
  keywords.forEach(kw => {
    if (lowerText.includes(kw)) matches++;
  });
  return matches >= 2;
}

async function runLocalPollinations(customText) {
  if (!String(customText || '').trim()) {
    speakText("I did not catch a request, Sir. Please try again.");
    return;
  }
  const localAnswer = getLocalKnowledgeAnswer(customText);
  if (localAnswer) {
    speakText(localAnswer);
    return;
  }
  try {
    state.isAnalyzing = true;
    updateStatusVisuals();
    const languageInstructions = languagePrompts[state.selectedLanguage] || languagePrompts['en-GB'];
    const promptText = `Answer the user's question: "${customText}". ${languageInstructions}`;
    const responseText = await callPollinationsAI(promptText, { quick: true });
    finishAnalyzing();
    speakText(responseText);
  } catch (err) {
    console.error(err);
    finishAnalyzing();
    speakText(getBriefOfflineFallback());
  }
}

function getLocalKnowledgeAnswer(promptText) {
  const lower = String(promptText || '').toLowerCase().trim();
  if (!lower) return "";
  if (lower.includes("capabilities") || lower.includes("what can you do")) {
    return "I can run explicit internet scans, open supported apps, read websites, scan screens, summarize files, manage schedules, remember notes, draft replies, control music playlists, answer simple questions, and change settings by voice, Sir.";
  }
  if (/^(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(lower)) {
    return "At your service, Sir. I am listening.";
  }
  if (lower.includes("who are you") || lower.includes("your name")) {
    return "I am ANICADE VISION, your local-first screen reader, voice assistant, music controller, scheduler, and visual command system, Sir.";
  }
  if (lower.includes("thank you") || lower === "thanks") {
    return "Always a pleasure, Sir.";
  }
  if (/\b(what is|what are|define|explain)\s+(a\s+)?virus\b/.test(lower) || lower === "virus") {
    return "A virus is a tiny infectious agent that can only multiply inside living cells. In computers, a virus is malicious software that attaches to files or programs and spreads when they run.";
  }
  if (lower.includes("what is ai") || lower.includes("what is artificial intelligence")) {
    return "Artificial intelligence is software designed to perform tasks that normally require human intelligence, such as understanding language, recognizing images, making predictions, and helping with decisions.";
  }
  if (lower.includes("what is cloud ai")) {
    return "Cloud AI means artificial intelligence services delivered through cloud platforms. Instead of running every model on your own device, apps call online infrastructure for tasks like chat, image analysis, speech, search, and automation.";
  }
  const whatIsMatch = lower.match(/^(what is|what are|define)\s+(.+)/);
  if (whatIsMatch) {
    return `I can explain ${whatIsMatch[2]}, Sir. Ask for a quick explanation, or ask me to search when you want fresh web results.`;
  }
  return "";
}

function hasValidCloudKey() {
  return state.geminiApiKey && state.geminiApiKey !== OBFUSCATED_DEFAULT_GEMINI_KEY;
}

async function analyzeActiveFeed(actionType, customText = "") {
  // If no source is active and it's not a general text query, warn the user
  if (state.activeInputType === 'none') {
    const lowerText = customText.toLowerCase();
    if (actionType === 'adgen' && customText.trim()) {
      generateImageAd(createAdPromptFromText(customText));
      return;
    }
    const needsVision = lowerText.includes("read") || lowerText.includes("screen") || lowerText.includes("see") || lowerText.includes("look") || lowerText.includes("solve") || lowerText.includes("homework") || lowerText.includes("reply") || actionType !== 'general';
    
    if (needsVision) {
      if (actionType === 'adgen') {
        speakText("I can create a clean ad without a reference image, Sir. Say generate ad for the product or upload a reference image first.");
      } else {
        speakText("Please share your screen, start the camera, or upload an image so I can assist you with that, Sir.");
      }
      state.isAnalyzing = false;
      updateStatusVisuals();
      return;
    }
  }

  const hasVisual = state.activeInputType !== 'none';
  state.isAnalyzing = true;
  updateStatusVisuals();

  // Capture frame if we have an active input
  const imageDataUrl = hasVisual ? captureFrame() : null;
  
  // Base instructions to force a human-like, witty, premium JARVIS personality in preferred language
  const languageInstructions = languagePrompts[state.selectedLanguage] || languagePrompts['en-GB'];
  const systemPref = `You are ANICADE VISION, a highly advanced personal butler and system assistant created by ANICADE Tech. You are modeled after the JARVIS AI: extremely loyal, polished, witty, highly competent, British-bred, and human-like. Address the user as Sir. Speak naturally and avoid robotic boilerplate phrases. Do NOT mention your technical stack, Pollinations.ai, Tesseract, Gemini, or any underlying APIs. Keep your operations immersive and seamless. ${getPersonaPrompt()} ${languageInstructions} `;

  let ocrText = "";
  let isMirrored = false;
  
  if (imageDataUrl) {
    try {
      let worker = await getOCRWorker();
      if (worker) {
        // Run OCR scan to check layout for feedback loop mirroring
        const ret = await worker.recognize(imageDataUrl);
        ocrText = ret.data.text.trim();
        isMirrored = isDashboardLayout(ocrText);
      }
    } catch (e) {
      console.warn("Local OCR layout scan failed:", e);
    }
  }

  state.isSelfScreenShared = isMirrored;

  // Setup prompt based on action
  let promptText = "";
  if (state.isSelfScreenShared) {
    promptText = systemPref + "The user is currently sharing the ANICADE VISION control console itself, putting us in a visual feedback/mirroring loop. Warn the user wittily, politely, and humorously about this feedback loop (modeled after JARVIS commenting on a holographic anomaly) and suggest they share a different application window or document to analyze.";
  } else if (actionType === 'school') {
    promptText = systemPref + "The user is asking for school homework help. Explain the equations, text, math, or slides on screen. Provide step-by-step solutions or simple study summaries.";
  } else if (actionType === 'reply') {
    promptText = systemPref + "The user wants an auto-reply. Read any chat messages visible on the screen. Draft an appropriate, friendly, professional response. If it is on WhatsApp, suggest a reply they can copy.";
  } else if (actionType === 'read') {
    promptText = systemPref + "Perform full screen OCR and explain what is visible. Read key text contents aloud, describe the main elements, diagrams, or user interface sections. Keep it concise.";
  } else if (actionType === 'adgen') {
    promptText = systemPref + "Generate a single descriptive prompt to create a marketing visual banner for the product visible on screen. Output ONLY the prompt itself, nothing else.";
  } else {
    if (imageDataUrl) {
      promptText = systemPref + `Answer the user's request: "${customText}" based on the screenshot.`;
    } else {
      promptText = systemPref + `Answer the user's question: "${customText}".`;
    }
  }

  // If Gemini API Key is available, use Multimodal Cloud API
  if (hasValidCloudKey()) {
    try {
      if (imageDataUrl) {
        speakText("Consulting the cloud core, Sir.");
        const responseText = await callGeminiAPI(imageDataUrl, promptText);
        state.isAnalyzing = false;
        updateStatusVisuals();
        
        if (actionType === 'adgen' && !state.isSelfScreenShared) {
          generateImageAd(responseText);
        } else {
          speakText(responseText);
        }
      } else {
        const responseText = await callGeminiTextAPI(promptText);
        state.isAnalyzing = false;
        updateStatusVisuals();
        speakText(responseText);
      }
    } catch (err) {
      console.error(err);
      if (imageDataUrl) {
        runLocalOCRWithText(ocrText, actionType, customText);
      } else {
        runLocalPollinations(customText);
      }
    }
  } else {
    if (imageDataUrl) {
      runLocalOCRWithText(ocrText, actionType, customText);
    } else {
      runLocalPollinations(customText);
    }
  }
}

// Client-Side OCR Engine Fallback processing pre-extracted text
async function runLocalOCRWithText(ocrText, actionType, customText) {
  try {
    if (!ocrText) {
      state.isAnalyzing = false;
      updateStatusVisuals();
      speakText("I have completed the scan, Sir, but I was unable to detect any legible text on the shared interface.");
      return;
    }

    const languageInstructions = languagePrompts[state.selectedLanguage] || languagePrompts['en-GB'];
    const systemPref = `You are ANICADE VISION, a highly advanced personal butler and system assistant created by ANICADE Tech. You are modeled after the JARVIS AI: extremely loyal, polished, witty, highly competent, British-bred, and human-like. Address the user as Sir. Speak naturally and avoid robotic boilerplate phrases (like "Good day Sir, I am ANICADE VISION" or "I am an AI"). Do NOT mention your technical stack, Pollinations.ai, Tesseract, Gemini, or any underlying APIs. Keep your operations immersive and seamless. ${languageInstructions} `;

    let keylessPrompt = "";
    if (state.isSelfScreenShared) {
      keylessPrompt = systemPref + "Warn the user wittily and politely that they are currently sharing the ANICADE VISION control console itself, putting us in a visual mirroring loop. Suggest they share a different application window or document to analyze.";
    } else {
      if (actionType === 'school') {
        keylessPrompt = systemPref + `Sir is asking for homework help. Here is the text extracted from their screen: "${ocrText}". Explain the topics, equations, or questions step-by-step. Keep it educational and wittily polite.`;
      } else if (actionType === 'reply') {
        keylessPrompt = systemPref + `Sir wants an auto-reply suggestion. Here is the message text extracted from their screen: "${ocrText}". Suggest a professional yet friendly reply they can copy and send.`;
      } else if (actionType === 'read') {
        keylessPrompt = systemPref + `Sir wants a summary of their screen contents. Here is the text extracted from their screen: "${ocrText}". Provide an overview of what is on screen and summarize the text content.`;
      } else if (actionType === 'adgen') {
        keylessPrompt = systemPref + `Sir wants to generate an advertising banner for the items on their screen. Here is the text extracted from their screen: "${ocrText}". Create a single, short descriptive prompt (max 20 words) for generating an image banner. Output ONLY the prompt itself, nothing else. e.g. "a high-end luxury watch on a dark background with gold highlights".`;
      } else {
        keylessPrompt = systemPref + `Answer Sir's specific request: "${customText}" based on this extracted screen text: "${ocrText}".`;
      }
    }

    const responseText = await callPollinationsAI(keylessPrompt);
    state.isAnalyzing = false;
    updateStatusVisuals();

    if (actionType === 'adgen' && !state.isSelfScreenShared) {
      generateImageAd(responseText);
    } else {
      speakText(responseText);
    }

  } catch (err) {
    console.error("Local OCR text mapping failed:", err);
    state.isAnalyzing = false;
    updateStatusVisuals();
    speakText("I could not complete that screen analysis, Sir. Please upload a clearer image or share a different window.");
  }
}

async function getOCRWorker() {
  if (state.ocrWorker) {
    return state.ocrWorker;
  }
  if (state.ocrWorkerLoading) {
    while (state.ocrWorkerLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (state.ocrWorker) return state.ocrWorker;
  }
  
  state.ocrWorkerLoading = true;
  try {
    await loadTesseractEngine();
    const worker = await Tesseract.createWorker('eng', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          const pct = Math.round(m.progress * 100);
          elements.voiceStatusText.textContent = `Scanning: ${pct}%`;
          if (elements.fsVoiceStatus) {
            elements.fsVoiceStatus.textContent = `SCANNING: ${pct}%`;
          }
        }
      }
    });
    state.ocrWorker = worker;
    addLog('system', 'Local OCR engine initialized and cached.');
  } catch (err) {
    console.error("Failed to initialize Tesseract worker:", err);
    state.ocrWorker = null; // reset on crash
  } finally {
    state.ocrWorkerLoading = false;
  }
  
  return state.ocrWorker;
}

function loadTesseractEngine() {
  if (window.Tesseract) return Promise.resolve();
  if (window.__anicadeTesseractLoader) return window.__anicadeTesseractLoader;
  addLog('system', 'Loading OCR engine on demand...');
  window.__anicadeTesseractLoader = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Tesseract engine failed to load'));
    document.head.appendChild(script);
  });
  return window.__anicadeTesseractLoader;
}


// Keyless Free Text LLM Endpoint (Pollinations AI OpenAI compatible POST)
async function callPollinationsAI(prompt, options = {}) {
  const url = 'https://text.pollinations.ai/openai';
  const languageInstructions = languagePrompts[state.selectedLanguage] || languagePrompts['en-GB'];
  const systemPref = `You are ANICADE VISION, a highly advanced personal butler and system assistant created by ANICADE Tech. You are modeled after the JARVIS AI: extremely loyal, polished, witty, highly competent, British-bred, and human-like. Address the user as Sir. Speak naturally and avoid robotic boilerplate phrases (like "Good day Sir, I am ANICADE VISION" or "I am an AI"). Do NOT mention your technical stack, Pollinations.ai, Tesseract, Gemini, or any underlying APIs. Keep your operations immersive and seamless. ${languageInstructions}`;

  const payload = {
    model: 'openai',
    messages: [
      {
        role: 'system',
        content: systemPref
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: options.quick ? 0.35 : 0.6,
    max_tokens: options.quick ? 180 : 420
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.quick ? 4500 : 9000);

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error('Keyless LLM API transaction failure');
  }

  let responseText = "";
  try {
    const data = await response.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      responseText = data.choices[0].message.content;
    } else {
      responseText = JSON.stringify(data);
    }
  } catch (e) {
    responseText = await response.text();
  }
  return responseText.trim();
}

// Creative Ad Image Generation via Pollinations.ai (Free Keyless Image Engine)
function createAdPromptFromText(subject) {
  const cleanSubject = String(subject || '').trim() || 'premium product campaign';
  return `${cleanSubject}, clean usable advertising poster, commercial product photography, clear focal product, refined layout, realistic lighting, premium brand campaign, generous copy space, high contrast, no distorted text, no watermark`;
}

function generateImageAd(adPrompt) {
  addLog('system', 'Generating clean advertising material...');
  
  // Construct pollinations image url
  const marketingPrompt = createAdPromptFromText(adPrompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(marketingPrompt)}?width=500&height=500&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;
  
  // Show image panel
  elements.adOutputContainer.style.display = 'block';
  speakText("Uploading the ads now, Sir.");
  elements.adImage.src = imageUrl;
  
  elements.adImage.onload = () => {
    addLog('ai', 'Advertisement banner generation complete.');
    speakText("The advertisement is ready, Sir. It is presented on your control console.");
  };
  
  elements.adImage.onerror = () => {
    speakText("I apologize, Sir. The image generation matrix failed to render the banner.");
    addLog('system', 'Ad rendering error.');
  };
}

// Download/Save Ad Banner Callback
function downloadAdBanner() {
  const src = elements.adImage.src;
  if (!src) return;
  
  fetch(src)
    .then(resp => resp.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `anicade_ad_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      speakText("Advertising banner saved successfully, Sir.");
    })
    .catch(err => {
      console.error(err);
      window.open(src, '_blank');
      speakText("Opening ad image in a new tab for download, Sir.");
    });
}

// Dynamic Welcome Greeting based on time of day
function welcomeGreeting() {
  const hour = new Date().getHours();
  let timeOfDay = "morning";
  if (hour >= 12 && hour < 17) {
    timeOfDay = "afternoon";
  } else if (hour >= 17 || hour < 5) {
    timeOfDay = "evening";
  }
  
  const text = pickVariant([
    `Good ${timeOfDay}, Sir. I am online and ready.`,
    `Good ${timeOfDay}, Sir. The console is ready when you are.`,
    `Good ${timeOfDay}, Sir. I am listening for the next move.`,
    `Good ${timeOfDay}, Sir. Visual and voice systems are standing by.`
  ]);
  speakText(text);
  
  maybeAutoStartVoice();
}

async function maybeAutoStartVoice() {
  if (!state.recognition || !navigator.permissions || !navigator.permissions.query) return;
  try {
    const permission = await navigator.permissions.query({ name: 'microphone' });
    if (permission.state === 'granted') {
      setTimeout(() => startVoiceAssistant(), 700);
    } else if (elements.voiceSubstatus) {
      elements.voiceSubstatus.textContent = "Click the Orb to enable microphone listening.";
    }
  } catch (err) {
    if (elements.voiceSubstatus) {
      elements.voiceSubstatus.textContent = "Click the Orb to enable microphone listening.";
    }
  }
}

// Clap Wake Activation using Web Audio API
let audioCtx = null;
let micStream = null;
let audioSource = null;
let analyser = null;
let lastPeakTime = 0;

function toggleClapWake() {
  if (state.clapWakeActive) {
    stopClapWake();
    speakText("Clap activation disabled, Sir.");
  } else {
    startClapWake();
  }
}

async function startClapWake() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      speakText("Audio context is not supported in this browser, Sir.");
      return;
    }
    
    state.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.audioCtx = new AudioContext();
    state.analyser = state.audioCtx.createAnalyser();
    state.analyser.fftSize = 256;
    
    state.audioSource = state.audioCtx.createMediaStreamSource(state.micStream);
    state.audioSource.connect(state.analyser);
    
    const bufferLength = state.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    state.clapWakeActive = true;
    elements.clapStatusText.textContent = "ON";
    elements.clapStatusText.style.color = "#00E676";
    elements.btnToggleClap.classList.add('active');
    
    speakText("Clap activation system online, Sir. Speak or clap to activate.");
    addLog('system', 'Clap detection active.');

    let lastVolume = 0;
    
    function detect() {
      if (!state.clapWakeActive) return;
      state.analyser.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      let averageVolume = sum / bufferLength;
      
      // Detect a sudden sound spike (clap)
      if (!state.isSpeaking && !state.isListening && averageVolume > 65 && (averageVolume - lastVolume) > 45) {
        const now = Date.now();
        if (now - lastPeakTime > 800) {
          lastPeakTime = now;
          addLog('system', 'Clap detected! Activating ANICADE VISION...');
          welcomeGreeting();
        }
      }
      
      lastVolume = averageVolume;
      requestAnimationFrame(detect);
    }
    
    detect();
    
  } catch (err) {
    console.error("Clap wake error:", err);
    speakText("Microphone access is required for clap activation, Sir.");
    state.clapWakeActive = false;
    elements.clapStatusText.textContent = "OFF";
    elements.clapStatusText.style.color = "var(--text-light)";
    elements.btnToggleClap.classList.remove('active');
  }
}

function stopClapWake() {
  state.clapWakeActive = false;
  elements.clapStatusText.textContent = "OFF";
  elements.clapStatusText.style.color = "var(--text-light)";
  elements.btnToggleClap.classList.remove('active');
  
  if (state.micStream) {
    state.micStream.getTracks().forEach(track => track.stop());
    state.micStream = null;
  }
  if (state.audioCtx) {
    state.audioCtx.close();
    state.audioCtx = null;
  }
  state.analyser = null;
  addLog('system', 'Clap detection deactivated.');
}

// Immersive Full Screen Orb Mode Toggles
function enterFullScreenOrb() {
  if (elements.fullScreenOrbOverlay) {
    elements.fullScreenOrbOverlay.style.display = 'flex';
    initFullscreenGalaxyParticles();
    updateStatusVisuals();
  }
}

function exitFullScreenOrb() {
  if (elements.fullScreenOrbOverlay) {
    elements.fullScreenOrbOverlay.style.display = 'none';
  }
}

// ==========================================
// UTILITIES & HELPER FUNCTIONS
// ==========================================
function initAPIKey() {
  if (!elements.apiKeyInput || !elements.btnSaveKey) return;
  if (state.geminiApiKey) {
    elements.apiKeyInput.value = "••••••••••••••••••••••••";
    elements.btnSaveKey.textContent = "Clear";
    addLog('system', 'Cloud intelligence core link established.');
  }
}

function saveAPIKey() {
  if (state.geminiApiKey && state.geminiApiKey !== OBFUSCATED_DEFAULT_GEMINI_KEY) {
    // Clear key
    state.geminiApiKey = OBFUSCATED_DEFAULT_GEMINI_KEY;
    localStorage.removeItem('anicade_gemini_key');
    elements.apiKeyInput.value = '';
    elements.btnSaveKey.textContent = 'Save';
    speakText("API key cleared. System reverted to Offline Sandbox.");
    addLog('system', 'API Key removed.');
  } else {
    // Save key
    const key = elements.apiKeyInput.value.trim();
    if (!key || key.includes('••••')) {
      speakText("Please input a key before saving.");
      return;
    }
    state.geminiApiKey = key;
    localStorage.setItem('anicade_gemini_key', key);
    elements.apiKeyInput.value = "••••••••••••••••••••••••";
    elements.btnSaveKey.textContent = "Clear";
    speakText("Gemini API key linked. Screen reader is fully active.");
    addLog('system', 'API Key successfully linked.');
  }
}

function addLog(sender, text) {
  if (!state.conversationLogs) {
    state.conversationLogs = [];
  }
  if (isNoisySystemLog({ sender, text })) {
    return;
  }
  
  state.conversationLogs.push({ sender, text, timestamp: Date.now() });
  
  // Cap history at last 100 entries to prevent memory limits in JSONbin
  if (state.conversationLogs.length > 100) {
    state.conversationLogs.shift();
  }

  const msgEl = document.createElement('div');
  msgEl.className = 'caption-message';
  
  if (sender === 'user') {
    msgEl.innerHTML = `<span class="caption-user">[You]:</span> ${escapeHTML(text)}`;
  } else if (sender === 'ai') {
    msgEl.innerHTML = `<span class="caption-ai">[AI]:</span> ${escapeHTML(text)}`;
    pushOutput(text);
  } else {
    msgEl.innerHTML = `<span class="caption-system">[System]:</span> ${escapeHTML(text)}`;
  }

  elements.captionArea.appendChild(msgEl);
  elements.captionArea.scrollTop = elements.captionArea.scrollHeight;
  
  // Trigger cloud sync save on new user/AI message logs
  if (sender !== 'system') {
    storage.syncSave();
  }
}

function rebuildLogsUI() {
  elements.captionArea.innerHTML = '';
  state.conversationLogs = (state.conversationLogs || []).filter(log => !isNoisySystemLog(log));
  if (!state.conversationLogs || state.conversationLogs.length === 0) {
    addLog('system', 'Systems online. ANICADE VISION Core fully operational, Sir.');
    return;
  }
  
  state.conversationLogs.forEach(log => {
    const msgEl = document.createElement('div');
    msgEl.className = 'caption-message';
    if (log.sender === 'user') {
      msgEl.innerHTML = `<span class="caption-user">[You]:</span> ${escapeHTML(log.text)}`;
    } else if (log.sender === 'ai') {
      msgEl.innerHTML = `<span class="caption-ai">[AI]:</span> ${escapeHTML(log.text)}`;
    } else {
      msgEl.innerHTML = `<span class="caption-system">[System]:</span> ${escapeHTML(log.text)}`;
    }
    elements.captionArea.appendChild(msgEl);
  });
  elements.captionArea.scrollTop = elements.captionArea.scrollHeight;
}

function isNoisySystemLog(log) {
  if (!log || log.sender !== 'system') return false;
  return /^(Background music active|Background music paused|Processing request|Microphone permission denied)/i.test(String(log.text || ''));
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));
}

function pushOutput(text) {
  state.outputHistory.push({ text, timestamp: Date.now() });
  state.outputHistory = state.outputHistory.slice(-20);
  localStorage.setItem('anicade_output_history', JSON.stringify(state.outputHistory));
  updateOutputPanel();
}

function updateOutputPanel() {
  if (!elements.answerOutputArea) return;
  const latest = state.outputHistory[state.outputHistory.length - 1];
  elements.answerOutputArea.textContent = latest ? latest.text : "No answer yet. Ask ANICADE VISION a question or run a screen scan.";
}

function copyLatestOutput() {
  const latest = state.outputHistory[state.outputHistory.length - 1];
  if (!latest) {
    speakText("There is no answer to copy yet, Sir.");
    return;
  }
  navigator.clipboard.writeText(latest.text)
    .then(() => speakText("Answer copied, Sir."))
    .catch(() => speakText("Clipboard access failed, Sir."));
}

function clearConversationLogs() {
  state.conversationLogs = [];
  state.outputHistory = [];
  localStorage.removeItem('anicade_output_history');
  storage.syncSave();
  elements.captionArea.innerHTML = '';
  updateOutputPanel();
  addLog('system', 'Conversation logs cleared locally.');
  speakText("Conversation logs cleared from this browser, Sir.");
}

function toggleTheme(forcedTheme = null) {
  state.theme = forcedTheme || (state.theme === 'dark' ? 'light' : 'dark');
  localStorage.setItem('anicade_theme', state.theme);
  document.body.classList.toggle('theme-light', state.theme === 'light');
  speakText(`${state.theme === 'light' ? 'Light' : 'Dark'} mode active, Sir.`);
}

function setParticles(enabled) {
  state.particlesEnabled = enabled;
  localStorage.setItem('anicade_particles', enabled ? 'on' : 'off');
  document.body.classList.toggle('particles-disabled', !enabled);
  if (elements.btnToggleParticles) elements.btnToggleParticles.textContent = enabled ? 'Particles On' : 'Particles Off';
  speakText(`Particles ${enabled ? 'enabled' : 'disabled'}, Sir.`);
}

function toggleParticles() {
  setParticles(!state.particlesEnabled);
}

async function runSystemCheck() {
  const checks = [];
  checks.push(`speech output ${state.speechSynthesis ? 'ready' : 'unavailable'}`);
  checks.push(`voice input ${state.recognition ? 'ready' : 'unsupported'}`);
  checks.push(`visual input ${navigator.mediaDevices ? 'available' : 'unsupported'}`);
  checks.push(`offline cache ${'serviceWorker' in navigator ? 'available' : 'unsupported'}`);
  checks.push(`OCR engine ${window.Tesseract || state.ocrWorker ? 'ready on demand' : 'loads when first scan begins'}`);
  const result = `System check complete, Sir: ${checks.join(', ')}.`;
  addLog('system', result);
  speakText(result);
}

async function handleMusicUpload(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;
  const addedTracks = [];
  for (const file of files) {
    try {
      const track = await saveMusicFile(file);
      addedTracks.push(track);
      state.musicPlaylist.push(track);
    } catch (err) {
      console.warn('Persistent music save failed, using session URL:', err);
      const src = URL.createObjectURL(file);
      const title = file.name.replace(/\.[^.]+$/, '');
      const track = { title, src, local: true, persisted: false };
      addedTracks.push(track);
      state.musicPlaylist.push(track);
    }
  }
  state.currentMusicIndex = state.musicPlaylist.length - files.length;
  persistMusicPlaylist();
  localStorage.setItem('anicade_music_playlist_titles', JSON.stringify(state.musicPlaylist.map(track => track.title)));
  renderMusicPlaylist();
  const firstTitle = state.musicPlaylist[state.currentMusicIndex]?.title || "the first uploaded track";
  addLog('system', `Added ${addedTracks.length} song${addedTracks.length === 1 ? '' : 's'} to the playlist. Say "list songs", "play song number 1", or "play ${firstTitle}".`);
  speakText(`${addedTracks.length} song${addedTracks.length === 1 ? '' : 's'} added and saved to your playlist on this device, Sir.`);
}

function initAmbientEffects() {
  initBokehLayer();
  initStardustCanvas();
  initEmberLayer();
}

function initFullscreenGalaxyParticles() {
  const container = elements.fsGalaxyParticles;
  if (!container || container.dataset.ready) return;
  container.dataset.ready = 'true';
  const particleCount = 72;
  const colors = ['#00dbe9', '#ebb2ff', '#7df4ff', '#b600f8'];
  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('span');
    particle.className = 'fs-galaxy-particle';
    const size = Math.random() * 4 + 1;
    const color = colors[Math.floor(Math.random() * colors.length)];
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.background = color;
    particle.style.boxShadow = `0 0 ${size * 2.2}px ${color}`;
    particle.style.opacity = String(Math.random() * 0.55 + 0.25);
    container.appendChild(particle);
    particles.push({
      element: particle,
      radiusX: 170 + Math.random() * 260,
      radiusY: 80 + Math.random() * 150,
      speed: 0.00045 + Math.random() * 0.0018,
      phase: Math.random() * Math.PI * 2,
      tilt: (Math.random() - 0.5) * 36,
      depth: Math.random() * 180 - 90
    });
  }

  let lastTime = 0;
  function animate(time) {
    requestAnimationFrame(animate);
    if (!state.particlesEnabled) return;
    const delta = time - lastTime;
    lastTime = time;
    const energy = state.isSpeaking ? 1.35 : state.isListening ? 1.18 : state.isAnalyzing ? 1.25 : 1;
    particles.forEach(particle => {
      particle.phase += particle.speed * delta * energy;
      const x = Math.cos(particle.phase) * particle.radiusX;
      const y = Math.sin(particle.phase) * particle.radiusY;
      const angle = particle.tilt * Math.PI / 180;
      const tiltedX = x * Math.cos(angle) - y * Math.sin(angle);
      const tiltedY = x * Math.sin(angle) + y * Math.cos(angle);
      const scale = 1 + Math.sin(particle.phase) * 0.35;
      particle.element.style.transform = `translate(-50%, -50%) translate3d(${tiltedX}px, ${tiltedY}px, ${particle.depth}px) scale(${scale})`;
      particle.element.style.zIndex = Math.sin(particle.phase) > 0 ? '4' : '1';
    });
  }
  requestAnimationFrame(animate);
}

function initBokehLayer() {
  const layer = document.getElementById('bokehLayer');
  if (!layer || layer.dataset.ready) return;
  layer.dataset.ready = 'true';
  const colors = ['#00BFFF', '#C6A85C', '#2dd4bf', '#6d28d9'];
  for (let i = 0; i < 12; i++) {
    const bokeh = document.createElement('span');
    bokeh.className = 'bokeh';
    const size = Math.random() * 150 + 46;
    bokeh.style.width = `${size}px`;
    bokeh.style.height = `${size}px`;
    bokeh.style.left = `${Math.random() * 100}%`;
    bokeh.style.top = `${Math.random() * 100}%`;
    bokeh.style.background = colors[Math.floor(Math.random() * colors.length)];
    bokeh.style.setProperty('--x', `${Math.random() * 120 - 60}px`);
    bokeh.style.setProperty('--y', `${Math.random() * 120 - 60}px`);
    bokeh.style.setProperty('--duration', `${Math.random() * 7 + 6}s`);
    layer.appendChild(bokeh);
  }
}

function initStardustCanvas() {
  const canvas = document.getElementById('stardustCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const particles = [];
  const mouse = { x: null, y: null };

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particles.length = 0;
    const particleCount = Math.min(180, Math.floor((canvas.width * canvas.height) / 9000));
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.8 + 0.4,
        speedX: Math.random() * 0.7 - 0.35,
        speedY: Math.random() * 0.7 - 0.35
      });
    }
  }

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
  });
  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });
  resize();

  function animate() {
    requestAnimationFrame(animate);
    if (!state.particlesEnabled) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(particle => {
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      if (particle.x > canvas.width) particle.x = 0;
      if (particle.x < 0) particle.x = canvas.width;
      if (particle.y > canvas.height) particle.y = 0;
      if (particle.y < 0) particle.y = canvas.height;
      if (mouse.x !== null) {
        const dx = mouse.x - particle.x;
        const dy = mouse.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 110) {
          particle.x -= dx / 24;
          particle.y -= dy / 24;
        }
      }
      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  animate();
}

function initEmberLayer() {
  const layer = document.getElementById('embersLayer');
  if (!layer || layer.dataset.ready) return;
  layer.dataset.ready = 'true';
  setInterval(() => {
    if (!state.particlesEnabled) return;
    const ember = document.createElement('span');
    ember.className = 'ember';
    ember.style.left = `${Math.random() * 100}%`;
    ember.style.setProperty('--drift', `${Math.random() * 120 - 60}px`);
    ember.style.setProperty('--duration', `${Math.random() * 3 + 2.5}s`);
    layer.appendChild(ember);
    setTimeout(() => ember.remove(), 6000);
  }, 160);
}

function updateStatusVisuals() {
  const isList = state.isListening;
  const isSpeak = state.isSpeaking;
  const isAnal = state.isAnalyzing;
  const hasVisual = state.activeInputType !== 'none';

  // Main Dashboard Elements
  if (isAnal) {
    elements.statusDot.className = "status-dot speaking";
    elements.statusText.textContent = hasVisual ? "AI Analyzing Screen..." : "Processing Request...";
    elements.speechOrbContainer.className = "speech-orb-container speaking";
    elements.voiceStatusText.textContent = hasVisual ? "Analyzing Screen..." : "Thinking...";
  } else if (isSpeak) {
    elements.statusDot.className = "status-dot speaking";
    elements.statusText.textContent = "AI speaking...";
    elements.speechOrbContainer.className = "speech-orb-container speaking";
    elements.voiceStatusText.textContent = "Speaking...";
  } else if (isList) {
    elements.statusDot.className = "status-dot listening";
    elements.statusText.textContent = "Listening for Voice Commands...";
    elements.speechOrbContainer.className = "speech-orb-container listening";
    elements.voiceStatusText.textContent = "Listening...";
  } else {
    elements.statusDot.className = "status-dot active";
    elements.statusText.textContent = "System Ready";
    elements.speechOrbContainer.className = "speech-orb-container";
    elements.voiceStatusText.textContent = "Click Orb to Begin";
  }

  // Full Screen Immersive Overlay Elements
  if (elements.fullScreenOrbOverlay) {
    const coreMetric = isAnal ? "86.7%" : isSpeak ? "94.2%" : isList ? "91.8%" : "72.4%";
    if (elements.fsCoreMetric) elements.fsCoreMetric.textContent = coreMetric;
    if (elements.fsLinkStatus) elements.fsLinkStatus.textContent = state.recognition ? "STABLE" : "LOCAL";
    if (elements.fsInputStatus) elements.fsInputStatus.textContent = state.activeInputType === 'none' ? "NO VISUAL" : state.activeInputType.toUpperCase();
    if (elements.fsMemoryMetric) elements.fsMemoryMetric.textContent = `${state.outputHistory.length}/20`;
    if (elements.fsProcessMetric) elements.fsProcessMetric.textContent = isAnal ? "ACTIVE" : isSpeak ? "VOICE" : isList ? "LISTEN" : "IDLE";
    if (elements.fsNetworkMetric) elements.fsNetworkMetric.textContent = "LOCAL-FIRST";
    if (isAnal) {
      elements.fullScreenOrbOverlay.className = "fullscreen-orb-overlay speaking";
      elements.fsVoiceStatus.textContent = hasVisual ? "ANALYZING SCREEN" : "THINKING";
      elements.fsVoiceSubstatus.textContent = hasVisual ? "ANICADE VISION is processing visual text, Sir..." : "Processing request, Sir...";
    } else if (isSpeak) {
      elements.fullScreenOrbOverlay.className = "fullscreen-orb-overlay speaking";
      elements.fsVoiceStatus.textContent = "SPEAKING";
      elements.fsVoiceSubstatus.textContent = "Transmitting response to Sir...";
    } else if (isList) {
      elements.fullScreenOrbOverlay.className = "fullscreen-orb-overlay listening";
      elements.fsVoiceStatus.textContent = "ANICADE VISION LISTENING";
      elements.fsVoiceSubstatus.textContent = "Speak to ANICADE VISION, Sir.";
    } else {
      elements.fullScreenOrbOverlay.className = "fullscreen-orb-overlay";
      elements.fsVoiceStatus.textContent = "STANDBY MODE";
      elements.fsVoiceSubstatus.textContent = "Tap the Orb or speak to wake ANICADE VISION.";
    }
  }
}

function copyNotebookText() {
  const text = elements.voiceTypingBox.value.trim();
  if (!text) {
    speakText("Notepad is empty, Sir. Start voice typing first.");
    return;
  }
  navigator.clipboard.writeText(text)
    .then(() => {
      speakText("Notebook content copied, Sir.");
      addLog('system', 'Notebook copied to clipboard.');
    })
    .catch(err => {
      console.error(err);
      speakText("Failed to access clipboard, Sir.");
    });
}

function triggerInstallPrompt() {
  if (state.deferredPrompt) {
    state.deferredPrompt.prompt();
    state.deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the PWA install prompt');
      } else {
        console.log('User dismissed the PWA install prompt');
      }
      state.deferredPrompt = null;
      elements.btnInstall.style.display = 'none';
    });
  } else {
    speakText("ANICADE VISION is already installed or your browser doesn't support automatic prompts, Sir. Use browser menu settings to add to home screen.");
  }
}

// ==========================================
/* ===== NEW UPGRADED TACTICAL COMPENSATORS ===== */
// ==========================================

async function ensureMicAnalyser() {
  if (state.analyser) return state.analyser;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    
    if (!state.micStream) {
      state.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }
    
    state.audioCtx = new AudioContext();
    state.analyser = state.audioCtx.createAnalyser();
    state.analyser.fftSize = 256;
    
    state.audioSource = state.audioCtx.createMediaStreamSource(state.micStream);
    state.audioSource.connect(state.analyser);
    
    console.log("Audio core microphone linked successfully.");
    return state.analyser;
  } catch (err) {
    console.warn("Could not bind microphone to Web Audio analyser:", err);
    return null;
  }
}

function startVoiceVisualizer() {
  const rings = document.querySelectorAll('.speech-orb-ring, .fs-orb-ring');
  const orbs = document.querySelectorAll('.speech-orb, .fs-orb');

  function draw() {
    requestAnimationFrame(draw);
    
    let micVolume = 0;
    // 1. Microphone capture for outer rings (user speaking)
    if (state.isListening && state.analyser) {
      const bufferLength = state.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      state.analyser.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      let avg = sum / bufferLength;
      micVolume = Math.min(avg / 28, 1.2); // normalised scale factor
    }
    
    // 2. Simulated voice frequencies for inner orbs (AI speaking)
    let aiVolume = 0;
    if (state.isSpeaking) {
      const time = Date.now() * 0.022;
      aiVolume = Math.sin(time) * Math.cos(time * 0.77) * 0.35 + 0.55;
      if (Math.random() > 0.88) {
        aiVolume += Math.random() * 0.45;
      }
      if (Math.floor(Date.now() / 1000) % 4 === 0 && Math.random() > 0.85) {
        aiVolume = 0.05; // natural word boundary pause
      }
      aiVolume = Math.min(Math.max(aiVolume, 0), 1.1);
    }

    // Dynamic transform scaling
    rings.forEach(ring => {
      if (state.isListening && micVolume > 0.05) {
        const ringScale = Math.min(1.0 + micVolume * 0.5, 1.42);
        ring.style.scale = ringScale;
        ring.style.borderColor = `rgba(255, 23, 68, ${0.45 + micVolume * 0.45})`;
        ring.style.boxShadow = `0 0 ${15 + micVolume * 30}px rgba(255, 23, 68, 0.65)`;
      } else {
        ring.style.scale = '';
        ring.style.borderColor = '';
        ring.style.boxShadow = '';
      }
    });

    orbs.forEach(orb => {
      if (state.isSpeaking) {
        const orbScale = Math.min(0.96 + aiVolume * 0.18, 1.16);
        orb.style.scale = orbScale;
        orb.style.boxShadow = `0 0 ${25 + aiVolume * 45}px rgba(198, 168, 92, ${0.7 + aiVolume * 0.3}), inset 0 0 15px rgba(198, 168, 92, 0.4)`;
      } else {
        orb.style.scale = '';
        orb.style.boxShadow = '';
      }
    });
  }
  
  draw();
}

// Storage and JSONbin sync engine
const storage = {
  getBinDetails() {
    return {
      binId: USER_CONFIG.jsonbinId || '',
      apiKey: USER_CONFIG.jsonbinKey || '',
      accessKey: USER_CONFIG.jsonbinAccessKey || ''
    };
  },
  
  saveBinDetails(binId, apiKey) {
    state.jsonbinId = binId;
    state.jsonbinKey = apiKey;
  },

  async syncSave() {
    const dataToSave = {
      schedules: state.schedules,
      connectedApps: state.connectedApps,
      selectedLanguage: state.selectedLanguage,
      selectedVoiceName: state.selectedVoiceName,
      conversationLogs: state.conversationLogs || []
    };
    
    localStorage.setItem('anicade_tactical_data', JSON.stringify(dataToSave));
    
    const details = this.getBinDetails();
    if (!details.binId || !details.apiKey) {
      console.log("JSONbin credentials missing. State cached locally.");
      return false;
    }

    try {
      const response = await fetch(`https://api.jsonbin.io/v3/b/${details.binId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': details.apiKey,
          'X-Access-Key': details.accessKey
        },
        body: JSON.stringify(dataToSave)
      });
      if (response.ok) {
        console.log("Synchronized state with JSONbin successfully.");
        return true;
      }
      return false;
    } catch (err) {
      console.error("JSONbin cloud sync failed:", err);
      return false;
    }
  },

  async syncLoad() {
    const details = this.getBinDetails();
    let localData = localStorage.getItem('anicade_tactical_data');
    let loadedData = localData ? JSON.parse(localData) : null;
    
    if (details.binId && details.apiKey) {
      try {
        console.log("Loading cloud state from JSONbin...");
        const response = await fetch(`https://api.jsonbin.io/v3/b/${details.binId}/latest`, {
          headers: {
            'X-Master-Key': details.apiKey,
            'X-Access-Key': details.accessKey
          }
        });
        if (response.ok) {
          const res = await response.json();
          if (res.record) {
            loadedData = res.record;
            localStorage.setItem('anicade_tactical_data', JSON.stringify(loadedData));
            console.log("JSONbin cloud state loaded.");
          }
        }
      } catch (err) {
        console.warn("Could not query JSONbin cloud, using local fallback:", err);
      }
    }
    
    if (loadedData) {
      if (loadedData.schedules) state.schedules = loadedData.schedules;
      if (loadedData.connectedApps) state.connectedApps = loadedData.connectedApps;
      if (loadedData.selectedLanguage) state.selectedLanguage = loadedData.selectedLanguage;
      if (loadedData.selectedVoiceName) state.selectedVoiceName = loadedData.selectedVoiceName;
      if (loadedData.conversationLogs) state.conversationLogs = loadedData.conversationLogs;
      
      updateConnectedAppsUI();
      updateSchedulesUI();
      rebuildLogsUI();
    }
  }
};

function initStorageAndSchedules() {
  if (state.selectedLanguage) {
    elements.langSelect.value = state.selectedLanguage;
  }
  
  updateConnectedAppsUI();
  storage.syncLoad();
  
  // Minute alarm tracker
  setInterval(checkSchedules, 10000);
}

// Scheduler operations
function addSchedule(title, time, date = '') {
  const item = {
    id: Date.now(),
    title: title,
    time: time,
    date: date,
    triggered: false
  };
  state.schedules.push(item);
  storage.syncSave();
  updateSchedulesUI();
  speakText(`Schedule reminder registered: ${title} at ${time}.`);
}

function removeSchedule(id) {
  state.schedules = state.schedules.filter(item => item.id !== id);
  storage.syncSave();
  updateSchedulesUI();
  speakText("Reminder removed, Sir.");
}

function clearSchedules() {
  state.schedules = [];
  storage.syncSave();
  updateSchedulesUI();
  if (elements.schedTitle) elements.schedTitle.value = '';
  if (elements.schedTime) elements.schedTime.value = '';
  speakText("All schedules cleared, Sir.");
}

function updateSchedulesUI() {
  elements.scheduleList.innerHTML = '';
  
  if (state.schedules.length === 0) {
    elements.scheduleList.innerHTML = `<div style="font-size: 12px; color: var(--text-light); text-align: center; padding: 10px;">No scheduled reminders, Sir.</div>`;
    return;
  }

  state.schedules.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'schedule-item';
    itemEl.innerHTML = `
      <div class="schedule-item-info">
        <span class="schedule-item-title">${item.title}</span>
        <span class="schedule-item-time">${item.time}</span>
      </div>
      <button class="btn-remove-schedule" data-id="${item.id}" title="Remove task">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;
    
    itemEl.querySelector('.btn-remove-schedule').addEventListener('click', (e) => {
      const id = parseFloat(e.currentTarget.dataset.id);
      removeSchedule(id);
    });
    
    elements.scheduleList.appendChild(itemEl);
  });
}

function checkSchedules() {
  const now = new Date();
  const currentHrs = String(now.getHours()).padStart(2, '0');
  const currentMins = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${currentHrs}:${currentMins}`;
  const currentDate = now.toISOString().split('T')[0];
  
  let triggeredAny = false;
  state.schedules.forEach(item => {
    if (!item.triggered && item.time === currentTime) {
      if (!item.date || item.date === currentDate) {
        item.triggered = true;
        triggeredAny = true;
        speakText(`Pardon me, Sir. It is time for your scheduled event: ${item.title}.`);
        addLog('system', `Alarm triggered: ${item.title}`);
      }
    }
  });

  state.schedules.forEach(item => {
    if (item.triggered && item.time !== currentTime) {
      item.triggered = false;
    }
  });
  
  if (triggeredAny) {
    storage.syncSave();
  }
}

// Connected apps reader
const appMockData = {
  calendar: [
    "You have a meeting with ANICADE Tech at 3:00 PM today.",
    "Project status review scheduled for tomorrow at 10:00 AM."
  ],
  outlook: [
    "Email from ANICADE Tech: 'The latest visual core build looks amazing.'",
    "Email from Client: 'Can you demonstrate the screen reader features today?'"
  ],
  whatsapp: [
    "John: 'Did you check the new image ad designs?'",
    "Sarah: 'The animal sound decoder works like a charm!'"
  ],
  facebook: [
    "Notification: 12 users liked your post about ANICADE VISION PWA.",
    "Notification: Tech group mentioned ANICADE Tech in a comment."
  ],
  tiktok: [
    "Notification: Your video on Jarvis AI screen reader has reached 5,000 views!"
  ]
};

function readConnectedApps(appName = "") {
  let responseParts = [];
  const target = appName.toLowerCase();
  
  const readApp = (key, label) => {
    if (state.connectedApps[key]) {
      const dataList = appMockData[key];
      const randomMsg = dataList[Math.floor(Math.random() * dataList.length)];
      responseParts.push(`${label} feed update: ${randomMsg}`);
    } else {
      responseParts.push(`${label} is currently disconnected, Sir.`);
    }
  };

  if (target === "calendar") {
    readApp("calendar", "Calendar");
  } else if (target === "outlook") {
    readApp("outlook", "Outlook Mail");
  } else if (target === "whatsapp") {
    readApp("whatsapp", "WhatsApp");
  } else if (target === "facebook") {
    readApp("facebook", "Facebook");
  } else if (target === "tiktok") {
    readApp("tiktok", "TikTok");
  } else if (target === "unread_all") {
    readApp("whatsapp", "WhatsApp");
    readApp("facebook", "Facebook");
    readApp("tiktok", "TikTok");
  } else {
    let connectedAny = false;
    for (let key in state.connectedApps) {
      if (state.connectedApps[key]) {
        readApp(key, key.charAt(0).toUpperCase() + key.slice(1));
        connectedAny = true;
      }
    }
    if (!connectedAny) {
      return "All external applications are currently offline or disconnected, Sir. You can link them in the overrides panel.";
    }
  }

  return "I've compiled your connected application states, Sir. " + responseParts.join(" ");
}

function updateConnectedAppsUI() {
  elements.chkCalendar.checked = !!state.connectedApps.calendar;
  elements.chkOutlook.checked = !!state.connectedApps.outlook;
  elements.chkWhatsApp.checked = !!state.connectedApps.whatsapp;
  elements.chkFacebook.checked = !!state.connectedApps.facebook;
  elements.chkTikTok.checked = !!state.connectedApps.tiktok;
}

// Animal Sound Decoder
async function decodeAnimalSound(animalType = "detect") {
  await ensureMicAnalyser();
  speakText("Listening to the environment, Sir. Initializing animal acoustics scan.");
  addLog('system', 'Scanning animal acoustics...');
  
  elements.voiceStatusText.textContent = "Acoustics Scan...";
  if (elements.fsVoiceStatus) elements.fsVoiceStatus.textContent = "ACOUSTICS SCAN...";
  
  // Show scanner HUD
  if (elements.animalScannerHud) {
    elements.animalScannerHud.style.display = 'block';
    elements.scannerBar.style.width = '0%';
    elements.animalScannerStatus.textContent = "Calibrating Sensors...";
  }
  
  // Animate the bar and status over 3 seconds (3000ms)
  const startTime = Date.now();
  const duration = 3000;
  
  const scanInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1.0);
    
    if (elements.scannerBar) {
      elements.scannerBar.style.width = `${progress * 100}%`;
    }
    
    if (elements.animalScannerStatus) {
      const pitchHz = Math.floor(220 + progress * 780 + Math.random() * 40);
      const variance = (0.04 + progress * 0.16 + Math.random() * 0.04).toFixed(2);
      elements.animalScannerStatus.textContent = `Scanning: ${pitchHz}Hz (Var: ${variance})`;
    }
    
    if (progress >= 1.0) {
      clearInterval(scanInterval);
    }
  }, 100);
  
  await new Promise(resolve => setTimeout(resolve, duration));
  
  let signalDesc = "Low pitch modulation";
  if (state.analyser) {
    const dataArray = new Uint8Array(state.analyser.frequencyBinCount);
    state.analyser.getByteFrequencyData(dataArray);
    let peakIndex = 0;
    let peakValue = 0;
    for (let i = 0; i < dataArray.length; i++) {
      if (dataArray[i] > peakValue) {
        peakValue = dataArray[i];
        peakIndex = i;
      }
    }
    if (peakIndex > 35) signalDesc = "High frequency short bursts";
    else if (peakIndex > 15) signalDesc = "Mid frequency modulation";
  }
  
  if (elements.animalScannerStatus) {
    elements.animalScannerStatus.textContent = "Acoustic Signal Decoded";
  }
  
  setTimeout(() => {
    if (elements.animalScannerHud) {
      elements.animalScannerHud.style.display = 'none';
    }
  }, 1500);

  let chosenAnimal = animalType;
  if (chosenAnimal === "detect") {
    chosenAnimal = signalDesc.includes("High") ? "Cat" : "Dog";
  }

  const prompt = `Translate this ${chosenAnimal} sound described as "${signalDesc}". Act as ANICADE VISION (created by ANICADE Tech, British, witty, polite, address the user as Sir). Provide a humorous and clever translation of what this animal is trying to say. Keep it under 50 words.`;

  try {
    let translation = "";
    if (hasValidCloudKey()) {
      translation = await callGeminiTextAPI(prompt);
    } else {
      translation = await callPollinationsAI(prompt);
    }
    
    state.isAnalyzing = false;
    updateStatusVisuals();
    state.animalTranslations.push({ animal: chosenAnimal, translation, timestamp: Date.now() });
    state.animalTranslations = state.animalTranslations.slice(-12);
    localStorage.setItem('anicade_animal_translations', JSON.stringify(state.animalTranslations));
    speakText(translation);
  } catch (err) {
    console.error("Animal translation failed:", err);
    state.isAnalyzing = false;
    updateStatusVisuals();
    speakText("My apologies, Sir. The animal acoustic core failed to decode the signal.");
  }
}

// ==========================================
// EVENT LISTENERS BINDINGS
// ==========================================
function setupEventListeners() {
  // Feed Inputs
  elements.btnScreenShare.addEventListener('click', startScreenShare);
  elements.btnCamera.addEventListener('click', startCameraScanner);
  elements.fileInput.addEventListener('change', handleImageUpload);
  if (elements.documentFileInput) elements.documentFileInput.addEventListener('change', handleDocumentFileUpload);

  // Orb Trigger
  elements.speechOrb.addEventListener('click', toggleVoiceAssistant);
  
  // Immersive Mode Toggles
  elements.btnToggleFullScreen.addEventListener('click', enterFullScreenOrb);
  elements.btnExitFullScreen.addEventListener('click', exitFullScreenOrb);
  elements.fsOrb.addEventListener('click', toggleVoiceAssistant);
  
  // Clap Wake Toggle
  elements.btnToggleClap.addEventListener('click', toggleClapWake);

  // Gemini API Key Override
  if (elements.btnSaveKey) elements.btnSaveKey.addEventListener('click', saveAPIKey);

  // Storage Sync Configuration Click
  if (elements.btnSaveSync) elements.btnSaveSync.addEventListener('click', () => {
    const idVal = elements.jsonbinIdInput.value.trim();
    const keyVal = elements.jsonbinKeyInput.value.trim();
    
    if (idVal && keyVal) {
      if (idVal.indexOf('•') === -1) state.jsonbinId = idVal;
      if (keyVal.indexOf('•') === -1) state.jsonbinKey = keyVal;
      
      storage.saveBinDetails(state.jsonbinId, state.jsonbinKey);
      elements.jsonbinIdInput.value = "••••••••••••••••••••••••";
      elements.jsonbinKeyInput.value = "••••••••••••••••••••••••";
      speakText("Cloud sync details connected, Sir.");
      storage.syncSave();
    } else {
      state.jsonbinId = '';
      state.jsonbinKey = '';
      storage.saveBinDetails('', '');
      elements.jsonbinIdInput.value = '';
      elements.jsonbinKeyInput.value = '';
      speakText("Cloud sync details cleared.");
      storage.syncSave();
    }
  });

  // Checkboxes for connected apps
  const updateAppSwitch = () => {
    state.connectedApps = {
      calendar: elements.chkCalendar.checked,
      outlook: elements.chkOutlook.checked,
      whatsapp: elements.chkWhatsApp.checked,
      facebook: elements.chkFacebook.checked,
      tiktok: elements.chkTikTok.checked
    };
    localStorage.setItem('anicade_connected_apps', JSON.stringify(state.connectedApps));
    storage.syncSave();
  };

  elements.chkCalendar.addEventListener('change', updateAppSwitch);
  elements.chkOutlook.addEventListener('change', updateAppSwitch);
  elements.chkWhatsApp.addEventListener('change', updateAppSwitch);
  elements.chkFacebook.addEventListener('change', updateAppSwitch);
  elements.chkTikTok.addEventListener('change', updateAppSwitch);

  // Language select drop-down change handler
  elements.langSelect.addEventListener('change', () => {
    state.selectedLanguage = elements.langSelect.value;
    localStorage.setItem('anicade_selected_language', state.selectedLanguage);
    if (state.recognition) {
      state.recognition.lang = state.selectedLanguage;
    }
    
    const languageConfirmations = {
      'en-GB': 'Vocal engine language updated, Sir.',
      'en-US': 'Vocal engine language updated, Sir.',
      'es-ES': 'Motor de voz actualizado, Señor.',
      'fr-FR': 'Moteur vocal mis à jour, Monsieur.',
      'de-DE': 'Sprachausgabe aktualisiert, Sir.',
      'ja-JP': '音声エンジンが更新されました、旦那様。',
      'pt-BR': 'Motor de voz atualizado, Senhor.',
      'zu-ZA': 'Injini yezwi ibuyekeziwe, Mnumzane.'
    };
    
    const confText = languageConfirmations[state.selectedLanguage] || languageConfirmations['en-GB'];
    speakText(confText);
    storage.syncSave();
  });

  // Animal Decoder actions
  elements.btnDecodeAnimal.addEventListener('click', () => {
    const animalType = elements.animalTypeSelect.value;
    decodeAnimalSound(animalType);
  });

  // Tools triggers
  elements.toolSchool.addEventListener('click', () => analyzeActiveFeed('school'));
  elements.toolReply.addEventListener('click', () => analyzeActiveFeed('reply'));
  elements.toolAdGen.addEventListener('click', () => analyzeActiveFeed('adgen'));
  elements.toolAnimal.addEventListener('click', () => {
    const drawer = document.getElementById('animalDecoderDrawer');
    if (drawer) {
      drawer.open = !drawer.open;
      drawer.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // Scheduler Reminders creation
  elements.btnAddSched.addEventListener('click', () => {
    const titleVal = elements.schedTitle.value.trim();
    const timeVal = elements.schedTime.value.trim();
    if (!titleVal || !timeVal) {
      speakText("Please input both reminder details and time, Sir.");
      return;
    }
    addSchedule(titleVal, timeVal);
    elements.schedTitle.value = '';
    elements.schedTime.value = '';
  });

  // Ad Download Trigger
  elements.btnDownloadAd.addEventListener('click', downloadAdBanner);

  // Notepad Controls
  elements.btnCopyNote.addEventListener('click', copyNotebookText);
  elements.btnClearNote.addEventListener('click', () => {
    elements.voiceTypingBox.value = "";
    speakText("Notepad cleared, Sir.");
  });

  // PWA Prompt trigger
  elements.btnInstall.addEventListener('click', triggerInstallPrompt);

  if (elements.btnMusicPlay) elements.btnMusicPlay.addEventListener('click', playMusic);
  if (elements.btnMusicPause) elements.btnMusicPause.addEventListener('click', pauseMusic);
  if (elements.btnMusicNext) elements.btnMusicNext.addEventListener('click', nextMusicTrack);
  if (elements.btnMusicRepeat) elements.btnMusicRepeat.addEventListener('click', cycleMusicRepeatMode);
  if (elements.musicUploadInput) elements.musicUploadInput.addEventListener('change', handleMusicUpload);
  renderMusicPlaylist();
}

// ========================================================
// 🌌 ORB PARTICLE SYSTEM (Interactive Sci-Fi Floating Particles)
// ========================================================
class OrbParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.maxParticles = 50;
    this.animationFrameId = null;
    this.active = false;
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  
  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }
  
  start() {
    if (this.active) return;
    this.active = true;
    this.animate();
  }
  
  stop() {
    this.active = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  getColor() {
    if (state.isListening) {
      return { r: 255, g: 23, b: 68 }; // Red when listening
    } else if (state.isSpeaking || state.isAnalyzing) {
      return { r: 198, g: 168, b: 92 }; // Gold when speaking/thinking
    } else {
      return { r: 0, g: 191, b: 255 }; // Cyan standby
    }
  }
  
  animate() {
    if (!this.active) return;
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    
    const ctx = this.ctx;
    const canvas = this.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Calculate dynamic parameters based on mic or AI speaking volume
    let scale = 1.0;
    let speedMult = 1.0;
    
    if (state.isListening && state.analyser) {
      const bufferLength = state.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      state.analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
      let avg = sum / bufferLength;
      scale = 1.0 + (avg / 30.0);
      speedMult = 1.0 + (avg / 15.0);
    } else if (state.isSpeaking) {
      const time = Date.now() * 0.022;
      let aiVol = Math.sin(time) * Math.cos(time * 0.77) * 0.35 + 0.55;
      scale = 1.0 + aiVol * 0.35;
      speedMult = 1.0 + aiVol * 0.7;
    }
    
    const color = this.getColor();
    
    // Spawn new particles
    if (this.particles.length < this.maxParticles && Math.random() < 0.25) {
      const angle = Math.random() * Math.PI * 2;
      const radius = (canvas.width * 0.22) + Math.random() * 8;
      this.particles.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        radius: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.3,
        life: Math.random() * 80 + 40,
        maxLife: 120
      });
    }
    
    // Update and draw particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * speedMult;
      p.y += p.vy * speedMult;
      
      const dx = p.x - centerX;
      const dy = p.y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      p.life -= 1;
      p.alpha = (p.life / p.maxLife) * 0.8;
      
      // Pull particles slowly towards the center to create a dust cloud effect
      p.vx -= dx * 0.0001;
      p.vy -= dy * 0.0001;
      
      if (p.life <= 0 || dist > canvas.width * 0.45 || dist < canvas.width * 0.1) {
        this.particles.splice(i, 1);
        continue;
      }
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * scale, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${p.alpha})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${p.alpha * 0.8})`;
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    }
  }
}
