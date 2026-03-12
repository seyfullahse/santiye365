"use client";

import { SessionProvider, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FolderKanban,
  MapPin,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Package,
  Building2,
  Users,
  ClipboardList,
  HardHat,
  LogOut,
  Sparkles,
  ArrowRight,
  Bot,
  Zap,
  Shield,
  BarChart3,
  Monitor,
  ChevronRight,
  Clock,
  Calendar,
  Brain,
  Lock,
  Bell,
  Plug,
  Gavel,
  Truck,
  Wallet,
  ShoppingCart,
  UserCheck,
  TrendingUp,
  MessageSquare,
  FolderOpen,
  Network,
  Receipt,
  Megaphone,
  Settings,
  Eye,
  EyeOff,
  ShieldAlert,
  ClipboardCheck,
  Banknote,
  Tag,
  Percent,
  Utensils,
  Shirt,
  Smartphone,
  Gift,
  Store,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

/* ══════════════════ TYPES ══════════════════ */

interface KpiData {
  activeProjects: number;
  totalWorkers: number;
  todayAttendance: number;
  pendingApprovals: number;
}

interface RecentActivity {
  id: string;
  name: string;
  projectName: string;
  disciplineName: string;
  status: string;
  progressPercent: number;
  updatedAt: string;
}

interface AnasayfaProps {
  userName: string;
  userEmail: string;
  userRole: string;
  kpiData: KpiData;
  recentActivities: RecentActivity[];
}

interface AIData {
  greeting: string;
  modules: Record<string, string>;
}

interface Stats {
  activeProjects: number;
  totalProjects: number;
  totalWorkers: number;
  pendingApprovals: number;
  highRisks: number;
  totalActivities: number;
  completedActivities: number;
  inProgressActivities: number;
  totalZones: number;
  totalFloors: number;
  totalCompanies: number;
  totalTeams: number;
  totalMaterials: number;
  totalHakedis: number;
}

/* ╔══════════════════════════════════════════════════════════╗
   ║          KLASİK GÖRÜNÜM — 14 MODÜL                      ║
   ╚══════════════════════════════════════════════════════════╝ */

interface ClassicModule {
  name: string;
  icon: React.ElementType;
  href: string;
  color: string;
  description: string;
  features: string[];
  status: "active" | "soon";
}

const classicModules: ClassicModule[] = [
  {
    name: "Yönetici Paneli",
    icon: LayoutDashboard,
    href: "/yonetim-paneli",
    color: "bg-orange-500",
    description: "Üst yönetim karar ekranı",
    features: ["Proje KPI", "Finans özeti", "Karlılık durumu", "Risk skoru", "Taşeron performans", "Portföy özeti", "Nakit durumu"],
    status: "active",
  },
  {
    name: "Proje Yönetimi",
    icon: FolderKanban,
    href: "/projeler",
    color: "bg-blue-600",
    description: "Aktivite, mahal, kat, risk ve onay takibi",
    features: ["Aktiviteler", "İş Programı", "Mahaller & Katlar", "Puantaj", "Günlük Saha Raporu", "Riskler", "Kalite Kayıtları", "Onaylar", "Malzemeler"],
    status: "active",
  },
  {
    name: "Puantaj Sistemi",
    icon: ClipboardList,
    href: "/puantaj",
    color: "bg-teal-600",
    description: "Günlük devam, mesai ve izin takibi",
    features: ["Günlük Puantaj", "Aylık Puantaj", "Çalışan Yönetimi", "İzin Takibi", "Mesai Hesaplama", "Firma & Ekip Bazlı", "Raporlar"],
    status: "active",
  },
  {
    name: "Muhasebe",
    icon: Banknote,
    href: "/muhasebe",
    color: "bg-green-600",
    description: "Ücret girişi ve puantaj maliyet raporu",
    features: ["Çalışan Ücretleri", "Birim Fiyat Girişi", "Mesai Ücreti", "Puantaj Maliyet Raporu", "Firma Bazlı Analiz", "Excel Dışa Aktarım"],
    status: "active",
  },
  {
    name: "İhale & Teklif",
    icon: Gavel,
    href: "/teklif",
    color: "bg-indigo-500",
    description: "Teklif hazırlama ve ihale yönetimi",
    features: ["Teklif hazırlama", "Metraj", "Poz Kütüphanesi", "Birim fiyat", "Revizyon takibi", "Karlılık simülasyonu", "Mukayese", "İhale arşivi"],
    status: "active",
  },
  {
    name: "Taşeron Yönetimi",
    icon: Truck,
    href: "/taseron",
    color: "bg-rose-500",
    description: "Taşeron firma ve sözleşme takibi",
    features: ["Firma kartı", "Sözleşme", "Hakediş", "Puantaj", "Performans", "Kesinti & Teminat", "Evrak takibi"],
    status: "active",
  },
  {
    name: "Finans & Bütçe",
    icon: Wallet,
    href: "#",
    color: "bg-emerald-600",
    description: "Mali takip ve bütçe yönetimi",
    features: ["Proje bütçesi", "Gelir & gider", "Nakit akış", "Maliyet analiz", "Sapma analizi", "Karlılık", "Finansal raporlar"],
    status: "soon",
  },
  {
    name: "Satınalma & Depo",
    icon: ShoppingCart,
    href: "#",
    color: "bg-amber-600",
    description: "Tedarik zinciri ve stok yönetimi",
    features: ["Talep oluşturma", "Teklif toplama", "Sipariş", "Teslim takip", "Stok", "Depo hareketleri", "Tedarikçi kartı"],
    status: "soon",
  },
  {
    name: "İnsan Kaynakları",
    icon: UserCheck,
    href: "/ik",
    color: "bg-cyan-600",
    description: "Personel ve özlük yönetimi",
    features: ["Personel", "Departmanlar", "Pozisyonlar", "İzin Yönetimi", "Özlük Dosyası", "Disiplin", "Performans"],
    status: "active",
  },
  {
    name: "İş Sağlığı & Güvenliği",
    icon: Shield,
    href: "/isg",
    color: "bg-red-600",
    description: "İSG eğitim, muayene ve KKD takibi",
    features: ["Eğitimler", "Sertifikalar", "Periyodik Muayene", "KKD Takibi", "İş Kazaları", "Uyarı Paneli"],
    status: "active",
  },
  {
    name: "Organizasyon",
    icon: Network,
    href: "/organizasyon",
    color: "bg-violet-600",
    description: "Organizasyon şeması ve firma profili",
    features: ["Org. Şeması", "Firma Profili", "İletişim Dizini", "Yönetim Zinciri", "Departman İstatistikleri"],
    status: "active",
  },
  {
    name: "Hakediş Yönetimi",
    icon: Receipt,
    href: "/hakedis",
    color: "bg-amber-600",
    description: "İşveren ve taşeron hakediş takibi",
    features: ["İşveren Hakedişi", "Taşeron Hakedişi", "Sözleşmeler", "Keşif Yükleme", "İş Kalemleri", "Kesintiler", "Hakediş Özet"],
    status: "active",
  },
  {
    name: "Yatırım & GYO",
    icon: TrendingUp,
    href: "/yatirim",
    color: "bg-emerald-600",
    description: "Yatırım portföy ve fizibilite",
    features: ["Proje fizibilite", "ROI analizi", "Yatırım takip", "Portföy", "Satış takibi", "Tahsilat planı", "Nakit projeksiyonu"],
    status: "active",
  },
  {
    name: "CRM & Müşteri",
    icon: MessageSquare,
    href: "/crm",
    color: "bg-pink-500",
    description: "Müşteri ilişkileri yönetimi",
    features: ["Müşteri kartı", "Fırsat kaydı", "Pipeline", "İletişim geçmişi", "Kişi yönetimi", "Takip hatırlatma"],
    status: "active",
  },
  {
    name: "Duyurular",
    icon: Megaphone,
    href: "/duyurular",
    color: "bg-sky-500",
    description: "Şirket duyuru ve bildirim yönetimi",
    features: ["Duyuru oluşturma", "Kategori yönetimi", "Öncelik seviyeleri", "Hedef kitle", "Okunma takibi", "Sabitleme", "Zamanlama"],
    status: "active",
  },
  {
    name: "Maskot AI Asistan",
    icon: Bot,
    href: "/maskot",
    color: "bg-purple-500",
    description: "Sesli AI asistan ile şantiye sohbeti",
    features: ["3 Karakter", "Sesli sohbet", "GPT-4o AI", "Kişilik yönetimi", "Prompt ayarları", "Sohbet geçmişi", "TTS & STT"],
    status: "active",
  },
  {
    name: "Sunum Ekranı",
    icon: Monitor,
    href: "/sunum",
    color: "bg-teal-500",
    description: "Mimari render ve sunum gösterimi",
    features: ["Slayt gösterisi", "Izgara görünüm", "TV modu", "Resim yükleme", "Otomatik geçiş"],
    status: "active",
  },
  {
    name: "Toplantı Tutanakları",
    icon: ClipboardCheck,
    href: "/toplanti-tutanaklari",
    color: "bg-lime-600",
    description: "Haftalık toplantı tutanağı ve takibi",
    features: ["Dinamik tablo", "Checklist", "Yorum sistemi", "Katılımcı takibi", "Toplantı türleri", "İlerleme takibi", "Sütun ekleme"],
    status: "active",
  },
  {
    name: "Doküman Yönetimi",
    icon: FolderOpen,
    href: "#",
    color: "bg-teal-600",
    description: "Dosya ve belge arşivleme",
    features: ["Dosya arşiv", "Versiyon", "Klasör yapısı", "Paylaşım", "Yetki bazlı erişim", "Şablon", "İmzalı belge takibi"],
    status: "soon",
  },
  {
    name: "AI & Analitik",
    icon: Brain,
    href: "#",
    color: "bg-purple-600",
    description: "Yapay zekâ destekli analizler",
    features: ["Gecikme tahmini", "Maliyet sapma tahmini", "Nakit tükenme tahmini", "Risk skoru", "Anomali tespiti", "Akıllı rapor önerisi"],
    status: "soon",
  },
  {
    name: "Çalışan İndirimleri",
    icon: Tag,
    href: "/indirimler",
    color: "bg-rose-500",
    description: "Partner firmalardan çalışan indirimleri",
    features: ["Firma anlaşmaları", "Kategori yönetimi", "İndirim oranları", "Geçerlilik takibi", "Aktif/Pasif", "İletişim bilgileri"],
    status: "active",
  },
  {
    name: "Kullanıcı Yönetimi",
    icon: Users,
    href: "/kullanicilar",
    color: "bg-indigo-600",
    description: "Sistem hesapları ve İK çalışan bağlantısı",
    features: ["Hesap oluşturma", "Rol atama", "İK bağlantısı", "Aktif/Pasif", "5 Rol seviyesi", "Son giriş takibi"],
    status: "active",
  },
  {
    name: "Rol & Yetki Yönetimi",
    icon: Lock,
    href: "#",
    color: "bg-slate-600",
    description: "İzin matrisi ve erişim kontrolü",
    features: ["Rol tanımlama", "Yetki matrisi", "Modül bazlı erişim", "Proje bazlı erişim", "Firma bazlı erişim", "Onay yetkileri", "Log kayıtları"],
    status: "soon",
  },
  {
    name: "Workflow & Bildirim",
    icon: Bell,
    href: "#",
    color: "bg-yellow-600",
    description: "Süreç ve onay otomasyonu",
    features: ["Onay akışı", "Koşullu yönlendirme", "Otomatik tetikleyici", "Mail bildirimi", "Uygulama içi bildirim", "SLA takibi", "Hatırlatma sistemi"],
    status: "soon",
  },
  {
    name: "Entegrasyon Merkezi",
    icon: Plug,
    href: "#",
    color: "bg-gray-600",
    description: "Dış sistem bağlantıları",
    features: ["API erişimi", "ERP entegrasyonu", "Muhasebe entegrasyonu", "E-fatura", "E-imza", "Banka entegrasyonu", "BIM veri aktarımı", "Veri dışa aktarım"],
    status: "soon",
  },
];

/* ── Classic Components ── */

function ClassicKpiCard({ icon: Icon, value, label, color }: { icon: React.ElementType; value: number; label: string; color: string }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color} text-white shrink-0`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value.toLocaleString("tr-TR")}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ClassicModuleCard({ mod }: { mod: ClassicModule }) {
  const Icon = mod.icon;
  const isActive = mod.status === "active";
  const Wrapper = isActive ? Link : "div";
  const wrapperProps = isActive ? { href: mod.href } : {};

  return (
    <Wrapper {...(wrapperProps as any)} className="block group">
      <Card className={`h-full transition-all duration-200 border-muted ${isActive ? "hover:shadow-lg hover:scale-[1.01]" : "opacity-75"}`}>
        <CardContent className="pt-5 pb-4 px-5">
          <div className="flex items-start justify-between mb-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${mod.color} text-white shadow-sm`}>
              <Icon className="h-5 w-5" />
            </div>
            <Badge
              variant="secondary"
              className={`text-[10px] ${
                isActive
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
                  : "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800"
              }`}
            >
              {isActive ? "AKTİF" : "YAKINDA"}
            </Badge>
          </div>
          <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{mod.name}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">{mod.description}</p>
          <div className="flex flex-wrap gap-1 mb-3">
            {mod.features.map((f) => (
              <span key={f} className="inline-block px-1.5 py-0.5 rounded text-[9px] bg-muted text-muted-foreground font-medium">
                {f}
              </span>
            ))}
          </div>
          {isActive && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground/60 group-hover:text-primary transition-colors pt-1 border-t">
              Modüle Git <ChevronRight className="h-3 w-3" />
            </div>
          )}
        </CardContent>
      </Card>
    </Wrapper>
  );
}

function statusLabel(s: string) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    NOT_STARTED: { label: "Başlamadı", variant: "secondary" },
    IN_PROGRESS: { label: "Devam Ediyor", variant: "default" },
    COMPLETED: { label: "Tamamlandı", variant: "outline" },
    DELAYED: { label: "Gecikmiş", variant: "destructive" },
  };
  return map[s] || { label: s, variant: "secondary" as const };
}

/* ───── Duyuru Widget (Anasayfa) ───── */
function AnnouncementWidget() {
  const [announcements, setAnnouncements] = useState<{
    id: string;
    title: string;
    content: string;
    priority: string;
    isPinned: boolean;
    publishDate: string;
    category: { name: string; color: string };
  }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/duyurular?limit=5")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.announcements) setAnnouncements(data.announcements);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Yükleniyor...
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-30" />
        Henüz duyuru yok
      </div>
    );
  }

  const priorityDot: Record<string, string> = {
    NORMAL: "bg-blue-500",
    IMPORTANT: "bg-orange-500",
    URGENT: "bg-red-500",
  };

  return (
    <div className="divide-y">
      {announcements.map((ann) => (
        <Link key={ann.id} href="/duyurular" className="block p-3 hover:bg-muted/40 transition-colors">
          <div className="flex items-start gap-2">
            <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${priorityDot[ann.priority] || "bg-blue-500"}`} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                {ann.isPinned && <span className="text-[10px]">📌</span>}
                <p className="text-xs font-semibold leading-tight truncate">{ann.title}</p>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-1">{ann.content}</p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="text-[9px] px-1 py-0 rounded border"
                  style={{ borderColor: ann.category.color, color: ann.category.color }}
                >
                  {ann.category.name}
                </span>
                <p className="text-[10px] text-muted-foreground/60">
                  {new Date(ann.publishDate).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ───── Çalışan İndirimleri Widget ───── */
const CATEGORY_ICONS: Record<string, typeof Tag> = {
  "Gıda": Utensils,
  "Giyim": Shirt,
  "Teknoloji": Smartphone,
  "Hediye": Gift,
  "Diğer": Store,
};

const CATEGORY_COLORS: Record<string, string> = {
  "Gıda": "bg-orange-500",
  "Giyim": "bg-pink-500",
  "Teknoloji": "bg-blue-500",
  "Hediye": "bg-purple-500",
  "Diğer": "bg-gray-500",
};

interface Discount {
  id: string;
  companyName: string;
  category: string;
  discountRate: number;
  description: string | null;
  logo: string | null;
  contactInfo: string | null;
  validUntil: string | null;
  isActive: boolean;
}

function DiscountWidget() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/indirimler?active=true")
      .then((r) => {
        if (!r.ok) throw new Error("API error");
        return r.json();
      })
      .then((data) => setDiscounts(Array.isArray(data) ? data : []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Tag className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Çalışan İndirimleri</h2>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse w-[180px] sm:w-[200px] shrink-0">
              <CardContent className="p-4 h-32" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (discounts.length === 0 && !error) {
    return null;
  }

  if (error) {
    return null;
  }

  // Kategoriye göre grupla
  const categories = [...new Set(discounts.map((d) => d.category))];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Çalışan İndirimleri</h2>
          <Badge variant="secondary" className="text-[10px]">{discounts.length} Anlaşma</Badge>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {categories.map((cat) => {
            const CatIcon = CATEGORY_ICONS[cat] || Tag;
            return (
              <Badge key={cat} variant="outline" className="text-[10px] gap-1">
                <CatIcon className="h-3 w-3" />
                {cat}
              </Badge>
            );
          })}
        </div>
      </div>
      <div className="relative">
        <div className="discount-scroll overflow-x-auto -mx-4 px-4 sm:-mx-6 sm:px-6 pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
          <style>{`.discount-scroll::-webkit-scrollbar { display: none; }`}</style>
          <div className="flex gap-3" style={{ minWidth: "max-content" }}>
            {discounts.map((d) => {
              const CatIcon = CATEGORY_ICONS[d.category] || Tag;
              const catColor = CATEGORY_COLORS[d.category] || "bg-gray-500";
              return (
                <Card key={d.id} className="group hover:shadow-md transition-all hover:scale-[1.02] relative overflow-hidden w-[180px] sm:w-[200px] shrink-0">
                {/* İndirim rozeti */}
                <div className="absolute top-2 right-2 z-10">
                  <div className="flex items-center gap-0.5 bg-red-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                    <Percent className="h-3 w-3" />
                    {d.discountRate}
                  </div>
                </div>
                <CardContent className="p-4 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${catColor} text-white shadow-sm shrink-0`}>
                      <CatIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight truncate group-hover:text-primary transition-colors">{d.companyName}</p>
                      <p className="text-[10px] text-muted-foreground">{d.category}</p>
                    </div>
                  </div>
                  {d.description && (
                    <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{d.description}</p>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-auto pt-1 border-t">
                    {d.contactInfo ? (
                      <span className="truncate">{d.contactInfo}</span>
                    ) : (
                      <span></span>
                    )}
                    {d.validUntil && (
                      <span className="shrink-0">
                        {new Date(d.validUntil).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}&apos;e kadar
                      </span>
                    )}
                  </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
        {/* Sağ tarafta fade efekti - kaydırılabilirlik göstergesi */}
        <div className="absolute right-0 top-0 bottom-1 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

function ClassicView({ userName, userEmail, userRole, kpiData, recentActivities }: AnasayfaProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Günaydın" : hour < 18 ? "İyi günler" : "İyi akşamlar";
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <HardHat className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold tracking-tight">Şantiye360</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium">{userName}</p>
              <p className="text-[10px] text-muted-foreground">{userEmail}</p>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs font-semibold">{userName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <Link href="/ayarlar" className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Ayarlar">
              <Settings className="h-4 w-4" />
            </Link>
            <button onClick={() => signOut({ redirectTo: "/giris" })} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Çıkış Yap">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{greeting}, {userName.split(" ")[0]}! 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">Şantiye360 platformuna hoş geldiniz. İşte güncel durumunuz.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <ClassicKpiCard icon={FolderKanban} value={kpiData.activeProjects} label="Aktif Proje" color="bg-blue-500" />
          <ClassicKpiCard icon={HardHat} value={kpiData.totalWorkers} label="Toplam Çalışan" color="bg-emerald-500" />
          <ClassicKpiCard icon={Calendar} value={kpiData.todayAttendance} label="Bugün Devam" color="bg-amber-500" />
          <ClassicKpiCard icon={CheckCircle2} value={kpiData.pendingApprovals} label="Bekleyen Onay" color="bg-purple-500" />
        </div>

        {/* === ÇALIŞAN İNDİRİMLERİ === */}
        <DiscountWidget />

        {/* === KORUNAN ALAN: Modüller + Hızlı Erişim + Aktiviteler === */}
        <div className="relative">
          {!isSuperAdmin && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-background/60 backdrop-blur-[2px]">
              <div className="flex flex-col items-center gap-3 p-8 rounded-2xl bg-card border shadow-2xl text-center max-w-sm mx-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold">Geliştirme Aşamasında</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Modüller şu anda geliştirme aşamasındadır. Sadece yetkili yöneticiler erişebilir.
                </p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 mt-1">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Süper Admin yetkisi gerekli</span>
                </div>
              </div>
            </div>
          )}
          <div className={!isSuperAdmin ? "pointer-events-none select-none filter blur-[6px] opacity-50" : undefined}>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Modüller</h2>
            <span className="text-xs text-muted-foreground ml-auto">
              {classicModules.filter((m) => m.status === "active").length} Aktif · {classicModules.filter((m) => m.status === "soon").length} Yakında
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {classicModules.map((mod) => (
              <ClassicModuleCard key={mod.name} mod={mod} />
            ))}
          </div>
        </div>

        {/* Hızlı Erişim + Duyurular — yan yana */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hızlı Erişim */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Hızlı Erişim</h2>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {[
                { name: "Yönetici Paneli", icon: LayoutDashboard, href: "/yonetim-paneli", color: "bg-orange-500" },
                { name: "Projeler", icon: FolderKanban, href: "/projeler", color: "bg-blue-600" },
                { name: "Aktiviteler", icon: Activity, href: "/aktiviteler", color: "bg-green-500" },
                { name: "Mahaller", icon: MapPin, href: "/mahaller", color: "bg-emerald-500" },
                { name: "Katlar", icon: Layers, href: "/katlar", color: "bg-teal-500" },
                { name: "Onaylar", icon: CheckCircle2, href: "/onaylar", color: "bg-amber-500" },
                { name: "Riskler", icon: AlertTriangle, href: "/riskler", color: "bg-red-500" },
                { name: "Hakediş", icon: FileText, href: "/hakedis", color: "bg-purple-500" },
                { name: "Malzemeler", icon: Package, href: "/malzemeler", color: "bg-violet-500" },
                { name: "Puantaj", icon: ClipboardList, href: "/puantaj", color: "bg-fuchsia-500" },
              ].map((item) => {
                const QIcon = item.icon;
                return (
                  <Link key={item.name} href={item.href} className="group">
                    <Card className="hover:shadow-md transition-all hover:scale-[1.03]">
                      <CardContent className="flex flex-col items-center justify-center py-4 px-2 gap-2">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color} text-white shadow-sm group-hover:shadow-md transition-shadow`}>
                          <QIcon className="h-5 w-5" />
                        </div>
                        <span className="text-[11px] font-medium text-center leading-tight text-muted-foreground group-hover:text-foreground transition-colors">{item.name}</span>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Duyurular */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Duyurular</h2>
              </div>
              <Link href="/duyurular" className="text-xs text-primary hover:underline flex items-center gap-1">
                Tümünü Gör <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <Card className="h-[calc(100%-2.25rem)]">
              <CardContent className="p-0">
                <AnnouncementWidget />
              </CardContent>
            </Card>
          </div>
        </div>

        {recentActivities.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Son Aktiviteler</h2>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {recentActivities.map((act) => {
                    const st = statusLabel(act.status);
                    return (
                      <div key={act.id} className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                            <Activity className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{act.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{act.projectName} • {act.disciplineName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          <Badge variant={st.variant} className="text-[10px]">{st.label}</Badge>
                          <div className="hidden sm:flex items-center gap-1.5 w-24">
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${act.progressPercent}%` }} />
                            </div>
                            <span className="text-[10px] text-muted-foreground w-7 text-right">%{act.progressPercent}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

          </div>{/* blur wrapper end */}
        </div>{/* relative wrapper end */}

        <div className="text-center py-4 text-xs text-muted-foreground">
          © 2026 AIWorks Lab — Created by <span className="font-medium">Seyfullah SEPET</span>
        </div>
      </main>
    </div>
  );
}

/* ╔══════════════════════════════════════════════════════════╗
   ║          AI SİNEMATİK GÖRÜNÜM                            ║
   ╚══════════════════════════════════════════════════════════╝ */

const aiSections = [
  {
    id: "command",
    title: "KOMUTA MERKEZİ",
    subtitle: "Stratejik karar ve portföy yönetimi",
    color: "from-blue-500 to-cyan-500",
    dotColor: "bg-blue-500",
    modules: [
      { key: "yonetim-paneli", name: "Yönetici Paneli", tagline: "Tüm projeler, tek ekran. Gerçek zamanlı karar destek sistemi.", icon: LayoutDashboard, href: "/yonetim-paneli", active: true, gradient: "from-orange-500 to-amber-500", bg: "bg-orange-500/10", text: "text-orange-500" },
      { key: "proje-yonetimi", name: "Proje Yönetimi", tagline: "Bütçe, süre, ilerleme — her projenin dijital nabzı elinizde.", icon: FolderKanban, href: "/projeler", active: true, gradient: "from-blue-500 to-indigo-500", bg: "bg-blue-500/10", text: "text-blue-500" },
    ],
  },
  {
    id: "field",
    title: "SAHA İSTİHBARATI",
    subtitle: "Sahadan anlık veri akışı ve izleme",
    color: "from-emerald-500 to-teal-500",
    dotColor: "bg-emerald-500",
    modules: [
      { key: "mahaller", name: "Akıllı Mekan Haritası", tagline: "Her mahal bir sensör. Metrekare bazlı iş takibi, sapma analizi.", icon: MapPin, href: "/mahaller", active: true, gradient: "from-emerald-500 to-green-500", bg: "bg-emerald-500/10", text: "text-emerald-500" },
      { key: "katlar", name: "Dikey İnşaat Takibi", tagline: "Kat kat yükselen ilerleme. Tamamlanma yüzdeleri canlı güncellenir.", icon: Layers, href: "/katlar", active: true, gradient: "from-teal-500 to-cyan-500", bg: "bg-teal-500/10", text: "text-teal-500" },
      { key: "aktiviteler", name: "Canlı Aktivite Radarı", tagline: "İş kalemleri anlık izlenir. Gecikmeler oluşmadan tespit edilir.", icon: Activity, href: "/aktiviteler", active: true, gradient: "from-green-500 to-lime-500", bg: "bg-green-500/10", text: "text-green-500" },
    ],
  },
  {
    id: "decision",
    title: "AKILLI KARAR SİSTEMİ",
    subtitle: "Veri odaklı karar mekanizması",
    color: "from-amber-500 to-yellow-500",
    dotColor: "bg-amber-500",
    modules: [
      { key: "onaylar", name: "Dijital Onay Merkezi", tagline: "Kağıtsız, anlık, izlenebilir. Her onay dijital kayıt altında.", icon: CheckCircle2, href: "/onaylar", active: true, gradient: "from-amber-500 to-orange-500", bg: "bg-amber-500/10", text: "text-amber-500" },
      { key: "riskler", name: "Proaktif Risk Radarı", tagline: "Riskler oluşmadan uyarır. Etki × Olasılık matrisiyle önceliklendirme.", icon: AlertTriangle, href: "/riskler", active: true, gradient: "from-red-500 to-rose-500", bg: "bg-red-500/10", text: "text-red-500" },
    ],
  },
  {
    id: "finance",
    title: "FİNANSAL KONTROL",
    subtitle: "Hakediş, malzeme ve maliyet yönetimi",
    color: "from-purple-500 to-violet-500",
    dotColor: "bg-purple-500",
    modules: [
      { key: "hakedis", name: "Hakediş Motoru", tagline: "Otomatik metraj hesabı, kesinti yönetimi. Her kuruş dijital kayıtta.", icon: FileText, href: "/hakedis", active: true, gradient: "from-purple-500 to-fuchsia-500", bg: "bg-purple-500/10", text: "text-purple-500" },
      { key: "malzemeler", name: "Malzeme Tedarik Zekası", tagline: "Stok, sipariş, teslimat. Tedarik zinciri uçtan uca kontrolde.", icon: Package, href: "/malzemeler", active: true, gradient: "from-violet-500 to-purple-500", bg: "bg-violet-500/10", text: "text-violet-500" },
    ],
  },
  {
    id: "meetings",
    title: "TOPLANTI MERKEZİ",
    subtitle: "Haftalık toplantı ve karar takibi",
    color: "from-lime-500 to-green-500",
    dotColor: "bg-lime-500",
    modules: [
      { key: "toplanti-tutanaklari", name: "Toplantı Tutanakları", tagline: "Her karar kayıt altında. Dinamik tablolarla toplantı yönetimi.", icon: ClipboardCheck, href: "/toplanti-tutanaklari", active: true, gradient: "from-lime-500 to-green-500", bg: "bg-lime-500/10", text: "text-lime-500" },
    ],
  },
  {
    id: "hr",
    title: "İNSAN KAYNAĞI",
    subtitle: "Sahadan dijital personel yönetimi",
    color: "from-rose-500 to-pink-500",
    dotColor: "bg-rose-500",
    modules: [
      { key: "sirketler-ekipler", name: "Taşeron Ekosistemi", tagline: "Tüm taşeronlar, ekipleri, performansları — tek platformda.", icon: Building2, href: "/sirketler", active: true, gradient: "from-rose-500 to-pink-500", bg: "bg-rose-500/10", text: "text-rose-500" },
      { key: "calisanlar", name: "Saha Personel Yönetimi", tagline: "Kim, nerede, ne yapıyor? Sahadan anlık personel görünürlüğü.", icon: Users, href: "/calisanlar", active: true, gradient: "from-pink-500 to-rose-500", bg: "bg-pink-500/10", text: "text-pink-500" },
      { key: "puantaj", name: "Dijital Puantaj", tagline: "Kağıt puantaj devri bitti. Günlük devam, hakedişe otomatik aktarım.", icon: ClipboardList, href: "/puantaj", active: true, gradient: "from-fuchsia-500 to-pink-500", bg: "bg-fuchsia-500/10", text: "text-fuchsia-500" },
    ],
  },
];

/* ── Shared Utility Hooks ── */

function useTypingEffect(text: string, speed = 30, startDelay = 0) {
  const [displayed, setDisplayed] = useState("");
  const [isDone, setIsDone] = useState(false);
  useEffect(() => {
    if (!text) { setDisplayed(""); setIsDone(false); return; }
    setDisplayed(""); setIsDone(false);
    const delayTimer = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) { setDisplayed(text.slice(0, i + 1)); i++; }
        else { setIsDone(true); clearInterval(interval); }
      }, speed);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(delayTimer);
  }, [text, speed, startDelay]);
  return { displayed, isDone };
}

function AnimatedCounter({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (value === 0) { setCount(0); return; }
    let start = 0;
    const step = Math.max(1, Math.ceil(value / (duration / 16)));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setCount(value); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <span>{count.toLocaleString("tr-TR")}</span>;
}

/* ── AI Sub-Components ── */

function KpiPill({ icon: Icon, value, label, gradient, delay }: { icon: React.ElementType; value: number; label: string; gradient: string; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay }}>
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 hover:bg-white/10 transition-colors">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} />
        <div className="relative flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white"><AnimatedCounter value={value} /></p>
            <p className="text-xs text-white/60">{label}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AIModuleCard({ mod, aiText, index }: { mod: (typeof aiSections)[number]["modules"][number]; aiText?: string; index: number }) {
  const Icon = mod.icon;
  const aiDelay = (index * 0.15 + 0.8) * 1000;
  const { displayed: aiDisplayed } = useTypingEffect(aiText || "", 25, aiDelay);
  return (
    <motion.div initial={{ opacity: 0, y: 30, filter: "blur(10px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6, delay: index * 0.15 }}>
      <Link href={mod.href} className="block group">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.08] transition-all duration-300 hover:border-white/20 hover:shadow-2xl hover:shadow-white/5">
          <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${mod.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${mod.bg} backdrop-blur-sm`}>
                <Icon className={`h-6 w-6 ${mod.text}`} />
              </div>
              {mod.active && (
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />AKTİF
                </span>
              )}
            </div>
            <h3 className="text-white font-semibold text-base mb-1 group-hover:text-white/90">{mod.name}</h3>
            <p className="text-white/40 text-xs leading-relaxed mb-3">{mod.tagline}</p>
            {aiText && (
              <div className="relative mt-3 pt-3 border-t border-white/5">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-violet-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-violet-300/80 leading-relaxed min-h-[2.5em]">
                    {aiDisplayed}
                    {aiDisplayed.length < (aiText?.length || 0) && <span className="inline-block w-[2px] h-3 bg-violet-400 ml-0.5 animate-pulse" />}
                  </p>
                </div>
              </div>
            )}
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-white/30 group-hover:text-white/70 transition-colors">
              Keşfet <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function PresentationSection({ section, aiModules, sectionIndex }: { section: (typeof aiSections)[number]; aiModules: Record<string, string>; sectionIndex: number }) {
  return (
    <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.8 }} className="relative">
      <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="flex items-center gap-3 mb-6">
        <div className={`w-2 h-2 rounded-full ${section.dotColor}`} />
        <div>
          <h2 className={`text-xs font-bold tracking-[0.2em] bg-gradient-to-r ${section.color} bg-clip-text text-transparent`}>BÖLÜM {sectionIndex + 1} — {section.title}</h2>
          <p className="text-white/30 text-xs mt-0.5">{section.subtitle}</p>
        </div>
      </motion.div>
      <div className={`grid gap-4 ${section.modules.length === 3 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
        {section.modules.map((mod, idx) => (
          <AIModuleCard key={mod.key} mod={mod} aiText={aiModules[mod.key]} index={idx} />
        ))}
      </div>
    </motion.section>
  );
}

/* ── AI View ── */

function AIView({ userName, userEmail, userRole, kpiData }: AnasayfaProps) {
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const [aiData, setAiData] = useState<AIData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const firstName = userName.split(" ")[0];
  const hasFetched = useRef(false);

  const fetchAI = useCallback(async () => {
    if (hasFetched.current || !isSuperAdmin) return;
    hasFetched.current = true;
    try {
      const res = await fetch("/api/ai/dashboard-summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userName }) });
      const json = await res.json();
      if (json.success) { setAiData(json.data); setStats(json.stats); }
    } catch (err) { console.error("AI fetch error:", err); }
    finally { setAiLoading(false); }
  }, [userName]);

  useEffect(() => { fetchAI(); const t = setTimeout(() => setShowContent(true), 600); return () => clearTimeout(t); }, [fetchAI]);

  const greetingText = aiData?.greeting || `Hoş geldiniz, ${firstName}. Şantiye360 platformu hazır.`;
  const { displayed: greetingDisplayed } = useTypingEffect(showContent ? greetingText : "", 20, 500);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-blue-500/[0.03] blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-500/[0.03] blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-cyan-500/[0.02] blur-[150px]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl flex h-14 items-center justify-between px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20"><HardHat className="h-4 w-4 text-white" /></div>
            <div><span className="text-sm font-bold tracking-tight">Şantiye360</span><span className="hidden sm:inline text-[9px] text-white/30 ml-1.5 font-medium tracking-wider">CONSTRUCTION OS</span></div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="flex items-center gap-3">
            {aiLoading && (<div className="flex items-center gap-1.5 text-[10px] text-violet-400 mr-2"><Bot className="h-3 w-3 animate-pulse" /><span className="hidden sm:inline">AI analiz ediyor...</span></div>)}
            <div className="hidden sm:block text-right"><p className="text-xs font-medium text-white/80">{userName}</p><p className="text-[10px] text-white/30">{userEmail}</p></div>
            <Avatar className="h-8 w-8 border border-white/10"><AvatarFallback className="bg-white/5 text-white/60 text-xs font-semibold">{userName.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
            <button onClick={() => signOut({ redirectTo: "/giris" })} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-white/80" title="Çıkış Yap"><LogOut className="h-4 w-4" /></button>
          </motion.div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12 space-y-16">
        {!isSuperAdmin ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4 p-10 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm text-center max-w-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10">
                <Lock className="h-8 w-8 text-violet-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Geliştirme Aşamasında</h3>
              <p className="text-sm text-white/40 leading-relaxed">
                AI Sunum modu şu anda geliştirme aşamasındadır. Sadece yetkili yöneticiler erişebilir.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-white/25 mt-1">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Süper Admin yetkisi gerekli</span>
              </div>
            </div>
          </div>
        ) : (
        <>
        <AnimatePresence>
          {showContent && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-6 sm:p-8 mb-8">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
                <div className="flex items-start gap-3 mb-4">
                  <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }} className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20"><Bot className="h-5 w-5 text-white" /></motion.div>
                  <div>
                    <div className="flex items-center gap-2"><span className="text-sm font-semibold text-white/90">AI Danışman</span><Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[9px] font-semibold">GPT-4o</Badge></div>
                    <p className="text-[10px] text-white/30 mt-0.5">Gerçek zamanlı veri analizi</p>
                  </div>
                </div>
                <div className="min-h-[3em]">
                  <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                    {greetingDisplayed}
                    {greetingDisplayed.length < greetingText.length && <span className="inline-block w-[2px] h-4 bg-violet-400 ml-1 animate-pulse" />}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiPill icon={FolderKanban} value={stats?.activeProjects ?? kpiData.activeProjects} label="Aktif Proje" gradient="from-blue-500 to-cyan-500" delay={1.0} />
                <KpiPill icon={HardHat} value={stats?.totalWorkers ?? kpiData.totalWorkers} label="Toplam Çalışan" gradient="from-emerald-500 to-teal-500" delay={1.2} />
                <KpiPill icon={Activity} value={stats?.totalActivities ?? 0} label="Toplam Aktivite" gradient="from-amber-500 to-orange-500" delay={1.4} />
                <KpiPill icon={Shield} value={stats?.highRisks ?? 0} label="Yüksek Risk" gradient="from-red-500 to-rose-500" delay={1.6} />
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {showContent && aiSections.map((section, idx) => (
          <PresentationSection key={section.id} section={section} aiModules={aiData?.modules || {}} sectionIndex={idx} />
        ))}

        {showContent && (
          <motion.section initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="relative">
            <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5 backdrop-blur-sm">
              <div className="absolute inset-0"><div className="absolute top-0 left-1/4 w-[300px] h-[300px] rounded-full bg-violet-500/10 blur-[100px]" /><div className="absolute bottom-0 right-1/4 w-[200px] h-[200px] rounded-full bg-purple-500/10 blur-[80px]" /></div>
              <div className="relative p-8 sm:p-12 text-center">
                <motion.div animate={{ boxShadow: ["0 0 20px rgba(139,92,246,0.2)", "0 0 40px rgba(139,92,246,0.4)", "0 0 20px rgba(139,92,246,0.2)"] }} transition={{ duration: 2, repeat: Infinity }} className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 mb-6"><Sparkles className="h-8 w-8 text-white" /></motion.div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Yapay Zeka Katmanı</h3>
                <p className="text-white/40 text-sm max-w-md mx-auto mb-6">Verilerinizi okur, öngörüler sunar, kararlarınızı hızlandırır.<br />7/24 dijital danışman.</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {["Gecikme Tahmini", "Maliyet Sapma Analizi", "Risk Skoru", "Anomali Tespiti", "Akıllı Raporlama"].map((feat, i) => (
                    <motion.span key={feat} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300"><Zap className="h-3 w-3" />{feat}</motion.span>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {showContent && (
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1 }} className="text-center pb-8">
            <p className="text-white/20 text-xs mb-3">Tüm veriler gerçek zamanlı.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/yonetim-paneli"><motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-shadow"><BarChart3 className="h-4 w-4" />Yönetici Paneline Git</motion.button></Link>
              <Link href="/projeler"><motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white/80 text-sm font-medium hover:bg-white/10 transition-colors"><FolderKanban className="h-4 w-4" />Proje Yönetimine Git</motion.button></Link>
            </div>
          </motion.div>
        )}
        </>
        )}
      </main>

      <footer className="border-t border-white/5 py-6 text-center text-[11px] text-white/20">
        <p>© 2026 AIWorks Lab — Created by <span className="text-white/40 font-medium">Seyfullah SEPET</span></p>
      </footer>
    </div>
  );
}

/* ╔══════════════════════════════════════════════════════════╗
   ║       TOGGLE + ANA BİLEŞEN                               ║
   ╚══════════════════════════════════════════════════════════╝ */

function ViewToggle({ mode, onChange }: { mode: "classic" | "ai"; onChange: (m: "classic" | "ai") => void }) {
  return (
    <div className="fixed top-[60px] left-1/2 -translate-x-1/2 z-[60]">
      <div className="flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50">
        <button onClick={() => onChange("classic")} className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-all duration-300 ${mode === "classic" ? "bg-white text-black shadow-lg" : "text-white/50 hover:text-white/80"}`}>
          <Monitor className="h-3 w-3 sm:h-3.5 sm:w-3.5" />Klasik
        </button>
        <button onClick={() => onChange("ai")} className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-all duration-300 ${mode === "ai" ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30" : "text-white/50 hover:text-white/80"}`}>
          <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />AI Sunum
        </button>
      </div>
    </div>
  );
}

function AnasayfaContent(props: AnasayfaProps) {
  const [viewMode, setViewMode] = useState<"classic" | "ai">("classic");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("santiye360-view") as "classic" | "ai" | null;
    if (saved) setViewMode(saved);
    setMounted(true);
  }, []);

  const handleViewChange = (mode: "classic" | "ai") => {
    setViewMode(mode);
    localStorage.setItem("santiye360-view", mode);
  };

  /* mounted olmasa bile ClassicView render edilir — 
     böylece server HTML ile client ilk render eşleşir, 
     boş ekran (flash) yaşanmaz */
  return (
    <>
      {mounted && <ViewToggle mode={viewMode} onChange={handleViewChange} />}
      {viewMode === "classic" || !mounted ? (
        <ClassicView {...props} />
      ) : (
        <AIView {...props} />
      )}
    </>
  );
}

export function AnasayfaClient(props: AnasayfaProps) {
  return (
    <SessionProvider>
      <AnasayfaContent {...props} />
    </SessionProvider>
  );
}
