import type { ConvertParams, ConvertResult, ProviderInfo } from "./types";

export const openaiInfo: ProviderInfo = {
  id: "openai",
  name: "OpenAI GPT",
  shortName: "GPT",
  keyPrefix: "sk-",
  keyPlaceholder: "sk-...",
  consoleUrl: "https://platform.openai.com/api-keys",
  defaultModel: "gpt-5-mini",
  models: [
    {
      id: "gpt-5-mini",
      label: "gpt-5-mini",
      recommended: true,
      pricePerPageHint: "~$0.005 / 페이지",
    },
    { id: "gpt-5", label: "gpt-5", pricePerPageHint: "~$0.03 / 페이지" },
    { id: "gpt-4o", label: "gpt-4o", pricePerPageHint: "~$0.005 / 페이지" },
    { id: "gpt-4o-mini", label: "gpt-4o-mini", pricePerPageHint: "~$0.001 / 페이지" },
  ],
};

export async function convertOpenAI({
  input,
  prompt,
  apiKey,
  model,
  signal,
}: ConvertParams): Promise<ConvertResult> {
  const content =
    input.kind === "image"
      ? [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: { url: `data:image/png;base64,${input.imageBase64}` },
          },
        ]
      : [
          {
            type: "text",
            text: `${prompt}\n\n--- 슬라이드 원문 텍스트 ---\n${input.slideText}`,
          },
        ];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [{ role: "user", content }],
      }),
      signal,
    });

    if (!response.ok) {
      const errBody = await response.text();
      return { ok: false, status: response.status, error: errBody };
    }
    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content ?? "";
    return { ok: true, markdown: text };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
