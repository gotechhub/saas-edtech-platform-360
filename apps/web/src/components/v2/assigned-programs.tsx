"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileArchive,
  FileQuestion,
  FileText,
  Play,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { Button, ProgressBar, StatusPill, Surface } from "@respongo/ui-web";

type StepKind = "scorm" | "survey" | "exam" | "task" | "resource";
type ProgramStep = {
  id: string;
  kind: StepKind;
  title: string;
  required: boolean;
  detail: string;
  description?: string;
};
type Assignment = {
  id: string;
  audience: string[];
  dueDate: string;
  required: boolean;
  assignedAt: string;
  learners: number;
  completed: number;
};
type Program = {
  id: string;
  title: string;
  description: string;
  status: string;
  steps: ProgramStep[];
  assignments: Assignment[];
  serverId?: string;
  enrollment?: { id: string; revision: number };
};
type ProgressRecord = { completedIds: string[]; updatedAt: string };
const programsKey = "respongo:oguz-law:programs:v3";
const progressKey = "respongo:oguz-law:learner-progress:v1";
const programsApi = "/api/v2/programs";
const icons = {
  scorm: FileArchive,
  survey: FileQuestion,
  exam: FileQuestion,
  task: CheckCircle2,
  resource: FileText,
};

function read<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "") as T;
  } catch {
    return fallback;
  }
}

export function AssignedPrograms({
  basePath,
  compact = false,
}: {
  basePath: string;
  compact?: boolean;
}) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [progress, setProgress] = useState<Record<string, ProgressRecord>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    setPrograms(read<Program[]>(programsKey, []));
    setProgress(read<Record<string, ProgressRecord>>(progressKey, {}));
    fetch(`${programsApi}?industry=avukat&tenant=oguzlawacademy`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("PROGRAM_READ_FAILED");
        return response.json();
      })
      .then(
        (payload: {
          membershipId: string;
          programs: Array<Record<string, unknown>>;
          versions: Array<Record<string, unknown>>;
          assignments: Array<Record<string, unknown>>;
          enrollments: Array<Record<string, unknown>>;
        }) => {
          const ownEnrollments = payload.enrollments.filter(
            (item) => item.membership_id === payload.membershipId,
          );
          const liveProgress: Record<string, ProgressRecord> = {};
          const live = payload.programs.flatMap((row) => {
            if (row.status !== "published") return [];
            const assignment = payload.assignments.find(
              (item) =>
                item.program_id === row.id &&
                ownEnrollments.some(
                  (enrollment) => enrollment.assignment_id === item.id,
                ),
            );
            if (!assignment) return [];
            const enrollment = ownEnrollments.find(
              (item) => item.assignment_id === assignment.id,
            );
            const version = payload.versions.find(
              (item) =>
                item.program_id === row.id && item.state === "published",
            );
            const definition = (version?.definition ?? {}) as {
              items?: Array<Record<string, unknown>>;
            };
            const completedIds =
              (
                enrollment?.progress_detail as
                  | { completed_step_ids?: string[] }
                  | undefined
              )?.completed_step_ids ?? [];
            liveProgress[String(row.id)] = {
              completedIds,
              updatedAt: String(enrollment?.last_activity_at ?? ""),
            };
            return [
              {
                id: String(row.id),
                serverId: String(row.id),
                title: String(row.title ?? ""),
                description: String(row.description ?? ""),
                status: "published",
                enrollment: enrollment
                  ? {
                      id: String(enrollment.id),
                      revision: Number(enrollment.revision ?? 1),
                    }
                  : undefined,
                steps: (definition.items ?? []).map((item, index) => ({
                  id: String(item.id ?? `step-${index + 1}`),
                  kind: ([
                    "scorm",
                    "survey",
                    "exam",
                    "task",
                    "resource",
                  ].includes(String(item.kind))
                    ? item.kind
                    : String(item.sourceType).startsWith("scorm")
                      ? "scorm"
                      : "resource") as StepKind,
                  title: String(item.title ?? `İçerik ${index + 1}`),
                  required: item.required !== false,
                  detail: String(item.detail ?? "Öğrenme içeriği"),
                  description: String(item.description ?? ""),
                })),
                assignments: [
                  {
                    id: String(assignment.id),
                    audience:
                      assignment.audience_type === "everyone"
                        ? ["Tüm avukatlar"]
                        : ["Rol hedef kitlesi"],
                    dueDate: String(assignment.due_at ?? "").slice(0, 10),
                    required: assignment.required === true,
                    assignedAt: String(assignment.created_at ?? "").slice(
                      0,
                      10,
                    ),
                    learners: 1,
                    completed: enrollment?.state === "completed" ? 1 : 0,
                  },
                ],
              } satisfies Program,
            ];
          });
          if (live.length) {
            setPrograms(live);
            setProgress(liveProgress);
            localStorage.setItem(progressKey, JSON.stringify(liveProgress));
          }
        },
      )
      .catch(() => undefined);
  }, []);
  const assigned = useMemo(
    () =>
      programs.filter(
        (program) =>
          program.status === "published" &&
          program.assignments.some(
            (a) =>
              a.audience.includes("Tüm avukatlar") ||
              a.audience.includes("Yeni başlayanlar") ||
              a.audience.includes("Kıdemli avukatlar"),
          ),
      ),
    [programs],
  );
  const active = assigned.find((p) => p.id === activeId);
  const saveProgress = async (programId: string, completedIds: string[]) => {
    const next = {
      ...progress,
      [programId]: { completedIds, updatedAt: new Date().toISOString() },
    };
    setProgress(next);
    localStorage.setItem(progressKey, JSON.stringify(next));
    const program = programs.find((item) => item.id === programId);
    if (!program?.enrollment) return;
    const response = await fetch(programsApi, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        industry: "avukat",
        tenant: "oguzlawacademy",
        action: "progress",
        enrollmentId: program.enrollment.id,
        completedStepIds: completedIds,
        totalSteps: program.steps.length,
        expectedRevision: program.enrollment.revision,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "PROGRESS_SAVE_FAILED");
    setPrograms((items) =>
      items.map((item) =>
        item.id === programId && item.enrollment
          ? {
              ...item,
              enrollment: {
                ...item.enrollment,
                revision: Number(
                  result.data?.revision ?? item.enrollment.revision,
                ),
              },
            }
          : item,
      ),
    );
  };
  if (!assigned.length) return null;
  if (active) {
    const record = progress[active.id] ?? { completedIds: [], updatedAt: "" };
    const nextStep = active.steps.find(
      (item) => !record.completedIds.includes(item.id),
    );
    const percent = active.steps.length
      ? Math.round((record.completedIds.length / active.steps.length) * 100)
      : 0;
    return (
      <Surface className="rv2-panel rv2-learner-program-player">
        <button
          className="rv2-back-link"
          onClick={() => {
            setActiveId(null);
            setNotice("");
          }}
        >
          <ArrowLeft size={15} /> Atanan programlar
        </button>
        <div className="rv2-panel__head">
          <div>
            <span className="rv2-eyebrow">ATANAN PROGRAM</span>
            <h2>{active.title}</h2>
            <p>{active.description}</p>
          </div>
          <StatusPill tone={percent === 100 ? "success" : "warning"}>
            {percent === 100 ? "Tamamlandı" : `%${percent}`}
          </StatusPill>
        </div>
        <ProgressBar value={percent} label={`${active.title} ilerlemesi`} />
        {notice ? (
          <div className="rv2-builder-notice" role="status">
            <CheckCircle2 size={17} />
            {notice}
          </div>
        ) : null}
        <div className="rv2-learner-program-layout">
          <ol>
            {active.steps.map((item, index) => {
              const Icon = icons[item.kind];
              const done = record.completedIds.includes(item.id);
              const current = nextStep?.id === item.id;
              return (
                <li
                  key={item.id}
                  className={done ? "is-done" : current ? "is-current" : ""}
                >
                  <span>{done ? <CheckCircle2 size={17} /> : index + 1}</span>
                  <Icon size={18} />
                  <div>
                    <strong>{item.title}</strong>
                    <small>
                      {item.detail}
                      {item.required ? " · Zorunlu" : ""}
                    </small>
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="rv2-learner-program-content">
            {percent === 100 ? (
              <>
                <Trophy size={34} />
                <span className="rv2-eyebrow">PROGRAM TAMAMLANDI</span>
                <h3>Tebrikler!</h3>
                <p>Tüm program adımlarını başarıyla tamamladınız.</p>
              </>
            ) : nextStep ? (
              <>
                <span className={`rv2-builder-kind is-${nextStep.kind}`}>
                  {(() => {
                    const Icon = icons[nextStep.kind];
                    return <Icon size={22} />;
                  })()}
                </span>
                <span className="rv2-eyebrow">SIRADAKİ ADIM</span>
                <h3>{nextStep.title}</h3>
                <p>{nextStep.description || nextStep.detail}</p>
                {nextStep.kind === "scorm" ? (
                  <Link
                    className="rv2-button rv2-button--secondary rv2-button--md"
                    href="/lab/scorm"
                    target="_blank"
                  >
                    <Play size={16} /> SCORM önizlemesini aç
                  </Link>
                ) : null}
                <Button
                  onClick={async () => {
                    try {
                      await saveProgress(active.id, [
                        ...record.completedIds,
                        nextStep.id,
                      ]);
                      setNotice(
                        `${nextStep.title} tamamlandı. Sonraki adım açıldı.`,
                      );
                    } catch {
                      setNotice(
                        "İlerleme bu cihazda korundu; sunucu senkronizasyonu tekrar denenecek.",
                      );
                    }
                  }}
                >
                  <CheckCircle2 size={16} /> Adımı tamamla ve devam et
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </Surface>
    );
  }
  if (compact)
    return (
      <Surface className="rv2-panel rv2-assigned-programs rv2-assigned-programs--compact">
        <div className="rv2-panel__head">
          <div>
            <span className="rv2-eyebrow">YENİ ATAMA</span>
            <h2>Atanan eğitim programların</h2>
          </div>
          <StatusPill tone="warning">{assigned.length} program</StatusPill>
        </div>
        {assigned.slice(0, 2).map((program) => {
          const completed = progress[program.id]?.completedIds.length ?? 0;
          const value = program.steps.length
            ? Math.round((completed / program.steps.length) * 100)
            : 0;
          return (
            <div className="rv2-assigned-program-row" key={program.id}>
              <span>
                <ShieldCheck size={18} />
              </span>
              <div>
                <strong>{program.title}</strong>
                <small>
                  {program.steps.length} adım · Son tarih{" "}
                  {program.assignments.at(-1)?.dueDate}
                </small>
                <ProgressBar
                  value={value}
                  label={`${program.title} ilerlemesi`}
                />
              </div>
              <Link href={`${basePath}/learning`}>
                Atamayı aç <ArrowRight size={14} />
              </Link>
            </div>
          );
        })}
      </Surface>
    );
  return (
    <section className="rv2-assigned-programs">
      <div className="rv2-section-heading">
        <div>
          <span className="rv2-eyebrow">ATANAN PROGRAMLAR</span>
          <h2>Zorunlu ve planlı öğrenmelerin</h2>
        </div>
        <StatusPill tone="warning">{assigned.length} aktif</StatusPill>
      </div>
      <div className="rv2-assigned-program-grid">
        {assigned.map((program) => {
          const completed = progress[program.id]?.completedIds.length ?? 0;
          const value = program.steps.length
            ? Math.round((completed / program.steps.length) * 100)
            : 0;
          const assignment = program.assignments.at(-1);
          return (
            <Surface
              as="article"
              className="rv2-assigned-program-card"
              key={program.id}
            >
              <div>
                <span className="rv2-builder-kind is-scorm">
                  <ShieldCheck size={20} />
                </span>
                <StatusPill tone={assignment?.required ? "warning" : "info"}>
                  {assignment?.required ? "Zorunlu" : "Atandı"}
                </StatusPill>
              </div>
              <h3>{program.title}</h3>
              <p>{program.description}</p>
              <small>
                {program.steps.length} adım · Son tarih {assignment?.dueDate}
              </small>
              <ProgressBar
                value={value}
                label={`${program.title} ilerlemesi`}
              />
              <Button onClick={() => setActiveId(program.id)}>
                {value ? "Devam et" : "Programa başla"}
                <ArrowRight size={15} />
              </Button>
            </Surface>
          );
        })}
      </div>
    </section>
  );
}
