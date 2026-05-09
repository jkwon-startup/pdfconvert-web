"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

type StepStatus = "idle" | "running" | "ok" | "fail";
type PageStatus = "pending" | "converting" | "done" | "error";

interface PageInfo {
  num: number;
  status: PageStatus;
  markdown?: string;
  error?: string;
  elapsedMs?: number;
}

const PROMPT = `이 문서 페이지의 모든 텍스트를 Markdown 형식으로 추출해줘. 표는 Markdown 표로, 제목은 # ## ###으로, 원문 내용을 빠짐없이 그대로 옮겨줘. 설명이나 주석은 추가하지 마.`;

const MODELS = [
  { value: "claude-haiku-4-5", label: "claude-haiku-4-5 (저렴, 빠름) — 권장" },
  { value: "claude-sonnet-4-6", label: "claude-sonnet-4-6 (균형)" },
  { value: "claude-opus-4-7", label: "claude-opus-4-7 (최고 품질, 비쌈)" },
  { value: "claude-3-7-sonnet-latest", label: "claude-3-7-sonnet-latest (구형)" },
];

const RENDER_SCALE = 2;

export default function D2TestPage() {
  // PDF 상태
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState(0);
  const arrayBufferRef = useRef<ArrayBuffer | null>(null);

  // 1페이지 검증 결과 (게이트용)
  const [pageBase64, setPageBase64] = useState<string>("");

  // 게이트 상태
  const [step1Status, setStep1Status] = useState<StepStatus>("idle");
  const [step1Detail, setStep1Detail] = useState("");
  const [step2Status, setStep2Status] = useState<StepStatus>("idle");
  const [step2Detail, setStep2Detail] = useState("");
  const [step3Status, setStep3Status] = useState<StepStatus>("idle");
  const [step3Detail, setStep3Detail] = useState("");

  // 1페이지 결과
  const [singleMarkdown, setSingleMarkdown] = useState("");
  const [singleError, setSingleError] = useState("");

  // API
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("claude-haiku-4-5");

  // 전체 변환 상태
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchCancel, setBatchCancel] = useState(false);
  const [insertPageHeaders, setInsertPageHeaders] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // sessionStorage 키 복원
  useEffect(() => {
    const saved = sessionStorage.getItem("d2_test_anthropic_key");
    if (saved) setApiKey(saved);
  }, []);
  useEffect(() => {
    if (apiKey) sessionStorage.setItem("d2_test_anthropic_key", apiKey);
  }, [apiKey]);

  // ── PDF 로드: 페이지 수 + 1페이지 미리보기/base64 ────────────────────────
  async function handleFile(file: File) {
    setPdfFile(file);
    setSingleMarkdown("");
    setSingleError("");
    setStep1Status("running");
    setStep1Detail("PDF 로딩 중...");
    setStep2Status("idle");
    setStep2Detail("");
    setStep3Status("idle");
    setStep3Detail("");
    setPageBase64("");
    setPages([]);
    setNumPages(0);

    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      arrayBufferRef.current = arrayBuffer;

      const pdf = await pdfjs.getDocument({ data: arrayBuffer.slice(0) }).promise;
      setNumPages(pdf.numPages);

      const page1 = await pdf.getPage(1);
      const viewport = page1.getViewport({ scale: RENDER_SCALE });

      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not ready");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("2D context unavailable");
      await page1.render({ canvas, canvasContext: ctx, viewport }).promise;

      const dataUrl = canvas.toDataURL("image/png");
      setPageBase64(dataUrl);

      setPages(
        Array.from({ length: pdf.numPages }, (_, i) => ({
          num: i + 1,
          status: "pending" as PageStatus,
        }))
      );

      setStep1Status("ok");
      setStep1Detail(
        `✓ ${pdf.numPages}페이지 PDF · 1페이지 ${Math.round(viewport.width)}×${Math.round(
          viewport.height
        )} PNG (${Math.round(dataUrl.length / 1024)} KB base64)`
      );
    } catch (err) {
      setStep1Status("fail");
      setStep1Detail(`✗ ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // ── Claude API 호출 (공통) ───────────────────────────────────────────────
  async function callClaude(
    base64Only: string,
    signal?: AbortSignal
  ): Promise<{ ok: true; markdown: string } | { ok: false; status: number; error: string }> {
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
                source: { type: "base64", media_type: "image/png", data: base64Only },
              },
              { type: "text", text: PROMPT },
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
  }

  // ── 1페이지 검증 ─────────────────────────────────────────────────────────
  async function runSingleConvert() {
    if (!pageBase64 || !apiKey) {
      setSingleError("PDF 업로드 + API 키 입력이 필요합니다.");
      return;
    }
    setSingleMarkdown("");
    setSingleError("");
    setStep2Status("running");
    setStep2Detail("Claude API 호출 중 (브라우저 → api.anthropic.com)...");
    setStep3Status("idle");
    setStep3Detail("");

    const base64Only = pageBase64.split(",")[1];
    const start = performance.now();
    try {
      const result = await callClaude(base64Only);
      const elapsed = ((performance.now() - start) / 1000).toFixed(1);

      if (!result.ok) {
        setStep2Status("fail");
        setStep2Detail(`✗ HTTP ${result.status} (${elapsed}s)`);
        setSingleError(result.error.slice(0, 500));
        return;
      }

      setStep2Status("ok");
      setStep2Detail(`✓ CORS 통과 · HTTP 200 · ${elapsed}s`);
      setSingleMarkdown(result.markdown);

      const text = result.markdown;
      const hasHeading = /^\s*#{1,3}\s/m.test(text);
      const hasTable = /\|.*\|/.test(text);
      const hasKorean = /[가-힣]/.test(text);
      const looksLikeMarkdown = text.length > 30 && (hasHeading || hasTable || hasKorean);
      if (looksLikeMarkdown) {
        setStep3Status("ok");
        setStep3Detail(
          `✓ ${text.length}자 · 제목${hasHeading ? "✓" : "✗"} 표${hasTable ? "✓" : "✗"} 한글${
            hasKorean ? "✓" : "✗"
          }`
        );
      } else {
        setStep3Status("fail");
        setStep3Detail(`✗ 마크다운 형식 아님 (${text.length}자)`);
      }
    } catch (err) {
      setStep2Status("fail");
      setStep2Detail(`✗ Fetch 실패 (CORS 의심)`);
      setSingleError(err instanceof Error ? err.message : String(err));
    }
  }

  // ── 페이지 N을 PNG base64로 변환 ─────────────────────────────────────────
  async function pageToBase64(pageNum: number): Promise<string> {
    if (!arrayBufferRef.current) throw new Error("PDF 데이터가 없습니다");
    const pdfjs = await import("pdfjs-dist");
    const pdf = await pdfjs.getDocument({ data: arrayBufferRef.current.slice(0) }).promise;
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: RENDER_SCALE });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D context unavailable");
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL("image/png").split(",")[1];
  }

  // ── 전체 변환 ────────────────────────────────────────────────────────────
  async function runBatchConvert() {
    if (!arrayBufferRef.current || !apiKey || pages.length === 0) {
      return;
    }
    setBatchCancel(false);
    setBatchRunning(true);

    // 모든 페이지 pending 으로 초기화
    setPages((prev) => prev.map((p) => ({ ...p, status: "pending", markdown: undefined, error: undefined, elapsedMs: undefined })));

    for (let i = 0; i < pages.length; i++) {
      if (batchCancelRef.current) break;

      const pageNum = i + 1;
      setPages((prev) =>
        prev.map((p) => (p.num === pageNum ? { ...p, status: "converting" } : p))
      );

      const start = performance.now();
      try {
        const base64Only = await pageToBase64(pageNum);
        const result = await callClaude(base64Only);
        const elapsedMs = performance.now() - start;
        if (!result.ok) {
          setPages((prev) =>
            prev.map((p) =>
              p.num === pageNum
                ? {
                    ...p,
                    status: "error",
                    error: `HTTP ${result.status}: ${result.error.slice(0, 200)}`,
                    elapsedMs,
                  }
                : p
            )
          );
          // 401 같은 키 에러면 더 진행해도 의미없으니 중단
          if (result.status === 401) {
            break;
          }
          continue;
        }
        setPages((prev) =>
          prev.map((p) =>
            p.num === pageNum
              ? { ...p, status: "done", markdown: result.markdown, elapsedMs }
              : p
          )
        );
      } catch (err) {
        const elapsedMs = performance.now() - start;
        setPages((prev) =>
          prev.map((p) =>
            p.num === pageNum
              ? {
                  ...p,
                  status: "error",
                  error: err instanceof Error ? err.message : String(err),
                  elapsedMs,
                }
              : p
          )
        );
      }
    }

    setBatchRunning(false);
  }

  // batchCancel을 ref로 동기화 (변환 루프 중 즉시 반영)
  const batchCancelRef = useRef(false);
  useEffect(() => {
    batchCancelRef.current = batchCancel;
  }, [batchCancel]);

  // ── 단일 페이지 재시도 ───────────────────────────────────────────────────
  async function retryPage(pageNum: number) {
    if (!apiKey) return;
    setPages((prev) =>
      prev.map((p) =>
        p.num === pageNum ? { ...p, status: "converting", error: undefined } : p
      )
    );
    const start = performance.now();
    try {
      const base64Only = await pageToBase64(pageNum);
      const result = await callClaude(base64Only);
      const elapsedMs = performance.now() - start;
      if (!result.ok) {
        setPages((prev) =>
          prev.map((p) =>
            p.num === pageNum
              ? {
                  ...p,
                  status: "error",
                  error: `HTTP ${result.status}: ${result.error.slice(0, 200)}`,
                  elapsedMs,
                }
              : p
          )
        );
        return;
      }
      setPages((prev) =>
        prev.map((p) =>
          p.num === pageNum ? { ...p, status: "done", markdown: result.markdown, elapsedMs } : p
        )
      );
    } catch (err) {
      const elapsedMs = performance.now() - start;
      setPages((prev) =>
        prev.map((p) =>
          p.num === pageNum
            ? {
                ...p,
                status: "error",
                error: err instanceof Error ? err.message : String(err),
                elapsedMs,
              }
            : p
        )
      );
    }
  }

  // ── 합친 마크다운 ────────────────────────────────────────────────────────
  const combinedMarkdown = pages
    .filter((p) => p.status === "done" && p.markdown)
    .map((p) =>
      insertPageHeaders ? `## Page ${p.num}\n\n${p.markdown}` : p.markdown
    )
    .join("\n\n");

  function downloadMarkdown() {
    if (!combinedMarkdown || !pdfFile) return;
    const blob = new Blob([combinedMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = pdfFile.name.replace(/\.pdf$/i, "") + ".md";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyMarkdown() {
    if (!combinedMarkdown) return;
    await navigator.clipboard.writeText(combinedMarkdown);
  }

  const allOk = step1Status === "ok" && step2Status === "ok" && step3Status === "ok";
  const doneCount = pages.filter((p) => p.status === "done").length;
  const errorCount = pages.filter((p) => p.status === "error").length;
  const progress = pages.length > 0 ? (doneCount / pages.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 px-2.5 py-0.5 text-xs font-medium rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400">
            🔬 Day 2 — 검증 + 전체 변환
          </span>
          <h1 className="text-2xl font-bold tracking-tight">PDF → Markdown 변환 (D2)</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            자기 Anthropic API 키로 PDF를 마크다운으로 변환합니다. 키는{" "}
            <strong>이 탭의 sessionStorage에만 저장</strong>되고 탭을 닫으면 사라집니다.
            <br />
            먼저 1페이지 검증으로 게이트 3종을 확인한 뒤, 그 아래에서 전체 페이지를 일괄 변환할 수
            있습니다.
          </p>
        </div>

        {/* 게이트 요약 */}
        <Card className={allOk ? "border-emerald-500" : ""}>
          <CardHeader>
            <CardTitle className="text-base">게이트 상태 (1페이지 검증)</CardTitle>
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
                  ✅ 3종 게이트 모두 통과 — 전체 변환 가능
                </AlertTitle>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* 1. PDF 업로드 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1) PDF 업로드</CardTitle>
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
                {numPages > 0 && (
                  <>
                    {" · "}
                    <strong>총 {numPages}페이지</strong>
                  </>
                )}
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
              키 발급:{" "}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                console.anthropic.com
              </a>
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

        {/* 3. 1페이지 검증 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">3) 1페이지 검증 (게이트)</CardTitle>
            <CardDescription>
              먼저 1페이지로 CORS·마크다운 형식을 확인합니다. 빠르게 끝납니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={runSingleConvert}
              disabled={!pageBase64 || !apiKey || step2Status === "running"}
              size="lg"
            >
              {step2Status === "running" ? "검증 중..." : "1페이지로 검증 시작"}
            </Button>

            {singleError && (
              <Alert className="border-red-500/40 bg-red-500/5">
                <AlertTitle className="text-red-700 dark:text-red-400">에러</AlertTitle>
                <AlertDescription>
                  <pre className="text-xs whitespace-pre-wrap break-all">{singleError}</pre>
                </AlertDescription>
              </Alert>
            )}

            {singleMarkdown && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="single-result">1페이지 결과 마크다운</Label>
                  <Textarea
                    id="single-result"
                    value={singleMarkdown}
                    readOnly
                    className="min-h-[200px] font-mono text-xs"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 4. 전체 변환 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">4) 전체 페이지 변환</CardTitle>
            <CardDescription>
              모든 페이지를 순차로 변환합니다 (Claude 1콜/페이지). 진행 중에도 취소 가능.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={runBatchConvert}
                disabled={!arrayBufferRef.current || !apiKey || batchRunning || pages.length === 0}
                size="lg"
              >
                {batchRunning
                  ? `변환 중... (${doneCount}/${pages.length})`
                  : `전체 ${pages.length || ""}페이지 변환`}
              </Button>
              {batchRunning && (
                <Button variant="outline" onClick={() => setBatchCancel(true)}>
                  취소
                </Button>
              )}
              <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 ml-auto">
                <input
                  type="checkbox"
                  checked={insertPageHeaders}
                  onChange={(e) => setInsertPageHeaders(e.target.checked)}
                />
                ## Page N 헤더 삽입
              </label>
            </div>

            {pages.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                  <span>
                    완료 {doneCount} · 실패 {errorCount} · 대기 {pages.length - doneCount - errorCount}
                  </span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {pages.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {pages.map((p) => (
                  <PageBadge key={p.num} page={p} onRetry={() => retryPage(p.num)} />
                ))}
              </div>
            )}

            {combinedMarkdown && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Label htmlFor="combined">합친 마크다운 ({combinedMarkdown.length.toLocaleString()}자)</Label>
                    <div className="ml-auto flex gap-2">
                      <Button size="sm" variant="outline" onClick={copyMarkdown}>
                        복사
                      </Button>
                      <Button size="sm" onClick={downloadMarkdown}>
                        .md 다운로드
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    id="combined"
                    value={combinedMarkdown}
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
          · D2 검증 + 전체 변환 페이지 · D3 정식 UI 작업 중
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

function PageBadge({ page, onRetry }: { page: PageInfo; onRetry: () => void }) {
  const colorMap: Record<PageStatus, string> = {
    pending:
      "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800",
    converting:
      "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 animate-pulse",
    done: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    error: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
  };
  const icon: Record<PageStatus, string> = {
    pending: "⚪",
    converting: "⏳",
    done: "✓",
    error: "✗",
  };
  const seconds = page.elapsedMs ? `${(page.elapsedMs / 1000).toFixed(1)}s` : "";
  return (
    <button
      type="button"
      onClick={page.status === "error" ? onRetry : undefined}
      title={page.error || (page.status === "done" ? `Page ${page.num} (${seconds})` : `Page ${page.num}`)}
      className={`flex flex-col items-center justify-center gap-0.5 rounded border px-2 py-2 text-xs ${colorMap[page.status]} ${page.status === "error" ? "cursor-pointer hover:opacity-80" : ""}`}
    >
      <span className="font-medium">
        {icon[page.status]} {page.num}
      </span>
      {page.status === "done" && seconds && (
        <span className="text-[10px] opacity-60">{seconds}</span>
      )}
      {page.status === "error" && <span className="text-[10px]">재시도</span>}
    </button>
  );
}
