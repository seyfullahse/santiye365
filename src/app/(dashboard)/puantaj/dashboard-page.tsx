"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Building2,
  FolderKanban,
  CalendarDays,
  TrendingUp,
  ArrowRight,
  HardHat,
  CalendarRange,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

interface ProjectStat {
  projectId: string | null;
  projectName: string;
  workerCount: number;
  todayPresent: number;
  todayAbsent: number;
  monthHours: number;
  monthOvertime: number;
  companyCount: number;
}

interface DashboardStats {
  totalWorkers: number;
  activeWorkers: number;
  todayPresent: number;
  todayAbsent: number;
  todayHalfDay: number;
  monthTotalHours: number;
  monthOvertime: number;
  totalCompanies: number;
  totalTeams: number;
}

interface CompanyTypeStats {
  totalWorkers: number;
  todayPresent: number;
  todayAbsent?: number;
  monthTotalHours: number;
  monthOvertime: number;
  totalCompanies: number;
  companyName?: string;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function PuantajDashboard() {
  const [projectStats, setProjectStats] = useState<ProjectStat[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [mainStats, setMainStats] = useState<CompanyTypeStats | null>(null);
  const [subStats, setSubStats] = useState<CompanyTypeStats | null>(null);
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => formatDate(new Date()), []);
  const currentMonth = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  useEffect(() => {
    fetch(`/api/puantaj/dashboard?date=${today}&month=${currentMonth}`)
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setMainStats(data.mainStats);
        setSubStats(data.subStats);
        setProjectStats(
          (data.projectStats || []).filter((ps: ProjectStat) => ps.projectId)
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [today, currentMonth]);

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
      </div>

      {/* Ana Firma / Taşeron Özeti */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ana Firma */}
          <Card className="border-blue-200 bg-blue-50/30 dark:bg-blue-950/10">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Building2 className="h-4 w-4" />
                {mainStats?.companyName || "Ana Firma"}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="grid grid-cols-4 gap-2">
                <MiniStat
                  icon={<Users className="h-4 w-4" />}
                  label="Çalışan"
                  value={mainStats?.totalWorkers ?? 0}
                />
                <MiniStat
                  icon={<UserCheck className="h-4 w-4 text-green-600" />}
                  label="Gelen"
                  value={mainStats?.todayPresent ?? 0}
                  color="text-green-600"
                />
                <MiniStat
                  icon={<UserX className="h-4 w-4 text-red-600" />}
                  label="Gelmedi"
                  value={mainStats?.todayAbsent ?? 0}
                  color="text-red-600"
                />
                <MiniStat
                  icon={<TrendingUp className="h-4 w-4 text-orange-600" />}
                  label="Mesai"
                  value={mainStats?.monthOvertime ?? 0}
                  color="text-orange-600"
                />
              </div>
            </CardContent>
          </Card>

          {/* Taşeron */}
          <Card className="border-amber-200 bg-amber-50/30 dark:bg-amber-950/10">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <HardHat className="h-4 w-4" />
                Taşeron ({subStats?.totalCompanies ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="grid grid-cols-3 gap-2">
                <MiniStat
                  icon={<Users className="h-4 w-4" />}
                  label="Çalışan"
                  value={subStats?.totalWorkers ?? 0}
                />
                <MiniStat
                  icon={<UserCheck className="h-4 w-4 text-green-600" />}
                  label="Bugün Gelen"
                  value={subStats?.todayPresent ?? 0}
                  color="text-green-600"
                />
                <MiniStat
                  icon={<TrendingUp className="h-4 w-4 text-orange-600" />}
                  label="Mesai"
                  value={subStats?.monthOvertime ?? 0}
                  color="text-orange-600"
                />
              </div>
            </CardContent>
          </Card>
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
            <p className="text-lg font-bold text-green-600">{stat.todayPresent}</p>
            <p className="text-[10px] text-muted-foreground">Gelen</p>
          </div>
          <div className="rounded-lg border p-2">
            <p className="text-lg font-bold text-red-600">{stat.todayAbsent}</p>
            <p className="text-[10px] text-muted-foreground">Gelmeyen</p>
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
              Taşeron
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

/* ─── Küçük İstatistik Kartı ─── */
function MiniStat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <Card className="py-0">
      <CardContent className="px-3 py-3">
        <div className="flex items-center gap-2 mb-1 text-muted-foreground">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <p className={`text-xl font-bold ${color ?? ""}`}>
          {value.toLocaleString("tr-TR")}
        </p>
      </CardContent>
    </Card>
  );
}
