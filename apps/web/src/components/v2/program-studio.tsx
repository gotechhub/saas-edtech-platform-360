"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  FileArchive,
  FileQuestion,
  FileText,
  GripVertical,
  Link2,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import {
  Button,
  SelectField,
  StatusPill,
  Surface,
  TextField,
  ToggleField,
} from "@respongo/ui-web";

type StepKind = "scorm" | "survey" | "exam" | "task" | "resource";
type ProgramStep = {
  id: string;
  kind: StepKind;
  title: string;
  required: boolean;
  detail: string;
  courseId?: string;
  profile?: string;
};
type Draft = {
  title: string;
  description: string;
  ordered: boolean;
  passScore: number;
  steps: ProgramStep[];
  published: boolean;
};
const storageKey = "respongo:oguz-law:program-builder:v2";
const defaults: Draft = {
  title: "Yeni Avukat Uyum Programı",
  description:
    "Mesleki uyum, bilgi güvenliği ve kurum uygulamalarını tek akışta tamamlar.",
  ordered: true,
  passScore: 70,
  published: false,
  steps: [
    {
      id: "zenefit-demo",
      kind: "scorm",
      title: "ZENEFIT EGITIMI",
      required: true,
      detail: "SCORM 2004 4th Edition · 85 dosya",
      profile: "scorm2004_single_v1",
    },
    {
      id: "welcome",
      kind: "resource",
      title: "Akademiye hoş geldiniz",
      required: true,
      detail: "PDF kaynak · 8 dk",
    },
    {
      id: "ethics",
      kind: "exam",
      title: "Meslek etiği ön değerlendirme",
      required: true,
      detail: "10 soru · Geçme %70",
    },
  ],
};
const stepMeta: Record<
  StepKind,
  { label: string; icon: typeof FileArchive; detail: string }
> = {
  scorm: { label: "SCORM 2004", icon: FileArchive, detail: "ZIP paket" },
  survey: {
    label: "Anket",
    icon: ClipboardList,
    detail: "Geri bildirim formu",
  },
  exam: { label: "Sınav", icon: FileQuestion, detail: "10 soru · Geçme %70" },
  task: {
    label: "Görev",
    icon: BookOpenCheck,
    detail: "Eğitmen onaylı teslim",
  },
  resource: {
    label: "Kaynak",
    icon: FileText,
    detail: "Doküman veya bağlantı",
  },
};

export function ProgramStudio() {
  const [draft, setDraft] = useState<Draft>(defaults);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(["Tüm avukatlar"]),
  );
  const [dueDate, setDueDate] = useState("2026-10-31");
  const [assignmentRequired, setAssignmentRequired] = useState(true);
  const [notice, setNotice] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setDraft(JSON.parse(saved) as Draft);
    } catch {}
  }, []);
  const requiredCount = useMemo(
    () => draft.steps.filter((x) => x.required).length,
    [draft.steps],
  );
  const updateStep = (id: string, patch: Partial<ProgramStep>) =>
    setDraft((v) => ({
      ...v,
      steps: v.steps.map((x) => (x.id === id ? { ...x, ...patch } : x)),
      published: false,
    }));
  const move = (index: number, direction: -1 | 1) =>
    setDraft((v) => {
      const next = [...v.steps],
        target = index + direction;
      if (target < 0 || target >= next.length) return v;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...v, steps: next, published: false };
    });
  const moveTo = (from: number, to: number) =>
    setDraft((v) => {
      if (
        from < 0 ||
        to < 0 ||
        from >= v.steps.length ||
        to >= v.steps.length ||
        from === to
      )
        return v;
      const next = [...v.steps];
      const [step] = next.splice(from, 1);
      next.splice(to, 0, step);
      return { ...v, steps: next, published: false };
    });
  const add = (kind: Exclude<StepKind, "scorm">) =>
    setDraft((v) => ({
      ...v,
      published: false,
      steps: [
        ...v.steps,
        {
          id: crypto.randomUUID(),
          kind,
          title: `Yeni ${stepMeta[kind].label}`,
          required: true,
          detail: stepMeta[kind].detail,
        },
      ],
    }));
  const save = () => {
    localStorage.setItem(storageKey, JSON.stringify(draft));
    setNotice("Taslak kaydedildi. Program sırası ve kuralları korundu.");
  };
  const publish = () => {
    if (!draft.title.trim() || !draft.steps.length) {
      setNotice("Yayın için program adı ve en az bir adım gerekli.");
      return;
    }
    const next = { ...draft, published: true };
    setDraft(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
    setNotice("Program yayınlandı ve atamaya hazır.");
  };
  const assign = () => {
    if (!draft.published) {
      setNotice("Atamadan önce programı yayınlayın.");
      return;
    }
    if (!selected.size || !dueDate) {
      setNotice("Hedef kitle ve son tarih seçin.");
      return;
    }
    const record = {
      id: crypto.randomUUID(),
      program: draft.title,
      audience: [...selected],
      dueDate,
      required: assignmentRequired,
      createdAt: new Date().toISOString(),
    };
    const key = "respongo:oguz-law:assignments:v1";
    let current: unknown[] = [];
    try {
      current = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown[];
    } catch {}
    localStorage.setItem(key, JSON.stringify([...current, record]));
    setNotice(
      `${draft.title}, ${[...selected].join(", ")} hedef kitlesine atandı.`,
    );
  };
  const upload = async (file: File) => {
    setUploading(true);
    setNotice("SCORM paketi güvenlik ve manifest kontrolünden geçiyor…");
    try {
      const response = await fetch("/api/demo/packages/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/zip" },
        body: file,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Paket doğrulanamadı");
      setDraft((v) => ({
        ...v,
        published: false,
        steps: [
          ...v.steps,
          {
            id: crypto.randomUUID(),
            kind: "scorm",
            title: result.title,
            required: true,
            detail: `${result.profile.includes("2004") ? "SCORM 2004" : "SCORM 1.2"} · ${result.fileCount} dosya`,
            profile: result.profile,
          },
        ],
      }));
      setNotice(`${result.title} doğrulandı ve programa eklendi.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Paket yüklenemedi");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  return (
    <div className="rv2-program-studio">
      <header className="rv2-page-header">
        <div>
          <span className="rv2-eyebrow">PROGRAM OLUŞTURUCU</span>
          <h1>Eğitim programı stüdyosu</h1>
          <p>
            SCORM, anket, sınav, görev ve kaynakları tek akışta düzenleyin;
            kuralları belirleyip hedef kitleye atayın.
          </p>
        </div>
        <div className="rv2-page-header__actions">
          <Button variant="secondary" onClick={save}>
            Taslağı kaydet
          </Button>
          <Button onClick={publish}>
            <Sparkles size={16} /> Yayınla
          </Button>
        </div>
      </header>
      {notice ? (
        <div className="rv2-builder-notice" role="status">
          <CheckCircle2 size={17} />
          <span>{notice}</span>
        </div>
      ) : null}
      <div className="rv2-builder-layout">
        <main>
          <Surface className="rv2-panel rv2-builder-basics">
            <div className="rv2-panel__head">
              <div>
                <span className="rv2-eyebrow">1 · PROGRAM BİLGİLERİ</span>
                <h2>Program kimliği</h2>
              </div>
              <StatusPill tone={draft.published ? "success" : "neutral"}>
                {draft.published ? "Yayında" : "Taslak"}
              </StatusPill>
            </div>
            <div className="rv2-builder-form">
              <TextField
                label="Program adı"
                value={draft.title}
                onChange={(e) =>
                  setDraft((v) => ({
                    ...v,
                    title: e.target.value,
                    published: false,
                  }))
                }
              />
              <TextField
                label="Açıklama"
                value={draft.description}
                onChange={(e) =>
                  setDraft((v) => ({
                    ...v,
                    description: e.target.value,
                    published: false,
                  }))
                }
              />
              <SelectField
                label="Geçme puanı"
                value={String(draft.passScore)}
                onChange={(e) =>
                  setDraft((v) => ({
                    ...v,
                    passScore: Number(e.target.value),
                    published: false,
                  }))
                }
                options={[60, 70, 75, 80, 85].map((x) => ({
                  value: String(x),
                  label: `%${x}`,
                }))}
              />
              <ToggleField
                label="Sıralı ilerleme"
                description="Bir adım tamamlanmadan sonraki adım açılmaz."
                checked={draft.ordered}
                onChange={(e) =>
                  setDraft((v) => ({
                    ...v,
                    ordered: e.target.checked,
                    published: false,
                  }))
                }
              />
            </div>
          </Surface>
          <Surface className="rv2-panel rv2-builder-flow">
            <div className="rv2-panel__head">
              <div>
                <span className="rv2-eyebrow">2 · İÇERİK AKIŞI</span>
                <h2>{draft.steps.length} program adımı</h2>
                <p>
                  {requiredCount} zorunlu adım · Yukarı/aşağı taşıyarak
                  sıralayın.
                </p>
              </div>
            </div>
            <div className="rv2-builder-add">
              <input
                ref={fileRef}
                type="file"
                accept=".zip,application/zip"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void upload(file);
                }}
              />
              <Button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                <Upload size={16} />
                {uploading ? "İnceleniyor…" : "SCORM ZIP"}
              </Button>
              {(["survey", "exam", "task", "resource"] as const).map((kind) => {
                const Icon = stepMeta[kind].icon;
                return (
                  <Button
                    variant="secondary"
                    key={kind}
                    onClick={() => add(kind)}
                  >
                    <Icon size={16} />
                    {stepMeta[kind].label}
                  </Button>
                );
              })}
            </div>
            <ol className="rv2-builder-steps">
              {draft.steps.map((step, index) => {
                const Icon = stepMeta[step.kind].icon;
                return (
                  <li
                    key={step.id}
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData("text/plain", String(index))
                    }
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      const from = Number(e.dataTransfer.getData("text/plain"));
                      if (Number.isInteger(from) && from !== index)
                        moveTo(from, index);
                    }}
                  >
                    <span className="rv2-builder-grip">
                      <GripVertical size={18} />
                      <b>{index + 1}</b>
                    </span>
                    <span className={`rv2-builder-kind is-${step.kind}`}>
                      <Icon size={19} />
                    </span>
                    <div>
                      <input
                        aria-label={`${index + 1}. adım adı`}
                        value={step.title}
                        onChange={(e) =>
                          updateStep(step.id, { title: e.target.value })
                        }
                      />
                      <small>
                        {stepMeta[step.kind].label} · {step.detail}
                      </small>
                    </div>
                    <label className="rv2-builder-required">
                      <input
                        type="checkbox"
                        checked={step.required}
                        onChange={(e) =>
                          updateStep(step.id, { required: e.target.checked })
                        }
                      />
                      <span>Zorunlu</span>
                    </label>
                    <div className="rv2-builder-row-actions">
                      <button
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                        aria-label={`${step.title} yukarı taşı`}
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        onClick={() => move(index, 1)}
                        disabled={index === draft.steps.length - 1}
                        aria-label={`${step.title} aşağı taşı`}
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        onClick={() =>
                          setDraft((v) => ({
                            ...v,
                            published: false,
                            steps: v.steps.filter((x) => x.id !== step.id),
                          }))
                        }
                        aria-label={`${step.title} sil`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Surface>
        </main>
        <aside>
          <Surface className="rv2-panel rv2-builder-assign">
            <div className="rv2-panel__head">
              <div>
                <span className="rv2-eyebrow">3 · ATAMA</span>
                <h2>Hedef kitle ve tarih</h2>
              </div>
              <Send size={20} />
            </div>
            <div className="rv2-audience-list">
              {[
                "Tüm avukatlar",
                "Yeni başlayanlar",
                "Kıdemli avukatlar",
                "Eğitmenler",
              ].map((name) => (
                <label key={name}>
                  <input
                    type="checkbox"
                    checked={selected.has(name)}
                    onChange={(e) =>
                      setSelected((current) => {
                        const next = new Set(current);
                        e.target.checked ? next.add(name) : next.delete(name);
                        return next;
                      })
                    }
                  />
                  <span>{name}</span>
                </label>
              ))}
            </div>
            <TextField
              label="Son tamamlama tarihi"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <ToggleField
              label="Zorunlu atama"
              description="Gecikenler uyumluluk raporuna girer."
              checked={assignmentRequired}
              onChange={(e) => setAssignmentRequired(e.target.checked)}
            />
            <Button onClick={assign} disabled={!draft.published}>
              <Send size={16} /> Programı ata
            </Button>
            <div className="rv2-builder-summary">
              <span>
                <FileArchive size={15} />
                {draft.steps.filter((x) => x.kind === "scorm").length} SCORM
              </span>
              <span>
                <FileQuestion size={15} />
                {draft.steps.filter((x) => x.kind === "exam").length} sınav
              </span>
              <span>
                <Link2 size={15} />
                {draft.steps.length} toplam adım
              </span>
            </div>
          </Surface>
        </aside>
      </div>
    </div>
  );
}
