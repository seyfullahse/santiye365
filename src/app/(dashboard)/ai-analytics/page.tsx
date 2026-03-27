"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  Send,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Shield,
  Users,
  DollarSign,
  Activity,
  BarChart3,
  Loader2,
  Sparkles,
  Clock,
  Target,
  HardHat,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

/* ─── Tipler ─── */

interface KPIs {
  totalProjects: number;
  avgProgress: number;
  criticalProjects: number;
  highRiskProjects: number;
  compositeRisk: number;
  riskLevel: string;
  totalBudget: number;
  totalRealized: number;
  averageWorkers: number;
  openRisks: number;
  totalAccidents: number;
  lostDays: number;
}

interface ProjectRow {
  id: string;
  name: string;
  progress: number;
  riskLevel: string;
  deviation: number;
  delayedActivities: number;
}

interface CostRow {
  projectId: string;
  projectName: string;
  budget: number;
  realized: number;
  deviationPercent: number;
  burnRate: number;
  status: string;
}

interface DashboardData {
  kpis: KPIs;
  projects: ProjectRow[];
  riskBreakdown: { technical: number; schedule: number; safety: number };
  costSummary: CostRow[];
  monthlyTrend: { month: string; amount: number; count: number }[];
  workforceTrend: { date: string; count: number }[];
  topSubcontractors: { companyName: string; contractTotal: number; realized: number; completionRate: number }[];
  topRisks: { title: string; score: number; project: string }[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  toolsUsed?: string[];
  timestamp: Date;
}

/* ─── Sabitler ─── */

const RISK_COLORS: Record<string, string> = {
  LOW: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const RISK_LABELS: Record<string, string> = {
  LOW: "Düşük",
  MEDIUM: "Orta",
  HIGH: "Yüksek",
  CRITICAL: "Kritik",
};

const PIE_COLORS = ["#22c55e", "#eab308", "#f97316", "#ef4444"];

const SUGGESTED_QUESTIONS = [
  "Genel proje durumu ne?",
  "Gecikme riski en yüksek projeler hangisi?",
  "Maliyet sapması var mı?",
  "Açık riskler neler?",
  "Bu ayki iş gücü verileri nasıl?",
  "Taşeron performansları nasıl?",
];

/* ─── Yardımcı fonksiyonlar ─── */

function formatCurrency(v: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

function formatCompact(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toString();
}

/* ─── KPI Kartı ─── */

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "warning" | "danger" | "success";
}) {
  const variantStyles = {
    default: "border-border",
    warning: "border-yellow-300 bg-yellow-50/50 dark:bg-yellow-950/20",
    danger: "border-red-300 bg-red-50/50 dark:bg-red-950/20",
    success: "border-green-300 bg-green-50/50 dark:bg-green-950/20",
  };

  return (
    <Card className={`${variantStyles[variant]} transition-all hover:shadow-md`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {trend === "up" && <TrendingUp className="h-3 w-3 text-red-500" />}
                {trend === "down" && <TrendingDown className="h-3 w-3 text-green-500" />}
                {subtitle}
              </p>
            )}
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ANA SAYFA BİLEŞENİ
   ═══════════════════════════════════════════════════════════════ */

export default function AIAnalyticsPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Dashboard verilerini yükle
  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ai/analytics/dashboard");
      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
      }
    } catch (err) {
      console.error("Dashboard yükleme hatası:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Sohbet gönder
  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || chatLoading) return;

    const userMsg: ChatMessage = { role: "user", content: msg, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setChatLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/ai/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: ChatMessage = {
          role: "assistant",
          content: data.response,
          toolsUsed: data.toolsUsed,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.",
            timestamp: new Date(),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Bağlantı hatası oluştu.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Mesaj sonuna scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Radar verisi
  const radarData = dashboard
    ? [
        { subject: "Teknik Risk", value: dashboard.riskBreakdown.technical },
        { subject: "Zaman Risk", value: dashboard.riskBreakdown.schedule },
        { subject: "ISG Risk", value: dashboard.riskBreakdown.safety },
      ]
    : [];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Başlık */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">AI & Analitik</h1>
            <p className="text-xs text-muted-foreground">
              Yapay zeka destekli proje analizi
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadDashboard} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Yenile
        </Button>
      </div>

      {/* İçerik — Sol: Dashboard, Sağ: Chat */}
      <div className="flex flex-1 overflow-hidden">
        {/* ─── SOL PANEL: Dashboard ─── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 border-r">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Veriler analiz ediliyor...</span>
            </div>
          ) : dashboard ? (
            <>
              {/* KPI Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiCard
                  title="Aktif Proje"
                  value={dashboard.kpis.totalProjects}
                  icon={Target}
                />
                <KpiCard
                  title="Ort. İlerleme"
                  value={`%${dashboard.kpis.avgProgress}`}
                  icon={Activity}
                  variant="success"
                />
                <KpiCard
                  title="Bileşik Risk"
                  value={dashboard.kpis.compositeRisk}
                  subtitle={RISK_LABELS[dashboard.kpis.riskLevel]}
                  icon={Shield}
                  variant={
                    dashboard.kpis.compositeRisk >= 70
                      ? "danger"
                      : dashboard.kpis.compositeRisk >= 40
                      ? "warning"
                      : "default"
                  }
                />
                <KpiCard
                  title="Açık Risk"
                  value={dashboard.kpis.openRisks}
                  icon={AlertTriangle}
                  variant={dashboard.kpis.openRisks > 10 ? "warning" : "default"}
                />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiCard
                  title="Toplam Bütçe"
                  value={formatCompact(dashboard.kpis.totalBudget)}
                  subtitle={`Gerçekleşen: ${formatCompact(dashboard.kpis.totalRealized)}`}
                  icon={DollarSign}
                />
                <KpiCard
                  title="Ort. İşçi/Gün"
                  value={dashboard.kpis.averageWorkers}
                  icon={Users}
                />
                <KpiCard
                  title="Kritik Proje"
                  value={dashboard.kpis.criticalProjects}
                  subtitle={`Yüksek risk: ${dashboard.kpis.highRiskProjects}`}
                  icon={Clock}
                  variant={dashboard.kpis.criticalProjects > 0 ? "danger" : "default"}
                />
                <KpiCard
                  title="İş Kazası"
                  value={dashboard.kpis.totalAccidents}
                  subtitle={`Kayıp gün: ${dashboard.kpis.lostDays}`}
                  icon={HardHat}
                  variant={dashboard.kpis.totalAccidents > 0 ? "warning" : "success"}
                />
              </div>

              {/* Grafikler */}
              <Tabs defaultValue="projects" className="space-y-3">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="projects">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Projeler
                  </TabsTrigger>
                  <TabsTrigger value="cost">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Maliyet
                  </TabsTrigger>
                  <TabsTrigger value="risk">
                    <Shield className="h-4 w-4 mr-1" />
                    Risk
                  </TabsTrigger>
                  <TabsTrigger value="workforce">
                    <Users className="h-4 w-4 mr-1" />
                    İş Gücü
                  </TabsTrigger>
                </TabsList>

                {/* Proje İlerleme */}
                <TabsContent value="projects" className="space-y-3">
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm">Proje İlerleme Durumu</CardTitle>
                      <CardDescription className="text-xs">
                        Aktif projeler ve risk seviyeleri
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dashboard.projects} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 100]} />
                            <YAxis
                              type="category"
                              dataKey="name"
                              width={120}
                              tick={{ fontSize: 11 }}
                            />
                            <Tooltip
                              formatter={(v: number) => [`%${v}`, "İlerleme"]}
                            />
                            <Bar dataKey="progress" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Proje Tablosu */}
                      <div className="mt-3 space-y-2">
                        {dashboard.projects.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm"
                          >
                            <span className="font-medium truncate flex-1">{p.name}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-muted-foreground">
                                Sapma: {p.deviation > 0 ? "+" : ""}
                                {p.deviation}%
                              </span>
                              {p.delayedActivities > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {p.delayedActivities} geciken
                                </Badge>
                              )}
                              <Badge className={`text-xs ${RISK_COLORS[p.riskLevel]}`}>
                                {RISK_LABELS[p.riskLevel]}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Maliyet */}
                <TabsContent value="cost" className="space-y-3">
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm">Bütçe vs Gerçekleşen</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dashboard.costSummary}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="projectName" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} tickFormatter={formatCompact} />
                            <Tooltip formatter={(v: number) => formatCurrency(v)} />
                            <Bar dataKey="budget" name="Bütçe" fill="#8b5cf6" />
                            <Bar dataKey="realized" name="Gerçekleşen" fill="#f97316" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {dashboard.monthlyTrend.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-medium mb-2">Aylık Hakediş Trendi</p>
                          <div className="h-36">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={dashboard.monthlyTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} tickFormatter={formatCompact} />
                                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                                <Line
                                  type="monotone"
                                  dataKey="amount"
                                  stroke="#8b5cf6"
                                  strokeWidth={2}
                                  dot={{ r: 4 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Risk */}
                <TabsContent value="risk" className="space-y-3">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <Card>
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm">Risk Radarı</CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4">
                        <div className="h-52">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData}>
                              <PolarGrid />
                              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                              <Radar
                                dataKey="value"
                                stroke="#8b5cf6"
                                fill="#8b5cf6"
                                fillOpacity={0.3}
                              />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm">En Yüksek Riskler</CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4">
                        {dashboard.topRisks.length > 0 ? (
                          <div className="space-y-2">
                            {dashboard.topRisks.map((r, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{r.title}</p>
                                  <p className="text-xs text-muted-foreground">{r.project}</p>
                                </div>
                                <Badge
                                  className={`text-xs ml-2 ${
                                    r.score >= 9
                                      ? "bg-red-100 text-red-800"
                                      : r.score >= 4
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  Skor: {r.score}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            Yüksek riskli kayıt bulunamadı
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Risk dağılım pasta */}
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm">Risk Dağılımı</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 flex items-center justify-center">
                      <div className="h-48 w-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: "Teknik", value: dashboard.riskBreakdown.technical },
                                { name: "Zaman", value: dashboard.riskBreakdown.schedule },
                                { name: "ISG", value: dashboard.riskBreakdown.safety },
                              ]}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={70}
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              <Cell fill="#8b5cf6" />
                              <Cell fill="#f97316" />
                              <Cell fill="#06b6d4" />
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* İş Gücü */}
                <TabsContent value="workforce" className="space-y-3">
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm">İş Gücü Trendi (Son 14 Gün)</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      {dashboard.workforceTrend.length > 0 ? (
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dashboard.workforceTrend}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="date"
                                tick={{ fontSize: 10 }}
                                tickFormatter={(d) =>
                                  new Date(d).toLocaleDateString("tr-TR", {
                                    day: "2-digit",
                                    month: "short",
                                  })
                                }
                              />
                              <YAxis tick={{ fontSize: 10 }} />
                              <Tooltip
                                labelFormatter={(d) =>
                                  new Date(d).toLocaleDateString("tr-TR")
                                }
                              />
                              <Line
                                type="monotone"
                                dataKey="count"
                                name="İşçi Sayısı"
                                stroke="#06b6d4"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          İş gücü verisi bulunamadı
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Taşeron Performansı */}
                  {dashboard.topSubcontractors.length > 0 && (
                    <Card>
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm">Taşeron Performansı</CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4">
                        <div className="space-y-2">
                          {dashboard.topSubcontractors.map((s, i) => (
                            <div key={i} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="truncate">{s.companyName}</span>
                                <span className="text-xs text-muted-foreground">
                                  %{s.completionRate} · {formatCompact(s.realized)} /{" "}
                                  {formatCompact(s.contractTotal)}
                                </span>
                              </div>
                              <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-violet-500 transition-all"
                                  style={{ width: `${Math.min(s.completionRate, 100)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Veri yüklenemedi. Lütfen yenileyin.</p>
            </div>
          )}
        </div>

        {/* ─── SAĞ PANEL: AI Sohbet ─── */}
        <div className="w-[420px] flex flex-col bg-muted/30 min-w-[340px]">
          {/* Chat Başlık */}
          <div className="px-4 py-3 border-b flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold">Analitik Asistan</p>
              <p className="text-[10px] text-muted-foreground">GPT-4o · Function Calling</p>
            </div>
          </div>

          {/* Mesaj Alanı */}
          <ScrollArea className="flex-1 px-4 py-3">
            {messages.length === 0 ? (
              <div className="space-y-3 mt-4">
                <div className="text-center space-y-2">
                  <Brain className="h-10 w-10 mx-auto text-violet-500/50" />
                  <p className="text-sm font-medium">Merhaba! 👋</p>
                  <p className="text-xs text-muted-foreground">
                    Proje verilerinizi analiz edebilir, gecikme risklerini tespit edebilir ve
                    maliyet karşılaştırması yapabilirim.
                  </p>
                </div>

                <div className="space-y-1.5 mt-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    Önerilen Sorular
                  </p>
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      className="w-full text-left text-xs p-2 rounded-lg border bg-background hover:bg-accent transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                        m.role === "user"
                          ? "bg-violet-600 text-white"
                          : "bg-background border"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{m.content}</div>
                      {m.toolsUsed && m.toolsUsed.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 pt-1 border-t border-muted-foreground/20">
                          {m.toolsUsed.map((t, j) => (
                            <Badge
                              key={j}
                              variant="outline"
                              className="text-[9px] px-1.5 py-0"
                            >
                              {t}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-background border rounded-xl px-3 py-2 flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-xs text-muted-foreground">
                        Veriler analiz ediliyor...
                      </span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Mesaj Giriş */}
          <div className="p-3 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Projeler hakkında sorun..."
                className="text-sm"
                disabled={chatLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || chatLoading}
                className="bg-violet-600 hover:bg-violet-700 flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
