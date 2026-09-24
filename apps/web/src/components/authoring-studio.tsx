"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  sampleCourse,
  validateAuthorCourse,
  type AuthorCourse,
} from "@respongo/learning-core/authoring";
const draftKey = "respongo:authoring:proof:v1";
export function AuthoringStudio() {
  const [course, setCourse] = useState<AuthorCourse>(sampleCourse),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [report, setReport] = useState<{
      title: string;
      fileCount: number;
      launchPath: string;
      scanStatus: string;
    } | null>(null);
  useEffect(() => {
    try {
      const draft = localStorage.getItem(draftKey);
      if (draft) setCourse(validateAuthorCourse(JSON.parse(draft)));
    } catch {
      setMessage("Önceki taslak okunamadı; örnek taslak açıldı.");
    }
  }, []);
  function save() {
    try {
      const valid = validateAuthorCourse(course);
      localStorage.setItem(draftKey, JSON.stringify(valid));
      setMessage("Taslak bu tarayıcıya kaydedildi.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Taslak kaydedilemedi.");
    }
  }
  async function download() {
    setBusy(true);
    setMessage("Paket hazırlanıyor…");
    try {
      const valid = validateAuthorCourse(course);
      const response = await fetch("/api/demo/authoring/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valid),
      });
      if (!response.ok) throw new Error((await response.json()).error);
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "oguz-law-demo-scorm12.zip";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(
        "SCORM 1.2 paketi indirildi. Başka bir LMS uyumluluğu ayrıca doğrulanmalıdır.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Paket oluşturulamadı.");
    } finally {
      setBusy(false);
    }
  }
  async function inspect(file: File | undefined) {
    if (!file) return;
    setReport(null);
    if (file.size > 20 * 1024 * 1024) {
      setMessage("En fazla 20 MB ZIP yükleyebilirsiniz.");
      return;
    }
    setBusy(true);
    setMessage("Paket yapısı kontrol ediliyor…");
    try {
      const response = await fetch("/api/demo/packages/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/zip" },
        body: file,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setReport(result);
      setMessage(
        "Yapısal kontrol geçti. Zararlı yazılım taraması yapılmadı; paket yayımlanmadı.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Paket kontrol edilemedi.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="studio">
      <div className="studio-top">
        <Link href="/avukat/oguzlawacademy">← Akademiye dön</Link>
        <span>GOAUTHORING · GELİŞTİRME ÖNİZLEMESİ</span>
        <Link href="/lab/scorm">Örnek paketi oynat →</Link>
      </div>
      <header className="studio-heading">
        <span className="studio-eyebrow">BİLGİNİ PAYLAŞ</span>
        <h1>İlk eğitimini oluştur.</h1>
        <p>
          Metin bölümleri ve tek seçenekli soruyla küçük bir eğitim hazırla.
          Taslak tarayıcıda saklanır; paket ZIP olarak indirilir.
        </p>
      </header>
      <p className="studio-notice">
        Sentetik geliştirme alanı. Gerçek kişi veya müvekkil verisi eklemeyin.
        Yerel yayın, içerik lisansı ve gerçek başarı kayıtları henüz bağlı
        değil.
      </p>
      <div className="studio-grid">
        <section className="studio-card">
          <h2>Eğitim taslağı</h2>
          <label>
            Eğitim başlığı
            <input
              maxLength={120}
              value={course.title}
              onChange={(e) => setCourse({ ...course, title: e.target.value })}
            />
          </label>
          {course.sections.map((section, i) => (
            <fieldset key={i}>
              <legend>Bölüm {i + 1}</legend>
              <label>
                Bölüm başlığı
                <input
                  maxLength={100}
                  value={section.title}
                  onChange={(e) =>
                    setCourse({
                      ...course,
                      sections: course.sections.map((s, j) =>
                        j === i ? { ...s, title: e.target.value } : s,
                      ),
                    })
                  }
                />
              </label>
              <label>
                Bölüm metni
                <textarea
                  rows={4}
                  maxLength={5000}
                  value={section.body}
                  onChange={(e) =>
                    setCourse({
                      ...course,
                      sections: course.sections.map((s, j) =>
                        j === i ? { ...s, body: e.target.value } : s,
                      ),
                    })
                  }
                />
              </label>
              <div className="studio-actions">
                <button
                  disabled={i === 0}
                  onClick={() =>
                    setCourse({
                      ...course,
                      sections: course.sections.map((s, j) =>
                        j === i - 1
                          ? section
                          : j === i
                            ? course.sections[i - 1]
                            : s,
                      ),
                    })
                  }
                >
                  Yukarı taşı
                </button>
                <button
                  disabled={course.sections.length === 1}
                  onClick={() =>
                    setCourse({
                      ...course,
                      sections: course.sections.filter((_, j) => i !== j),
                    })
                  }
                >
                  Bölümü kaldır
                </button>
              </div>
            </fieldset>
          ))}
          <button
            disabled={course.sections.length >= 8}
            onClick={() =>
              setCourse({
                ...course,
                sections: [
                  ...course.sections,
                  { title: "Yeni bölüm", body: "" },
                ],
              })
            }
          >
            + Bölüm ekle
          </button>
        </section>
        <div>
          <section className="studio-card">
            <h2>Kısa değerlendirme</h2>
            <label>
              Soru
              <textarea
                rows={3}
                maxLength={400}
                value={course.question}
                onChange={(e) =>
                  setCourse({ ...course, question: e.target.value })
                }
              />
            </label>
            <fieldset>
              <legend>Doğru seçeneği işaretle</legend>
              {course.choices.map((choice, i) => (
                <div className="studio-choice" key={i}>
                  <input
                    aria-label={`Doğru yanıt: ${i + 1}`}
                    type="radio"
                    name="correct"
                    checked={course.answer === i}
                    onChange={() => setCourse({ ...course, answer: i })}
                  />
                  <input
                    aria-label={`Seçenek ${i + 1}`}
                    maxLength={200}
                    value={choice}
                    onChange={(e) =>
                      setCourse({
                        ...course,
                        choices: course.choices.map((c, j) =>
                          i === j ? e.target.value : c,
                        ),
                      })
                    }
                  />
                </div>
              ))}
            </fieldset>
            <div className="studio-actions">
              <button onClick={save} disabled={busy}>
                Taslağı kaydet
              </button>
              <button
                className="studio-primary"
                onClick={download}
                disabled={busy}
              >
                SCORM 1.2 indir
              </button>
            </div>
          </section>
          <section className="studio-card">
            <h2>Paket yapısını kontrol et</h2>
            <p>
              İndirdiğin paketi seçerek manifest ve dosya sınırlarını kontrol
              edebilirsin. Yüklenen dosyalar oynatılmaz veya kalıcı saklanmaz.
            </p>
            <label>
              SCORM ZIP dosyası
              <input
                type="file"
                accept=".zip,application/zip"
                disabled={busy}
                onChange={(e) => void inspect(e.target.files?.[0])}
              />
            </label>
            {report && (
              <dl>
                <dt>Eğitim</dt>
                <dd>{report.title}</dd>
                <dt>Dosya sayısı</dt>
                <dd>{report.fileCount}</dd>
                <dt>Başlatma dosyası</dt>
                <dd>{report.launchPath}</dd>
                <dt>Yayın durumu</dt>
                <dd>Yayımlanmadı · Tarama bekliyor</dd>
              </dl>
            )}
          </section>
          <div className="studio-feedback" role="status" aria-live="polite">
            {message}
          </div>
        </div>
      </div>
    </main>
  );
}
