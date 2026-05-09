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
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TermsDialogProps {
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

export function TermsDialog({ open, onAccept, onCancel }: TermsDialogProps) {
  const [agreed, setAgreed] = useState(false);

  // 모달이 다시 열릴 때마다 체크박스 초기화
  useEffect(() => {
    if (open) setAgreed(false);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>이용 안내 및 책임 동의</DialogTitle>
          <DialogDescription>
            본 서비스 사용 전 한 번만 확인해 주세요. 동의 내역은 본 브라우저에만 기록됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <Section
            icon="📚"
            title="저작권 — 사용자 책임"
            body="변환하려는 PDF의 저작권은 사용자가 보유하거나 합법적인 사용 권한이 있어야 합니다. 본 서비스는 PDF 저작권 여부를 검증하지 않으며, 저작권 침해가 발생할 경우 모든 법적 책임은 변환을 요청한 사용자 본인에게 있습니다."
          />
          <Section
            icon="💰"
            title="API 비용 — 사용자 부담"
            body="변환 과정에서 발생하는 LLM API 사용료는 사용자 본인이 가입한 제공사(Anthropic / Google / OpenAI)에서 직접 청구됩니다. 본 서비스는 비용 청구·환불에 관여하지 않습니다."
          />
          <Section
            icon="📊"
            title="결과 무보증"
            body="LLM 특성상 변환 결과의 정확성·완전성은 보장되지 않습니다. 누락·왜곡·오역이 발생할 수 있으니, 중요한 문서는 반드시 사람의 검토를 거쳐 사용하세요."
          />
          <Section
            icon="🌐"
            title="데이터 처리"
            body="PDF는 본 브라우저에서 페이지 이미지로 변환된 뒤, 사용자가 선택한 LLM 제공사로 직접 전송됩니다. 각 제공사의 데이터 보관·학습 정책은 사용자가 직접 확인해야 합니다. 본 서비스 운영자는 PDF·API 키·변환 결과를 수집·저장하지 않습니다."
          />
        </div>

        <Alert className="border-amber-500/30 bg-amber-500/5">
          <AlertDescription className="text-xs">
            <strong>핵심 요약</strong>: 본 서비스는 변환 도구를 제공할 뿐이며, 사용 결과로 발생하는
            모든 법적·금전적·내용상 책임은 변환을 요청한 사용자 본인에게 있습니다.
          </AlertDescription>
        </Alert>

        <label className="flex items-start gap-2.5 text-sm cursor-pointer p-3 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 size-4 cursor-pointer"
          />
          <span>
            위 사항을 모두 읽고 이해했으며, 본 서비스 사용에서 발생하는{" "}
            <strong>모든 책임이 본인에게 있음에 동의</strong>합니다.
          </span>
        </label>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCancel}>
            거절 (변환 안 함)
          </Button>
          <Button onClick={onAccept} disabled={!agreed}>
            동의하고 변환 시작
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="space-y-1">
      <p className="font-semibold flex items-center gap-1.5">
        <span>{icon}</span>
        <span>{title}</span>
      </p>
      <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed pl-6">{body}</p>
    </div>
  );
}
