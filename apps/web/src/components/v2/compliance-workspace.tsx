"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArchiveRestore,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRoundCheck,
  X,
} from "lucide-react";
import { Button, ProgressBar, StatusPill, Surface } from "@respongo/ui-web";

type Program = {
  id: string;
  title: string;
  status: string;
  current_version: number;
  revision: number;
};
type Version = {
  program_id: string;
  version: number;
  state: "draft" | "published" | "archived";
  published_at: string | null;
};
type Assignment = {
  id: string;
  program_id: string;
  title: string;
  audience_type: string;
  required: boolean;
  due_at: string;
  created_at: string;
  status: string;
};
type EnrollmentState =
  | "assigned"
  | "in_progress"
  | "completed"
  | "failed"
  | "waived"
  | "expired";
type Enrollment = {
  id: string;
  assignment_id: string;
  membership_id: string;
  state: EnrollmentState;
  progress: number;
  score: number | null;
  revision: number;
  last_activity_at: string | null;
  waiver_reason: string | null;
  waiver_expires_at: string | null;
};
type Membership = {
  id: string;
  display_name: string | null;
  job_title: string | null;
  professional_level: string | null;
};
type Payload = {
  programs: Program[];
  versions: Version[];
  assignments: Assignment[];
  enrollments: Enrollment[];
  memberships: Membership[];
};

const query = "industry=avukat&tenant=oguzlawacademy";
const empty: Payload = {
  programs: [],
  versions: [],
  assignments: [],
  enrollments: [],
  memberships: [],
};
const stateLabel: Record<EnrollmentState, string> = {
  assigned: "Atandı",
  in_progress: "Devam ediyor",
  completed: "Tamamlandı",
  failed: "Başarısız",
  waived: "Muaf",
  expired: "Süresi geçti",
};
const stateTone: Record<
  EnrollmentState,
  "neutral" | "success" | "warning" | "danger" | "info"
> = {
  assigned: "neutral",
  in_progress: "info",
  completed: "success",
  failed: "danger",
  waived: "warning",
  expired: "danger",
};

async function command(payload: Record<string, unknown>) {
  const response = await fetch("/api/v2/programs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ industry: "avukat", tenant: "oguzlawacademy", ...payload }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.detail || result.error || "İşlem tamamlanamadı.");
  return result.data as Record<string, unknown>;
}

export function ComplianceWorkspace() {
  const [data, setData] = useState<Payload>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<"all" | EnrollmentState>("all");
  const [programFilter, setProgramFilter] = useState("all");
  const [waiverTarget, setWaiverTarget] = useState<Enrollment | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<{ program: Program; version: Version } | null>(null);
  const [reason, setReason] = useState("");
  const [rollbackReason, setRollbackReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/v2/programs?${query}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || payload.error || "Uyum verileri alınamadı.");
      setData({ ...empty, ...payload });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Uyum verileri alınamadı.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const members = useMemo(
    () => new Map(data.memberships.map((item) => [item.id, item])),
    [data.memberships],
  );
  const assignments = useMemo(
    () => new Map(data.assignments.map((item) => [item.id, item])),
    [data.assignments],
  );
  const programs = useMemo(
    () => new Map(data.programs.map((item) => [item.id, item])),
    [data.programs],
  );
  const now = Date.now();
  const rows = useMemo(
    () =>
      data.enrollments
        .map((enrollment) => {
          const assignment = assignments.get(enrollment.assignment_id);
          const program = assignment ? programs.get(assignment.program_id) : undefined;
          const member = members.get(enrollment.membership_id);
          return { enrollment, assignment, program, member };
        })
        .filter(({ enrollment, assignment, program, member }) => {
          const needle = search.trim().toLocaleLowerCase("tr-TR");
          const matchesSearch =
            !needle ||
            [member?.display_name, member?.job_title, program?.title, assignment?.title]
              .filter(Boolean)
              .some((value) => String(value).toLocaleLowerCase("tr-TR").includes(needle));
          return (
            matchesSearch &&
            (stateFilter === "all" || enrollment.state === stateFilter) &&
            (programFilter === "all" || program?.id === programFilter)
          );
        }),
    [assignments, data.enrollments, members, programFilter, programs, search, stateFilter],
  );
  const completed = data.enrollments.filter((item) => item.state === "completed").length;
  const inProgress = data.enrollments.filter((item) => item.state === "in_progress").length;
  const waived = data.enrollments.filter((item) => item.state === "waived").length;
  const overdue = data.enrollments.filter((item) => {
    const assignment = assignments.get(item.assignment_id);
    return Boolean(
      assignment &&
        new Date(assignment.due_at).getTime() < now &&
        !["completed", "waived"].includes(item.state),
    );
  }).length;

  async function applyWaiver() {
    if (!waiverTarget || reason.trim().length < 5) return;
    setBusy(true);
    setError("");
    try {
      await command({
        action: "waiver",
        enrollmentId: waiverTarget.id,
        waive: waiverTarget.state !== "waived",
        expectedRevision: waiverTarget.revision,
        reason: reason.trim(),
        expiresAt: waiverTarget.state !== "waived" && expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : null,
      });
      setNotice(waiverTarget.state === "waived" ? "Muafiyet kaldırıldı." : "Muafiyet kaydedildi ve audit günlüğüne işlendi.");
      setWaiverTarget(null);
      setReason("");
      setExpiresAt("");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Muafiyet işlemi tamamlanamadı.");
    } finally {
      setBusy(false);
    }
  }

  async function rollback() {
    if (!restoreTarget || rollbackReason.trim().length < 5) return;
    setBusy(true);
    setError("");
    try {
      await command({
        action: "rollback",
        programId: restoreTarget.program.id,
        sourceVersion: restoreTarget.version.version,
        expectedRevision: restoreTarget.program.revision,
        reason: rollbackReason.trim(),
      });
      setNotice(`v${restoreTarget.version.version} içeriğinden yeni taslak oluşturuldu. Yayın öncesi Program Stüdyosu'nda inceleyin.`);
      setRestoreTarget(null);
      setRollbackReason("");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sürüm geri alma işlemi tamamlanamadı.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rv2-compliance">
      <header className="rv2-page-header">
        <div>
          <span className="rv2-eyebrow">ATAMA VE UYUM</span>
          <h1>Uyumluluk operasyon merkezi</h1>
          <p>Program atamalarını kullanıcı bazında izleyin, gecikmeleri yönetin ve denetlenebilir muafiyet kararları alın.</p>
        </div>
        <div className="rv2-page-header__actions">
          <Button variant="secondary" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={16} /> Yenile
          </Button>
        </div>
      </header>

      {notice ? <div className="rv2-builder-notice" role="status"><CheckCircle2 size={17} />{notice}</div> : null}
      {error ? <div className="rv2-compliance-alert" role="alert"><CircleAlert size={17} />{error}</div> : null}

      <section className="rv2-metrics rv2-metrics--compact" aria-label="Uyum özeti">
        <Surface className="rv2-mini-metric"><span>Toplam atama</span><strong>{data.enrollments.length}</strong><small>{data.assignments.length} aktif atama akışı</small></Surface>
        <Surface className="rv2-mini-metric"><span>Tamamlanan</span><strong>{completed}</strong><small>%{data.enrollments.length ? Math.round((completed / data.enrollments.length) * 100) : 0} uyum oranı</small></Surface>
        <Surface className="rv2-mini-metric"><span>Devam eden</span><strong>{inProgress}</strong><small>Aktif öğrenme kaydı</small></Surface>
        <Surface className={`rv2-mini-metric ${overdue ? "is-risk" : ""}`}><span>Geciken / muaf</span><strong>{overdue} / {waived}</strong><small>Müdahale ve istisna kuyruğu</small></Surface>
      </section>

      <Surface className="rv2-panel rv2-table-panel rv2-compliance-table">
        <div className="rv2-panel__head">
          <div><span className="rv2-eyebrow">CANLI UYUM LİSTESİ</span><h2>Kullanıcı ilerleme kayıtları</h2></div>
          <StatusPill tone={overdue ? "warning" : "success"}>{overdue ? `${overdue} gecikme` : "Risk yok"}</StatusPill>
        </div>
        <div className="rv2-compliance-tools">
          <label><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Kullanıcı, unvan veya program ara" /></label>
          <label><Filter size={15} /><span className="sr-only">Program filtresi</span><select value={programFilter} onChange={(event) => setProgramFilter(event.target.value)}><option value="all">Tüm programlar</option>{data.programs.map((program) => <option key={program.id} value={program.id}>{program.title}</option>)}</select></label>
          <label><ShieldCheck size={15} /><span className="sr-only">Durum filtresi</span><select value={stateFilter} onChange={(event) => setStateFilter(event.target.value as typeof stateFilter)}><option value="all">Tüm durumlar</option>{Object.entries(stateLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        </div>
        <div className="rv2-table-scroll rv2-data-table">
          <table>
            <thead><tr><th>Kullanıcı</th><th>Program</th><th>Son tarih</th><th>İlerleme</th><th>Durum</th><th>İşlem</th></tr></thead>
            <tbody>
              {rows.map(({ enrollment, assignment, program, member }) => (
                <tr key={enrollment.id}>
                  <td><span className="rv2-person-cell"><i>{(member?.display_name || "K").slice(0, 2).toLocaleUpperCase("tr-TR")}</i><span><strong>{member?.display_name || "Kullanıcı"}</strong><small>{member?.job_title || member?.professional_level || "Rol bilgisi yok"}</small></span></span></td>
                  <td><strong className="rv2-cell-title">{program?.title || assignment?.title || "Program"}</strong><small>{assignment?.required ? "Zorunlu" : "İsteğe bağlı"}</small></td>
                  <td>{assignment?.due_at ? new Date(assignment.due_at).toLocaleDateString("tr-TR") : "—"}</td>
                  <td><ProgressBar value={Number(enrollment.progress)} label={`${member?.display_name || "Kullanıcı"} ilerlemesi`} /></td>
                  <td><StatusPill tone={stateTone[enrollment.state]}>{stateLabel[enrollment.state]}</StatusPill>{enrollment.waiver_reason ? <small className="rv2-waiver-note">{enrollment.waiver_reason}</small> : null}</td>
                  <td>{enrollment.state === "completed" ? <span className="rv2-compliance-complete"><UserRoundCheck size={16} /> Kapandı</span> : <Button size="sm" variant="secondary" onClick={() => { setWaiverTarget(enrollment); setReason(""); setExpiresAt(""); }}>{enrollment.state === "waived" ? "Muafiyeti kaldır" : "Muafiyet"}</Button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !rows.length ? <div className="rv2-program-empty"><ShieldCheck size={28} /><h2>Kayıt bulunamadı</h2><p>Filtreleri temizleyin veya önce bir program ataması oluşturun.</p></div> : null}
          {loading ? <div className="rv2-compliance-loading"><RefreshCw size={20} /> Uyum verileri yükleniyor…</div> : null}
        </div>
        <footer className="rv2-table-footer"><span>{rows.length} kayıt gösteriliyor</span><span>Veri kaynağı: canlı Supabase</span></footer>
      </Surface>

      <Surface className="rv2-panel rv2-version-panel">
        <div className="rv2-panel__head"><div><span className="rv2-eyebrow">SÜRÜM GÜVENLİĞİ</span><h2>Program yayın geçmişi</h2><p>Eski bir yayından yeni taslak üretin; yayın geçmişi değişmeden korunur.</p></div><ArchiveRestore size={20} /></div>
        <div className="rv2-version-list">
          {data.programs.map((program) => {
            const history = data.versions.filter((version) => version.program_id === program.id);
            return <article key={program.id}><div><strong>{program.title}</strong><small>Güncel çalışma sürümü v{program.current_version}</small></div><div>{history.map((version) => <span key={version.version}><StatusPill tone={version.state === "published" ? "success" : version.state === "draft" ? "info" : "neutral"}>v{version.version} · {version.state === "published" ? "Yayında" : version.state === "draft" ? "Taslak" : "Arşiv"}</StatusPill>{version.state !== "draft" && version.version !== program.current_version ? <Button size="sm" variant="ghost" disabled={busy} onClick={() => { setRestoreTarget({ program, version }); setRollbackReason("Onaylı sürüme kontrollü geri dönüş"); }}><ArchiveRestore size={14} /> Taslak oluştur</Button> : null}</span>)}</div></article>;
          })}
        </div>
      </Surface>

      {waiverTarget ? (
        <div className="rv2-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setWaiverTarget(null); }}>
          <section className="rv2-waiver-dialog" role="dialog" aria-modal="true" aria-labelledby="waiver-title">
            <button className="rv2-dialog-close" onClick={() => setWaiverTarget(null)} aria-label="Pencereyi kapat"><X size={18} /></button>
            <span className="rv2-dialog-icon"><ShieldCheck size={22} /></span>
            <h2 id="waiver-title">{waiverTarget.state === "waived" ? "Muafiyeti kaldır" : "Uyum muafiyeti tanımla"}</h2>
            <p>Karar audit günlüğüne kullanıcı, zaman ve gerekçe ile kaydedilir.</p>
            <label><span>Gerekçe</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} placeholder="En az 5 karakterlik karar gerekçesi" /></label>
            {waiverTarget.state !== "waived" ? <label><span>Muafiyet bitiş tarihi <small>(isteğe bağlı)</small></span><input type="date" value={expiresAt} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setExpiresAt(event.target.value)} /></label> : null}
            <div><Button variant="secondary" onClick={() => setWaiverTarget(null)}>Vazgeç</Button><Button variant={waiverTarget.state === "waived" ? "danger" : "primary"} disabled={busy || reason.trim().length < 5} onClick={() => void applyWaiver()}>{busy ? "Kaydediliyor…" : waiverTarget.state === "waived" ? "Muafiyeti kaldır" : "Muafiyeti kaydet"}</Button></div>
          </section>
        </div>
      ) : null}
      {restoreTarget ? (
        <div className="rv2-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setRestoreTarget(null); }}>
          <section className="rv2-waiver-dialog" role="dialog" aria-modal="true" aria-labelledby="rollback-title">
            <button className="rv2-dialog-close" onClick={() => setRestoreTarget(null)} aria-label="Pencereyi kapat"><X size={18} /></button>
            <span className="rv2-dialog-icon"><ArchiveRestore size={22} /></span>
            <h2 id="rollback-title">v{restoreTarget.version.version} sürümünden taslak oluştur</h2>
            <p><strong>{restoreTarget.program.title}</strong> için yeni ve düzenlenebilir bir sürüm açılır. Mevcut yayın ve geçmiş kayıtları değişmez.</p>
            <label><span>Geri alma gerekçesi</span><textarea value={rollbackReason} onChange={(event) => setRollbackReason(event.target.value)} rows={4} placeholder="En az 5 karakterlik değişiklik gerekçesi" /></label>
            <div><Button variant="secondary" onClick={() => setRestoreTarget(null)}>Vazgeç</Button><Button disabled={busy || rollbackReason.trim().length < 5} onClick={() => void rollback()}>{busy ? "Taslak oluşturuluyor…" : "Yeni taslağı oluştur"}</Button></div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
