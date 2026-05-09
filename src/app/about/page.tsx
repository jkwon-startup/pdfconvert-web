import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — 여행가J의 PPT, PDF convert",
  description:
    "여행가J(권정선)이 운영하는 BYO API Key 기반 PDF/PPTX → Markdown 변환 도구. 운영자 소개와 서비스 철학.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            여행가J의 PPT<span className="text-primary">,</span> PDF convert
          </a>
          <nav className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
            <a href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              ← 홈
            </a>
            <a href="/privacy" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Privacy
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-10">
        <section className="space-y-3">
          <span className="inline-flex items-center gap-2 px-2.5 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
            About
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            왜 이 도구를 만들었는가
          </h1>
        </section>

        <section className="space-y-3 text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <p>
            AI 도구로 일하는 사람들이 PDF·PPT 자료를 LLM 에 넣어 요약·검색·RAG 에 쓰는 일이
            일상이 됐습니다. 그런데 그러려면 먼저 마크다운으로 정리해야 하는데, 기존 도구들은
            설치가 복잡하거나, 한국어 OCR 품질이 낮거나, 자기 PDF 를 남의 서버에 업로드해야
            하거나, 또 다른 SaaS 결제를 요구합니다.
          </p>
          <p>
            <strong>이미 LLM API 키를 갖고 있으면, 그 키로 직접 변환하면 되지 않을까?</strong>{" "}
            그 단순한 질문이 시작이었습니다. 사용자 키로 사용자 브라우저에서 처리하면 운영자
            비용이 0원이니 무료로 풀어도 부담이 없고, 사용자 입장에서는 어떤 데이터도 외부
            서버에 흘리지 않는 형태가 됩니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">설계 원칙</h2>
          <ul className="list-disc pl-6 space-y-2 text-zinc-700 dark:text-zinc-300">
            <li>
              <strong>BYO API Key</strong> — 사용자가 자기 LLM 제공사 키 입력. 운영자 비용 0원,
              사용자는 자기 사용량만큼만 부담
            </li>
            <li>
              <strong>클라이언트 사이드 처리</strong> — PDF·PPTX·키·결과 모두 사용자 브라우저에서.
              우리 서버는 정적 자산만 전달
            </li>
            <li>
              <strong>3사 LLM 자유 선택</strong> — Claude · Gemini · GPT 자유롭게 전환,
              모델별 가격 힌트 표시
            </li>
            <li>
              <strong>오픈소스 (MIT)</strong> — 코드 검증 가능. 신뢰는 마케팅 문구가 아닌 코드로
            </li>
            <li>
              <strong>한국어 우선</strong> — 한글 PDF 인식률 높은 모델 우선 추천, UI/안내 모두 한국어
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">누가 쓰면 좋을까</h2>
          <div className="space-y-4 text-zinc-700 dark:text-zinc-300">
            <div className="space-y-1">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                ① API 키를 이미 보유한 디지털 워커
              </p>
              <p className="text-sm">
                옵시디언/노션으로 노트하는 컨설턴트, GPT-4o 로 마케팅 자동화하는 1인 창업가,
                Claude 로 RAG 만드는 개발자. <em>"또 다른 SaaS 결제하기 싫다"</em> 가 공통 심리.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                ② AI 학습자 / 커뮤니티 회원
              </p>
              <p className="text-sm">
                여행가J 가 운영하는 GPTers / 스타트업실험실 등 커뮤니티 회원. 키는 발급했지만
                직접 코드 짜기는 부담. 무료 + 원클릭 = 진입장벽 0.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">운영자</h2>
          <div className="space-y-2 text-zinc-700 dark:text-zinc-300">
            <p>
              <strong>여행가J (권정선)</strong> — TS² / AITY 대표. AI 활용 교육 전문가, 브랜딩 ·
              마케팅 컨설턴트.
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>GPTers (국내 최대 AI 커뮤니티) 파트너 &amp; 스터디장</li>
              <li>AVPN (Google.org) AI 트레이너</li>
              <li>Google Gemini Certified Educator</li>
              <li>SKT · ORION · LS Mtron · 멀티캠퍼스 등 기업/공공 강의</li>
              <li>충남대 · 세명대 등 대학 강의</li>
            </ul>
            <p className="pt-2">
              자세한 활동:{" "}
              <a
                href="https://litt.ly/jkwon"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                litt.ly/jkwon
              </a>
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">함께하기</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="https://open.kakao.com/o/gIf2qyRf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-0.5 rounded-lg border border-amber-300/50 bg-amber-50/60 dark:bg-amber-500/5 dark:border-amber-500/30 px-4 py-3 transition hover:bg-amber-50 dark:hover:bg-amber-500/10"
            >
              <span className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                AI 지식나눔 단톡 ↗
              </span>
              <span className="text-xs text-amber-700/80 dark:text-amber-200/70">
                참여 코드: <code className="font-mono">gpters</code>
              </span>
            </a>
            <a
              href="https://github.com/jkwon-startup/pdfconvert-web"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col gap-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 px-4 py-3 transition hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
            >
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                GitHub (오픈소스) ↗
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Issues / Pull Requests 환영
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
        </footer>
      </main>
    </div>
  );
}
