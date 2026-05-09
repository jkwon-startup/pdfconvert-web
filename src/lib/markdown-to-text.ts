/**
 * 마크다운 문자열을 사람이 읽기 쉬운 plain text로 변환합니다.
 * - 헤더(#) 제거
 * - bold/italic/inline code 마커 제거
 * - 리스트 마커(-, *, 1.) 제거
 * - 표는 탭 구분 텍스트로
 * - 코드 펜스(```) 제거 (내용은 유지)
 * - 링크는 텍스트만 남김
 * - blockquote(>) 제거
 * - 연속 빈 줄 정리
 */
export function markdownToPlainText(md: string): string {
  return md
    .replace(/```[a-zA-Z]*\n?/g, "")
    .replace(/```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*[-:]+\s*(\|\s*[-:]+\s*)+\|?\s*$/gm, "")
    .replace(/^\s*\|?(.+?)\|?\s*$/gm, (line) => {
      // 표 행으로 보이면(파이프가 2개 이상) 탭으로 변환
      const inner = line.replace(/^\|/, "").replace(/\|$/, "");
      const parts = inner.split("|");
      if (parts.length >= 2 && line.includes("|")) {
        return parts.map((c) => c.trim()).join("\t");
      }
      return line;
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
