import { OllamaAdapter } from './ollamaAdapter.mjs';
import { GeminiAdapter } from './geminiAdapter.mjs';

/**
 * LLM Provider 종류
 */
export const LLMProvider = {
  OLLAMA: 'ollama',
  GEMINI: 'gemini',
};

/**
 * 환경변수 기반으로 적절한 어댑터 생성
 */
export function createAdapter(config) {
  const provider = config.provider || LLMProvider.OLLAMA;

  switch (provider.toLowerCase()) {
    case LLMProvider.GEMINI:
      console.log('Using Gemini adapter');
      return new GeminiAdapter({
        apiKey: config.geminiApiKey,
        model: config.geminiModel,
      });

    case LLMProvider.OLLAMA:
    default:
      console.log('Using Ollama adapter');
      return new OllamaAdapter({
        host: config.ollamaHost,
        port: config.ollamaPort,
      });
  }
}

export { OllamaAdapter, GeminiAdapter };
