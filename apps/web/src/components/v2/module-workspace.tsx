import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Download,
  FileBarChart,
  FileCheck2,
  Filter,
  FolderKanban,
  LayoutTemplate,
  Library,
  MessagesSquare,
  MoreHorizontal,
  Palette,
  Play,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  Upload,
  UsersRound,
  WandSparkles,
} from "lucide-react";
import { Button, ProgressBar, StatusPill, Surface } from "@respongo/ui-web";
import { courses } from "@/lib/demo";
import {
  academyPrograms,
  academyUsers,
  learningResources,
} from "@/lib/lms-data";
import type { LiveAcademyUser } from "@/lib/live-dashboard";
import { roleNavigation, type V2Role } from "@/lib/v2-experience";
import { PeopleTable } from "./people-table";
import { ProgramStudio } from "./program-studio";
import { AssignedPrograms } from "./assigned-programs";

type ModuleWorkspaceProps = {
  role: V2Role;
  moduleId: string;
  basePath: string;
  users?: LiveAcademyUser[];
};

function WorkspaceHeader({
  role,
  moduleId,
  children,
}: {
  role: V2Role;
  moduleId: string;
  children?: React.ReactNode;
}) {
  const item = roleNavigation[role].find((entry) => entry.id === moduleId);
  return (
    <header className="rv2-page-header">
      <div>
        <span className="rv2-eyebrow">
          {role === "platform"
            ? "PLATFORM MODÜLÜ"
            : role === "admin"
              ? "AKADEMİ YÖNETİMİ"
              : "ÇALIŞMA ALANI"}
        </span>
        <h1>{item?.label ?? "Profil ve tercihler"}</h1>
        <p>
          {item?.description ??
            "Kişisel bilgileriniz, tercihleriniz ve güvenlik ayarlarınız."}
        </p>
      </div>
      {children ? (
        <div className="rv2-page-header__actions">{children}</div>
      ) : null}
    </header>
  );
}

function CourseCollection({
  basePath,
  filter = "all",
}: {
  basePath: string;
  filter?: "all" | "required" | "progress";
}) {
  const selected =
    filter === "required"
      ? courses.filter((item) => item.required)
      : filter === "progress"
        ? courses.slice(0, 4)
        : courses;
  return (
    <div className="rv2-course-catalog">
      {selected.map((course, index) => (
        <article
          className="rv2-course-card rv2-course-card--catalog"
          key={course.id}
        >
          <div
            className={`rv2-course-card__art rv2-course-art-${(index % 4) + 1}`}
          >
            <span>{course.category}</span>
            <i>0{index + 1}</i>
            <StatusPill tone={course.required ? "warning" : "info"}>
              {course.required ? "Zorunlu" : course.format}
            </StatusPill>
          </div>
          <div className="rv2-course-card__body">
            <small>
              {course.level} · {course.duration} DK
            </small>
            <h3>{course.title}</h3>
            <p>{course.description}</p>
            {filter === "progress" || index < 2 ? (
              <ProgressBar
                value={[64, 28, 82, 12][index % 4]}
                label={`${course.title} ilerleme`}
              />
            ) : (
              <div className="rv2-course-card__meta">
                <span>
                  <BookOpen size={14} /> {course.lessons.length} bölüm
                </span>
                <span>
                  <Award size={14} />{" "}
                  {course.certificate ? "Sertifikalı" : "Katılım"}
                </span>
              </div>
            )}
            <Link className="rv2-text-link" href={`${basePath}/learning`}>
              {filter === "progress" ? "Devam et" : "Eğitimi incele"}{" "}
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

function LearningWorkspace({ basePath }: { basePath: string }) {
  return (
    <>
      <WorkspaceHeader role="learner" moduleId="learning">
        <Button variant="secondary">
          <Filter size={16} /> Filtrele
        </Button>
      </WorkspaceHeader>
      <AssignedPrograms basePath={basePath} />
      <div className="rv2-tabs">
        <button className="is-active">
          Atananlar <span>4</span>
        </button>
        <button>
          Devam edenler <span>3</span>
        </button>
        <button>
          Tamamlananlar <span>12</span>
        </button>
        <button>
          Listem <span>6</span>
        </button>
      </div>
      <Surface className="rv2-learning-summary">
        <div>
          <span>
            <Play size={18} />
          </span>
          <div>
            <strong>3 aktif eğitim</strong>
            <small>Toplam 74 dakika kaldı</small>
          </div>
        </div>
        <div>
          <span>
            <ShieldCheck size={18} />
          </span>
          <div>
            <strong>1 yaklaşan zorunlu</strong>
            <small>Son tarih 27 Eylül</small>
          </div>
        </div>
        <div>
          <span>
            <Award size={18} />
          </span>
          <div>
            <strong>12 tamamlanan</strong>
            <small>4 sertifika kazanıldı</small>
          </div>
        </div>
      </Surface>
      <CourseCollection basePath={basePath} filter="progress" />
    </>
  );
}

function CatalogWorkspace({ basePath }: { basePath: string }) {
  return (
    <>
      <WorkspaceHeader role="learner" moduleId="catalog" />
      <div className="rv2-catalog-search">
        <Search size={20} />
        <input placeholder="Eğitim, yetkinlik veya eğitmen ara" />
        <button>
          <Filter size={17} /> Filtreler
        </button>
      </div>
      <div className="rv2-chip-row">
        {[
          "Tümü",
          "Hukuk Masterclass",
          "Uyumluluk",
          "Mesleki gelişim",
          "Kişisel gelişim",
          "Canlı eğitim",
        ].map((chip, index) => (
          <button className={index === 0 ? "is-active" : ""} key={chip}>
            {chip}
          </button>
        ))}
      </div>
      <section className="rv2-editorial-banner">
        <div>
          <span className="rv2-kicker">
            <Sparkles size={14} /> BU AYIN SEÇKİSİ
          </span>
          <h2>Daha güçlü bir hukuk pratiği için 5 ustalık</h2>
          <p>
            Vaka düşüncesinden müzakereye, kıdemli hukukçuların deneyimleriyle
            hazırlanmış seçki.
          </p>
          <Button size="lg">
            Seçkiyi incele <ArrowRight size={17} />
          </Button>
        </div>
        <i aria-hidden="true">
          <WandSparkles size={58} />
        </i>
      </section>
      <CourseCollection basePath={basePath} />
    </>
  );
}

function JourneyWorkspace() {
  const steps = [
    "Akademiye hoş geldin",
    "Bilgi güvenliği temeli",
    "Müvekkil iletişimi",
    "Vaka analizi",
    "Hukuki yazım atölyesi",
    "Müzakere pratiği",
    "Kapanış değerlendirmesi",
  ];
  return (
    <>
      <WorkspaceHeader role="learner" moduleId="journey" />
      <div className="rv2-grid rv2-grid--journey">
        <Surface className="rv2-panel rv2-journey-map">
          <div className="rv2-panel__head">
            <div>
              <span className="rv2-eyebrow">AKTİF YOLCULUK</span>
              <h2>Yeni Avukat Onboarding</h2>
              <p>İlk 60 günde güçlü ve güvenli başlangıç.</p>
            </div>
            <StatusPill tone="info">%43 tamamlandı</StatusPill>
          </div>
          <div className="rv2-journey-track">
            {steps.map((step, index) => (
              <div
                key={step}
                className={
                  index < 3 ? "is-complete" : index === 3 ? "is-current" : ""
                }
              >
                <span>
                  {index < 3 ? <CheckCircle2 size={18} /> : index + 1}
                </span>
                <div>
                  <strong>{step}</strong>
                  <small>
                    {index < 3
                      ? "Tamamlandı"
                      : index === 3
                        ? "Sıradaki · 50 dk"
                        : index === 4
                          ? "Önkoşul: Vaka analizi"
                          : "Kilitli"}
                  </small>
                </div>
                {index === 3 ? <Button size="sm">Başla</Button> : null}
              </div>
            ))}
          </div>
        </Surface>
        <aside>
          <Surface className="rv2-panel rv2-journey-stats">
            <span className="rv2-eyebrow">YOLCULUK ÖZETİ</span>
            <div>
              <strong>3</strong>
              <span>tamamlanan adım</span>
            </div>
            <div>
              <strong>2s 14dk</strong>
              <span>öğrenme süresi</span>
            </div>
            <div>
              <strong>+420 XP</strong>
              <span>kazanılan puan</span>
            </div>
            <ProgressBar value={43} label="Yolculuk ilerlemesi" />
          </Surface>
          <Surface className="rv2-panel rv2-mentor-note">
            <span className="rv2-avatar">EY</span>
            <h3>Eğitmeninden not</h3>
            <p>
              Vaka analizi adımında bilgi ve varsayımı ayıran kontrol listesini
              kullanmayı unutma.
            </p>
            <small>Ece Yalın · 2 gün önce</small>
          </Surface>
        </aside>
      </div>
    </>
  );
}

function ResourceWorkspace({ role }: { role: V2Role }) {
  return (
    <>
      <WorkspaceHeader role={role} moduleId="resources">
        <Button>
          <Upload size={16} /> Kaynak ekle
        </Button>
      </WorkspaceHeader>
      <div className="rv2-catalog-search">
        <Search size={20} />
        <input placeholder="Kaynaklarda ara" />
        <button>
          <Filter size={17} /> Tür ve konu
        </button>
      </div>
      <div className="rv2-resource-grid">
        {learningResources.map((item, index) => (
          <Surface as="article" className="rv2-resource-card" key={item.id}>
            <span className={`rv2-resource-card__icon is-${index % 4}`}>
              <Library size={21} />
            </span>
            <StatusPill tone="neutral">{item.type}</StatusPill>
            <h3>{item.title}</h3>
            <p>{item.topic}</p>
            <div>
              <span>{item.readTime}</span>
              <button aria-label={`${item.title} indir`}>
                <Download size={17} />
              </button>
            </div>
          </Surface>
        ))}
      </div>
    </>
  );
}

function UsersWorkspace({
  basePath,
  users,
}: {
  basePath: string;
  users?: LiveAcademyUser[];
}) {
  const source =
    users ??
    academyUsers.map((user) => ({
      id: user.id,
      name: user.name,
      initials: user.initials,
      role: user.role,
      team: user.team,
      status: user.status,
      completion: user.completion,
      lastSeen: user.lastSeen,
    }));
  return (
    <>
      <WorkspaceHeader role="admin" moduleId="users">
        <Button variant="secondary">
          <Upload size={16} /> CSV içe aktar
        </Button>
        <Button>
          <Plus size={16} /> Kullanıcı ekle
        </Button>
      </WorkspaceHeader>
      <section className="rv2-metrics rv2-metrics--compact">
        <Surface className="rv2-mini-metric">
          <span>Toplam kullanıcı</span>
          <strong>{source.length}</strong>
          <small>5 aktif</small>
        </Surface>
        <Surface className="rv2-mini-metric">
          <span>Aktif ekip</span>
          <strong>4</strong>
          <small>1 yönetici ataması bekliyor</small>
        </Surface>
        <Surface className="rv2-mini-metric">
          <span>Davet bekleyen</span>
          <strong>1</strong>
          <small>3 gün önce gönderildi</small>
        </Surface>
        <Surface className="rv2-mini-metric">
          <span>Ortalama ilerleme</span>
          <strong>%60</strong>
          <small>Son 30 gün</small>
        </Surface>
      </section>
      <Surface className="rv2-panel rv2-table-panel">
        <div className="rv2-panel__head">
          <div>
            <span className="rv2-eyebrow">KURUM DİZİNİ</span>
            <h2>Kullanıcılar ve ekipler</h2>
          </div>
          <Link href={`${basePath}/reports`}>
            Kullanıcı raporu <ArrowRight size={15} />
          </Link>
        </div>
        <PeopleTable users={source} />
      </Surface>
    </>
  );
}

function LearningAdminWorkspace({ basePath }: { basePath: string }) {
  return (
    <>
      <WorkspaceHeader role="admin" moduleId="learning">
        <Button variant="secondary">
          <Upload size={16} /> İçerik yükle
        </Button>
        <Link
          className="rv2-button rv2-button--primary rv2-button--md"
          href={`${basePath}/program-builder`}
        >
          <Plus size={16} /> Program oluştur
        </Link>
      </WorkspaceHeader>
      <div className="rv2-tabs">
        <button className="is-active">
          Eğitimler <span>8</span>
        </button>
        <button>
          Programlar <span>4</span>
        </button>
        <button>
          Yolculuklar <span>3</span>
        </button>
        <button>
          Canlı eğitim <span>2</span>
        </button>
      </div>
      <div className="rv2-grid rv2-grid--learning-admin">
        <Surface className="rv2-panel">
          <div className="rv2-panel__head">
            <div>
              <span className="rv2-eyebrow">PROGRAM PORTFÖYÜ</span>
              <h2>Yayındaki programlar</h2>
            </div>
            <StatusPill tone="success">3 yayında</StatusPill>
          </div>
          {academyPrograms.map((program) => (
            <div className="rv2-program-row" key={program.id}>
              <span>
                <FolderKanban size={19} />
              </span>
              <div>
                <strong>{program.title}</strong>
                <small>
                  {program.audience} · {program.courses} eğitim
                </small>
              </div>
              <div>
                <ProgressBar
                  value={program.completion}
                  label={`${program.title} ilerleme`}
                />
              </div>
              <StatusPill
                tone={program.status === "Yayında" ? "success" : "neutral"}
              >
                {program.status}
              </StatusPill>
              <button aria-label="Program seçenekleri">
                <MoreHorizontal size={17} />
              </button>
            </div>
          ))}
        </Surface>
        <Surface className="rv2-panel rv2-readiness">
          <div className="rv2-panel__head">
            <div>
              <span className="rv2-eyebrow">İÇERİK HAZIRLIĞI</span>
              <h2>Yayın kontrolü</h2>
            </div>
            <strong>%78</strong>
          </div>
          <ProgressBar value={78} label="İçerik hazırlığı" />
          {[
            { label: "Kapak ve açıklama", value: "8/8", done: true },
            { label: "Erişilebilirlik kontrolü", value: "6/8", done: false },
            { label: "Sürüm ve sahip", value: "7/8", done: false },
            { label: "Lisans kaydı", value: "8/8", done: true },
          ].map((item) => (
            <div key={item.label}>
              <span>
                {item.done ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <CircleAlert size={16} />
                )}{" "}
                {item.label}
              </span>
              <strong>{item.value}</strong>
            </div>
          ))}
          <Link className="rv2-text-link" href={`${basePath}/content`}>
            İçerik ihtiyaç merkezine git <ArrowRight size={15} />
          </Link>
        </Surface>
      </div>
      <CourseCollection basePath={basePath} />
    </>
  );
}

const moduleCopy: Record<
  string,
  {
    title: string;
    description: string;
    items: Array<{
      title: string;
      meta: string;
      tone?: "success" | "warning" | "danger" | "info";
    }>;
  }
> = {
  calendar: {
    title: "Takvim ve canlı öğrenme",
    description:
      "Canlı oturumlarını, son tarihleri ve kişisel öğrenme planını tek takvimde izle.",
    items: [
      {
        title: "Avukatlar için Yapay Zekâ",
        meta: "Cuma 14.00 · Microsoft Teams",
        tone: "info",
      },
      {
        title: "KVKK eğitimi son tarihi",
        meta: "27 Eylül · 2 gün kaldı",
        tone: "warning",
      },
      {
        title: "Müzakere pratiği",
        meta: "2 Ekim · 8 kişilik atölye",
        tone: "success",
      },
    ],
  },
  community: {
    title: "Topluluk ve sosyal öğrenme",
    description:
      "Meslektaşlarınla kaynak paylaş, uzmanlara soru sor ve hukuk pratiği topluluklarına katıl.",
    items: [
      {
        title: "Güncel içtihat tartışması",
        meta: "Hukuk Pratiği · 18 yeni yorum",
        tone: "info",
      },
      {
        title: "Yapay zekâ araçları listesi",
        meta: "Selin Gür paylaştı · 42 kaydetme",
        tone: "success",
      },
      {
        title: "Müzakere kliniği",
        meta: "Canlı soru-cevap · yarın 16.00",
        tone: "warning",
      },
    ],
  },
  achievements: {
    title: "Başarılarım",
    description:
      "Sertifikalarını, rozetlerini, seviyeni ve öğrenme puanlarını tek profilde takip et.",
    items: [
      { title: "Etik Uzmanı", meta: "Rozet · 120 XP kaldı", tone: "warning" },
      {
        title: "Bilgi Güvenliği 2026",
        meta: "Sertifika · 18 Eylül 2026",
        tone: "success",
      },
      {
        title: "7 günlük öğrenme serisi",
        meta: "Seri · kişisel rekor",
        tone: "info",
      },
    ],
  },
  assignments: {
    title: "Atama ve uyum merkezi",
    description:
      "Hedef kitleyi önizleyin, zorunlulukları yönetin ve gecikenlere kontrollü müdahale edin.",
    items: [
      {
        title: "2026 Zorunlu Uyum Programı",
        meta: "42 kişi · %81 tamamlanma",
        tone: "success",
      },
      {
        title: "Bilgi Güvenliği",
        meta: "3 geciken · son tarih 27 Eylül",
        tone: "danger",
      },
      {
        title: "Yeni Avukat Onboarding",
        meta: "8 kişi · %64 tamamlanma",
        tone: "info",
      },
    ],
  },
  content: {
    title: "İçerik üretim merkezi",
    description:
      "İhtiyaçtan yayına tüm varlıkları, sahipleri ve kalite kontrollerini yönetin.",
    items: [
      {
        title: "KVKK eğitimi politika güncellemesi",
        meta: "Sahip: Ece Yalın · 2 asset eksik",
        tone: "warning",
      },
      {
        title: "Müzakere masterclass",
        meta: "İncelemede · 7/8 kontrol tamam",
        tone: "info",
      },
      {
        title: "Yeni başlayanlar kontrol listesi",
        meta: "Yayına hazır",
        tone: "success",
      },
    ],
  },
  engagement: {
    title: "Etkileşim ve iletişim",
    description:
      "Topluluk, bildirim, form, anket ve otomatik iletişim akışlarını birlikte yönetin.",
    items: [
      {
        title: "Zorunlu eğitim hatırlatma akışı",
        meta: "Aktif · bugün 18 gönderim",
        tone: "success",
      },
      {
        title: "Eğitim deneyimi anketi",
        meta: "%72 yanıt oranı",
        tone: "info",
      },
      {
        title: "Hukuk pratiği topluluğu",
        meta: "128 üye · 14 yeni gönderi",
        tone: "success",
      },
    ],
  },
  reports: {
    title: "Rapor ve analiz stüdyosu",
    description:
      "Standart raporları kullanın, rol kapsamlı özel görünümler oluşturun ve dağıtımı planlayın.",
    items: [
      {
        title: "Aylık öğrenme özeti",
        meta: "Her ayın 1’i · 4 alıcı",
        tone: "success",
      },
      {
        title: "Zorunlu eğitim risk raporu",
        meta: "Her pazartesi · yöneticiler",
        tone: "warning",
      },
      { title: "İçerik kullanım analizi", meta: "Taslak rapor", tone: "info" },
    ],
  },
  branding: {
    title: "Marka ve portal stüdyosu",
    description:
      "Logo, tema, giriş ekranı, banner ve açık/koyu görünüm taslaklarını güvenle yayınlayın.",
    items: [
      {
        title: "Oguz Law Academy · Ana tema",
        meta: "Yayında · V2 hazır",
        tone: "success",
      },
      {
        title: "Giriş ekranı · Editorial",
        meta: "Mobil önizleme onayı bekliyor",
        tone: "warning",
      },
      { title: "Duyuru banner seti", meta: "4 şablon", tone: "info" },
    ],
  },
  operations: {
    title: "Operasyon ve entegrasyonlar",
    description:
      "Bağlantılar, otomasyonlar, e-posta sağlığı ve arka plan işlerini izleyin.",
    items: [
      { title: "Supabase", meta: "Bağlı · 142 ms", tone: "success" },
      {
        title: "Microsoft Teams",
        meta: "Kimlik bilgisi gerekli",
        tone: "warning",
      },
      { title: "Zoom", meta: "Test bağlantısı planlandı", tone: "info" },
      { title: "GoTo Training", meta: "Kurulum bekliyor", tone: "warning" },
    ],
  },
  support: {
    title: "Destek merkezi",
    description:
      "Bilgi bankasıyla hızlı çözüm bulun, talepleri takip edin ve gerektiğinde üst desteğe aktarın.",
    items: [
      {
        title: "#OLA-104 · Sertifika görünmüyor",
        meta: "Kullanıcı yanıtı bekleniyor",
        tone: "warning",
      },
      {
        title: "#OLA-103 · SCORM devam durumu",
        meta: "Teknik desteğe aktarıldı",
        tone: "danger",
      },
      {
        title: "#OLA-102 · Eğitim atama yardımı",
        meta: "Çözüldü",
        tone: "success",
      },
    ],
  },
  courses: {
    title: "Eğitimlerim",
    description: "İçeriklerinizin sürüm, kalite ve katılım durumunu yönetin.",
    items: [
      {
        title: "Hukuki yazım ve argüman tasarımı",
        meta: "Yayında · 24 öğrenen",
        tone: "success",
      },
      {
        title: "Vaka analizi atölyesi",
        meta: "Altyazı incelemesi bekliyor",
        tone: "warning",
      },
      {
        title: "Müzakere stratejileri",
        meta: "Taslak · son kayıt dün",
        tone: "info",
      },
    ],
  },
  sessions: {
    title: "Canlı oturumlar",
    description:
      "Takvimi, kontenjanı, katılımı ve yoklamayı tek çalışma alanından yönetin.",
    items: [
      {
        title: "Hukuki yazım atölyesi",
        meta: "Bugün 10:30 · 18 katılımcı",
        tone: "info",
      },
      {
        title: "Vaka değerlendirme kliniği",
        meta: "Bugün 15:00 · 12 katılımcı",
        tone: "info",
      },
      {
        title: "Müzakere pratiği",
        meta: "28 Eylül · kayıt açık",
        tone: "success",
      },
    ],
  },
  assessments: {
    title: "Değerlendirme kuyruğu",
    description:
      "Teslimleri rubrikle inceleyin, geri bildirim taslağını kaydedin ve kontrollü yayınlayın.",
    items: [
      {
        title: "Vaka analizi · Deniz Aras",
        meta: "Bugün · öncelikli",
        tone: "warning",
      },
      {
        title: "Müzakere planı · Mert Kaya",
        meta: "Bugün · öncelikli",
        tone: "warning",
      },
      {
        title: "Hukuki yazım · Selin Gür",
        meta: "Dün · bekliyor",
        tone: "info",
      },
    ],
  },
  questions: {
    title: "Öğrenen soruları",
    description:
      "Ders bağlamını kaybetmeden soruları yanıtlayın ve tekrar eden konuları bilgi bankasına taşıyın.",
    items: [
      {
        title: "Menfaat çatışması örneği",
        meta: "Dijital etik · 18 dk önce",
        tone: "warning",
      },
      {
        title: "SCORM bölümü yeniden açma",
        meta: "Bilgi güvenliği · 2 saat önce",
        tone: "info",
      },
      {
        title: "Vaka analizi kontrol listesi",
        meta: "Masterclass · dün",
        tone: "info",
      },
    ],
  },
  cohorts: {
    title: "Sınıf ve kohortlar",
    description:
      "Katılım, ilerleme ve değerlendirme eğilimlerini sınıf düzeyinde izleyin.",
    items: [
      {
        title: "Yeni Avukatlar · Eylül",
        meta: "8 kişi · %64 ilerleme",
        tone: "success",
      },
      {
        title: "Masterclass · Grup A",
        meta: "12 kişi · %71 ilerleme",
        tone: "success",
      },
      {
        title: "Uyum 2026 · Eksik grup",
        meta: "6 kişi · müdahale gerekli",
        tone: "danger",
      },
    ],
  },
  team: {
    title: "Ekip dizini",
    description:
      "Doğrudan ekibinizin öğrenme ve uyum görünümünü güvenli kapsam içinde yönetin.",
    items: [
      { title: "Deniz Aras", meta: "3 aktif eğitim · %72", tone: "success" },
      { title: "Mert Kaya", meta: "1 geciken zorunlu · %48", tone: "danger" },
      {
        title: "Selin Gür",
        meta: "Dış sertifika onayı bekliyor",
        tone: "warning",
      },
    ],
  },
  compliance: {
    title: "Ekip uyumluluğu",
    description:
      "Yaklaşan ve geciken zorunluluklara kişi bazında müdahale edin.",
    items: [
      {
        title: "Bilgi Güvenliği",
        meta: "1 geciken · 2 gün kaldı",
        tone: "danger",
      },
      {
        title: "KVKK Farkındalığı",
        meta: "2 kişi tamamlamadı",
        tone: "warning",
      },
      { title: "Meslek Etiği", meta: "Ekip %100 uygun", tone: "success" },
    ],
  },
  approvals: {
    title: "Onay merkezi",
    description:
      "Dış sertifika, eğitim ve gelişim taleplerini kanıtlarıyla değerlendirin.",
    items: [
      {
        title: "Selin Gür · Arabuluculuk sertifikası",
        meta: "Belge doğrulaması bekliyor",
        tone: "warning",
      },
      {
        title: "Deniz Aras · Liderlik programı",
        meta: "Eğitim talebi",
        tone: "info",
      },
      {
        title: "Mert Kaya · Konferans katılımı",
        meta: "Bütçe onayı gerekli",
        tone: "warning",
      },
    ],
  },
  skills: {
    title: "Yetkinlik ve gelişim",
    description:
      "Ekip açıklarını doğrulanmış kanıtlarla görün ve uygun öğrenme yolunu önerin.",
    items: [
      {
        title: "Müzakere",
        meta: "Ekip skoru %51 · öncelikli",
        tone: "warning",
      },
      { title: "Müvekkil iletişimi", meta: "Ekip skoru %64", tone: "info" },
      { title: "Dijital güvenlik", meta: "Ekip skoru %83", tone: "success" },
    ],
  },
  portals: {
    title: "Portal filosu",
    description:
      "Demo ve müşteri portallarını sağlık, kullanım, lisans ve destek bağlamında yönetin.",
    items: [
      {
        title: "Oguz Law Academy",
        meta: "Hukuk · Pilot V2 · 842 kullanıcı",
        tone: "success",
      },
      {
        title: "Meridian Hotels Academy",
        meta: "Otelcilik · Demo · 126 kullanıcı",
        tone: "info",
      },
      {
        title: "Atlas Finans Akademi",
        meta: "Finans · SLA riski",
        tone: "warning",
      },
    ],
  },
  provisioning: {
    title: "Sektör bazlı portal fabrikası",
    description:
      "Sektör, paket, marka, modül, kota ve yönetici adımlarını tek kurulum işiyle tamamlayın.",
    items: [
      {
        title: "Meridian Hotels Academy",
        meta: "Adım 4/6 · marka bekleniyor",
        tone: "warning",
      },
      {
        title: "Nova Health Learning",
        meta: "Adım 2/6 · sektör paketi",
        tone: "info",
      },
      {
        title: "Oguz Law Academy",
        meta: "Kurulum tamamlandı",
        tone: "success",
      },
    ],
  },
  "sector-packs": {
    title: "Sektör paketleri",
    description:
      "Terminoloji, modül, tema, içerik kataloğu ve onboarding şablonlarını sürümleyin.",
    items: [
      { title: "Hukuk v1.2", meta: "Yayında · 14 şablon", tone: "success" },
      { title: "Otelcilik v0.8", meta: "Hazırlık %62", tone: "warning" },
      { title: "Finans v0.3", meta: "Araştırma aşaması", tone: "info" },
    ],
  },
  products: {
    title: "Ürün, lisans ve kota",
    description:
      "GOLMS, GOLXP, GoCatalog, GoFactory ve GoTools haklarını portal bazında yönetin.",
    items: [
      {
        title: "Oguz Law · Enterprise Pilot",
        meta: "842/1.000 kullanıcı · %61 kullanım",
        tone: "success",
      },
      { title: "Meridian · Demo", meta: "26 gün kaldı", tone: "warning" },
      { title: "Atlas Finans · Growth", meta: "Kota %87", tone: "warning" },
    ],
  },
  security: {
    title: "Güvenlik ve audit",
    description:
      "Kimlik, MFA, hassas işlemler, tenant izolasyonu ve denetim sinyallerini izleyin.",
    items: [
      {
        title: "MFA kapsam önerisi",
        meta: "2 portal · orta öncelik",
        tone: "warning",
      },
      {
        title: "Tenant izolasyon testleri",
        meta: "Son çalıştırma geçti",
        tone: "success",
      },
      {
        title: "Destek scope grant",
        meta: "1 aktif · 38 dk kaldı",
        tone: "info",
      },
    ],
  },
  releases: {
    title: "Sürüm ve deneyim yönetimi",
    description:
      "V1/V2 deneyim bayraklarını, canary gruplarını ve geri dönüş kapılarını yönetin.",
    items: [
      {
        title: "Experience V2 · Oguz Law",
        meta: "Pilot · 6 kullanıcı",
        tone: "info",
      },
      { title: "Web 0.2.0", meta: "Canlı · sağlıklı", tone: "success" },
      { title: "Mobile 0.1.0", meta: "İç test hazırlığı", tone: "warning" },
    ],
  },
};

function GenericOperationalWorkspace({
  role,
  moduleId,
}: {
  role: V2Role;
  moduleId: string;
}) {
  const copy = moduleCopy[moduleId] ?? {
    title: "Çalışma alanı",
    description: "Bu modül V2 tasarım sistemiyle hazırlanıyor.",
    items: [],
  };
  return (
    <>
      <header className="rv2-page-header">
        <div>
          <span className="rv2-eyebrow">
            {role === "platform"
              ? "PLATFORM OPERASYONU"
              : role === "manager"
                ? "EKİP YÖNETİMİ"
                : role === "instructor"
                  ? "EĞİTMEN OPERASYONU"
                  : "AKADEMİ YÖNETİMİ"}
          </span>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
        </div>
        <div className="rv2-page-header__actions">
          <Button variant="secondary">
            <Download size={16} /> Dışa aktar
          </Button>
          <Button>
            <Plus size={16} /> Yeni oluştur
          </Button>
        </div>
      </header>
      <section className="rv2-metrics rv2-metrics--compact">
        <Surface className="rv2-mini-metric">
          <span>Toplam kayıt</span>
          <strong>{copy.items.length * 8 + 3}</strong>
          <small>görünür kapsam</small>
        </Surface>
        <Surface className="rv2-mini-metric">
          <span>İşlem bekleyen</span>
          <strong>{Math.max(1, copy.items.length - 1)}</strong>
          <small>önceliklendirilmiş</small>
        </Surface>
        <Surface className="rv2-mini-metric">
          <span>Bu ay tamamlanan</span>
          <strong>{copy.items.length * 4}</strong>
          <small>+%12 eğilim</small>
        </Surface>
        <Surface className="rv2-mini-metric">
          <span>Sağlık</span>
          <strong>%96</strong>
          <small>son kontrol bugün</small>
        </Surface>
      </section>
      <div className="rv2-grid rv2-grid--workbench">
        <Surface className="rv2-panel">
          <div className="rv2-panel__head">
            <div>
              <span className="rv2-eyebrow">AKTİF KAYITLAR</span>
              <h2>Öncelikli işler</h2>
            </div>
            <button className="rv2-filter-button">
              <Filter size={16} /> Filtrele
            </button>
          </div>
          <div className="rv2-work-list">
            {copy.items.map((item, index) => (
              <article key={item.title}>
                <span
                  className={`rv2-work-list__icon is-${item.tone ?? "info"}`}
                >
                  {moduleId === "branding" ? (
                    <Palette size={18} />
                  ) : moduleId === "reports" ? (
                    <FileBarChart size={18} />
                  ) : moduleId === "support" ? (
                    <TicketCheck size={18} />
                  ) : moduleId === "security" ? (
                    <ShieldCheck size={18} />
                  ) : moduleId === "content" ? (
                    <LayoutTemplate size={18} />
                  ) : (
                    <Settings2 size={18} />
                  )}
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.meta}</small>
                </div>
                <StatusPill tone={item.tone ?? "info"}>
                  {index === 0 ? "Öncelikli" : "Aktif"}
                </StatusPill>
                <button aria-label={`${item.title} seçenekleri`}>
                  <MoreHorizontal size={18} />
                </button>
              </article>
            ))}
          </div>
        </Surface>
        <aside>
          <Surface className="rv2-panel rv2-context-card">
            <span className="rv2-eyebrow">ÖNERİLEN SONRAKİ ADIM</span>
            <Sparkles size={25} />
            <h3>En yüksek etkiyi önce tamamlayın</h3>
            <p>
              V2, gecikme ve risk bağlamına göre sıradaki işi bu alanda görünür
              kılar.
            </p>
            <Button size="sm">
              Öneriyi uygula <ArrowRight size={15} />
            </Button>
          </Surface>
          <Surface className="rv2-panel">
            <div className="rv2-panel__head">
              <div>
                <span className="rv2-eyebrow">SON HAREKETLER</span>
                <h2>İşlem geçmişi</h2>
              </div>
            </div>
            {[
              "Taslak kaydedildi",
              "Kapsam önizlendi",
              "Yönetici onayladı",
              "Bildirim planlandı",
            ].map((item, index) => (
              <div className="rv2-timeline-row" key={item}>
                <i className={index === 0 ? "is-current" : ""} />
                <span>
                  <strong>{item}</strong>
                  <small>
                    {index === 0 ? "8 dk önce" : `${index + 1} saat önce`}
                  </small>
                </span>
              </div>
            ))}
          </Surface>
        </aside>
      </div>
    </>
  );
}

function ProfileWorkspace() {
  return (
    <>
      <WorkspaceHeader role="learner" moduleId="profile">
        <Button variant="secondary">Profili düzenle</Button>
      </WorkspaceHeader>
      <div className="rv2-grid rv2-grid--profile">
        <Surface className="rv2-profile-card">
          <div className="rv2-profile-cover" />
          <span className="rv2-avatar rv2-avatar--profile">SG</span>
          <h2>Selçuk Gönder</h2>
          <p>Kurucu · Öğrenme ve Gelişim Lideri</p>
          <div>
            <span>
              <strong>12</strong>
              <small>Tamamlanan</small>
            </span>
            <span>
              <strong>4</strong>
              <small>Sertifika</small>
            </span>
            <span>
              <strong>1.840</strong>
              <small>XP</small>
            </span>
          </div>
        </Surface>
        <Surface className="rv2-panel">
          <div className="rv2-panel__head">
            <div>
              <span className="rv2-eyebrow">YETKİNLİK PROFİLİ</span>
              <h2>Gelişim alanları</h2>
            </div>
            <StatusPill tone="info">6 yetkinlik</StatusPill>
          </div>
          {[
            { name: "Öğrenme stratejisi", value: 92 },
            { name: "Dijital dönüşüm", value: 86 },
            { name: "Ürün liderliği", value: 78 },
            { name: "Hukuk sektörü bilgisi", value: 64 },
          ].map((item) => (
            <div className="rv2-skill-row" key={item.name}>
              <span>
                <strong>{item.name}</strong>
                <small>
                  {item.value >= 85
                    ? "İleri"
                    : item.value >= 70
                      ? "Yetkin"
                      : "Gelişiyor"}
                </small>
              </span>
              <ProgressBar value={item.value} label={item.name} />
            </div>
          ))}
        </Surface>
        <Surface className="rv2-panel">
          <div className="rv2-panel__head">
            <div>
              <span className="rv2-eyebrow">SERTİFİKALAR</span>
              <h2>Doğrulanmış başarılar</h2>
            </div>
            <Button size="sm" variant="secondary">
              <Upload size={15} /> Dış belge ekle
            </Button>
          </div>
          {[
            "Avukatlık Masterclass",
            "Bilgi Güvenliği 2026",
            "KVKK Farkındalığı",
          ].map((name, index) => (
            <div className="rv2-certificate-row" key={name}>
              <span>
                <Award size={20} />
              </span>
              <div>
                <strong>{name}</strong>
                <small>
                  {index ? "Oguz Law Academy" : "Respongo Learning"} · 2026
                </small>
              </div>
              <StatusPill tone="success">Doğrulandı</StatusPill>
              <Download size={17} />
            </div>
          ))}
        </Surface>
      </div>
    </>
  );
}

export function ModuleWorkspace({
  role,
  moduleId,
  basePath,
  users,
}: ModuleWorkspaceProps) {
  if (moduleId === "profile") return <ProfileWorkspace />;
  if (role === "learner" && moduleId === "learning")
    return <LearningWorkspace basePath={basePath} />;
  if (role === "learner" && moduleId === "catalog")
    return <CatalogWorkspace basePath={basePath} />;
  if (role === "learner" && moduleId === "journey") return <JourneyWorkspace />;
  if (moduleId === "resources") return <ResourceWorkspace role={role} />;
  if (role === "admin" && moduleId === "users")
    return <UsersWorkspace basePath={basePath} users={users} />;
  if (role === "admin" && moduleId === "learning")
    return <LearningAdminWorkspace basePath={basePath} />;
  if (role === "admin" && moduleId === "program-builder")
    return <ProgramStudio />;
  if (
    role === "learner" &&
    ["calendar", "community", "achievements", "support"].includes(moduleId)
  )
    return <GenericOperationalWorkspace role={role} moduleId={moduleId} />;
  return <GenericOperationalWorkspace role={role} moduleId={moduleId} />;
}
