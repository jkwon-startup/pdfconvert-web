"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type StepStatus = "idle" | "running" | "ok" | "fail";

const PROMPT = `이 문서 페이지의 모든 텍스트를 Markdown 형식으로 추출해줘. 표는 Markdown 표로, 제목은 # ## ###으로, 원문 내용을 빠짐없이 그대로 옮겨줘. 설명이나 주석은 추가하지 마.`;

const MODELS = [
  { value: "claude-haiku-4-5", label: "claude-haiku-4-5 (저렴, 빠름) — 권장" },
  { value: "claude-sonnet-4-6", label: "claude-sonnet-4-6 (균형)" },
  { value: "claude-opus-4-7", label: "claude-opus-4-7 (최고 품질, 비쌈)" },
  { value: "claude-3-7-sonnet-latest", label: "claude-3-7-sonnet-latest (구형)" },
];

export default function D2TestPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pageBase64, setPageBase64] = useState<string>("");
  const [pageWidth, setPageWidth] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);

  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("claude-haiku-4-5");

  const [step1Status, setStep1Status] = useState<StepStatus>("idle");
  const [step1Detail, setStep1Detail] = useState("");
  const [step2Status, setStep2Status] = useState<StepStatus>("idle");
  const [step2Detail, setStep2Detail] = useState("");
  const [step3Status, setStep3Status] = useState<StepStatus>("idle");
  const [step3Detail, setStep3Detail] = useState("");

  const [markdown, setMarkdown] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // sessionStorage에서 키 복원 (탭 닫으면 사라짐)
  useEffect(() => {
    const saved = sessionStorage.getItem("d2_test_anthropic_key");
    if (saved) setApiKey(saved);
  }, []);

  useEffect(() => {
    if (apiKey) sessionStorage.setItem("d2_test_anthropic_key", apiKey);
  }, [apiKey]);

  async function handleFile(file: File) {
    setPdfFile(file);
    setMarkdown("");
    setErrorMsg("");
    setStep1Status("running");
    setStep1Detail("PDF 로딩 중...");
    setStep2Status("idle");
    setStep2Detail("");
    setStep3Status("idle");
    setStep3Detail("");
    setPageBase64("");

    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2 });

      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not ready");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("2D context unavailable");

      await page.render({ canvas, canvasContext: ctx, viewport }).promise;

      const dataUrl = canvas.toDataURL("image/png");
      setPageBase64(dataUrl);
      setPageWidth(viewport.width);
      setPageHeight(viewport.height);

      setStep1Status("ok");
      setStep1Detail(
        `✓ ${pdf.numPages}페이지 PDF · 1페이지를 ${Math.round(viewport.width)}×${Math.round(
          viewport.height
        )} PNG로 변환 (${Math.round(dataUrl.length / 1024)} KB base64)`
      );
    } catch (err) {
      setStep1Status("fail");
      setStep1Detail(`✗ ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function runConvert() {
    if (!pageBase64 || !apiKey) {
      setErrorMsg("PDF 업로드 + API 키 입력이 필요합니다.");
      return;
    }
    setMarkdown("");
    setErrorMsg("");
    setStep2Status("running");
    setStep2Detail("Claude API 호출 중 (브라우저 → api.anthropic.com)...");
    setStep3Status("idle");
    setStep3Detail("");

    const base64Only = pageBase64.split(",")[1];

    try {
      const start = performance.now();
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
                  source: {
                    type: "base64",
                    media_type: "image/png",
                    data: base64Only,
                  },
                },
                { type: "text", text: PROMPT },
              ],
            },
          ],
        }),
      });

      const elapsed = ((performance.now() - start) / 1000).toFixed(1);

      if (!response.ok) {
        const errBody = await response.text();
        setStep2Status("fail");
        setStep2Detail(`✗ HTTP ${response.status} (${elapsed}s)`);
        setErrorMsg(errBody.slice(0, 500));
        return;
      }

      // CORS 통과 + 응답 정상
      setStep2Status("ok");
      setStep2Detail(`✓ CORS 통과 · HTTP 200 · ${elapsed}s 응답`);

      const data = await response.json();
      const text =
        data?.content?.[0]?.text ?? `(예상하지 못한 응답 형식)\n${JSON.stringify(data)}`;
      setMarkdown(text);

      // 마크다운 형식 휴리스틱 검증
      const hasHeading = /^\s*#{1,3}\s/m.test(text);
      const hasTable = /\|.*\|/.test(text);
      const hasKorean = /[가-힣]/.test(text);
      const looksLikeMarkdown = text.length > 30 && (hasHeading || hasTable || hasKorean);

      if (looksLikeMarkdown) {
        setStep3Status("ok");
        setStep3Detail(
          `✓ 마크다운 출력 ${text.length}자 · 제목${hasHeading ? "✓" : "✗"} 표${
            hasTable ? "✓" : "✗"
          } 한글${hasKorean ? "✓" : "✗"}`
        );
      } else {
        setStep3Status("fail");
        setStep3Detail(`✗ 응답이 마크다운 형식이 아닙니다 (${text.length}자)`);
      }
    } catch (err) {
      setStep2Status("fail");
      const msg = err instanceof Error ? err.message : String(err);
      setStep2Detail(`✗ Fetch 실패 (CORS 의심)`);
      setErrorMsg(msg);
    }
  }

  const allOk = step1Status === "ok" && step2Status === "ok" && step3Status === "ok";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 px-2.5 py-0.5 text-xs font-medium rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400">
            🔬 Day 2 게이트
          </span>
          <h1 className="text-2xl font-bold tracking-tight">최소 검증 테스트 — D2</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            본 구현 진입 전 위험 제거를 위한 3종 테스트입니다. 자기 Anthropic API 키와 샘플 PDF로
            아래 3단계가 모두 통과해야 D3 본 구현으로 넘어갑니다. 키는{" "}
            <strong>이 탭의 sessionStorage에만 저장</strong>되고 탭을 닫으면 사라집니다.
          </p>
        </div>

        {/* 게이트 요약 */}
        <Card className={allOk ? "border-emerald-500" : ""}>
          <CardHeader>
            <CardTitle className="text-base">게이트 상태</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <StepRow label="① PDF.js로 1페이지 → PNG base64" status={step1Status} detail={step1Detail} />
            <StepRow
              label="② Claude API 브라우저 직접 호출 (CORS)"
              status={step2Status}
              detail={step2Detail}
            />
            <StepRow label="③ 마크다운 형식 출력 검증" status={step3Status} detail={step3Detail} />
            {allOk && (
              <Alert className="mt-3 border-emerald-500/40 bg-emerald-500/5">
                <AlertTitle className="text-emerald-700 dark:text-emerald-400">
                  ✅ 3종 게이트 모두 통과
                </AlertTitle>
                <AlertDescription>D3 본 구현 진입 가능합니다.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* 1. PDF 업로드 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1) PDF 업로드 (자동으로 1페이지 PNG 변환)</CardTitle>
            <CardDescription>한글/표/제목이 포함된 PDF를 사용해 보세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            {pdfFile && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                선택됨: <code>{pdfFile.name}</code> ({Math.round(pdfFile.size / 1024)} KB)
              </p>
            )}
            <div className="rounded-md border border-zinc-200 dark:border-zinc-800 overflow-auto bg-white dark:bg-zinc-900 max-h-[400px]">
              <canvas ref={canvasRef} className="block max-w-full h-auto" />
            </div>
          </CardContent>
        </Card>

        {/* 2. API 키 + 모델 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2) Anthropic API 키 + 모델</CardTitle>
            <CardDescription>
              키는{" "}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                console.anthropic.com
              </a>
              에서 발급. 이 페이지의 sessionStorage에만 보관됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apikey">API Key (sk-ant-...)</Label>
              <Input
                id="apikey"
                type="password"
                placeholder="sk-ant-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select value={model} onValueChange={(v) => v && setModel(v)}>
                <SelectTrigger id="model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 3. 변환 실행 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">3) 변환 실행</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={runConvert}
              disabled={!pageBase64 || !apiKey || step2Status === "running"}
              size="lg"
            >
              {step2Status === "running" ? "변환 중..." : "Claude로 변환 시작"}
            </Button>

            {errorMsg && (
              <Alert className="border-red-500/40 bg-red-500/5">
                <AlertTitle className="text-red-700 dark:text-red-400">에러</AlertTitle>
                <AlertDescription>
                  <pre className="text-xs whitespace-pre-wrap break-all">{errorMsg}</pre>
                </AlertDescription>
              </Alert>
            )}

            {markdown && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="result">결과 마크다운</Label>
                  <Textarea
                    id="result"
                    value={markdown}
                    readOnly
                    className="min-h-[300px] font-mono text-xs"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-zinc-500 text-center">
          <a href="/" className="underline">
            ← 홈으로
          </a>{" "}
          · D2 검증용 임시 페이지 · 본 구현 완료 시 제거 예정
        </p>
      </div>
    </div>
  );
}

function StepRow({
  label,
  status,
  detail,
}: {
  label: string;
  status: StepStatus;
  detail: string;
}) {
  const icon =
    status === "ok" ? "✅" : status === "fail" ? "❌" : status === "running" ? "⏳" : "⚪";
  const color =
    status === "ok"
      ? "text-emerald-700 dark:text-emerald-400"
      : status === "fail"
        ? "text-red-700 dark:text-red-400"
        : status === "running"
          ? "text-blue-700 dark:text-blue-400"
          : "text-zinc-500";
  return (
    <div className="flex items-start gap-2">
      <span className="text-lg leading-none">{icon}</span>
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        {detail && <p className={`text-xs mt-0.5 ${color}`}>{detail}</p>}
      </div>
    </div>
  );
}
