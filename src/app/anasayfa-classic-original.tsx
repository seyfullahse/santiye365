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

/* ══════════════════ SECTION DATA ══════════════════ */

const sections = [
  {
    id: "command",
    title: "KOMUTA MERKEZİ",
    subtitle: "Stratejik karar ve portföy yönetimi",
    color: "from-blue-500 to-cyan-500",
    dotColor: "bg-blue-500",
    modules: [
      {
        key: "yonetim-paneli",
        name: "Yönetim Paneli",
        tagline: "Tüm projeler, tek ekran. Gerçek zamanlı karar destek sistemi.",
        icon: LayoutDashboard,
        href: "/yonetim-paneli",
        active: true,
        gradient: "from-orange-500 to-amber-500",
        bg: "bg-orange-500/10",
        text: "text-orange-500",
      },
      {
        key: "proje-yonetimi",
        name: "Proje Yönetimi",
        tagline: "Bütçe, süre, ilerleme — her projenin dijital nabzı elinizde.",
        icon: FolderKanban,
        href: "/dashboard",
        active: true,
        gradient: "from-blue-500 to-indigo-500",
        bg: "bg-blue-500/10",
        text: "text-blue-500",
      },
    ],
  },
  {
    id: "field",
    title: "SAHA İSTİHBARATI",
    subtitle: "Sahadan anlık veri akışı ve izleme",
    color: "from-emerald-500 to-teal-500",
    dotColor: "bg-emerald-500",
    modules: [
      {
        key: "mahaller",
        name: "Akıllı Mekan Haritası",
        tagline: "Her mahal bir sensör. Metrekare bazlı iş takibi, sapma analizi.",
        icon: MapPin,
        href: "/mahaller",
        active: true,
        gradient: "from-emerald-500 to-green-500",
        bg: "bg-emerald-500/10",
        text: "text-emerald-500",
      },
      {
        key: "katlar",
        name: "Dikey İnşaat Takibi",
        tagline: "Kat kat yükselen ilerleme. Tamamlanma yüzdeleri canlı güncellenir.",
        icon: Layers,
        href: "/katlar",
        active: true,
        gradient: "from-teal-500 to-cyan-500",
        bg: "bg-teal-500/10",
        text: "text-teal-500",
      },
      {
        key: "aktiviteler",
        name: "Canlı Aktivite Radarı",
        tagline: "İş kalemleri anlık izlenir. Gecikmeler oluşmadan tespit edilir.",
        icon: Activity,
        href: "/aktiviteler",
        active: true,
        gradient: "from-green-500 to-lime-500",
        bg: "bg-green-500/10",
        text: "text-green-500",
      },
    ],
  },
  {
    id: "decision",
    title: "AKILLI KARAR SİSTEMİ",
    subtitle: "Veri odaklı karar mekanizması",
    color: "from-amber-500 to-yellow-500",
    dotColor: "bg-amber-500",
    modules: [
      {
        key: "onaylar",
        name: "Dijital Onay Merkezi",
        tagline: "Kağıtsız, anlık, izlenebilir. Her onay dijital kayıt altında.",
        icon: CheckCircle2,
        href: "/onaylar",
        active: true,
        gradient: "from-amber-500 to-orange-500",
        bg: "bg-amber-500/10",
        text: "text-amber-500",
      },
      {
        key: "riskler",
        name: "Proaktif Risk Radarı",
        tagline: "Riskler oluşmadan uyarır. Etki × Olasılık matrisiyle önceliklendirme.",
        icon: AlertTriangle,
        href: "/riskler",
        active: true,
        gradient: "from-red-500 to-rose-500",
        bg: "bg-red-500/10",
        text: "text-red-500",
      },
    ],
  },
  {
    id: "finance",
    title: "FİNANSAL KONTROL",
    subtitle: "Hakediş, malzeme ve maliyet yönetimi",
    color: "from-purple-500 to-violet-500",
    dotColor: "bg-purple-500",
    modules: [
      {
        key: "hakedis",
        name: "Hakediş Motoru",
        tagline: "Otomatik metraj hesabı, kesinti yönetimi. Her kuruş dijital kayıtta.",
        icon: FileText,
        href: "/hakedis",
        active: true,
        gradient: "from-purple-500 to-fuchsia-500",
        bg: "bg-purple-500/10",
        text: "text-purple-500",
      },
      {
        key: "malzemeler",
        name: "Malzeme Tedarik Zekası",
        tagline: "Stok, sipariş, teslimat. Tedarik zinciri uçtan uca kontrolde.",
        icon: Package,
        href: "/malzemeler",
        active: true,
        gradient: "from-violet-500 to-purple-500",
        bg: "bg-violet-500/10",
        text: "text-violet-500",
      },
    ],
  },
  {
    id: "hr",
    title: "İNSAN KAYNAĞI",
    subtitle: "Sahadan dijital personel yönetimi",
    color: "from-rose-500 to-pink-500",
    dotColor: "bg-rose-500",
    modules: [
      {
        key: "sirketler-ekipler",
        name: "Taşeron Ekosistemi",
        tagline: "Tüm taşeronlar, ekipleri, performansları — tek platformda.",
        icon: Building2,
        href: "/sirketler",
        active: true,
        gradient: "from-rose-500 to-pink-500",
        bg: "bg-rose-500/10",
        text: "text-rose-500",
      },
      {
        key: "calisanlar",
        name: "Saha Personel Yönetimi",
        tagline: "Kim, nerede, ne yapıyor? Sahadan anlık personel görünürlüğü.",
        icon: Users,
        href: "/calisanlar",
        active: true,
        gradient: "from-pink-500 to-rose-500",
        bg: "bg-pink-500/10",
        text: "text-pink-500",
      },
      {
        key: "puantaj",
        name: "Dijital Puantaj",
        tagline: "Kağıt puantaj devri bitti. Günlük devam, hakedişe otomatik aktarım.",
        icon: ClipboardList,
        href: "/puantaj",
        active: true,
        gradient: "from-fuchsia-500 to-pink-500",
        bg: "bg-fuchsia-500/10",
        text: "text-fuchsia-500",
      },
    ],
  },
];

/* ══════════════════ TYPING HOOK ══════════════════ */

function useTypingEffect(text: string, speed = 30, startDelay = 0) {
  const [displayed, setDisplayed] = useState("");
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!text) { setDisplayed(""); setIsDone(false); return; }
    setDisplayed("");
    setIsDone(false);

    const delayTimer = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayed(text.slice(0, i + 1));
          i++;
        } else {
          setIsDone(true);
          clearInterval(interval);
        }
      }, speed);
      return () => clearInterval(interval);
    }, startDelay);

    return () => clearTimeout(delayTimer);
  }, [text, speed, startDelay]);

  return { displayed, isDone };
}

/* ══════════════════ COUNTER ANIMATION ══════════════════ */

function AnimatedCounter({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (value === 0) { setCount(0); return; }
    let start = 0;
    const step = Math.max(1, Math.ceil(value / (duration / 16)));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count.toLocaleString("tr-TR")}</span>;
}

/* ══════════════════ KPI PILL ══════════════════ */

function KpiPill({
  icon: Icon,
  value,
  label,
  gradient,
  delay,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  gradient: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 hover:bg-white/10 transition-colors">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} />
        <div className="relative flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              <AnimatedCounter value={value} />
            </p>
            <p className="text-xs text-white/60">{label}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════ MODULE CARD ══════════════════ */

function ModuleCard({
  mod,
  aiText,
  index,
}: {
  mod: (typeof sections)[number]["modules"][number];
  aiText?: string;
  index: number;
}) {
  const Icon = mod.icon;
  const aiDelay = (index * 0.15 + 0.8) * 1000;
  const { displayed: aiDisplayed } = useTypingEffect(aiText || "", 25, aiDelay);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
    >
      <Link href={mod.href} className="block group">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.08] transition-all duration-300 hover:border-white/20 hover:shadow-2xl hover:shadow-white/5">
          {/* Gradient accent line */}
          <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${mod.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />

          <div className="p-5 sm:p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${mod.bg} backdrop-blur-sm`}>
                <Icon className={`h-6 w-6 ${mod.text}`} />
              </div>
              {mod.active && (
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  AKTİF
                </span>
              )}
            </div>

            {/* Title + tagline */}
            <h3 className="text-white font-semibold text-base mb-1 group-hover:text-white/90">
              {mod.name}
            </h3>
            <p className="text-white/40 text-xs leading-relaxed mb-3">
              {mod.tagline}
            </p>

            {/* AI insight */}
            {aiText && (
              <div className="relative mt-3 pt-3 border-t border-white/5">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-violet-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-violet-300/80 leading-relaxed min-h-[2.5em]">
                    {aiDisplayed}
                    {aiDisplayed.length < (aiText?.length || 0) && (
                      <span className="inline-block w-[2px] h-3 bg-violet-400 ml-0.5 animate-pulse" />
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-white/30 group-hover:text-white/70 transition-colors">
              Keşfet <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ══════════════════ SECTION COMPONENT ══════════════════ */

function PresentationSection({
  section,
  aiModules,
  sectionIndex,
}: {
  section: (typeof sections)[number];
  aiModules: Record<string, string>;
  sectionIndex: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8 }}
      className="relative"
    >
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-3 mb-6"
      >
        <div className={`w-2 h-2 rounded-full ${section.dotColor}`} />
        <div>
          <h2 className={`text-xs font-bold tracking-[0.2em] bg-gradient-to-r ${section.color} bg-clip-text text-transparent`}>
            BÖLÜM {sectionIndex + 1} — {section.title}
          </h2>
          <p className="text-white/30 text-xs mt-0.5">{section.subtitle}</p>
        </div>
      </motion.div>

      {/* Module cards grid */}
      <div className={`grid gap-4 ${
        section.modules.length === 3
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-1 sm:grid-cols-2"
      }`}>
        {section.modules.map((mod, idx) => (
          <ModuleCard
            key={mod.key}
            mod={mod}
            aiText={aiModules[mod.key]}
            index={idx}
          />
        ))}
      </div>
    </motion.section>
  );
}

/* ══════════════════ MAIN CONTENT ══════════════════ */

function AnasayfaContent({ userName, userEmail, kpiData }: AnasayfaProps) {
  const [aiData, setAiData] = useState<AIData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const firstName = userName.split(" ")[0];
  const hasFetched = useRef(false);

  // Fetch AI summary
  const fetchAI = useCallback(async () => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    try {
      const res = await fetch("/api/ai/dashboard-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName }),
      });
      const json = await res.json();
      if (json.success) {
        setAiData(json.data);
        setStats(json.stats);
      }
    } catch (err) {
      console.error("AI fetch error:", err);
    } finally {
      setAiLoading(false);
    }
  }, [userName]);

  useEffect(() => {
    fetchAI();
    const t = setTimeout(() => setShowContent(true), 600);
    return () => clearTimeout(t);
  }, [fetchAI]);

  const greetingText = aiData?.greeting || `Hoş geldiniz, ${firstName}. Şantiye360 platformu hazır.`;
  const { displayed: greetingDisplayed } = useTypingEffect(
    showContent ? greetingText : "",
    20,
    500
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* ── Ambient background ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-blue-500/[0.03] blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-500/[0.03] blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-cyan-500/[0.02] blur-[150px]" />
      </div>

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl flex h-14 items-center justify-between px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2.5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20">
              <HardHat className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight">Şantiye360</span>
              <span className="hidden sm:inline text-[9px] text-white/30 ml-1.5 font-medium tracking-wider">CONSTRUCTION OS</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
            {aiLoading && (
              <div className="flex items-center gap-1.5 text-[10px] text-violet-400 mr-2">
                <Bot className="h-3 w-3 animate-pulse" />
                <span className="hidden sm:inline">AI analiz ediyor...</span>
              </div>
            )}
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-white/80">{userName}</p>
              <p className="text-[10px] text-white/30">{userEmail}</p>
            </div>
            <Avatar className="h-8 w-8 border border-white/10">
              <AvatarFallback className="bg-white/5 text-white/60 text-xs font-semibold">
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => signOut({ callbackUrl: "/giris" })}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-white/80"
              title="Çıkış Yap"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12 space-y-16">
        {/* ══ HERO: AI Greeting ══ */}
        <AnimatePresence>
          {showContent && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* AI greeting card */}
              <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-6 sm:p-8 mb-8">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

                <div className="flex items-start gap-3 mb-4">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20"
                  >
                    <Bot className="h-5 w-5 text-white" />
                  </motion.div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white/90">AI Danışman</span>
                      <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[9px] font-semibold">
                        GPT-4o
                      </Badge>
                    </div>
                    <p className="text-[10px] text-white/30 mt-0.5">Gerçek zamanlı veri analizi</p>
                  </div>
                </div>

                <div className="min-h-[3em]">
                  <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                    {greetingDisplayed}
                    {greetingDisplayed.length < greetingText.length && (
                      <span className="inline-block w-[2px] h-4 bg-violet-400 ml-1 animate-pulse" />
                    )}
                  </p>
                </div>
              </div>

              {/* KPI pills */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiPill
                  icon={FolderKanban}
                  value={stats?.activeProjects ?? kpiData.activeProjects}
                  label="Aktif Proje"
                  gradient="from-blue-500 to-cyan-500"
                  delay={1.0}
                />
                <KpiPill
                  icon={HardHat}
                  value={stats?.totalWorkers ?? kpiData.totalWorkers}
                  label="Toplam Çalışan"
                  gradient="from-emerald-500 to-teal-500"
                  delay={1.2}
                />
                <KpiPill
                  icon={Activity}
                  value={stats?.totalActivities ?? 0}
                  label="Toplam Aktivite"
                  gradient="from-amber-500 to-orange-500"
                  delay={1.4}
                />
                <KpiPill
                  icon={Shield}
                  value={stats?.highRisks ?? 0}
                  label="Yüksek Risk"
                  gradient="from-red-500 to-rose-500"
                  delay={1.6}
                />
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ══ PRESENTATION SECTIONS ══ */}
        {showContent && sections.map((section, idx) => (
          <PresentationSection
            key={section.id}
            section={section}
            aiModules={aiData?.modules || {}}
            sectionIndex={idx}
          />
        ))}

        {/* ══ AI LAYER FINALE ══ */}
        {showContent && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5 backdrop-blur-sm">
              <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 w-[300px] h-[300px] rounded-full bg-violet-500/10 blur-[100px]" />
                <div className="absolute bottom-0 right-1/4 w-[200px] h-[200px] rounded-full bg-purple-500/10 blur-[80px]" />
              </div>

              <div className="relative p-8 sm:p-12 text-center">
                <motion.div
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(139,92,246,0.2)",
                      "0 0 40px rgba(139,92,246,0.4)",
                      "0 0 20px rgba(139,92,246,0.2)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 mb-6"
                >
                  <Sparkles className="h-8 w-8 text-white" />
                </motion.div>

                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  Yapay Zeka Katmanı
                </h3>
                <p className="text-white/40 text-sm max-w-md mx-auto mb-6">
                  Verilerinizi okur, öngörüler sunar, kararlarınızı hızlandırır.
                  <br />
                  7/24 dijital danışman.
                </p>

                <div className="flex flex-wrap justify-center gap-3">
                  {["Gecikme Tahmini", "Maliyet Sapma Analizi", "Risk Skoru", "Anomali Tespiti", "Akıllı Raporlama"].map(
                    (feat, i) => (
                      <motion.span
                        key={feat}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300"
                      >
                        <Zap className="h-3 w-3" />
                        {feat}
                      </motion.span>
                    )
                  )}
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* ══ Bottom CTA ══ */}
        {showContent && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="text-center pb-8"
          >
            <p className="text-white/20 text-xs mb-3">Tüm veriler gerçek zamanlı.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/yonetim-paneli">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-shadow"
                >
                  <BarChart3 className="h-4 w-4" />
                  Yönetim Paneline Git
                </motion.button>
              </Link>
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white/80 text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  <FolderKanban className="h-4 w-4" />
                  Proje Yönetimine Git
                </motion.button>
              </Link>
            </div>
          </motion.div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-6 text-center text-[11px] text-white/20">
        <p>
          © 2026 AIWorks Lab — Created by{" "}
          <span className="text-white/40 font-medium">Seyfullah SEPET</span>
        </p>
      </footer>
    </div>
  );
}

/* ══════════════════ EXPORT ══════════════════ */

export function AnasayfaClient(props: AnasayfaProps) {
  return (
    <SessionProvider>
      <AnasayfaContent {...props} />
    </SessionProvider>
  );
}
