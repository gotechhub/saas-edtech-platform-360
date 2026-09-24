import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { build } from "esbuild";
import {
  createScormFiles,
  sampleCourse,
  exportScorm12,
} from "../../packages/learning-core/src/authoring.ts";
import { inspectScormZip } from "../../packages/learning-core/src/archive.ts";
const root = dirname(fileURLToPath(import.meta.url));
const allowedParentOrigins = new Set([
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:3015",
]);
const parentOrigin = process.env.RESPONGO_PARENT_ORIGIN || "http://127.0.0.1:3000";
if (!allowedParentOrigins.has(parentOrigin))
  throw new Error("RESPONGO_PARENT_ORIGIN must be an approved loopback origin");
const contentOrigin = "http://localhost:3101";
const bundled = await build({
  entryPoints: [resolve(root, "runtime.ts")],
  bundle: true,
  format: "iife",
  platform: "browser",
  write: false,
});
// Only our generated, validated synthetic fixture is served. Uploaded packages are never served here.
const inspected = await inspectScormZip(
  Buffer.from(exportScorm12(sampleCourse)),
);
const runtime = `window.RESPONGO_PARENT=${JSON.stringify(parentOrigin)};\n${bundled.outputFiles[0].text}`;
const html =
  '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>İçerik önizlemesi</title><link rel="stylesheet" href="/wrapper.css"></head><body><div id="status" role="status">Akademi bağlantısı bekleniyor…</div><div id="course"></div><script src="/runtime.js"></script></body></html>';
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};
const server = createServer((req, res) => {
  if (
    req.method !== "GET" ||
    !["localhost:3101", "127.0.0.1:3101"].includes(req.headers.host || "")
  ) {
    res.writeHead(403);
    res.end();
    return;
  }
  res.setHeader(
    "Content-Security-Policy",
    `default-src 'none'; script-src 'self'; style-src 'self'; frame-src 'self'; frame-ancestors ${parentOrigin} ${contentOrigin}; connect-src 'none'; img-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'`,
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "no-store");
  const route = new URL(req.url, contentOrigin).pathname;
  if (route === "/health") {
    res.setHeader("Content-Type", "text/plain");
    res.end("synthetic-content-proof");
    return;
  }
  if (route === "/wrapper") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(html);
    return;
  }
  if (route === "/runtime.js") {
    res.setHeader("Content-Type", "text/javascript; charset=utf-8");
    res.end(runtime);
    return;
  }
  if (route === "/wrapper.css") {
    res.setHeader("Content-Type", "text/css");
    res.end(
      "body{margin:0;background:#f5f7f4;font:12px Arial;color:#294d40}#status{padding:12px 22px;border-bottom:1px solid #dbe5dd}iframe{display:block;border:0;width:100%;height:640px}",
    );
    return;
  }
  const name = route.startsWith("/package/") ? route.slice(9) : "";
  const file = inspected.files.get(name);
  if (!file) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  res.setHeader(
    "Content-Type",
    types[name.slice(name.lastIndexOf("."))] || "application/octet-stream",
  );
  res.end(file);
});
server.listen(3101, "127.0.0.1", () =>
  console.log(`Synthetic content proof: ${contentOrigin}`),
);
