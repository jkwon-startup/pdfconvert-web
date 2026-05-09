import type { Provider } from "./types";

const PROVIDER_LABEL: Record<Provider, string> = {
  anthropic: "Anthropic",
  google: "Google",
  openai: "OpenAI",
};

/**
 * Provider 응답 상태/에러 본문을 사용자 친화 한국어 메시지로 변환합니다.
 * 원본 에러는 디버그용으로 details에 보존.
 */
export function friendlyErrorMessage(
  provider: Provider,
  status: number,
  rawError: string
): { title: string; hint: string; details: string } {
  const label = PROVIDER_LABEL[provider];
  const details = rawError.slice(0, 300);

  if (status === 0) {
    return {
      title: "네트워크 연결 실패",
      hint: "인터넷 연결을 확인하거나 잠시 후 다시 시도해주세요. (브라우저가 LLM API에 도달하지 못함)",
      details,
    };
  }
  if (status === 400) {
    // 보통 모델 ID 오류 또는 입력 형식 오류
    if (/model/i.test(rawError)) {
      return {
        title: "지원하지 않는 모델",
        hint: `선택한 모델 ID가 ${label} 계정에서 사용 가능한 목록에 없습니다. Settings에서 다른 모델을 선택하거나 콘솔에서 모델 권한을 확인하세요.`,
        details,
      };
    }
    return {
      title: "요청 형식 오류 (HTTP 400)",
      hint: `${label} 가 요청을 거부했습니다. 페이지 이미지가 너무 크거나 입력 형식 문제일 수 있습니다.`,
      details,
    };
  }
  if (status === 401) {
    return {
      title: "API 키가 유효하지 않음",
      hint: `${label} API 키를 확인해주세요. Settings → ${label} 탭에서 키를 다시 입력하세요.`,
      details,
    };
  }
  if (status === 403) {
    return {
      title: "API 키 권한 부족",
      hint: `${label} 계정에 해당 모델 사용 권한이 없거나 결제가 활성화되지 않았습니다. ${label} 콘솔에서 권한·결제 상태를 확인하세요.`,
      details,
    };
  }
  if (status === 404) {
    return {
      title: "엔드포인트를 찾을 수 없음 (HTTP 404)",
      hint: `${label} API 엔드포인트가 변경됐거나 모델 ID가 잘못됐을 수 있습니다.`,
      details,
    };
  }
  if (status === 413) {
    return {
      title: "페이지 이미지가 너무 큼 (HTTP 413)",
      hint: "PDF 페이지 해상도가 너무 큽니다. 다른 PDF 또는 더 작은 페이지로 시도해주세요.",
      details,
    };
  }
  if (status === 429) {
    return {
      title: "요청 한도 초과 (HTTP 429)",
      hint: `${label} 의 분당/월간 한도에 도달했습니다. 잠시 후 자동 재시도되며, 계속되면 Settings에서 더 저렴한 모델로 변경하거나 ${label} 콘솔에서 한도를 확인하세요.`,
      details,
    };
  }
  if (status === 500 || status === 502 || status === 503 || status === 504) {
    return {
      title: `${label} 서버 일시 장애 (HTTP ${status})`,
      hint: `${label} 측 일시적인 문제일 수 있습니다. 잠시 후 자동 재시도되며, 지속되면 다른 Provider로 전환을 고려하세요.`,
      details,
    };
  }
  return {
    title: `HTTP ${status}`,
    hint: `${label} API 호출 실패.`,
    details,
  };
}

/**
 * 자동 재시도가 가능한 상태 코드인지 판단.
 * 429 (rate limit), 5xx (서버 일시 장애), 0 (네트워크) 만 재시도.
 */
export function isRetryable(status: number): boolean {
  return status === 0 || status === 429 || (status >= 500 && status < 600);
}

/**
 * 지수 백오프 지연 시간 (ms).
 * attempt: 0 → 1500ms, 1 → 3000ms, 2 → 6000ms (최대 10000ms)
 */
export function backoffDelay(attempt: number): number {
  const base = 1500 * Math.pow(2, attempt);
  return Math.min(base, 10000);
}
