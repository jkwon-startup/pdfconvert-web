/**
 * .pptx 파일에서 슬라이드별 plain text 를 추출합니다.
 * - 슬라이드 순서는 ppt/_rels/presentation.xml.rels + presentation.xml 의 sldIdLst 를 따라 결정
 *   (단순 알파벳 정렬은 slide11.xml < slide2.xml 함정 발생)
 * - 텍스트 노드: <a:t> (run text), <c:v> (chart cell), <dgm:t> (SmartArt)
 * - <a:p> 단위로 줄바꿈
 */

export interface PptxExtractResult {
  slides: string[];   // 슬라이드 N의 본문 = slides[N-1]
  numSlides: number;
}

export async function extractPptxSlides(file: File): Promise<PptxExtractResult> {
  const [{ default: JSZip }, { XMLParser }] = await Promise.all([
    import("jszip"),
    import("fast-xml-parser"),
  ]);

  const zip = await JSZip.loadAsync(await file.arrayBuffer());

  const presXml = await zip.file("ppt/presentation.xml")?.async("string");
  const relsXml = await zip.file("ppt/_rels/presentation.xml.rels")?.async("string");
  if (!presXml || !relsXml) {
    throw new Error("PPTX 구조가 비정상입니다 (presentation.xml 누락)");
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseAttributeValue: false,
  });

  const presParsed = parser.parse(presXml);
  const relsParsed = parser.parse(relsXml);

  const sldIds = toArray<{ "@_r:id"?: string; "@_id"?: string }>(
    presParsed?.["p:presentation"]?.["p:sldIdLst"]?.["p:sldId"]
  );
  const rels = toArray<{ "@_Id"?: string; "@_Target"?: string; "@_Type"?: string }>(
    relsParsed?.Relationships?.Relationship
  );

  const idToTarget = new Map<string, string>();
  for (const r of rels) {
    if (r["@_Id"] && r["@_Target"]) {
      idToTarget.set(r["@_Id"], r["@_Target"]);
    }
  }

  const slidePaths: string[] = [];
  for (const s of sldIds) {
    const rid = s["@_r:id"];
    if (!rid) continue;
    const target = idToTarget.get(rid);
    if (!target) continue;
    // Target 은 보통 "slides/slide1.xml" — ppt/ 기준 상대경로
    const cleaned = target.replace(/^\.?\//, "");
    slidePaths.push(cleaned.startsWith("ppt/") ? cleaned : `ppt/${cleaned}`);
  }

  const slides: string[] = [];
  for (const path of slidePaths) {
    const xml = await zip.file(path)?.async("string");
    if (!xml) {
      slides.push("");
      continue;
    }
    const parsed = parser.parse(xml);
    slides.push(extractText(parsed));
  }

  return { slides, numSlides: slides.length };
}

function toArray<T>(v: T | T[] | undefined | null): T[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

/**
 * 파싱 트리에서 텍스트 노드를 깊이 우선으로 수집.
 * - <a:p> 끝나면 줄바꿈
 * - <a:t> 안의 텍스트는 그대로 누적
 * - <c:v>, <dgm:t> 도 동일하게 텍스트 노드로 취급
 */
function extractText(parsed: unknown): string {
  const out: string[] = [];
  walk(parsed, out);
  return out.join("").replace(/\n{3,}/g, "\n\n").trim();
}

function walk(node: unknown, out: string[]): void {
  if (node === null || node === undefined) return;
  if (typeof node === "string") {
    return;
  }
  if (typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const n of node) walk(n, out);
    return;
  }
  const obj = node as Record<string, unknown>;
  for (const [key, value] of Object.entries(obj)) {
    if (key === "@_" || key.startsWith("@_")) continue;
    if (key === "a:t" || key === "c:v" || key === "dgm:t") {
      // 텍스트 런: 문자열 또는 문자열 배열
      if (typeof value === "string") {
        out.push(value);
      } else if (Array.isArray(value)) {
        for (const v of value) {
          if (typeof v === "string") out.push(v);
          else if (typeof v === "object" && v !== null && "#text" in (v as object)) {
            const text = (v as Record<string, unknown>)["#text"];
            if (typeof text === "string") out.push(text);
          }
        }
      } else if (typeof value === "object" && value !== null && "#text" in (value as object)) {
        const text = (value as Record<string, unknown>)["#text"];
        if (typeof text === "string") out.push(text);
      }
    } else if (key === "a:p") {
      walk(value, out);
      out.push("\n");
    } else if (key === "a:br") {
      out.push("\n");
    } else {
      walk(value, out);
    }
  }
}
