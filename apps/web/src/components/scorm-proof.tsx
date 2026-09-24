"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  validateRuntimeMessage,
  type Snapshot,
} from "@respongo/learning-core/scorm";
const contentOrigin = "http://localhost:3101",
  storageKey = "respongo:scorm:synthetic-fixture:v1";
export function ScormProof() {
  const frame = useRef<HTMLIFrameElement>(null),
    sequence = useRef(0),
    hashes = useRef(new Map<number, string>()),
    snapshot = useRef<Snapshot>({});
  const [nonce, setNonce] = useState(""),
    [status, setStatus] = useState("Önizleme hazırlanıyor…"),
    [values, setValues] = useState<Snapshot>({}),
    [reload, setReload] = useState(0);
  useEffect(() => {
    let persisted: Snapshot = {};
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || "{}");
      const mockSource = {};
      const valid = validateRuntimeMessage(
        {
          origin: contentOrigin,
          source: mockSource,
          data: {
            type: "respongo.scorm.snapshot",
            nonce: "restore",
            sequence: 1,
            values: parsed,
          },
        },
        {
          origin: contentOrigin,
          source: mockSource,
          nonce: "restore",
          lastSequence: 0,
        },
      );
      if (valid) persisted = valid.values;
    } catch {}
    snapshot.current = persisted;
    setValues(persisted);
    sequence.current = 0;
    hashes.current.clear();
    setNonce(crypto.randomUUID());
  }, [reload]);
  useEffect(() => {
    if (!nonce) return;
    let active = true;
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== contentOrigin ||
        event.source !== frame.current?.contentWindow ||
        event.data?.nonce !== nonce
      )
        return;
      const current = event.data?.sequence;
      if (!Number.isSafeInteger(current) || current > 1000) return;
      const valid = validateRuntimeMessage(event, {
        origin: contentOrigin,
        source: frame.current?.contentWindow,
        nonce,
        lastSequence: hashes.current.has(current)
          ? current - 1
          : sequence.current,
      });
      if (!valid) return;
      const fingerprint = JSON.stringify(
        Object.entries(valid.values).sort(([a], [b]) => a.localeCompare(b)),
      );
      if (hashes.current.has(valid.sequence)) {
        if (hashes.current.get(valid.sequence) === fingerprint)
          frame.current?.contentWindow?.postMessage(
            { type: "respongo.scorm.ack", nonce, sequence: valid.sequence },
            contentOrigin,
          );
        return;
      }
      try {
        localStorage.setItem(storageKey, JSON.stringify(valid.values));
        snapshot.current = valid.values;
        setValues(valid.values);
        sequence.current = valid.sequence;
        hashes.current.set(valid.sequence, fingerprint);
        if (hashes.current.size > 64)
          hashes.current.delete(hashes.current.keys().next().value!);
        frame.current?.contentWindow?.postMessage(
          { type: "respongo.scorm.ack", nonce, sequence: valid.sequence },
          contentOrigin,
        );
        setStatus("Demo ilerlemesi tarayıcıya kaydedildi.");
      } catch {
        setStatus("Tarayıcı kaydı başarısız. Kayıt onayı verilmedi.");
      }
    };
    window.addEventListener("message", receive);
    const timer = setTimeout(() => {
      if (active)
        setStatus((s) =>
          s === "Önizleme hazırlanıyor…"
            ? "İçerik servisi bekleniyor. Yerelde pnpm content:proof komutunu çalıştırın."
            : s,
        );
    }, 7000);
    return () => {
      active = false;
      clearTimeout(timer);
      window.removeEventListener("message", receive);
    };
  }, [nonce]);
  const initialize = () => {
    frame.current?.contentWindow?.postMessage(
      { type: "respongo.scorm.init", nonce, values: snapshot.current },
      contentOrigin,
    );
    setStatus("Örnek paket açıldı. İlerleme yalnızca bu tarayıcıda saklanır.");
  };
  return (
    <main className="studio">
      <div className="studio-top">
        <Link href="/avukat/oguzlawacademy">← Akademiye dön</Link>
        <span>İZOLE İÇERİK ÖNİZLEMESİ</span>
        <Link href="/lab/authoring">GoAuthoring →</Link>
      </div>
      <header className="studio-heading">
        <h1>Eğitim paketini deneyin.</h1>
        <p>
          Bu sabit sentetik paket ayrı bir içerik adresinde çalışır. Gerçek
          kullanıcı oturumu veya Supabase anahtarı içerik alanına iletilmez.
        </p>
      </header>
      <div className="studio-actions">
        <button
          onClick={() => {
            setStatus("Önizleme hazırlanıyor…");
            setReload((x) => x + 1);
          }}
        >
          Kaldığım yerden yeniden aç
        </button>
      </div>
      <div className="studio-grid scorm-grid">
        <section className="studio-card scorm-frame">
          {nonce && (
            <iframe
              ref={frame}
              key={nonce}
              src={`${contentOrigin}/wrapper#nonce=${nonce}`}
              title="SCORM eğitim oynatıcısı"
              sandbox="allow-scripts allow-same-origin"
              referrerPolicy="no-referrer"
              onLoad={initialize}
            />
          )}
        </section>
        <section className="studio-card">
          <h2>Örnek kayıtlar</h2>
          <p role="status">{status}</p>
          <dl>
            <dt>Durum</dt>
            <dd>{values["cmi.core.lesson_status"] || "Başlanmadı"}</dd>
            <dt>Puan (paket bildirimi)</dt>
            <dd>{values["cmi.core.score.raw"] || "—"}</dd>
            <dt>Son bölüm</dt>
            <dd>{values["cmi.core.lesson_location"] || "0"}</dd>
            <dt>Soru yanıtı</dt>
            <dd>{values["cmi.interactions.0.student_response"] || "—"}</dd>
            <dt>Soru sonucu</dt>
            <dd>{values["cmi.interactions.0.result"] || "—"}</dd>
          </dl>
          <p className="studio-notice">
            Paketin bildirdiği puan güvenilir sunucu sınavı değildir. Gerçek
            sertifika veya XP üretmez.
          </p>
        </section>
      </div>
    </main>
  );
}
