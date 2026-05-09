import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-6 py-20">
      <main className="w-full max-w-3xl flex flex-col items-center text-center gap-8">
        <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full bg-zinc-900/5 dark:bg-zinc-50/10 text-zinc-700 dark:text-zinc-300">
          🚧 Day 1 — Hello World 배포 검증 중
        </span>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          PDF를 마크다운으로,
          <br />내 API 키로 직접
        </h1>

        <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400 max-w-xl">
          Claude · Gemini · GPT 골라서. 우리 서버 거치지 않고. 100% 무료.
          <br />
          <span className="text-sm text-zinc-500 mt-2 inline-block">
            현재는 부트스트랩 단계입니다. 본 기능은 D3~D7에 순차 공개됩니다.
          </span>
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="https://github.com/jkwon-startup/pdfconvert-web"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ size: "lg" }))}
          >
            GitHub에서 보기
          </a>
          <a
            href="/about"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            About
          </a>
        </div>

        <footer className="mt-12 text-xs text-zinc-500 dark:text-zinc-500">
          Built by{" "}
          <a
            className="underline hover:text-zinc-700 dark:hover:text-zinc-300"
            href="https://litt.ly/jkwon"
            target="_blank"
            rel="noopener noreferrer"
          >
            여행가J
          </a>{" "}
          · TS² · MIT License
        </footer>
      </main>
    </div>
  );
}
