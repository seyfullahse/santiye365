"use client";

import { useEffect, useState, useCallback, useMemo, useRef, Fragment, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  Upload,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { PuantajPagination } from "../components";

type AttendanceStatus = "PRESENT" | "HALF_DAY" | "ABSENT" | "ANNUAL_LEAVE" | "PAID_LEAVE" | "UNPAID_LEAVE" | "SICK_LEAVE" | "DAY_OFF" | "REST_DAY_WORK";

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

const STATUS_SHORT: Record<AttendanceStatus, string> = {
  PRESENT: "G", HALF_DAY: "Y", ABSENT: "-",
  ANNUAL_LEAVE: "Yİ", PAID_LEAVE: "Üİ", UNPAID_LEAVE: "Üsİ", SICK_LEAVE: "R",
  DAY_OFF: "HT", REST_DAY_WORK: "M",
};

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: "Geldi", HALF_DAY: "Yarım Gün", ABSENT: "Gelmedi",
  ANNUAL_LEAVE: "Yıllık İzin", PAID_LEAVE: "Ücretli İzin", UNPAID_LEAVE: "Ücretsiz İzin", SICK_LEAVE: "Raporlu",
  DAY_OFF: "Hafta Tatili", REST_DAY_WORK: "H.Tatil Mesai",
};

const STATUS_SHORT_COLORS: Record<AttendanceStatus, string> = {
  PRESENT: "text-green-600 font-bold", HALF_DAY: "text-blue-600",
  ABSENT: "text-red-500",
  ANNUAL_LEAVE: "text-amber-600 font-bold", PAID_LEAVE: "text-teal-600 font-bold", UNPAID_LEAVE: "text-orange-500", SICK_LEAVE: "text-purple-600 font-bold",
  DAY_OFF: "text-gray-400", REST_DAY_WORK: "text-orange-600 font-bold",
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
  const router = useRouter();
  const projectId = searchParams.get("project");

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [projectName, setProjectName] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [filterCompany, setFilterCompany] = useState("all");
  const [filterTeam, setFilterTeam] = useState("all");
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!projectId) router.push("/puantaj");
  }, [projectId, router]);

  const dates = useMemo(() => getMonthDates(year, month), [year, month]);
  const monthName = new Date(year, month, 1).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

  useEffect(() => {
    if (!projectId) return;
    Promise.all([
      fetch("/api/projeler").then((r) => r.json()),
      fetch("/api/ekipler").then((r) => r.json()),
    ]).then(([projData, teamData]) => {
      const proj = projData.find((p: { id: string; name: string }) => p.id === projectId);
      setProjectName(proj?.name || "");
      setTeams(teamData);
      const compMap = new Map<string, string>();
      teamData.forEach((t: Team) => compMap.set(t.company.id, t.company.name));
      setCompanies(Array.from(compMap, ([id, name]) => ({ id, name })));
    });
  }, [projectId]);

  const fetchData = useCallback(() => {
    if (!projectId) return;
    setLoading(true);
    const params = new URLSearchParams({
      date: dates[0],
      endDate: dates[dates.length - 1],
      shift: "all",
      projectId,
    });
    if (filterTeam !== "all") params.set("teamId", filterTeam);
    if (filterCompany !== "all") params.set("companyId", filterCompany);

    fetch(`/api/puantaj?${params}`)
      .then((r) => r.json())
      .then((data: WorkerRow[]) => {
        setWorkers(Array.isArray(data) ? data : []);
        setCurrentPage(1);
      })
      .finally(() => setLoading(false));
  }, [dates, filterTeam, filterCompany, projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);



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

  const fileRef = useRef<HTMLInputElement>(null);

  const exportExcel = () => {
    // Header satırı: #, Firma, Ekip, Ad Soyad, Görevi, 1, 2, ..., 31, Gün, Toplam Saat, Mesai
    const header: (string | number)[] = ["#", "Firma", "Ekip", "Ad Soyad", "Görevi"];
    dates.forEach((dd) => header.push(new Date(dd + "T00:00:00").getDate()));
    header.push("Gün", "Toplam Saat", "Mesai");

    const aoa: (string | number)[][] = [header];

    workers.forEach((w, i) => {
      const row: (string | number)[] = [
        i + 1,
        w.team.company.name,
        w.team.name,
        `${w.firstName} ${w.lastName}`,
        w.role,
      ];
      const attMap = new Map(w.attendances.map((a) => [a.date, a]));
      let totalH = 0, totalO = 0, presentDays = 0;
      dates.forEach((dd) => {
        const att = attMap.get(dd);
        row.push(att ? STATUS_SHORT[att.status] : (dd <= todayStr ? "X" : ""));
        totalH += att?.totalHours ?? 0;
        totalO += att?.overtime ?? 0;
        if (att?.status === "PRESENT" || att?.status === "HALF_DAY" || att?.status === "REST_DAY_WORK") presentDays++;
      });
      row.push(presentDays, totalH, totalO);
      aoa.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    // Sütun genişlikleri
    const cols: XLSX.ColInfo[] = [
      { wch: 4 },   // #
      { wch: 18 },  // Firma
      { wch: 14 },  // Ekip
      { wch: 22 },  // Ad Soyad
      { wch: 14 },  // Görevi
    ];
    dates.forEach(() => cols.push({ wch: 4 }));
    cols.push({ wch: 5 }, { wch: 10 }, { wch: 7 });
    ws["!cols"] = cols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Aylık Puantaj");
    XLSX.writeFile(wb, `puantaj-aylik-${year}-${String(month + 1).padStart(2, "0")}.xlsx`);
  };

  // ─── Excel İçe Aktar ───────────────────────────────
  const REVERSE_STATUS: Record<string, AttendanceStatus> = {
    G: "PRESENT", Y: "HALF_DAY", "-": "ABSENT",
    "Yİ": "ANNUAL_LEAVE", "Üİ": "PAID_LEAVE", "Üsİ": "UNPAID_LEAVE", R: "SICK_LEAVE",
    HT: "DAY_OFF", M: "REST_DAY_WORK",
  };

  const STATUS_HOURS: Record<AttendanceStatus, { totalHours: number; overtime: number }> = {
    PRESENT: { totalHours: 8, overtime: 0 },
    HALF_DAY: { totalHours: 4, overtime: 0 },
    ABSENT: { totalHours: 0, overtime: 0 },
    ANNUAL_LEAVE: { totalHours: 0, overtime: 0 },
    PAID_LEAVE: { totalHours: 0, overtime: 0 },
    UNPAID_LEAVE: { totalHours: 0, overtime: 0 },
    SICK_LEAVE: { totalHours: 0, overtime: 0 },
    DAY_OFF: { totalHours: 0, overtime: 0 },
    REST_DAY_WORK: { totalHours: 8, overtime: 8 },
  };

  const importExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) { toast.error("Excel dosyası boş"); return; }

      const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (raw.length < 2) { toast.error("Excel dosyasında veri bulunamadı"); return; }

      // Header satırından gün sütunlarını bul
      const headerRow = raw[0] as (string | number)[];
      const nameColIdx = headerRow.findIndex((h) => String(h).toLowerCase().includes("ad soyad") || String(h).toLowerCase().includes("adsoyad"));
      if (nameColIdx === -1) { toast.error("'Ad Soyad' sütunu bulunamadı"); return; }

      // Gün numarası → sütun indeksi eşlemesi
      const dayColMap = new Map<number, number>(); // dayNum → colIdx
      headerRow.forEach((h, idx) => {
        const num = Number(h);
        if (!isNaN(num) && num >= 1 && num <= 31) dayColMap.set(num, idx);
      });

      if (dayColMap.size === 0) { toast.error("Tarih sütunları bulunamadı (1-31)"); return; }

      // Çalışan isim → id eşlemesi
      const workerMap = new Map<string, string>();
      workers.forEach((w) => {
        const fullName = `${w.firstName} ${w.lastName}`.trim().toLowerCase();
        workerMap.set(fullName, w.id);
      });

      // Her gün için kayıtları topla
      const dayRecords = new Map<string, { workerId: string; status: AttendanceStatus; totalHours: number; overtime: number }[]>();

      let matchCount = 0;
      let skipCount = 0;

      for (let r = 1; r < raw.length; r++) {
        const row = raw[r] as (string | number)[];
        if (!row || row.length === 0) continue;

        const name = String(row[nameColIdx] ?? "").trim().toLowerCase();
        if (!name) continue;

        const workerId = workerMap.get(name);
        if (!workerId) { skipCount++; continue; }

        matchCount++;

        dayColMap.forEach((colIdx, dayNum) => {
          const cellVal = String(row[colIdx] ?? "").trim().toUpperCase();
          if (!cellVal || cellVal === "X") return;

          const status = REVERSE_STATUS[cellVal];
          if (!status) return;

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
          if (!dayRecords.has(dateStr)) dayRecords.set(dateStr, []);
          dayRecords.get(dateStr)!.push({
            workerId,
            status,
            totalHours: STATUS_HOURS[status].totalHours,
            overtime: STATUS_HOURS[status].overtime,
          });
        });
      }

      if (matchCount === 0) {
        toast.error(`Eşleşen çalışan bulunamadı (${skipCount} atlandı). Ad Soyad sütununu kontrol edin.`);
        return;
      }

      // API'ye gönder (gün gün)
      let totalSaved = 0;
      for (const [dateStr, records] of dayRecords) {
        const res = await fetch("/api/puantaj", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: dateStr,
            shift: "DAY",
            records: records.map((r) => ({ ...r, shift: "DAY", note: "" })),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          totalSaved += data.saved ?? 0;
        }
      }

      toast.success(`${matchCount} çalışan, ${totalSaved} kayıt içe aktarıldı${skipCount > 0 ? ` (${skipCount} eşleşmedi)` : ""}`);
      fetchData();
    } catch (err) {
      console.error("Excel import error:", err);
      toast.error("Excel içe aktarma başarısız");
    }
  };

  return (
    <div className="space-y-4">
      {/* Başlık */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Aylık Puantaj</h1>
          <p className="text-muted-foreground text-sm">{projectName} · {monthName}</p>
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

      {/* Filtreler */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterCompany} onValueChange={(v) => { setFilterCompany(v); setFilterTeam("all"); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Firma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Firmalar</SelectItem>
            {companies.map((c) => (
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

        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={importExcel} />
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          <Upload className="h-4 w-4 mr-1" /> Excel İçe Aktar
        </Button>
        <Button variant="outline" size="sm" onClick={exportExcel}>
          <Download className="h-4 w-4 mr-1" /> Excel İndir
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
                              if (att.status === "PRESENT" || att.status === "HALF_DAY" || att.status === "REST_DAY_WORK") presentDays++;
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
