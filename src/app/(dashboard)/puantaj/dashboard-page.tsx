"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";
import Link from "next/link";
import { CompanyTypeSegment } from "./components";

interface Project {
  id: string;
  name: string;
  status: string;
  client?: string;
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

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function PuantajDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectStats, setProjectStats] = useState<ProjectStat[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterCompanyType, setFilterCompanyType] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const today = useMemo(() => formatDate(new Date()), []);

  useEffect(() => {
    Promise.all([
      fetch("/api/projeler").then((r) => r.json()),
      fetch(`/api/puantaj/dashboard?date=${today}&month=${selectedMonth}${filterCompanyType !== "all" ? `&companyType=${filterCompanyType}` : ""}`).then((r) => r.json()),
    ])
      .then(([projectData, dashData]) => {
        setProjects(projectData);
        setStats(dashData.stats);
        setProjectStats(dashData.projectStats || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [today, selectedMonth, filterCompanyType]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const attendanceRate = stats && stats.activeWorkers > 0
    ? Math.round((stats.todayPresent / stats.activeWorkers) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Puantaj Genel Bakış</h1>
          <p className="text-muted-foreground text-sm">
            Tüm projelerin günlük ve aylık puantaj özeti
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border rounded-md px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      {/* Ana Yüklenici / Taşeron Segment */}
      <CompanyTypeSegment value={filterCompanyType} onChange={setFilterCompanyType} />

      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Toplam Çalışan"
          value={stats?.totalWorkers ?? 0}
          color="text-foreground"
        />
        <StatCard
          icon={<UserCheck className="h-4 w-4" />}
          label="Bugün Gelen"
          value={stats?.todayPresent ?? 0}
          color="text-green-600"
          subtitle={`%${attendanceRate} katılım`}
        />
        <StatCard
          icon={<UserX className="h-4 w-4" />}
          label="Bugün Gelmeyen"
          value={stats?.todayAbsent ?? 0}
          color="text-red-600"
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Aylık Saat"
          value={stats?.monthTotalHours ?? 0}
          color="text-foreground"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Aylık Mesai"
          value={stats?.monthOvertime ?? 0}
          color="text-orange-600"
          subtitle="saat"
        />
      </div>

      {/* Proje Kartları */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Proje Bazlı Puantaj</h2>
        {projectStats.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p className="text-lg font-medium">Henüz puantaj verisi yok</p>
              <p className="text-sm mb-4">
                Projelere ekip ve çalışan atayarak puantaj girişine başlayabilirsiniz.
              </p>
              <Button asChild>
                <Link href="/puantaj/gunluk">Puantaj Girişi Yap</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectStats.map((ps) => (
              <ProjectCard key={ps.projectId ?? "noproj"} stat={ps} />
            ))}
          </div>
        )}
      </div>

      {/* Hızlı Erişim */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <QuickLink
          href="/puantaj/gunluk"
          icon={<CalendarDays className="h-5 w-5" />}
          title="Günlük Puantaj"
          description="Bugünkü yoklama girişi yap"
          color="bg-blue-500/10 text-blue-600"
        />
        <QuickLink
          href="/puantaj/calisanlar"
          icon={<Users className="h-5 w-5" />}
          title="Çalışan Yönetimi"
          description="Çalışan ekle, düzenle"
          color="bg-green-500/10 text-green-600"
        />
        <QuickLink
          href="/puantaj/raporlar"
          icon={<TrendingUp className="h-5 w-5" />}
          title="Raporlar"
          description="Aylık özetler, Excel çıktısı"
          color="bg-purple-500/10 text-purple-600"
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  subtitle?: string;
}) {
  return (
    <Card className="py-0">
      <CardContent className="px-3 py-3">
        <div className="flex items-center gap-2 mb-1 text-muted-foreground">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString("tr-TR")}</p>
        {subtitle && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ProjectCard({ stat }: { stat: ProjectStat }) {
  const rate = stat.workerCount > 0
    ? Math.round((stat.todayPresent / stat.workerCount) * 100)
    : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{stat.projectName}</CardTitle>
          <Badge variant="outline" className="text-xs">
            {stat.companyCount} firma
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Worker counts */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold">{stat.workerCount}</p>
            <p className="text-[10px] text-muted-foreground">Toplam</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-600">{stat.todayPresent}</p>
            <p className="text-[10px] text-muted-foreground">Gelen</p>
          </div>
          <div>
            <p className="text-lg font-bold text-red-600">{stat.todayAbsent}</p>
            <p className="text-[10px] text-muted-foreground">Gelmeyen</p>
          </div>
        </div>

        {/* Attendance bar */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Katılım Oranı</span>
            <span className="font-medium">%{rate}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                rate >= 80 ? "bg-green-500" : rate >= 50 ? "bg-yellow-500" : "bg-red-500"
              }`}
              style={{ width: `${rate}%` }}
            />
          </div>
        </div>

        {/* Monthly stats */}
        <div className="flex justify-between text-xs pt-1 border-t">
          <span className="text-muted-foreground">
            Aylık: <strong className="text-foreground">{stat.monthHours.toLocaleString("tr-TR")}</strong> saat
          </span>
          <span className="text-muted-foreground">
            Mesai: <strong className="text-orange-600">{stat.monthOvertime}</strong> saat
          </span>
        </div>

        {/* Action */}
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href={`/puantaj/gunluk?project=${stat.projectId ?? ""}`}>
            <CalendarDays className="h-3.5 w-3.5 mr-1" />
            Puantaj Girişi
            <ArrowRight className="h-3.5 w-3.5 ml-auto" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function QuickLink({
  href,
  icon,
  title,
  description,
  color,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="px-4 py-4 flex items-start gap-3">
          <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
          <div>
            <p className="font-medium text-sm">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
