"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { PROVIDER_LIST } from "@/lib/providers";
import type { Provider } from "@/lib/providers";
import {
  clearAllKeys,
  getKey,
  getPersistMode,
  setKey,
  setPersistMode,
  type PersistMode,
} from "@/lib/keys";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function SettingsDialog({ open, onOpenChange, onSaved }: SettingsDialogProps) {
  const [keys, setKeys] = useState<Record<Provider, string>>({
    anthropic: "",
    google: "",
    openai: "",
  });
  const [persist, setPersist] = useState<PersistMode>("local");
  const [showKeys, setShowKeys] = useState(false);

  // Dialog가 열릴 때 현재 저장된 값 로드
  useEffect(() => {
    if (open) {
      setKeys({
        anthropic: getKey("anthropic"),
        google: getKey("google"),
        openai: getKey("openai"),
      });
      setPersist(getPersistMode());
      setShowKeys(false);
    }
  }, [open]);

  function handleSave() {
    setPersistMode(persist);
    (Object.keys(keys) as Provider[]).forEach((p) => setKey(p, keys[p].trim()));
    onSaved?.();
    onOpenChange(false);
  }

  function handleClearAll() {
    if (
      typeof window !== "undefined" &&
      window.confirm("저장된 모든 API 키를 삭제할까요? (이 브라우저에서만)")
    ) {
      clearAllKeys();
      setKeys({ anthropic: "", google: "", openai: "" });
      onSaved?.();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>API 키 설정</DialogTitle>
          <DialogDescription>
            사용하실 LLM 제공사의 API 키를 입력하세요. 키는{" "}
            <strong>이 브라우저에만</strong> 저장되고 우리 서버로 전송되지 않습니다 (변환 요청 시
            LLM API로만 직접 전달).
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="anthropic" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            {PROVIDER_LIST.map((p) => (
              <TabsTrigger key={p.id} value={p.id}>
                {p.shortName}
              </TabsTrigger>
            ))}
          </TabsList>

          {PROVIDER_LIST.map((p) => (
            <TabsContent key={p.id} value={p.id} className="space-y-3 mt-4">
              <div className="space-y-2">
                <Label htmlFor={`key-${p.id}`}>{p.name} API Key</Label>
                <Input
                  id={`key-${p.id}`}
                  type={showKeys ? "text" : "password"}
                  placeholder={p.keyPlaceholder}
                  value={keys[p.id]}
                  onChange={(e) =>
                    setKeys((prev) => ({ ...prev, [p.id]: e.target.value }))
                  }
                  autoComplete="off"
                  spellCheck={false}
                />
                <p className="text-xs text-zinc-500">
                  키 발급:{" "}
                  <a
                    href={p.consoleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-zinc-700 dark:hover:text-zinc-300"
                  >
                    {p.consoleUrl.replace(/^https?:\/\//, "")}
                  </a>
                </p>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showKeys}
            onChange={(e) => setShowKeys(e.target.checked)}
          />
          키 보이기
        </label>

        <Separator />

        <div className="space-y-3">
          <Label>저장 위치</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPersist("local")}
              className={`p-3 rounded-md border text-left text-sm transition-colors ${
                persist === "local"
                  ? "border-primary bg-primary/5"
                  : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              }`}
            >
              <div className="font-medium">브라우저 저장</div>
              <div className="text-xs text-zinc-500 mt-0.5">localStorage · 다음 방문에도 유지</div>
            </button>
            <button
              type="button"
              onClick={() => setPersist("session")}
              className={`p-3 rounded-md border text-left text-sm transition-colors ${
                persist === "session"
                  ? "border-primary bg-primary/5"
                  : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              }`}
            >
              <div className="font-medium">세션만</div>
              <div className="text-xs text-zinc-500 mt-0.5">sessionStorage · 탭 닫으면 자동 폐기</div>
            </button>
          </div>
        </div>

        <Alert className="border-amber-500/30 bg-amber-500/5">
          <AlertDescription className="text-xs">
            🔒 <strong>보안 정책</strong>: 모든 키는 본 브라우저에만 저장되며, 변환 요청 시
            브라우저에서 직접 LLM API로 전달됩니다. 우리 서버를 통과하지 않습니다.{" "}
            <a href="/privacy" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">
              자세히
            </a>
          </AlertDescription>
        </Alert>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={handleClearAll}>
            모든 키 삭제
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button onClick={handleSave}>저장</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
