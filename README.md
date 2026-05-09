# pdfconvert-web

> PDF를 마크다운으로, 내 API 키로 직접. Claude · Gemini · GPT 골라서. 우리 서버 거치지 않고. 100% 무료.

LLM Vision API 기반 PDF → Markdown 변환 웹서비스입니다. 사용자가 자신의 LLM API 키(Anthropic / Google / OpenAI)를 직접 입력해 사용하며, PDF 처리·LLM 호출이 모두 사용자 브라우저에서 일어납니다.

🔗 **[pdfconvert-web.vercel.app](https://pdfconvert-web.vercel.app)**

## ✨ 주요 특징

- **BYO API Key** — Anthropic / Google / OpenAI 중 골라서 자기 키로 사용
- **3사 자유 전환** — 모델별 페이지당 비용 힌트 표시, Provider 탭으로 즉시 전환
- **클라이언트 사이드 처리** — PDF는 PDF.js로 브라우저에서 페이지별 이미지 변환, LLM 호출도 브라우저에서 직접 (우리 서버 미경유)
- **이용 동의 게이트** — 첫 변환 시 1회 약관 모달 (저작권/비용/무보증/데이터 처리 4개 섹션) → 동의 후 책임 사용자에게 명시
- **결과 자동 캐시** — 변환 결과는 sessionStorage 에 보관되어 새로고침해도 복원
- **다중 출력 형식** — `.md` (마크다운 원본) / `.txt` (plain text) 다운로드
- **페이지별 진행률 + 재시도** — 페이지 단위 상태 표시, 실패 페이지 클릭으로 즉시 재시도
- **100% 오픈소스** — MIT 라이선스

## 🚀 사용 방법

1. [pdfconvert-web.vercel.app](https://pdfconvert-web.vercel.app) 접속
2. **변환 엔진** 카드 → **⚙ API 키 설정** 클릭 → 사용할 LLM 제공사의 키 입력
3. **PDF 업로드** 카드에 PDF 드래그앤드롭 (또는 클릭하여 선택)
4. Provider/Model 선택
5. **변환 시작** → 첫 사용자라면 약관 동의 모달 → 자동 변환
6. 진행률 확인, 실패 페이지는 클릭해서 재시도
7. 결과 마크다운을 `.md` 또는 `.txt` 형식으로 다운로드

## 🤝 지원 모델 (2026-05 기준)

| Provider | 모델 ID | 페이지당 추정 |
|----------|---------|---------------|
| Anthropic | `claude-haiku-4-5` (권장) | ~$0.005 |
| Anthropic | `claude-sonnet-4-6` | ~$0.015 |
| Anthropic | `claude-opus-4-7` | ~$0.05 |
| Google | `gemini-2.5-flash` (권장) | ~$0.001 |
| Google | `gemini-2.5-pro` | ~$0.01 |
| Google | `gemini-2.5-flash-lite` | ~$0.0005 |
| OpenAI | `gpt-5-mini` (권장) | ~$0.005 |
| OpenAI | `gpt-5` | ~$0.03 |
| OpenAI | `gpt-4o` | ~$0.005 |
| OpenAI | `gpt-4o-mini` | ~$0.001 |

비용은 표준 PDF 페이지(약 1500–2000 input tokens + 500–1500 output tokens) 기준 추정값입니다.

## 🛠️ 로컬 개발

```bash
git clone https://github.com/jkwon-startup/pdfconvert-web.git
cd pdfconvert-web
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) 접속.

### 기술 스택

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- [Tailwind CSS 4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com) (base-ui 기반)
- [pdfjs-dist](https://github.com/mozilla/pdf.js) — 클라이언트 PDF 렌더링
- LLM API — Anthropic / Google Gemini / OpenAI (전부 BYO Key, 브라우저 직접 호출)

### 디렉터리 구조

```
src/
├── app/
│   ├── page.tsx              # 홈 (변환 UI)
│   ├── privacy/page.tsx      # 데이터 처리 정책
│   └── test/d2/page.tsx      # 검증용 임시 페이지 (직접 URL 접근)
├── components/
│   ├── Converter.tsx         # 변환 메인 UI
│   ├── SettingsDialog.tsx    # API 키 설정 모달
│   ├── TermsDialog.tsx       # 이용 약관 동의 모달
│   └── ui/                   # shadcn/ui 컴포넌트
└── lib/
    ├── keys.ts               # API 키 보관 (localStorage / sessionStorage)
    ├── terms.ts              # 약관 동의 상태
    ├── markdown-to-text.ts   # .txt 다운로드용 변환
    └── providers/            # 3사 LLM API 어댑터
```

## 🔐 보안 / 프라이버시

- API 키는 사용자 브라우저 localStorage 또는 sessionStorage 에만 저장 (Settings 모달에서 모드 선택)
- PDF·변환 결과는 우리 서버에 전송·저장되지 않음 (정적 자산만 Vercel CDN 통과)
- LLM 호출은 사용자 브라우저에서 LLM 제공사 API 로 직접 (우리 서버 미경유)
- 변환 결과는 sessionStorage 에만 임시 보관 (탭 닫으면 자동 폐기)

자세한 내용은 라이브 사이트의 [Privacy](https://pdfconvert-web.vercel.app/privacy) 페이지 참조.

## ⚖️ 면책 조항

- 변환하려는 PDF의 **저작권**은 사용자 본인이 보유하거나 합법적 사용 권한이 있어야 합니다. 본 서비스는 저작권 검증을 수행하지 않습니다.
- 변환 과정에서 발생하는 **API 비용**은 사용자 본인이 부담합니다.
- LLM 특성상 **변환 결과의 정확성**은 보장되지 않습니다.
- 본 서비스 사용으로 인한 모든 책임은 변환을 요청한 사용자 본인에게 있습니다.

## 📜 라이선스

MIT — [LICENSE](./LICENSE) 참조

## 👤 운영

[여행가J](https://litt.ly/jkwon) (TS² / AITY) 운영. Issues / Pull Requests 환영합니다.
