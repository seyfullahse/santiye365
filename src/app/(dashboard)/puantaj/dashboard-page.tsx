"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  FolderKanban,
  CalendarDays,
  TrendingUp,
  HardHat,
  CalendarRange,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Building2,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ProjectStat {
  projectId: string | null;
  projectName: string;
  workerCount: number;
  todayPresent: number;
  todayAbsent: number;
  mainPresent: number;
  subPresent: number;
  monthHours: number;
  monthOvertime: number;
  companyCount: number;
}

// İstatistik tipleri
interface DayStat {
  date: string;
  present: number;
  absent: number;
  leave: number;
  total: number;
  hours: number;
  overtime: number;
}

interface CompanyTotals {
  totalWorkers: number;
  white: number;
  blue: number;
  present: number;
  absent: number;
  adminLeave: number;
  dayOff: number;
  restDayWork: number;
  otherLeave: number;
  hours: number;
  overtime: number;
}

interface SubCompanyTotals {
  totalWorkers: number;
  white: number;
  blue: number;
  present: number;
  absent: number;
  hours: number;
  overtime: number;
}

interface StatProject {
  projectId: string;
  projectName: string;
  main: {
    workers: number; white: number; blue: number;
    present: number; absent: number; adminLeave: number;
    dayOff: number; restDayWork: number; otherLeave: number;
    hours: number; overtime: number;
  };
  sub: {
    workers: number; white: number; blue: number;
    present: number; absent: number;
    hours: number; overtime: number;
  };
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function turkishDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const days = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  return days[d.getDay()];
}

function shortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function getPresetRange(key: string): [Date, Date] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (key) {
    case "today": return [today, today];
    case "yesterday": { const y = new Date(today); y.setDate(y.getDate() - 1); return [y, y]; }
    case "thisWeek": { const day = today.getDay(); const diff = day === 0 ? 6 : day - 1; const s = new Date(today); s.setDate(s.getDate() - diff); return [s, today]; }
    case "lastWeek": { const day = today.getDay(); const diff = day === 0 ? 6 : day - 1; const ws = new Date(today); ws.setDate(ws.getDate() - diff); const ls = new Date(ws); ls.setDate(ls.getDate() - 7); const le = new Date(ws); le.setDate(le.getDate() - 1); return [ls, le]; }
    case "thisMonth": return [new Date(now.getFullYear(), now.getMonth(), 1), today];
    case "lastMonth": return [new Date(now.getFullYear(), now.getMonth() - 1, 1), new Date(now.getFullYear(), now.getMonth(), 0)];
    case "last7": { const s = new Date(today); s.setDate(s.getDate() - 6); return [s, today]; }
    case "last30": { const s = new Date(today); s.setDate(s.getDate() - 29); return [s, today]; }
    default: return [today, today];
  }
}

export default function PuantajDashboard() {
  const [projectStats, setProjectStats] = useState<ProjectStat[]>([]);
  const [mainDashStats, setMainDashStats] = useState<{ totalWorkers: number; white: number; blue: number; whitePresent: number; bluePresent: number; todayPresent: number; todayLeave: number; companyName: string; monthTotalHours: number; monthOvertime: number } | null>(null);
  const [subDashStats, setSubDashStats] = useState<{ totalWorkers: number; white: number; blue: number; whitePresent: number; bluePresent: number; todayPresent: number; totalCompanies: number; monthTotalHours: number; monthOvertime: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryView, setSummaryView] = useState<"daily" | "monthly" | "total">("daily");

  const today = useMemo(() => formatDate(new Date()), []);
  const currentMonth = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  useEffect(() => {
    fetch(`/api/puantaj/dashboard?date=${today}&month=${currentMonth}`)
      .then((r) => r.json())
      .then((data) => {
        setProjectStats(
          (data.projectStats || []).filter((ps: ProjectStat) => ps.projectId)
        );
        if (data.mainStats) setMainDashStats({ totalWorkers: data.mainStats.totalWorkers, white: data.mainStats.white ?? 0, blue: data.mainStats.blue ?? 0, whitePresent: data.mainStats.whitePresent ?? 0, bluePresent: data.mainStats.bluePresent ?? 0, todayPresent: data.mainStats.todayPresent, todayLeave: data.mainStats.todayLeave ?? 0, companyName: data.mainStats.companyName ?? "", monthTotalHours: data.mainStats.monthTotalHours ?? 0, monthOvertime: data.mainStats.monthOvertime ?? 0 });
        if (data.subStats) setSubDashStats({ totalWorkers: data.subStats.totalWorkers, white: data.subStats.white ?? 0, blue: data.subStats.blue ?? 0, whitePresent: data.subStats.whitePresent ?? 0, bluePresent: data.subStats.bluePresent ?? 0, todayPresent: data.subStats.todayPresent, totalCompanies: data.subStats.totalCompanies ?? 0, monthTotalHours: data.subStats.monthTotalHours ?? 0, monthOvertime: data.subStats.monthOvertime ?? 0 });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [today, currentMonth]);

  // ─── İstatistik (tarih aralığı) ───
  const [startDate, setStartDate] = useState(() => {
    const [s] = getPresetRange("thisWeek");
    return formatDate(s);
  });
  const [endDate, setEndDate] = useState(() => formatDate(new Date()));
  const [preset, setPreset] = useState("thisWeek");
  const [mainCompany, setMainCompany] = useState<CompanyTotals | null>(null);
  const [subCompany, setSubCompany] = useState<SubCompanyTotals | null>(null);
  const [statProjects, setStatProjects] = useState<StatProject[]>([]);
  const [dailyStats, setDailyStats] = useState<DayStat[]>([]);
  const [totalDays, setTotalDays] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [subFilterProject, setSubFilterProject] = useState("all");

  const handlePreset = (key: string) => {
    setPreset(key);
    if (key === "custom") return;
    const [s, e] = getPresetRange(key);
    setStartDate(formatDate(s));
    setEndDate(formatDate(e));
  };

  useEffect(() => {
    setStatsLoading(true);
    fetch(`/api/puantaj/istatistik?startDate=${startDate}&endDate=${endDate}`)
      .then((r) => r.json())
      .then((data) => {
        setMainCompany(data.mainCompany || null);
        setSubCompany(data.subCompany || null);
        setStatProjects(data.projects || []);
        setDailyStats(data.dailyStats || []);
        setTotalDays(data.totalDays || 0);
      })
      .catch(console.error)
      .finally(() => setStatsLoading(false));
  }, [startDate, endDate]);

  const chartData = useMemo(
    () => dailyStats.map((d) => ({
      name: `${shortDate(d.date)} ${turkishDay(d.date)}`,
      Gelen: d.present,
      Gelmeyen: d.absent,
      İzinli: d.leave,
    })),
    [dailyStats]
  );

  // Alt Yüklenici proje filtresi
  const filteredSubProjects = useMemo(() => {
    const subs = statProjects.filter(p => p.sub.workers > 0);
    if (subFilterProject === "all") return subs;
    return subs.filter(p => p.projectId === subFilterProject);
  }, [statProjects, subFilterProject]);

  const filteredSubTotals = useMemo(() => {
    if (subFilterProject === "all" && subCompany) {
      return { workers: subCompany.totalWorkers, present: subCompany.present, absent: subCompany.absent, hours: subCompany.hours, overtime: subCompany.overtime };
    }
    return {
      workers: filteredSubProjects.reduce((s, p) => s + p.sub.workers, 0),
      present: filteredSubProjects.reduce((s, p) => s + p.sub.present, 0),
      absent: filteredSubProjects.reduce((s, p) => s + p.sub.absent, 0),
      hours: Math.round(filteredSubProjects.reduce((s, p) => s + p.sub.hours, 0) * 10) / 10,
      overtime: Math.round(filteredSubProjects.reduce((s, p) => s + p.sub.overtime, 0) * 10) / 10,
    };
  }, [filteredSubProjects, subCompany, subFilterProject]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <FolderKanban className="h-7 w-7 text-primary" />
          Puantaj — Proje Seçimi
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Puantaj girişi yapmak istediğiniz projeyi seçin
        </p>
        <p className="text-sm font-medium text-muted-foreground mt-2">
          {new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Bugünkü Özet: Ana Firma & Alt Yüklenici */}
      {(mainDashStats || subDashStats) && (
        <div className="space-y-3">
          {/* Günlük / Aylık / Toplam seçici */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
            {(["daily", "monthly", "total"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setSummaryView(v)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  summaryView === v ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v === "daily" ? "Günlük" : v === "monthly" ? "Aylık" : "Toplam"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {mainDashStats && (
            <Card className="border-blue-200 bg-blue-50/30 dark:bg-blue-950/20">
              <CardContent className="px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold">{mainDashStats.companyName || "Ana Firma"}</span>
                </div>
                {summaryView === "daily" && (
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-lg font-bold text-sky-600">{mainDashStats.white}</p>
                      <p className="text-[10px] text-muted-foreground">B.Yaka</p>
                      <p className="text-[10px] text-green-600 font-medium">{mainDashStats.whitePresent} geldi</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-indigo-600">{mainDashStats.blue}</p>
                      <p className="text-[10px] text-muted-foreground">M.Yaka</p>
                      <p className="text-[10px] text-green-600 font-medium">{mainDashStats.bluePresent} geldi</p>
                    </div>
                    <div className="border-l pl-4 text-center">
                      <p className="text-lg font-bold">{mainDashStats.totalWorkers}</p>
                      <p className="text-[10px] text-muted-foreground">Toplam</p>
                      <p className="text-[10px] text-green-600 font-medium">{mainDashStats.todayPresent} geldi</p>
                    </div>
                  </div>
                )}
                {summaryView === "monthly" && (
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-lg font-bold text-sky-600">{mainDashStats.white}</p>
                      <p className="text-[10px] text-muted-foreground">B.Yaka</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-indigo-600">{mainDashStats.blue}</p>
                      <p className="text-[10px] text-muted-foreground">M.Yaka</p>
                    </div>
                    <div className="border-l pl-4 text-center">
                      <p className="text-lg font-bold">{mainDashStats.totalWorkers}</p>
                      <p className="text-[10px] text-muted-foreground">Toplam</p>
                    </div>
                    <div className="border-l pl-4 text-center">
                      <p className="text-lg font-bold text-blue-600">{Math.round(mainDashStats.monthTotalHours).toLocaleString("tr-TR")}</p>
                      <p className="text-[10px] text-muted-foreground">Saat</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-orange-600">{Math.round(mainDashStats.monthOvertime)}</p>
                      <p className="text-[10px] text-muted-foreground">Mesai</p>
                    </div>
                  </div>
                )}
                {summaryView === "total" && (
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-lg font-bold text-sky-600">{mainDashStats.white}</p>
                      <p className="text-[10px] text-muted-foreground">B.Yaka</p>
                      <p className="text-[10px] text-green-600 font-medium">{mainDashStats.whitePresent} geldi</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-indigo-600">{mainDashStats.blue}</p>
                      <p className="text-[10px] text-muted-foreground">M.Yaka</p>
                      <p className="text-[10px] text-green-600 font-medium">{mainDashStats.bluePresent} geldi</p>
                    </div>
                    <div className="border-l pl-4 text-center">
                      <p className="text-lg font-bold">{mainDashStats.totalWorkers}</p>
                      <p className="text-[10px] text-muted-foreground">Toplam</p>
                      <p className="text-[10px] text-green-600 font-medium">{mainDashStats.todayPresent} geldi</p>
                    </div>
                    <div className="border-l pl-4 text-center">
                      <p className="text-lg font-bold text-blue-600">{Math.round(mainDashStats.monthTotalHours).toLocaleString("tr-TR")}</p>
                      <p className="text-[10px] text-muted-foreground">Saat</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-orange-600">{Math.round(mainDashStats.monthOvertime)}</p>
                      <p className="text-[10px] text-muted-foreground">Mesai</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {subDashStats && subDashStats.totalWorkers > 0 && (
            <Card className="border-orange-200 bg-orange-50/30 dark:bg-orange-950/20">
              <CardContent className="px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <HardHat className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-semibold">Alt Yüklenici</span>
                  {subDashStats.totalCompanies > 0 && <span className="text-xs text-muted-foreground">({subDashStats.totalCompanies} firma)</span>}
                </div>
                {summaryView === "daily" && (
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-lg font-bold text-sky-600">{subDashStats.white}</p>
                      <p className="text-[10px] text-muted-foreground">B.Yaka</p>
                      <p className="text-[10px] text-green-600 font-medium">{subDashStats.whitePresent} geldi</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-indigo-600">{subDashStats.blue}</p>
                      <p className="text-[10px] text-muted-foreground">M.Yaka</p>
                      <p className="text-[10px] text-green-600 font-medium">{subDashStats.bluePresent} geldi</p>
                    </div>
                    <div className="border-l pl-4 text-center">
                      <p className="text-lg font-bold">{subDashStats.totalWorkers}</p>
                      <p className="text-[10px] text-muted-foreground">Toplam</p>
                      <p className="text-[10px] text-green-600 font-medium">{subDashStats.todayPresent} geldi</p>
                    </div>
                  </div>
                )}
                {summaryView === "monthly" && (
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-lg font-bold text-sky-600">{subDashStats.white}</p>
                      <p className="text-[10px] text-muted-foreground">B.Yaka</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-indigo-600">{subDashStats.blue}</p>
                      <p className="text-[10px] text-muted-foreground">M.Yaka</p>
                    </div>
                    <div className="border-l pl-4 text-center">
                      <p className="text-lg font-bold">{subDashStats.totalWorkers}</p>
                      <p className="text-[10px] text-muted-foreground">Toplam</p>
                    </div>
                    <div className="border-l pl-4 text-center">
                      <p className="text-lg font-bold text-blue-600">{Math.round(subDashStats.monthTotalHours).toLocaleString("tr-TR")}</p>
                      <p className="text-[10px] text-muted-foreground">Saat</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-orange-600">{Math.round(subDashStats.monthOvertime)}</p>
                      <p className="text-[10px] text-muted-foreground">Mesai</p>
                    </div>
                  </div>
                )}
                {summaryView === "total" && (
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-lg font-bold text-sky-600">{subDashStats.white}</p>
                      <p className="text-[10px] text-muted-foreground">B.Yaka</p>
                      <p className="text-[10px] text-green-600 font-medium">{subDashStats.whitePresent} geldi</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-indigo-600">{subDashStats.blue}</p>
                      <p className="text-[10px] text-muted-foreground">M.Yaka</p>
                      <p className="text-[10px] text-green-600 font-medium">{subDashStats.bluePresent} geldi</p>
                    </div>
                    <div className="border-l pl-4 text-center">
                      <p className="text-lg font-bold">{subDashStats.totalWorkers}</p>
                      <p className="text-[10px] text-muted-foreground">Toplam</p>
                      <p className="text-[10px] text-green-600 font-medium">{subDashStats.todayPresent} geldi</p>
                    </div>
                    <div className="border-l pl-4 text-center">
                      <p className="text-lg font-bold text-blue-600">{Math.round(subDashStats.monthTotalHours).toLocaleString("tr-TR")}</p>
                      <p className="text-[10px] text-muted-foreground">Saat</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-orange-600">{Math.round(subDashStats.monthOvertime)}</p>
                      <p className="text-[10px] text-muted-foreground">Mesai</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          </div>
        </div>
      )}

      {/* Proje Kartları */}
      {projectStats.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">Henüz puantaj verisi yok</p>
            <p className="text-sm mb-4">
              Projelere ekip ve çalışan atayarak puantaj girişine başlayabilirsiniz.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projectStats.map((ps) => (
            <ProjectPuantajCard key={ps.projectId} stat={ps} />
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* İstatistikler Bölümü                                */}
      {/* ════════════════════════════════════════════════════ */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          İstatistikler
        </h2>

        {/* Tarih Aralığı */}
        <Card className="mb-4">
          <CardContent className="py-3 px-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: "today", label: "Bugün" },
                    { key: "yesterday", label: "Dün" },
                    { key: "thisWeek", label: "Bu Hafta" },
                    { key: "lastWeek", label: "Geçen Hafta" },
                    { key: "last7", label: "Son 7 Gün" },
                    { key: "thisMonth", label: "Bu Ay" },
                    { key: "lastMonth", label: "Geçen Ay" },
                    { key: "last30", label: "Son 30 Gün" },
                  ].map((p) => (
                    <Button
                      key={p.key}
                      variant={preset === p.key ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-7 px-2.5"
                      onClick={() => handlePreset(p.key)}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-end gap-2 shrink-0">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Başlangıç</Label>
                  <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPreset("custom"); }} className="h-8 text-sm w-36" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Bitiş</Label>
                  <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPreset("custom"); }} className="h-8 text-sm w-36" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── ANA FİRMA ── */}
        {mainCompany && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Building2 className="h-5 w-5 text-blue-600" />
              <h3 className="text-base font-semibold">Ana Firma</h3>
              <Badge variant="outline">{mainCompany.totalWorkers} çalışan</Badge>
              <Badge variant="secondary" className="text-[11px]">B.Yaka: {mainCompany.white}</Badge>
              <Badge variant="secondary" className="text-[11px]">M.Yaka: {mainCompany.blue}</Badge>
            </div>

            {statProjects.filter(p => p.main.workers > 0).length > 0 ? (
              <>
                {/* Tablo */}
                <Card className="mb-3">
                  <CardContent className="px-0 py-2">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Proje</TableHead>
                            <TableHead className="text-xs text-center">Toplam</TableHead>
                            <TableHead className="text-xs text-center text-green-700">Gelen</TableHead>
                            <TableHead className="text-xs text-center text-blue-700">İ.İzin</TableHead>
                            <TableHead className="text-xs text-center text-amber-700">H.Tatili</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {statProjects.filter(p => p.main.workers > 0).map(p => (
                            <TableRow key={p.projectId}>
                              <TableCell className="text-xs font-medium py-1.5">{p.projectName}</TableCell>
                              <TableCell className="text-xs text-center py-1.5 font-semibold">{p.main.workers}</TableCell>
                              <TableCell className="text-xs text-center py-1.5 font-semibold text-green-700">{p.main.present}</TableCell>
                              <TableCell className="text-xs text-center py-1.5"><span className={p.main.adminLeave > 0 ? "text-blue-600 font-semibold" : "text-muted-foreground"}>{p.main.adminLeave || "-"}</span></TableCell>
                              <TableCell className="text-xs text-center py-1.5"><span className={p.main.dayOff > 0 ? "text-amber-600 font-semibold" : "text-muted-foreground"}>{p.main.dayOff || "-"}</span></TableCell>
                            </TableRow>
                          ))}
                          {statProjects.filter(p => p.main.workers > 0).length > 1 && (
                            <TableRow className="bg-muted/40 font-semibold">
                              <TableCell className="text-xs py-1.5">Toplam</TableCell>
                              <TableCell className="text-xs text-center py-1.5">{mainCompany.totalWorkers}</TableCell>
                              <TableCell className="text-xs text-center py-1.5 text-green-700">{mainCompany.present}</TableCell>
                              <TableCell className="text-xs text-center py-1.5 text-blue-600">{mainCompany.adminLeave}</TableCell>
                              <TableCell className="text-xs text-center py-1.5 text-amber-600">{mainCompany.dayOff}</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Grafik */}
                {statProjects.filter(p => p.main.workers > 0).length > 0 && (
                  <Card className="mb-3">
                    <CardContent className="px-2 py-3">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart
                          data={statProjects.filter(p => p.main.workers > 0).map(p => ({
                            name: p.projectName.length > 15 ? p.projectName.slice(0, 15) + "…" : p.projectName,
                            Toplam: p.main.workers,
                            Gelen: p.main.present,
                            "İ.İzin": p.main.adminLeave,
                            "H.Tatili": p.main.dayOff,
                          }))}
                          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} width={30} />
                          <Tooltip contentStyle={{ fontSize: 12 }} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="Toplam" fill="#94a3b8" radius={[2, 2, 0, 0]} />
                          <Bar dataKey="Gelen" fill="#22c55e" radius={[2, 2, 0, 0]} />
                          <Bar dataKey="İ.İzin" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                          <Bar dataKey="H.Tatili" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground mb-3">Bu dönemde ana firma puantaj kaydı yok.</p>
            )}
          </div>
        )}

        {/* ── ALT YÜKLENİCİ ── */}
        {subCompany && subCompany.totalWorkers > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <HardHat className="h-5 w-5 text-orange-600" />
              <h3 className="text-base font-semibold">Alt Yüklenici</h3>
              <Badge variant="outline">{subCompany.totalWorkers} çalışan</Badge>
            </div>

            {statProjects.filter(p => p.sub.workers > 0).length > 0 ? (
              <>
                {/* Tablo */}
                <Card className="mb-3">
                  <CardContent className="px-0 py-2">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Proje</TableHead>
                            <TableHead className="text-xs text-center">Toplam</TableHead>
                            <TableHead className="text-xs text-center text-green-700">Gelen</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {statProjects.filter(p => p.sub.workers > 0).map(p => (
                            <TableRow key={p.projectId}>
                              <TableCell className="text-xs font-medium py-1.5">{p.projectName}</TableCell>
                              <TableCell className="text-xs text-center py-1.5 font-semibold">{p.sub.workers}</TableCell>
                              <TableCell className="text-xs text-center py-1.5 font-semibold text-green-700">{p.sub.present}</TableCell>
                            </TableRow>
                          ))}
                          {statProjects.filter(p => p.sub.workers > 0).length > 1 && (
                            <TableRow className="bg-muted/40 font-semibold">
                              <TableCell className="text-xs py-1.5">Toplam</TableCell>
                              <TableCell className="text-xs text-center py-1.5">{subCompany.totalWorkers}</TableCell>
                              <TableCell className="text-xs text-center py-1.5 text-green-700">{subCompany.present}</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Grafik */}
                {statProjects.filter(p => p.sub.workers > 0).length > 0 && (
                  <Card className="mb-3">
                    <CardContent className="px-2 py-3">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart
                          data={statProjects.filter(p => p.sub.workers > 0).map(p => ({
                            name: p.projectName.length > 15 ? p.projectName.slice(0, 15) + "…" : p.projectName,
                            Toplam: p.sub.workers,
                            Gelen: p.sub.present,
                          }))}
                          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} width={30} />
                          <Tooltip contentStyle={{ fontSize: 12 }} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="Toplam" fill="#94a3b8" radius={[2, 2, 0, 0]} />
                          <Bar dataKey="Gelen" fill="#22c55e" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground mb-3">Bu dönemde alt yüklenici puantaj kaydı yok.</p>
            )}
          </div>
        )}

        {/* Gün Gün Grafik */}
        {chartData.length > 1 && (
          <Card className="mb-4">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Günlük Devam Durumu
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={chartData.length > 14 ? Math.floor(chartData.length / 10) : 0} />
                  <YAxis tick={{ fontSize: 11 }} width={35} />
                  <Tooltip contentStyle={{ fontSize: 12 }} labelStyle={{ fontWeight: 600 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Gelen" fill="#22c55e" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Gelmeyen" fill="#ef4444" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="İzinli" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Gün Gün Tablo */}
        {dailyStats.length > 0 && dailyStats.length <= 31 && (
          <Card className="mb-4">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                Günlük Detay
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-2">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs w-28">Tarih</TableHead>
                      <TableHead className="text-xs text-center">Gün</TableHead>
                      <TableHead className="text-xs text-center text-green-700">Gelen</TableHead>
                      <TableHead className="text-xs text-center text-red-700">Gelmeyen</TableHead>
                      <TableHead className="text-xs text-center text-amber-700">İzinli</TableHead>
                      <TableHead className="text-xs text-center">Kayıt</TableHead>
                      <TableHead className="text-xs text-center">Saat</TableHead>
                      <TableHead className="text-xs text-center text-orange-700">Mesai</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyStats.map((d) => {
                      const dateObj = new Date(d.date + "T00:00:00");
                      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                      return (
                        <TableRow key={d.date} className={isWeekend ? "bg-muted/40" : ""}>
                          <TableCell className="text-xs font-medium py-1.5">{dateObj.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</TableCell>
                          <TableCell className="text-xs text-center py-1.5"><span className={isWeekend ? "text-red-500 font-medium" : "text-muted-foreground"}>{turkishDay(d.date)}</span></TableCell>
                          <TableCell className="text-xs text-center py-1.5 font-semibold text-green-700">{d.present || "-"}</TableCell>
                          <TableCell className="text-xs text-center py-1.5"><span className={d.absent > 0 ? "font-semibold text-red-600" : "text-muted-foreground"}>{d.absent || "-"}</span></TableCell>
                          <TableCell className="text-xs text-center py-1.5"><span className={d.leave > 0 ? "text-amber-600" : "text-muted-foreground"}>{d.leave || "-"}</span></TableCell>
                          <TableCell className="text-xs text-center py-1.5 text-muted-foreground">{d.total || "-"}</TableCell>
                          <TableCell className="text-xs text-center py-1.5">{d.hours > 0 ? d.hours.toLocaleString("tr-TR") : "-"}</TableCell>
                          <TableCell className="text-xs text-center py-1.5"><span className={d.overtime > 0 ? "text-orange-600 font-medium" : "text-muted-foreground"}>{d.overtime > 0 ? d.overtime.toLocaleString("tr-TR") : "-"}</span></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}

/* ─── Proje Kartı ─── */
function ProjectPuantajCard({ stat }: { stat: ProjectStat }) {
  const rate =
    stat.workerCount > 0
      ? Math.round((stat.todayPresent / stat.workerCount) * 100)
      : 0;
  const pid = stat.projectId ?? "";

  return (
    <Card className="group hover:shadow-lg hover:border-primary/30 transition-all duration-200 flex flex-col">
      <Link href={`/puantaj/gunluk?project=${pid}`} className="block">
        <CardHeader className="pb-3 cursor-pointer">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg group-hover:text-primary transition-colors">
              {stat.projectName}
            </CardTitle>
            <Badge variant="outline" className="text-xs shrink-0">
              {stat.companyCount} firma
            </Badge>
          </div>
        </CardHeader>
      </Link>
      <CardContent className="flex-1 space-y-4">
        {/* İstatistikler */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border p-2">
            <p className="text-lg font-bold">{stat.workerCount}</p>
            <p className="text-[10px] text-muted-foreground">Toplam</p>
          </div>
          <div className="rounded-lg border p-2">
            <p className="text-lg font-bold text-blue-600">{stat.mainPresent}</p>
            <p className="text-[10px] text-muted-foreground">Ana Firma Geldi</p>
          </div>
          <div className="rounded-lg border p-2">
            <p className="text-lg font-bold text-orange-600">{stat.subPresent}</p>
            <p className="text-[10px] text-muted-foreground">Alt Yüklenici Geldi</p>
          </div>
        </div>

        {/* Katılım çubuğu */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Katılım</span>
            <span className="font-medium">%{rate}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                rate >= 80
                  ? "bg-green-500"
                  : rate >= 50
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${rate}%` }}
            />
          </div>
        </div>

        {/* Aylık */}
        <div className="flex justify-between text-xs border-t pt-2">
          <span className="text-muted-foreground">
            Aylık:{" "}
            <strong className="text-foreground">
              {stat.monthHours.toLocaleString("tr-TR")}
            </strong>{" "}
            saat
          </span>
          <span className="text-muted-foreground">
            Mesai:{" "}
            <strong className="text-orange-600">{stat.monthOvertime}</strong>{" "}
            saat
          </span>
        </div>

        {/* Ana butonlar */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button variant="default" size="sm" className="w-full" asChild>
            <Link href={`/puantaj/gunluk?project=${pid}`}>
              <CalendarDays className="h-3.5 w-3.5 mr-1" />
              Firma Puantaj
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href={`/puantaj/taseron?project=${pid}`}>
              <HardHat className="h-3.5 w-3.5 mr-1" />
              Alt Yüklenici
            </Link>
          </Button>
        </div>

        {/* Hızlı linkler */}
        <div className="grid grid-cols-3 gap-2">
          <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
            <Link href={`/puantaj/aylik?project=${pid}`}>
              <CalendarRange className="h-3 w-3 mr-1" />
              Aylık
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
            <Link href={`/puantaj/raporlar?project=${pid}`}>
              <BarChart3 className="h-3 w-3 mr-1" />
              Raporlar
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
            <Link href={`/puantaj/calisanlar?project=${pid}`}>
              <Users className="h-3 w-3 mr-1" />
              Çalışanlar
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Özet Kart ─── */
function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color?: string }) {
  return (
    <Card>
      <CardContent className="px-3 py-3">
        <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
          {icon}
          <span className="text-[11px]">{label}</span>
        </div>
        <p className={`text-xl font-bold ${color ?? ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
