"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  Copy,
  FileArchive,
  FileQuestion,
  FileText,
  GripVertical,
  Link2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  Upload,
  UsersRound,
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
type ProgramStatus = "draft" | "published" | "retired";
type Assignment = {
  id: string;
  audience: string[];
  dueDate: string;
  required: boolean;
  assignedAt: string;
  learners: number;
  completed: number;
};
type ProgramStep = {
  id: string;
  kind: StepKind;
  title: string;
  required: boolean;
  detail: string;
  description: string;
  passScore: number;
  questionCount: number;
  attempts: number;
  resourceUrl: string;
  approvalRequired: boolean;
  profile?: string;
};
type Program = {
  id: string;
  title: string;
  description: string;
  ordered: boolean;
  passScore: number;
  status: ProgramStatus;
  steps: ProgramStep[];
  assignments: Assignment[];
  updatedAt: string;
};
type View = "list" | "editor" | "assign" | "report";

const programsKey = "respongo:oguz-law:programs:v3";
const meta: Record<
  StepKind,
  { label: string; icon: typeof FileArchive; detail: string }
> = {
  scorm: { label: "SCORM", icon: FileArchive, detail: "ZIP paket" },
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
const step = (kind: StepKind, title?: string): ProgramStep => ({
  id: crypto.randomUUID(),
  kind,
  title: title ?? `Yeni ${meta[kind].label}`,
  required: true,
  detail: meta[kind].detail,
  description: "",
  passScore: 70,
  questionCount: kind === "survey" ? 5 : 10,
  attempts: 2,
  resourceUrl: "",
  approvalRequired: true,
});
const seeded: Program[] = [
  {
    id: "zenefit-z-kusagi",
    title: "Zenefit Z Kuşağı ile Çalışmak",
    description:
      "Z Kuşağını anlamak ve birlikte çalışmak için hazırlanan gelişim programı.",
    ordered: true,
    passScore: 80,
    status: "published",
    updatedAt: "2026-09-26T08:00:00.000Z",
    steps: [
      {
        ...step("scorm", "ZENEFIT EGITIMI"),
        id: "zenefit-scorm",
        detail: "SCORM 2004 4th Edition · 85 dosya",
        profile: "scorm2004_single_v1",
      },
      {
        ...step("resource", "Yönetici çalışma rehberi"),
        id: "zenefit-resource",
        detail: "PDF kaynak · 8 dk",
      },
      {
        ...step("task", "Ekip gözlem görevi"),
        id: "zenefit-task",
        description:
          "Bir ekip görüşmesini gözlemleyip kısa değerlendirme yükleyin.",
      },
      { ...step("survey", "Program deneyimi anketi"), id: "zenefit-survey" },
      { ...step("exam", "Kapanış sınavı"), id: "zenefit-exam", passScore: 80 },
    ],
    assignments: [
      {
        id: "assignment-1",
        audience: ["Tüm avukatlar"],
        dueDate: "2026-10-31",
        required: true,
        assignedAt: "2026-09-26",
        learners: 42,
        completed: 11,
      },
    ],
  },
];

function blankProgram(): Program {
  return {
    id: crypto.randomUUID(),
    title: "",
    description: "",
    ordered: true,
    passScore: 70,
    status: "draft",
    steps: [],
    assignments: [],
    updatedAt: new Date().toISOString(),
  };
}
function readPrograms() {
  try {
    const value = localStorage.getItem(programsKey);
    if (value) return JSON.parse(value) as Program[];
  } catch {}
  return seeded;
}

export function ProgramStudio() {
  const [programs, setPrograms] = useState<Program[]>(seeded);
  const [view, setView] = useState<View>("list");
  const [currentId, setCurrentId] = useState(seeded[0].id);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<Set<string>>(
    new Set(["Tüm avukatlar"]),
  );
  const [dueDate, setDueDate] = useState("2026-10-31");
  const [assignmentRequired, setAssignmentRequired] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => setPrograms(readPrograms()), []);
  const current = programs.find((p) => p.id === currentId) ?? programs[0];
  const selectedStep =
    current?.steps.find((item) => item.id === selectedStepId) ?? null;
  const visible = useMemo(
    () =>
      programs.filter((p) =>
        `${p.title} ${p.description}`
          .toLocaleLowerCase("tr")
          .includes(search.toLocaleLowerCase("tr")),
      ),
    [programs, search],
  );
  const persist = (next: Program[]) => {
    setPrograms(next);
    localStorage.setItem(programsKey, JSON.stringify(next));
  };
  const update = (change: Partial<Program>) =>
    persist(
      programs.map((p) =>
        p.id === currentId
          ? { ...p, ...change, updatedAt: new Date().toISOString() }
          : p,
      ),
    );
  const updateStep = (id: string, change: Partial<ProgramStep>) =>
    update({
      steps: current.steps.map((item) =>
        item.id === id ? { ...item, ...change } : item,
      ),
      status: "draft",
    });
  const open = (program: Program, next: View) => {
    setCurrentId(program.id);
    setSelectedStepId(null);
    setNotice("");
    setView(next);
  };
  const create = () => {
    const program = blankProgram();
    persist([program, ...programs]);
    open(program, "editor");
  };
  const duplicate = (program: Program) => {
    const copy = {
      ...program,
      id: crypto.randomUUID(),
      title: `${program.title} — Kopya`,
      status: "draft" as const,
      assignments: [],
      updatedAt: new Date().toISOString(),
      steps: program.steps.map((s) => ({ ...s, id: crypto.randomUUID() })),
    };
    persist([copy, ...programs]);
    setNotice("Program kopyalandı.");
  };
  const remove = (program: Program) => {
    if (program.assignments.length) {
      setNotice("Ataması bulunan program silinemez; önce arşivleyin.");
      return;
    }
    persist(programs.filter((p) => p.id !== program.id));
    setNotice("Taslak program silindi.");
  };
  const save = () => {
    if (!current.title.trim()) {
      setNotice("Program adı zorunludur.");
      return false;
    }
    update({});
    setNotice("Taslak ve bütün içerik ayarları kaydedildi.");
    return true;
  };
  const publish = () => {
    if (!current.title.trim() || !current.steps.length) {
      setNotice("Yayın için program adı ve en az bir içerik gerekli.");
      return;
    }
    if (current.steps.some((s) => !s.title.trim())) {
      setNotice("Tüm program adımlarının adı olmalı.");
      return;
    }
    update({ status: "published" });
    setNotice("Program yayınlandı. Artık hedef kitleye atanabilir.");
  };
  const add = (kind: Exclude<StepKind, "scorm">) => {
    const item = step(kind);
    update({ steps: [...current.steps, item], status: "draft" });
    setSelectedStepId(item.id);
    setNotice(
      `${meta[kind].label} eklendi. Ayrıntıları tamamlayıp Kaydet ve devam et seçin.`,
    );
  };
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= current.steps.length) return;
    const next = [...current.steps];
    [next[index], next[target]] = [next[target], next[index]];
    update({ steps: next, status: "draft" });
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
      const item = {
        ...step("scorm", result.title),
        detail: `${result.profile.includes("2004") ? "SCORM 2004" : "SCORM 1.2"} · ${result.fileCount} dosya`,
        profile: result.profile,
      };
      update({ steps: [...current.steps, item], status: "draft" });
      setSelectedStepId(item.id);
      setNotice(
        `${result.title} doğrulandı. Ayarlarını kontrol edip Kaydet ve devam et seçin.`,
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Paket yüklenemedi");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };
  const assign = () => {
    if (current.status !== "published") {
      setNotice("Atamadan önce programı yayınlayın.");
      return;
    }
    if (!selectedAudience.size || !dueDate) {
      setNotice("Hedef kitle ve son tarih zorunludur.");
      return;
    }
    const record: Assignment = {
      id: crypto.randomUUID(),
      audience: [...selectedAudience],
      dueDate,
      required: assignmentRequired,
      assignedAt: new Date().toISOString().slice(0, 10),
      learners: selectedAudience.has("Tüm avukatlar")
        ? 42
        : selectedAudience.size * 8,
      completed: 0,
    };
    update({ assignments: [...current.assignments, record] });
    setNotice("Atama oluşturuldu. Rapor ekranından izleyebilirsiniz.");
    setView("report");
  };

  if (view === "list")
    return (
      <ProgramList
        programs={visible}
        search={search}
        setSearch={setSearch}
        notice={notice}
        create={create}
        open={open}
        duplicate={duplicate}
        remove={remove}
      />
    );
  if (!current) return null;
  if (view === "assign")
    return (
      <AssignmentView
        program={current}
        selected={selectedAudience}
        setSelected={setSelectedAudience}
        dueDate={dueDate}
        setDueDate={setDueDate}
        required={assignmentRequired}
        setRequired={setAssignmentRequired}
        notice={notice}
        back={() => setView("list")}
        assign={assign}
      />
    );
  if (view === "report")
    return (
      <ReportView
        program={current}
        notice={notice}
        back={() => setView("list")}
        edit={() => setView("editor")}
        assign={() => setView("assign")}
      />
    );
  return (
    <EditorView
      program={current}
      selectedStep={selectedStep}
      notice={notice}
      uploading={uploading}
      fileRef={fileRef}
      back={() => setView("list")}
      save={save}
      publish={publish}
      assign={() => {
        if (current.status !== "published") {
          setNotice("Önce programı yayınlayın.");
          return;
        }
        setView("assign");
      }}
      report={() => setView("report")}
      add={add}
      upload={upload}
      selectStep={setSelectedStepId}
      update={update}
      updateStep={updateStep}
      move={move}
      removeStep={(id) => {
        update({
          steps: current.steps.filter((s) => s.id !== id),
          status: "draft",
        });
        if (selectedStepId === id) setSelectedStepId(null);
      }}
    />
  );
}

function ProgramList({
  programs,
  search,
  setSearch,
  notice,
  create,
  open,
  duplicate,
  remove,
}: {
  programs: Program[];
  search: string;
  setSearch: (v: string) => void;
  notice: string;
  create: () => void;
  open: (p: Program, v: View) => void;
  duplicate: (p: Program) => void;
  remove: (p: Program) => void;
}) {
  const published = programs.filter((p) => p.status === "published").length;
  const assignments = programs.reduce((n, p) => n + p.assignments.length, 0);
  return (
    <div className="rv2-program-studio rv2-program-library">
      <header className="rv2-page-header">
        <div>
          <span className="rv2-eyebrow">ÖĞRENME YÖNETİMİ</span>
          <h1>Eğitim programları</h1>
          <p>
            Programları oluşturun, içerik akışlarını yönetin, hedef kitleye
            atayın ve sonuçlarını raporlayın.
          </p>
        </div>
        <div className="rv2-page-header__actions">
          <Button onClick={create}>
            <Plus size={16} /> Yeni eğitim programı
          </Button>
        </div>
      </header>
      {notice ? (
        <div className="rv2-builder-notice" role="status">
          <CheckCircle2 size={17} />
          {notice}
        </div>
      ) : null}
      <section className="rv2-metrics rv2-metrics--compact">
        <Surface className="rv2-mini-metric">
          <span>Toplam program</span>
          <strong>{programs.length}</strong>
          <small>Aktif portföy</small>
        </Surface>
        <Surface className="rv2-mini-metric">
          <span>Yayında</span>
          <strong>{published}</strong>
          <small>Atamaya hazır</small>
        </Surface>
        <Surface className="rv2-mini-metric">
          <span>Aktif atama</span>
          <strong>{assignments}</strong>
          <small>Hedef kitle akışları</small>
        </Surface>
        <Surface className="rv2-mini-metric">
          <span>Ortalama tamamlama</span>
          <strong>%26</strong>
          <small>Canlı rapor görünümü</small>
        </Surface>
      </section>
      <Surface className="rv2-panel rv2-program-list-panel">
        <div className="rv2-program-toolbar">
          <label>
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Programlarda ara"
            />
          </label>
          <span>{programs.length} program</span>
        </div>
        <div className="rv2-program-list">
          {programs.map((program) => {
            const learners = program.assignments.reduce(
              (n, a) => n + a.learners,
              0,
            );
            const completed = program.assignments.reduce(
              (n, a) => n + a.completed,
              0,
            );
            const rate = learners
              ? Math.round((completed / learners) * 100)
              : 0;
            return (
              <article key={program.id}>
                <span className="rv2-program-list__icon">
                  <FileArchive size={20} />
                </span>
                <div>
                  <div className="rv2-program-list__title">
                    <strong>{program.title || "Adsız program"}</strong>
                    <StatusPill
                      tone={
                        program.status === "published" ? "success" : "neutral"
                      }
                    >
                      {program.status === "published" ? "Yayında" : "Taslak"}
                    </StatusPill>
                  </div>
                  <small>
                    {program.steps.length} içerik · {program.assignments.length}{" "}
                    atama · Son güncelleme{" "}
                    {new Date(program.updatedAt).toLocaleDateString("tr-TR")}
                  </small>
                </div>
                <div className="rv2-program-list__progress">
                  <strong>%{rate}</strong>
                  <span>Tamamlanma</span>
                </div>
                <div className="rv2-program-list__actions">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => open(program, "editor")}
                  >
                    <Pencil size={14} /> Düzenle
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      open(
                        program,
                        program.status === "published" ? "assign" : "editor",
                      )
                    }
                  >
                    <Send size={14} /> Ata
                  </Button>
                  <button
                    aria-label={`${program.title} raporu`}
                    onClick={() => open(program, "report")}
                  >
                    <BarChart3 size={17} />
                  </button>
                  <button
                    aria-label={`${program.title} kopyala`}
                    onClick={() => duplicate(program)}
                  >
                    <Copy size={17} />
                  </button>
                  <button
                    aria-label={`${program.title} sil`}
                    onClick={() => remove(program)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </article>
            );
          })}
          {!programs.length ? (
            <div className="rv2-program-empty">
              <FileArchive size={28} />
              <h2>Henüz program yok</h2>
              <p>İlk eğitim programınızı oluşturarak başlayın.</p>
              <Button onClick={create}>
                <Plus size={16} /> Program oluştur
              </Button>
            </div>
          ) : null}
        </div>
      </Surface>
    </div>
  );
}

function EditorView({
  program,
  selectedStep,
  notice,
  uploading,
  fileRef,
  back,
  save,
  publish,
  assign,
  report,
  add,
  upload,
  selectStep,
  update,
  updateStep,
  move,
  removeStep,
}: {
  program: Program;
  selectedStep: ProgramStep | null;
  notice: string;
  uploading: boolean;
  fileRef: React.RefObject<HTMLInputElement | null>;
  back: () => void;
  save: () => boolean;
  publish: () => void;
  assign: () => void;
  report: () => void;
  add: (k: Exclude<StepKind, "scorm">) => void;
  upload: (f: File) => void;
  selectStep: (id: string | null) => void;
  update: (p: Partial<Program>) => void;
  updateStep: (id: string, p: Partial<ProgramStep>) => void;
  move: (i: number, d: -1 | 1) => void;
  removeStep: (id: string) => void;
}) {
  return (
    <div className="rv2-program-studio">
      <header className="rv2-page-header">
        <div>
          <button className="rv2-back-link" onClick={back}>
            <ArrowLeft size={15} /> Programlar
          </button>
          <span className="rv2-eyebrow">PROGRAM OLUŞTURUCU</span>
          <h1>{program.title || "Yeni eğitim programı"}</h1>
          <p>
            Program bilgilerini tamamlayın, içerikleri yapılandırın ve
            yayınlayın.
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
          {notice}
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
              <StatusPill
                tone={program.status === "published" ? "success" : "neutral"}
              >
                {program.status === "published" ? "Yayında" : "Taslak"}
              </StatusPill>
            </div>
            <div className="rv2-builder-form">
              <TextField
                label="Program adı"
                required
                placeholder="Örn. Yeni Avukat Uyum Programı"
                value={program.title}
                onChange={(e) =>
                  update({ title: e.target.value, status: "draft" })
                }
              />
              <TextField
                label="Açıklama"
                placeholder="Programın amacı ve kapsamı"
                value={program.description}
                onChange={(e) =>
                  update({ description: e.target.value, status: "draft" })
                }
              />
              <SelectField
                label="Program geçme puanı"
                value={String(program.passScore)}
                onChange={(e) =>
                  update({ passScore: Number(e.target.value), status: "draft" })
                }
                options={[60, 70, 75, 80, 85].map((v) => ({
                  value: String(v),
                  label: `%${v}`,
                }))}
              />
              <ToggleField
                label="Sıralı ilerleme"
                description="Bir adım tamamlanmadan sonraki adım açılmaz."
                checked={program.ordered}
                onChange={(e) =>
                  update({ ordered: e.target.checked, status: "draft" })
                }
              />
            </div>
          </Surface>
          <Surface className="rv2-panel rv2-builder-flow">
            <div className="rv2-panel__head">
              <div>
                <span className="rv2-eyebrow">2 · İÇERİK AKIŞI</span>
                <h2>{program.steps.length} program adımı</h2>
                <p>
                  Bir içerik ekledikten sonra ayrıntılarını tamamlayıp devam
                  edin.
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
                const Icon = meta[kind].icon;
                return (
                  <Button
                    variant="secondary"
                    key={kind}
                    onClick={() => add(kind)}
                  >
                    <Icon size={16} />
                    {meta[kind].label}
                  </Button>
                );
              })}
            </div>
            {!program.steps.length ? (
              <div className="rv2-builder-empty">
                <Plus size={24} />
                <h3>İlk içeriği ekleyin</h3>
                <p>
                  SCORM ZIP yükleyin veya anket, sınav, görev ve kaynak
                  oluşturun.
                </p>
              </div>
            ) : (
              <ol className="rv2-builder-steps">
                {program.steps.map((item, index) => {
                  const Icon = meta[item.kind].icon;
                  return (
                    <li
                      key={item.id}
                      className={
                        selectedStep?.id === item.id ? "is-selected" : ""
                      }
                    >
                      <span className="rv2-builder-grip">
                        <GripVertical size={18} />
                        <b>{index + 1}</b>
                      </span>
                      <span className={`rv2-builder-kind is-${item.kind}`}>
                        <Icon size={19} />
                      </span>
                      <button
                        className="rv2-builder-step-open"
                        onClick={() => selectStep(item.id)}
                      >
                        <strong>{item.title}</strong>
                        <small>
                          {meta[item.kind].label} · {item.detail}
                        </small>
                      </button>
                      <label className="rv2-builder-required">
                        <input
                          type="checkbox"
                          checked={item.required}
                          onChange={(e) =>
                            updateStep(item.id, { required: e.target.checked })
                          }
                        />
                        <span>Zorunlu</span>
                      </label>
                      <div className="rv2-builder-row-actions">
                        <button
                          onClick={() => move(index, -1)}
                          disabled={index === 0}
                          aria-label={`${item.title} yukarı taşı`}
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          onClick={() => move(index, 1)}
                          disabled={index === program.steps.length - 1}
                          aria-label={`${item.title} aşağı taşı`}
                        >
                          <ArrowDown size={16} />
                        </button>
                        <button
                          onClick={() => removeStep(item.id)}
                          aria-label={`${item.title} sil`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
            {selectedStep ? (
              <StepEditor
                item={selectedStep}
                update={(change) => updateStep(selectedStep.id, change)}
                close={() => {
                  selectStep(null);
                }}
              />
            ) : null}
          </Surface>
        </main>
        <aside>
          <Surface className="rv2-panel rv2-builder-assign rv2-builder-next">
            <div className="rv2-panel__head">
              <div>
                <span className="rv2-eyebrow">3 · YAYIN VE ATAMA</span>
                <h2>Sıradaki adım</h2>
              </div>
              <ArrowRight size={20} />
            </div>
            <div className="rv2-publish-checks">
              <span className={program.title ? "is-done" : ""}>
                <CheckCircle2 size={16} /> Program bilgileri
              </span>
              <span className={program.steps.length ? "is-done" : ""}>
                <CheckCircle2 size={16} /> En az bir içerik
              </span>
              <span className={program.status === "published" ? "is-done" : ""}>
                <CheckCircle2 size={16} /> Yayın onayı
              </span>
            </div>
            <Button variant="secondary" onClick={save}>
              Taslağı kaydet
            </Button>
            <Button onClick={program.status === "published" ? assign : publish}>
              {program.status === "published" ? (
                <>
                  <Send size={16} /> Atama oluştur
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Programı yayınla
                </>
              )}
            </Button>
            {program.assignments.length ? (
              <Button variant="secondary" onClick={report}>
                <BarChart3 size={16} /> Raporu görüntüle
              </Button>
            ) : null}
            <div className="rv2-builder-summary">
              <span>
                <FileArchive size={15} />
                {program.steps.filter((x) => x.kind === "scorm").length} SCORM
              </span>
              <span>
                <FileQuestion size={15} />
                {program.steps.filter((x) => x.kind === "exam").length} sınav
              </span>
              <span>
                <Link2 size={15} />
                {program.steps.length} toplam
              </span>
            </div>
          </Surface>
        </aside>
      </div>
    </div>
  );
}

function StepEditor({
  item,
  update,
  close,
}: {
  item: ProgramStep;
  update: (p: Partial<ProgramStep>) => void;
  close: () => void;
}) {
  return (
    <div className="rv2-step-editor">
      <div className="rv2-panel__head">
        <div>
          <span className="rv2-eyebrow">İÇERİK AYARLARI</span>
          <h3>{meta[item.kind].label} ayrıntıları</h3>
        </div>
        <StatusPill tone="info">
          {item.required ? "Zorunlu" : "İsteğe bağlı"}
        </StatusPill>
      </div>
      <div className="rv2-step-editor__grid">
        <TextField
          label="İçerik adı"
          required
          value={item.title}
          onChange={(e) => update({ title: e.target.value })}
        />
        <TextField
          label="Açıklama / yönerge"
          value={item.description}
          onChange={(e) => update({ description: e.target.value })}
        />
        {item.kind === "exam" ? (
          <>
            <TextField
              label="Soru sayısı"
              type="number"
              min={1}
              max={100}
              value={item.questionCount}
              onChange={(e) =>
                update({
                  questionCount: Number(e.target.value),
                  detail: `${e.target.value} soru · Geçme %${item.passScore}`,
                })
              }
            />
            <SelectField
              label="Geçme puanı"
              value={String(item.passScore)}
              onChange={(e) =>
                update({
                  passScore: Number(e.target.value),
                  detail: `${item.questionCount} soru · Geçme %${e.target.value}`,
                })
              }
              options={[60, 70, 75, 80, 85].map((v) => ({
                value: String(v),
                label: `%${v}`,
              }))}
            />
            <TextField
              label="Deneme hakkı"
              type="number"
              min={1}
              max={10}
              value={item.attempts}
              onChange={(e) => update({ attempts: Number(e.target.value) })}
            />
          </>
        ) : null}
        {item.kind === "survey" ? (
          <TextField
            label="Soru sayısı"
            type="number"
            min={1}
            max={50}
            value={item.questionCount}
            onChange={(e) =>
              update({
                questionCount: Number(e.target.value),
                detail: `${e.target.value} soru · Geri bildirim formu`,
              })
            }
          />
        ) : null}
        {item.kind === "task" ? (
          <ToggleField
            label="Eğitmen onayı gerekli"
            description="Teslim tamamlanmadan önce eğitmen kontrol eder."
            checked={item.approvalRequired}
            onChange={(e) => update({ approvalRequired: e.target.checked })}
          />
        ) : null}
        {item.kind === "resource" ? (
          <>
            <SelectField
              label="Kaynak türü"
              value={item.detail.split(" · ")[0]}
              onChange={(e) => update({ detail: `${e.target.value} · Kaynak` })}
              options={["PDF", "Video", "Bağlantı", "Şablon"].map((v) => ({
                value: v,
                label: v,
              }))}
            />
            <TextField
              label="Kaynak bağlantısı"
              type="url"
              placeholder="https://"
              value={item.resourceUrl}
              onChange={(e) => update({ resourceUrl: e.target.value })}
            />
          </>
        ) : null}
        {item.kind === "scorm" ? (
          <div className="rv2-scorm-proof">
            <CheckCircle2 size={18} />
            <div>
              <strong>
                {item.profile?.includes("2004")
                  ? "SCORM 2004 doğrulandı"
                  : "SCORM 1.2 doğrulandı"}
              </strong>
              <small>{item.detail}</small>
            </div>
          </div>
        ) : null}
      </div>
      <div className="rv2-step-editor__actions">
        <Button variant="secondary" onClick={close}>
          Kapat
        </Button>
        <Button onClick={close}>
          Kaydet ve devam et <ArrowRight size={15} />
        </Button>
      </div>
    </div>
  );
}

function AssignmentView({
  program,
  selected,
  setSelected,
  dueDate,
  setDueDate,
  required,
  setRequired,
  notice,
  back,
  assign,
}: {
  program: Program;
  selected: Set<string>;
  setSelected: (v: Set<string>) => void;
  dueDate: string;
  setDueDate: (v: string) => void;
  required: boolean;
  setRequired: (v: boolean) => void;
  notice: string;
  back: () => void;
  assign: () => void;
}) {
  const audiences = [
    "Tüm avukatlar",
    "Yeni başlayanlar",
    "Kıdemli avukatlar",
    "Eğitmenler",
  ];
  return (
    <div className="rv2-program-studio">
      <header className="rv2-page-header">
        <div>
          <button className="rv2-back-link" onClick={back}>
            <ArrowLeft size={15} /> Programlar
          </button>
          <span className="rv2-eyebrow">PROGRAM ATAMA</span>
          <h1>{program.title}</h1>
          <p>
            Hedef kitleyi, tamamlanma tarihini ve zorunluluk politikasını
            belirleyin.
          </p>
        </div>
      </header>
      {notice ? (
        <div className="rv2-builder-notice">
          <CheckCircle2 size={17} />
          {notice}
        </div>
      ) : null}
      <div className="rv2-assignment-layout">
        <Surface className="rv2-panel">
          <div className="rv2-panel__head">
            <div>
              <span className="rv2-eyebrow">HEDEF KİTLE</span>
              <h2>Kime atanacak?</h2>
            </div>
            <UsersRound size={20} />
          </div>
          <div className="rv2-audience-list rv2-audience-list--large">
            {audiences.map((name) => (
              <label key={name}>
                <input
                  type="checkbox"
                  checked={selected.has(name)}
                  onChange={(e) => {
                    const next = new Set(selected);
                    e.target.checked ? next.add(name) : next.delete(name);
                    if (name === "Tüm avukatlar" && e.target.checked)
                      audiences.slice(1).forEach((x) => next.delete(x));
                    else if (e.target.checked) next.delete("Tüm avukatlar");
                    setSelected(next);
                  }}
                />
                <span>
                  <strong>{name}</strong>
                  <small>
                    {name === "Tüm avukatlar"
                      ? "42 aktif kullanıcı"
                      : "Rol ve ekip koşuluyla dinamik kitle"}
                  </small>
                </span>
              </label>
            ))}
          </div>
        </Surface>
        <Surface className="rv2-panel rv2-assignment-settings">
          <span className="rv2-eyebrow">ATAMA KURALLARI</span>
          <TextField
            label="Son tamamlama tarihi"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <ToggleField
            label="Zorunlu atama"
            description="Geciken kullanıcılar uyumluluk raporunda gösterilir."
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
          />
          <div className="rv2-assignment-preview">
            <strong>
              {selected.has("Tüm avukatlar") ? 42 : selected.size * 8}
            </strong>
            <span>tahmini kullanıcı</span>
            <small>
              {program.steps.length} içerik · Geçme %{program.passScore}
            </small>
          </div>
          <Button onClick={assign}>
            <Send size={16} /> Atamayı başlat
          </Button>
        </Surface>
      </div>
    </div>
  );
}

function ReportView({
  program,
  notice,
  back,
  edit,
  assign,
}: {
  program: Program;
  notice: string;
  back: () => void;
  edit: () => void;
  assign: () => void;
}) {
  const learners = program.assignments.reduce((n, a) => n + a.learners, 0),
    completed = program.assignments.reduce((n, a) => n + a.completed, 0),
    rate = learners ? Math.round((completed / learners) * 100) : 0;
  return (
    <div className="rv2-program-studio">
      <header className="rv2-page-header">
        <div>
          <button className="rv2-back-link" onClick={back}>
            <ArrowLeft size={15} /> Programlar
          </button>
          <span className="rv2-eyebrow">PROGRAM RAPORU</span>
          <h1>{program.title}</h1>
          <p>Atama, tamamlama ve uyumluluk sonuçlarını izleyin.</p>
        </div>
        <div className="rv2-page-header__actions">
          <Button variant="secondary" onClick={edit}>
            <Pencil size={15} /> Düzenle
          </Button>
          <Button onClick={assign}>
            <Send size={15} /> Yeni atama
          </Button>
        </div>
      </header>
      {notice ? (
        <div className="rv2-builder-notice" role="status">
          <CheckCircle2 size={17} />
          {notice}
        </div>
      ) : null}
      <section className="rv2-metrics">
        <Surface className="rv2-metric">
          <div className="rv2-metric__top">
            <span>Atanan kullanıcı</span>
            <i>
              <UsersRound size={17} />
            </i>
          </div>
          <strong>{learners}</strong>
          <small>{program.assignments.length} aktif atama</small>
        </Surface>
        <Surface className="rv2-metric rv2-metric--success">
          <div className="rv2-metric__top">
            <span>Tamamlayan</span>
            <i>
              <CheckCircle2 size={17} />
            </i>
          </div>
          <strong>{completed}</strong>
          <small>%{rate} tamamlama</small>
        </Surface>
        <Surface className="rv2-metric rv2-metric--warning">
          <div className="rv2-metric__top">
            <span>Devam eden</span>
            <i>
              <ArrowRight size={17} />
            </i>
          </div>
          <strong>{Math.max(0, learners - completed)}</strong>
          <small>Aktif öğrenen</small>
        </Surface>
        <Surface className="rv2-metric">
          <div className="rv2-metric__top">
            <span>Ortalama puan</span>
            <i>
              <BarChart3 size={17} />
            </i>
          </div>
          <strong>%78</strong>
          <small>Geçme %{program.passScore}</small>
        </Surface>
      </section>
      <Surface className="rv2-panel rv2-report-table">
        <div className="rv2-panel__head">
          <div>
            <span className="rv2-eyebrow">ATAMA KIRILIMI</span>
            <h2>Program atamaları</h2>
          </div>
        </div>
        {program.assignments.length ? (
          program.assignments.map((a) => (
            <div className="rv2-assignment-row" key={a.id}>
              <span>
                <strong>{a.audience.join(", ")}</strong>
                <small>
                  {a.assignedAt} tarihinde atandı · Son tarih {a.dueDate}
                </small>
              </span>
              <StatusPill tone={a.required ? "warning" : "info"}>
                {a.required ? "Zorunlu" : "İsteğe bağlı"}
              </StatusPill>
              <span>
                <strong>
                  {a.completed}/{a.learners}
                </strong>
                <small>Tamamlayan</small>
              </span>
              <button aria-label="Atama seçenekleri">
                <MoreHorizontal size={17} />
              </button>
            </div>
          ))
        ) : (
          <div className="rv2-program-empty">
            <BarChart3 size={28} />
            <h2>Henüz rapor verisi yok</h2>
            <p>Programı hedef kitleye atadığınızda sonuçlar burada görünür.</p>
            <Button onClick={assign}>
              <Send size={16} /> İlk atamayı oluştur
            </Button>
          </div>
        )}
      </Surface>
    </div>
  );
}
