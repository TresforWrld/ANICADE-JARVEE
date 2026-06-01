// Copy this file to config.js for local development.
// Keep config.js private. Do not commit real API keys to GitHub.
window.ASSISTANT_CONFIG = {
  // Voice and personality
  WAKE_WORD: 'assistant',
  USER_NAME: '',
  language: 'en-GB',
  locale: 'en-ZM',
  timeZone: 'Africa/Lusaka',
  selfSpeechCooldownMs: 2200,
  ttsRate: 1.05,
  ttsPitch: 0.92,
  ttsVolume: 1,
  showCaptions: false,
  // Optional direct audio URL. If blank, the assistant tries the bundled startup audio asset.
  STARTUP_SONG_URL: '',
  newsRefreshMs: 120000,

  // AI models
  geminiModel: 'gemini-2.0-flash',
  GEMINI_API_KEY: '',
  GROQ_API_KEY: '',
  COHERE_API_KEY: '',
  POLLINATIONS_ENABLED: true,

  // Google services
  GOOGLE_CLIENT_ID: '',
  FACEBOOK_APP_ID: '',

  // Search
  BRAVE_SEARCH_API_KEY: '',
  SERPER_API_KEY: '',
  DUCKDUCKGO_ENABLED: true,

  // Weather and news
  OPENWEATHER_API_KEY: '',
  OPENWEATHER_API_KEY_2: '',
  WEATHERAPI_KEY: '',
  GNEWS_API_KEY: '',
  NEWSAPI_KEY: '',

  // Cloud sync
  JSONBIN_BIN_ID: '',
  JSONBIN_MASTER_KEY: '',
  JSONBIN_ACCESS_KEY: '',

  // Image and OCR
  STABILITY_AI_KEY: '',
  OCRSPACE_API_KEY: '',

  // Premium speech
  ELEVENLABS_API_KEY: '',
  ELEVENLABS_VOICE_ID: '',
  ELEVENLABS_MODEL: 'eleven_turbo_v2_5',
  AZURE_SPEECH_KEY: '',
  AZURE_SPEECH_REGION: '',

  // ATLAS home/base
  HOME_LOCATION: {
    label: 'HFH5+J8W, Kabwe, Zambia',
    city: 'Kabwe',
    country: 'Zambia',
    lat: -14.4430,
    lon: 28.4457
  }
};
