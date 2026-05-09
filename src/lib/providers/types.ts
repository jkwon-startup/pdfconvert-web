export type Provider = "anthropic" | "google" | "openai";

export interface ProviderModel {
  id: string;
  label: string;
  recommended?: boolean;
  pricePerPageHint?: string;
}

export interface ProviderInfo {
  id: Provider;
  name: string;
  shortName: string;
  keyPrefix: string;
  keyPlaceholder: string;
  consoleUrl: string;
  models: ProviderModel[];
  defaultModel: string;
}

/**
 * LLM 호출 입력. PDF 페이지는 image, PPTX 슬라이드는 text 로 전달.
 */
export type ConvertInput =
  | { kind: "image"; imageBase64: string }
  | { kind: "text"; slideText: string };

export interface ConvertParams {
  input: ConvertInput;
  prompt: string;
  apiKey: string;
  model: string;
  signal?: AbortSignal;
}

export type ConvertResult =
  | { ok: true; markdown: string }
  | { ok: false; status: number; error: string };
