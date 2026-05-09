import type { ConvertParams, ConvertResult, ProviderInfo } from "./types";

export const anthropicInfo: ProviderInfo = {
  id: "anthropic",
  name: "Anthropic Claude",
  shortName: "Claude",
  keyPrefix: "sk-ant-",
  keyPlaceholder: "sk-ant-...",
  consoleUrl: "https://console.anthropic.com/settings/keys",
  defaultModel: "claude-haiku-4-5",
  models: [
    {
      id: "claude-haiku-4-5",
      label: "claude-haiku-4-5",
      recommended: true,
      pricePerPageHint: "~$0.005 / 페이지",
    },
    { id: "claude-sonnet-4-6", label: "claude-sonnet-4-6", pricePerPageHint: "~$0.015 / 페이지" },
    { id: "claude-opus-4-7", label: "claude-opus-4-7", pricePerPageHint: "~$0.05 / 페이지" },
    { id: "claude-3-7-sonnet-latest", label: "claude-3-7-sonnet-latest (구형)" },
  ],
};

export async function convertAnthropic({
  imageBase64,
  prompt,
  apiKey,
  model,
  signal,
}: ConvertParams): Promise<ConvertResult> {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: "image/png", data: imageBase64 },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
      signal,
    });

    if (!response.ok) {
      const errBody = await response.text();
      return { ok: false, status: response.status, error: errBody };
    }
    const data = await response.json();
    const text = data?.content?.[0]?.text ?? "";
    return { ok: true, markdown: text };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
