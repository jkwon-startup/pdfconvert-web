import type { ConvertParams, ConvertResult, ProviderInfo } from "./types";

export const googleInfo: ProviderInfo = {
  id: "google",
  name: "Google Gemini",
  shortName: "Gemini",
  keyPrefix: "AIza",
  keyPlaceholder: "AIza...",
  consoleUrl: "https://aistudio.google.com/apikey",
  defaultModel: "gemini-2.5-flash",
  models: [
    {
      id: "gemini-2.5-flash",
      label: "gemini-2.5-flash",
      recommended: true,
      pricePerPageHint: "~$0.001 / 페이지",
    },
    { id: "gemini-2.5-pro", label: "gemini-2.5-pro", pricePerPageHint: "~$0.01 / 페이지" },
    {
      id: "gemini-2.5-flash-lite",
      label: "gemini-2.5-flash-lite",
      pricePerPageHint: "~$0.0005 / 페이지",
    },
    { id: "gemini-2.0-flash", label: "gemini-2.0-flash" },
  ],
};

export async function convertGemini({
  imageBase64,
  prompt,
  apiKey,
  model,
  signal,
}: ConvertParams): Promise<ConvertResult> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: "image/png", data: imageBase64 } },
              { text: prompt },
            ],
          },
        ],
        generationConfig: { maxOutputTokens: 4096 },
      }),
      signal,
    });

    if (!response.ok) {
      const errBody = await response.text();
      return { ok: false, status: response.status, error: errBody };
    }
    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts;
    const text = Array.isArray(parts)
      ? parts.map((p: { text?: string }) => p.text ?? "").join("")
      : "";
    return { ok: true, markdown: text };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
