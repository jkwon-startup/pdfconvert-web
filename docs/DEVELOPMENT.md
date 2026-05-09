# pdfconvert-web 개발 문서

| 항목 | 내용 |
|------|------|
| 작성일 | 2026-05-09 |
| 문서 버전 | v0.1 — MVP 출시 시점 |
| 프로젝트 버전 | 0.1.0 |
| 운영자 | [여행가J (권정선)](https://litt.ly/jkwon) — TS² / AITY |
| 레포 | https://github.com/jkwon-startup/pdfconvert-web |
| 라이브 도메인 | https://pdfconvert-web.vercel.app |
| 라이선스 | MIT |

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택](#2-기술-스택)
3. [아키텍처 / 데이터 흐름](#3-아키텍처--데이터-흐름)
4. [디렉터리 구조](#4-디렉터리-구조)
5. [주요 기능 명세](#5-주요-기능-명세)
6. [LLM Provider 어댑터](#6-llm-provider-어댑터)
7. [PPTX 처리 전략](#7-pptx-처리-전략)
8. [보안 / 프라이버시 설계](#8-보안--프라이버시-설계)
9. [개발 일정 회고 (D1~MVP)](#9-개발-일정-회고-d1mvp)
10. [알려진 한계 / 후속 작업](#10-알려진-한계--후속-작업)
11. [배포 / 운영](#11-배포--운영)
12. [기여 / 로컬 개발](#12-기여--로컬-개발)

---

## 1. 프로젝트 개요

### 한 줄 요약

> PDF·PPTX를 마크다운/텍스트로, 내 API 키로 직접. Claude · Gemini · GPT 골라서. 우리 서버 거치지 않고. 100% 무료.

### 핵심 컨셉

LLM Vision API 기반 PDF → Markdown 변환 웹서비스. **사용자가 자신의 LLM API 키(Anthropic/Google/OpenAI)를 직접 입력**해 사용하고, 변환 처리는 모두 사용자 브라우저에서 일어난다. 운영자(여행가J) 측 비용은 0원이며, 사용자는 자기 키로 직접 제공사에 비용을 지불한다.

### 1차 페르소나

- **API 키를 이미 보유한 디지털 워커**
  - 옵시디언/노션으로 노트하는 컨설턴트
  - GPT-4o로 마케팅 자동화하는 1인 창업가
  - Claude로 RAG 만드는 개발자
- **공통 행동**: PDF 자료를 받으면 LLM에 넣어 요약/검색/RAG. 마크다운 변환이 일상.
- **공통 심리**: "다른 SaaS 또 결제하기 싫다. 내 키로 직접 처리하고 싶다."

### 2차 페르소나

- **AI 학습자/커뮤니티 회원** (GPTers, 스타트업실험실 등 여행가J 운영 커뮤니티)
- 키는 발급했지만 직접 코드 짜기는 부담 — 무료 + 원클릭이 진입장벽 0

### 차별점

| 항목 | 우리 |
|------|------|
| API 키 모델 | BYO (서비스 비용 0) |
| Provider 선택 | Claude · Gemini · GPT 자유 전환 |
| 데이터 처리 위치 | **클라이언트(브라우저) only** — PDF·PPTX·키·결과 모두 |
| 가격 | 무료 (사용자가 LLM 제공사에 직접 지불) |
| 라이선스 | MIT 오픈소스 |
| 한국어 | 한글 PDF 인식률 높은 모델 우선 추천 |

---

## 2. 기술 스택

| 레이어 | 선택 |
|--------|------|
| 프레임워크 | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| 스타일 | [Tailwind CSS 4](https://tailwindcss.com) |
| UI 컴포넌트 | [shadcn/ui](https://ui.shadcn.com) (base-ui 기반) |
| 언어 | TypeScript 5 |
| 패키지 매니저 | npm |
| PDF 처리 | [pdfjs-dist](https://github.com/mozilla/pdf.js) 5.7.x — 클라이언트 PDF 렌더링 |
| PPTX 처리 | [jszip](https://stuk.github.io/jszip/) + [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) — 클라이언트 텍스트 추출 |
| LLM API | Anthropic Messages API · Google Gemini API · OpenAI Chat Completions API (모두 BYO Key) |
| 런타임 | Node.js 23.11 (호환: 20+) |
| 호스팅 | Vercel Hobby (정적 호스팅) |
| CI/CD | GitHub → Vercel 자동 배포 (main push → production / PR → preview) |
| 라이선스 | MIT |

### 의존성 정책

- 외부 LLM API는 **사용자 브라우저에서 직접 호출** — Vercel Function 미경유
- 정적 사이트 빌드만 Vercel CDN 통과
- LLM 라이브러리(`@anthropic-ai/sdk` 등) 사용하지 않고 `fetch()` 직접 호출 — 번들 크기 최소화 + Provider 호출 형태 명시화
- PDF·PPTX 라이브러리는 `await import()` 동적 import — 메인 청크 영향 없음

---

## 3. 아키텍처 / 데이터 흐름

### 전체 데이터 흐름

```
[사용자 브라우저]
  PDF 또는 PPTX 업로드
    ├─ PDF.js 로 페이지별 PNG 변환 (브라우저 내부)
    │   또는
    └─ JSZip + fast-xml-parser 로 슬라이드별 텍스트 추출 (브라우저 내부)
  
  Settings 모달에서 사용자가 API 키 입력
    └─ localStorage 또는 sessionStorage 저장 (브라우저 내부)
  
  변환 시작 (이용 약관 동의 게이트 통과 후)
    ├─ 페이지/슬라이드 단위로 LLM API 호출
    │   브라우저 → Anthropic / Google / OpenAI 직접
    │   (우리 서버 미경유)
    └─ 응답 마크다운 누적
  
  결과
    ├─ 합친 마크다운 표시 (textarea)
    ├─ sessionStorage 자동 캐시 (새로고침 보호)
    ├─ 복사 / .md 다운로드 / .txt 다운로드 (마크다운 → plain text 변환)
    └─ 본 서비스 서버 미저장
```

### BYO API Key 모델 — 보안 단언

1. API 키는 본 서비스 서버에 전송되지 않는다
2. PDF·PPTX 원본은 본 서비스 서버에 전송되지 않는다 (정적 자산만 Vercel CDN 통과)
3. 변환 결과(마크다운)는 본 서비스 서버에 저장되지 않는다
4. 본 서비스에 회원가입·로그인이 없어 개인 식별 정보를 수집하지 않는다

---

## 4. 디렉터리 구조

```
pdfconvert-web/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # 루트 레이아웃 + 한국어 메타데이터 + OG
│   │   ├── page.tsx                # 홈 (Hero + Converter + CTA + Footer)
│   │   ├── privacy/
│   │   │   └── page.tsx            # 데이터 처리 정책 (7개 섹션)
│   │   └── test/
│   │       └── d2/
│   │           └── page.tsx        # 검증용 임시 페이지 (직접 URL 접근)
│   ├── components/
│   │   ├── Converter.tsx           # 메인 변환 UI (Provider/Model 선택, 업로드,
│   │   │                           #              진행률, 결과)
│   │   ├── SettingsDialog.tsx      # 3사 API 키 입력 모달 + 저장 위치 선택
│   │   ├── TermsDialog.tsx         # 이용 약관 동의 모달 (1회 게이트)
│   │   ├── PptxToPdfGuideDialog.tsx # PPTX 업로드 시 PDF 변환 가이드 + 텍스트 폴백
│   │   └── ui/                     # shadcn/ui 컴포넌트 (base-ui 기반)
│   │       ├── accordion.tsx
│   │       ├── alert.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── progress.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── tabs.tsx
│   │       └── textarea.tsx
│   └── lib/
│       ├── keys.ts                 # API 키 보관 (localStorage / sessionStorage)
│       ├── terms.ts                # 약관 동의 상태 (localStorage)
│       ├── markdown-to-text.ts     # .txt 다운로드용 마크다운 → 텍스트 변환
│       ├── extractors/
│       │   └── pptx-text.ts        # PPTX → 슬라이드 텍스트 (jszip + xml-parser)
│       └── providers/
│           ├── types.ts            # ConvertInput union, ConvertParams, ConvertResult
│           ├── anthropic.ts        # Claude Messages API
│           ├── google.ts           # Gemini generateContent API
│           ├── openai.ts           # OpenAI Chat Completions API
│           └── index.ts            # convertWithProvider 라우터 + DEFAULT_PROMPT
├── docs/
│   └── DEVELOPMENT.md              # 본 문서
├── public/                         # 정적 자산 (favicon 등)
├── README.md                       # 사용자 대상 안내
├── LICENSE                         # MIT
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── components.json                 # shadcn 설정
└── .gitignore
```

---

## 5. 주요 기능 명세

### 5.1 API 키 관리 (`src/lib/keys.ts` + `SettingsDialog.tsx`)

- 3사(Anthropic / Google / OpenAI) 키를 각각 입력 가능
- 저장 위치 선택: **브라우저 저장(localStorage, 영구)** vs **세션만(sessionStorage, 탭 닫으면 폐기)**
- 모드 전환 시 다른 storage의 키를 자동 정리(중복 방지)
- 키 보이기/숨기기 토글, 모든 키 일괄 삭제 버튼
- 선택된 Provider/Model도 localStorage에 보관 → 재방문 시 복원

#### `keys.ts` 주요 API

```ts
getPersistMode(): "local" | "session"
setPersistMode(mode): void  // 모드 전환 시 storage 간 이동
getKey(provider): string    // session 우선, 없으면 local
setKey(provider, value): void
clearKey(provider): void
clearAllKeys(): void
getSelectedProvider(): Provider
setSelectedProvider(p): void
getSelectedModel(provider, fallback): string
setSelectedModel(provider, model): void
```

### 5.2 이용 약관 동의 게이트 (`src/lib/terms.ts` + `TermsDialog.tsx`)

- 첫 변환 시 1회 모달 노출 → 동의해야 변환 진행
- 4개 섹션: 📚 저작권 / 💰 API 비용 / 📊 결과 검수 / 🌐 데이터 처리
- 동의 시 localStorage에 기록 (`pdfconvert_terms_accepted_v1`)
- 변환 카드 상단에 항상 미니 경고 배너 노출 + "동의 철회" 링크
- 거절 시 변환 진행 X

### 5.3 PDF 변환 흐름

1. **업로드** — 드래그앤드롭 또는 파일 선택. `accept`에 `.pdf,.pptx` 모두 포함
2. **검증** — 확장자 + MIME으로 PDF/PPTX 구분
3. **PDF 메타 추출** — `pdfjs-dist` 동적 import → `getDocument({data:arrayBuffer})` → 페이지 수 + 1페이지 캔버스 미리보기
4. **변환 시작 클릭** — 약관 게이트 → 페이지별 순차 호출
5. **페이지별 변환** — `pageToBase64(N)` → `convertWithProvider(provider, {input:{kind:"image", imageBase64}, prompt, apiKey, model})`
6. **상태 추적** — `PageInfo[]` (num/status/markdown/error/elapsedMs); 페이지 카드(pending/converting/done/error)
7. **에러 처리** — 401/403은 즉시 중단(키 무효), 그 외는 다음 페이지 계속 진행
8. **재시도** — 실패한 페이지 카드 클릭 → 단일 페이지 재호출
9. **결과 합치기** — 옵션 토글에 따라 `## Page N` 헤더 삽입
10. **다운로드** — `.md` 원본 또는 `.txt` (마크다운 문법 제거된 plain text)

### 5.4 결과 sessionStorage 캐시

- 변환 완료 즉시 `pdfconvert_last_result_v1`에 자동 저장
- 저장 데이터: 페이지 결과 + 파일명 + 페이지 헤더 토글
- 새로고침해도 결과 복원 — PDF arrayBuffer는 의도적으로 저장 X (용량 + 프라이버시 균형)
- 복원 상태에서는 PDF 업로드 카드에 파란 안내 배너 노출 + "결과 지우기" 버튼
- 새 PDF 업로드 시 자동 클리어

### 5.5 다운로드 형식 (.md / .txt)

- `.md` — 마크다운 원본
- `.txt` — `markdownToPlainText()` 함수로 마크다운 문법 제거
  - `#` 헤더 제거
  - `**bold**`, `*italic*`, `` `code` `` 마커 제거
  - 표 → 탭 구분 텍스트 변환
  - 코드 펜스 제거(내용 유지)
  - 링크 `[text](url)` → text만
  - blockquote, 리스트 마커 제거
  - 연속 빈 줄 정리

### 5.6 Provider/Model 셀렉터

- Provider 탭(Claude/Gemini/GPT) — 등록된 키가 있으면 ✓, 없으면 ○
- 선택된 Provider의 모델 드롭다운 (페이지당 비용 힌트 포함)
- 모델별 권장값 표시 (`recommended: true`)

---

## 6. LLM Provider 어댑터

### 6.1 공통 인터페이스 (`src/lib/providers/types.ts`)

```ts
export type ConvertInput =
  | { kind: "image"; imageBase64: string }
  | { kind: "text"; slideText: string };

export interface ConvertParams {
  input: ConvertInput;
  prompt: string;
  apiKey: string;
  model: string;
  signal?: AbortSignal;
}

export type ConvertResult =
  | { ok: true; markdown: string }
  | { ok: false; status: number; error: string };
```

`ConvertInput`이 union이라 PDF 페이지(이미지)와 PPTX 슬라이드(텍스트)를 동일 인터페이스로 처리.

### 6.2 Anthropic — `src/lib/providers/anthropic.ts`

- 엔드포인트: `https://api.anthropic.com/v1/messages`
- 헤더:
  - `x-api-key: <user key>`
  - `anthropic-version: 2023-06-01`
  - `anthropic-dangerous-direct-browser-access: true` ← BYO 시나리오 공식 지원
- image 분기: `content`에 `image` part + text prompt
- text 분기: prompt + slide text를 단일 text part로 결합
- 모델: `claude-haiku-4-5` (권장), `claude-sonnet-4-6`, `claude-opus-4-7`, `claude-3-7-sonnet-latest`

### 6.3 Google Gemini — `src/lib/providers/google.ts`

- 엔드포인트: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key=...`
- 인증: URL 쿼리 파라미터 (`?key=...`)
- image 분기: `parts`에 `inline_data` (PNG base64) + text
- text 분기: 단일 text part
- 응답: `candidates[0].content.parts[].text` 합치기
- 모델: `gemini-2.5-flash` (권장), `gemini-2.5-pro`, `gemini-2.5-flash-lite`, `gemini-2.0-flash`

### 6.4 OpenAI — `src/lib/providers/openai.ts`

- 엔드포인트: `https://api.openai.com/v1/chat/completions`
- 헤더: `Authorization: Bearer <user key>`
- image 분기: `content`에 text + `image_url` (data URL)
- text 분기: 단일 text content
- 모델: `gpt-5-mini` (권장), `gpt-5`, `gpt-4o`, `gpt-4o-mini`

### 6.5 라우터 — `src/lib/providers/index.ts`

```ts
export async function convertWithProvider(
  provider: Provider,
  params: ConvertParams
): Promise<ConvertResult>;
```

내부 switch로 3개 어댑터 중 하나에 위임. exhaustive check로 신규 Provider 추가 시 컴파일 에러로 보호.

### 6.6 공통 프롬프트 (`DEFAULT_PROMPT`)

```
이 문서 페이지의 모든 텍스트를 Markdown 형식으로 추출해줘.
표는 Markdown 표로, 제목은 # ## ###으로,
원문 내용을 빠짐없이 그대로 옮겨줘.
설명이나 주석은 추가하지 마.
```

---

## 7. PPTX 처리 전략

### 7.1 결정의 배경

PDF 파이프라인을 그대로 재사용하려면 **".pptx → 슬라이드 PNG 이미지" 클라이언트 사이드 변환**이 필요한데, 조사 결과 OSS 라이선스 + 한글 폰트 + 차트/SmartArt 보존을 동시에 만족하는 npm 라이브러리가 없었다 (`pptx-preview`, `@kandiforge/pptx-renderer`는 라이선스 결격).

서버 사이드 LibreOffice 변환은 Vercel 무료 티어 50MB serverless 한도 초과 + 운영자 비용 발생으로 BYO 원칙에 위배. 따라서 다음 2-tier 전략을 채택했다.

### 7.2 Tier 1 — PDF 변환 안내 (필수)

`.pptx` 업로드를 감지하면 `PptxToPdfGuideDialog`를 띄워 **사용자가 PowerPoint/Keynote/Google Slides에서 PDF로 export 후 다시 업로드**하도록 안내. 이유:

- PDF export는 모든 주요 도구에서 1–2 클릭
- 폰트·이미지·차트·한글이 자체 렌더러로 보존됨 (우리가 어설프게 변환하는 것보다 압도적 품질)
- 우리 코드 변경 최소

가이드는 OS별 Accordion으로 macOS PowerPoint/Keynote, Windows PowerPoint, Google Slides 3가지 케이스를 안내.

### 7.3 Tier 2 — 클라이언트 텍스트 추출 폴백 (선택적)

PowerPoint를 못 여는 환경 또는 시각요소가 없는 단순 텍스트 PPT를 위해 **텍스트만 추출하는 폴백** 제공. 모달 안에 "텍스트만 추출 (시각요소 손실)" 버튼.

#### 구현 핵심 (`src/lib/extractors/pptx-text.ts`)

1. `JSZip.loadAsync()` 로 .pptx 압축 해제 (.pptx는 ZIP 컨테이너)
2. **슬라이드 순서 결정** — `ppt/presentation.xml`의 `<p:sldIdLst>` 순서 + `ppt/_rels/presentation.xml.rels`의 Target 매핑
   - ⚠️ 단순 알파벳 정렬은 `slide11.xml < slide2.xml` 함정 발생
3. 각 슬라이드 XML에서 텍스트 노드 수집:
   - `<a:t>` — 런 텍스트 (본문)
   - `<c:v>` — 차트 셀 값
   - `<dgm:t>` — SmartArt 텍스트
4. `<a:p>` 단위로 줄바꿈
5. 슬라이드별 plain text 배열 반환

#### Converter 통합

- `sourceMode: "pdf" | "pptx-text"` 상태로 입력 모드 분기
- `getPageInput(pageNum)` 헬퍼가 모드에 따라 `{kind:"image"}` 또는 `{kind:"text"}` 생성
- `runBatchConvert`와 `retryPage`는 동일 헬퍼를 통과
- 결과 마크다운 첫 줄에 안내 헤더 자동 삽입:
  ```md
  > ⚠️ 이 결과는 PPTX 텍스트 추출 모드로 생성되었습니다.
  > 이미지·차트·SmartArt 의 시각 정보는 포함되지 않습니다.
  > 더 정확한 변환을 원하시면 PowerPoint / Keynote / Google Slides 에서
  > PDF로 변환 후 다시 업로드해주세요.
  ```
- 헤더 옵션: PDF는 `## Page N`, PPTX는 `## Slide N`

### 7.4 알려진 한계

- 차트·SmartArt 내부 시각 구조는 평면화됨 (텍스트만 남음)
- 발표자 노트(`ppt/notesSlides/...`)는 v1에서 제외
- `.ppt` (구버전 binary) 미지원 — `.pptx`만

---

## 8. 보안 / 프라이버시 설계

### 8.1 핵심 단언 (Privacy 페이지에서도 명시)

1. PDF·PPTX 원본은 본 서비스 서버에 전송·저장되지 않는다
2. API 키는 본 서비스 서버에 전송·저장되지 않는다
3. 변환 결과는 본 서비스 서버에 저장되지 않는다
4. 본 서비스에 회원가입·로그인이 없다
5. LLM 호출은 사용자 브라우저에서 직접 (우리 서버 미경유)

### 8.2 사용자 책임 명시 (이용 약관 동의 게이트)

- **저작권** — 변환 PDF의 저작권은 사용자 책임. 본 서비스는 검증하지 않음
- **API 비용** — 사용자가 가입한 LLM 제공사에서 직접 청구. 본 서비스 미관여
- **결과 검수** — LLM 특성상 정확성 무보증. 중요한 문서는 사람의 검토 필요
- **데이터 처리** — PDF는 브라우저에서 처리, 사용자가 선택한 LLM API로 처리됨. 본 서비스 운영자는 PDF·키·변환 결과 미수집

### 8.3 보안 가이드라인

- **공용 PC**: Settings 모달의 "세션만(sessionStorage)" 옵션 권장 — 탭 닫으면 키 자동 폐기
- **신규 환경**: 약관 모달이 매번 다시 뜸 (localStorage 동의 기록 없으면)
- **Vercel 보안**: Vercel 호스팅 자체의 기본 액세스 로그(IP, User-Agent)는 Vercel 정책에 따라 운영. 본 서비스가 추가 수집하지 않음

### 8.4 외부 LLM 제공사 정책 (Privacy 페이지에 링크)

- Anthropic — https://www.anthropic.com/legal/privacy
- Google — https://ai.google.dev/gemini-api/terms
- OpenAI — https://openai.com/policies/privacy-policy

---

## 9. 개발 일정 회고 (D1~MVP)

기획서 v2의 1주 일정을 따라 D1~D7로 분할하여 진행. 모든 작업 같은 날(2026-05-09) 완료.

### D1 — 부트스트랩 + 첫 배포

| 작업 | 결과 |
|------|------|
| Next.js 16 + TypeScript + Tailwind 4 부트스트랩 | `create-next-app --turbopack --yes` |
| shadcn/ui 13개 컴포넌트 설치 | `accordion`, `alert`, `button`, `card`, `dialog`, `dropdown-menu`, `input`, `label`, `progress`, `select`, `separator`, `tabs`, `textarea` |
| Hello World 랜딩 페이지 | 한글 메타데이터 + OG 태그 |
| README + MIT LICENSE + .gitignore 보강 | |
| GitHub Public 레포 생성 | jkwon-startup/pdfconvert-web |
| Vercel 배포 + GitHub 자동 연동 | pdfconvert-web.vercel.app |

#### 발견된 이슈

- **한글 폴더명 빌드 실패**: `/Users/kwonjungsun/개인 개발/pdfconvert-web` 에서 Turbopack이 한글 경로를 처리 못해 `start byte index ... is not a char boundary` 에러 발생
- **해결**: `/Users/kwonjungsun/dev/pdfconvert-web` 영문 경로로 이동
- **shadcn Button asChild prop 미지원**: 최신 shadcn은 base-ui 기반이라 Radix Slot이 아닌 자체 API 사용. `<Button asChild>` 대신 `<a className={cn(buttonVariants(...))}>` 패턴으로 우회

### D2 — 최소 검증 테스트 (게이트)

본 구현 진입 전 위험 제거를 위한 3종 테스트.

| # | 테스트 | 결과 |
|---|--------|------|
| 1 | PDF.js로 1페이지 → PNG base64 (브라우저) | ✅ |
| 2 | Claude API 브라우저 직접 호출 + CORS 검증 | ✅ |
| 3 | 1페이지 마크다운 정상 출력 | ✅ |

`/test/d2` 라우트로 사이트에 임시 검증 페이지 배포 → 사용자가 자기 키 + 샘플 PDF로 직접 검증 → 3종 모두 통과로 D3 진입 결정.

#### 검증된 결정사항

- `anthropic-dangerous-direct-browser-access: true` 헤더로 Claude 브라우저 직접 호출 가능 → CORS 폴백(Vercel Edge Function 프록시)이 v1에 필요 없음
- PDF.js worker는 jsdelivr CDN(`pdfjs-dist@{version}/build/pdf.worker.min.mjs`)로 동적 로드 — public/에 worker 복사하지 않아도 OK

후일 확장: `/test/d2`는 1페이지 검증에서 → "전체 페이지 변환 가능"으로 확장 (재시도/다운로드 포함). MVP 검증 도구로 유지.

### D3 — 본 UI (3사 통합)

| 작업 | 산출물 |
|------|--------|
| 3사 LLM 통합 라이브러리 | `src/lib/providers/{anthropic,google,openai,index,types}.ts` |
| API 키 저장 유틸 | `src/lib/keys.ts` (localStorage/sessionStorage 토글) |
| Settings 모달 | `src/components/SettingsDialog.tsx` (3사 키 + 저장 위치 선택) |
| Converter 컴포넌트 | `src/components/Converter.tsx` (Provider 탭 + Model 셀렉터 + 드래그앤드롭 + 페이지 카드 + 진행률 + 결과) |
| 홈 정식 UI 전환 | `src/app/page.tsx` 재작성 |

### 라운드 0 — 이용 약관 동의 게이트

사용자 피드백: "서비스가 저작권 검증할 수 없으니 사용자에게 명확한 경고 + 책임 전가 후 진행"

→ **1회 동의 모달 + 변환 카드 상단 항상 보이는 미니 경고** 패턴 도입.

| 산출물 | 내용 |
|--------|------|
| `src/lib/terms.ts` | 동의 상태 localStorage 보관 (versioned key) |
| `src/components/TermsDialog.tsx` | 4섹션 동의 모달 (📚저작권 / 💰비용 / 📊검수 / 🌐데이터) |
| Converter 통합 | 변환 시작 클릭 → 미동의 시 모달 → 동의 후 즉시 변환 |
| 미니 경고 배너 | 변환 카드 상단 항상 표시 + "동의 철회" 링크 |

### 라운드 1 — UX 개선 5종

| 항목 | 내용 |
|------|------|
| 다운로드 형식 (.md / .txt) | `markdownToPlainText` 유틸 + 두 버튼 분리 |
| 결과 sessionStorage 캐시 | 새로고침 시 자동 복원 + 안내 배너 |
| 헤더 정리 | `/test/d2` 링크 제거, Privacy 추가 |
| `/privacy` 페이지 | 7섹션 데이터 처리 정책 |
| README 갱신 | D1 부트스트랩 텍스트 → 본 기능 + 모델 비용 표 |

### 라운드 2 — 카피 정제

사용자 피드백 반영:
- "영구 저장" → "브라우저 저장" (직관적)
- "결과 무보증" → "결과 검수" (능동적 표현)
- "데이터 처리" 본문 간결화
- 변환 카드 미니 경고 문구 능동형 한 문장으로 재작성
- 헤더에서 GitHub 링크 제거 (Privacy만)

### 라운드 3 — PPTX 지원 + 푸터/CTA

| Phase | 내용 |
|-------|------|
| Phase A | 푸터에서 TS² + GitHub 삭제. Converter ↔ Footer 사이에 CTA 섹션(KakaoTalk 단톡 + 여행가J 프로필) 추가 |
| Phase B | `.pptx` 업로드 감지 + `PptxToPdfGuideDialog` (3 OS 가이드 Accordion) |
| Phase C | jszip + fast-xml-parser 도입 + `pptx-text.ts` 추출기 + ConvertInput union + 3사 어댑터 text 분기 |
| Phase D | 빌드 + push → Vercel 자동 배포 |

#### 핵심 결정

- 클라이언트 사이드 .pptx → 슬라이드 이미지 렌더링은 OSS + 한글 + 충실도 동시 만족 라이브러리 부재 → **PDF export 안내 + 텍스트 폴백** 2-tier 전략
- ConvertParams의 `imageBase64` 단일 필드를 `ConvertInput` discriminated union으로 확장 — 향후 docx 등 추가 modality 대응 가능

---

## 10. 알려진 한계 / 후속 작업

### 알려진 한계

| 영역 | 한계 | 비고 |
|------|------|------|
| PPTX 텍스트 모드 | 차트/SmartArt 시각 구조 평면화, 이미지 정보 손실 | UI에 안내 헤더 자동 삽입으로 명시 |
| PPT 구버전 (.ppt binary) | 미지원 | `.pptx` (OOXML)만 |
| 발표자 노트 | v1에서 제외 | `ppt/notesSlides/...` 별도 처리 필요 |
| 큰 PDF | 50페이지 초과 시 브라우저 메모리 부담 | UI에 권장 표기 |
| LLM rate limit | 자동 백오프 미구현 | 페이지 단위 수동 재시도만 |
| 표 페이지 넘김 | PDF에서 표가 페이지 경계로 잘림 | 다음 페이지 컨텍스트 전달은 v2 |
| OG 이미지 | 정적 favicon만 사용 | SNS 공유 미리보기 미흡 |
| Edge Function 프록시 | 미구현 (CORS 폴백) | 실제 CORS 실패 발견 시 추가 |

### 후속 작업 후보 (우선순위 순)

1. **에러 메시지 친화화** — 401/403/429별 한국어 안내, 자동 백오프(429)
2. **마크다운 렌더 미리보기** — `react-markdown` 추가, textarea ↔ 렌더 토글
3. **OG 이미지** — `@vercel/og` 동적 생성 또는 정적 PNG
4. **다크모드 명시 토글** — 현재 OS 자동 따라감만
5. **Playwright 자동화 테스트** — 키 입력 → 업로드 → 변환 → 다운로드 시나리오
6. **Lighthouse 점수 90+ 검증**
7. **`/about` 페이지** — TS² / 여행가J 소개 (현재는 외부 litt.ly 링크만)
8. **변환 동시성** — 현재 순차, 병렬 호출(N=2~3)로 속도 개선 + rate limit 안전장치
9. **커스텀 프롬프트** — 고급 사용자가 변환 프롬프트 직접 작성 (옵션)
10. **PPTX 발표자 노트 옵션** — 토글로 본문 + 노트 함께 추출
11. **`/test/d2` 정리 또는 제거** — 본 UI 검증 완료, 보존 가치 검토

---

## 11. 배포 / 운영

### CI/CD

- GitHub `main` 브랜치 push → Vercel production 자동 배포
- Pull Request → Vercel preview 자동 배포
- Vercel CLI로도 배포 가능 (`npx vercel --prod`)

### 도메인

- Production: `pdfconvert-web.vercel.app` (Vercel alias)
- Per-deployment URL: `pdfconvert-{hash}-jkwon-startups-projects.vercel.app`
- 향후 커스텀 도메인 가능 (TS² 서브도메인 등)

### 빌드 명령

```bash
npm run dev    # 로컬 개발 (Turbopack)
npm run build  # 프로덕션 빌드
npm run start  # 빌드 결과 실행
npm run lint   # ESLint
```

### 배포 검증

```bash
curl -sI https://pdfconvert-web.vercel.app/      # HTTP 200
curl -s https://pdfconvert-web.vercel.app/ | grep -oE "(BYO API Key|Provider)"
```

### 모니터링

- Vercel 대시보드에서 deployment 상태/로그 확인
- 별도 분석 도구 없음 (Privacy 정책에 명시)
- 사용자 피드백은 GitHub Issues 또는 KakaoTalk 단톡

### 비용

- **운영자 측**: Vercel Hobby (무료) + GitHub Public (무료) = **0원**
- **사용자 측**: 자기 LLM 키 사용분만 LLM 제공사에 직접 지불

---

## 12. 기여 / 로컬 개발

### 환경 요구

- Node.js 20 이상 (개발 환경 23.11 검증)
- npm
- Git

### 로컬 셋업

```bash
git clone https://github.com/jkwon-startup/pdfconvert-web.git
cd pdfconvert-web
npm install
npm run dev
```

`http://localhost:3000` 접속.

### 새 Provider 추가 예시

1. `src/lib/providers/{newprovider}.ts` 생성
   - `ProviderInfo` 정의 (id, name, models, defaultModel, consoleUrl)
   - `convert{Newprovider}(params: ConvertParams): Promise<ConvertResult>` 구현
2. `src/lib/providers/index.ts`의 `PROVIDERS`, `PROVIDER_LIST`에 추가
3. `convertWithProvider` switch에 case 추가 (exhaustive check가 미적용 시 컴파일 에러로 안내)
4. `Provider` 타입(`types.ts`)에 id 추가

### 새 Extractor 추가 예시 (예: docx)

1. `src/lib/extractors/{type}.ts` — 파일 → 페이지/단위 텍스트 또는 이미지 추출
2. Converter `handleFile`에 확장자 분기 추가
3. 필요시 새 모달(`{Type}GuideDialog`) 도입
4. `sourceMode` 상태 확장

### 코드 스타일

- TypeScript strict mode
- 비식별자 한글 코드 주석 OK (운영자 한국어 사용자 대상)
- ESLint 기본 규칙 (Next.js eslint-config)
- Tailwind 클래스는 `cn()` 유틸로 조건부 결합 (`src/lib/utils.ts`)

---

## 부록: 마일스톤 커밋 로그

| 커밋 | 내용 |
|------|------|
| `bc72090` | (기존 Obsidian) 강의 슬라이드 87페이지 — 본 프로젝트와 무관 |
| `88ae2d8` | chore: bootstrap Next.js 16 + Tailwind + shadcn/ui (D1) |
| `e8abff7` | feat(d2): add /test/d2 minimal verification page |
| `2c4d599` | feat(home): primary CTA → /test/d2, GitHub demoted to secondary |
| `5ca84b8` | feat(home): remove GitHub CTA button per user request |
| `2f5cfb4` | feat(d2): expand to full-document batch conversion |
| `c1cbb19` | feat(d3): full home UI with 3-provider support |
| `37b89f4` | feat(legal): 1-time terms acknowledgment gate + persistent mini warning |
| `15fc60e` | feat: round-1 priorities (download formats, result cache, /privacy, README) |
| `70cc5dd` | copy: refine modal labels per user feedback |
| `95abe9f` | copy: refine header nav and responsibility wording |
| `188c77f` | feat: PPTX support + footer cleanup + community CTA |

---

**문서 끝.**
다음 변경 시 본 문서도 함께 갱신 필요. 큰 기능 추가나 아키텍처 변경 시 섹션 9(개발 일정 회고)에 라운드 추가.
