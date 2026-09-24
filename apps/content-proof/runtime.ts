import {
  createScorm12,
  writableSnapshot,
  type Snapshot,
} from "../../packages/learning-core/src/scorm";
declare global {
  interface Window {
    API: ReturnType<typeof createScorm12>;
    RESPONGO_PARENT: string;
  }
}
const params = new URLSearchParams(location.hash.slice(1)),
  nonce = params.get("nonce");
const parentOrigin = window.RESPONGO_PARENT;
const status = document.getElementById("status")!;
let sequence = 0,
  initialized = false,
  lastAck = 0;
const pending = new Map<number, { message: unknown; sent: number }>();
function send(snapshot: Snapshot) {
  if (pending.size >= 50) throw new Error("Kayıt kuyruğu dolu");
  const message = {
    type: "respongo.scorm.snapshot",
    nonce,
    sequence: ++sequence,
    values: writableSnapshot(snapshot),
  };
  pending.set(sequence, { message, sent: Date.now() });
  window.parent.postMessage(message, parentOrigin);
  status.textContent = "Kayıt onayı bekleniyor…";
}
window.addEventListener("message", (event) => {
  if (
    event.source !== window.parent ||
    event.origin !== parentOrigin ||
    !nonce ||
    event.data?.nonce !== nonce
  )
    return;
  if (event.data.type === "respongo.scorm.init" && !initialized) {
    initialized = true;
    // Only the portal may supply resume state. The child package receives no portal token or cookie.
    const values =
      event.data.values && typeof event.data.values === "object"
        ? event.data.values
        : {};
    window.API = createScorm12(
      {
        ...values,
        "cmi.core.entry": Object.keys(values).length ? "resume" : "ab-initio",
      },
      send,
    );
    const frame = document.createElement("iframe");
    frame.src = "/package/index.html";
    frame.title = "Örnek eğitim içeriği";
    document.getElementById("course")!.append(frame);
    status.textContent = "Örnek eğitim hazır";
  }
  if (
    event.data.type === "respongo.scorm.ack" &&
    Number.isSafeInteger(event.data.sequence) &&
    pending.has(event.data.sequence)
  ) {
    pending.delete(event.data.sequence);
    lastAck = Math.max(lastAck, event.data.sequence);
    status.textContent = pending.size
      ? "Diğer kayıtların onayı bekleniyor…"
      : "Demo ilerlemesi tarayıcıya kaydedildi";
  }
});
const retry = setInterval(() => {
  for (const { message, sent } of pending.values()) {
    if (Date.now() - sent < 30000)
      window.parent.postMessage(message, parentOrigin);
    else
      status.textContent =
        "Kayıt onayı alınamadı. Sayfayı kapatmadan bağlantıyı kontrol edin.";
  }
}, 1000);
window.addEventListener("pagehide", () => clearInterval(retry));
if (!nonce) status.textContent = "Bu önizlemeyi akademi içinden açın.";
