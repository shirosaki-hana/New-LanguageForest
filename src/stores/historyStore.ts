/**
 * 번역 히스토리를 위한 Zustand 스토어 (persist 사용)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TranslationHistoryItem {
  id: string;
  title?: string; // LLM이 생성한 제목 (비동기로 추가됨)
  sourceText: string;
  translatedText: string;
  modelName: string;
  createdAt: number;
  // 토큰 카운트 정보 (기존 히스토리 호환을 위해 optional)
  tokenCounts?: {
    promptTokens: number;
    completionTokens: number;
  } | null;
}

interface HistoryState {
  // 히스토리 목록
  history: TranslationHistoryItem[];

  // 액션
  addHistory: (item: Omit<TranslationHistoryItem, 'id' | 'createdAt'>) => string; // 생성된 id 반환
  updateHistoryTitle: (id: string, title: string) => void;
  removeHistory: (id: string) => void;
  clearHistory: () => void;
}

const MAX_HISTORY_COUNT = 100; // 최대 저장 개수

export const useHistoryStore = create<HistoryState>()(
  persist(
    set => ({
      history: [],

      // 히스토리 추가 (생성된 id 반환)
      addHistory: item => {
        const id = Date.now().toString();
        const newItem: TranslationHistoryItem = {
          ...item,
          id,
          createdAt: Date.now(),
        };

        set(state => {
          // 최대 개수 초과 시 오래된 항목 제거
          const updatedHistory = [newItem, ...state.history].slice(0, MAX_HISTORY_COUNT);
          return { history: updatedHistory };
        });

        return id;
      },

      // 히스토리 제목 업데이트
      updateHistoryTitle: (id, title) => {
        set(state => ({
          history: state.history.map(item => (item.id === id ? { ...item, title } : item)),
        }));
      },

      // 특정 히스토리 삭제
      removeHistory: id => {
        set(state => ({
          history: state.history.filter(item => item.id !== id),
        }));
      },

      // 전체 히스토리 삭제
      clearHistory: () => {
        set({ history: [] });
      },
    }),
    {
      name: 'languageforest-history', // 로컬 스토리지 키
    }
  )
);
