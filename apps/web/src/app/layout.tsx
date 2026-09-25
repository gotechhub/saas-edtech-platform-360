import type { Metadata } from "next";
import "./globals.css";
import "./studio.css";
import "./v2.css";
export const metadata: Metadata = {
  title: "Oguz Law Academy · Respongo",
  description: "Hukuk profesyonelleri için öğrenme deneyimi. Sentetik demo.",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
