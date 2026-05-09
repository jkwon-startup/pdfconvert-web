import { Converter } from "@/components/Converter";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-amber-50/40 dark:from-zinc-950 dark:via-zinc-950 dark:to-amber-950/20">
      <header className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <a
            href="/"
            className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
          >
            여행가J의 PPT<span className="text-primary">,</span> PDF convert
          </a>
          <nav className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <a href="/about" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition">
              About
            </a>
            <a href="/privacy" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition">
              Privacy
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 sm:py-16 space-y-10">
        {/* Hero — 큰 비주얼 임팩트 */}
        <section className="relative space-y-4 text-center pt-4 pb-2">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-gradient-radial from-amber-200/30 via-transparent to-transparent dark:from-amber-500/10 blur-3xl"
            style={{
              background:
                "radial-gradient(ellipse 60% 70% at 50% 0%, rgb(254 243 199 / 0.5) 0%, transparent 60%)",
            }}
          />
          <span className="inline-flex items-center gap-2 px-6 py-2.5 text-2xl font-semibold rounded-full bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 shadow-md">
            여행가J의
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter text-zinc-950 dark:text-zinc-50 leading-[1.05]">
            PPT, PDF를
            <br />
            <span className="bg-gradient-to-r from-zinc-900 via-zinc-700 to-amber-700 dark:from-zinc-100 dark:via-zinc-300 dark:to-amber-300 bg-clip-text text-transparent">
              마크다운으로
            </span>
          </h1>
          <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Claude · Gemini · GPT 중 골라서.
            <br className="sm:hidden" />
            PDF·PPTX 는 브라우저에서 처리되고,
            <br className="hidden sm:inline" /> API 키는 본 브라우저에만 저장됩니다.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2 text-xs">
            <span className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
              <span className="size-1.5 rounded-full bg-emerald-500" /> BYO API Key
            </span>
            <span className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
              <span className="size-1.5 rounded-full bg-blue-500" /> 클라이언트 처리
            </span>
            <span className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
              <span className="size-1.5 rounded-full bg-amber-500" /> 100% 무료
            </span>
          </div>
        </section>

        <Converter />

        {/* CTA — amber 그라디언트 강조 */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-white to-zinc-50 dark:from-amber-950/30 dark:via-zinc-900/40 dark:to-zinc-900/40 ring-1 ring-amber-200/60 dark:ring-amber-500/20 p-6 sm:p-7 m3-elev-1">
          <div className="absolute -top-12 -right-12 size-32 rounded-full bg-amber-200/40 dark:bg-amber-500/10 blur-2xl" aria-hidden />
          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            여행가J 와 함께
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-5">
            AI 활용에 관심 있으시다면, 무료 지식 나눔 커뮤니티에 함께 해주세요.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="https://open.kakao.com/o/gIf2qyRf"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-1 rounded-xl bg-amber-100/80 dark:bg-amber-500/10 ring-1 ring-amber-300 dark:ring-amber-500/30 px-4 py-3.5 transition-all hover:bg-amber-100 dark:hover:bg-amber-500/15 hover:m3-elev-2 hover:-translate-y-0.5"
            >
              <span className="text-sm font-semibold text-amber-900 dark:text-amber-200 inline-flex items-center gap-1">
                여행가J의 AI 지식나눔
                <span
                  aria-hidden
                  className="text-amber-700/70 dark:text-amber-200/60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                >
                  ↗
                </span>
              </span>
              <span className="text-xs text-amber-800/80 dark:text-amber-200/70">
                오픈채팅 · 단톡 참여 코드:{" "}
                <code className="font-mono font-semibold">gpters</code>
              </span>
            </a>
            <a
              href="https://litt.ly/jkwon"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-1 rounded-xl bg-white dark:bg-zinc-900 ring-1 ring-zinc-200 dark:ring-zinc-800 px-4 py-3.5 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800/80 hover:m3-elev-2 hover:-translate-y-0.5"
            >
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 inline-flex items-center gap-1">
                여행가J 프로필
                <span
                  aria-hidden
                  className="text-zinc-500 dark:text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                >
                  ↗
                </span>
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                강의 · 콘텐츠 · 협업 문의
              </span>
            </a>
          </div>
        </section>

        <footer className="text-xs text-zinc-500 dark:text-zinc-500 text-center pt-8 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-2">
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
          <p className="max-w-xl mx-auto leading-relaxed">
            본 서비스는 변환 도구를 제공할 뿐이며, 변환하려는 PDF의 저작권·API 비용·결과 검수 등
            모든 책임은 변환을 요청한 사용자 본인에게 있습니다.
          </p>
        </footer>
      </main>
    </div>
  );
}
