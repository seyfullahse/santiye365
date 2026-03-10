"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Building2,
  Users,
  Banknote,
  ShieldAlert,
  HardHat,
  Package,
  Brain,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  CircleDot,
  Timer,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  BarChart3,
  Lightbulb,
  Target,
  Truck,
  CalendarDays,
  Home,
  FolderKanban,
  Gavel,
  Wallet,
  ShoppingCart,
  FileText,
  Sparkles,
  Shield,
  Bell,
  Link2,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* ═══════════════════════════════════════════════════════════════
   HEADER NAV — Modüller
   ═══════════════════════════════════════════════════════════════ */

const headerModules = [
  { name: "Ana Sayfa", href: "/", icon: Home, active: true },
  { name: "Proje Yönetimi", href: "/dashboard", icon: FolderKanban, active: true },
  { name: "İhale & Teklif", href: "#", icon: Gavel, active: false },
  { name: "Taşeron", href: "#", icon: HardHat, active: false },
  { name: "Finans & Bütçe", href: "#", icon: Wallet, active: false },
  { name: "Satınalma", href: "#", icon: ShoppingCart, active: false },
  { name: "İnsan Kaynakları", href: "#", icon: Users, active: false },
  { name: "AI & Analitik", href: "#", icon: Sparkles, active: false },
];

/* ═══════════════════════════════════════════════════════════════
   MOCK DATA — Gerçekçi Türk inşaat sektörü verileri
   ═══════════════════════════════════════════════════════════════ */

const executiveKpis = [
  {
    label: "Aktif Proje",
    value: "8",
    subtext: "2 büyük ölçekli",
    trend: "up" as const,
    trendValue: "+1",
    icon: Building2,
    color: "text-blue-400",
  },
  {
    label: "Toplam İş Hacmi",
    value: "₺2.85B",
    subtext: "Sözleşme bedeli",
    trend: "up" as const,
    trendValue: "+₺520M",
    icon: Banknote,
    color: "text-emerald-400",
  },
  {
    label: "Beklenen Net Kâr",
    value: "₺342M",
    subtext: "%12.0 marj",
    trend: "up" as const,
    trendValue: "+%0.8",
    icon: TrendingUp,
    color: "text-green-400",
  },
  {
    label: "90-Gün Nakit",
    value: "₺128M",
    subtext: "Projeksiyon",
    trend: "down" as const,
    trendValue: "-₺15M",
    icon: Banknote,
    color: "text-amber-400",
  },
  {
    label: "Kritik Risk",
    value: "3",
    subtext: "Aksiyon bekliyor",
    trend: "up" as const,
    trendValue: "+1",
    icon: ShieldAlert,
    color: "text-red-400",
  },
];

/* S-Curve — Planlanan vs Gerçekleşen (kümülatif %) */
const scurveData = [
  { month: "Oca 25", planned: 2, actual: 1.5 },
  { month: "Şub 25", planned: 5, actual: 4 },
  { month: "Mar 25", planned: 10, actual: 8.5 },
  { month: "Nis 25", planned: 17, actual: 15 },
  { month: "May 25", planned: 25, actual: 22 },
  { month: "Haz 25", planned: 34, actual: 30 },
  { month: "Tem 25", planned: 43, actual: 38 },
  { month: "Ağu 25", planned: 52, actual: 46 },
  { month: "Eyl 25", planned: 60, actual: 54 },
  { month: "Eki 25", planned: 67, actual: 60 },
  { month: "Kas 25", planned: 74, actual: 66 },
  { month: "Ara 25", planned: 80, actual: 73 },
  { month: "Oca 26", planned: 86, actual: 78 },
  { month: "Şub 26", planned: 91, actual: 82 },
];

const scurveConfig = {
  planned: { label: "Planlanan", color: "hsl(220 70% 55%)" },
  actual: { label: "Gerçekleşen", color: "hsl(25 95% 55%)" },
} satisfies ChartConfig;

/* Proje Bazlı İlerleme */
const projectData = [
  { name: "Tosyalı Holding Altyapı", planned: 82, actual: 78, budget: 980, color: "#3b82f6" },
  { name: "Koç Özel Okulları Çevre Yolu", planned: 50, actual: 45, budget: 650, color: "#8b5cf6" },
  { name: "Garanti BBVA Renovasyon", planned: 68, actual: 62, budget: 425, color: "#10b981" },
  { name: "Cezayir Büyükelçiliği", planned: 38, actual: 33, budget: 520, color: "#f59e0b" },
  { name: "Kadir Has Üniversitesi", planned: 72, actual: 69, budget: 310, color: "#ef4444" },
  { name: "Ford Otosan Wax", planned: 55, actual: 48, budget: 480, color: "#06b6d4" },
  { name: "Garanti İzmir Bölge Md.", planned: 28, actual: 25, budget: 275, color: "#a855f7" },
  { name: "QNB Finansbank Arşiv", planned: 18, actual: 15, budget: 185, color: "#f97316" },
];

const projectConfig = {
  planned: { label: "Planlanan %", color: "hsl(220 70% 55%)" },
  actual: { label: "Gerçekleşen %", color: "hsl(25 95% 55%)" },
} satisfies ChartConfig;

/* Finansal Özet */
const financials = {
  toplamButce: 2850,
  harcanan: 1680,
  kalan: 1170,
  karMarji: 12.0,
  tahsilat: 1420,
  bpiValue: 0.94,
  spiValue: 0.91,
};

/* Risk Dağılımı */
const riskData = {
  high: 3,
  medium: 5,
  low: 12,
  total: 20,
  criticalItems: [
    { project: "Garanti BBVA Renovasyon", risk: "Malzeme tedarik gecikmesi", impact: "₺2.4M" },
    { project: "Tosyalı Holding Altyapı", risk: "İş gücü yetersizliği", impact: "45 gün" },
    { project: "Cezayir Büyükelçiliği", risk: "Ruhsat süreci uzaması", impact: "₺1.8M" },
  ],
};

/* Personel İstatistikleri */
const personnelData = {
  total: 1247,
  activeOnSite: 1089,
  onLeave: 98,
  sick: 32,
  training: 28,
  turnoverRate: 4.2,
  avgProductivity: 87,
};

const personnelPieData = [
  { name: "Sahada Aktif", value: 1089, color: "#10b981" },
  { name: "İzinli", value: 98, color: "#f59e0b" },
  { name: "Hasta", value: 32, color: "#ef4444" },
  { name: "Eğitimde", value: 28, color: "#3b82f6" },
];

/* Taşeron Performansı — Top 5 */
const contractorPerformance = [
  { name: "Güneş Yapı A.Ş.", field: "Kaba Yapı", score: 92, trend: "up", project: "Tosyalı Holding Altyapı" },
  { name: "Atlas Mekanik", field: "Mekanik Tesisat", score: 87, trend: "up", project: "Koç Özel Okulları Çevre Yolu" },
  { name: "Yıldız Elektrik", field: "Elektrik", score: 84, trend: "stable", project: "Ford Otosan Wax" },
  { name: "Demir Kalıp Ltd.", field: "Kalıp & Demir", score: 79, trend: "down", project: "Garanti BBVA Renovasyon" },
  { name: "Kuzey İnşaat", field: "İnce İşler", score: 76, trend: "up", project: "Cezayir Büyükelçiliği" },
];

/* Satınalma & Stok */
const purchasingData = {
  pendingOrders: 23,
  deliveredThisMonth: 47,
  stockValue: 18.5,
  criticalShortage: 3,
  onTimeDelivery: 89,
};

/* Nakit Akış Trendi */
const cashFlowData = [
  { month: "Eyl", inflow: 180, outflow: 165, net: 15 },
  { month: "Eki", inflow: 210, outflow: 195, net: 15 },
  { month: "Kas", inflow: 195, outflow: 185, net: 10 },
  { month: "Ara", inflow: 160, outflow: 175, net: -15 },
  { month: "Oca", inflow: 220, outflow: 200, net: 20 },
  { month: "Şub", inflow: 190, outflow: 180, net: 10 },
  { month: "Mar*", inflow: 175, outflow: 190, net: -15 },
  { month: "Nis*", inflow: 200, outflow: 210, net: -10 },
  { month: "May*", inflow: 230, outflow: 195, net: 35 },
];

const cashFlowConfig = {
  inflow: { label: "Tahsilat", color: "hsl(142 71% 45%)" },
  outflow: { label: "Ödeme", color: "hsl(0 84% 60%)" },
  net: { label: "Net", color: "hsl(220 70% 55%)" },
} satisfies ChartConfig;

/* 7-Gün Operasyon Feed */
const operationFeed = [
  {
    date: "Bugün",
    time: "14:30",
    event: "Tosyalı Holding — Altyapı beton dökümü tamamlandı",
    type: "success" as const,
    project: "Tosyalı Holding Altyapı",
  },
  {
    date: "Bugün",
    time: "10:15",
    event: "Koç Özel Okulları — Çevre yolu asfalt serimi başladı",
    type: "info" as const,
    project: "Koç Özel Okulları Çevre Yolu",
  },
  {
    date: "Dün",
    time: "16:45",
    event: "Garanti BBVA Renovasyon — Malzeme tedarik gecikmesi bildirimi",
    type: "warning" as const,
    project: "Garanti BBVA Renovasyon",
  },
  {
    date: "Dün",
    time: "09:00",
    event: "Cezayir Büyükelçiliği — İnşaat ruhsatı alındı",
    type: "success" as const,
    project: "Cezayir Büyükelçiliği",
  },
  {
    date: "19 Şub",
    time: "15:20",
    event: "QNB Finansbank Arşiv — Temel kazı %80 tamamlandı",
    type: "info" as const,
    project: "QNB Finansbank Arşiv",
  },
  {
    date: "18 Şub",
    time: "11:30",
    event: "Ford Otosan Wax — Çelik konstrüksiyon montajı onaylandı",
    type: "success" as const,
    project: "Ford Otosan Wax",
  },
  {
    date: "17 Şub",
    time: "14:00",
    event: "Kadir Has Üniversitesi — İSG denetimi başarıyla geçildi",
    type: "success" as const,
    project: "Kadir Has Üniversitesi",
  },
  {
    date: "16 Şub",
    time: "09:45",
    event: "Garanti İzmir Bölge Md. — Zemin etüdü raporu teslim alındı",
    type: "info" as const,
    project: "Garanti İzmir Bölge Md.",
  },
];

/* AI Karar Destek Önerileri */
const aiInsights = [
  {
    severity: "critical" as const,
    title: "Malzeme Tedarik Riski",
    description:
      "Garanti BBVA Renovasyon projesinin malzeme tedarik gecikmesi, 90 gün içinde ₺2.4M ek maliyet riski taşımaktadır. Alternatif tedarikçi değerlendirmesi önerilir.",
    action: "Alternatif tedarikçi teklifi al",
    project: "Garanti BBVA Renovasyon",
  },
  {
    severity: "warning" as const,
    title: "S-Curve Sapması",
    description:
      "Tosyalı Holding Altyapı projesinde S-Curve sapması %9 seviyesinde. Mevcut tempoda tamamlanma tarihi 45 gün uzayabilir. Ek ekip planlaması değerlendirilmeli.",
    action: "İş gücü takviyesi planla",
    project: "Tosyalı Holding Altyapı",
  },
  {
    severity: "warning" as const,
    title: "Nakit Akış Uyarısı",
    description:
      "Nakit akış projeksiyonuna göre Nisan 2026'da ₺15M'lik likidite sıkışması öngörülmektedir. Tahsilat hızlandırma veya kredi limiti artışı önerilir.",
    action: "Tahsilat takibini hızlandır",
    project: "Genel",
  },
  {
    severity: "info" as const,
    title: "Taşeron Performans Fırsatı",
    description:
      "Güneş Yapı A.Ş. art arda 3 aydır en yüksek performansı gösteriyor. Cezayir Büyükelçiliği projesi için de değerlendirilebilir.",
    action: "Kapasite müsaitliği sor",
    project: "Cezayir Büyükelçiliği",
  },
];

/* ═══════════════════════════════════════════════════════════════
   HELPER COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function formatCurrency(value: number, unit: string = "M") {
  return `₺${value}${unit}`;
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function RiskIndicator({
  label,
  count,
  color,
  bgColor,
}: {
  label: string;
  count: number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${bgColor}`}>
      <div className={`w-4 h-4 rounded-full ${color} animate-pulse`} />
      <div className="flex-1">
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-xl font-bold">{count}</span>
    </div>
  );
}

function MiniStatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-bold">{value}</p>
      </div>
    </div>
  );
}

function FeedItem({ item }: { item: (typeof operationFeed)[0] }) {
  const typeStyles = {
    success: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
    info: { icon: Activity, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
    error: { icon: XCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30" },
  };
  const style = typeStyles[item.type] || typeStyles.info;
  const Icon = style.icon;

  return (
    <div className="flex gap-3 py-3 border-b last:border-0">
      <div className={`p-1.5 rounded-lg ${style.bg} shrink-0 mt-0.5`}>
        <Icon className={`h-4 w-4 ${style.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug">{item.event}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {item.date} • {item.time}
        </p>
      </div>
    </div>
  );
}

function AiInsightCard({ insight }: { insight: (typeof aiInsights)[0] }) {
  const severityStyles = {
    critical: {
      border: "border-l-red-500",
      badge: "bg-red-100 text-red-700",
      badgeLabel: "KRİTİK",
      icon: XCircle,
      iconColor: "text-red-500",
    },
    warning: {
      border: "border-l-amber-500",
      badge: "bg-amber-100 text-amber-700",
      badgeLabel: "UYARI",
      icon: AlertTriangle,
      iconColor: "text-amber-500",
    },
    info: {
      border: "border-l-blue-500",
      badge: "bg-blue-100 text-blue-700",
      badgeLabel: "ÖNERİ",
      icon: Lightbulb,
      iconColor: "text-blue-500",
    },
  };
  const style = severityStyles[insight.severity];
  const SIcon = style.icon;

  return (
    <div className={`border-l-4 ${style.border} bg-card rounded-r-xl p-4 shadow-sm`}>
      <div className="flex items-start gap-3">
        <SIcon className={`h-5 w-5 ${style.iconColor} shrink-0 mt-0.5`} />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{insight.title}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
              {style.badgeLabel}
            </span>
            <Badge variant="outline" className="text-[10px]">
              {insight.project}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {insight.description}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">
              Önerilen Aksiyon: {insight.action}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

interface YonetimPaneliProps {
  userName: string;
  userEmail: string;
  dateStr: string;
}

export default function YonetimPaneliClient({ userName, userEmail, dateStr }: YonetimPaneliProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex-1">
      {/* ═══════════ STICKY HEADER BAR ═══════════ */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6">
          {/* Top row: Logo + User */}
          <div className="flex h-14 items-center justify-between">
            {/* Left: Logo + Title */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <HardHat className="h-7 w-7 text-primary" />
                <span className="text-lg font-bold hidden sm:inline">Şantiye360</span>
              </Link>
              <div className="h-6 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span className="font-semibold text-sm">Yönetici Paneli</span>
              </div>
            </div>

            {/* Right: User + Actions */}
            <div className="flex items-center gap-2">
              {/* Mobile menu toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>

              <div className="hidden sm:flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium leading-tight">
                    {userName}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    {userEmail}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => signOut({ redirectTo: "/giris" })}
                  title="Çıkış yap"
                  className="h-8 w-8"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Nav row: Module shortcuts — desktop */}
          <nav className="hidden lg:flex items-center gap-1 pb-2 -mt-1 overflow-x-auto">
            {headerModules.map((mod) => {
              const Icon = mod.icon;
              return mod.active ? (
                <Link
                  key={mod.name}
                  href={mod.href}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors whitespace-nowrap"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {mod.name}
                </Link>
              ) : (
                <div
                  key={mod.name}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground/35 whitespace-nowrap cursor-default"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {mod.name}
                  <span className="text-[9px] px-1 py-px rounded bg-muted text-muted-foreground/40 font-semibold">
                    Yakında
                  </span>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Mobile nav dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-background px-4 py-3 space-y-1">
            {headerModules.map((mod) => {
              const Icon = mod.icon;
              return mod.active ? (
                <Link
                  key={mod.name}
                  href={mod.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  {mod.name}
                </Link>
              ) : (
                <div
                  key={mod.name}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground/35"
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{mod.name}</span>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-muted-foreground/40 border-muted-foreground/20">
                    Yakında
                  </Badge>
                </div>
              );
            })}
            <div className="border-t pt-2 mt-2">
              <div className="flex items-center gap-2 px-3 py-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs">
                    {userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium flex-1">{userName}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ redirectTo: "/giris" })}
                  className="text-xs h-7"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1" />
                  Çıkış
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ═══════════ DASHBOARD CONTENT ═══════════ */}
      <main className="mx-auto max-w-[1600px] px-4 sm:px-6 py-6 space-y-6">
        {/* ─── Page Title ─── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Genel Görünüm
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{dateStr}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Canlı veri
            </div>
          </div>
        </div>

        {/* ═══════════ EXECUTIVE BAR ═══════════ */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px">
            {executiveKpis.map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={i}
                  className={`flex flex-col gap-2 p-4 sm:p-5 ${
                    i === 0
                      ? "rounded-tl-xl sm:rounded-l-xl"
                      : i === executiveKpis.length - 1
                      ? "rounded-br-xl sm:rounded-r-xl"
                      : ""
                  } bg-slate-900/80 backdrop-blur`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${kpi.color}`} />
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                      {kpi.label}
                    </span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl sm:text-3xl font-bold text-white">
                      {kpi.value}
                    </span>
                    <div className="flex items-center gap-0.5 mb-1">
                      {kpi.trend === "up" && kpi.label !== "Kritik Risk" && (
                        <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
                      )}
                      {kpi.trend === "up" && kpi.label === "Kritik Risk" && (
                        <ArrowUpRight className="h-3.5 w-3.5 text-red-400" />
                      )}
                      {kpi.trend === "down" && (
                        <ArrowDownRight className="h-3.5 w-3.5 text-amber-400" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          kpi.trend === "up" && kpi.label !== "Kritik Risk"
                            ? "text-emerald-400"
                            : kpi.trend === "up" && kpi.label === "Kritik Risk"
                            ? "text-red-400"
                            : "text-amber-400"
                        }`}
                      >
                        {kpi.trendValue}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500">{kpi.subtext}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══════════ KATMAN 1: ŞİRKET SAĞLIĞI ═══════════ */}
        <div>
          <SectionHeader
            icon={Target}
            title="Şirket Sağlığı"
            subtitle="Genel ilerleme, finansal durum ve risk görünümü"
          />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* S-Curve Chart */}
            <Card className="xl:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">S-Curve — Portföy Geneli</CardTitle>
                <CardDescription>
                  Planlanan vs Gerçekleşen Kümülatif İlerleme (%)
                  <span className="ml-2 text-xs">
                    Sapma:{" "}
                    <span className="font-bold text-orange-500">
                      −{scurveData[scurveData.length - 1].planned - scurveData[scurveData.length - 1].actual}%
                    </span>
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={scurveConfig} className="h-[300px] w-full">
                  <AreaChart data={scurveData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="plannedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(220 70% 55%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(220 70% 55%)" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(25 95% 55%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(25 95% 55%)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="planned" stroke="hsl(220 70% 55%)" strokeWidth={2.5} fill="url(#plannedGradient)" dot={false} />
                    <Area type="monotone" dataKey="actual" stroke="hsl(25 95% 55%)" strokeWidth={2.5} fill="url(#actualGradient)" dot={false} />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Finansal KPI & Risk */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Finansal Özet</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Toplam Bütçe</span>
                    <span className="font-bold">{formatCurrency(financials.toplamButce)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Harcanan</span>
                    <span className="font-bold text-orange-600">{formatCurrency(financials.harcanan)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Kalan Bütçe</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(financials.kalan)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5 mt-1">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-amber-400 h-2.5 rounded-full transition-all"
                      style={{ width: `${(financials.harcanan / financials.toplamButce) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>%{((financials.harcanan / financials.toplamButce) * 100).toFixed(0)} kullanıldı</span>
                    <span>%{((financials.kalan / financials.toplamButce) * 100).toFixed(0)} kalan</span>
                  </div>
                  <div className="border-t pt-3 mt-2 grid grid-cols-2 gap-3">
                    <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                      <p className="text-xs text-muted-foreground">BPI</p>
                      <p className="text-lg font-bold text-blue-600">{financials.bpiValue}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                      <p className="text-xs text-muted-foreground">SPI</p>
                      <p className="text-lg font-bold text-purple-600">{financials.spiValue}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Risk Görünümü</CardTitle>
                  <CardDescription>{riskData.total} aktif risk</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <RiskIndicator label="Yüksek" count={riskData.high} color="bg-red-500" bgColor="bg-red-50 dark:bg-red-950/30" />
                  <RiskIndicator label="Orta" count={riskData.medium} color="bg-amber-500" bgColor="bg-amber-50 dark:bg-amber-950/30" />
                  <RiskIndicator label="Düşük" count={riskData.low} color="bg-emerald-500" bgColor="bg-emerald-50 dark:bg-emerald-950/30" />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Proje Bazlı + Nakit Akış */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Proje Bazlı İlerleme</CardTitle>
                <CardDescription>Planlanan vs Gerçekleşen (%)</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={projectConfig} className="h-[380px] w-full">
                  <BarChart data={projectData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={110} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="planned" fill="hsl(220 70% 55%)" radius={[0, 4, 4, 0]} barSize={14} />
                    <Bar dataKey="actual" fill="hsl(25 95% 55%)" radius={[0, 4, 4, 0]} barSize={14} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Nakit Akış Trendi</CardTitle>
                <CardDescription>
                  Son 6 ay + 3 ay projeksiyon (₺M) — <span className="text-muted-foreground italic">* projeksiyon</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={cashFlowConfig} className="h-[250px] w-full">
                  <BarChart data={cashFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₺${v}M`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="inflow" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} barSize={18} />
                    <Bar dataKey="outflow" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} barSize={18} />
                    <Line type="monotone" dataKey="net" stroke="hsl(220 70% 55%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(220 70% 55%)" }} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ═══════════ KATMAN 2: OPERASYONEL GÜÇ ═══════════ */}
        <div>
          <SectionHeader icon={HardHat} title="Operasyonel Güç" subtitle="İnsan kaynağı, taşeron performansı ve tedarik durumu" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Personel Dağılımı */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Personel Dağılımı</CardTitle>
                <CardDescription>{personnelData.total} toplam çalışan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <ChartContainer
                    config={{
                      activeOnSite: { label: "Sahada Aktif", color: "#10b981" },
                      onLeave: { label: "İzinli", color: "#f59e0b" },
                      sick: { label: "Hasta", color: "#ef4444" },
                      training: { label: "Eğitimde", color: "#3b82f6" },
                    }}
                    className="h-[180px] w-[180px]"
                  >
                    <PieChart>
                      <Pie data={personnelPieData} innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                        {personnelPieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {personnelPieData.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="font-bold ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-3 pt-3 grid grid-cols-2 gap-2">
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Devamsızlık</p>
                    <p className="text-sm font-bold">%{personnelData.turnoverRate}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Verimlilik</p>
                    <p className="text-sm font-bold">%{personnelData.avgProductivity}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Taşeron Performansı */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Taşeron Performansı</CardTitle>
                <CardDescription>En iyi 5 taşeron firma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contractorPerformance.map((c, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold text-white ${
                          i === 0 ? "bg-amber-500" : i === 1 ? "bg-slate-400" : i === 2 ? "bg-amber-700" : "bg-slate-300"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.field} • {c.project}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-bold ${c.score >= 90 ? "text-emerald-600" : c.score >= 80 ? "text-blue-600" : "text-amber-600"}`}>
                          {c.score}
                        </span>
                        <span className="text-xs text-muted-foreground">/100</span>
                        {c.trend === "up" && <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />}
                        {c.trend === "down" && <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />}
                        {c.trend === "stable" && <CircleDot className="h-3.5 w-3.5 text-slate-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Satınalma & Stok */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Satınalma & Stok</CardTitle>
                <CardDescription>Tedarik zinciri durumu</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <MiniStatCard label="Bekleyen Sipariş" value={purchasingData.pendingOrders} icon={Timer} color="bg-amber-500" />
                <MiniStatCard label="Bu Ay Teslim" value={purchasingData.deliveredThisMonth} icon={Truck} color="bg-emerald-500" />
                <MiniStatCard label="Stok Değeri" value={formatCurrency(purchasingData.stockValue)} icon={Package} color="bg-blue-500" />
                <MiniStatCard label="Kritik Eksik" value={purchasingData.criticalShortage} icon={AlertTriangle} color="bg-red-500" />
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-muted-foreground">Zamanında Teslim</span>
                    <span className="text-sm font-bold">%{purchasingData.onTimeDelivery}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full" style={{ width: `${purchasingData.onTimeDelivery}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Kritik Riskler */}
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                Kritik Risk Detayı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proje</TableHead>
                    <TableHead>Risk Açıklaması</TableHead>
                    <TableHead className="text-right">Tahmini Etki</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riskData.criticalItems.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{item.project}</TableCell>
                      <TableCell>{item.risk}</TableCell>
                      <TableCell className="text-right font-bold text-red-600">{item.impact}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* ═══════════ KATMAN 3: HAREKET & ALARM ═══════════ */}
        <div>
          <SectionHeader icon={Activity} title="Hareket & Alarm" subtitle="Son operasyonel hareketler ve AI destekli karar önerileri" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Son 7 Gün — Operasyon Akışı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-0">
                  {operationFeed.map((item, i) => (
                    <FeedItem key={i} item={item} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50/50 to-fuchsia-50/50 dark:from-violet-950/20 dark:to-fuchsia-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="h-5 w-5 text-violet-600" />
                  <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                    AI Karar Destek
                  </span>
                  <Badge variant="outline" className="text-[10px] border-violet-300 text-violet-600">
                    GPT-4o
                  </Badge>
                </CardTitle>
                <CardDescription>Yapay zekâ destekli stratejik öneriler</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {aiInsights.map((insight, i) => (
                  <AiInsightCard key={i} insight={insight} />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ─── FOOTER NOTE ─── */}
        <div className="text-center py-4 border-t">
          <p className="text-xs text-muted-foreground">
            Demo verileri gösterim amaçlıdır. Gerçek veriler entegrasyon sonrası aktif olacaktır.
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">Sistem aktif — Son güncelleme: {dateStr}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
