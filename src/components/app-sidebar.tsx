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
  GitBranch,
  ArrowLeft,
  Landmark,
  Calculator,
  FileSpreadsheet,
  Upload,
  Receipt,
  Megaphone,
  Tag,
  PlusCircle,
  LineChart,
  Wallet,
  ShoppingCart,
  DollarSign,
  PieChart,
  Bot,
  Truck,
  Star,
  Lock,
  FileCheck,
  Monitor,
  Gavel,
  Library,
  ListOrdered,
  ClipboardCheck,
  CalendarRange,
  Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

/* ─────── Yardımcı: Proje ID'sini pathname'den çıkar ─────── */
function extractProjectId(pathname: string): string | null {
  // /projeler/[id] veya /projeler/[id]/... formatını yakala
  const match = pathname.match(/^\/projeler\/([^/]+)/);
  if (match && match[1] !== "undefined") return match[1];
  return null;
}

/* ─────── Proje Yönetimi Navigasyonu (Proje seçim öncesi) ─────── */
const projectNavigation = [
  { name: "Projeler", href: "/projeler", icon: FolderKanban },
  { name: "Mahaller", href: "/mahaller", icon: MapPin },
  { name: "Katlar", href: "/katlar", icon: Layers },
  { name: "Aktiviteler", href: "/aktiviteler", icon: Activity },
  { name: "Malzeme Takip", href: "/malzemeler", icon: Package },
  { name: "Onaylar", href: "/onaylar", icon: CheckCircle2 },
  { name: "Riskler", href: "/riskler", icon: AlertTriangle },
  { name: "Şirketler", href: "/sirketler", icon: Building2 },
  { name: "Ekipler", href: "/ekipler", icon: Users },
  { name: "Çalışanlar", href: "/calisanlar", icon: UserCheck },
  { name: "Günlük Personel", href: "/personel", icon: HardHat },
  { name: "Puantaj", href: "/puantaj", icon: ClipboardList },
];

/* ─────── Hakediş Navigasyonu ─────── */
const hakedisNavigation = [
  { name: "Hakediş Özet", href: "/hakedis", icon: Receipt },
  { name: "İşveren Hakedişi", href: "/hakedis/isveren", icon: Landmark },
  { name: "Taşeron Hakedişi", href: "/hakedis/taseron", icon: Building2 },
  { name: "Sözleşmeler", href: "/hakedis/sozlesmeler", icon: FileText },
  { name: "Keşif", href: "/hakedis/kesif", icon: FileSpreadsheet },
];

/* ─────── Puantaj Navigasyonu ─────── */
const puantajNavigation = [
  { name: "Proje Seçimi", href: "/puantaj", icon: FolderKanban },
];

/* ─────── Muhasebe Navigasyonu ─────── */
const muhasebeNavigation = [
  { name: "Muhasebe Özet", href: "/muhasebe", icon: Banknote },
  { name: "Çalışan Ücretleri", href: "/muhasebe/ucretler", icon: DollarSign },
  { name: "Puantaj Rapor", href: "/muhasebe/puantaj-rapor", icon: ClipboardList },
  { name: "Maaş Hesaplama", href: "/muhasebe/maas-hesaplama", icon: Calculator },
];

/* ─────── Proje İçi Navigasyon (Proje seçildikten sonra) ─────── */
function getProjectScopedNav(projectId: string) {
  return [
    { name: "Proje Özeti", href: `/projeler/${projectId}`, icon: FolderKanban, exact: true },
    { name: "Gösterge Paneli", href: `/projeler/${projectId}/dashboard`, icon: LayoutDashboard },
    { name: "Mahaller & Katlar", href: `/projeler/${projectId}/mahaller`, icon: MapPin },
    { name: "Aktiviteler", href: `/projeler/${projectId}/aktiviteler`, icon: Activity },
    { name: "Malzeme Takip", href: `/projeler/${projectId}/malzemeler`, icon: Package },
    { name: "Onaylar", href: `/projeler/${projectId}/onaylar`, icon: CheckCircle2 },
    { name: "Riskler", href: `/projeler/${projectId}/riskler`, icon: AlertTriangle },
    { name: "Şirketler", href: `/projeler/${projectId}/sirketler`, icon: Building2 },
    { name: "Ekipler", href: `/projeler/${projectId}/ekipler`, icon: Users },
    { name: "Çalışanlar", href: `/projeler/${projectId}/calisanlar`, icon: UserCheck },
    { name: "Günlük Personel", href: `/projeler/${projectId}/personel`, icon: HardHat },
    { name: "Firma Puantaj", href: `/projeler/${projectId}/firma-puantaj`, icon: ClipboardList },
    { name: "Taşeron Puantaj", href: `/projeler/${projectId}/taseron-puantaj`, icon: HardHat },
  ];
}

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

/* ─────── CRM Navigasyonu ─────── */
const crmNavigation = [
  { name: "CRM Özet", href: "/crm", icon: BarChart3 },
  { name: "Müşteriler", href: "/crm/musteriler", icon: Building2 },
  { name: "Fırsatlar", href: "/crm/firsatlar", icon: TrendingUp },
  { name: "İletişim Geçmişi", href: "/crm/iletisim", icon: Users },
];

/* ─────── Duyurular Navigasyonu ─────── */
const duyurularNavigation = [
  { name: "Tüm Duyurular", href: "/duyurular", icon: Megaphone },
  { name: "Yeni Duyuru", href: "/duyurular/yeni", icon: PlusCircle },
  { name: "Kategoriler", href: "/duyurular/kategoriler", icon: Tag },
];

/* ─────── Organizasyon Navigasyonu ─────── */
const orgNavigation = [
  { name: "Org. Şeması", href: "/organizasyon", icon: Network },
  { name: "Ağaç Görünümü", href: "/organizasyon/agac", icon: GitBranch },
  { name: "Firma Profili", href: "/organizasyon/profil", icon: Building2 },
  { name: "İletişim Dizini", href: "/organizasyon/iletisim", icon: Users },
];

/* ─────── Yatırım & GYO Navigasyonu ─────── */
const yatirimNavigation = [
  { name: "Yatırım Özet", href: "/yatirim", icon: BarChart3 },
  { name: "Portföy", href: "/yatirim/portfoy", icon: Building2 },
  { name: "Fizibilite", href: "/yatirim/fizibilite", icon: Calculator },
  { name: "Satış Takibi", href: "/yatirim/satis", icon: ShoppingCart },
  { name: "Tahsilat Planı", href: "/yatirim/tahsilat", icon: DollarSign },
  { name: "Nakit Projeksiyonu", href: "/yatirim/nakit", icon: Wallet },
  { name: "ROI & Raporlar", href: "/yatirim/roi", icon: PieChart },
];

/* ─────── Taşeron Yönetimi Navigasyonu ─────── */
const taseronNavigation = [
  { name: "Taşeron Özet", href: "/taseron", icon: Truck },
  { name: "Sözleşmeler", href: "/taseron/sozlesmeler", icon: FileText },
  { name: "Hakediş", href: "/taseron/hakedis", icon: Receipt },
  { name: "Puantaj", href: "/taseron/puantaj", icon: ClipboardList },
  { name: "Performans", href: "/taseron/performans", icon: Star },
  { name: "Kesinti & Teminat", href: "/taseron/kesinti-teminat", icon: Lock },
  { name: "Evrak Takibi", href: "/taseron/evraklar", icon: FileCheck },
];

/* ─────── Maskot AI Navigasyonu ─────── */
const maskotNavigation = [
  { name: "Sohbet", href: "/maskot", icon: Bot },
  { name: "Ayarlar", href: "/maskot/ayarlar", icon: Settings },
];

/* ─────── Teklif & İhale Navigasyonu ─────── */
const teklifNavigation = [
  { name: "Teklif Özet", href: "/teklif", icon: BarChart3 },
  { name: "İhaleler", href: "/teklif/ihaleler", icon: Gavel },
  { name: "Poz Kütüphanesi", href: "/teklif/poz-kutuphanesi", icon: Library },
  { name: "Disiplinler", href: "/teklif/disiplinler", icon: ListOrdered },
  { name: "İhale Arşivi", href: "/teklif/arsiv", icon: FolderOpen },
];

/* ─────── Toplantı Tutanakları Navigasyonu ─────── */
const toplantiNavigation = [
  { name: "Toplantılar", href: "/toplanti-tutanaklari", icon: ClipboardCheck },
];

/* ─────── Sunum Navigasyonu ─────── */
const sunumNavigation = [
  { name: "Sunumlar", href: "/sunum", icon: Monitor },
];

/* ─────── Kullanıcı Yönetimi Navigasyonu ─────── */
const kullanicilarNavigation = [
  { name: "Kullanıcılar", href: "/kullanicilar", icon: Users },
];

const adminNavigation = [
  { name: "Kullanıcı Yönetimi", href: "/kullanicilar", icon: Users },
];

/* ─────── SIDEBAR CONTENT ─────── */
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  // Hangi modüldeyiz?
  const isCRM = pathname.startsWith("/crm");
  const isDuyurular = pathname.startsWith("/duyurular");
  const isIK = pathname.startsWith("/ik");
  const isISG = pathname.startsWith("/isg");
  const isOrg = pathname.startsWith("/organizasyon");
  const isHakedis = pathname.startsWith("/hakedis");
  const isYatirim = pathname.startsWith("/yatirim");
  const isTaseron = pathname.startsWith("/taseron");
  const isMaskot = pathname.startsWith("/maskot");
  const isKullanicilar = pathname.startsWith("/kullanicilar");
  const isSunum = pathname.startsWith("/sunum");
  const isTeklif = pathname.startsWith("/teklif");
  const isToplanti = pathname.startsWith("/toplanti-tutanaklari");
  const isPuantaj = pathname.startsWith("/puantaj");
  const isMuhasebe = pathname.startsWith("/muhasebe");
  const isIndirimler = pathname.startsWith("/indirimler");
  const activeProjectId = extractProjectId(pathname);
  const isInsideProject = !!activeProjectId;
  const isProject = !isCRM && !isDuyurular && !isIK && !isISG && !isOrg && !isHakedis && !isYatirim && !isTaseron && !isMaskot && !isKullanicilar && !isSunum && !isTeklif && !isToplanti && !isPuantaj && !isMuhasebe && !isIndirimler;

  // Aktif modülün navigasyonu
  const activeNav = isCRM
    ? crmNavigation
    : isDuyurular
    ? duyurularNavigation
    : isOrg
    ? orgNavigation
    : isIK
    ? ikNavigation
    : isISG
    ? isgNavigation
    : isHakedis
    ? hakedisNavigation
    : isYatirim
    ? yatirimNavigation
    : isTaseron
    ? taseronNavigation
    : isMaskot
    ? maskotNavigation
    : isKullanicilar
    ? kullanicilarNavigation
    : isSunum
    ? sunumNavigation
    : isTeklif
    ? teklifNavigation
    : isToplanti
    ? toplantiNavigation
    : isPuantaj
    ? puantajNavigation
    : isMuhasebe
    ? muhasebeNavigation
    : isIndirimler
    ? [{ name: "Tüm İndirimler", href: "/indirimler", icon: Tag }]
    : isInsideProject
    ? getProjectScopedNav(activeProjectId)
    : projectNavigation;
  const moduleTitle = isCRM
    ? "CRM & Müşteri"
    : isDuyurular
    ? "Duyurular"
    : isOrg
    ? "Organizasyon"
    : isIK
    ? "İnsan Kaynakları"
    : isISG
    ? "İş Sağlığı & Güvenliği"
    : isHakedis
    ? "Hakediş Yönetimi"
    : isYatirim
    ? "Yatırım & GYO"
    : isTaseron
    ? "Taşeron Yönetimi"
    : isMaskot
    ? "Maskot AI Asistan"
    : isKullanicilar
    ? "Kullanıcı Yönetimi"
    : isSunum
    ? "Sunum Ekranı"
    : isTeklif
    ? "Teklif & İhale"
    : isToplanti
    ? "Toplantı Tutanakları"
    : isPuantaj
    ? "Puantaj Sistemi"
    : isMuhasebe
    ? "Muhasebe"
    : isIndirimler
    ? "Çalışan İndirimleri"
    : isInsideProject
    ? "Proje Modülleri"
    : "Proje Yönetimi";
  const ModuleIcon = isCRM ? UserCheck : isDuyurular ? Megaphone : isOrg ? Network : isIK ? UserCheck : isISG ? Shield : isHakedis ? Receipt : isYatirim ? LineChart : isTaseron ? Truck : isMaskot ? Bot : isKullanicilar ? Users : isSunum ? Monitor : isTeklif ? Gavel : isToplanti ? ClipboardCheck : isPuantaj ? ClipboardList : isMuhasebe ? Banknote : isIndirimler ? Tag : FolderKanban;
  const moduleColor = isCRM ? "text-pink-600" : isDuyurular ? "text-sky-600" : isOrg ? "text-violet-600" : isIK ? "text-cyan-600" : isISG ? "text-red-600" : isHakedis ? "text-amber-600" : isYatirim ? "text-emerald-600" : isTaseron ? "text-orange-600" : isMaskot ? "text-purple-600" : isKullanicilar ? "text-indigo-600" : isSunum ? "text-teal-600" : isTeklif ? "text-rose-600" : isToplanti ? "text-lime-600" : isPuantaj ? "text-teal-600" : isMuhasebe ? "text-green-600" : isIndirimler ? "text-rose-500" : "text-blue-600";

  // Load saved theme brand on mount
  useEffect(() => {
    const saved = localStorage.getItem("theme-brand");
    if (saved) {
      document.documentElement.style.setProperty("--brand", saved);
    }
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 px-4 lg:px-5 py-3 lg:py-4 hover:opacity-80 transition-opacity"
      >
        <HardHat className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
        <span className="text-sm lg:text-base font-bold">Şantiye360</span>
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
          href="/duyurular"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            pathname.startsWith("/duyurular")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Megaphone className="h-5 w-5" />
          Duyurular
        </Link>
        <Link
          href="/indirimler"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            pathname.startsWith("/indirimler")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Tag className="h-5 w-5" />
          İndirimler
        </Link>

      </div>

      <Separator className="mx-3 my-1" />

      {/* Navigasyon — sadece aktif modül */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {/* Proje içindeyken geri dön butonu */}
        {isInsideProject && (
          <Link
            href="/projeler"
            onClick={onNavigate}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Tüm Projeler
          </Link>
        )}

        {/* Modül Başlığı */}
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <ModuleIcon className={cn("h-3.5 w-3.5", moduleColor)} />
          <span>{moduleTitle}</span>
        </div>

        {/* Modül menü öğeleri */}
        <div className="space-y-0.5">
          {activeNav.map((item, index) => {
            const typedItem = item as { name: string; href: string; icon: typeof FolderKanban; exact?: boolean };
            const baseHref = isCRM ? "/crm" : isDuyurular ? "/duyurular" : isOrg ? "/organizasyon" : isIK ? "/ik" : isISG ? "/isg" : isYatirim ? "/yatirim" : isTaseron ? "/taseron" : isMaskot ? "/maskot" : isKullanicilar ? "/kullanicilar" : isSunum ? "/sunum" : isTeklif ? "/teklif" : isToplanti ? "/toplanti-tutanaklari" : isIndirimler ? "/indirimler" : "";
            let isActive: boolean;
            if (typedItem.exact) {
              isActive = pathname === typedItem.href;
            } else if (isInsideProject) {
              isActive = pathname === typedItem.href || (typedItem.href !== `/projeler/${activeProjectId}` && pathname.startsWith(typedItem.href));
            } else if (baseHref) {
              isActive = pathname === typedItem.href || (typedItem.href !== baseHref && pathname.startsWith(typedItem.href));
            } else {
              isActive = pathname.startsWith(typedItem.href);
            }
            const isEntryItem = index === 0 && !isCRM && !isDuyurular && !isIK && !isISG && !isOrg && !isYatirim && !isTaseron && !isMaskot && !isKullanicilar && !isSunum && !isTeklif && !isToplanti && !isInsideProject;
            return (
              <div key={item.name}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    isEntryItem && "font-semibold"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
                {isEntryItem && <Separator className="my-1.5 mx-1" />}
              </div>
            );
          })}
        </div>
      </nav>

      <Separator />

      {/* User */}
      <div className="p-4 space-y-4">
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
          <Link href="/ayarlar" onClick={onNavigate}>
            <Button
              variant="ghost"
              size="icon"
              title="Ayarlar"
              className={cn(pathname.startsWith("/ayarlar") && "bg-accent")}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
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
