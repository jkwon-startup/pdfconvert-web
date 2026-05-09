import { Converter } from "@/components/Converter";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            여행가J의 PPT<span className="text-primary">,</span> PDF convert
          </a>
          <nav className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
            <a href="/about" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              About
            </a>
            <a href="/privacy" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Privacy
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

        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/40 p-5 sm:p-6">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
            여행가J 와 함께
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
            AI 활용에 관심 있으시다면, 무료 지식 나눔 커뮤니티에 함께 해주세요.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="https://open.kakao.com/o/gIf2qyRf"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-0.5 rounded-lg border border-amber-300/50 bg-amber-50/60 dark:bg-amber-500/5 dark:border-amber-500/30 px-4 py-3 transition hover:bg-amber-50 dark:hover:bg-amber-500/10"
            >
              <span className="text-sm font-semibold text-amber-900 dark:text-amber-200 inline-flex items-center gap-1">
                여행가J의 AI 지식나눔
                <span aria-hidden className="text-amber-700/70 dark:text-amber-200/60">
                  ↗
                </span>
              </span>
              <span className="text-xs text-amber-700/80 dark:text-amber-200/70">
                오픈채팅 · 단톡 참여 코드: <code className="font-mono">gpters</code>
              </span>
            </a>
            <a
              href="https://litt.ly/jkwon"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 px-4 py-3 transition hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
            >
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 inline-flex items-center gap-1">
                여행가J 프로필
                <span aria-hidden className="text-zinc-500 dark:text-zinc-500">
                  ↗
                </span>
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                강의 · 콘텐츠 · 협업 문의
              </span>
            </a>
          </div>
        </section>

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
            · MIT License ·{" "}
            <a className="underline hover:text-zinc-700 dark:hover:text-zinc-300" href="/privacy">
              Privacy
            </a>
          </p>
          <p>
            본 서비스는 변환 도구를 제공할 뿐이며, 변환하려는 PDF의 저작권·API 비용·결과 검수 등
            모든 책임은 변환을 요청한 사용자 본인에게 있습니다.
          </p>
        </footer>
      </main>
    </div>
  );
}
