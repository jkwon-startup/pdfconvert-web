import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy & Security — pdfconvert-web",
  description:
    "pdfconvert-web 의 데이터 처리 정책. PDF·API 키·변환 결과는 본 서비스 서버에 저장되지 않습니다.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            pdfconvert<span className="text-primary">·</span>web
          </a>
          <nav className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
            <a href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              ← 홈
            </a>
            <a href="/about" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              About
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

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-6 prose prose-zinc dark:prose-invert prose-sm sm:prose-base">
        <div className="space-y-2 not-prose">
          <span className="inline-flex items-center gap-2 px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            🔒 Privacy &amp; Security
          </span>
          <h1 className="text-3xl font-bold tracking-tight">개인정보 및 보안 정책</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            최종 업데이트: 2026-05-09
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">한 줄 요약</h2>
          <p className="text-zinc-700 dark:text-zinc-300">
            <strong>본 서비스는 사용자의 PDF, API 키, 변환 결과를 어떤 형태로도 수집·저장하지 않습니다.</strong>{" "}
            모든 처리는 사용자 브라우저에서 일어나며, LLM API 호출은 사용자 브라우저에서 직접
            제공사로 이루어집니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. 수집하지 않는 정보</h2>
          <ul className="list-disc pl-6 space-y-1 text-zinc-700 dark:text-zinc-300">
            <li>
              <strong>업로드된 PDF 파일</strong> — 본 서비스 서버로 전송되지 않습니다. 브라우저
              메모리에서만 처리되고 페이지를 새로고침하거나 닫으면 폐기됩니다.
            </li>
            <li>
              <strong>API 키</strong> — 사용자 브라우저의 localStorage 또는 sessionStorage 에만
              저장됩니다. 본 서비스 운영자는 이 값을 읽거나 전송받지 않습니다.
            </li>
            <li>
              <strong>변환 결과 마크다운</strong> — 본 서비스 서버에 저장되지 않습니다. 사용자가
              명시적으로 저장 옵션을 사용하지 않는 한 sessionStorage(탭 닫으면 폐기)에만 임시
              보관됩니다.
            </li>
            <li>
              <strong>개인 식별 정보</strong> — 회원가입·로그인 절차가 없어 이름·이메일·전화번호
              등을 수집하지 않습니다.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. 데이터 흐름</h2>
          <pre className="bg-zinc-100 dark:bg-zinc-900 rounded p-4 text-xs overflow-x-auto">{`[사용자 브라우저]
  PDF 업로드
    └─ PDF.js로 페이지별 PNG 이미지 변환 (브라우저 내부)
  API 키 입력
    └─ localStorage / sessionStorage 저장 (브라우저 내부)
  변환 시작
    └─ 페이지 PNG + 사용자 키 → LLM API (Anthropic / Google / OpenAI)
       (브라우저 → LLM 제공사. 본 서비스 서버 미경유)
  변환 결과
    └─ 브라우저에 표시 + 다운로드. 본 서비스 서버 미저장.`}</pre>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            본 서비스의 정적 자산(HTML/JS/CSS) 자체만 Vercel 글로벌 CDN에서 사용자 브라우저로
            전달됩니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. LLM 제공사 측 데이터 처리</h2>
          <p className="text-zinc-700 dark:text-zinc-300">
            변환 요청은 사용자가 선택한 LLM 제공사로 직접 전송됩니다. 각 제공사의 데이터 보관 및
            모델 학습 정책은 사용자가 직접 확인해야 합니다.
          </p>
          <ul className="list-disc pl-6 space-y-1 text-zinc-700 dark:text-zinc-300">
            <li>
              Anthropic (Claude):{" "}
              <a
                href="https://www.anthropic.com/legal/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                anthropic.com/legal/privacy
              </a>
            </li>
            <li>
              Google (Gemini):{" "}
              <a
                href="https://ai.google.dev/gemini-api/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                ai.google.dev/gemini-api/terms
              </a>
            </li>
            <li>
              OpenAI (GPT):{" "}
              <a
                href="https://openai.com/policies/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                openai.com/policies/privacy-policy
              </a>
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. 분석 도구</h2>
          <p className="text-zinc-700 dark:text-zinc-300">
            현재 본 서비스는 별도의 트래킹·분석 도구를 사용하지 않습니다. Vercel 호스팅 자체의
            기본 액세스 로그(IP, User-Agent 등)는 Vercel의 정책에 따라 운영됩니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. 사용자 책임</h2>
          <p className="text-zinc-700 dark:text-zinc-300">
            본 서비스는 변환 도구를 제공할 뿐이며, 변환하려는 PDF의 저작권, 변환 결과의 사용,
            발생하는 API 비용에 대한 모든 책임은 변환을 요청한 사용자 본인에게 있습니다. 첫 변환
            시 표시되는 동의 모달의 내용을 반드시 확인해 주세요.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. 오픈소스</h2>
          <p className="text-zinc-700 dark:text-zinc-300">
            본 서비스의 소스 코드는{" "}
            <a
              href="https://github.com/jkwon-startup/pdfconvert-web"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              GitHub
            </a>{" "}
            에서 공개되어 있습니다 (MIT 라이선스). 본 정책의 모든 주장은 코드로 검증 가능합니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. 문의</h2>
          <p className="text-zinc-700 dark:text-zinc-300">
            정책 관련 문의는{" "}
            <a
              href="https://github.com/jkwon-startup/pdfconvert-web/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              GitHub Issues
            </a>{" "}
            로 남겨주세요.
          </p>
        </section>

        <footer className="text-xs text-zinc-500 dark:text-zinc-500 text-center pt-6 border-t border-zinc-200 dark:border-zinc-800 mt-10">
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
            · TS² · MIT License
          </p>
        </footer>
      </main>
    </div>
  );
}
