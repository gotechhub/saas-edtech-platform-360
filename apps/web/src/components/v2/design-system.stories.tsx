import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Award, Download, ShieldCheck } from "lucide-react";
import { Button, ProgressBar, StatusPill, Surface } from "@respongo/ui-web";
import { ExperienceState, type ExperienceViewState } from "./experience-state";

const meta = {
  title: "Experience V2/Design System",
  parameters: { a11y: { test: "error" } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const sectionStyle = { display: "grid", gap: 18, maxWidth: 980 } as const;
const rowStyle = { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 12 } as const;

export const ControlsAndStatus: Story = {
  render: () => (
    <div style={sectionStyle}>
      <div><span className="rv2-eyebrow">TEMEL KONTROLLER</span><h1 style={{ marginBottom: 8 }}>Eylemler ve sistem durumları</h1><p style={{ color: "var(--rv2-text-soft)" }}>Açık/koyu tema ve tenant markasıyla aynı semantik sözleşmeyi kullanır.</p></div>
      <Surface className="rv2-panel">
        <div style={rowStyle}>
          <Button>Birincil eylem</Button>
          <Button variant="secondary"><Download size={16} /> Dışa aktar</Button>
          <Button variant="ghost">İkincil bağlantı</Button>
          <Button variant="danger">Kritik işlem</Button>
        </div>
      </Surface>
      <Surface className="rv2-panel">
        <div style={rowStyle}>
          <StatusPill tone="success">Tamamlandı</StatusPill>
          <StatusPill tone="warning">Yaklaşıyor</StatusPill>
          <StatusPill tone="danger">Gecikti</StatusPill>
          <StatusPill tone="info">Devam ediyor</StatusPill>
          <StatusPill>Planlandı</StatusPill>
        </div>
      </Surface>
      <Surface className="rv2-panel" style={{ display: "grid", gap: 16 }}>
        <ProgressBar value={78} label="Zorunlu eğitim uyumu" />
        <ProgressBar value={43} label="Onboarding yolculuğu" />
      </Surface>
    </div>
  ),
};

export const CardsAndHierarchy: Story = {
  render: () => (
    <div className="rv2-grid rv2-grid--thirds" style={{ maxWidth: 1120 }}>
      <Surface className="rv2-panel"><span className="rv2-eyebrow">UYUMLULUK</span><ShieldCheck size={26} style={{ color: "var(--rv2-success)", margin: "12px 0" }} /><h2>%94 zamanında</h2><p style={{ color: "var(--rv2-text-soft)" }}>Üç kullanıcı için hatırlatma gerekiyor.</p><StatusPill tone="success">Sağlıklı</StatusPill></Surface>
      <Surface className="rv2-panel"><span className="rv2-eyebrow">SERTİFİKA</span><Award size={26} style={{ color: "var(--rv2-warning)", margin: "12px 0" }} /><h2>12 yeni başarı</h2><p style={{ color: "var(--rv2-text-soft)" }}>Bu ay doğrulanmış sertifikalar.</p><StatusPill tone="warning">4 onay bekliyor</StatusPill></Surface>
      <Surface className="rv2-panel"><span className="rv2-eyebrow">ÖĞRENME YOLU</span><h2 style={{ marginTop: 12 }}>Avukatlık Masterclass</h2><p style={{ color: "var(--rv2-text-soft)" }}>Yedi adımdan üçü tamamlandı.</p><ProgressBar value={43} label="Masterclass ilerlemesi" /></Surface>
    </div>
  ),
};

const stateNames: ExperienceViewState[] = ["loading", "empty", "filtered_empty", "error", "forbidden", "offline", "stale"];

export const StateContract: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 30 }}>
      {stateNames.map((state) => (
        <div key={state}>
          <span className="rv2-eyebrow">{state.toLocaleUpperCase("tr")}</span>
          <ExperienceState state={state} moduleLabel="Kullanıcılar" retryHref="#" dashboardHref="#">
            <Surface className="rv2-panel"><h2>Yüklü içerik</h2><p>Offline ve stale durumlarında korunur.</p></Surface>
          </ExperienceState>
        </div>
      ))}
    </div>
  ),
};
