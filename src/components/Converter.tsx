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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsDialog } from "./SettingsDialog";
import {
  PROVIDERS,
  PROVIDER_LIST,
  DEFAULT_PROMPT,
  convertWithProvider,
} from "@/lib/providers";
import type { Provider } from "@/lib/providers";
import {
  getKey,
  getSelectedModel,
  getSelectedProvider,
  setSelectedModel,
  setSelectedProvider,
} from "@/lib/keys";

type PageStatus = "pending" | "converting" | "done" | "error";

interface PageInfo {
  num: number;
  status: PageStatus;
  markdown?: string;
  error?: string;
  elapsedMs?: number;
}

const RENDER_SCALE = 2;

export function Converter() {
  // Settings
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [provider, setProvider] = useState<Provider>("anthropic");
  const [model, setModel] = useState<string>(PROVIDERS.anthropic.defaultModel);
  const [savedKeys, setSavedKeys] = useState<Record<Provider, string>>({
    anthropic: "",
    google: "",
    openai: "",
  });
  const [hydrated, setHydrated] = useState(false);

  // PDF
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pdfError, setPdfError] = useState("");
  const arrayBufferRef = useRef<ArrayBuffer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 변환
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const [insertPageHeaders, setInsertPageHeaders] = useState(false);
  const batchCancelRef = useRef(false);

  // 드래그
  const [isDragging, setIsDragging] = useState(false);

  // 초기 hydration: 저장된 키/선택 로드
  useEffect(() => {
    const p = getSelectedProvider();
    const m = getSelectedModel(p, PROVIDERS[p].defaultModel);
    setProvider(p);
    setModel(m);
    refreshSavedKeys();
    setHydrated(true);
  }, []);

  function refreshSavedKeys() {
    setSavedKeys({
      anthropic: getKey("anthropic"),
      google: getKey("google"),
      openai: getKey("openai"),
    });
  }

  // Provider 변경 시 그 Provider의 기본 모델 + 저장된 모델 적용
  function handleProviderChange(p: Provider) {
    setProvider(p);
    setSelectedProvider(p);
    const m = getSelectedModel(p, PROVIDERS[p].defaultModel);
    setModel(m);
  }

  function handleModelChange(m: string) {
    setModel(m);
    setSelectedModel(provider, m);
  }

  // ── PDF 로드 ────────────────────────────────────────────────────────────
  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      setPdfError("PDF 파일만 업로드 가능합니다.");
      return;
    }
    setPdfFile(file);
    setPdfError("");
    setPages([]);
    setNumPages(0);
    arrayBufferRef.current = null;

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
      if (canvas) {
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          await page1.render({ canvas, canvasContext: ctx, viewport }).promise;
        }
      }

      setPages(
        Array.from({ length: pdf.numPages }, (_, i) => ({
          num: i + 1,
          status: "pending" as PageStatus,
        }))
      );
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : String(err));
    }
  }

  // ── 페이지 N → PNG base64 ───────────────────────────────────────────────
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

  const apiKey = savedKeys[provider];
  const hasKey = !!apiKey;

  // ── 전체 변환 ───────────────────────────────────────────────────────────
  async function runBatchConvert() {
    if (!arrayBufferRef.current || !apiKey || pages.length === 0) return;

    batchCancelRef.current = false;
    setBatchRunning(true);
    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        status: "pending",
        markdown: undefined,
        error: undefined,
        elapsedMs: undefined,
      }))
    );

    for (let i = 0; i < pages.length; i++) {
      if (batchCancelRef.current) break;
      const pageNum = i + 1;
      setPages((prev) => prev.map((p) => (p.num === pageNum ? { ...p, status: "converting" } : p)));

      const start = performance.now();
      try {
        const base64 = await pageToBase64(pageNum);
        const result = await convertWithProvider(provider, {
          imageBase64: base64,
          prompt: DEFAULT_PROMPT,
          apiKey,
          model,
        });
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
          if (result.status === 401 || result.status === 403) break;
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

  function cancelBatch() {
    batchCancelRef.current = true;
  }

  async function retryPage(pageNum: number) {
    if (!apiKey) return;
    setPages((prev) =>
      prev.map((p) => (p.num === pageNum ? { ...p, status: "converting", error: undefined } : p))
    );
    const start = performance.now();
    try {
      const base64 = await pageToBase64(pageNum);
      const result = await convertWithProvider(provider, {
        imageBase64: base64,
        prompt: DEFAULT_PROMPT,
        apiKey,
        model,
      });
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

  // ── 드래그앤드롭 ────────────────────────────────────────────────────────
  function onDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  // ── 결과 ───────────────────────────────────────────────────────────────
  const combinedMarkdown = pages
    .filter((p) => p.status === "done" && p.markdown)
    .map((p) => (insertPageHeaders ? `## Page ${p.num}\n\n${p.markdown}` : p.markdown))
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

  const doneCount = pages.filter((p) => p.status === "done").length;
  const errorCount = pages.filter((p) => p.status === "error").length;
  const progress = pages.length > 0 ? (doneCount / pages.length) * 100 : 0;
  const currentProviderInfo = PROVIDERS[provider];
  const currentModelInfo = currentProviderInfo.models.find((m) => m.id === model);

  return (
    <div className="space-y-6">
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onSaved={refreshSavedKeys}
      />

      {/* Provider / Model 선택 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">변환 엔진</CardTitle>
            <CardDescription>LLM 제공사와 모델을 선택하세요.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            ⚙ API 키 설정
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={provider} onValueChange={(v) => v && handleProviderChange(v as Provider)}>
            <TabsList className="grid grid-cols-3 w-full">
              {PROVIDER_LIST.map((p) => {
                const has = !!savedKeys[p.id];
                return (
                  <TabsTrigger key={p.id} value={p.id} className="relative">
                    {p.shortName}
                    {hydrated && (
                      <span
                        className={`ml-1.5 text-xs ${
                          has ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"
                        }`}
                      >
                        {has ? "✓" : "○"}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          {hydrated && !hasKey && (
            <Alert className="border-amber-500/30 bg-amber-500/5">
              <AlertTitle className="text-amber-700 dark:text-amber-400 text-sm">
                {currentProviderInfo.shortName} 키가 설정되지 않았습니다
              </AlertTitle>
              <AlertDescription className="text-xs">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="underline hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  API 키 설정 열기
                </button>{" "}
                · 또는 키 발급:{" "}
                <a
                  href={currentProviderInfo.consoleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {currentProviderInfo.consoleUrl.replace(/^https?:\/\//, "")}
                </a>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="model">모델</Label>
            <Select value={model} onValueChange={(v) => v && handleModelChange(v)}>
              <SelectTrigger id="model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentProviderInfo.models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                    {m.recommended && " — 권장"}
                    {m.pricePerPageHint && (
                      <span className="text-zinc-500 ml-2 text-xs">{m.pricePerPageHint}</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentModelInfo?.pricePerPageHint && (
              <p className="text-xs text-zinc-500">
                예상: {currentModelInfo.pricePerPageHint}
                {numPages > 0 &&
                  ` · ${numPages}페이지 PDF → 추정 비용 페이지 단가 × ${numPages}`}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* PDF 업로드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">PDF 업로드</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label
            htmlFor="pdf-input"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            }`}
          >
            <span className="text-3xl">📄</span>
            <span className="text-sm font-medium">
              PDF 파일을 끌어다 놓거나 클릭하여 선택
            </span>
            <span className="text-xs text-zinc-500">최대 50페이지 권장</span>
            <Input
              id="pdf-input"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </label>

          {pdfFile && (
            <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
              <span>
                <code className="font-mono">{pdfFile.name}</code> · {Math.round(pdfFile.size / 1024)} KB
                {numPages > 0 && (
                  <>
                    {" · "}
                    <strong>{numPages}페이지</strong>
                  </>
                )}
              </span>
            </div>
          )}

          {pdfError && (
            <Alert className="border-red-500/40 bg-red-500/5">
              <AlertTitle className="text-red-700 dark:text-red-400">PDF 로딩 오류</AlertTitle>
              <AlertDescription className="text-xs">{pdfError}</AlertDescription>
            </Alert>
          )}

          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 overflow-auto bg-white dark:bg-zinc-900 max-h-[300px]">
            <canvas ref={canvasRef} className="block max-w-full h-auto" />
          </div>
        </CardContent>
      </Card>

      {/* 변환 + 진행률 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">변환</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={runBatchConvert}
              disabled={!arrayBufferRef.current || !hasKey || batchRunning || pages.length === 0}
              size="lg"
            >
              {batchRunning
                ? `변환 중... (${doneCount}/${pages.length})`
                : pages.length > 0
                  ? `${pages.length}페이지 변환 시작`
                  : "PDF 업로드 필요"}
            </Button>
            {batchRunning && (
              <Button variant="outline" onClick={cancelBatch}>
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
                  <Label htmlFor="combined">
                    결과 마크다운 ({combinedMarkdown.length.toLocaleString()}자)
                  </Label>
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
    </div>
  );
}

function PageBadge({ page, onRetry }: { page: PageInfo; onRetry: () => void }) {
  const colorMap: Record<PageStatus, string> = {
    pending: "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800",
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
      title={
        page.error ||
        (page.status === "done" ? `Page ${page.num} (${seconds})` : `Page ${page.num}`)
      }
      className={`flex flex-col items-center justify-center gap-0.5 rounded border px-2 py-2 text-xs ${colorMap[page.status]} ${
        page.status === "error" ? "cursor-pointer hover:opacity-80" : ""
      }`}
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
