"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  ClipboardCheck,
  Download,
  FileText,
  Filter,
  Link2,
  Mail,
  MoreHorizontal,
  PlayCircle,
  Plus,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
} from "lucide-react";
import { courses, type Course, type DemoState } from "@/lib/demo";
import {
  academyPrograms,
  academyUsers,
  complianceRows,
  learningResources,
} from "@/lib/lms-data";

export type LmsView =
  | "home"
  | "assigned"
  | "in-progress"
  | "completed"
  | "catalog"
  | "journey"
  | "resources"
  | "saved"
  | "reports"
  | "support"
  | "admin-users"
  | "admin-courses"
  | "admin-programs"
  | "admin-assignments"
  | "admin-compliance"
  | "admin-reports"
  | "admin-settings";

type OpenCourse = (course: Course) => void;

function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-title lms-page-title">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

export function LearnerCollection({
  mode,
  state,
  percent,
  open,
}: {
  mode: "assigned" | "in-progress" | "completed";
  state: DemoState;
  percent: (course: Course) => number;
  open: OpenCourse;
}) {
  const assigned = courses.filter(
    (course) => course.required || course.id === "case-analysis",
  );
  const list = assigned.filter((course) => {
    const value = percent(course);
    if (mode === "completed") return value === 100;
    if (mode === "in-progress") return value > 0 && value < 100;
    return value < 100;
  });
  const copy = {
    assigned: [
      "ATANAN EĞİTİMLER",
      "Sıradaki adımın hazır.",
      "Zorunlu ve yöneticin tarafından atanan eğitimleri son tarihleriyle takip et.",
    ],
    "in-progress": [
      "DEVAM EDENLER",
      "Kaldığın yerden devam et.",
      "Başladığın eğitimler, son tamamladığın bölümle birlikte burada.",
    ],
    completed: [
      "TAMAMLANANLAR",
      "Emeğin görünür.",
      "Tamamladığın eğitimleri, puanlarını ve sertifika durumunu incele.",
    ],
  }[mode];
  return (
    <>
      <PageTitle
        eyebrow={copy[0]}
        title={copy[1]}
        description={copy[2]}
        action={<span className="pill">{list.length} eğitim</span>}
      />
      {list.length ? (
        <div className="learning-list">
          {list.map((course) => {
            const value = percent(course);
            return (
              <article className="learning-row" key={course.id}>
                <div
                  className={`learning-thumb ${course.color}`}
                  aria-hidden="true"
                >
                  <span>OL</span>
                  <b>{String(courses.indexOf(course) + 1).padStart(2, "0")}</b>
                </div>
                <div className="learning-row-copy">
                  <div className="learning-badges">
                    {course.required && (
                      <span className="badge danger">Zorunlu</span>
                    )}
                    <span className="badge">{course.format}</span>
                    <span>{course.category}</span>
                  </div>
                  <h2>{course.title}</h2>
                  <p>
                    {course.duration} dk · {course.lessons.length} bölüm ·{" "}
                    {course.skill}
                  </p>
                  {mode !== "completed" && (
                    <progress
                      max={100}
                      value={value}
                      aria-label={`${course.title} ilerleme`}
                    />
                  )}
                </div>
                <div className="learning-row-side">
                  {course.dueDate && mode !== "completed" && (
                    <span className="due">
                      <CalendarClock size={14} /> Son: {course.dueDate}
                    </span>
                  )}
                  {mode === "completed" ? (
                    <span className="complete-mark">
                      <CheckCircle2 size={18} /> Tamamlandı
                    </span>
                  ) : (
                    <span className="percent">%{value}</span>
                  )}
                  <button className="button" onClick={() => open(course)}>
                    {mode === "completed"
                      ? "Sonucu gör"
                      : value
                        ? "Devam et"
                        : "Başla"}
                    <ArrowRight size={15} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty premium-empty">
          <CheckCircle2 size={38} />
          <h3>
            {mode === "completed"
              ? "İlk tamamlamanı bekliyoruz"
              : "Bu alan şu anda temiz"}
          </h3>
          <p>Bir eğitimde ilerleme kaydettiğinde liste otomatik güncellenir.</p>
        </div>
      )}
    </>
  );
}

export function ResourcesWorkspace() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("Tümü");
  const filtered = learningResources.filter(
    (resource) =>
      (type === "Tümü" || resource.type === type) &&
      resource.title
        .toLocaleLowerCase("tr")
        .includes(query.toLocaleLowerCase("tr")),
  );
  const Icon = ({ name }: { name: string }) =>
    name === "video" ? (
      <Video />
    ) : name === "check" ? (
      <ClipboardCheck />
    ) : name === "link" ? (
      <Link2 />
    ) : (
      <FileText />
    );
  return (
    <>
      <PageTitle
        eyebrow="KAYNAK KÜTÜPHANESİ"
        title="İşin sırasında yanında."
        description="Şablonlar, hızlı rehberler ve kontrol listeleri; ihtiyaç duyduğun anda erişmen için bir arada."
        action={
          <button className="button">
            <Plus size={16} /> Kaynak öner
          </button>
        }
      />
      <div className="resource-toolbar">
        <label className="search">
          <Search size={18} />
          <input
            aria-label="Kaynak ara"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Kaynaklarda ara…"
          />
        </label>
        <div className="filters">
          {["Tümü", "Şablon", "Rehber", "Video", "Kontrol listesi"].map(
            (item) => (
              <button
                key={item}
                onClick={() => setType(item)}
                className={type === item ? "filter active" : "filter"}
              >
                {item}
              </button>
            ),
          )}
        </div>
      </div>
      <div className="resource-grid">
        {filtered.map((resource) => (
          <article className="resource-card" key={resource.id}>
            <span className="resource-icon">
              <Icon name={resource.icon} />
            </span>
            <span className="eyebrow">
              {resource.type} · {resource.topic}
            </span>
            <h2>{resource.title}</h2>
            <div>
              <span>{resource.readTime}</span>
              <button aria-label={`${resource.title} kaynağını aç`}>
                <ArrowUpRight size={18} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function AdminOverview({ navigate }: { navigate: (view: LmsView) => void }) {
  return (
    <>
      <PageTitle
        eyebrow="YÖNETİM MERKEZİ"
        title="Akademinin bugünkü öncelikleri."
        description="Katılım, uyumluluk ve içerik sağlığını tek bakışta izle; gereken adıma doğrudan geç."
        action={
          <button
            className="button primary"
            onClick={() => navigate("admin-assignments")}
          >
            <Plus size={16} /> Eğitim ata
          </button>
        }
      />
      <div className="metric-grid admin-metrics">
        <div className="metric">
          <span>
            <Users size={16} /> Aktif kullanıcı
          </span>
          <strong>42</strong>
          <small className="trend up">+6 bu ay</small>
        </div>
        <div className="metric">
          <span>
            <CircleGauge size={16} /> Genel tamamlama
          </span>
          <strong>%76</strong>
          <small className="trend up">+8 puan</small>
        </div>
        <div className="metric">
          <span>
            <ShieldCheck size={16} /> Uyum oranı
          </span>
          <strong>%84</strong>
          <small className="trend warn">4 kişi riskte</small>
        </div>
        <div className="metric">
          <span>
            <BookOpen size={16} /> Yayındaki eğitim
          </span>
          <strong>18</strong>
          <small className="trend">3 taslak</small>
        </div>
      </div>
      <div className="admin-dashboard-grid">
        <section className="panel wide-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">SON 8 HAFTA</span>
              <h2>Öğrenme etkinliği</h2>
            </div>
            <button className="icon-button" aria-label="Grafik seçenekleri">
              <MoreHorizontal />
            </button>
          </div>
          <div
            className="activity-chart"
            aria-label="Haftalık öğrenme etkinliği grafiği"
          >
            {[34, 48, 41, 62, 58, 78, 70, 86].map((value, index) => (
              <div key={index}>
                <span style={{ height: `${value}%` }} />
                <small>{index + 1}. hf</small>
              </div>
            ))}
          </div>
        </section>
        <section className="panel focus-panel">
          <div className="section-heading">
            <h2>Bugün ilgilen</h2>
            <span className="badge danger">7 işlem</span>
          </div>
          <button
            onClick={() => navigate("admin-compliance")}
            className="focus-row"
          >
            <span className="focus-icon risk">
              <AlertTriangle />
            </span>
            <span>
              <b>4 kullanıcı gecikme riskinde</b>
              <small>Uyum eğitimleri · son 3 gün</small>
            </span>
            <ChevronRight />
          </button>
          <button onClick={() => navigate("admin-users")} className="focus-row">
            <span className="focus-icon">
              <Mail />
            </span>
            <span>
              <b>2 davet yanıt bekliyor</b>
              <small>48 saattir etkinleştirilmedi</small>
            </span>
            <ChevronRight />
          </button>
          <button
            onClick={() => navigate("admin-courses")}
            className="focus-row"
          >
            <span className="focus-icon">
              <FileText />
            </span>
            <span>
              <b>1 içerik güncellenmeli</b>
              <small>Politika sürümü değişti</small>
            </span>
            <ChevronRight />
          </button>
        </section>
      </div>
      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">UYUMLULUK NABZI</span>
            <h2>Zorunlu eğitimler</h2>
          </div>
          <button
            className="text-button"
            onClick={() => navigate("admin-compliance")}
          >
            Tümünü incele <ArrowRight size={15} />
          </button>
        </div>
        <ComplianceTable compact />
      </section>
    </>
  );
}

function UsersWorkspace() {
  const [query, setQuery] = useState("");
  const [invited, setInvited] = useState(false);
  const users = academyUsers.filter((user) =>
    `${user.name} ${user.team}`
      .toLocaleLowerCase("tr")
      .includes(query.toLocaleLowerCase("tr")),
  );
  return (
    <>
      <PageTitle
        eyebrow="KULLANICI YÖNETİMİ"
        title="İnsanlar ve erişimler."
        description="Kullanıcıları, ekipleri, rolleri ve öğrenme durumlarını tek merkezden yönet."
        action={
          <button className="button primary" onClick={() => setInvited(true)}>
            <Plus size={16} /> Kullanıcı davet et
          </button>
        }
      />
      {invited && (
        <div className="success-banner">
          <CheckCircle2 /> Demo daveti oluşturuldu. Gerçek e-posta gönderilmedi.
          <button onClick={() => setInvited(false)}>Kapat</button>
        </div>
      )}
      <div className="table-toolbar">
        <label className="search">
          <Search size={18} />
          <input
            aria-label="Kullanıcı ara"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ad, ekip veya rol ara…"
          />
        </label>
        <button className="button">
          <Filter size={15} /> Filtrele
        </button>
        <button className="button">
          <Download size={15} /> Dışa aktar
        </button>
      </div>
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Kullanıcı</th>
              <th>Rol / ekip</th>
              <th>Durum</th>
              <th>Öğrenme</th>
              <th>Son etkinlik</th>
              <th>
                <span className="sr-only">İşlemler</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="user-cell">
                    <span className="mini-avatar">{user.initials}</span>
                    <b>{user.name}</b>
                  </div>
                </td>
                <td>
                  <b>{user.role}</b>
                  <small>{user.team}</small>
                </td>
                <td>
                  <span
                    className={`status-dot ${user.status === "Aktif" ? "active" : "pending"}`}
                  />
                  {user.status}
                </td>
                <td>
                  <div className="table-progress">
                    <progress max={100} value={user.completion} />
                    <span>%{user.completion}</span>
                  </div>
                </td>
                <td>{user.lastSeen}</td>
                <td>
                  <button
                    className="icon-button"
                    aria-label={`${user.name} işlemleri`}
                  >
                    <MoreHorizontal size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function CoursesWorkspace({ open }: { open: OpenCourse }) {
  return (
    <>
      <PageTitle
        eyebrow="İÇERİK YÖNETİMİ"
        title="Eğitim kütüphanesi."
        description="Eğitimleri üret, sürümle, kalite kontrolünden geçir ve hedef kitlelerle buluştur."
        action={
          <Link className="button primary" href="/lab/authoring">
            <Plus size={16} /> Eğitim oluştur
          </Link>
        }
      />
      <div className="content-health">
        <span>
          <Sparkles /> <b>İçerik sağlığı %92</b> · 1 eğitim için politika
          güncellemesi öneriliyor.
        </span>
        <button>Detayı gör</button>
      </div>
      <div className="admin-course-grid">
        {courses.map((course) => (
          <article key={course.id} className="admin-course-card">
            <div className={`admin-course-art ${course.color}`}>
              <span>{course.format}</span>
              <b>{String(courses.indexOf(course) + 1).padStart(2, "0")}</b>
            </div>
            <div className="admin-course-copy">
              <div>
                <span className="status-dot active" /> Yayında
              </div>
              <h2>{course.title}</h2>
              <p>
                {course.category} · {course.duration} dk ·{" "}
                {course.lessons.length} bölüm
              </p>
              <div className="admin-course-stats">
                <span>
                  <Users size={14} /> {course.required ? 42 : 18} atama
                </span>
                <span>
                  <BarChart3 size={14} /> %{course.required ? 82 : 61}
                </span>
              </div>
              <div className="card-actions">
                <button className="button" onClick={() => open(course)}>
                  Önizle
                </button>
                <button
                  className="icon-button"
                  aria-label={`${course.title} seçenekleri`}
                >
                  <MoreHorizontal />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function ProgramsWorkspace() {
  return (
    <>
      <PageTitle
        eyebrow="PROGRAMLAR VE YOLLAR"
        title="Öğrenmeyi bir yolculuğa dönüştür."
        description="Sıralı, esnek veya koşullu programlarla gelişimi baştan sona tasarla."
        action={
          <button className="button primary">
            <Plus size={16} /> Program oluştur
          </button>
        }
      />
      <div className="program-grid">
        {academyPrograms.map((program, index) => (
          <article className="program-card" key={program.id}>
            <div className="program-top">
              <span className={`program-icon tone-${index}`}>
                <BookOpen />
              </span>
              <span
                className={
                  program.status === "Taslak" ? "badge" : "badge success"
                }
              >
                {program.status}
              </span>
            </div>
            <span className="eyebrow">{program.audience}</span>
            <h2>{program.title}</h2>
            <p>
              {program.courses} eğitim · {program.learners} öğrenen
            </p>
            <div className="program-progress">
              <span>
                <b>%{program.completion}</b> tamamlandı
              </span>
              <progress max={100} value={program.completion} />
            </div>
            <button className="text-button">
              Programı yönet <ArrowRight size={15} />
            </button>
          </article>
        ))}
      </div>
    </>
  );
}

function AssignmentWorkspace() {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState(courses[0].id);
  const [audience, setAudience] = useState("Tüm çalışanlar");
  const [done, setDone] = useState(false);
  const chosen = courses.find((course) => course.id === selected)!;
  if (done)
    return (
      <div className="assignment-success">
        <span>
          <Send size={35} />
        </span>
        <div className="eyebrow">ATAMA HAZIR</div>
        <h1>42 öğrenene atama oluşturuldu.</h1>
        <p>
          Demo akışı tamamlandı. Bildirim ve e-posta yalnızca önizleme olarak
          gösterildi.
        </p>
        <button
          className="button primary"
          onClick={() => {
            setDone(false);
            setStep(1);
          }}
        >
          Yeni atama oluştur
        </button>
      </div>
    );
  return (
    <>
      <PageTitle
        eyebrow="ATAMA MERKEZİ"
        title="Doğru eğitimi, doğru kişiye."
        description="Eğitimi ve hedef kitleyi seç; son tarihi, hatırlatmaları ve zorunluluk kuralını tek akışta belirle."
      />
      <div className="assignment-shell">
        <ol className="stepper">
          {["Eğitim", "Hedef kitle", "Kurallar", "Kontrol"].map(
            (label, index) => (
              <li className={step >= index + 1 ? "active" : ""} key={label}>
                <span>{index + 1}</span>
                <b>{label}</b>
              </li>
            ),
          )}
        </ol>
        <div className="assignment-body">
          <div className="assignment-form">
            {step === 1 && (
              <>
                <span className="eyebrow">1 · EĞİTİMİ SEÇ</span>
                <h2>Hangi eğitimi atamak istiyorsun?</h2>
                <div className="select-cards">
                  {courses.slice(0, 5).map((course) => (
                    <label
                      className={
                        selected === course.id
                          ? "select-card selected"
                          : "select-card"
                      }
                      key={course.id}
                    >
                      <input
                        type="radio"
                        name="course"
                        value={course.id}
                        checked={selected === course.id}
                        onChange={() => setSelected(course.id)}
                      />
                      <span className={`mini-cover ${course.color}`}>
                        <BookOpen />
                      </span>
                      <span>
                        <b>{course.title}</b>
                        <small>
                          {course.format} · {course.duration} dk
                        </small>
                      </span>
                      <CheckCircle2 />
                    </label>
                  ))}
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <span className="eyebrow">2 · HEDEF KİTLE</span>
                <h2>Kimler tamamlamalı?</h2>
                <div className="audience-options">
                  {[
                    ["Tüm çalışanlar", "42 kişi"],
                    ["Yeni başlayanlar", "8 kişi"],
                    ["Uyuşmazlık Çözümü", "14 kişi"],
                    ["Kişi seç", "Özel liste"],
                  ].map(([label, detail]) => (
                    <button
                      className={
                        audience === label
                          ? "audience-card selected"
                          : "audience-card"
                      }
                      key={label}
                      onClick={() => setAudience(label)}
                    >
                      <Users />
                      <span>
                        <b>{label}</b>
                        <small>{detail}</small>
                      </span>
                      <CheckCircle2 />
                    </button>
                  ))}
                </div>
              </>
            )}
            {step === 3 && (
              <>
                <span className="eyebrow">3 · KURALLAR</span>
                <h2>Tamamlama çerçevesini belirle.</h2>
                <div className="rule-grid">
                  <label>
                    Son tarih
                    <input type="date" defaultValue="2026-10-15" />
                  </label>
                  <label>
                    Geçme puanı
                    <select defaultValue="80">
                      <option>70</option>
                      <option>80</option>
                      <option>90</option>
                    </select>
                  </label>
                  <label className="toggle-row">
                    <span>
                      <b>Zorunlu eğitim</b>
                      <small>Tamamlanana kadar hatırlat</small>
                    </span>
                    <input type="checkbox" defaultChecked />
                  </label>
                  <label className="toggle-row">
                    <span>
                      <b>Otomatik hatırlatma</b>
                      <small>7, 3 ve 1 gün kala</small>
                    </span>
                    <input type="checkbox" defaultChecked />
                  </label>
                </div>
              </>
            )}
            {step === 4 && (
              <>
                <span className="eyebrow">4 · KONTROL</span>
                <h2>Atamayı yayınlamaya hazırsın.</h2>
                <div className="review-card">
                  <div>
                    <BookOpen />
                    <span>
                      <small>Eğitim</small>
                      <b>{chosen.title}</b>
                    </span>
                  </div>
                  <div>
                    <Users />
                    <span>
                      <small>Hedef kitle</small>
                      <b>{audience} · 42 kişi</b>
                    </span>
                  </div>
                  <div>
                    <CalendarClock />
                    <span>
                      <small>Son tarih</small>
                      <b>15 Ekim 2026</b>
                    </span>
                  </div>
                  <div>
                    <Mail />
                    <span>
                      <small>Bildirim</small>
                      <b>Uygulama içi + e-posta</b>
                    </span>
                  </div>
                </div>
              </>
            )}
            <div className="wizard-actions">
              <button
                className="button"
                disabled={step === 1}
                onClick={() => setStep((value) => value - 1)}
              >
                Geri
              </button>
              <button
                className="button primary"
                onClick={() =>
                  step < 4 ? setStep((value) => value + 1) : setDone(true)
                }
              >
                {step < 4 ? "Devam et" : "Atamayı yayınla"}
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
          <aside className="assignment-preview">
            <span className="eyebrow">CANLI ÖZET</span>
            <div className={`preview-cover ${chosen.color}`}>
              <ShieldCheck />
              <span>ZORUNLU EĞİTİM</span>
            </div>
            <h3>{chosen.title}</h3>
            <p>
              {audience} · {chosen.duration} dk
            </p>
            <hr />
            <small>Otomatik hatırlatmalar açık</small>
            <b>Son tarih · 15 Ekim 2026</b>
          </aside>
        </div>
      </div>
    </>
  );
}

function ComplianceTable({ compact = false }: { compact?: boolean }) {
  return (
    <div className="compliance-table">
      {complianceRows.map((row) => {
        const rate = Math.round((row.complete / row.assigned) * 100);
        return (
          <article key={row.title}>
            <div>
              <b>{row.title}</b>
              <small>Son tarih · {row.due}</small>
            </div>
            <div className="compliance-progress">
              <progress value={rate} max={100} />
              <span>%{rate}</span>
            </div>
            <span>
              {row.complete}/{row.assigned}
            </span>
            {!compact && (
              <span className={row.overdue ? "overdue" : "on-track"}>
                {row.overdue ? `${row.overdue} geciken` : "Zamanında"}
              </span>
            )}
            <button
              className="icon-button"
              aria-label={`${row.title} ayrıntıları`}
            >
              <ChevronRight />
            </button>
          </article>
        );
      })}
    </div>
  );
}

function ComplianceWorkspace() {
  return (
    <>
      <PageTitle
        eyebrow="UYUMLULUK MERKEZİ"
        title="Risk oluşmadan harekete geç."
        description="Zorunlu eğitimleri, yaklaşan son tarihleri ve kanıt kayıtlarını denetime hazır biçimde izle."
        action={
          <button className="button">
            <Download size={15} /> Uyum raporu
          </button>
        }
      />
      <div className="compliance-hero">
        <div>
          <ShieldCheck />
          <span>
            <small>Genel uyum skoru</small>
            <b>%84</b>
          </span>
        </div>
        <div>
          <small>Zamanında tamamlayan</small>
          <b>34 kişi</b>
        </div>
        <div>
          <small>Son 7 günde bitecek</small>
          <b>3 eğitim</b>
        </div>
        <div>
          <small>Müdahale gereken</small>
          <b className="risk-text">4 kişi</b>
        </div>
      </div>
      <section className="panel">
        <div className="section-heading">
          <h2>Zorunlu eğitim durumu</h2>
          <button className="button">
            <Filter size={15} /> Filtrele
          </button>
        </div>
        <ComplianceTable />
      </section>
    </>
  );
}

function ReportsWorkspace() {
  return (
    <>
      <PageTitle
        eyebrow="RAPORLAMA"
        title="Veriyi karara dönüştür."
        description="Katılım, tamamlama, uyumluluk ve yetkinlik sinyallerini hazır raporlarla izle."
        action={
          <button className="button primary">
            <Plus size={15} /> Özel rapor oluştur
          </button>
        }
      />
      <div className="report-card-grid">
        {[
          [BarChart3, "Öğrenme özeti", "Katılım, süre ve tamamlama eğilimleri"],
          [ShieldCheck, "Uyumluluk", "Zorunlu eğitim ve gecikme kayıtları"],
          [Users, "Ekip performansı", "Ekip ve rol bazında karşılaştırma"],
          [ClipboardCheck, "Sertifika durumu", "Geçerlilik ve yenileme takibi"],
        ].map(([Icon, title, desc]) => {
          const ReportIcon = Icon as typeof BarChart3;
          return (
            <button className="report-card" key={String(title)}>
              <ReportIcon />
              <span>
                <b>{String(title)}</b>
                <small>{String(desc)}</small>
              </span>
              <ArrowUpRight />
            </button>
          );
        })}
      </div>
      <div className="admin-dashboard-grid">
        <section className="panel wide-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">TAMAMLAMA TRENDİ</span>
              <h2>Aylık gelişim</h2>
            </div>
            <span className="pill">Son 6 ay</span>
          </div>
          <div className="line-chart-placeholder">
            <svg
              viewBox="0 0 640 200"
              role="img"
              aria-label="Aylık tamamlama trendi"
            >
              <defs>
                <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#41836c" stopOpacity=".28" />
                  <stop offset="1" stopColor="#41836c" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                className="chart-area"
                d="M0 170 C90 160 95 105 185 120 S305 80 375 92 S500 35 640 42 L640 200 L0 200 Z"
              />
              <path
                className="chart-line"
                d="M0 170 C90 160 95 105 185 120 S305 80 375 92 S500 35 640 42"
              />
            </svg>
            <div>
              {["Nis", "May", "Haz", "Tem", "Ağu", "Eyl"].map((month) => (
                <span key={month}>{month}</span>
              ))}
            </div>
          </div>
        </section>
        <section className="panel">
          <div className="section-heading">
            <h2>Planlı raporlar</h2>
            <Settings2 size={18} />
          </div>
          {[
            "Haftalık yönetici özeti",
            "Aylık uyum raporu",
            "Sertifika yenileme listesi",
          ].map((item, index) => (
            <div className="scheduled-report" key={item}>
              <span>
                <b>{item}</b>
                <small>
                  {index === 0
                    ? "Her pazartesi · 09:00"
                    : "Her ayın 1'i · 08:00"}
                </small>
              </span>
              <span className="badge success">Aktif</span>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}

function SettingsWorkspace() {
  return (
    <>
      <PageTitle
        eyebrow="AKADEMİ AYARLARI"
        title="Portalın kimliği ve kuralları."
        description="Marka, bildirim, kimlik doğrulama ve öğrenme varsayılanlarını yönet."
      />
      <div className="settings-grid">
        {[
          [
            "Marka ve görünüm",
            "Logo, renk paleti, giriş ekranı ve tema",
            "#234f41",
          ],
          [
            "Bildirimler",
            "E-posta, uygulama içi ve push şablonları",
            "12 şablon",
          ],
          [
            "Kimlik ve erişim",
            "SSO, roller, oturum ve güvenlik politikaları",
            "Hazırlanıyor",
          ],
          [
            "Entegrasyonlar",
            "Teams, Zoom, GoTo Training ve webhooks",
            "0 bağlı",
          ],
          [
            "Sertifikalar",
            "Şablon editörü, doğrulama ve geçerlilik",
            "2 şablon",
          ],
          [
            "Öğrenme kuralları",
            "Puan, rozet, geçme ve atama varsayılanları",
            "Yapılandırıldı",
          ],
        ].map(([title, desc, meta]) => (
          <button className="settings-card" key={title}>
            <span className="settings-symbol">
              <Settings2 />
            </span>
            <span>
              <b>{title}</b>
              <small>{desc}</small>
            </span>
            <em>{meta}</em>
            <ChevronRight />
          </button>
        ))}
      </div>
    </>
  );
}

export function AdminWorkspace({
  view,
  navigate,
  open,
}: {
  view: LmsView;
  navigate: (view: LmsView) => void;
  open: OpenCourse;
}) {
  if (view === "home") return <AdminOverview navigate={navigate} />;
  if (view === "admin-users") return <UsersWorkspace />;
  if (view === "admin-courses") return <CoursesWorkspace open={open} />;
  if (view === "admin-programs") return <ProgramsWorkspace />;
  if (view === "admin-assignments") return <AssignmentWorkspace />;
  if (view === "admin-compliance") return <ComplianceWorkspace />;
  if (view === "admin-reports") return <ReportsWorkspace />;
  if (view === "admin-settings") return <SettingsWorkspace />;
  return <AdminOverview navigate={navigate} />;
}
