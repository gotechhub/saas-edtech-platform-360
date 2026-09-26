"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardCheck, Clock3, FileQuestion, Plus, RefreshCw, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { Button, StatusPill, Surface, TextField } from "@respongo/ui-web";

type Assessment = { id: string; title: string; status: "draft" | "published" | "retired"; current_version: number; pass_score: number; max_attempts: number; time_limit_minutes: number; revision: number };
type Sitting = { id: string; assessment_id: string; state: string; score: number | null; success: boolean | null };
type DraftQuestion = { id: string; prompt: string; optionA: string; optionB: string; correctAnswer: "a" | "b" };

const query = "industry=avukat&tenant=oguzlawacademy";
const newQuestion = (): DraftQuestion => ({ id: crypto.randomUUID(), prompt: "", optionA: "", optionB: "", correctAnswer: "a" });

async function command(payload: Record<string, unknown>) {
  const response = await fetch("/api/v2/assessments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ industry: "avukat", tenant: "oguzlawacademy", ...payload }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.detail || result.error || "ASSESSMENT_COMMAND_FAILED");
  return result.data as { assessment_id?: string; revision?: number; version?: number };
}

export function AssessmentWorkspace() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [sittings, setSittings] = useState<Sitting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("Her soruyu dikkatle yanıtlayın.");
  const [passScore, setPassScore] = useState(70);
  const [attempts, setAttempts] = useState(2);
  const [minutes, setMinutes] = useState(30);
  const [questions, setQuestions] = useState<DraftQuestion[]>([newQuestion(), newQuestion()]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/v2/assessments?${query}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || payload.error || "Değerlendirmeler alınamadı.");
      setAssessments(payload.assessments ?? []); setSittings(payload.sittings ?? []);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Değerlendirmeler alınamadı."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const completed = sittings.filter((item) => item.state === "submitted").length;
  const passed = sittings.filter((item) => item.success).length;
  const average = useMemo(() => {
    const scores = sittings.map((item) => item.score).filter((value): value is number => value !== null);
    return scores.length ? Math.round(scores.reduce((sum, value) => sum + Number(value), 0) / scores.length) : 0;
  }, [sittings]);

  function updateQuestion(id: string, change: Partial<DraftQuestion>) { setQuestions((items) => items.map((item) => item.id === id ? { ...item, ...change } : item)); }
  function reset() { setTitle(""); setInstructions("Her soruyu dikkatle yanıtlayın."); setPassScore(70); setAttempts(2); setMinutes(30); setQuestions([newQuestion(), newQuestion()]); }
  async function saveAndPublish() {
    if (title.trim().length < 2 || questions.some((item) => item.prompt.trim().length < 2 || !item.optionA.trim() || !item.optionB.trim())) { setError("Sınav adı, soru metinleri ve bütün seçenekler zorunludur."); return; }
    setBusy(true); setError("");
    try {
      const draft = await command({ action: "save_draft", title: title.trim(), instructions: instructions.trim(), passScore, maxAttempts: attempts, timeLimitMinutes: minutes,
        questions: questions.map((item) => ({ kind: "single_choice", prompt: item.prompt.trim(), options: [{ id: "a", label: item.optionA.trim() }, { id: "b", label: item.optionB.trim() }], correctAnswer: item.correctAnswer, points: 1 })) });
      await command({ action: "publish", assessmentId: draft.assessment_id, expectedRevision: draft.revision });
      setNotice("Sınav yayınlandı. Cevap anahtarı güvenli sunucu katmanında saklandı."); setEditing(false); reset(); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Sınav kaydedilemedi."); }
    finally { setBusy(false); }
  }

  if (editing) return <div className="rv2-assessment-studio">
    <header className="rv2-page-header"><div><button className="rv2-back-link" onClick={() => setEditing(false)}>← Değerlendirmeler</button><span className="rv2-eyebrow">SINAV STÜDYOSU</span><h1>Yeni sınav oluştur</h1><p>Soru, geçme puanı ve deneme politikasını belirleyin; puanlama yalnızca sunucuda yapılır.</p></div><div className="rv2-page-header__actions"><Button variant="secondary" onClick={() => setEditing(false)}>Vazgeç</Button><Button disabled={busy} onClick={() => void saveAndPublish()}><Sparkles size={16} /> {busy ? "Yayınlanıyor…" : "Kaydet ve yayınla"}</Button></div></header>
    {error ? <div className="rv2-compliance-alert" role="alert">{error}</div> : null}
    <div className="rv2-assessment-editor-layout"><main><Surface className="rv2-panel"><div className="rv2-panel__head"><div><span className="rv2-eyebrow">SINAV BİLGİLERİ</span><h2>Kimlik ve talimat</h2></div><FileQuestion size={20} /></div><div className="rv2-assessment-basics"><TextField label="Sınav adı" required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Örn. Meslek Etiği Vaka Sınavı" /><TextField label="Öğrenen talimatı" value={instructions} onChange={(event) => setInstructions(event.target.value)} /></div></Surface>
      <Surface className="rv2-panel"><div className="rv2-panel__head"><div><span className="rv2-eyebrow">SORU BANKASI</span><h2>{questions.length} soru</h2></div><Button size="sm" variant="secondary" onClick={() => setQuestions((items) => [...items, newQuestion()])}><Plus size={15} /> Soru ekle</Button></div><div className="rv2-question-builder">{questions.map((question, index) => <article key={question.id}><header><strong>{index + 1}. soru</strong>{questions.length > 1 ? <button aria-label={`${index + 1}. soruyu sil`} onClick={() => setQuestions((items) => items.filter((item) => item.id !== question.id))}><Trash2 size={15} /></button> : null}</header><TextField label="Soru metni" value={question.prompt} onChange={(event) => updateQuestion(question.id, { prompt: event.target.value })} /><div><label><input type="radio" name={`correct-${question.id}`} checked={question.correctAnswer === "a"} onChange={() => updateQuestion(question.id, { correctAnswer: "a" })} /><span>Doğru cevap</span></label><TextField label="A seçeneği" value={question.optionA} onChange={(event) => updateQuestion(question.id, { optionA: event.target.value })} /></div><div><label><input type="radio" name={`correct-${question.id}`} checked={question.correctAnswer === "b"} onChange={() => updateQuestion(question.id, { correctAnswer: "b" })} /><span>Doğru cevap</span></label><TextField label="B seçeneği" value={question.optionB} onChange={(event) => updateQuestion(question.id, { optionB: event.target.value })} /></div></article>)}</div></Surface></main>
      <aside><Surface className="rv2-panel rv2-assessment-policy"><span className="rv2-eyebrow">DENEME POLİTİKASI</span><label><span>Geçme puanı</span><input type="number" min="0" max="100" value={passScore} onChange={(event) => setPassScore(Number(event.target.value))} /></label><label><span>Deneme hakkı</span><input type="number" min="1" max="20" value={attempts} onChange={(event) => setAttempts(Number(event.target.value))} /></label><label><span>Süre (dakika)</span><input type="number" min="1" max="480" value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} /></label><div><ShieldCheck size={20} /><strong>Güvenli puanlama</strong><small>Cevap anahtarı istemciye gönderilmez. Süre ve deneme limiti sunucuda uygulanır.</small></div></Surface></aside></div>
  </div>;

  return <div className="rv2-assessments"><header className="rv2-page-header"><div><span className="rv2-eyebrow">DEĞERLENDİRME</span><h1>Sınav ve değerlendirme merkezi</h1><p>Yayınlanan sınavları, deneme politikalarını ve sonuç eğilimlerini yönetin.</p></div><div className="rv2-page-header__actions"><Button variant="secondary" onClick={() => void load()} disabled={loading}><RefreshCw size={16} /> Yenile</Button><Button onClick={() => { reset(); setEditing(true); }}><Plus size={16} /> Yeni sınav</Button></div></header>
    {notice ? <div className="rv2-builder-notice" role="status"><CheckCircle2 size={17} />{notice}</div> : null}{error ? <div className="rv2-compliance-alert" role="alert">{error}</div> : null}
    <section className="rv2-metrics rv2-metrics--compact"><Surface className="rv2-mini-metric"><span>Toplam sınav</span><strong>{assessments.length}</strong><small>{assessments.filter((item) => item.status === "published").length} yayında</small></Surface><Surface className="rv2-mini-metric"><span>Tamamlanan deneme</span><strong>{completed}</strong><small>Sunucuya teslim edildi</small></Surface><Surface className="rv2-mini-metric"><span>Başarılı</span><strong>{passed}</strong><small>%{completed ? Math.round(passed * 100 / completed) : 0} başarı oranı</small></Surface><Surface className="rv2-mini-metric"><span>Ortalama puan</span><strong>%{average}</strong><small>Tüm puanlanan denemeler</small></Surface></section>
    <Surface className="rv2-panel"><div className="rv2-panel__head"><div><span className="rv2-eyebrow">SINAV KATALOĞU</span><h2>Yayın ve politika görünümü</h2></div><ClipboardCheck size={20} /></div><div className="rv2-assessment-list">{assessments.map((item) => <article key={item.id}><span><FileQuestion size={19} /></span><div><strong>{item.title}</strong><small>v{item.current_version} · Geçme %{item.pass_score}</small></div><div><Clock3 size={14} /> {item.time_limit_minutes} dk · {item.max_attempts} deneme</div><StatusPill tone={item.status === "published" ? "success" : "neutral"}>{item.status === "published" ? "Yayında" : "Taslak"}</StatusPill></article>)}{!loading && !assessments.length ? <div className="rv2-program-empty"><FileQuestion size={28} /><h2>Henüz sınav yok</h2><p>İlk güvenli sınavınızı soru bankasıyla oluşturun.</p><Button onClick={() => setEditing(true)}><Plus size={16} /> Sınav oluştur</Button></div> : null}</div></Surface>
  </div>;
}
