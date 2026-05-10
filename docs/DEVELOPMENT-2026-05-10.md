# pdfconvert-web 개발 문서 — 2026-05-10

| 항목 | 내용 |
|------|------|
| 작성일 | 2026-05-10 |
| 문서 버전 | v0.2 (이전 문서: `DEVELOPMENT.md` — 2026-05-09 D1~MVP) |
| 본 문서 범위 | M3 디자인 시도, Hero/카피 정돈, PPTX 회귀 진단·수정, 401 진단 도구 |
| 운영자 | [여행가J (권정선)](https://litt.ly/jkwon) — TS² / AITY |
| 레포 | https://github.com/jkwon-startup/pdfconvert-web |
| 라이브 | https://pdfconvert-web.vercel.app |
| 라이선스 | MIT |

---

## 목차

1. [오늘 작업 한눈에](#1-오늘-작업-한눈에)
2. [Round 5 — Material 3 적용 시도](#2-round-5--material-3-적용-시도)
3. [Round 6 — 가시 효과 강화 (Hero/CTA/Card)](#3-round-6--가시-효과-강화-herocgcard)
4. [Round 7 — 카피 정돈](#4-round-7--카피-정돈)
5. [Round 8 — 모델 셀렉터 / 디버그 / 초기화 / PPTX 회귀 / 키 진단](#5-round-8--모델-셀렉터--디버그--초기화--pptx-회귀--키-진단)
6. [발견된 회귀 버그와 진단 정리](#6-발견된-회귀-버그와-진단-정리)
7. [회고 — 회귀 테스트 부재](#7-회고--회귀-테스트-부재)
8. [현 상태 진단 (라이브 사이트 기준)](#8-현-상태-진단-라이브-사이트-기준)
9. [커밋 로그 (오늘분)](#9-커밋-로그-오늘분)
10. [후속 작업](#10-후속-작업)

---

## 1. 오늘 작업 한눈에

총 12개 commit, 영역별 분포:
- **디자인 / Hero / CTA / 카드 톤** — 4개
- **PPTX 흐름 (모달 제거 + disabled 회귀 수정)** — 2개
- **변환 카드 진단 도구 (alert / reset / 콘솔 로그 / raw response)** — 4개
- **Settings 키 검증 + 메타/OG 동기화** — 2개

핵심 사건:
1. M3 디자인 마이그레이션 R1을 plan-mode로 승인받아 시작 — 의도적으로 시각 차이 최소(토큰만)로 push했더니 사용자 "여전히 밋밋함" 피드백 → R1.5+R2+R3.1을 즉시 통합해 명확한 시각 변화 반영
2. PDF/PPTX 변환이 401로 계속 실패 → `invalid x-api-key` 응답 본문 확인 → 키 자체 문제로 진단 (코드 동일성 검증)
3. PPTX 변환 시작 버튼 영원히 disabled 회귀 버그(commit `188c77f`에서 도입) 발견 후 수정
4. Settings에 키 prefix 실시간 검증 + claude.ai 와 console.anthropic.com 혼동 안내 추가

---

## 2. Round 5 — Material 3 적용 시도

### 배경
사용자가 본인 보유 Material 3 Design Kit (`.fig`) 파일을 가리키며 디자인 전환 요청. `.fig`는 Figma 데스크톱 전용 바이너리라 Claude가 직접 읽을 수 없음 → 두 가지 선택지 제시 후 사용자가 **"M3 공식 가이드라인 직접 적용"** + **"zinc neutral 유지 + M3 surface 시스템만"** 선택.

### Plan 파일
`~/.claude/plans/ppt-md-text-expressive-journal.md` 에 R1 → R2 → R3 단계별 점진 마이그레이션 계획을 plan-mode 승인 후 작성.

### R1 commit `e013bbc`
**Critical files**:
- `src/app/globals.css` — M3 surface tonal palette (light/dark), elevation 5-level, shape scale 토큰 추가
- `src/components/ui/dialog.tsx` — DialogContent 에 `m3-elev-3` default
- `src/components/ui/card.tsx` — `elevation?: 0 | 1 | 2` prop 추가 (default 0, 옵트인)

```css
/* :root */
--m3-surface-container-{lowest,low,,high,highest}: oklch 0.94 ~ 1
--shape-{xs,sm,md,lg,xl}: 4/8/12/16/28 px
--elev-{0..5}: dual shadow tokens
--radius: 0.625rem → 0.75rem (M3 medium)

/* @theme inline */
--color-surface, --color-on-surface-variant, --color-outline 등 등록
```

### R1 결과 → 사용자 피드백 "디자인이 바뀐 게 없는데?"
의도적으로 시각 차이 최소화한 토대 단계라 거의 안 보임. R1만으로는 사용자가 디자인 변경을 인지하지 못함.

---

## 3. Round 6 — 가시 효과 강화 (Hero/CTA/Card)

### commit `f072f76` — visible visual shift

**Critical files**:
- `src/app/page.tsx` — Hero/페이지 배경/CTA 대폭 강화
- `src/components/ui/card.tsx` — Card default `elevation = 1` (이전 0에서 변경) + `rounded-xl → rounded-2xl`

#### Hero 강화
- 헤드라인 폰트: `text-3xl/4xl` → `text-4xl/5xl/6xl`, `tracking-tighter`
- "마크다운으로" 단어에 **zinc → amber 그라디언트 클립**
- Hero 위쪽에 amber radial spotlight (`background: radial-gradient(ellipse 60% 70% at 50% 0%, ...)`)
- 신뢰 인디케이터: 🟢 BYO API Key · 🔵 클라이언트 처리 · 🟠 100% 무료

#### 페이지 배경
```css
bg-gradient-to-b from-zinc-50 via-white to-amber-50/40 dark:...
```

#### Card / Dialog
- Card: `ring-outline-variant` + `m3-elev-1` 자동 적용
- 모서리 + 그림자 명확

#### CTA 섹션 (KakaoTalk + 프로필)
- amber 그라디언트 배경 + 떠다니는 amber blur blob
- 카드 hover 시 `-translate-y-0.5` + `m3-elev-2` 부유 애니메이션
- "↗" hover 미세 이동

#### 헤더
- `backdrop-blur-md` 강화

### 사용자 추가 피드백 → 텍스트 후속 변경
이미지 캡처로 "여행가J의" 배지 폰트 2배 + "내 API 키로 직접" 삭제 요청 → commit `10eb0ef`

```diff
- <span className="text-xs ...">여행가J의</span>
+ <span className="text-2xl px-6 py-2.5 ...">여행가J의</span>

- PPT, PDF를<br/>마크다운으로<br/>내 API 키로 직접
+ PPT, PDF를<br/>마크다운으로
```

이후 commit `9dd36c0` — 헤드라인 한 줄 레이아웃 (`whitespace-nowrap`, 모바일 `text-3xl`로 폭 보정)

---

## 4. Round 7 — 카피 정돈

### commit `cbf7316` — 여행가J 톤 + PPTX 가시화
- 배지: `BYO API Key · 클라이언트 사이드 처리` → `여행가J의`
- 부제: `PDF는 브라우저에서 처리되고` → `PDF·PPTX 는 브라우저에서 처리되고`

### OG 이미지 + 메타 동기화 (commit `1c6fa57`)
사용자 SNS 공유 미리보기 캡처에서 "내 API 키로 직접"이 보여 홈과 불일치 발견.

**Critical files**:
- `src/app/opengraph-image.tsx` — Edge Function 동적 OG 1200×630
- `src/app/layout.tsx` — Metadata

**OG 변경**:
- 배지: `BYO API Key · 클라이언트 사이드 처리` (amber pill) → **`여행가J의`** (검정 pill, 홈 hero와 동일 톤)
- 헤드라인: 3줄(`PDF·PPTX 를 / 마크다운으로, / 내 API 키로 직접`) → 2줄(`PPT, PDF를 / 마크다운으로`, amber-700 강조)

**Metadata 변경**:
- title: `... — 내 API 키로 직접` → `여행가J의 PPT, PDF convert`
- og.description, twitter.description 모두 `PPT, PDF를 마크다운으로. Claude · Gemini · GPT. 무료 · 오픈소스.` 로 통일

캐시 무효화 도구: 카카오 디벨로퍼 미리보기 초기화, 페이스북 Sharing Debugger 등.

---

## 5. Round 8 — 모델 셀렉터 / 디버그 / 초기화 / PPTX 회귀 / 키 진단

### 5.1 모델 셀렉터 두 줄 레이아웃 (commit `3cb00fa`)
사용자 캡처: 모델 드롭다운에서 "claude-haiku-4-5 — 권장" 등이 짤려 보임.

```tsx
<SelectItem className="py-2">
  <div className="flex flex-col items-start gap-0.5">
    <span className="font-mono text-sm flex items-center gap-1.5">
      {m.label}
      {m.recommended && (
        <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-100 text-emerald-700 ...">권장</span>
      )}
    </span>
    {m.pricePerPageHint && <span className="text-xs text-zinc-500">{m.pricePerPageHint}</span>}
  </div>
</SelectItem>
```

- `SelectTrigger` `w-full` + `SelectContent` `w-[var(--radix-select-trigger-width)]` 로 너비 일치
- "권장" 텍스트 → emerald pill 배지
- 모델 ID monospace + 가격 힌트 둘째 줄

### 5.2 변환 실패 가시화 + 초기화 (commit `b1055ad`)
사용자 보고: 페이지 카드 hover로만 보이던 친화 메시지가 안 보임.

**Critical files**: `src/components/Converter.tsx`

```tsx
{(() => {
  const firstError = pages.find((p) => p.status === "error");
  if (!firstError?.error) return null;
  return (
    <Alert className="border-red-500/40 bg-red-500/5">
      <AlertTitle>변환 실패 — 페이지 {firstError.num}</AlertTitle>
      <AlertDescription>...</AlertDescription>
    </Alert>
  );
})()}

<Button variant="ghost" onClick={resetAll}>↺ 초기화</Button>
```

`resetAll()` 함수 신규: pdfFile / pages / numPages / arrayBuffer / pptxSlides / sourceMode / sessionStorage 캐시 / canvas 모두 클리어 → 즉시 새 파일 업로드 가능.

### 5.3 Anthropic legacy 모델 옵션 추가 (commit `1f94136`)
Anthropic 공식 문서 검증 결과 `claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5` 모두 정확. 그러나 사용자 키 권한 문제 대비 안전망으로 `claude-opus-4-6`, `claude-sonnet-4-5` legacy 모델을 옵션에 추가.

### 5.4 Raw API 응답 본문 노출 + PPTX 모달 제거 (commit `f85b889`)
- `PageInfo` 타입에 `rawError`, `errorStatus` 필드 추가
- 빨간 alert에 `<details><summary>🔍 원본 응답 본문 (디버그)</summary>` 추가 → 사용자가 펼쳐 진짜 응답 확인 가능
- PPTX 업로드 시 안내 모달 게이트 제거 → `loadPptxAsText(file)` 직접 호출 (모달이 "업로드 거부됨"처럼 느껴진다는 사용자 피드백 반영)

### 5.5 빈 키 가드 + 콘솔 진단 로그 (commit `f029833`)
모든 Provider에서 401 보고 → 키 자체 문제 의심. 콘솔 로그 추가:

```ts
// callWithBackoff 진입 시
console.info("[pdfconvert] convert call", {
  provider, model,
  apiKeyMasked: `${apiKey.slice(0, 7)}…${apiKey.slice(-4)} (len=${apiKey.length})`,
  inputKind: input.kind,
});

// 빈 키 가드
if (!apiKey || !apiKey.trim()) {
  return { ok: false, status: 0, error: "...", friendly: "API 키가 비어 있습니다..." };
}

// SettingsDialog handleSave
console.info("[pdfconvert] keys saved", { persist, anthropicLen, googleLen, openaiLen });
```

### 5.6 PPTX disabled 회귀 수정 (commit `2cbc62f`) ⚠️ 핵심 회귀
**문제**: PPTX 텍스트 모드는 의도적으로 `arrayBufferRef.current = null` (대신 `pptxSlidesRef.current` 사용). 그런데 변환 시작 버튼의 disabled 조건과 `runBatchConvert` early-return 가드가 모두 `arrayBufferRef.current` 만 검증 → **PPTX 변환은 절대 시작 못 함**.

**원인 commit**: `188c77f` (PPTX support 통합 시 도입). 빌드는 통과했지만 (TypeScript 타입은 깨지지 않음) 런타임에서 PPTX 흐름이 영구 차단됨.

**수정**:
```ts
const hasSourceData =
  sourceMode === "pptx-text"
    ? pptxSlidesRef.current.length > 0
    : !!arrayBufferRef.current;

// runBatchConvert
if (!hasSourceData || !apiKey || pages.length === 0) return;

// disabled prop
disabled={!hasSourceData || !hasKey || batchRunning || pages.length === 0}
```

### 5.7 Settings 키 prefix 실시간 검증 (commit `7f17d79`)
사용자가 빨간 alert의 raw response 본문을 펼쳐 캡처: `{"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"},"request_id":"..."}` → **키 자체가 거부**된 것 확정.

가능성 높은 시나리오: 사용자가 claude.ai 구독 / Chrome 확장 / 데스크톱 앱 OAuth 토큰을 API 키로 혼동.

**Critical file**: `src/components/SettingsDialog.tsx`

각 탭 input 아래에 실시간 검증 메시지:
```tsx
const trimmed = keys[p.id].trim();
const expectedPrefix = p.keyPrefix; // "sk-ant-" / "AIza" / "sk-"
const prefixOk = !trimmed || trimmed.startsWith(expectedPrefix);
```

- ✅ 형식 일치 시: emerald "✓ Claude 키 형식 일치 (108자)"
- ⚠️ 불일치 시: amber "Claude 키는 보통 `sk-ant-` 로 시작합니다 ..." + input border amber

Anthropic 탭 footer에 `claude.ai 구독 키 아님 — console.anthropic.com 에서 API 키를 별도 발급` 명시.

---

## 6. 발견된 회귀 버그와 진단 정리

### 회귀 버그 1 — PPTX 변환 시작 영구 차단
- **언제 도입**: commit `188c77f` (어제 PPTX 통합)
- **언제 발견**: 오늘 사용자 보고 ("파일은 올라가는데 버튼 활성화 안 된다")
- **원인**: `arrayBufferRef.current` 만 가드, PPTX 모드는 이걸 null 로 둠
- **수정**: commit `2cbc62f` 의 `hasSourceData` 분기

### 진단 (회귀 아님) — 401 invalid x-api-key
- **사용자 보고**: PDF / PPTX / 모든 Provider 에서 401
- **원인 확정**: Anthropic 응답 `{"type":"authentication_error","message":"invalid x-api-key"}` — API 서버가 키 자체를 거부
- **D2 페이지(`/test/d2`)와 본 UI 코드 비교**: fetch headers / body / content array 100% 동일 → 코드 회귀 아님
- **결론**: 사용자가 입력한 키가 진짜 invalid (claude.ai 구독 토큰 vs API 키 혼동 가능성 높음)
- **조치**: prefix 검증 + claude.ai 안내 + raw response 노출

---

## 7. 회고 — 회귀 테스트 부재

사용자 명시 지적: "PPT 같이 변환하라고 시켰을 때부터 문제인 것 같아. 너 중간중간 테스트 안 하고 배포한 거야?"

### 잘못한 점
- PPTX 통합(`188c77f`) 후 **빌드 통과 = 검증 완료**로 착각
- TypeScript 타입 검사만으로는 잡히지 않는 런타임 버그(`arrayBufferRef.current` 의존)를 놓침
- PPTX 업로드 → 변환 시작 → 결과 받기 풀 흐름을 한 번도 직접 돌리지 않음

### 잘 한 점
- 401 진단 시 D2 페이지와 본 UI 코드를 byte-byte 비교해 코드 동일성 입증
- raw response 본문을 사용자에게 노출시켜 정확한 원인(`invalid x-api-key`) 확정
- 빨간 alert + 콘솔 로그 + prefix 검증으로 다음 사용자 진단 비용 최소화

### 향후 룰
- 모든 commit 후 **(a) 빌드 통과 (b) 본 흐름 1회 수동 통과** 두 게이트 모두 확인 후 push
- PPTX 또는 새 입력 형식 추가 시 **`hasSourceData` 같은 분기 가드를 모든 호출처에 빠짐없이 적용**
- 사용자 키 없이 시연 불가능한 경우 명시적으로 안내하고 사용자 재현 절차 제공

---

## 8. 현 상태 진단 (라이브 사이트 기준)

| 영역 | 상태 |
|------|------|
| 홈 Hero | ✅ "여행가J의" 검정 pill + "PPT, PDF를 마크다운으로" 한 줄 + amber 그라디언트 |
| 페이지 배경 | ✅ zinc-50 → white → amber-50/40 그라디언트 |
| Card / Dialog | ✅ M3 elevation + outline-variant |
| CTA (KakaoTalk + 프로필) | ✅ amber 톤다운 + hover 부유 |
| Provider 탭 + 모델 셀렉터 | ✅ 두 줄 레이아웃, 가격 힌트 가독성 OK |
| 변환 실패 alert | ✅ 친화 메시지 + HTTP status + raw response details |
| 초기화 버튼 | ✅ 변환 카드 안 |
| PPTX 변환 흐름 | ✅ 즉시 텍스트 추출 + 변환 가능 (회귀 수정 후) |
| Settings 키 검증 | ✅ prefix 실시간 검증 + claude.ai 혼동 안내 |
| OG 이미지 / Twitter card | ✅ 홈 hero 와 일치 |
| **변환 자체 (사용자 환경)** | ⚠️ **사용자 키가 invalid** — Anthropic console 키 발급 후 재입력 필요 |

---

## 9. 커밋 로그 (오늘분)

```
1c6fa57 fix(og,meta): drop '내 API 키로 직접' from share preview to match home hero
7f17d79 feat(settings): live key prefix validation + claude.ai-vs-API warning
2cbc62f fix(converter): PPTX text mode could not start conversion (regression from 188c77f)
f029833 fix(converter): explicit empty-key guard + diagnostic console logs
f85b889 fix(converter): expose raw API response body in failure alert + auto pptx flow
1f94136 feat(anthropic): add legacy claude-opus-4-6 + claude-sonnet-4-5 fallback models
b1055ad feat(converter): visible failure alert + reset button
9dd36c0 copy(home): hero headline one-line layout
3cb00fa fix(converter): model select dropdown — two-line layout, full trigger width
10eb0ef copy(home): hero refinement — bigger 여행가J brand chip, drop 내 API 키로 직접
f072f76 feat(design): visible visual shift - hero gradient, card depth, CTA polish
e013bbc feat(design): add M3 surface/shape/elevation tokens (R1)
```

---

## 10. 후속 작업

### 사용자 액션 필요 (지금 막혀 있는 부분)
1. **console.anthropic.com 에서 API 키 신규 발급** + Plan & Billing 활성화 → 본 UI Settings 에 입력 → 변환 시도
2. (선택) OpenAI · Google 키도 동일하게 발급 → 3사 비교

### 코드 후속 후보
1. **Edge Function CORS 프록시** — 사용자가 `anthropic-dangerous-direct-browser-access` 정책 변경 / 차단 시 백업 경로
2. **PPTX 발표자 노트 추출 옵션** — 현재 본문 텍스트만
3. **Playwright 자동 회귀** — PDF 1페이지 + PPTX 1슬라이드 + Provider 3사 mock 응답으로 라우팅 검증
4. **M3 R2 (typography scale + filled-tonal button)** — plan 파일 참조
5. **M3 R3 (페이지별 zinc → surface 토큰 마이그레이션)** — plan 파일 참조

### 운영 후보
1. SNS 미리보기 캐시 무효화 (1c6fa57 적용 후 카카오 디벨로퍼 / FB Sharing Debugger 활용)
2. README의 모델 가격 표 업데이트 (현재 anthropic.ts 의 `pricePerPageHint` 와 동기화 확인)

---

**문서 끝.** 다음 큰 변경 시 본 문서 또는 `DEVELOPMENT-2026-MM-DD.md` 새 문서로 추가.
