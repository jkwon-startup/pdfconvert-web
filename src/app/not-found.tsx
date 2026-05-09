import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다 — 여행가J의 PPT, PDF convert",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center px-4 py-20">
      <div className="max-w-md w-full text-center space-y-6">
        <span className="inline-flex items-center gap-2 px-2.5 py-0.5 text-xs font-medium rounded-full bg-zinc-900/5 dark:bg-zinc-50/10 text-zinc-700 dark:text-zinc-300">
          404
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          요청하신 주소가 존재하지 않거나 이동되었을 수 있습니다.
          <br />
          홈으로 돌아가서 다시 시도해주세요.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:opacity-90 transition"
          >
            홈으로
          </a>
          <a
            href="/about"
            className="inline-flex items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            About
          </a>
        </div>
        <footer className="pt-8 text-xs text-zinc-500">
          <a
            className="underline hover:text-zinc-700 dark:hover:text-zinc-300"
            href="https://litt.ly/jkwon"
            target="_blank"
            rel="noopener noreferrer"
          >
            여행가J
          </a>{" "}
          · MIT License
        </footer>
      </div>
    </div>
  );
}
