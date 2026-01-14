export default {
  translation: {
    // Common
    common: {
      appName: 'Ollama Translator',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      close: 'Close',
      refresh: 'Refresh',
      saving: 'Saving...',
      rowsPerPage: 'Rows per page',
      copy: 'Copy',
      clear: 'Clear',
    },

    // Dialog
    dialog: {
      notice: 'Notice',
      confirm: 'Confirm',
      confirmButton: 'OK',
    },

    // Settings
    settings: {
      title: 'Settings',
      theme: {
        title: 'Theme',
        light: 'Light',
        dark: 'Dark',
        system: 'System',
      },
      language: {
        title: 'Language',
        ko: '한국어',
        en: 'English',
      },
    },

    // History
    history: {
      title: 'Translation History',
      empty: 'No translation history.',
      delete: 'Delete',
      clearAll: 'Clear All',
      clearConfirm: 'Are you sure you want to clear all translation history?',
    },

    // Translate
    translate: {
      subtitle: 'Privacy-preserving translation with local LLM',
      modelSelect: 'Select Model',
      modelLoading: 'Loading models...',
      noModels: 'No models available',
      sourceLang: '한국어',
      targetLang: 'English',
      placeholder: 'Enter text to translate...',
      resultPlaceholder: 'Translation will appear here',
      translating: 'Translating...',
      translateButton: 'Translate',
      stopButton: 'Stop',
      // Counters
      characters: 'chars',
      words: 'words',
      lines: 'lines',
      tokens: 'tokens',
      promptTokens: 'prompt',
      completionTokens: 'completion',
      // Snackbar messages
      copySuccess: 'Copied to clipboard.',
      copyError: 'Failed to copy.',
      noModelWarning: 'Please select a model.',
      noTextWarning: 'Please enter text to translate.',
      noModelsWarning: 'No models available. Please install a model in Ollama.',
      loadModelsError: 'Failed to load models. Please check if Ollama server is running.',
      translateError: 'An error occurred during translation.',
      translateStopped: 'Translation stopped.',
    },
  },
};
