import type { ConvertParams, ConvertResult, Provider, ProviderInfo } from "./types";
import { anthropicInfo, convertAnthropic } from "./anthropic";
import { googleInfo, convertGemini } from "./google";
import { openaiInfo, convertOpenAI } from "./openai";

export const PROVIDERS: Record<Provider, ProviderInfo> = {
  anthropic: anthropicInfo,
  google: googleInfo,
  openai: openaiInfo,
};

export const PROVIDER_LIST: ProviderInfo[] = [anthropicInfo, googleInfo, openaiInfo];

export const DEFAULT_PROMPT = `이 문서 페이지의 모든 텍스트를 Markdown 형식으로 추출해줘. 표는 Markdown 표로, 제목은 # ## ###으로, 원문 내용을 빠짐없이 그대로 옮겨줘. 설명이나 주석은 추가하지 마.`;

export async function convertWithProvider(
  provider: Provider,
  params: ConvertParams
): Promise<ConvertResult> {
  switch (provider) {
    case "anthropic":
      return convertAnthropic(params);
    case "google":
      return convertGemini(params);
    case "openai":
      return convertOpenAI(params);
    default: {
      const _exhaustive: never = provider;
      throw new Error(`Unsupported provider: ${_exhaustive}`);
    }
  }
}

export type {
  Provider,
  ProviderInfo,
  ProviderModel,
  ConvertParams,
  ConvertResult,
  ConvertInput,
} from "./types";
