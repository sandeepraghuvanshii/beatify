// utils/token.js
export function extractTokenFromPermaUrl(permaUrl) {
  if (!permaUrl) return null;
  try {
    const url = new URL(permaUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts.length ? parts[parts.length - 1] : null;
  } catch (e) {
    const cleaned = String(permaUrl).split("?")[0].replace(/\/+$/, "");
    const parts = cleaned.split("/").filter(Boolean);
    return parts.length ? parts[parts.length - 1] : null;
  }
}
