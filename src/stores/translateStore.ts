/**
 * 번역 기능을 위한 Zustand 스토어
 */

import { create } from 'zustand';
import i18n from '../i18n';
import type { OllamaModel } from '../types/ollama';
import { fetchModels, streamChat, generate } from '../api/ollamaApi';
import { buildTranslationMessages, DEFAULT_PAIR_ID } from '../utils/promptBuilder';
import { snackbar } from './snackbarStore';
import { useHistoryStore } from './historyStore';

/**
 * 번역 내용 기반 제목 생성 (백그라운드)
 */
async function generateTitleInBackground(historyId: string, sourceText: string, modelName: string) {
  try {
    const prompt = `Create a short title for the text below. Output ONLY the title, nothing else.
***
${sourceText.slice(0, 1000)}
***
Title:`;

    const response = await generate({
      model: modelName,
      prompt,
    });

    // 응답에서 제목 추출 (줄바꿈, 따옴표 제거 및 길이 제한)
    const title = response.response
      .trim()
      .replace(/^["']|["']$/g, '') // 따옴표 제거
      .split('\n')[0] // 첫 줄만
      .slice(0, 100);

    if (title) {
      useHistoryStore.getState().updateHistoryTitle(historyId, title);
    }
  } catch {
    // 제목 생성 실패는 조용히 무시 (핵심 기능이 아님)
  }
}

interface TranslateState {
  // 모델 관련
  models: OllamaModel[];
  selectedModel: string;
  isLoadingModels: boolean;

  // 언어쌍 관련
  selectedPairId: string;

  // 번역 관련
  sourceText: string;
  translatedText: string;
  isTranslating: boolean;

  // 토큰 카운트 정보
  tokenCounts: {
    promptTokens: number;
    completionTokens: number;
  } | null;

  // 스트리밍 중단을 위한 AbortController
  abortController: AbortController | null;

  // 액션
  loadModels: () => Promise<void>;
  setSelectedModel: (model: string) => void;
  setSelectedPairId: (pairId: string) => void;
  setSourceText: (text: string) => void;
  setTranslatedText: (text: string) => void;
  setTokenCounts: (counts: { promptTokens: number; completionTokens: number } | null) => void;
  translate: () => Promise<void>;
  stopTranslation: () => void;
  clearTranslation: () => void;
}

export const useTranslateStore = create<TranslateState>((set, get) => ({
  // 초기 상태
  models: [],
  selectedModel: '',
  isLoadingModels: false,

  selectedPairId: DEFAULT_PAIR_ID,

  sourceText: '',
  translatedText: '',
  isTranslating: false,

  tokenCounts: null,

  abortController: null,

  // 모델 목록 불러오기
  loadModels: async () => {
    set({ isLoadingModels: true });

    try {
      const response = await fetchModels();
      const models = response.models || [];

      set({
        models,
        // 모델이 있고 선택된 모델이 없으면 첫 번째 모델 선택
        selectedModel: models.length > 0 ? models[0].name : '',
      });

      if (models.length === 0) {
        snackbar.warning(i18n.t('translate.noModelsWarning'));
      }
    } catch {
      snackbar.error(i18n.t('translate.loadModelsError'));
    } finally {
      set({ isLoadingModels: false });
    }
  },

  // 모델 선택
  setSelectedModel: (model: string) => {
    set({ selectedModel: model });
  },

  // 언어쌍 선택
  setSelectedPairId: (pairId: string) => {
    set({ selectedPairId: pairId });
  },

  // 원문 입력
  setSourceText: (text: string) => {
    set({ sourceText: text });
  },

  // 번역문 직접 설정 (히스토리에서 불러올 때 사용)
  setTranslatedText: (text: string) => {
    set({ translatedText: text });
  },

  // 토큰 카운트 직접 설정 (히스토리에서 불러올 때 사용)
  setTokenCounts: (counts: { promptTokens: number; completionTokens: number } | null) => {
    set({ tokenCounts: counts });
  },

  // 번역 실행
  translate: async () => {
    const { sourceText, selectedModel, selectedPairId, isTranslating } = get();

    // 유효성 검사
    if (!sourceText.trim()) {
      snackbar.warning(i18n.t('translate.noTextWarning'));
      return;
    }

    if (!selectedModel) {
      snackbar.warning(i18n.t('translate.noModelWarning'));
      return;
    }

    if (isTranslating) {
      return;
    }

    // AbortController 생성
    const abortController = new AbortController();

    set({
      isTranslating: true,
      translatedText: '',
      tokenCounts: null,
      abortController,
    });

    try {
      const messages = buildTranslationMessages(sourceText, selectedPairId);

      await streamChat(
        {
          model: selectedModel,
          messages,
          stream: true,
        },
        chunk => {
          // 스트리밍으로 받은 텍스트를 누적
          if (chunk.message?.content) {
            set(state => ({
              translatedText: state.translatedText + chunk.message.content,
            }));
          }

          // 스트리밍 완료 시 토큰 카운트 정보 저장
          if (chunk.done && (chunk.prompt_eval_count || chunk.eval_count)) {
            set({
              tokenCounts: {
                promptTokens: chunk.prompt_eval_count || 0,
                completionTokens: chunk.eval_count || 0,
              },
            });
          }
        },
        abortController.signal
      );

      // 번역 완료 시 후처리: <!-- End of translation --> 주석 제거
      let finalTranslatedText = get().translatedText;
      const cleanedText = finalTranslatedText.replace(/<!--\s*End of translation\s*-->/gi, '').trim();

      // 정제된 텍스트로 업데이트
      if (cleanedText !== finalTranslatedText) {
        set({ translatedText: cleanedText });
        finalTranslatedText = cleanedText;
      }

      // 히스토리에 저장
      if (finalTranslatedText.trim()) {
        const historyId = useHistoryStore.getState().addHistory({
          sourceText,
          translatedText: finalTranslatedText,
          modelName: selectedModel,
          tokenCounts: get().tokenCounts,
        });

        // 백그라운드에서 제목 생성 (UI 블로킹 없음)
        generateTitleInBackground(historyId, sourceText, selectedModel);
      }
    } catch (error) {
      // 사용자가 중단한 경우
      if (error instanceof Error && error.name === 'AbortError') {
        snackbar.info(i18n.t('translate.translateStopped'));
        return;
      }
      snackbar.error(i18n.t('translate.translateError'));
    } finally {
      set({
        isTranslating: false,
        abortController: null,
      });
    }
  },

  // 번역 중단
  stopTranslation: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
  },

  // 번역 초기화
  clearTranslation: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }

    set({
      sourceText: '',
      translatedText: '',
      isTranslating: false,
      tokenCounts: null,
      abortController: null,
    });
  },
}));
