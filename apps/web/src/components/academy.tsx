"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronRight,
  Compass,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  Moon,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Trophy,
  X,
  Layers,
  Clock3,
  BarChart3,
  BookCopy,
  ClipboardList,
  Library,
  Settings,
  UsersRound,
} from "lucide-react";
import {
  courses,
  initialState,
  lessonText,
  parseDemo,
  roles,
  type Course,
  type DemoState,
  type Role,
} from "@/lib/demo";
import {
  AdminWorkspace,
  LearnerCollection,
  ResourcesWorkspace,
  type LmsView as View,
} from "@/components/lms-workspaces";
const key = "respongo:oguzlawacademy:demo:v1";
export function Academy({ initialRole = "learner", preview = true, accountLabel = "Demo profil" }: { initialRole?: Role; preview?: boolean; accountLabel?: string }) {
  const [role, setRole] = useState<Role>(initialRole),
    [view, setView] = useState<View>("home"),
    [state, setState] = useState<DemoState>(initialState),
    [loaded, setLoaded] = useState(false),
    [theme, setTheme] = useState("light"),
    [menu, setMenu] = useState(false),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("Tümü"),
    [active, setActive] = useState<Course | null>(null),
    [answer, setAnswer] = useState<number | null>(null),
    [feedback, setFeedback] = useState(""),
    [notice, setNotice] = useState(""),
    [subject, setSubject] = useState(""),
    [message, setMessage] = useState("");
  useEffect(() => {
    try {
      setState(parseDemo(localStorage.getItem(key)));
      setTheme(localStorage.getItem(key + ":theme") || "light");
    } catch {
      setNotice(
        "Tarayıcı depolaması kapalı. İlerlemeniz bu oturumda tutulacak.",
      );
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded)
      try {
        localStorage.setItem(key, JSON.stringify(state));
        localStorage.setItem(key + ":theme", theme);
      } catch {
        /* In-memory demo remains usable. */
      }
  }, [state, loaded, theme]);
  const completed = courses.filter(
    (c) => state.progress[c.id]?.completed,
  ).length;
  const go = (v: View) => {
    setFilter("Tümü");
    setView(v);
    setActive(null);
    setMenu(false);
    setQuery("");
    setFeedback("");
  };
  const open = (c: Course) => {
    setActive(c);
    setAnswer(null);
    setFeedback("");
    setMenu(false);
  };
  const save = (id: string) =>
    setState((s) => ({
      ...s,
      saved: s.saved.includes(id)
        ? s.saved.filter((x) => x !== id)
        : [...s.saved, id],
    }));
  const percent = (c: Course) =>
    state.progress[c.id]?.completed
      ? 100
      : Math.round(
          ((state.progress[c.id]?.lesson || 0) / (c.lessons.length + 1)) * 100,
        );
  const start =
    courses.find((c) => !state.progress[c.id]?.completed) || courses[0];
  const learner = role === "learner";
  const learnerNav: [View, string, typeof Compass][] = [
    ["home", "Senin için", LayoutDashboard],
    ["assigned", "Atanan eğitimler", ClipboardList],
    ["in-progress", "Devam edenler", Play],
    ["completed", "Tamamlananlar", CheckCircle2],
    ["catalog", "Eğitimleri keşfet", Compass],
    ["journey", "Öğrenme yolculuğu", Layers],
    ["resources", "Kaynaklar", Library],
    ["saved", "Listem", Bookmark],
    ["reports", "Başarılarım", Trophy],
    ["support", "Destek merkezi", LifeBuoy],
  ];
  const adminNav: [View, string, typeof Compass][] = [
    ["home", "Genel bakış", LayoutDashboard],
    ["admin-users", "Kullanıcılar", UsersRound],
    ["admin-courses", "Eğitimler", BookCopy],
    ["admin-programs", "Programlar ve yollar", Layers],
    ["admin-assignments", "Atamalar", ClipboardList],
    ["admin-compliance", "Uyumluluk", ShieldCheck],
    ["admin-reports", "Raporlar", BarChart3],
    ["resources", "Kaynaklar", Library],
    ["support", "Destek merkezi", LifeBuoy],
    ["admin-settings", "Akademi ayarları", Settings],
  ];
  const instructorNav: [View, string, typeof Compass][] = [
    ["home", "Eğitmen özeti", LayoutDashboard],
    ["admin-courses", "Eğitimlerim", BookCopy],
    ["admin-programs", "Programlar", Layers],
    ["admin-users", "Öğrenenler", UsersRound],
    ["resources", "Kaynaklar", Library],
    ["reports", "Sonuçlar", BarChart3],
    ["support", "Destek merkezi", LifeBuoy],
  ];
  const managerNav: [View, string, typeof Compass][] = [
    ["home", "Ekip özeti", LayoutDashboard],
    ["admin-users", "Ekibim", UsersRound],
    ["admin-assignments", "Eğitim ata", ClipboardList],
    ["admin-compliance", "Uyumluluk", ShieldCheck],
    ["reports", "Ekip raporları", BarChart3],
    ["support", "Destek merkezi", LifeBuoy],
  ];
  const platformNav: [View, string, typeof Compass][] = [
    ["home", "Platform özeti", LayoutDashboard],
    ["admin-users", "Portallar", BookCopy],
    ["admin-settings", "Sistem ayarları", Settings],
    ["admin-reports", "Platform raporları", BarChart3],
    ["support", "Destek operasyonu", LifeBuoy],
  ];
  const nav =
    role === "learner"
      ? learnerNav
      : role === "admin"
        ? adminNav
        : role === "instructor"
          ? instructorNav
          : role === "manager"
            ? managerNav
            : platformNav;
  const headings: Record<Role, [string, string]> = {
    learner: [
      "Gelişimin için güzel bir gün.",
      "Bir sonraki adımın, daha güçlü bir hukuk pratiği.",
    ],
    admin: [
      "Akademinin bugünkü öncelikleri.",
      "İçerikten öğrenme deneyimine, her adım bir arada.",
    ],
    instructor: [
      "Bilgini öğrenme deneyimine dönüştür.",
      "İçeriklerini incele, örnek öğrenen yolculuğunu dene.",
    ],
    manager: [
      "Birlikte gelişen bir ekip.",
      "Öğrenme hedeflerini görünür, sonraki adımı kolay kıl.",
    ],
    platform: [
      "Her akademi, güçlü bir başlangıç.",
      "Portal kapsamı, kurulum hazırlığı ve destek tek yerde.",
    ],
  };
  function exportProgress() {
    const rows = [
      "Eğitim,Tamamlanma,Durum",
      ...courses.map(
        (c) =>
          `"${c.title}",${percent(c)},${state.progress[c.id]?.completed ? "Tamamlandı" : "Devam ediyor"}`,
      ),
    ];
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + rows.join("\r\n")], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "oguzlaw-demo-ilerleme.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  const cards = (list: Course[]) =>
    list.length ? (
      <div className="course-grid">
        {list.map((c) => (
          <article className="course-card" key={c.id}>
            <div className={"course-art " + c.color}>
              <span className="art-label">
                OGUZ LAW
                <br />
                ACADEMY
              </span>
              <div className="art-lines" aria-hidden="true" />
              <span className="art-number">0{courses.indexOf(c) + 1}</span>
              <button
                aria-label={
                  state.saved.includes(c.id)
                    ? `${c.title}: listemden çıkar`
                    : `${c.title}: listeme ekle`
                }
                aria-pressed={state.saved.includes(c.id)}
                className="save-button"
                onClick={() => save(c.id)}
              >
                <Bookmark
                  size={17}
                  fill={state.saved.includes(c.id) ? "currentColor" : "none"}
                />
              </button>
              <span className="art-tag">{c.category}</span>
            </div>
            <div className="course-info">
              <div className="eyebrow">
                {c.required
                  ? "ÖNERİLEN DEMO GÖREVİ"
                  : c.level.toLocaleUpperCase("tr")}
              </div>
              <button className="course-title" onClick={() => open(c)}>
                {c.title}
              </button>
              <div className="course-meta">
                <span>
                  <Clock3 size={13} />
                  {c.duration} dk
                </span>
                <span>{c.lessons.length} bölüm</span>
              </div>
              {percent(c) > 0 ? (
                <>
                  <progress
                    max={100}
                    value={percent(c)}
                    aria-label={`${c.title} ilerleme`}
                  />
                  <span className="progress-label">
                    %{percent(c)} tamamlandı
                  </span>
                </>
              ) : (
                <button className="text-button" onClick={() => open(c)}>
                  Eğitime göz at <ArrowUpRight size={15} />
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    ) : (
      <div className="empty">
        <Search />
        <h3>Burada henüz bir eğitim yok</h3>
        <p>
          Aramayı değiştirin veya keşfet sayfasından listenize eğitim ekleyin.
        </p>
        <button className="button" onClick={() => go("catalog")}>
          Eğitimleri keşfet
        </button>
      </div>
    );
  return (
    <div className="academy" data-theme={theme}>
      <a className="skip" href="#main">
        İçeriğe geç
      </a>
      <aside className={"sidebar " + (menu ? "is-open" : "")}>
        <a className="brand" href="/avukat/oguzlawacademy">
          <span className="brand-mark">
            O<span>•</span>
          </span>
          <span>
            OGUZ LAW<small>ACADEMY</small>
          </span>
        </a>
        <button
          className="mobile-close icon-button"
          aria-label="Menüyü kapat"
          onClick={() => setMenu(false)}
        >
          <X />
        </button>
        <div className="workspace-label">ÖĞRENME ALANIN</div>
        <nav aria-label="Ana menü">
          {nav.map(([id, label, Icon]) => (
            <button
              key={id}
              className={
                view === id && !active ? "nav-item selected" : "nav-item"
              }
              onClick={() => go(id)}
              aria-current={view === id && !active ? "page" : undefined}
            >
              <Icon size={19} />
              {label}
              {id === "saved" && state.saved.length > 0 && (
                <span className="nav-count">{state.saved.length}</span>
              )}
              {id === "assigned" && <span className="nav-count">4</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="growth-note">
            <Sparkles size={22} />
            <h3>
              Küçük adımlar.
              <br />
              Kalıcı gelişim.
            </h3>
            <p>Bugün kendine öğrenmek için biraz zaman ayır.</p>
            <button onClick={() => go("journey")}>
              Yolculuğuna bak <ArrowRight size={15} />
            </button>
          </div>
          <span className="powered">
            powered by{" "}
            <b>
              respongo<span>•</span>
            </b>
          </span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            aria-label="Menüyü aç"
            onClick={() => setMenu(true)}
          >
            <Menu />
          </button>
          <div className="breadcrumb">
            Akademim <ChevronRight size={13} />
            <span>
              {active ? "Öğrenme alanı" : nav.find((n) => n[0] === view)?.[1]}
            </span>
          </div>
          <div className="top-actions">
            <span className="demo-label">{preview ? "DEMO" : "CANLI"}</span>
            <button
              className="icon-button"
              aria-label={
                theme === "light" ? "Koyu temaya geç" : "Açık temaya geç"
              }
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
            </button>
            <div className="avatar" aria-label={accountLabel}>
              {accountLabel.slice(0, 2).toLocaleUpperCase("tr")}
            </div>
            {!preview && <form action="/auth/signout" method="post"><button className="text-button" type="submit">Çıkış</button></form>}
          </div>
        </header>
        <main id="main">
          <div className="demo-bar">
            <span>
              <ShieldCheck size={15} />
              {preview ? "Sentetik demo · Değişiklikler yalnızca bu tarayıcıda saklanır." : "Güvenli kurum oturumu · Yetkiler üyeliğinizden alınır."}
            </span>
            {preview && <label>
              Rol önizlemesi{" "}
              <select
                aria-label="Rol önizlemesi"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value as Role);
                  go("home");
                }}
              >
                {Object.entries(roles).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>}
          </div>
          <div
            role="status"
            aria-live="polite"
            className={notice ? "notice" : ""}
          >
            {notice}
            {notice && (
              <button
                aria-label="Bildirimi kapat"
                onClick={() => setNotice("")}
              >
                <X size={15} />
              </button>
            )}
          </div>
          {(role === "admin" || role === "instructor") && (
            <div className="studio-entry">
              <Link href="/lab/authoring">GoAuthoring · Eğitim oluştur</Link>
              <Link href="/lab/scorm">Örnek eğitim paketini dene</Link>
            </div>
          )}
          {active ? (
            <section className="player">
              <button className="text-button" onClick={() => setActive(null)}>
                ← Akademiye dön
              </button>
              <div className="page-title">
                <div>
                  <div className="eyebrow">ÖRNEK ÖĞRENME DENEYİMİ</div>
                  <h1>{active.title}</h1>
                  <p>{active.description}</p>
                </div>
              </div>
              <div className="player-layout">
                <aside className="lesson-list">
                  <h3>Eğitim içeriği</h3>
                  {active.lessons.map((l, i) => (
                    <div
                      key={l}
                      className={
                        (state.progress[active.id]?.lesson || 0) === i
                          ? "lesson active"
                          : "lesson"
                      }
                    >
                      {(state.progress[active.id]?.lesson || 0) > i ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <span className="lesson-number">{i + 1}</span>
                      )}
                      {l}
                    </div>
                  ))}
                  <div className="lesson">
                    <Target size={18} />
                    Kısa değerlendirme
                  </div>
                  <progress
                    max={100}
                    value={percent(active)}
                    aria-label="Eğitim ilerlemesi"
                  />
                </aside>
                <article className="lesson-body">
                  {state.progress[active.id]?.completed ? (
                    <div className="completion">
                      <div className="completion-icon">
                        <Trophy size={40} />
                      </div>
                      <div className="eyebrow">BİR ADIM DAHA İLERİ</div>
                      <h2>Harika, tamamladın!</h2>
                      <p>
                        Örnek eğitimi tamamladın ve 100 demo puanı kazandın.
                      </p>
                      <p className="muted">
                        Bu demo sonucu gerçek bir sertifika veya mesleki
                        yeterlilik değildir.
                      </p>
                      <button
                        className="button primary"
                        onClick={() => {
                          setActive(null);
                          setView("reports");
                        }}
                      >
                        Başarılarımı gör <ArrowRight size={16} />
                      </button>
                    </div>
                  ) : (state.progress[active.id]?.lesson || 0) <
                    active.lessons.length ? (
                    <>
                      <div className="eyebrow">
                        BÖLÜM {(state.progress[active.id]?.lesson || 0) + 1} /{" "}
                        {active.lessons.length}
                      </div>
                      <h2>
                        {active.lessons[state.progress[active.id]?.lesson || 0]}
                      </h2>
                      <p>
                        {lessonText[state.progress[active.id]?.lesson || 0]}
                      </p>
                      <div className="reflection">
                        <Sparkles size={20} />
                        <div>
                          <b>Düşünmek için bir dakika</b>
                          <p>
                            Bu yaklaşımı yarın yapacağın bir işe nasıl
                            uyarlayabilirsin?
                          </p>
                        </div>
                      </div>
                      <button
                        className="button primary"
                        onClick={() =>
                          setState((s) => ({
                            ...s,
                            progress: {
                              ...s.progress,
                              [active.id]: {
                                lesson:
                                  (s.progress[active.id]?.lesson || 0) + 1,
                                completed: false,
                              },
                            },
                          }))
                        }
                      >
                        Bölümü tamamla <ArrowRight size={17} />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="eyebrow">BİLGİNİ KONTROL ET</div>
                      <h2>{active.question}</h2>
                      <fieldset>
                        <legend className="sr-only">Yanıtınızı seçin</legend>
                        {active.choices.map((c, i) => (
                          <label
                            className={
                              "choice " + (answer === i ? "checked" : "")
                            }
                            key={c}
                          >
                            <input
                              type="radio"
                              name="answer"
                              checked={answer === i}
                              onChange={() => {
                                setAnswer(i);
                                setFeedback("");
                              }}
                            />
                            {c}
                          </label>
                        ))}
                      </fieldset>
                      <div role="status" className="feedback">
                        {feedback}
                      </div>
                      <button
                        className="button primary"
                        disabled={answer === null}
                        onClick={() => {
                          if (answer !== active.answer) {
                            setFeedback(
                              "Bu yanıtı tekrar düşün. Bölümlerdeki yaklaşımı hatırla.",
                            );
                            return;
                          }
                          setState((s) => ({
                            ...s,
                            progress: {
                              ...s.progress,
                              [active.id]: {
                                lesson: active.lessons.length,
                                completed: true,
                              },
                            },
                          }));
                          setFeedback("");
                        }}
                      >
                        Yanıtı kontrol et <Check size={17} />
                      </button>
                    </>
                  )}
                </article>
              </div>
            </section>
          ) : (role === "admin" &&
              view !== "resources" &&
              view !== "support") ||
            (role !== "learner" && view.startsWith("admin-")) ? (
            <AdminWorkspace view={view} navigate={go} open={open} />
          ) : (
            <>
              {view === "home" && (
                <>
                  <div className="page-title">
                    <div>
                      <div className="eyebrow">OGUZ LAW ACADEMY</div>
                      <h1>{headings[role][0]}</h1>
                      <p>{headings[role][1]}</p>
                    </div>
                    <span className="date-chip">
                      <span className="live-dot" />
                      Gelişim alanın
                    </span>
                  </div>
                  {learner ? (
                    <>
                      <div className="hero-grid">
                        <section className="hero">
                          <div className="hero-copy">
                            <span className="hero-kicker">
                              <span />
                              SENİN ÖĞRENME YOLCULUĞUN
                            </span>
                            <h2>
                              Bilgiyi pratiğe.
                              <br />
                              Potansiyeli <em>başarıya.</em>
                            </h2>
                            <p>
                              Hukuk dünyasında bir adım önde olmak için
                              <br className="desktop" /> kendi öğrenme yolunu
                              oluştur.
                            </p>
                            <button
                              className="button light"
                              onClick={() => open(start)}
                            >
                              <Play size={15} fill="currentColor" />
                              {Object.keys(state.progress).length
                                ? "Öğrenmeye devam et"
                                : "Yolculuğa başla"}
                              <ArrowRight size={17} />
                            </button>
                            <span className="hero-foot">
                              3 bölüm · Kendi hızında öğren
                            </span>
                          </div>
                          <div className="hero-architecture" aria-hidden="true">
                            <div className="arch arch-one" />
                            <div className="arch arch-two" />
                            <div className="arch arch-three" />
                            <div className="orb" />
                            <div className="arch-caption">
                              THE ART OF
                              <br />
                              <b>LEARNING.</b>
                            </div>
                          </div>
                        </section>
                        <section className="weekly">
                          <div className="section-kicker">
                            <Target size={19} />
                            ÖĞRENME HEDEFİN
                          </div>
                          <div
                            className="goal-ring"
                            style={
                              {
                                "--progress": `${Math.min(100, (completed / state.goal) * 100)}%`,
                              } as React.CSSProperties
                            }
                          >
                            <div>
                              <strong>
                                {completed}
                                <small> / {state.goal}</small>
                              </strong>
                              <span>eğitim</span>
                            </div>
                          </div>
                          <h3>
                            {completed >= state.goal
                              ? "Hedefine ulaştın!"
                              : "Ritmini yakala."}
                          </h3>
                          <p>
                            {completed >= state.goal
                              ? "Öğrenmeye devam ederek yeni hedefler belirle."
                              : "Her eğitim, geleceğine bir yatırım."}
                          </p>
                          <label className="goal-select">
                            Hedef{" "}
                            <select
                              aria-label="Eğitim hedefi"
                              value={state.goal}
                              onChange={(e) =>
                                setState((s) => ({
                                  ...s,
                                  goal: Number(e.target.value),
                                }))
                              }
                            >
                              <option value={1}>1 eğitim</option>
                              <option value={3}>3 eğitim</option>
                              <option value={5}>5 eğitim</option>
                            </select>
                          </label>
                        </section>
                      </div>
                      <div className="stats-strip">
                        <div>
                          <BookOpen size={21} />
                          <span>
                            <b>{courses.length - completed}</b> keşfedilecek
                            eğitim
                          </span>
                        </div>
                        <div>
                          <CheckCircle2 size={21} />
                          <span>
                            <b>{completed}</b> tamamlanan eğitim
                          </span>
                        </div>
                        <div>
                          <Trophy size={21} />
                          <span>
                            <b>{completed * 100}</b> demo puanı
                          </span>
                        </div>
                        <button onClick={() => go("reports")}>
                          Gelişimini gör <ArrowUpRight size={17} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="metric-grid">
                        {(role === "platform"
                          ? [
                              ["1", "Demo portal"],
                              ["1", "Hazır sektör taslağı"],
                              ["0", "Bağlı sağlayıcı"],
                              [
                                String(
                                  state.tickets.filter(
                                    (t) => t.status === "Üst desteğe aktarıldı",
                                  ).length,
                                ),
                                "Aktarılan demo talebi",
                              ],
                            ]
                          : [
                              [String(courses.length), "Örnek eğitim"],
                              [
                                `${Math.round((completed / courses.length) * 100)}%`,
                                "Demo ilerlemesi",
                              ],
                              [
                                String(
                                  state.tickets.filter(
                                    (t) => t.status !== "Çözüldü",
                                  ).length,
                                ),
                                "Açık demo talebi",
                              ],
                              ["0", "Gerçek kullanıcı"],
                            ]
                        ).map(([v, l]) => (
                          <div className="metric" key={l}>
                            <span>{l}</span>
                            <strong>{v}</strong>
                          </div>
                        ))}
                      </div>
                      <div className="operations-grid">
                        <section className="panel">
                          <div className="section-heading">
                            <h2>
                              {role === "platform"
                                ? "Portal çalışma alanı"
                                : "Bugün odaklan"}
                            </h2>
                            <span className="pill">Demo</span>
                          </div>
                          {(role === "platform"
                            ? [
                                [
                                  "Oguz Law Academy",
                                  "Hukuk · avukat/oguzlawacademy",
                                  "catalog",
                                ],
                                [
                                  "Destek merkezi",
                                  "Üst desteğe aktarılan örnek talepler",
                                  "support",
                                ],
                                [
                                  "Kurulum hazırlığı",
                                  "Supabase, domain ve kimlik bağlantıları bekliyor",
                                  "reports",
                                ],
                              ]
                            : role === "instructor"
                              ? [
                                  [
                                    "İçeriklerini gözden geçir",
                                    "4 örnek eğitimin öğrenen görünümünü incele",
                                    "catalog",
                                  ],
                                  [
                                    "Öğrenme sonuçlarını incele",
                                    "Demo ilerlemesini raporla",
                                    "reports",
                                  ],
                                  [
                                    "Öğrenen taleplerine bak",
                                    "Destek akışını dene",
                                    "support",
                                  ],
                                ]
                              : [
                                  [
                                    "Öğrenme yolunu incele",
                                    "Örnek programın adımlarını kontrol et",
                                    "journey",
                                  ],
                                  [
                                    "İlerlemeyi değerlendir",
                                    "Tarayıcıdaki demo sonuçlarını dışa aktar",
                                    "reports",
                                  ],
                                  [
                                    "Destek taleplerini yanıtla",
                                    "Talepleri çöz veya üst desteğe aktar",
                                    "support",
                                  ],
                                ]
                          ).map(([title, desc, v]) => (
                            <button
                              className="action-row"
                              key={title}
                              onClick={() => go(v as View)}
                            >
                              <span className="action-icon">
                                <Layers size={18} />
                              </span>
                              <span>
                                <b>{title}</b>
                                <small>{desc}</small>
                              </span>
                              <ArrowUpRight size={18} />
                            </button>
                          ))}
                        </section>
                        <section className="panel ink-panel">
                          <ShieldCheck size={28} />
                          <h2>
                            Sağlam bir temel,
                            <br />
                            güvenli bir akademi.
                          </h2>
                          <p>
                            Bu ekran rol deneyimini gösterir. Gerçek kullanıcı,
                            yetki yönetimi ve sağlayıcı bağlantıları henüz etkin
                            değildir.
                          </p>
                          <span className="pill">EP01 · Geliştirme sürümü</span>
                        </section>
                      </div>
                    </>
                  )}
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">ÖĞRENMEYE YER AÇ</span>
                      <h2>
                        {learner
                          ? "Senin için seçtiklerimiz"
                          : "Eğitim kataloğu önizlemesi"}
                      </h2>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => go("catalog")}
                    >
                      Tüm eğitimler <ArrowRight size={16} />
                    </button>
                  </div>
                  {cards(courses.slice(0, 3))}
                  <section className="journey-banner">
                    <span className="banner-icon">
                      <GraduationCap size={30} />
                    </span>
                    <div>
                      <span className="eyebrow">
                        BÜYÜK HEDEFLER, KÜÇÜK ADIMLAR
                      </span>
                      <h2>Hukuk profesyoneli öğrenme yolu</h2>
                      <p>
                        Başlangıçtan uygulamaya, birbiriyle bağlantılı dört
                        eğitim.
                      </p>
                    </div>
                    <button className="button" onClick={() => go("journey")}>
                      Yolculuğu incele <ArrowRight size={16} />
                    </button>
                  </section>
                </>
              )}
              {(view === "catalog" || view === "saved") && (
                <>
                  <div className="page-title">
                    <div>
                      <div className="eyebrow">
                        KENDİ HIZINDA, KENDİ YOLUNDA
                      </div>
                      <h1>
                        {view === "saved"
                          ? "Öğrenme listen."
                          : "Merakını takip et."}
                      </h1>
                      <p>
                        {view === "saved"
                          ? "Daha sonra dönmek istediğin eğitimler bir arada."
                          : "Hukuk pratiğini ve kişisel yetkinliklerini geliştirecek örnek içerikler."}
                      </p>
                    </div>
                  </div>
                  <div className="catalog-tools">
                    <label className="search">
                      <Search size={19} />
                      <input
                        aria-label="Eğitim ara"
                        placeholder="Bir konu veya eğitim ara…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </label>
                    <div className="filters" aria-label="Kategori filtreleri">
                      {[
                        "Tümü",
                        "Mesleki gelişim",
                        "Masterclass",
                        "İletişim",
                        "Uyumluluk",
                      ].map((f) => (
                        <button
                          aria-pressed={filter === f}
                          className={filter === f ? "filter active" : "filter"}
                          key={f}
                          onClick={() => setFilter(f)}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  {cards(
                    courses.filter(
                      (c) =>
                        (view !== "saved" || state.saved.includes(c.id)) &&
                        (filter === "Tümü" || c.category === filter) &&
                        c.title
                          .toLocaleLowerCase("tr")
                          .includes(query.toLocaleLowerCase("tr")),
                    ),
                  )}
                </>
              )}
              {(view === "assigned" ||
                view === "in-progress" ||
                view === "completed") && (
                <LearnerCollection
                  mode={view}
                  state={state}
                  percent={percent}
                  open={open}
                />
              )}
              {view === "resources" && <ResourcesWorkspace />}
              {view === "journey" && (
                <>
                  <div className="page-title">
                    <div>
                      <div className="eyebrow">ÖĞRENME YOLCULUĞU</div>
                      <h1>Bir sonraki adımın belli.</h1>
                      <p>
                        Mesleki gelişimini adım adım destekleyen örnek öğrenme
                        yolu.
                      </p>
                    </div>
                    <span className="pill">
                      {completed} / {courses.length} tamamlandı
                    </span>
                  </div>
                  <div className="path-summary">
                    <GraduationCap size={34} />
                    <div>
                      <h2>Hukuk profesyoneli: başlangıç yolu</h2>
                      <p>4 eğitim · 140 dakika · Esnek sıra · Demo program</p>
                      <progress
                        max={courses.length}
                        value={completed}
                        aria-label="Program ilerlemesi"
                      />
                    </div>
                  </div>
                  <div className="journey-list">
                    {courses.map((c, i) => (
                      <article key={c.id}>
                        <div
                          className={
                            "step-circle " +
                            (state.progress[c.id]?.completed ? "done" : "")
                          }
                        >
                          {state.progress[c.id]?.completed ? (
                            <Check size={22} />
                          ) : (
                            String(i + 1).padStart(2, "0")
                          )}
                        </div>
                        <div>
                          <span className="eyebrow">{c.category}</span>
                          <h2>{c.title}</h2>
                          <p>
                            {c.duration} dakika · {c.lessons.length} bölüm
                          </p>
                        </div>
                        <button className="button" onClick={() => open(c)}>
                          {state.progress[c.id]?.completed
                            ? "Sonucu gör"
                            : "Devam et"}
                          <ArrowRight size={16} />
                        </button>
                      </article>
                    ))}
                  </div>
                </>
              )}
              {view === "reports" && (
                <>
                  <div className="page-title">
                    <div>
                      <div className="eyebrow">GELİŞİM GÖRÜNÜMÜ</div>
                      <h1>
                        {learner
                          ? "Her adımın bir karşılığı var."
                          : "Öğrenme ilerlemesi."}
                      </h1>
                      <p>
                        Yalnızca bu tarayıcıda yaptığınız örnek öğrenme
                        işlemleri.
                      </p>
                    </div>
                    <button className="button" onClick={exportProgress}>
                      CSV indir <ArrowUpRight size={16} />
                    </button>
                  </div>
                  <div className="metric-grid">
                    <div className="metric">
                      <span>Tamamlanan</span>
                      <strong>
                        {completed}
                        <small> / 4</small>
                      </strong>
                    </div>
                    <div className="metric">
                      <span>Demo puanı</span>
                      <strong>{completed * 100}</strong>
                    </div>
                    <div className="metric">
                      <span>Hedef ilerlemesi</span>
                      <strong>
                        %
                        {Math.min(
                          100,
                          Math.round((completed / state.goal) * 100),
                        )}
                      </strong>
                    </div>
                    <div className="metric">
                      <span>Kazanılan gerçek sertifika</span>
                      <strong>0</strong>
                    </div>
                  </div>
                  <section className="panel">
                    <h2>Eğitim bazında ilerleme</h2>
                    {courses.map((c) => (
                      <div className="report-row" key={c.id}>
                        <div>
                          <b>{c.title}</b>
                          <small>
                            {state.progress[c.id]?.completed
                              ? "Demo tamamlandı"
                              : percent(c)
                                ? "Devam ediyor"
                                : "Başlanmadı"}
                          </small>
                        </div>
                        <progress
                          value={percent(c)}
                          max={100}
                          aria-label={c.title}
                        />
                        <b>%{percent(c)}</b>
                      </div>
                    ))}
                  </section>
                </>
              )}
              {view === "support" && (
                <>
                  <div className="page-title">
                    <div>
                      <div className="eyebrow">YANINDAYIZ</div>
                      <h1>Birlikte çözelim.</h1>
                      <p>
                        Örnek destek talebi oluşturun, yönetici rolünde çözün
                        veya üst desteğe aktarın.
                      </p>
                    </div>
                  </div>
                  <div className="support-grid">
                    <form
                      className="panel"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!subject.trim() || !message.trim()) return;
                        setState((s) => ({
                          ...s,
                          tickets: [
                            {
                              id: crypto.randomUUID(),
                              subject: subject.trim(),
                              message: message.trim(),
                              status: "Açık" as const,
                            },
                            ...s.tickets,
                          ].slice(0, 50),
                        }));
                        setSubject("");
                        setMessage("");
                        setNotice(
                          "Demo talebiniz bu tarayıcıya kaydedildi. Dışarıya mesaj gönderilmedi.",
                        );
                      }}
                    >
                      <h2>Destek talep et</h2>
                      <p className="muted">
                        Demo formuna gerçek kişisel bilgi yazmayın.
                      </p>
                      <label>
                        Konu
                        <input
                          required
                          maxLength={120}
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Nasıl yardımcı olabiliriz?"
                        />
                      </label>
                      <label>
                        Açıklama
                        <textarea
                          required
                          maxLength={2000}
                          rows={5}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Denemek istediğiniz örnek sorunu yazın."
                        />
                      </label>
                      <button className="button primary" type="submit">
                        <Plus size={17} />
                        Demo talebi oluştur
                      </button>
                    </form>
                    <section className="panel">
                      <h2>Talepler</h2>
                      {state.tickets.length === 0 ? (
                        <div className="empty">
                          <LifeBuoy size={32} />
                          <h3>Henüz bir talep yok</h3>
                          <p>
                            Yandaki formdan destek akışını deneyebilirsiniz.
                          </p>
                        </div>
                      ) : (
                        state.tickets
                          .filter(
                            (t) =>
                              role !== "platform" ||
                              t.status === "Üst desteğe aktarıldı",
                          )
                          .map((t) => (
                            <article className="ticket" key={t.id}>
                              <span className="pill">{t.status}</span>
                              <h3>{t.subject}</h3>
                              <p>{t.message}</p>
                              {(role === "admin" || role === "platform") &&
                                t.status !== "Çözüldü" && (
                                  <div className="ticket-actions">
                                    <button
                                      className="button"
                                      onClick={() =>
                                        setState((s) => ({
                                          ...s,
                                          tickets: s.tickets.map((x) =>
                                            x.id === t.id
                                              ? { ...x, status: "Çözüldü" }
                                              : x,
                                          ),
                                        }))
                                      }
                                    >
                                      Çözüldü işaretle
                                    </button>
                                    {role === "admin" &&
                                      t.status === "Açık" && (
                                        <button
                                          className="text-button"
                                          onClick={() =>
                                            setState((s) => ({
                                              ...s,
                                              tickets: s.tickets.map((x) =>
                                                x.id === t.id
                                                  ? {
                                                      ...x,
                                                      status:
                                                        "Üst desteğe aktarıldı",
                                                    }
                                                  : x,
                                              ),
                                            }))
                                          }
                                        >
                                          Üst desteğe aktar{" "}
                                          <ArrowUpRight size={15} />
                                        </button>
                                      )}
                                  </div>
                                )}
                            </article>
                          ))
                      )}
                    </section>
                  </div>
                </>
              )}
            </>
          )}
          <footer>
            <span>Öğrenmek, mesleğin geleceğine yatırım yapmaktır.</span>
            <span>Oguz Law Academy · Demo v0.1</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
