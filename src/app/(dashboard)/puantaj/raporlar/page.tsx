"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  BarChart3,
  Download,
  Users,
  Building2,
  Clock,
  TrendingUp,
} from "lucide-react";
import * as XLSX from "xlsx";
import { PuantajPagination } from "../components";

interface Team {
  id: string;
  name: string;
  company: { id: string; name: string };
}

interface AttendanceRecord {
  date: string;
  status: string;
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

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getMonthDates(year: number, month: number): { start: string; end: string } {
  const start = formatDate(new Date(year, month, 1));
  const end = formatDate(new Date(year, month + 1, 0));
  return { start, end };
}

export default function RaporlarPageWrapper() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Yükleniyor...</div>}>
      <RaporlarPage />
    </Suspense>
  );
}

function RaporlarPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get("project");

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const { start, end } = useMemo(() => getMonthDates(year, month), [year, month]);
  const monthName = new Date(year, month, 1).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

  useEffect(() => {
    if (!projectId) { router.push("/puantaj"); return; }
    fetch("/api/projeler").then((r) => r.json()).then((data) => {
      const proj = data.find((p: { id: string; name: string }) => p.id === projectId);
      setProjectName(proj?.name || "");
    });
  }, [projectId, router]);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    const params = new URLSearchParams({ date: start, endDate: end, shift: "all", projectId });

    fetch(`/api/puantaj?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setWorkers(Array.isArray(data) ? data : []);
        setCurrentPage(1);
      })
      .finally(() => setLoading(false));
  }, [start, end, projectId]);

  // Firma bazlı özet
  const companySummary = useMemo(() => {
    const map = new Map<string, {
      company: string;
      workers: number;
      presentDays: number;
      absentDays: number;
      totalHours: number;
      totalOvertime: number;
    }>();

    workers.forEach((w) => {
      const compName = w.team.company.name;
      if (!map.has(compName)) {
        map.set(compName, { company: compName, workers: 0, presentDays: 0, absentDays: 0, totalHours: 0, totalOvertime: 0 });
      }
      const s = map.get(compName)!;
      s.workers++;
      w.attendances.forEach((a) => {
        if (a.status === "PRESENT" || a.status === "HALF_DAY" || a.status === "REST_DAY_WORK") s.presentDays++;
        if (a.status === "ABSENT") s.absentDays++;
        s.totalHours += a.totalHours;
        s.totalOvertime += a.overtime;
      });
    });

    return Array.from(map.values()).sort((a, b) => b.workers - a.workers);
  }, [workers]);

  // Çalışan bazlı detay
  const workerSummary = useMemo(() => {
    return workers.map((w) => {
      const presentDays = w.attendances.filter((a) => a.status === "PRESENT" || a.status === "REST_DAY_WORK").length;
      const halfDays = w.attendances.filter((a) => a.status === "HALF_DAY").length;
      const absentDays = w.attendances.filter((a) => a.status === "ABSENT").length;
      const totalHours = w.attendances.reduce((acc, a) => acc + a.totalHours, 0);
      const totalOvertime = w.attendances.reduce((acc, a) => acc + a.overtime, 0);

      return {
        id: w.id,
        name: `${w.firstName} ${w.lastName}`,
        role: w.role,
        company: w.team.company.name,
        team: w.team.name,
        presentDays,
        halfDays,
        absentDays,
        totalHours,
        totalOvertime,
      };
    }).sort((a, b) => b.totalHours - a.totalHours);
  }, [workers]);

  // Genel özet
  const totals = useMemo(() => {
    return workerSummary.reduce((acc, w) => ({
      workers: acc.workers + 1,
      presentDays: acc.presentDays + w.presentDays,
      absentDays: acc.absentDays + w.absentDays,
      totalHours: acc.totalHours + w.totalHours,
      totalOvertime: acc.totalOvertime + w.totalOvertime,
    }), { workers: 0, presentDays: 0, absentDays: 0, totalHours: 0, totalOvertime: 0 });
  }, [workerSummary]);

  // Sayfalama
  const totalPages = Math.max(1, Math.ceil(workerSummary.length / pageSize));
  const paginatedWorkerSummary = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return workerSummary.slice(start, start + pageSize);
  }, [workerSummary, currentPage, pageSize]);

  const exportExcel = () => {
    // Firma özet sayfası
    const compSheet = XLSX.utils.json_to_sheet(companySummary.map((c) => ({
      Firma: c.company,
      "Çalışan Sayısı": c.workers,
      "Geldi (gün)": c.presentDays,
      "Gelmedi (gün)": c.absentDays,
      "Toplam Saat": c.totalHours,
      "Mesai Saat": c.totalOvertime,
    })));

    // Çalışan detay sayfası
    const workerSheet = XLSX.utils.json_to_sheet(workerSummary.map((w, i) => ({
      "#": i + 1,
      "Ad Soyad": w.name,
      Görevi: w.role,
      Firma: w.company,
      Ekip: w.team,
      "Geldi (gün)": w.presentDays,
      "Yarım Gün": w.halfDays,
      "Gelmedi": w.absentDays,
      "Toplam Saat": w.totalHours,
      "Mesai Saat": w.totalOvertime,
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, compSheet, "Firma Özet");
    XLSX.utils.book_append_sheet(wb, workerSheet, "Çalışan Detay");
    XLSX.writeFile(wb, `puantaj-rapor-${year}-${String(month + 1).padStart(2, "0")}.xlsx`);
  };

  const changeMonth = (offset: number) => {
    let m = month + offset;
    let y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m);
    setYear(y);
  };

  return (
    <div className="space-y-4">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Puantaj Raporları</h1>
          <p className="text-muted-foreground text-sm">{projectName} · {monthName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => changeMonth(-1)}>←</Button>
          <input type="month" value={`${year}-${String(month + 1).padStart(2, "0")}`}
            onChange={(e) => { const [y, m] = e.target.value.split("-"); setYear(+y); setMonth(+m - 1); }}
            className="border rounded-md px-3 py-1.5 text-sm" />
          <Button variant="outline" size="sm" onClick={() => changeMonth(1)}>→</Button>
        </div>
      </div>

      {/* Filtre */}
      <div className="flex items-center gap-3">
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={exportExcel}>
          <Download className="h-4 w-4 mr-1" /> Excel Rapor
        </Button>
      </div>

      {/* Genel Özet Kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard icon={<Users className="h-4 w-4" />} label="Çalışan" value={totals.workers} />
        <SummaryCard icon={<Clock className="h-4 w-4 text-green-600" />} label="Gelen (gün)" value={totals.presentDays} color="text-green-600" />
        <SummaryCard icon={<Clock className="h-4 w-4 text-red-600" />} label="Gelmeyen (gün)" value={totals.absentDays} color="text-red-600" />
        <SummaryCard icon={<TrendingUp className="h-4 w-4 text-orange-600" />} label="Mesai Saat" value={totals.totalOvertime} color="text-orange-600" />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : (
        <>
          {/* Firma Bazlı Özet */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Firma Bazlı Özet
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Firma</TableHead>
                      <TableHead className="text-center">Çalışan</TableHead>
                      <TableHead className="text-center">Gelen (gün)</TableHead>
                      <TableHead className="text-center">Gelmeyen (gün)</TableHead>
                      <TableHead className="text-center">Mesai Saat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companySummary.map((c) => (
                      <TableRow key={c.company}>
                        <TableCell className="font-medium">{c.company}</TableCell>
                        <TableCell className="text-center">{c.workers}</TableCell>
                        <TableCell className="text-center text-green-600">{c.presentDays}</TableCell>
                        <TableCell className="text-center text-red-600">{c.absentDays}</TableCell>
                        <TableCell className="text-center text-orange-600">{c.totalOvertime}</TableCell>
                      </TableRow>
                    ))}
                    {/* Toplam satırı */}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell>TOPLAM</TableCell>
                      <TableCell className="text-center">{totals.workers}</TableCell>
                      <TableCell className="text-center text-green-600">{totals.presentDays}</TableCell>
                      <TableCell className="text-center text-red-600">{totals.absentDays}</TableCell>
                      <TableCell className="text-center text-orange-600">{totals.totalOvertime}</TableCell>

                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Çalışan Detay Tablosu */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" /> Çalışan Bazlı Detay
                <Badge variant="secondary" className="text-xs">{workerSummary.length} kişi</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Ad Soyad</TableHead>
                      <TableHead>Firma</TableHead>
                      <TableHead>Ekip</TableHead>
                      <TableHead className="text-center">Geldi</TableHead>
                      <TableHead className="text-center">Gelmedi</TableHead>
                      <TableHead className="text-center">Mesai</TableHead>

                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedWorkerSummary.map((w, idx) => (
                      <TableRow key={w.id}>
                        <TableCell className="text-xs text-muted-foreground">{(currentPage - 1) * pageSize + idx + 1}</TableCell>
                        <TableCell className="font-medium text-sm">
                          {w.name}
                          <span className="text-xs text-muted-foreground ml-1">({w.role})</span>
                        </TableCell>
                        <TableCell className="text-xs">{w.company}</TableCell>
                        <TableCell className="text-xs">{w.team}</TableCell>
                        <TableCell className="text-center text-green-600">
                          {w.presentDays}{w.halfDays > 0 ? `+${w.halfDays}Y` : ""}
                        </TableCell>
                        <TableCell className="text-center text-red-600">{w.absentDays || "-"}</TableCell>
                        <TableCell className="text-center text-orange-600">{w.totalOvertime || "-"}</TableCell>

                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Sayfalama */}
          <PuantajPagination
            totalItems={workerSummary.length}
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

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color?: string }) {
  return (
    <Card className="py-0">
      <CardContent className="px-3 py-3">
        <div className="flex items-center gap-1.5 text-muted-foreground mb-1">{icon}<span className="text-[10px]">{label}</span></div>
        <p className={`text-xl font-bold ${color ?? ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
