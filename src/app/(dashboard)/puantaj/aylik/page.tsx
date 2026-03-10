"use client";

import { useEffect, useState, useCallback, useMemo, Fragment, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  ChevronLeft,
  ChevronRight,
  Users,
  FolderKanban,
} from "lucide-react";
import * as XLSX from "xlsx";
import { CompanyTypeSegment, PuantajPagination } from "../components";

type AttendanceStatus = "PRESENT" | "HALF_DAY" | "ABSENT" | "DAY_OFF";

interface Team {
  id: string;
  name: string;
  sortOrder: number;
  company: { id: string; name: string; type: string; sortOrder: number };
  discipline: { name: string };
}

interface AttendanceRecord {
  date: string;
  shift: string;
  status: AttendanceStatus;
  totalHours: number;
  overtime: number;
}

interface WorkerRow {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  team: Team;
  attendances: AttendanceRecord[];
}

interface Project {
  id: string;
  name: string;
}

const STATUS_SHORT: Record<AttendanceStatus, string> = {
  PRESENT: "G", HALF_DAY: "Y", ABSENT: "-", DAY_OFF: "HT",
};

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: "Geldi", HALF_DAY: "Yarım Gün", ABSENT: "Gelmedi", DAY_OFF: "Hafta Tatili",
};

const STATUS_SHORT_COLORS: Record<AttendanceStatus, string> = {
  PRESENT: "text-green-600 font-bold", HALF_DAY: "text-blue-600",
  ABSENT: "text-red-500", DAY_OFF: "text-gray-400",
};

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getMonthDates(year: number, month: number): string[] {
  const dates: string[] = [];
  const last = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= last; i++) {
    dates.push(formatDate(new Date(year, month, i)));
  }
  return dates;
}

function getDayName(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("tr-TR", { weekday: "short" });
}

function isWeekend(dateStr: string): boolean {
  const day = new Date(dateStr + "T00:00:00").getDay();
  return day === 0 || day === 6;
}

const todayStr = formatDate(new Date());

export default function AylikPuantajPageWrapper() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Yükleniyor...</div>}>
      <AylikPuantajPage />
    </Suspense>
  );
}

function AylikPuantajPage() {
  const searchParams = useSearchParams();
  const initialProject = searchParams.get("project") || "all";

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [filterProject, setFilterProject] = useState(initialProject);
  const [filterCompany, setFilterCompany] = useState("all");
  const [filterCompanyType, setFilterCompanyType] = useState("all");
  const [filterTeam, setFilterTeam] = useState("all");
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const dates = useMemo(() => getMonthDates(year, month), [year, month]);
  const monthName = new Date(year, month, 1).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

  useEffect(() => {
    Promise.all([
      fetch("/api/projeler").then((r) => r.json()),
      fetch("/api/ekipler").then((r) => r.json()),
    ]).then(([projData, teamData]) => {
      setProjects(projData);
      setTeams(teamData);
      const compMap = new Map<string, string>();
      teamData.forEach((t: Team) => compMap.set(t.company.id, t.company.name));
      setCompanies(Array.from(compMap, ([id, name]) => ({ id, name })));
    });
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      date: dates[0],
      endDate: dates[dates.length - 1],
      shift: "all",
    });
    if (filterTeam !== "all") params.set("teamId", filterTeam);
    if (filterCompany !== "all") params.set("companyId", filterCompany);
    if (filterCompanyType !== "all") params.set("companyType", filterCompanyType);
    if (filterProject !== "all") params.set("projectId", filterProject);

    fetch(`/api/puantaj?${params}`)
      .then((r) => r.json())
      .then((data: WorkerRow[]) => {
        setWorkers(data);
        setCurrentPage(1);
      })
      .finally(() => setLoading(false));
  }, [dates, filterTeam, filterCompany, filterCompanyType, filterProject]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Firma listesini companyType'a göre filtrele
  const filteredCompanies = useMemo(() => {
    if (filterCompanyType === "all") return companies;
    return companies.filter((c) => {
      const team = teams.find((t) => t.company.id === c.id);
      return team && team.company.type === filterCompanyType;
    });
  }, [companies, teams, filterCompanyType]);

  const changeMonth = (offset: number) => {
    let m = month + offset;
    let y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m);
    setYear(y);
  };

  // Firmaya göre grupla (sayfalanmış)
  const totalPages = Math.max(1, Math.ceil(workers.length / pageSize));
  const paginatedGroupedWorkers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const pageWorkers = workers.slice(start, start + pageSize);
    const groups = new Map<string, { company: string; workers: WorkerRow[] }>();
    pageWorkers.forEach((w) => {
      const compId = w.team.company.id;
      if (!groups.has(compId)) groups.set(compId, { company: w.team.company.name, workers: [] });
      groups.get(compId)!.workers.push(w);
    });
    return Array.from(groups.values());
  }, [workers, currentPage, pageSize]);

  // Toplam istatistikler
  const totals = useMemo(() => {
    let totalHours = 0, totalOvertime = 0, totalPresent = 0, totalAbsent = 0;
    workers.forEach((w) => {
      w.attendances.forEach((a) => {
        totalHours += a.totalHours;
        totalOvertime += a.overtime;
        if (a.status === "PRESENT" || a.status === "HALF_DAY") totalPresent++;
        if (a.status === "ABSENT") totalAbsent++;
      });
    });
    return { totalHours, totalOvertime, totalPresent, totalAbsent };
  }, [workers]);

  const exportExcel = () => {
    const rows = workers.map((w, i) => {
      const base: Record<string, string | number> = {
        "#": i + 1,
        Firma: w.team.company.name,
        Ekip: w.team.name,
        "Ad Soyad": `${w.firstName} ${w.lastName}`,
        Görevi: w.role,
      };
      const attMap = new Map(w.attendances.map((a) => [a.date, a]));
      let totalH = 0, totalO = 0, presentDays = 0;
      dates.forEach((dd) => {
        const att = attMap.get(dd);
        const dayNum = new Date(dd + "T00:00:00").getDate();
        base[`${dayNum}`] = att ? STATUS_SHORT[att.status] : (dd <= todayStr ? "X" : "");
        totalH += att?.totalHours ?? 0;
        totalO += att?.overtime ?? 0;
        if (att?.status === "PRESENT" || att?.status === "HALF_DAY") presentDays++;
      });
      base["Gün"] = presentDays;
      base["Toplam Saat"] = totalH;
      base["Mesai"] = totalO;
      return base;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Aylık Puantaj");
    XLSX.writeFile(wb, `puantaj-aylik-${year}-${String(month + 1).padStart(2, "0")}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Başlık */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Aylık Puantaj</h1>
          <p className="text-muted-foreground text-sm">{monthName} - Aylık çalışma tablosu</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium text-sm min-w-[120px] text-center">{monthName}</span>
          <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Özet */}
      <div className="flex flex-wrap gap-4 text-sm">
        <Badge variant="secondary" className="text-sm py-1 px-3">
          <Users className="h-3.5 w-3.5 mr-1" /> {workers.length} Çalışan
        </Badge>
        <Badge variant="secondary" className="text-sm py-1 px-3 text-green-700">
          {totals.totalPresent} geldi
        </Badge>
        <Badge variant="secondary" className="text-sm py-1 px-3 text-red-700">
          {totals.totalAbsent} gelmedi
        </Badge>
        <Badge variant="secondary" className="text-sm py-1 px-3">
          Toplam: {totals.totalHours.toLocaleString("tr-TR")} saat
        </Badge>
        <Badge variant="secondary" className="text-sm py-1 px-3 text-orange-700">
          Mesai: {totals.totalOvertime} saat
        </Badge>
      </div>

      {/* Ana Yüklenici / Taşeron Segment */}
      <CompanyTypeSegment value={filterCompanyType} onChange={(v) => { setFilterCompanyType(v); setFilterCompany("all"); setFilterTeam("all"); }} />

      {/* Filtreler */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-52">
            <FolderKanban className="h-4 w-4 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Proje" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Projeler</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterCompany} onValueChange={(v) => { setFilterCompany(v); setFilterTeam("all"); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Firma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Firmalar</SelectItem>
            {filteredCompanies.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterTeam} onValueChange={setFilterTeam}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Ekip" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Ekipler</SelectItem>
            {teams
              .filter((t) => filterCompany === "all" || t.company.id === filterCompany)
              .map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Button variant="outline" size="sm" onClick={exportExcel}>
          <Download className="h-4 w-4 mr-1" /> Excel
        </Button>
      </div>

      {/* Tablo */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : workers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">Çalışan bulunamadı</p>
          </CardContent>
        </Card>
      ) : (
        <>
        <Card className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 sticky left-0 bg-background z-10">#</TableHead>
                  <TableHead className="w-28 sticky left-10 bg-background z-10">Firma</TableHead>
                  <TableHead className="min-w-[150px] sticky left-[152px] bg-background z-10">Ad Soyad</TableHead>
                  <TableHead className="w-20 sticky left-[302px] bg-background z-10">Görevi</TableHead>
                  {dates.map((dd) => {
                    const dayNum = new Date(dd + "T00:00:00").getDate();
                    const weekend = isWeekend(dd);
                    return (
                      <TableHead key={dd} className={`w-9 text-center px-0.5 ${weekend ? "bg-muted/50" : ""}`}>
                        <div className="text-[9px] text-muted-foreground leading-tight">{getDayName(dd)}</div>
                        <div className="text-xs font-medium">{dayNum}</div>
                      </TableHead>
                    );
                  })}
                  <TableHead className="w-12 text-center">Gün</TableHead>
                  <TableHead className="w-14 text-center">Saat</TableHead>
                  <TableHead className="w-14 text-center">Mesai</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedGroupedWorkers.map((group) => (
                  <Fragment key={`grp-${group.company}`}>
                    <TableRow className="bg-muted/40">
                      <TableCell colSpan={4 + dates.length + 3} className="py-1 sticky left-0">
                        <span className="font-semibold text-xs">{group.company}</span>
                        <Badge variant="secondary" className="ml-2 text-[10px]">{group.workers.length}</Badge>
                      </TableCell>
                    </TableRow>
                    {group.workers.map((w, idx) => {
                      const attMap = new Map(w.attendances.map((a) => [a.date, a]));
                      let totalH = 0, totalO = 0, presentDays = 0;
                      return (
                        <TableRow key={w.id}>
                          <TableCell className="text-muted-foreground text-xs sticky left-0 bg-background">{idx + 1}</TableCell>
                          <TableCell className="text-[10px] sticky left-10 bg-background">{w.team.company.name}</TableCell>
                          <TableCell className="font-medium text-xs sticky left-[152px] bg-background whitespace-nowrap">
                            {w.firstName} {w.lastName}
                          </TableCell>
                          <TableCell className="text-[10px] text-muted-foreground sticky left-[302px] bg-background">{w.role}</TableCell>
                          {dates.map((dd) => {
                            const att = attMap.get(dd);
                            if (att) {
                              totalH += att.totalHours;
                              totalO += att.overtime;
                              if (att.status === "PRESENT" || att.status === "HALF_DAY") presentDays++;
                            }
                            const status = att?.status ?? "ABSENT";
                            const weekend = isWeekend(dd);
                            const isPast = !att && dd <= todayStr;
                            return (
                              <TableCell
                                key={dd}
                                className={`text-center px-0.5 ${weekend ? "bg-muted/30" : ""}`}
                                title={`${dd}: ${att ? STATUS_LABELS[status] : isPast ? "Kayıt yok" : ""}${att ? ` (${att.totalHours}s)` : ""}`}
                              >
                                <span className={`text-[10px] ${att ? STATUS_SHORT_COLORS[status] : isPast ? "text-muted-foreground/50" : ""}`}>
                                  {att ? STATUS_SHORT[status] : isPast ? "✕" : ""}
                                </span>
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center text-xs font-medium">{presentDays}</TableCell>
                          <TableCell className="text-center text-xs font-medium">{totalH}</TableCell>
                          <TableCell className="text-center text-xs font-medium text-orange-600">{totalO > 0 ? totalO : ""}</TableCell>
                        </TableRow>
                      );
                    })}
                    </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Sayfalama */}
        <PuantajPagination
          totalItems={workers.length}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
        </>
      )}
    </div>
  );
}
