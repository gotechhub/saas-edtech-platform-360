import { headers } from "next/headers";
export const proofOrigins = new Set([
  "http://127.0.0.1:3000",
  "http://localhost:3000",
  "http://127.0.0.1:3001",
  "http://localhost:3001",
  "http://127.0.0.1:3015",
  "http://localhost:3015",
]);
const proofHosts = new Set([...proofOrigins].map((origin) => new URL(origin).host));
export function proofEnabled() {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.RESPONGO_DEMO_ENABLED === "true"
  );
}
export async function localProofPage() {
  const h = await headers();
  return (
    proofEnabled() &&
    proofHosts.has(h.get("host") || "")
  );
}
export function proofRequest(request: Request) {
  // Next can normalize request.url to localhost while the browser used 127.0.0.1.
  // Only two explicit loopback Host values are accepted; forwarded headers are ignored.
  const browserOrigin = `http://${request.headers.get("host") || ""}`;
  return (
    proofEnabled() &&
    proofOrigins.has(browserOrigin) &&
    request.headers.get("origin") === browserOrigin
  );
}
export async function readBounded(
  request: Request,
  max: number,
): Promise<Buffer> {
  const contentLength = request.headers.get("content-length");
  if (
    contentLength &&
    (!/^\d+$/.test(contentLength) || Number(contentLength) > max)
  )
    throw new Error("BODY_LIMIT");
  if (!request.body) throw new Error("EMPTY_BODY");
  const reader = request.body.getReader();
  let size = 0;
  const chunks: Buffer[] = [];
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        await reader.cancel();
        throw new Error("BODY_LIMIT");
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, size);
}
