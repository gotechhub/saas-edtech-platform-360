"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Bell,
  ChevronDown,
  CircleHelp,
  Command,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { Button, cn } from "@respongo/ui-web";
import { roleMeta, roleNavigation, type V2Role } from "@/lib/v2-experience";

type ExperienceShellProps = {
  children: React.ReactNode;
  role: V2Role;
  moduleId: string;
  industry: string;
  tenant: string;
  accountLabel: string;
  previewRoles: V2Role[];
  preview: boolean;
};

const themeKey = "respongo:experience-v2:theme";

function Navigation({ role, moduleId, industry, tenant, close }: Omit<ExperienceShellProps, "children" | "accountLabel" | "previewRoles" | "preview"> & { close?: () => void }) {
  const items = roleNavigation[role];
  return (
    <nav className="rv2-nav" aria-label={`${roleMeta[role].label} ana menüsü`}>
      <span className="rv2-nav__label">{roleMeta[role].eyebrow}</span>
      {items.map((item) => {
        const Icon = item.icon;
        const selected = item.id === moduleId;
        return (
          <Link
            key={item.id}
            href={`/${industry}/${tenant}/v2/${role}/${item.id}`}
            className={cn("rv2-nav__item", selected && "is-selected")}
            aria-current={selected ? "page" : undefined}
            onClick={close}
          >
            <span className="rv2-nav__icon"><Icon size={19} strokeWidth={1.8} /></span>
            <span className="rv2-nav__copy"><strong>{item.label}</strong><small>{item.description}</small></span>
            {item.badge ? <span className="rv2-nav__badge">{item.badge}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function ExperienceShell(props: ExperienceShellProps) {
  const { children, role, moduleId, industry, tenant, accountLabel, previewRoles, preview } = props;
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [commandOpen, setCommandOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const initials = useMemo(() => accountLabel.split(/\s+|@/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase("tr"), [accountLabel]);

  useEffect(() => {
    const saved = localStorage.getItem(themeKey);
    const next = saved === "dark" || (!saved && matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
    setTheme(next);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase("tr") === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  const changeTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem(themeKey, next);
  };

  const changeRole = (next: V2Role) => {
    router.push(`/${industry}/${tenant}/v2/${next}/dashboard`);
  };

  return (
    <div className="rv2-app" data-v2-theme={theme} data-role={role}>
      <a className="rv2-skip" href="#rv2-main">İçeriğe geç</a>
      <aside className="rv2-sidebar">
        <Link className="rv2-brand" href={`/${industry}/${tenant}/v2/${role}/dashboard`}>
          <img src={theme === "dark" ? "/assets/brand/oguz-law-academy-white.png" : "/assets/brand/oguz-law-academy-navy.png"} width="176" height="42" alt="Oguz Law Academy" />
          <span className="rv2-version">EXPERIENCE V2</span>
        </Link>
        <Navigation role={role} moduleId={moduleId} industry={industry} tenant={tenant} />
        <div className="rv2-sidebar__footer">
          <div className="rv2-pulse-card">
            <span className="rv2-pulse-card__icon"><Command size={18} /></span>
            <div><strong>Hızlı bul</strong><small>Her modüle tek komutla ulaş.</small></div>
            <button onClick={() => setCommandOpen(true)} aria-label="Komut aramasını aç"><kbd>⌘ K</kbd></button>
          </div>
          <span className="rv2-powered">powered by <b>respongo<span>•</span></b></span>
        </div>
      </aside>

      <div className="rv2-workspace">
        <header className="rv2-topbar">
          <Dialog.Root>
            <Dialog.Trigger asChild><button className="rv2-icon-button rv2-mobile-menu" aria-label="Menüyü aç"><Menu size={21} /></button></Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="rv2-dialog-overlay" />
              <Dialog.Content className="rv2-mobile-drawer" aria-describedby={undefined}>
                <div className="rv2-mobile-drawer__head"><Dialog.Title>Menü</Dialog.Title><Dialog.Close asChild><button className="rv2-icon-button" aria-label="Menüyü kapat"><X size={20} /></button></Dialog.Close></div>
                <Dialog.Close asChild><Link className="rv2-brand rv2-brand--mobile" href={`/${industry}/${tenant}/v2/${role}/dashboard`}><img src="/assets/brand/oguz-law-academy-navy.png" width="176" height="42" alt="Oguz Law Academy" /></Link></Dialog.Close>
                <Navigation role={role} moduleId={moduleId} industry={industry} tenant={tenant} />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          <button className="rv2-search" onClick={() => setCommandOpen(true)}><Search size={18} /><span>Eğitim, kullanıcı veya işlem ara</span><kbd>⌘ K</kbd></button>
          <div className="rv2-topbar__actions">
            <span className={cn("rv2-environment", preview && "is-preview")}>{preview ? "V2 ÖNİZLEME" : "CANLI V2"}</span>
            {previewRoles.length > 1 ? (
              <label className="rv2-role-select"><span>Rol görünümü</span><select aria-label="Rol görünümü" value={role} onChange={(event) => changeRole(event.target.value as V2Role)}>{previewRoles.map((item) => <option key={item} value={item}>{roleMeta[item].label}</option>)}</select><ChevronDown size={14} /></label>
            ) : null}
            <button className="rv2-icon-button rv2-help" aria-label="Yardım"><CircleHelp size={19} /></button>
            <button className="rv2-icon-button" aria-label="Bildirimler"><Bell size={19} /><span className="rv2-notification-dot" /></button>
            <button className="rv2-icon-button" aria-label={theme === "light" ? "Koyu temaya geç" : "Açık temaya geç"} onClick={changeTheme}>{theme === "light" ? <Moon size={19} /> : <Sun size={19} />}</button>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild><button className="rv2-account" aria-label="Profil menüsü"><span className="rv2-avatar">{initials || "OA"}</span><span className="rv2-account__copy"><strong>{accountLabel}</strong><small>{roleMeta[role].label}</small></span><ChevronDown size={15} /></button></DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="rv2-dropdown" align="end" sideOffset={9}>
                  <DropdownMenu.Item className="rv2-dropdown__item"><UserRound size={17} /> Profil ve tercihler</DropdownMenu.Item>
                  <DropdownMenu.Item className="rv2-dropdown__item"><CircleHelp size={17} /> Yardım merkezi</DropdownMenu.Item>
                  <DropdownMenu.Separator className="rv2-dropdown__separator" />
                  <DropdownMenu.Item asChild><form action="/auth/signout" method="post"><button className="rv2-dropdown__item rv2-dropdown__button" type="submit"><LogOut size={17} /> Çıkış</button></form></DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </header>

        {preview ? <div className="rv2-preview-banner"><strong>Güvenli tasarım önizlemesi</strong><span>Rol görünümü yalnızca arayüzü değiştirir; hesap yetkinizi değiştirmez.</span><Link href={`/${industry}/${tenant}`}>V1 portala dön</Link></div> : null}
        <AnimatePresence mode="wait">
          <motion.main id="rv2-main" key={pathname} className="rv2-main" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            {children}
          </motion.main>
        </AnimatePresence>

        <nav className="rv2-bottom-nav" aria-label="Mobil hızlı menü">
          {roleNavigation[role].slice(0, 5).map((item) => { const Icon = item.icon; const selected = moduleId === item.id; return <Link key={item.id} href={`/${industry}/${tenant}/v2/${role}/${item.id}`} className={selected ? "is-selected" : ""}><Icon size={20} /><span>{item.label}</span>{item.badge ? <i>{item.badge}</i> : null}</Link>; })}
        </nav>
      </div>

      <Dialog.Root open={commandOpen} onOpenChange={setCommandOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="rv2-dialog-overlay" />
          <Dialog.Content className="rv2-command" aria-describedby={undefined}>
            <Dialog.Title className="rv2-command__title">Hızlı arama ve komutlar</Dialog.Title>
            <div className="rv2-command__input"><Search size={19} /><input autoFocus placeholder="Bir modül veya işlem yazın…" aria-label="Komut ara" /><Dialog.Close asChild><button aria-label="Kapat"><X size={18} /></button></Dialog.Close></div>
            <div className="rv2-command__group"><span>BU ÇALIŞMA ALANINDA</span>{roleNavigation[role].map((item) => { const Icon = item.icon; return <Dialog.Close asChild key={item.id}><Link href={`/${industry}/${tenant}/v2/${role}/${item.id}`}><Icon size={18} /><span><strong>{item.label}</strong><small>{item.description}</small></span></Link></Dialog.Close>; })}</div>
            <div className="rv2-command__footer"><span>↑↓ gezin</span><span>↵ aç</span><span>esc kapat</span></div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

