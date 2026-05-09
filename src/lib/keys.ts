import type { Provider } from "./providers/types";

export type PersistMode = "local" | "session";

const KEY_NAMES: Record<Provider, string> = {
  anthropic: "pdfconvert_key_anthropic",
  google: "pdfconvert_key_google",
  openai: "pdfconvert_key_openai",
};

const PERSIST_MODE_KEY = "pdfconvert_persist_mode";
const SELECTED_PROVIDER_KEY = "pdfconvert_selected_provider";
const SELECTED_MODEL_KEY = "pdfconvert_selected_model";

function isClient(): boolean {
  return typeof window !== "undefined";
}

export function getPersistMode(): PersistMode {
  if (!isClient()) return "local";
  const v = localStorage.getItem(PERSIST_MODE_KEY);
  return v === "session" ? "session" : "local";
}

export function setPersistMode(mode: PersistMode): void {
  if (!isClient()) return;
  localStorage.setItem(PERSIST_MODE_KEY, mode);

  // 모드 전환 시: 기존 키들을 새 storage 로 이동, 다른 storage 는 정리
  const target: Storage = mode === "session" ? sessionStorage : localStorage;
  const other: Storage = mode === "session" ? localStorage : sessionStorage;

  (Object.keys(KEY_NAMES) as Provider[]).forEach((p) => {
    const name = KEY_NAMES[p];
    const fromTarget = target.getItem(name);
    const fromOther = other.getItem(name);
    if (!fromTarget && fromOther) {
      target.setItem(name, fromOther);
    }
    other.removeItem(name);
  });
}

export function getKey(provider: Provider): string {
  if (!isClient()) return "";
  // 두 storage 모두 확인 (세션 우선)
  return (
    sessionStorage.getItem(KEY_NAMES[provider]) ??
    localStorage.getItem(KEY_NAMES[provider]) ??
    ""
  );
}

export function setKey(provider: Provider, value: string): void {
  if (!isClient()) return;
  const mode = getPersistMode();
  const target: Storage = mode === "session" ? sessionStorage : localStorage;
  const other: Storage = mode === "session" ? localStorage : sessionStorage;
  if (value) {
    target.setItem(KEY_NAMES[provider], value);
  } else {
    target.removeItem(KEY_NAMES[provider]);
  }
  other.removeItem(KEY_NAMES[provider]);
}

export function clearKey(provider: Provider): void {
  if (!isClient()) return;
  localStorage.removeItem(KEY_NAMES[provider]);
  sessionStorage.removeItem(KEY_NAMES[provider]);
}

export function clearAllKeys(): void {
  if (!isClient()) return;
  (Object.keys(KEY_NAMES) as Provider[]).forEach(clearKey);
}

export function getSelectedProvider(): Provider {
  if (!isClient()) return "anthropic";
  const v = localStorage.getItem(SELECTED_PROVIDER_KEY);
  if (v === "anthropic" || v === "google" || v === "openai") return v;
  return "anthropic";
}

export function setSelectedProvider(p: Provider): void {
  if (!isClient()) return;
  localStorage.setItem(SELECTED_PROVIDER_KEY, p);
}

export function getSelectedModel(provider: Provider, fallback: string): string {
  if (!isClient()) return fallback;
  return localStorage.getItem(`${SELECTED_MODEL_KEY}_${provider}`) || fallback;
}

export function setSelectedModel(provider: Provider, model: string): void {
  if (!isClient()) return;
  localStorage.setItem(`${SELECTED_MODEL_KEY}_${provider}`, model);
}
