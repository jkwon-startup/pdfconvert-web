"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PptxToPdfGuideDialogProps {
  open: boolean;
  fileName: string;
  onClose: () => void;
  onTryTextFallback?: () => void;
}

export function PptxToPdfGuideDialog({
  open,
  fileName,
  onClose,
  onTryTextFallback,
}: PptxToPdfGuideDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>PowerPoint(.pptx) 파일이 감지되었습니다</DialogTitle>
          <DialogDescription>
            <code className="font-mono text-xs">{fileName}</code>
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-amber-500/30 bg-amber-500/5">
          <AlertDescription className="text-sm">
            가장 정확한 변환을 위해 PowerPoint / Keynote / Google Slides 에서{" "}
            <strong>PDF로 저장</strong> 한 뒤 다시 업로드해주세요. PPT 자체의 폰트 렌더링·이미지·차트가
            모두 PDF에 그대로 보존됩니다.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <p className="text-sm font-medium">PDF로 저장하는 법</p>
          <Accordion className="w-full">
            <AccordionItem value="ppt-mac">
              <AccordionTrigger className="text-sm">macOS — PowerPoint / Keynote</AccordionTrigger>
              <AccordionContent className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                <p>
                  <strong>PowerPoint</strong>: 파일 → 내보내기 → 파일 형식 <em>PDF</em> → 내보내기
                </p>
                <p>
                  <strong>Keynote</strong>: 파일 → 내보내기 → PDF... → 다음 → 저장
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="ppt-win">
              <AccordionTrigger className="text-sm">Windows — PowerPoint</AccordionTrigger>
              <AccordionContent className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                <p>파일 → 다른 이름으로 저장 → 파일 형식을 <em>PDF</em> 로 선택 → 저장</p>
                <p>또는 파일 → 내보내기 → PDF/XPS 문서 만들기</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="ppt-google">
              <AccordionTrigger className="text-sm">Google Slides</AccordionTrigger>
              <AccordionContent className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                <p>파일 → 다운로드 → PDF 문서(.pdf)</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {onTryTextFallback && (
          <Alert className="border-zinc-300 dark:border-zinc-700 bg-zinc-100/50 dark:bg-zinc-900/40">
            <AlertDescription className="text-xs">
              PowerPoint를 열 수 없는 환경이라면 <strong>텍스트 추출 모드</strong> 로 진행할 수
              있습니다. 슬라이드 안의 글자만 추출해 마크다운으로 정리합니다 — 이미지·차트·SmartArt
              의 시각 정보는 결과에 포함되지 않습니다.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          {onTryTextFallback && (
            <Button variant="outline" onClick={onTryTextFallback}>
              텍스트만 추출 (시각요소 손실)
            </Button>
          )}
          <Button onClick={onClose}>확인</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
