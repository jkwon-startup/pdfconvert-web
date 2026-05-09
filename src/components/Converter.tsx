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
import { TermsDialog } from "./TermsDialog";
import { PptxToPdfGuideDialog } from "./PptxToPdfGuideDialog";
import { MarkdownPreview } from "./MarkdownPreview";
import {
  PROVIDERS,
  PROVIDER_LIST,
  DEFAULT_PROMPT,
  convertWithProvider,
} from "@/lib/providers";
import type { Provider, ConvertInput } from "@/lib/providers";
import {
  friendlyErrorMessage,
  isRetryable,
  backoffDelay,
} from "@/lib/providers/error-messages";
import {
  getKey,
  getSelectedModel,
  getSelectedProvider,
  setSelectedModel,
  setSelectedProvider,
} from "@/lib/keys";
import {
  getTermsAccepted,
  setTermsAccepted as persistTermsAccepted,
} from "@/lib/terms";
import { markdownToPlainText } from "@/lib/markdown-to-text";

type PageStatus = "pending" | "converting" | "done" | "error";

interface PageInfo {
  num: number;
  status: PageStatus;
  markdown?: string;
  error?: string;
  rawError?: string;
  errorStatus?: number;
  elapsedMs?: number;
}

const RENDER_SCALE = 2;
const LAST_RESULT_KEY = "pdfconvert_last_result_v1";

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

  // 이용 약관 동의
  const [termsOpen, setTermsOpen] = useState(false);
  const [termsAccepted, setTermsAcceptedState] = useState(false);

  // PPTX 안내 모달
  const [pptxGuide, setPptxGuide] = useState<{
    open: boolean;
    fileName: string;
    file: File | null;
  }>({ open: false, fileName: "", file: null });

  // 입력 모드: PDF 페이지(이미지) 또는 PPTX 슬라이드 텍스트
  const [sourceMode, setSourceMode] = useState<"pdf" | "pptx-text">("pdf");
  const [sourceReady, setSourceReady] = useState(false);
  const pptxSlidesRef = useRef<string[]>([]);

  // PDF
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pdfError, setPdfError] = useState("");
  const [restoredFileName, setRestoredFileName] = useState<string>("");
  const arrayBufferRef = useRef<ArrayBuffer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 변환
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const [insertPageHeaders, setInsertPageHeaders] = useState(false);
  const [resultView, setResultView] = useState<"markdown" | "rendered">("markdown");
  const batchCancelRef = useRef(false);

  // 드래그
  const [isDragging, setIsDragging] = useState(false);

  // 초기 hydration: 저장된 키/선택 로드 + 이전 변환 결과 복원
  useEffect(() => {
    const p = getSelectedProvider();
    const m = getSelectedModel(p, PROVIDERS[p].defaultModel);
    setProvider(p);
    setModel(m);
    refreshSavedKeys();
    setTermsAcceptedState(getTermsAccepted());

    try {
      const saved = sessionStorage.getItem(LAST_RESULT_KEY);
      if (saved) {
        const data = JSON.parse(saved) as {
          fileName?: string;
          pages?: PageInfo[];
          insertPageHeaders?: boolean;
        };
        if (Array.isArray(data.pages) && data.pages.some((p) => p.status === "done")) {
          setPages(data.pages);
          setRestoredFileName(data.fileName ?? "");
          if (typeof data.insertPageHeaders === "boolean") {
            setInsertPageHeaders(data.insertPageHeaders);
          }
        }
      }
    } catch {
      // 파싱 실패 시 무시
    }

    setHydrated(true);
  }, []);

  // 변환 결과를 sessionStorage 에 저장 (변환 완료된 페이지가 있을 때만)
  useEffect(() => {
    if (!hydrated) return;
    const hasDone = pages.some((p) => p.status === "done");
    if (!hasDone) return;
    try {
      sessionStorage.setItem(
        LAST_RESULT_KEY,
        JSON.stringify({
          fileName: pdfFile?.name ?? restoredFileName,
          pages,
          insertPageHeaders,
        })
      );
    } catch {
      // quota 초과 등 무시
    }
  }, [pages, pdfFile, restoredFileName, insertPageHeaders, hydrated]);

  function clearLastResult() {
    sessionStorage.removeItem(LAST_RESULT_KEY);
    setPages([]);
    setRestoredFileName("");
  }

  // 변환 카드의 "초기화" 버튼 — 파일/결과/상태 모두 리셋, 다시 업로드 가능
  function resetAll() {
    sessionStorage.removeItem(LAST_RESULT_KEY);
    setPdfFile(null);
    setNumPages(0);
    setPdfError("");
    setPages([]);
    setRestoredFileName("");
    setSourceMode("pdf");
    setSourceReady(false);
    arrayBufferRef.current = null;
    pptxSlidesRef.current = [];
    batchCancelRef.current = false;
    if (canvasRef.current) {
      canvasRef.current.width = 0;
      canvasRef.current.height = 0;
    }
  }

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
    const lowerName = file.name.toLowerCase();
    const isPdf = lowerName.endsWith(".pdf") || file.type === "application/pdf";
    const isPptx =
      lowerName.endsWith(".pptx") ||
      file.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation";

    if (isPptx) {
      // PPTX는 즉시 텍스트 추출 자동 시작 (모달 게이트 제거)
      // PDF 변환 권장 안내는 변환 카드에 inline으로 노출됨
      await loadPptxAsText(file);
      return;
    }
    if (lowerName.endsWith(".ppt") || file.type === "application/vnd.ms-powerpoint") {
      setPdfError("구버전 PPT(.ppt)는 지원하지 않습니다. PowerPoint에서 .pptx 또는 PDF로 저장한 뒤 업로드해주세요.");
      setSourceReady(false);
      return;
    }
    if (!isPdf) {
      setPdfError("PDF 또는 PPTX 파일만 업로드 가능합니다.");
      setSourceReady(false);
      return;
    }
    setSourceMode("pdf");
    setSourceReady(false);
    pptxSlidesRef.current = [];
    setPdfFile(file);
    setPdfError("");
    setPages([]);
    setRestoredFileName("");
    setNumPages(0);
    arrayBufferRef.current = null;
    sessionStorage.removeItem(LAST_RESULT_KEY);

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
      setSourceReady(true);
    } catch (err) {
      setSourceReady(false);
      setPdfError(err instanceof Error ? err.message : String(err));
    }
  }

  // ── 페이지 N → PNG base64 ───────────────────────────────────────────────
  // ── PPTX 텍스트 추출: 업로드 즉시 자동 호출 ────────────────────────────
  async function loadPptxAsText(file: File) {
    setPptxGuide({ open: false, fileName: "", file: null });
    setPdfError("");
    setPages([]);
    setRestoredFileName("");
    setNumPages(0);
    setSourceReady(false);
    arrayBufferRef.current = null;
    sessionStorage.removeItem(LAST_RESULT_KEY);

    try {
      const { extractPptxSlides } = await import("@/lib/extractors/pptx-text");
      const { slides, numSlides } = await extractPptxSlides(file);
      pptxSlidesRef.current = slides;
      setSourceMode("pptx-text");
      setPdfFile(file);
      setNumPages(numSlides);
      setPages(
        Array.from({ length: numSlides }, (_, i) => ({
          num: i + 1,
          status: "pending" as PageStatus,
        }))
      );
      setSourceReady(slides.length > 0);
    } catch (err) {
      setSourceReady(false);
      setPdfError(
        `PPTX 텍스트 추출 실패: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // ── LLM 호출 (자동 백오프 포함, 최대 3회 재시도) ──────────────────────
  async function callWithBackoff(input: ConvertInput): Promise<
    | { ok: true; markdown: string }
    | { ok: false; status: number; error: string; friendly: string }
  > {
    // 진단: 키/provider/model 상태를 콘솔에 출력 (값 자체는 마스킹)
    if (typeof window !== "undefined") {
      const masked = apiKey
        ? `${apiKey.slice(0, 7)}…${apiKey.slice(-4)} (len=${apiKey.length})`
        : "<EMPTY>";
      console.info("[pdfconvert] convert call", {
        provider,
        model,
        apiKeyMasked: masked,
        inputKind: input.kind,
      });
    }
    if (!apiKey || !apiKey.trim()) {
      return {
        ok: false,
        status: 0,
        error: "API key is empty (savedKeys[provider] returned empty string)",
        friendly:
          `${PROVIDERS[provider].shortName} API 키가 비어 있습니다. ⚙ API 키 설정에서 키를 입력해주세요.`,
      };
    }
    const maxAttempts = 3;
    let lastResult:
      | { ok: false; status: number; error: string }
      | null = null;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await convertWithProvider(provider, {
        input,
        prompt: DEFAULT_PROMPT,
        apiKey,
        model,
      });
      if (result.ok) return result;
      lastResult = result;
      if (!isRetryable(result.status) || attempt === maxAttempts - 1) break;
      await new Promise((res) => setTimeout(res, backoffDelay(attempt)));
    }
    if (!lastResult) {
      return { ok: false, status: 0, error: "Unknown", friendly: "알 수 없는 오류" };
    }
    const { title, hint } = friendlyErrorMessage(provider, lastResult.status, lastResult.error);
    return {
      ok: false,
      status: lastResult.status,
      error: lastResult.error,
      friendly: `${title} — ${hint}`,
    };
  }

  // ── 페이지/슬라이드 N 의 LLM 입력 ─────────────────────────────────────
  async function getPageInput(pageNum: number): Promise<ConvertInput> {
    if (sourceMode === "pptx-text") {
      const text = pptxSlidesRef.current[pageNum - 1] ?? "";
      return { kind: "text", slideText: text || "(빈 슬라이드)" };
    }
    const base64 = await pageToBase64(pageNum);
    return { kind: "image", imageBase64: base64 };
  }

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

  // PDF/PPTX 로딩 완료 여부. 파일 데이터 자체는 ref에 보관하지만, 버튼 활성화는 state로 고정한다.
  const hasSourceData = sourceReady;

  // ── 전체 변환 ───────────────────────────────────────────────────────────
  async function runBatchConvert() {
    if (!hasSourceData || !apiKey || pages.length === 0) return;

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
        const input = await getPageInput(pageNum);
        const result = await callWithBackoff(input);
        const elapsedMs = performance.now() - start;
        if (!result.ok) {
          setPages((prev) =>
            prev.map((p) =>
              p.num === pageNum
                ? {
                    ...p,
                    status: "error",
                    error: result.friendly,
                    rawError: result.error,
                    errorStatus: result.status,
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

  // ── 변환 시작: 약관 미동의 시 모달 게이트 ──────────────────────────────
  function handleStartConvert() {
    if (!termsAccepted) {
      setTermsOpen(true);
      return;
    }
    runBatchConvert();
  }

  function handleTermsAccept() {
    persistTermsAccepted(true);
    setTermsAcceptedState(true);
    setTermsOpen(false);
    // 동의 직후 변환 즉시 시작
    runBatchConvert();
  }

  function handleTermsCancel() {
    setTermsOpen(false);
  }

  function revokeTerms() {
    if (
      typeof window !== "undefined" &&
      window.confirm("동의를 철회하면 다음 변환 시 다시 안내가 표시됩니다. 철회할까요?")
    ) {
      persistTermsAccepted(false);
      setTermsAcceptedState(false);
    }
  }

  async function retryPage(pageNum: number) {
    if (!apiKey) return;
    setPages((prev) =>
      prev.map((p) => (p.num === pageNum ? { ...p, status: "converting", error: undefined } : p))
    );
    const start = performance.now();
    try {
      const input = await getPageInput(pageNum);
      const result = await callWithBackoff(input);
      const elapsedMs = performance.now() - start;
      if (!result.ok) {
        setPages((prev) =>
          prev.map((p) =>
            p.num === pageNum
              ? {
                  ...p,
                  status: "error",
                  error: result.friendly,
                  rawError: result.error,
                  errorStatus: result.status,
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
  const unitLabel = sourceMode === "pptx-text" ? "Slide" : "Page";
  const PPTX_TEXT_HEADER = `> ⚠️ 이 결과는 PPTX 텍스트 추출 모드로 생성되었습니다. 이미지·차트·SmartArt 의 시각 정보는 포함되지 않습니다. 더 정확한 변환을 원하시면 PowerPoint / Keynote / Google Slides 에서 PDF로 변환 후 다시 업로드해주세요.\n\n`;

  const bodyMarkdown = pages
    .filter((p) => p.status === "done" && p.markdown)
    .map((p) => (insertPageHeaders ? `## ${unitLabel} ${p.num}\n\n${p.markdown}` : p.markdown))
    .join("\n\n");

  const combinedMarkdown = bodyMarkdown
    ? sourceMode === "pptx-text"
      ? PPTX_TEXT_HEADER + bodyMarkdown
      : bodyMarkdown
    : "";

  function download(format: "md" | "txt") {
    if (!combinedMarkdown) return;
    const baseName = (pdfFile?.name || restoredFileName || "converted").replace(/\.(pdf|pptx)$/i, "");
    const content = format === "txt" ? markdownToPlainText(combinedMarkdown) : combinedMarkdown;
    const mime = format === "md" ? "text/markdown" : "text/plain";
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName}.${format}`;
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
      <TermsDialog open={termsOpen} onAccept={handleTermsAccept} onCancel={handleTermsCancel} />
      <PptxToPdfGuideDialog
        open={pptxGuide.open}
        fileName={pptxGuide.fileName}
        onClose={() => setPptxGuide({ open: false, fileName: "", file: null })}
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
              <SelectTrigger id="model" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="min-w-[var(--radix-select-trigger-width)] w-(--radix-select-trigger-width)">
                {currentProviderInfo.models.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="py-2">
                    <div className="flex flex-col items-start gap-0.5 w-full">
                      <span className="font-mono text-sm flex items-center gap-1.5">
                        {m.label}
                        {m.recommended && (
                          <span className="px-1.5 py-0.5 text-[10px] font-sans font-medium rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                            권장
                          </span>
                        )}
                      </span>
                      {m.pricePerPageHint && (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {m.pricePerPageHint}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentModelInfo?.pricePerPageHint && (
              <p className="text-xs text-zinc-500">
                예상: {currentModelInfo.pricePerPageHint}
                {numPages > 0 &&
                  ` · ${numPages}${sourceMode === "pptx-text" ? "슬라이드 PPTX" : "페이지 PDF"} → 추정 비용 단가 × ${numPages}`}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 파일 업로드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">파일 업로드</CardTitle>
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
              파일을 끌어다 놓거나 클릭하여 선택
            </span>
            <span className="text-xs text-zinc-500">최대 50페이지 권장</span>
            <Input
              id="pdf-input"
              type="file"
              accept="application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,.pdf,.pptx"
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
              <AlertTitle className="text-red-700 dark:text-red-400">파일 로딩 오류</AlertTitle>
              <AlertDescription className="text-xs">{pdfError}</AlertDescription>
            </Alert>
          )}

          {hydrated && restoredFileName && !pdfFile && (
            <Alert className="border-blue-500/30 bg-blue-500/5">
              <AlertTitle className="text-blue-700 dark:text-blue-400 text-sm">
                이전 변환 결과를 복원했습니다
              </AlertTitle>
              <AlertDescription className="text-xs">
                <code>{restoredFileName}</code> · 다운로드/복사는 가능하지만 재시도/추가 변환은 PDF를
                다시 업로드해야 합니다.{" "}
                <button
                  type="button"
                  onClick={clearLastResult}
                  className="underline hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  결과 지우기
                </button>
              </AlertDescription>
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
          <Alert className="border-amber-500/30 bg-amber-500/5">
            <AlertDescription className="text-xs">
              ⚠️ 변환하려는 PDF의 <strong>저작권</strong>·<strong>API 비용</strong>·
              <strong>결과 검수</strong> 등은 사용자(요청자) 본인의 책임으로 진행됩니다.
              {hydrated && termsAccepted && (
                <>
                  {" "}
                  <button
                    type="button"
                    onClick={revokeTerms}
                    className="underline hover:text-zinc-700 dark:hover:text-zinc-300"
                  >
                    동의 철회
                  </button>
                </>
              )}
            </AlertDescription>
          </Alert>

          {(() => {
            const firstError = pages.find((p) => p.status === "error");
            if (!firstError?.error) return null;
            return (
              <Alert className="border-red-500/40 bg-red-500/5">
                <AlertTitle className="text-red-700 dark:text-red-400 text-sm">
                  변환 실패 — 페이지 {firstError.num}
                  {firstError.errorStatus !== undefined && (
                    <span className="ml-2 font-mono text-xs opacity-80">
                      HTTP {firstError.errorStatus}
                    </span>
                  )}
                </AlertTitle>
                <AlertDescription className="text-xs space-y-2">
                  <p className="whitespace-pre-wrap">{firstError.error}</p>
                  {firstError.rawError && (
                    <details className="text-zinc-600 dark:text-zinc-400">
                      <summary className="cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100">
                        🔍 원본 응답 본문 (디버그)
                      </summary>
                      <pre className="mt-2 p-2 bg-zinc-100 dark:bg-zinc-900 rounded text-[10px] whitespace-pre-wrap break-all max-h-40 overflow-auto">
                        {firstError.rawError}
                      </pre>
                    </details>
                  )}
                  <p className="text-zinc-600 dark:text-zinc-400">
                    💡 같은 오류가 반복되면 <strong>모델을 변경</strong>하거나 <strong>다른 파일</strong>로 시도해보세요.
                    {" "}
                    <button
                      type="button"
                      onClick={() => setSettingsOpen(true)}
                      className="underline hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      API 키 확인
                    </button>
                    {" · "}
                    <button
                      type="button"
                      onClick={resetAll}
                      className="underline hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      처음부터 다시
                    </button>
                  </p>
                </AlertDescription>
              </Alert>
            );
          })()}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleStartConvert}
              disabled={!hasSourceData || !hasKey || batchRunning || pages.length === 0}
              size="lg"
            >
              {batchRunning
                ? `변환 중... (${doneCount}/${pages.length})`
                : pages.length > 0
                  ? `${pages.length}${sourceMode === "pptx-text" ? "슬라이드" : "페이지"} 변환 시작`
                  : "파일 업로드 필요"}
            </Button>
            {batchRunning && (
              <Button variant="outline" onClick={cancelBatch}>
                취소
              </Button>
            )}
            {(pdfFile || pages.length > 0) && !batchRunning && (
              <Button variant="ghost" size="sm" onClick={resetAll}>
                ↺ 초기화
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
                  <div className="ml-auto flex flex-wrap gap-2">
                    <div className="inline-flex rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden text-xs">
                      <button
                        type="button"
                        onClick={() => setResultView("markdown")}
                        className={`px-2.5 py-1 transition ${
                          resultView === "markdown"
                            ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
                            : "bg-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                        }`}
                      >
                        원본
                      </button>
                      <button
                        type="button"
                        onClick={() => setResultView("rendered")}
                        className={`px-2.5 py-1 transition ${
                          resultView === "rendered"
                            ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
                            : "bg-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                        }`}
                      >
                        렌더링
                      </button>
                    </div>
                    <Button size="sm" variant="outline" onClick={copyMarkdown}>
                      복사
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => download("txt")}>
                      .txt 다운로드
                    </Button>
                    <Button size="sm" onClick={() => download("md")}>
                      .md 다운로드
                    </Button>
                  </div>
                </div>
                {resultView === "markdown" ? (
                  <Textarea
                    id="combined"
                    value={combinedMarkdown}
                    readOnly
                    className="min-h-[300px] font-mono text-xs"
                  />
                ) : (
                  <MarkdownPreview markdown={combinedMarkdown} />
                )}
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
