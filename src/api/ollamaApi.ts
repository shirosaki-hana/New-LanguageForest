/**
 * Ollama API 레이어
 */

import type {
  OllamaTagsResponse,
  OllamaChatRequest,
  OllamaChatStreamChunk,
  OllamaGenerateRequest,
  OllamaGenerateResponse,
} from '../types/ollama';

const API_BASE = '/api';

/**
 * 사용 가능한 모델 목록 조회
 */
export async function fetchModels(): Promise<OllamaTagsResponse> {
  const response = await fetch(`${API_BASE}/tags`);

  if (!response.ok) {
    throw new Error(`모델 목록을 가져오는데 실패했습니다: ${response.status}`);
  }

  return response.json();
}

/**
 * 스트리밍 채팅 요청
 * @param request 채팅 요청 데이터
 * @param onChunk 각 청크가 도착할 때마다 호출되는 콜백
 * @param signal AbortSignal (선택적)
 */
export async function streamChat(
  request: OllamaChatRequest,
  onChunk: (chunk: OllamaChatStreamChunk) => void,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...request,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`채팅 요청 실패: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('스트림을 읽을 수 없습니다');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // 줄 단위로 파싱 (NDJSON 형식)
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 마지막 불완전한 줄은 버퍼에 남김

      for (const line of lines) {
        if (line.trim()) {
          try {
            const chunk: OllamaChatStreamChunk = JSON.parse(line);
            onChunk(chunk);
          } catch {
            // 파싱 실패 시 무시
            console.warn('청크 파싱 실패:', line);
          }
        }
      }
    }

    // 남은 버퍼 처리
    if (buffer.trim()) {
      try {
        const chunk: OllamaChatStreamChunk = JSON.parse(buffer);
        onChunk(chunk);
      } catch {
        console.warn('마지막 청크 파싱 실패:', buffer);
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * 텍스트 생성 요청 (스트리밍 없이)
 * @param request 생성 요청 데이터
 */
export async function generate(request: OllamaGenerateRequest): Promise<OllamaGenerateResponse> {
  const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...request,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`생성 요청 실패: ${response.status}`);
  }

  return response.json();
}
