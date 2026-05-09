import { Converter } from "@/components/Converter";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            pdfconvert<span className="text-primary">·</span>web
          </a>
          <nav className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
            <a href="/test/d2" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              D2 검증
            </a>
            <a
              href="https://github.com/jkwon-startup/pdfconvert-web"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              GitHub
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <section className="space-y-3 text-center">
          <span className="inline-flex items-center gap-2 px-2.5 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
            BYO API Key · 클라이언트 사이드 처리
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            PDF를 마크다운으로,
            <br className="sm:hidden" /> 내 API 키로 직접
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            Claude · Gemini · GPT 중 골라서. PDF는 브라우저에서 처리되고, API 키는 본 브라우저에만
            저장됩니다. 우리 서버를 거치지 않습니다.
          </p>
        </section>

        <Converter />

        <footer className="text-xs text-zinc-500 dark:text-zinc-500 text-center pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
          <p>
            Built by{" "}
            <a
              className="underline hover:text-zinc-700 dark:hover:text-zinc-300"
              href="https://litt.ly/jkwon"
              target="_blank"
              rel="noopener noreferrer"
            >
              여행가J
            </a>{" "}
            · TS² · MIT License ·{" "}
            <a
              className="underline hover:text-zinc-700 dark:hover:text-zinc-300"
              href="https://github.com/jkwon-startup/pdfconvert-web"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </p>
          <p>
            본 서비스는 변환 도구를 제공할 뿐이며, 변환하려는 PDF의 저작권·API 비용·결과 정확성 등
            모든 책임은 변환을 요청한 사용자 본인에게 있습니다.
          </p>
        </footer>
      </main>
    </div>
  );
}
