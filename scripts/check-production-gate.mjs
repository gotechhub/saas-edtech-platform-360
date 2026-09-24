import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import assert from "node:assert/strict";
const require = createRequire(resolve("apps/web/package.json"));
const server = spawn(
  process.execPath,
  [
    require.resolve("next/dist/bin/next"),
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3001",
  ],
  {
    cwd: resolve("apps/web"),
    env: { ...process.env, RESPONGO_DEMO_ENABLED: "false" },
    stdio: "pipe",
    windowsHide: true,
  },
);
let logs = "";
server.stdout.on("data", (x) => (logs += x));
server.stderr.on("data", (x) => (logs += x));
try {
  let response;
  for (let i = 0; i < 40; i++) {
    if (server.exitCode !== null) throw new Error(logs);
    try {
      response = await fetch("http://127.0.0.1:3001/avukat/oguzlawacademy");
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  assert(response, "Production guard server did not start");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert(html.includes("Akademi kurulumu sürüyor"));
  assert(!html.includes("Gelişimin için güzel bir gün."));
  console.log("PASS: production demo is closed unless explicitly enabled");
} finally {
  server.kill();
}
