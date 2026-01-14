/**
 * 번역 프롬프트 빌드 레이어
 */

import type { OllamaChatMessage } from '../types/ollama';
import { getLanguagePair, DEFAULT_PAIR_ID } from '../config/languagePairs';

/**
 * 번역 요청을 위한 메시지 배열 생성
 * @param sourceText 원문
 * @param pairId 언어쌍 ID (예: 'ko-en', 'en-ko')
 * @returns Ollama 채팅 메시지 배열
 */
export function buildTranslationMessages(
  sourceText: string,
  pairId: string = DEFAULT_PAIR_ID,
): OllamaChatMessage[] {
  const pair = getLanguagePair(pairId);

  return [
    {
      role: 'system',
      content: pair.systemPrompt,
    },
    {
      role: 'user',
      content: sourceText,
    },
  ];
}
