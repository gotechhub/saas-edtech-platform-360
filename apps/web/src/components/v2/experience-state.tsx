import Link from "next/link";
import {
  Ban,
  CircleOff,
  CloudOff,
  FilterX,
  Inbox,
  RefreshCcw,
  TriangleAlert,
} from "lucide-react";
import { buttonVariants, Surface } from "@respongo/ui-web";

export const experienceViewStates = [
  "loaded",
  "loading",
  "empty",
  "filtered_empty",
  "error",
  "forbidden",
  "offline",
  "stale",
] as const;

export type ExperienceViewState = (typeof experienceViewStates)[number];

export function isExperienceViewState(value: string | undefined): value is ExperienceViewState {
  return Boolean(value && experienceViewStates.includes(value as ExperienceViewState));
}

type ExperienceStateProps = {
  state: ExperienceViewState;
  moduleLabel: string;
  retryHref: string;
  dashboardHref: string;
  children: React.ReactNode;
};

const stateCopy = {
  empty: {
    eyebrow: "HENÜZ KAYIT YOK",
    title: "Bu alan kullanıma hazır",
    description: "İlk kaydı oluşturduğunuzda içerik ve ilerleme bilgileri burada görünecek.",
    action: "İlk kaydı oluştur",
    icon: Inbox,
  },
  filtered_empty: {
    eyebrow: "SONUÇ BULUNAMADI",
    title: "Filtrelerle eşleşen kayıt yok",
    description: "Arama ifadesini veya seçili filtreleri değiştirerek kapsamı genişletebilirsiniz.",
    action: "Filtreleri temizle",
    icon: FilterX,
  },
  error: {
    eyebrow: "VERİ YÜKLENEMEDİ",
    title: "Bu alanı şu anda açamıyoruz",
    description: "İşleminiz kaybolmadı. Bağlantı ve servis durumu yeniden kontrol edilebilir.",
    action: "Yeniden dene",
    icon: TriangleAlert,
  },
  forbidden: {
    eyebrow: "YETKİ GEREKLİ",
    title: "Bu çalışma alanına erişiminiz yok",
    description: "Erişim rol ve tenant kapsamıyla sınırlandı. Gerekli yetki için akademi yöneticinize başvurun.",
    action: "Ana sayfaya dön",
    icon: Ban,
  },
} as const;

function SkeletonState({ moduleLabel }: { moduleLabel: string }) {
  return (
    <section className="rv2-state rv2-state--loading" aria-busy="true" aria-live="polite" data-experience-state="loading">
      <span className="rv2-sr-only">{moduleLabel} yükleniyor</span>
      <div className="rv2-state-skeleton rv2-state-skeleton--title" />
      <div className="rv2-state-skeleton rv2-state-skeleton--copy" />
      <div className="rv2-state-skeleton-grid">
        {Array.from({ length: 4 }, (_, index) => <div className="rv2-state-skeleton rv2-state-skeleton--card" key={index} />)}
      </div>
      <div className="rv2-state-skeleton rv2-state-skeleton--panel" />
    </section>
  );
}

function BlockingState({ state, retryHref, dashboardHref }: Pick<ExperienceStateProps, "retryHref" | "dashboardHref"> & { state: "empty" | "filtered_empty" | "error" | "forbidden" }) {
  const copy = stateCopy[state];
  const Icon = copy.icon;
  const href = state === "forbidden" ? dashboardHref : retryHref;
  return (
    <Surface className={`rv2-state rv2-state--${state}`} data-experience-state={state} role={state === "error" ? "alert" : "status"}>
      <span className="rv2-state__icon" aria-hidden="true"><Icon size={28} /></span>
      <span className="rv2-eyebrow">{copy.eyebrow}</span>
      <h1>{copy.title}</h1>
      <p>{copy.description}</p>
      <Link className={buttonVariants()} href={href}>{state === "error" ? <RefreshCcw size={16} /> : null}{copy.action}</Link>
    </Surface>
  );
}

export function ExperienceState({ state, moduleLabel, retryHref, dashboardHref, children }: ExperienceStateProps) {
  if (state === "loading") return <SkeletonState moduleLabel={moduleLabel} />;
  if (state === "empty" || state === "filtered_empty" || state === "error" || state === "forbidden") {
    return <BlockingState state={state} retryHref={retryHref} dashboardHref={dashboardHref} />;
  }
  if (state === "offline") {
    return (
      <div data-experience-state="offline">
        <div className="rv2-state-banner is-offline" role="status"><CloudOff size={17} /><div><strong>Çevrimdışısınız</strong><span>Son eşitlenen içerik gösteriliyor. Değişiklikler bağlantı kurulunca gönderilecek.</span></div></div>
        {children}
      </div>
    );
  }
  if (state === "stale") {
    return (
      <div data-experience-state="stale">
        <div className="rv2-state-banner is-stale" role="status"><CircleOff size={17} /><div><strong>Veri güncelleniyor</strong><span>Bu görünüm önbellekten geldi; son senkronizasyon 8 dakika önce yapıldı.</span></div><Link href={retryHref}>Şimdi yenile</Link></div>
        {children}
      </div>
    );
  }
  return <div data-experience-state="loaded">{children}</div>;
}

