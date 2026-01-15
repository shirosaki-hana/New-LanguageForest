/**
 * 번역 프롬프트 빌드 레이어
 * YAML 템플릿 + Handlebars 기반
 */

import Handlebars from 'handlebars';
import type { OllamaChatMessage } from '../types/ollama';
import type { PromptTemplate, TemplateVariables, BuiltMessages } from '../types/prompt';

// YAML 템플릿 import (빌드 타임에 JSON으로 변환됨)
import koEnTemplate from '../prompts/ko-en.yaml';
import enKoTemplate from '../prompts/en-ko.yaml';

/**
 * 로드된 프롬프트 템플릿 맵
 */
const templates: Map<string, PromptTemplate> = new Map([
  ['ko-en', koEnTemplate as PromptTemplate],
  ['en-ko', enKoTemplate as PromptTemplate],
]);

/**
 * 기본 언어쌍 ID
 */
export const DEFAULT_PAIR_ID = 'ko-en';

/**
 * 템플릿 ID로 프롬프트 템플릿 조회
 * @param id 템플릿 ID
 * @returns 프롬프트 템플릿 또는 기본 템플릿
 */
export function getPromptTemplate(id: string): PromptTemplate {
  return templates.get(id) ?? templates.get(DEFAULT_PAIR_ID)!;
}

/**
 * 사용 가능한 모든 템플릿 목록 조회
 * @returns 템플릿 배열
 */
export function getAllTemplates(): PromptTemplate[] {
  return Array.from(templates.values());
}

/**
 * 새 템플릿 등록 (런타임 확장용)
 * @param template 프롬프트 템플릿
 */
export function registerTemplate(template: PromptTemplate): void {
  templates.set(template.id, template);
}

/**
 * Handlebars로 단일 메시지 콘텐츠 렌더링
 * @param content 템플릿 문자열
 * @param variables 변수 컨텍스트
 * @returns 렌더링된 문자열
 */
function renderContent(content: string, variables: TemplateVariables): string {
  const compiled = Handlebars.compile(content, { noEscape: true });
  return compiled(variables).trim();
}

/**
 * 번역 요청을 위한 메시지 배열 생성
 * @param sourceText 원문
 * @param pairId 언어쌍 ID (예: 'ko-en', 'en-ko')
 * @param customVariables 추가 변수 (딕셔너리 오버라이드 등)
 * @returns Ollama 채팅 메시지 배열
 */
export function buildTranslationMessages(
  sourceText: string,
  pairId: string = DEFAULT_PAIR_ID,
  customVariables?: Partial<TemplateVariables>
): BuiltMessages {
  const template = getPromptTemplate(pairId);

  // 변수 컨텍스트 구성
  const variables: TemplateVariables = {
    sourceText,
    dictionary: customVariables?.dictionary ?? template.defaultDictionary,
    ...customVariables,
  };

  // 각 메시지 템플릿을 Handlebars로 렌더링
  const messages: OllamaChatMessage[] = template.messages.map(msg => ({
    role: msg.role,
    content: renderContent(msg.content, variables),
  }));

  return messages;
}

/**
 * UI용 언어쌍 정보 목록 조회
 * @returns 언어쌍 정보 배열
 */
export function getLanguagePairs() {
  return getAllTemplates().map(t => ({
    id: t.id,
    sourceLang: t.sourceLang,
    targetLang: t.targetLang,
    label: t.label,
  }));
}

/**
 * ID로 언어쌍 정보 조회 (하위 호환성)
 * @param id 언어쌍 ID
 * @returns 언어쌍 정보
 */
export function getLanguagePair(id: string) {
  const template = getPromptTemplate(id);
  return {
    id: template.id,
    sourceLang: template.sourceLang,
    targetLang: template.targetLang,
    label: template.label,
  };
}
