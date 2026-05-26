 /**
 * ANICADE VISION - Core Application Logic
 * Powered by ANICADE TECH
 */

// ========================================================
// 🌌 ANICADE VISION - USER CONFIGURATION CORES
// ========================================================
const USER_CONFIG = {
  geminiApiKey: '', // <-- Paste your Gemini API Key here (optional, offline OCR/Pollinations runs if empty)
  jsonbinId: '',    // <-- Paste your JSONbin Bin ID here (optional)
  jsonbinKey: ''    // <-- Paste your JSONbin Master Key here (optional)
};

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
  mediaStream: null,
  activeInputType: 'none', // 'screen', 'camera', 'image', 'none'
  geminiApiKey: USER_CONFIG.geminiApiKey || localStorage.getItem('anicade_gemini_key') || '',
  jsonbinId: USER_CONFIG.jsonbinId || localStorage.getItem('anicade_jsonbin_id') || '',
  jsonbinKey: USER_CONFIG.jsonbinKey || localStorage.getItem('anicade_jsonbin_key') || '',
  schedules: [],
  connectedApps: JSON.parse(localStorage.getItem('anicade_connected_apps') || '{"calendar":true,"outlook":true,"whatsapp":false,"facebook":false,"tiktok":false}'),
  lastAISpokenText: '',
  isSelfScreenShared: false,
  deferredPrompt: null,
  typingMode: false,
  clapWakeActive: false,
  ocrWorker: null,
  ocrWorkerLoading: false,
  audioCtx: null,
  micStream: null,
  audioSource: null,
  analyser: null
};

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

  // Quick Tools & Notebook
  toolSchool: document.getElementById('toolSchool'),
  toolReply: document.getElementById('toolReply'),
  toolAdGen: document.getElementById('toolAdGen'),
  toolImageGen: document.getElementById('toolImageGen'),
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
  btnDownloadAd: document.getElementById('btnDownloadAd')
};

// Initialize Application
window.addEventListener('DOMContentLoaded', () => {
  initPWA();
  initTabs();
  initVoiceSettings();
  initSpeechRecognition();
  initAPIKey();
  initStorageAndSchedules();
  setupEventListeners();
  addLog('system', 'Systems online. ANICADE VISION Core fully operational, Sir.');
  
  // Warm up the Tesseract OCR worker in the background for instant responsiveness on first scan
  getOCRWorker().catch(err => console.error("OCR worker warm up failed:", err));
  
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

function speakText(text) {
  if (!state.speechSynthesis) return;

  // Save original text for loopback self-transcription prevention
  state.lastAISpokenText = text;

  // Filter text to prevent reading aloud elements like * or ## or emojis
  const cleanedText = cleanTextForSpeech(text);
  if (!cleanedText) return;

  // Cancel current speech
  state.speechSynthesis.cancel();

  // If SpeechRecognition is running, temporarily stop it to avoid self-transcription feedback
  if (state.recognition && state.recognitionActive) {
    state.isAIspeaking = true;
    state.recognition.stop();
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

  utterance.onstart = () => {
    state.isSpeaking = true;
    updateStatusVisuals();
    addLog('ai', text); // Keep visual log format clean but full
  };

  utterance.onend = () => {
    state.isSpeaking = false;
    updateStatusVisuals();
    
    // Resume listening after 400ms delay if it was active before
    if (state.isAIspeaking) {
      setTimeout(() => {
        state.isAIspeaking = false;
        if (state.isListening && state.recognition && !state.recognitionActive) {
          try {
            state.recognition.start();
          } catch (err) {
            console.error("Failed to restart speech recognition:", err);
          }
        }
      }, 400);
    }
  };

  utterance.onerror = (e) => {
    console.error('Speech synthesis error:', e);
    state.isSpeaking = false;
    updateStatusVisuals();
    
    // Resume listening on error too
    if (state.isAIspeaking) {
      setTimeout(() => {
        state.isAIspeaking = false;
        if (state.isListening && state.recognition && !state.recognitionActive) {
          try {
            state.recognition.start();
          } catch (err) {
            console.error(err);
          }
        }
      }, 400);
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
    updateStatusVisuals();
  };

  state.recognition.onend = () => {
    state.recognitionActive = false;
    
    // If the system stopped recognition because AI is speaking, do not restart now (it will restart in speakText onend)
    if (state.isAIspeaking) {
      return;
    }
    
    // Automatically restart if user hasn't explicitly stopped it
    if (state.isListening) {
      try {
        state.recognition.start();
      } catch (err) {
        console.error("Restart error", err);
      }
    } else {
      updateStatusVisuals();
    }
  };

  state.recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    if (event.error === 'not-allowed') {
      addLog('system', 'Microphone permission denied.');
      stopVoiceAssistant();
    }
    // Restart on simple no-speech or network errors if still active
    if (event.error === 'no-speech' && state.isListening && !state.isAIspeaking && !state.recognitionActive) {
      try {
        state.recognition.start();
      } catch (err) {}
    }
  };

  state.recognition.onresult = (event) => {
    if (state.isSpeaking || state.isAIspeaking || state.isAnalyzing || (window.speechSynthesis && window.speechSynthesis.speaking)) {
      console.log("Ignoring speech result because AI is speaking/analyzing/synthesizing");
      return;
    }
    const resultIndex = event.resultIndex;
    const transcript = event.results[resultIndex][0].transcript.trim();
    
    // Discard microphone self-transcription loopback if it matches what the AI just spoke
    if (state.lastAISpokenText) {
      const transLower = transcript.toLowerCase();
      const aiSpokenLower = state.lastAISpokenText.toLowerCase();
      
      if (aiSpokenLower.includes(transLower) || transLower.includes(aiSpokenLower) || calculateStringDistance(transLower, aiSpokenLower) < 4) {
        console.log("Discarded microphone loopback feedback:", transcript);
        return;
      }
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
  if (!state.recognitionActive) {
    try {
      state.recognition.start();
    } catch (err) {
      console.error(err);
    }
  }
  updateStatusVisuals();
}

function stopVoiceAssistant() {
  if (!state.recognition) return;
  state.isListening = false;
  try {
    state.recognition.stop();
  } catch (err) {}
  updateStatusVisuals();
}

// Voice Command Handler
function processVoiceCommand(cmd) {
  const lowerCmd = cmd.toLowerCase().trim();
  
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
  if (lowerCmd.includes("stop listening") || lowerCmd.includes("shut down") || lowerCmd.includes("go to sleep") || lowerCmd.includes("standby") || lowerCmd.includes("exit voice")) {
    stopVoiceAssistant();
    speakText("Entering standby, Sir.");
    return;
  } 
  if (lowerCmd.includes("install app") || lowerCmd.includes("install application")) {
    triggerInstallPrompt();
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
  if (lowerCmd.includes("calendar") || lowerCmd.includes("email") || lowerCmd.includes("outlook") || lowerCmd.includes("whatsapp") || lowerCmd.includes("facebook") || lowerCmd.includes("tiktok") || lowerCmd.includes("read apps") || lowerCmd.includes("connected apps")) {
    let app = "";
    if (lowerCmd.includes("calendar")) app = "calendar";
    else if (lowerCmd.includes("email") || lowerCmd.includes("outlook")) app = "outlook";
    else if (lowerCmd.includes("whatsapp")) app = "whatsapp";
    else if (lowerCmd.includes("facebook")) app = "facebook";
    else if (lowerCmd.includes("tiktok")) app = "tiktok";
    
    const appFeedback = readConnectedApps(app);
    speakText(appFeedback);
    return;
  }

  // Schedule commands (e.g. "schedule board meeting at 15:30" or "schedule alarms at 08:00")
  if (lowerCmd.includes("schedule ") || lowerCmd.includes("remind me ")) {
    const timeMatch = lowerCmd.match(/(\d{1,2})[\s:]?(\d{2})?\s*(pm|am)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      let minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const ampm = timeMatch[3];
      if (ampm) {
        if (ampm.toLowerCase() === 'pm' && hours < 12) hours += 12;
        if (ampm.toLowerCase() === 'am' && hours === 12) hours = 0;
      }
      const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      
      let title = cmd.replace(/schedule|remind me/i, '').replace(/at\s*\d+.*/i, '').replace(/for\s*\d+.*/i, '').trim();
      if (!title) title = "Voice Alert";
      addSchedule(title, timeStr);
      return;
    }
  }

  // Voice name wakeup responses
  const activeVoiceName = elements.voiceSelect.value ? getFriendlyVoiceName(elements.voiceSelect.value).toLowerCase() : 'jarvis';
  if (lowerCmd === 'jarvis' || lowerCmd === 'friday' || lowerCmd === 'anicade' || lowerCmd === activeVoiceName || lowerCmd === 'wake up') {
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
  const isAdRequest = lowerCmd.includes("generate ad") || lowerCmd.includes("create ad") || lowerCmd.includes("make ad") || lowerCmd.includes("ad banner") || lowerCmd.includes("marketing banner");
  
  if (isAdRequest) {
    let productName = "";
    if (lowerCmd.includes("for ")) {
      productName = cmd.substring(lowerCmd.indexOf("for ") + 4).trim();
    }
    analyzeActiveFeed("adgen", productName);
  } else {
    // Determine the type of request based on natural speech queries, mapping to correct modes for better context
    let actionType = "general";
    if (lowerCmd.includes("read screen") || lowerCmd.includes("what is on my screen") || lowerCmd.includes("analyze screen") || lowerCmd.includes("read the screen") || lowerCmd.includes("scan layout")) {
      actionType = "read";
    } else if (lowerCmd.includes("school help") || lowerCmd.includes("school query") || lowerCmd.includes("solve math") || lowerCmd.includes("homework")) {
      actionType = "school";
    } else if (lowerCmd.includes("auto reply") || lowerCmd.includes("suggest reply") || lowerCmd.includes("message reply")) {
      actionType = "reply";
    }
    
    analyzeActiveFeed(actionType, cmd);
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

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

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

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

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
  try {
    const languageInstructions = languagePrompts[state.selectedLanguage] || languagePrompts['en-GB'];
    const promptText = `Answer the user's question: "${customText}". ${languageInstructions}`;
    const responseText = await callPollinationsAI(promptText);
    state.isAnalyzing = false;
    updateStatusVisuals();
    speakText(responseText);
  } catch (err) {
    console.error(err);
    state.isAnalyzing = false;
    updateStatusVisuals();
    speakText("I apologize, Sir. I was unable to connect to my cognitive processor.");
  }
}

async function analyzeActiveFeed(actionType, customText = "") {
  // If no source is active and it's not a general text query, warn the user
  if (state.activeInputType === 'none') {
    const lowerText = customText.toLowerCase();
    const needsVision = lowerText.includes("read") || lowerText.includes("screen") || lowerText.includes("see") || lowerText.includes("look") || lowerText.includes("solve") || lowerText.includes("homework") || lowerText.includes("reply") || lowerText.includes("ad") || actionType !== 'general';
    
    if (needsVision) {
      speakText("Please share your screen, start the camera, or upload an image so I can assist you with that, Sir.");
      return;
    }
  }

  const hasVisual = state.activeInputType !== 'none';
  state.isAnalyzing = true;
  updateStatusVisuals();
  
  if (hasVisual) {
    addLog('system', 'Analyzing screen content...');
  } else {
    addLog('system', 'Processing request...');
  }

  // Capture frame if we have an active input
  const imageDataUrl = hasVisual ? captureFrame() : null;
  
  // Base instructions to force a human-like, witty, premium JARVIS personality in preferred language
  const languageInstructions = languagePrompts[state.selectedLanguage] || languagePrompts['en-GB'];
  const systemPref = `You are ANICADE VISION, a highly advanced personal butler and system assistant created by ANICADE Tech. You are modeled after the JARVIS AI: extremely loyal, polished, witty, highly competent, British-bred, and human-like. Address the user as Sir. Speak naturally and avoid robotic boilerplate phrases (like "Good day Sir, I am ANICADE VISION" or "I am an AI"). Do NOT mention your technical stack, Pollinations.ai, Tesseract, Gemini, or any underlying APIs. Keep your operations immersive and seamless. ${languageInstructions} `;

  // Setup prompt based on action
  let promptText = "";
  if (actionType === 'school') {
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
  if (state.geminiApiKey) {
    try {
      if (imageDataUrl) {
        speakText("Consulting the cloud core, Sir.");
        const responseText = await callGeminiAPI(imageDataUrl, promptText);
        state.isAnalyzing = false;
        updateStatusVisuals();
        
        if (actionType === 'adgen') {
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
      addLog('system', 'Cloud connection busy. Switching to local vision fallback.');
      if (imageDataUrl) {
        runLocalOCR(imageDataUrl, actionType, customText);
      } else {
        runLocalPollinations(customText);
      }
    }
  } else {
    if (imageDataUrl) {
      runLocalOCR(imageDataUrl, actionType, customText);
    } else {
      runLocalPollinations(customText);
    }
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
  } finally {
    state.ocrWorkerLoading = false;
  }
  
  return state.ocrWorker;
}

// Client-Side OCR Engine (Tesseract.js) + Pollinations AI Text Pipeline with Crash Recovery
async function runLocalOCR(imageDataUrl, actionType, customText) {
  let ocrText = "";
  try {
    addLog('system', 'Visual text scan in progress...');
    speakText("Scanning the layout now, Sir. Initiating local visual analysis.");
    
    let worker = await getOCRWorker();
    if (!worker) {
      throw new Error("Local OCR worker initialization failed.");
    }

    try {
      const ret = await worker.recognize(imageDataUrl);
      ocrText = ret.data.text.trim();
    } catch (ocrRunErr) {
      console.warn("Tesseract worker failed during scan. Attempting crash recovery...", ocrRunErr);
      // Terminate and reset crashed worker
      if (state.ocrWorker) {
        try { await state.ocrWorker.terminate(); } catch (e) {}
        state.ocrWorker = null;
      }
      // Re-initialize worker and run recognize again
      addLog('system', 'Resetting visual core...');
      worker = await getOCRWorker();
      const ret = await worker.recognize(imageDataUrl);
      ocrText = ret.data.text.trim();
    }

    addLog('system', 'Visual scan complete.');

    if (!ocrText) {
      state.isAnalyzing = false;
      updateStatusVisuals();
      speakText("I have completed the scan, Sir, but I was unable to detect any legible text on the shared interface.");
      return;
    }

    // Check if the user is sharing their own screen ( existential loop prevention )
    const languageInstructions = languagePrompts[state.selectedLanguage] || languagePrompts['en-GB'];
    const systemPref = `You are ANICADE VISION, a highly advanced personal butler and system assistant created by ANICADE Tech. You are modeled after the JARVIS AI: extremely loyal, polished, witty, highly competent, British-bred, and human-like. Address the user as Sir. Speak naturally and avoid robotic boilerplate phrases (like "Good day Sir, I am ANICADE VISION" or "I am an AI"). Do NOT mention your technical stack, Pollinations.ai, Tesseract, Gemini, or any underlying APIs. Keep your operations immersive and seamless. ${languageInstructions} `;

    let keylessPrompt = "";
    if (isDashboardLayout(ocrText)) {
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

    // Call Pollinations AI Text model (fully free & keyless)
    const responseText = await callPollinationsAI(keylessPrompt);
    state.isAnalyzing = false;
    updateStatusVisuals();

    if (actionType === 'adgen' && !isDashboardLayout(ocrText)) {
      generateImageAd(responseText);
    } else {
      speakText(responseText);
    }

  } catch (err) {
    console.error("Local OCR or AI failed:", err);
    state.isAnalyzing = false;
    updateStatusVisuals();
    speakText("I apologize, Sir. My local visual core encountered a processing error.");
    addLog('system', 'Local vision analysis offline.');
  }
}

// Keyless Free Text LLM Endpoint (Pollinations AI OpenAI compatible POST)
async function callPollinationsAI(prompt) {
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
    temperature: 0.6
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

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
function generateImageAd(adPrompt) {
  addLog('system', 'Generating creative advertisement...');
  
  // Construct pollinations image url
  const cleanPrompt = encodeURIComponent(adPrompt);
  const marketingPrompt = `${cleanPrompt}, professional marketing ad campaign photography, premium luxury layout, clean background, 8k resolution`;
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(marketingPrompt)}?width=500&height=500&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;
  
  // Show image panel
  elements.adOutputContainer.style.display = 'block';
  elements.adImage.src = imageUrl;
  
  elements.adImage.onload = () => {
    addLog('ai', 'Advertisement banner generation complete.');
    speakText("I have completed the advertisement banner design, Sir. It is presented on your control console.");
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
  
  const text = `Good ${timeOfDay}, Sir. Systems are online and fully operational. How may I assist you today?`;
  speakText(text);
  
  // Auto wake up the voice assistant to listen hands-free
  setTimeout(() => {
    startVoiceAssistant();
  }, 1000);
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
    
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioCtx = new AudioContext();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    
    audioSource = audioCtx.createMediaStreamSource(micStream);
    audioSource.connect(analyser);
    
    const bufferLength = analyser.frequencyBinCount;
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
      analyser.getByteFrequencyData(dataArray);
      
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
  
  if (micStream) {
    micStream.getTracks().forEach(track => track.stop());
    micStream = null;
  }
  if (audioCtx) {
    audioCtx.close();
    audioCtx = null;
  }
  addLog('system', 'Clap detection deactivated.');
}

// Immersive Full Screen Orb Mode Toggles
function enterFullScreenOrb() {
  if (elements.fullScreenOrbOverlay) {
    elements.fullScreenOrbOverlay.style.display = 'flex';
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
  if (state.geminiApiKey) {
    elements.apiKeyInput.value = "••••••••••••••••••••••••";
    elements.btnSaveKey.textContent = "Clear";
    addLog('system', 'Cloud intelligence core link established.');
  }
}

function saveAPIKey() {
  if (state.geminiApiKey) {
    // Clear key
    state.geminiApiKey = '';
    localStorage.removeItem('anicade_gemini_key');
    elements.apiKeyInput.value = '';
    elements.btnSaveKey.textContent = 'Save';
    speakText("API key cleared. System reverted to Offline Sandbox.");
    addLog('system', 'API Key removed.');
  } else {
    // Save key
    const key = elements.apiKeyInput.value.trim();
    if (!key) {
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
  const msgEl = document.createElement('div');
  msgEl.className = 'caption-message';
  
  if (sender === 'user') {
    msgEl.innerHTML = `<span class="caption-user">[You]:</span> ${text}`;
  } else if (sender === 'ai') {
    msgEl.innerHTML = `<span class="caption-ai">[AI]:</span> ${text}`;
  } else {
    msgEl.innerHTML = `<span class="caption-system">[System]:</span> ${text}`;
  }

  elements.captionArea.appendChild(msgEl);
  elements.captionArea.scrollTop = elements.captionArea.scrollHeight;
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
        const ringScale = 1.0 + micVolume * 0.85;
        ring.style.transform = `scale(${ringScale})`;
        ring.style.borderColor = `rgba(255, 23, 68, ${0.45 + micVolume * 0.45})`;
        ring.style.boxShadow = `0 0 ${15 + micVolume * 30}px rgba(255, 23, 68, 0.65)`;
      } else {
        ring.style.transform = '';
        ring.style.borderColor = '';
        ring.style.boxShadow = '';
      }
    });

    orbs.forEach(orb => {
      if (state.isSpeaking) {
        const orbScale = 0.94 + aiVolume * 0.28;
        orb.style.transform = `scale(${orbScale})`;
        orb.style.boxShadow = `0 0 ${25 + aiVolume * 45}px rgba(198, 168, 92, ${0.7 + aiVolume * 0.3}), inset 0 0 15px rgba(198, 168, 92, 0.4)`;
      } else {
        orb.style.transform = '';
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
      binId: localStorage.getItem('anicade_jsonbin_id') || '',
      apiKey: localStorage.getItem('anicade_jsonbin_key') || ''
    };
  },
  
  saveBinDetails(binId, apiKey) {
    localStorage.setItem('anicade_jsonbin_id', binId);
    localStorage.setItem('anicade_jsonbin_key', apiKey);
    state.jsonbinId = binId;
    state.jsonbinKey = apiKey;
  },

  async syncSave() {
    const dataToSave = {
      schedules: state.schedules,
      connectedApps: state.connectedApps,
      selectedLanguage: state.selectedLanguage,
      selectedVoiceName: state.selectedVoiceName
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
          'X-Master-Key': details.apiKey
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
            'X-Master-Key': details.apiKey
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
      
      updateConnectedAppsUI();
      updateSchedulesUI();
    }
  }
};

function initStorageAndSchedules() {
  if (state.jsonbinId) {
    elements.jsonbinIdInput.value = "••••••••••••••••••••••••";
  }
  if (state.jsonbinKey) {
    elements.jsonbinKeyInput.value = "••••••••••••••••••••••••";
  }
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
        speakText(`Excuse me, Sir. It is now ${item.time}. You scheduled: ${item.title}.`);
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

  if (target.includes("calendar")) {
    readApp("calendar", "Calendar");
  } else if (target.includes("email") || target.includes("outlook") || target.includes("mail")) {
    readApp("outlook", "Outlook Mail");
  } else if (target.includes("whatsapp")) {
    readApp("whatsapp", "WhatsApp");
  } else if (target.includes("facebook")) {
    readApp("facebook", "Facebook");
  } else if (target.includes("tiktok")) {
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
  speakText("Listening to the environment, Sir. Initializing animal acoustics scan.");
  addLog('system', 'Scanning animal acoustics...');
  
  elements.voiceStatusText.textContent = "Acoustics Scan...";
  if (elements.fsVoiceStatus) elements.fsVoiceStatus.textContent = "ACOUSTICS SCAN...";
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
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

  let chosenAnimal = animalType;
  if (chosenAnimal === "detect") {
    chosenAnimal = signalDesc.includes("High") ? "Cat" : "Dog";
  }

  const prompt = `Translate this ${chosenAnimal} sound described as "${signalDesc}". Act as ANICADE VISION (created by ANICADE Tech, British, witty, polite, address the user as Sir). Provide a humorous and clever translation of what this animal is trying to say. Keep it under 50 words.`;

  try {
    let translation = "";
    if (state.geminiApiKey) {
      translation = await callGeminiTextAPI(prompt);
    } else {
      translation = await callPollinationsAI(prompt);
    }
    
    state.isAnalyzing = false;
    updateStatusVisuals();
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

  // Orb Trigger
  elements.speechOrb.addEventListener('click', toggleVoiceAssistant);
  
  // Immersive Mode Toggles
  elements.btnToggleFullScreen.addEventListener('click', enterFullScreenOrb);
  elements.btnExitFullScreen.addEventListener('click', exitFullScreenOrb);
  elements.fsOrb.addEventListener('click', toggleVoiceAssistant);
  
  // Clap Wake Toggle
  elements.btnToggleClap.addEventListener('click', toggleClapWake);

  // Gemini API Key Override
  elements.btnSaveKey.addEventListener('click', saveAPIKey);

  // Storage Sync Configuration Click
  elements.btnSaveSync.addEventListener('click', () => {
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
    speakText("Vocal engine language updated, Sir.");
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
}
