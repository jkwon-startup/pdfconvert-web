const TERMS_VERSION = "v1";
const KEY = `pdfconvert_terms_accepted_${TERMS_VERSION}`;

export function getTermsAccepted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY) === "true";
}

export function setTermsAccepted(value: boolean): void {
  if (typeof window === "undefined") return;
  if (value) localStorage.setItem(KEY, "true");
  else localStorage.removeItem(KEY);
}
