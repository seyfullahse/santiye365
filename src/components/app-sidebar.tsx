"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  FolderKanban,
  MapPin,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  HardHat,
  LogOut,
  Menu,
  Settings,
  Package,
  Home,
  BarChart3,
  Building2,
  Users,
  UserCheck,
  ClipboardList,
  FileText,
  UserPlus,
  Briefcase,
  CalendarDays,
  FolderOpen,
  Scale,
  TrendingUp,
  Shield,
  GraduationCap,
  Award,
  Stethoscope,
  HardHat as HelmetIcon,
  Siren,
  Network,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

/* ─────── Proje Yönetimi Navigasyonu ─────── */
const projectNavigation = [
  { name: "Gösterge Paneli", href: "/dashboard", icon: LayoutDashboard },
  { name: "Projeler", href: "/projeler", icon: FolderKanban },
  { name: "Mahaller", href: "/mahaller", icon: MapPin },
  { name: "Katlar", href: "/katlar", icon: Layers },
  { name: "Aktiviteler", href: "/aktiviteler", icon: Activity },
  { name: "Malzeme Takip", href: "/malzemeler", icon: Package },
  { name: "Onaylar", href: "/onaylar", icon: CheckCircle2 },
  { name: "Riskler", href: "/riskler", icon: AlertTriangle },
  { name: "Hakediş", href: "/hakedis", icon: FileText },
  { name: "Şirketler", href: "/sirketler", icon: Building2 },
  { name: "Ekipler", href: "/ekipler", icon: Users },
  { name: "Çalışanlar", href: "/calisanlar", icon: UserCheck },
  { name: "Günlük Personel", href: "/personel", icon: HardHat },
  { name: "Puantaj", href: "/puantaj", icon: ClipboardList },
];

/* ─────── İK Navigasyonu ─────── */
const ikNavigation = [
  { name: "İK Özet", href: "/ik", icon: BarChart3 },
  { name: "Personel", href: "/ik/personel", icon: UserPlus },
  { name: "Departmanlar", href: "/ik/departmanlar", icon: Building2 },
  { name: "Pozisyonlar", href: "/ik/pozisyonlar", icon: Briefcase },
  { name: "İzin Yönetimi", href: "/ik/izinler", icon: CalendarDays },
  { name: "Özlük Dosyası", href: "/ik/ozluk", icon: FolderOpen },
  { name: "Disiplin", href: "/ik/disiplin", icon: Scale },
  { name: "Performans", href: "/ik/performans", icon: TrendingUp },
];

/* ─────── İSG Navigasyonu ─────── */
const isgNavigation = [
  { name: "İSG Özet", href: "/isg", icon: Shield },
  { name: "Eğitimler", href: "/isg/egitimler", icon: GraduationCap },
  { name: "Sertifikalar", href: "/isg/sertifikalar", icon: Award },
  { name: "Periyodik Muayene", href: "/isg/muayeneler", icon: Stethoscope },
  { name: "KKD Takibi", href: "/isg/kkd", icon: HelmetIcon },
  { name: "İş Kazaları", href: "/isg/kazalar", icon: Siren },
];

/* ─────── Organizasyon Navigasyonu ─────── */
const orgNavigation = [
  { name: "Org. Şeması", href: "/organizasyon", icon: Network },
  { name: "Firma Profili", href: "/organizasyon/profil", icon: Building2 },
  { name: "İletişim Dizini", href: "/organizasyon/iletisim", icon: Users },
];

const adminNavigation = [
  { name: "Ayarlar", href: "/ayarlar", icon: Settings },
];

/* ─────── SIDEBAR CONTENT ─────── */
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [brand, setBrand] = useState<string | null>(null);

  // Hangi modüldeyiz?
  const isIK = pathname.startsWith("/ik");
  const isISG = pathname.startsWith("/isg");
  const isOrg = pathname.startsWith("/organizasyon");
  const isProject = !isIK && !isISG && !isOrg;

  // Aktif modülün navigasyonu
  const activeNav = isOrg ? orgNavigation : isIK ? ikNavigation : isISG ? isgNavigation : projectNavigation;
  const moduleTitle = isOrg ? "Organizasyon" : isIK ? "İnsan Kaynakları" : isISG ? "İş Sağlığı & Güvenliği" : "Proje Yönetimi";
  const ModuleIcon = isOrg ? Network : isIK ? UserCheck : isISG ? Shield : FolderKanban;
  const moduleColor = isOrg ? "text-violet-600" : isIK ? "text-cyan-600" : isISG ? "text-red-600" : "text-blue-600";

  useEffect(() => {
    const saved = localStorage.getItem("theme-brand");
    if (saved) {
      applyBrand(saved);
      setBrand(saved);
    }
  }, []);

  const applyBrand = (value: string) => {
    const root = document.documentElement;
    root.style.setProperty("--brand", value);
  };

  const handleBrandChange = (value: string) => {
    applyBrand(value);
    setBrand(value);
    localStorage.setItem("theme-brand", value);
  };

  const brandOptions = [
    { label: "Siyah", value: "oklch(0.205 0 0)" },
    { label: "Mavi", value: "oklch(0.68 0.11 220)" },
    { label: "Yeşil", value: "oklch(0.72 0.12 160)" },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 lg:gap-3 px-4 lg:px-6 py-4 lg:py-6 hover:opacity-80 transition-opacity"
      >
        <HardHat className="h-7 w-7 lg:h-10 lg:w-10 text-primary" />
        <span className="text-lg lg:text-2xl font-bold">Şantiye360</span>
      </Link>
      <Separator />

      {/* Üst Navigasyon */}
      <div className="px-3 pt-3 pb-1 space-y-0.5">
        <Link
          href="/"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            pathname === "/"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Home className="h-5 w-5" />
          Ana Sayfa
        </Link>
        <Link
          href="/yonetim-paneli"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            pathname.startsWith("/yonetim-paneli")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <BarChart3 className="h-5 w-5" />
          Yönetici Paneli
        </Link>
      </div>

      <Separator className="mx-3 my-1" />

      {/* Navigasyon — sadece aktif modül */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {/* Modül Başlığı */}
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <ModuleIcon className={cn("h-3.5 w-3.5", moduleColor)} />
          <span>{moduleTitle}</span>
        </div>

        {/* Modül menü öğeleri */}
        <div className="space-y-0.5">
          {activeNav.map((item) => {
            const baseHref = isOrg ? "/organizasyon" : isIK ? "/ik" : isISG ? "/isg" : "";
            const isActive = baseHref
              ? (pathname === item.href || (item.href !== baseHref && pathname.startsWith(item.href)))
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Admin bölümü */}
        {session?.user?.role === "ADMIN" && (
          <>
            <Separator className="my-2" />
            {adminNavigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <Separator />

      {/* Theme + User */}
      <div className="p-4 space-y-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Tema Rengi</p>
          <div className="flex gap-2">
            {brandOptions.map((opt) => (
              <button
                key={opt.value}
                aria-label={opt.label}
                onClick={() => handleBrandChange(opt.value)}
                className={cn(
                  "h-8 w-8 rounded-full border shadow-sm transition",
                  brand === opt.value ? "ring-2 ring-ring ring-offset-2" : ""
                )}
                style={{ background: opt.value }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback>
              {session?.user?.name?.charAt(0) ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {session?.user?.name ?? "Kullanıcı"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {session?.user?.email ?? ""}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut({ redirectTo: "/giris" })}
            title="Çıkış yap"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─────── EXPORTED COMPONENT ─────── */
export function AppSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile trigger */}
      <div className="fixed top-0 left-0 z-40 flex h-18 w-full items-center border-b bg-background px-4 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Menü</SheetTitle>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <Link href="/" className="ml-3 flex items-center gap-2">
          <HardHat className="h-6 w-6 text-primary" />
          <span className="text-base font-bold">Şantiye360</span>
        </Link>
      </div>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-background lg:block">
        <SidebarContent />
      </aside>
    </>
  );
}
