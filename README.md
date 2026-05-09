# pdfconvert-web

> PDF를 마크다운으로, 내 API 키로 직접. Claude · Gemini · GPT 골라서. 우리 서버 거치지 않고. 100% 무료.

LLM Vision API 기반 PDF→Markdown 변환 웹서비스입니다. 사용자가 자신의 API 키를 직접 입력해 사용하며, 변환 처리는 클라이언트(브라우저)에서 일어납니다.

## ✨ 주요 특징

- **BYO API Key**: Anthropic / Google / OpenAI 키를 사용자가 직접 입력
- **3사 자유 선택**: Claude · Gemini · GPT 모델 자유롭게 전환
- **클라이언트 사이드 처리**: PDF가 우리 서버를 거치지 않음 (PDF.js로 브라우저에서 페이지별 이미지 변환)
- **100% 오픈소스**: MIT 라이선스
- **한국어 최적화**: 한글 PDF 인식률 높은 모델 우선 추천

## 🚀 사용 방법

1. [pdfconvert-web.vercel.app](https://pdfconvert-web.vercel.app) 접속
2. Settings에서 사용할 LLM 제공사의 API 키 입력
3. PDF 드래그앤드롭
4. Provider/Model 선택 → 변환 시작
5. 결과 마크다운 다운로드

## 🛠️ 로컬 개발

```bash
git clone https://github.com/jkwon-startup/pdfconvert-web.git
cd pdfconvert-web
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) 접속.

### 기술 스택

- [Next.js 16](https://nextjs.org) (App Router)
- [Tailwind CSS 4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [pdfjs-dist](https://github.com/mozilla/pdf.js) — 클라이언트 PDF 렌더링
- LLM API: Anthropic / Google Gemini / OpenAI (모두 BYO Key)

## 🔐 보안 / 프라이버시

- **API 키는 브라우저 localStorage에만 저장됩니다** (또는 sessionStorage 옵션)
- **PDF는 우리 서버를 거치지 않습니다** — 모든 페이지 변환은 브라우저에서 처리
- **LLM 호출은 브라우저에서 직접** — 일부 모델만 CORS 폴백 시 Vercel Edge Function 메모리 통과(로깅 X)
- **변환 결과는 우리 서버에 저장되지 않습니다**

자세한 내용은 `/privacy` 페이지 참조.

## ⚖️ 면책 조항

- 변환 품질은 선택한 LLM 모델 성능에 따릅니다
- 저작권 침해 PDF 변환은 사용자 책임입니다
- API 비용은 사용자 부담입니다
- 변환 결과의 정확성은 보장되지 않습니다

## 📜 라이선스

MIT — [LICENSE](./LICENSE) 참조

## 👤 운영

[여행가J](https://litt.ly/jkwon) (TS² / AITY) 운영. 기여/이슈 환영합니다.
