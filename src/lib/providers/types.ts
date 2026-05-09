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

export interface ConvertParams {
  imageBase64: string;
  prompt: string;
  apiKey: string;
  model: string;
  signal?: AbortSignal;
}

export type ConvertResult =
  | { ok: true; markdown: string }
  | { ok: false; status: number; error: string };
