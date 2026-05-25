/**
 * ANICADE VISION - Core Application Logic
 * Powered by ANICADE TECH
 */

// Global App State
// Global App State
const state = {
  isListening: false,
  isSpeaking: false,
  isAnalyzing: false,
  isAIspeaking: false,
  recognition: null,
  recognitionActive: false,
  speechSynthesis: window.speechSynthesis,
  selectedVoice: null,
  mediaStream: null,
  activeInputType: 'none', // 'screen', 'camera', 'image', 'none'
  geminiApiKey: localStorage.getItem('anicade_gemini_key') || '',
  deferredPrompt: null,
  typingMode: false,
  clapWakeActive: false
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

  // API Config
  apiKeyInput: document.getElementById('apiKeyInput'),
  btnSaveKey: document.getElementById('btnSaveKey'),

  // Quick Tools
  toolSchool: document.getElementById('toolSchool'),
  toolReply: document.getElementById('toolReply'),
  toolAdGen: document.getElementById('toolAdGen'),
  voiceTypingBox: document.getElementById('voiceTypingBox'),
  notebookStatus: document.getElementById('notebookStatus'),
  btnCopyNote: document.getElementById('btnCopyNote'),
  btnClearNote: document.getElementById('btnClearNote'),

  // Ad Output Layout
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
  setupEventListeners();
  addLog('system', 'Systems online. Jarvis Core fully operational, Sir.');
  
  // Dynamic Welcome Greeting based on time of day (1.2s delay to ensure voices are loaded)
  setTimeout(() => {
    welcomeGreeting();
  }, 1200);
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
      option.textContent = `${voice.name} (${voice.lang})`;
      
      // Select Google UK English or Daniel or Hazel by default if available
      if (!state.selectedVoice && (voice.name.includes('Google UK English Male') || voice.name.includes('Daniel') || voice.name.includes('Google UK English Female') || voice.name.includes('Hazel'))) {
        option.selected = true;
        state.selectedVoice = voice;
      }
      elements.voiceSelect.appendChild(option);
    });

    if (!state.selectedVoice && combinedVoices.length > 0) {
      state.selectedVoice = combinedVoices[0];
    }
  }

  loadVoices();
  if (state.speechSynthesis.onvoiceschanged !== undefined) {
    state.speechSynthesis.onvoiceschanged = loadVoices;
  }

  // Voice Select Event
  elements.voiceSelect.addEventListener('change', () => {
    const voices = state.speechSynthesis.getVoices();
    state.selectedVoice = voices.find(v => v.name === elements.voiceSelect.value);
    speakText("Voice profile updated, Sir.");
  });
}

// Speak helper
function speakText(text) {
  if (!state.speechSynthesis) return;

  // Cancel current speech
  state.speechSynthesis.cancel();

  // If SpeechRecognition is running, temporarily stop it to avoid self-transcription feedback
  if (state.recognition && state.recognitionActive) {
    state.isAIspeaking = true;
    state.recognition.stop();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  if (state.selectedVoice) {
    utterance.voice = state.selectedVoice;
  }
  
  // Set natural voice parameters (static, sliders removed)
  utterance.rate = 0.95; 
  utterance.pitch = 1.0;

  utterance.onstart = () => {
    state.isSpeaking = true;
    updateStatusVisuals();
    addLog('ai', text);
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

  state.speechSynthesis.speak(utterance);
}

// ==========================================
// SPEECH RECOGNITION ENGINE (Voice Commands)
// ==========================================
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
  state.recognition.lang = 'en-US';

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
  };

  state.recognition.onresult = (event) => {
    const resultIndex = event.resultIndex;
    const transcript = event.results[resultIndex][0].transcript.trim().toLowerCase();
    
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

function startVoiceAssistant() {
  if (!state.recognition) return;
  state.isListening = true;
  try {
    state.recognition.start();
  } catch (err) {
    console.error(err);
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
  // If in Typing/Dictation mode, everything said is typed in the Notepad unless "stop typing" is called.
  if (state.typingMode) {
    if (cmd.includes("stop typing") || cmd.includes("stop dictation") || cmd.includes("exit notebook")) {
      state.typingMode = false;
      elements.notebookStatus.textContent = "Ready";
      elements.notebookStatus.style.color = "var(--accent)";
      speakText("Notebook dictation saved, Sir.");
      return;
    }
    // Append to notepad
    elements.voiceTypingBox.value += (elements.voiceTypingBox.value ? " " : "") + cmd;
    addLog('system', `Dictated: "${cmd}"`);
    return;
  }

  // Standard Voice Command Routing
  if (cmd.includes("read screen") || cmd.includes("read") || cmd.includes("analyze screen") || cmd.includes("analyze")) {
    analyzeActiveFeed("read");
  } 
  else if (cmd.includes("school help") || cmd.includes("school query") || cmd.includes("school stuff") || cmd.includes("solve math")) {
    analyzeActiveFeed("school");
  } 
  else if (cmd.includes("auto reply") || cmd.includes("suggest reply") || cmd.includes("message reply")) {
    analyzeActiveFeed("reply");
  } 
  else if (cmd.includes("generate ad") || cmd.includes("create ad") || cmd.includes("make ad")) {
    let productName = "";
    if (cmd.includes("for ")) {
      productName = cmd.split("for ").slice(1).join("for ").trim();
    }
    analyzeActiveFeed("adgen", productName);
  }
  else if (cmd.includes("voice typing") || cmd.includes("start typing") || cmd.includes("open notebook")) {
    state.typingMode = true;
    elements.notebookStatus.textContent = "Dictating...";
    elements.notebookStatus.style.color = "#FF1744";
    speakText("Notepad voice typing mode active, Sir. Go ahead and speak. Say stop typing when finished.");
  }
  else if (cmd.includes("clear notebook") || cmd.includes("clear note")) {
    elements.voiceTypingBox.value = "";
    speakText("Notebook cleared, Sir.");
  }
  else if (cmd.includes("copy notebook") || cmd.includes("copy note")) {
    copyNotebookText();
  }
  else if (cmd.includes("stop listening") || cmd.includes("shut down") || cmd.includes("go to sleep") || cmd.includes("standby")) {
    stopVoiceAssistant();
    speakText("Entering standby, Sir.");
  } 
  else if (cmd.includes("install app") || cmd.includes("install application")) {
    triggerInstallPrompt();
  }
  else {
    // If it's a general question, query the active visual core
    analyzeActiveFeed("general", cmd);
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
    addLog('system', 'Live PC Screen Capture initiated.');
    speakText("Desktop screen successfully linked.");
    
    // Listen for stop sharing button inside native browser controls
    state.mediaStream.getVideoTracks()[0].onended = () => {
      stopActiveStream();
    };
  } catch (err) {
    console.error("Screen share error:", err);
    addLog('system', `Screen share failed: ${err.message}`);
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
    addLog('system', 'Camera video stream initiated.');
    speakText("Camera active. Point your camera at the screen or notes.");
  } catch (err) {
    console.error("Camera scan error:", err);
    addLog('system', `Camera capture failed: ${err.message}`);
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
    addLog('system', `Uploaded screenshot: ${file.name}`);
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
async function analyzeActiveFeed(actionType, customText = "") {
  if (state.activeInputType === 'none') {
    speakText("Please activate a screen source or upload an image first, Sir.");
    return;
  }

  state.isAnalyzing = true;
  updateStatusVisuals();
  addLog('system', 'Capturing frame and initiating AI inspection...');

  // Capture frame
  const imageDataUrl = captureFrame();
  if (!imageDataUrl) {
    state.isAnalyzing = false;
    updateStatusVisuals();
    speakText("Failed to extract frame coordinates, Sir.");
    return;
  }

  // Setup prompt based on action
  let promptText = "";
  if (actionType === 'school') {
    promptText = "The user is asking for school homework help. Explain the equations, text, math, or slides on screen. Provide step-by-step solutions or simple study summaries. Act as JARVIS (British, witty, polite, address the user as Sir).";
  } else if (actionType === 'reply') {
    promptText = "The user wants an auto-reply. Read any chat messages visible on the screen. Draft an appropriate, friendly, professional response. If it is on whatsapp, suggest a reply they can copy. Act as JARVIS (British, witty, polite, address the user as Sir).";
  } else if (actionType === 'read') {
    promptText = "Perform full screen OCR and explain what is visible. Read key text contents aloud, describe the main elements, diagrams, or user interface sections. Keep it concise. Act as JARVIS (British, witty, polite, address the user as Sir).";
  } else if (actionType === 'adgen') {
    promptText = "Generate a single descriptive prompt to create a marketing visual banner for the product visible on screen. Act as JARVIS (British, witty, polite, address the user as Sir). Output ONLY the prompt itself.";
  } else {
    promptText = `Answer the user's specific request: "${customText}" based on the screenshot. Act as JARVIS (British, witty, polite, address the user as Sir).`;
  }

  // If Gemini API Key is available, use Multimodal Cloud API
  if (state.geminiApiKey) {
    try {
      speakText("Consulting the cloud core, Sir.");
      const responseText = await callGeminiAPI(imageDataUrl, promptText);
      state.isAnalyzing = false;
      updateStatusVisuals();
      if (actionType === 'adgen') {
        generateImageAd(responseText);
      } else {
        speakText(responseText);
      }
    } catch (err) {
      console.error(err);
      addLog('system', `Cloud Core Error: ${err.message}. Reverting to local OCR...`);
      runLocalOCR(imageDataUrl, actionType, customText);
    }
  } else {
    // Revert to Client-side Local OCR
    runLocalOCR(imageDataUrl, actionType, customText);
  }
}

// Client-Side OCR Engine (Tesseract.js) + Pollinations AI Text Pipeline
async function runLocalOCR(imageDataUrl, actionType, customText) {
  try {
    addLog('system', 'Initializing local OCR worker...');
    speakText("Scanning the layout now, Sir. Initiating local visual analysis.");
    
    // Create Tesseract Worker
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

    const ret = await worker.recognize(imageDataUrl);
    const ocrText = ret.data.text.trim();
    await worker.terminate();

    addLog('system', `Local OCR complete. Extracted ${ocrText.length} characters.`);

    if (!ocrText) {
      state.isAnalyzing = false;
      updateStatusVisuals();
      speakText("I have completed the scan, Sir, but I was unable to detect any legible text on the shared interface.");
      return;
    }

    addLog('system', `Extracted Text: "${ocrText.slice(0, 150)}..."`);

    // Prepare Prompt for keyless Pollinations AI Text model
    let keylessPrompt = "";
    if (actionType === 'school') {
      keylessPrompt = `Sir is asking for homework help. Here is the text extracted from their screen: "${ocrText}". Explain the topics, equations, or questions step-by-step. Keep it educational, wittily polite, and address them as Sir.`;
    } else if (actionType === 'reply') {
      keylessPrompt = `Sir wants an auto-reply suggestion. Here is the message text extracted from their screen: "${ocrText}". Suggest a professional yet friendly reply they can copy and send. Address them as Sir.`;
    } else if (actionType === 'read') {
      keylessPrompt = `Sir wants a summary of their screen contents. Here is the text extracted from their screen: "${ocrText}". Provide an overview of what is on screen and summarize the text content. Address them as Sir.`;
    } else if (actionType === 'adgen') {
      keylessPrompt = `Sir wants to generate an advertising banner for the items on their screen. Here is the text extracted from their screen: "${ocrText}". Create a single, short descriptive prompt (max 20 words) for generating an image banner. Output ONLY the prompt itself, nothing else. e.g. "a high-end luxury watch on a dark background with gold highlights".`;
    } else {
      keylessPrompt = `Answer Sir's specific request: "${customText}" based on this extracted screen text: "${ocrText}". Address them as Sir.`;
    }

    // Call Pollinations AI Text model (fully free & keyless)
    const responseText = await callPollinationsAI(keylessPrompt);
    state.isAnalyzing = false;
    updateStatusVisuals();

    if (actionType === 'adgen') {
      generateImageAd(responseText);
    } else {
      speakText(responseText);
    }

  } catch (err) {
    console.error("Local OCR or AI failed:", err);
    state.isAnalyzing = false;
    updateStatusVisuals();
    speakText("I apologize, Sir. My local visual core encountered a processing error.");
    addLog('system', `Local analysis failed: ${err.message}`);
  }
}

// Keyless Free Text LLM Endpoint (Pollinations AI OpenAI compatible POST)
async function callPollinationsAI(prompt) {
  const url = 'https://text.pollinations.ai/openai';
  const payload = {
    model: 'openai',
    messages: [
      {
        role: 'system',
        content: 'You are JARVIS, Tony Stark\'s witty, polite, British AI assistant. You speak with premium intelligence, address the user as Sir, use British spelling (like colour, programme, whilst, indeed), and offer clever, insightful, and slightly sarcastic assistance.'
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

  // Handle standard JSON or fallback to text
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
  addLog('system', `Drafting marketing banner for prompt: "${adPrompt}"`);
  
  // Construct pollinations image url
  const cleanPrompt = encodeURIComponent(adPrompt);
  const marketingPrompt = `${cleanPrompt}, professional marketing ad campaign photography, premium luxury layout, clean background, 8k resolution`;
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(marketingPrompt)}?width=500&height=500&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;
  
  // Show image panel
  elements.adOutputContainer.style.display = 'block';
  elements.adImage.src = imageUrl;
  
  elements.adImage.onload = () => {
    addLog('ai', `I have successfully constructed the advertising banner campaign, Sir. You can review the output in the console.`);
    speakText("I have completed the advertisement banner design, Sir. It is presented on your control console.");
  };
  
  elements.adImage.onerror = () => {
    speakText("I apologize, Sir. The image generation matrix failed to render the banner.");
    addLog('system', 'Ad image generation failed.');
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
          addLog('system', 'Clap detected! Activating Jarvis...');
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
    addLog('system', 'Gemini AI API Key verified and loaded.');
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
    addLog('system', 'Gemini Key removed.');
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
    addLog('system', 'Gemini Key successfully saved in local storage.');
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

  // Main Dashboard Elements
  if (isAnal) {
    elements.statusDot.className = "status-dot speaking";
    elements.statusText.textContent = "AI Analyzing Screen...";
    elements.speechOrbContainer.className = "speech-orb-container speaking";
    elements.voiceStatusText.textContent = "Analyzing Screen...";
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
      elements.fsVoiceStatus.textContent = "ANALYZING SCREEN";
      elements.fsVoiceSubstatus.textContent = "Jarvis Visual Core is processing local text, Sir...";
    } else if (isSpeak) {
      elements.fullScreenOrbOverlay.className = "fullscreen-orb-overlay speaking";
      elements.fsVoiceStatus.textContent = "SPEAKING";
      elements.fsVoiceSubstatus.textContent = "Transmitting response to Sir...";
    } else if (isList) {
      elements.fullScreenOrbOverlay.className = "fullscreen-orb-overlay listening";
      elements.fsVoiceStatus.textContent = "JARVIS LISTENING";
      elements.fsVoiceSubstatus.textContent = "Say 'read screen', 'school help', or 'auto reply', Sir.";
    } else {
      elements.fullScreenOrbOverlay.className = "fullscreen-orb-overlay";
      elements.fsVoiceStatus.textContent = "STANDBY MODE";
      elements.fsVoiceSubstatus.textContent = "Tap the Orb or say a command to wake Jarvis.";
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
      addLog('system', 'Notepad contents copied to device clipboard.');
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

  // Gemini API Key
  elements.btnSaveKey.addEventListener('click', saveAPIKey);

  // Tools triggers
  elements.toolSchool.addEventListener('click', () => analyzeActiveFeed('school'));
  elements.toolReply.addEventListener('click', () => analyzeActiveFeed('reply'));
  elements.toolAdGen.addEventListener('click', () => analyzeActiveFeed('adgen'));

  // Ad Download Trigger
  elements.btnDownloadAd.addEventListener('click', downloadAdBanner);

  // Notepad Controls
  elements.btnCopyNote.addEventListener('click', copyNotebookText);
  elements.btnClearNote.addEventListener('click', () => {
    elements.voiceTypingBox.value = "";
    speakText("Notepad cleared, Sir.");
  });

  // Installation Promote
  elements.btnInstall.addEventListener('click', triggerInstallPrompt);
}
