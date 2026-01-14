export default {
  translation: {
    // Common
    common: {
      appName: 'Ollama Translator',
      loading: '로딩 중...',
      error: '오류',
      success: '성공',
      cancel: '취소',
      save: '저장',
      close: '닫기',
      refresh: '새로고침',
      saving: '저장 중...',
      rowsPerPage: '페이지당 행',
      copy: '복사',
      clear: '지우기',
    },

    // Dialog
    dialog: {
      notice: '알림',
      confirm: '확인',
      confirmButton: '확인',
    },

    // Settings
    settings: {
      title: '설정',
      theme: {
        title: '테마',
        light: '라이트',
        dark: '다크',
        system: '시스템',
      },
      language: {
        title: '언어',
        ko: '한국어',
        en: 'English',
      },
    },

    // History
    history: {
      title: '번역 히스토리',
      empty: '번역 히스토리가 없습니다.',
      delete: '삭제',
      clearAll: '전체 삭제',
      clearConfirm: '모든 번역 히스토리를 삭제하시겠습니까?',
    },

    // Translate
    translate: {
      subtitle: '로컬 LLM으로 프라이버시를 지키는 번역',
      modelSelect: '모델 선택',
      modelLoading: '모델 불러오는 중...',
      noModels: '사용 가능한 모델이 없습니다',
      sourceLang: '한국어',
      targetLang: 'English',
      placeholder: '번역할 텍스트를 입력하세요...',
      resultPlaceholder: '번역문이 여기에 표시됩니다',
      translating: '번역 중...',
      translateButton: '번역하기',
      stopButton: '번역 중단',
      // 카운터
      characters: '문자',
      words: '단어',
      lines: '줄',
      tokens: '토큰',
      promptTokens: '프롬프트',
      completionTokens: '생성',
      // 스낵바 메시지
      copySuccess: '복사되었습니다.',
      copyError: '복사에 실패했습니다.',
      noModelWarning: '모델을 선택해주세요.',
      noTextWarning: '번역할 텍스트를 입력해주세요.',
      noModelsWarning: '사용 가능한 모델이 없습니다. Ollama에 모델을 설치해주세요.',
      loadModelsError: '모델 목록을 불러오는데 실패했습니다. Ollama 서버가 실행 중인지 확인해주세요.',
      translateError: '번역 중 오류가 발생했습니다.',
      translateStopped: '번역이 중단되었습니다.',
    },
  },
};
