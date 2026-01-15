/**
 * 프롬프트 템플릿 관련 타입 정의
 */

import type { OllamaChatMessage } from './ollama';

/**
 * 딕셔너리 항목
 */
export interface DictionaryEntry {
  from: string;
  to: string;
}

/**
 * 메시지 템플릿 (YAML에서 로드되는 형태)
 */
export interface MessageTemplate {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * 프롬프트 템플릿 (YAML 파일 구조)
 */
export interface PromptTemplate {
  /** 템플릿 고유 ID (예: 'ko-en') */
  id: string;
  /** 원본 언어 코드 */
  sourceLang: string;
  /** 대상 언어 코드 */
  targetLang: string;
  /** UI 표시용 라벨 */
  label: string;
  /** 메시지 템플릿 배열 */
  messages: MessageTemplate[];
  /** 기본 딕셔너리 항목 */
  defaultDictionary: DictionaryEntry[];
}

/**
 * 템플릿 변수 (Handlebars에 전달되는 컨텍스트)
 */
export interface TemplateVariables {
  /** 번역할 원문 텍스트 */
  sourceText: string;
  /** 딕셔너리 항목 (기본값 사용 시 생략 가능) */
  dictionary?: DictionaryEntry[];
  /** 추가 커스텀 변수 */
  [key: string]: unknown;
}

/**
 * 언어쌍 정보 (UI용 간소화된 형태)
 */
export interface LanguagePairInfo {
  id: string;
  sourceLang: string;
  targetLang: string;
  label: string;
}

/**
 * 빌드된 메시지 결과
 */
export type BuiltMessages = OllamaChatMessage[];
