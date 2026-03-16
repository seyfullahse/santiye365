"use client";

import { useEffect, useState, useCallback, useMemo, Fragment, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Download,
  ChevronLeft,
  ChevronRight,
  Users,
  UserCheck,
  UserX,
  CalendarDays,
  Sun,
  Moon,
  FolderKanban,
  Minus,
} from "lucide-react";
import { PuantajPagination } from "../components";
import * as XLSX from "xlsx";
import Link from "next/link";

// ─── Tipler ──────────────────────────────────────────────
type AttendanceStatus = "PRESENT" | "HALF_DAY" | "ABSENT" | "ANNUAL_LEAVE" | "PAID_LEAVE" | "UNPAID_LEAVE" | "SICK_LEAVE" | "ADMINISTRATIVE_LEAVE" | "DAY_OFF" | "REST_DAY_WORK";
type ShiftType = "DAY" | "NIGHT";

interface Team {
  id: string;
  name: string;
  sortOrder: number;
  company: { id: string; name: string; type: string; sortOrder: number };
  discipline: { name: string };
}

interface AttendanceRecord {
  id?: string;
  date: string;
  shift: ShiftType;
  status: AttendanceStatus;
  totalHours: number;
  overtime: number;
  note: string | null;
}

interface WorkerRow {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  sortOrder: number;
  team: Team;
  attendances: AttendanceRecord[];
}

interface EditRow {
  workerId: string;
  shift: ShiftType;
  status: AttendanceStatus;
  totalHours: number;
  overtime: number;
  note: string;
  hasRecord: boolean;
  isDirty: boolean;
}

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: "Geldi",
  HALF_DAY: "Yarım Gün",
  ABSENT: "Gelmedi",
  ANNUAL_LEAVE: "Yıllık İzin",
  PAID_LEAVE: "Ücretli İzin",
  UNPAID_LEAVE: "Ücretsiz İzin",
  SICK_LEAVE: "Raporlu",
  ADMINISTRATIVE_LEAVE: "İdari İzin",
  DAY_OFF: "Hafta Tatili",
  REST_DAY_WORK: "H.Tatil Mesai",
};

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  PRESENT: "bg-green-500",
  HALF_DAY: "bg-blue-500",
  ABSENT: "bg-red-500",
  ANNUAL_LEAVE: "bg-amber-500",
  PAID_LEAVE: "bg-teal-500",
  UNPAID_LEAVE: "bg-orange-500",
  SICK_LEAVE: "bg-purple-500",
  ADMINISTRATIVE_LEAVE: "bg-indigo-500",
  DAY_OFF: "bg-gray-400",
  REST_DAY_WORK: "bg-orange-500",
};

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(d: Date): string {
  return d.toLocaleDateString("tr-TR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTurkishDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  });
}

export default function GunlukPuantajPageWrapper() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Yükleniyor...</div>}>
      <GunlukPuantajPage />
    </Suspense>
  );
}

function GunlukPuantajPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get("project");

  const [date, setDate] = useState(() => formatDate(new Date()));
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [editRows, setEditRows] = useState<Map<string, EditRow>>(new Map());
  const [projectName, setProjectName] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [filterTeam, setFilterTeam] = useState("all");
  const [filterCompany, setFilterCompany] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const dateRef = useRef<HTMLInputElement>(null);

  // Proje seçilmemişse ana sayfaya yönlendir
  useEffect(() => {
    if (!projectId) router.push("/puantaj");
  }, [projectId, router]);

  // Proje adı ve ekipler (sadece MAIN)
  useEffect(() => {
    if (!projectId) return;
    Promise.all([
      fetch("/api/projeler").then((r) => r.json()),
      fetch("/api/ekipler").then((r) => r.json()),
    ]).then(([projData, teamData]) => {
      const proj = projData.find((p: { id: string; name: string }) => p.id === projectId);
      setProjectName(proj?.name || "");
      const mainTeams = teamData.filter((t: Team) => t.company.type === "MAIN");
      setTeams(mainTeams);
      const compMap = new Map<string, string>();
      mainTeams.forEach((t: Team) => compMap.set(t.company.id, t.company.name));
      setCompanies(Array.from(compMap, ([id, name]) => ({ id, name })));
    });
  }, [projectId]);

  // Puantaj verilerini yükle
  const fetchData = useCallback(() => {
    if (!projectId) return;
    setLoading(true);
    const params = new URLSearchParams({
      date,
      endDate: date,
      shift: "all",
      projectId,
      companyType: "MAIN",
    });
    if (filterTeam !== "all") params.set("teamId", filterTeam);
    if (filterCompany !== "all") params.set("companyId", filterCompany);

    fetch(`/api/puantaj?${params}`)
      .then((r) => r.json())
      .then((data: WorkerRow[]) => {
        const arr = Array.isArray(data) ? data : [];
        setWorkers(arr);
        setCurrentPage(1);
        const map = new Map<string, EditRow>();
        arr.forEach((w) => {
          const att = w.attendances.find((a) => a.date === date);
          map.set(w.id, {
            workerId: w.id,
            shift: att?.shift ?? "DAY",
            status: (att?.status as AttendanceStatus) ?? "ABSENT",
            totalHours: att?.totalHours ?? 0,
            overtime: att?.overtime ?? 0,
            note: att?.note ?? "",
            hasRecord: !!att,
            isDirty: false,
          });
        });
        setEditRows(map);
        setHasChanges(false);
      })
      .finally(() => setLoading(false));
  }, [date, filterTeam, filterCompany, projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Edit yardımcıları ────────────────────────────────
  const updateRow = (workerId: string, patch: Partial<EditRow>) => {
    setEditRows((prev) => {
      const next = new Map(prev);
      const row = next.get(workerId);
      if (row) next.set(workerId, { ...row, ...patch, isDirty: true });
      return next;
    });
    setHasChanges(true);
  };

  const changeStatus = (workerId: string, status: AttendanceStatus) => {
    const newHours = status === "PRESENT" ? 8 : status === "HALF_DAY" ? 4 : status === "REST_DAY_WORK" ? 8 : 0;
    const update: Partial<EditRow> = { status, totalHours: newHours };
    if (status === "REST_DAY_WORK") update.overtime = newHours;
    else if (newHours === 0) update.overtime = 0;
    updateRow(workerId, update);
  };

  const changeShift = (workerId: string, newShift: ShiftType) => {
    updateRow(workerId, { shift: newShift });
  };

  const markAllPresent = () => {
    setEditRows((prev) => {
      const next = new Map(prev);
      next.forEach((row, key) => {
        next.set(key, { ...row, status: "PRESENT", totalHours: 8, isDirty: true });
      });
      return next;
    });
    setHasChanges(true);
  };

  const markAllAbsent = () => {
    setEditRows((prev) => {
      const next = new Map(prev);
      next.forEach((row, key) => {
        next.set(key, { ...row, status: "ABSENT", totalHours: 0, overtime: 0, isDirty: true });
      });
      return next;
    });
    setHasChanges(true);
  };

  // ─── Kaydet ──────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const records = Array.from(editRows.values())
        .filter((r) => r.isDirty)
        .map((r) => ({
          workerId: r.workerId,
          shift: r.shift,
          status: r.status,
          totalHours: r.totalHours,
          overtime: r.overtime,
          note: r.note,
        }));
      if (records.length === 0) {
        setHasChanges(false);
        setSaving(false);
        return;
      }
      const res = await fetch("/api/puantaj", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, records }),
      });
      if (!res.ok) throw new Error("Kayıt başarısız");
      setHasChanges(false);
      fetchData();
    } catch (e) {
      alert(`Puantaj kaydedilemedi: ${e instanceof Error ? e.message : "Bilinmeyen hata"}`);
    } finally {
      setSaving(false);
    }
  };

  // ─── Tarih navigasyonu ───────────────────────────────
  const changeDate = (offset: number) => {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + offset);
    setDate(formatDate(d));
  };

  // ─── Excel dışa aktar ───────────────────────────────
  const exportExcel = () => {
    const rows = workers.map((w, i) => {
      const row = editRows.get(w.id);
      return {
        "#": i + 1,
        Şirket: w.team.company.name,
        Ekip: w.team.name,
        "Ad Soyad": `${w.firstName} ${w.lastName}`,
        Görevi: w.role,
        Vardiya: row?.shift === "NIGHT" ? "Gece" : "Gündüz",
        Durum: row && (row.hasRecord || row.isDirty) ? STATUS_LABELS[row.status] : "Kayıt Yok",
        "Çalışma Saati": row?.totalHours ?? 0,
        "Mesai Saati": row?.overtime ?? 0,
        Not: row?.note ?? "",
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Firma Puantaj");
    XLSX.writeFile(wb, `firma-puantaj-${date}.xlsx`);
  };

  // ─── İstatistikler ──────────────────────────────────
  const stats = useMemo(() => {
    let total = 0, present = 0, absent = 0, halfDay = 0, dayOff = 0, leave = 0, noRecord = 0, totalHours = 0, totalOvertime = 0;
    editRows.forEach((r) => {
      total++;
      if (!r.hasRecord && !r.isDirty) { noRecord++; }
      else if (r.status === "PRESENT" || r.status === "REST_DAY_WORK") present++;
      else if (r.status === "ABSENT") absent++;
      else if (r.status === "HALF_DAY") halfDay++;
      else if (r.status === "DAY_OFF") dayOff++;
      else if (["ANNUAL_LEAVE", "PAID_LEAVE", "UNPAID_LEAVE", "SICK_LEAVE", "ADMINISTRATIVE_LEAVE"].includes(r.status)) leave++;
      totalHours += r.totalHours;
      totalOvertime += r.overtime;
    });
    return { total, present, absent, halfDay, dayOff, leave, noRecord, totalHours, totalOvertime };
  }, [editRows]);

  // Firmaya göre gruplanmış çalışanlar (sayfalanmış)
  const totalPages = Math.max(1, Math.ceil(workers.length / pageSize));
  const paginatedGroupedWorkers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const pageWorkers = workers.slice(start, start + pageSize);
    const groups = new Map<string, { company: string; workers: WorkerRow[] }>();
    pageWorkers.forEach((w) => {
      const compId = w.team.company.id;
      if (!groups.has(compId)) {
        groups.set(compId, { company: w.team.company.name, workers: [] });
      }
      groups.get(compId)!.workers.push(w);
    });
    return Array.from(groups.values());
  }, [workers, currentPage, pageSize]);

  if (!projectId) return null;

  return (
    <div className="space-y-4">
      {/* Başlık + Tarih */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Firma Puantaj</h1>
          <p className="text-muted-foreground text-sm">
            {projectName} · <CalendarDays className="inline h-4 w-4 mr-1" />
            {formatDisplayDate(new Date(date + "T00:00:00"))}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="min-w-[200px]" onClick={() => dateRef.current?.showPicker?.()}>
            <CalendarDays className="h-4 w-4 mr-1.5" />
            {formatTurkishDate(date)}
          </Button>
          <input ref={dateRef} type="date" value={date} onChange={(e) => { if (e.target.value) setDate(e.target.value); }} className="sr-only" />
          <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* İstatistik kartları */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <MiniStat icon={<Users className="h-3.5 w-3.5" />} value={stats.total} label="Toplam" />
        <MiniStat icon={<UserCheck className="h-3.5 w-3.5 text-green-600" />} value={stats.present} label="Geldi" color="text-green-600" />
        <MiniStat icon={<UserX className="h-3.5 w-3.5 text-red-600" />} value={stats.absent} label="Gelmedi" color="text-red-600" />
        <MiniStat icon={<Clock className="h-3.5 w-3.5 text-amber-600" />} value={stats.leave} label="İdari İzinli" color="text-amber-600" />
        <MiniStat icon={<Clock className="h-3.5 w-3.5 text-gray-500" />} value={stats.dayOff} label="H. Tatili" color="text-gray-500" />
        <MiniStat icon={<Clock className="h-3.5 w-3.5 text-orange-600" />} value={stats.totalOvertime} label="Mesai" color="text-orange-600" />
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

        <Button variant="outline" size="sm" onClick={markAllPresent}>
          <CheckCircle2 className="h-4 w-4 mr-1" /> Tümü Geldi
        </Button>
        <Button variant="outline" size="sm" onClick={markAllAbsent}>
          <XCircle className="h-4 w-4 mr-1" /> Tümü Gelmedi
        </Button>
        <Button variant="outline" size="sm" onClick={exportExcel}>
          <Download className="h-4 w-4 mr-1" /> Excel
        </Button>
        <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm">
          <Save className="h-4 w-4 mr-1" />
          {saving ? "Kaydediliyor..." : "Kaydet"}
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
            <p className="text-sm">Bu projeye atanmış ana yüklenici çalışanı bulunmuyor.</p>
          </CardContent>
        </Card>
      ) : (
        <>
        <Card className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead className="w-32">Firma</TableHead>
                  <TableHead className="w-28">Ekip</TableHead>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead className="w-28">Görevi</TableHead>
                  <TableHead className="w-28">Vardiya</TableHead>
                  <TableHead className="w-32">Durum</TableHead>
                  <TableHead className="w-24 text-center">Saat</TableHead>
                  <TableHead className="w-24 text-center">Mesai</TableHead>
                  <TableHead className="w-44">Not</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedGroupedWorkers.map((group) => (
                  <Fragment key={`group-${group.company}`}>
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={10} className="py-1.5">
                        <span className="font-semibold text-sm">{group.company}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">{group.workers.length} kişi</Badge>
                      </TableCell>
                    </TableRow>
                    {group.workers.map((w, idx) => {
                      const row = editRows.get(w.id);
                      if (!row) return null;
                      return (
                        <TableRow key={w.id} className={!row.hasRecord && !row.isDirty ? "bg-muted/20" : ""}>
                          <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                          <TableCell className="text-xs">{w.team.company.name}</TableCell>
                          <TableCell className="text-xs">{w.team.name}</TableCell>
                          <TableCell className="font-medium text-sm">{w.firstName} {w.lastName}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{w.role}</TableCell>
                          <TableCell>
                            <Select value={row.shift} onValueChange={(v) => changeShift(w.id, v as ShiftType)}>
                              <SelectTrigger className="h-8 w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="DAY">
                                  <div className="flex items-center gap-1.5">
                                    <Sun className="h-3 w-3 text-yellow-500" /> Gündüz
                                  </div>
                                </SelectItem>
                                <SelectItem value="NIGHT">
                                  <div className="flex items-center gap-1.5">
                                    <Moon className="h-3 w-3 text-blue-400" /> Gece
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select value={!row.hasRecord && !row.isDirty ? "NO_RECORD" : row.status} onValueChange={(v) => changeStatus(w.id, v as AttendanceStatus)}>
                              <SelectTrigger className={`h-8 w-36 ${!row.hasRecord && !row.isDirty ? "text-muted-foreground border-dashed" : ""}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent position="popper" className="max-h-60">
                                {!row.hasRecord && !row.isDirty && (
                                  <SelectItem value="NO_RECORD" disabled>
                                    <div className="flex items-center gap-2">
                                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-gray-300" />
                                      Kayıt Yok
                                    </div>
                                  </SelectItem>
                                )}
                                {(Object.keys(STATUS_LABELS) as AttendanceStatus[]).map((s) => (
                                  <SelectItem key={s} value={s}>
                                    <div className="flex items-center gap-2">
                                      <span className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_COLORS[s]}`} />
                                      {STATUS_LABELS[s]}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number" min={0} max={24} step={0.5}
                              value={row.totalHours}
                              onChange={(e) => updateRow(w.id, { totalHours: parseFloat(e.target.value) || 0 })}
                              className="h-8 w-20 text-center mx-auto"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number" min={0} max={12} step={0.5}
                              value={row.overtime}
                              onChange={(e) => updateRow(w.id, { overtime: parseFloat(e.target.value) || 0 })}
                              className="h-8 w-20 text-center mx-auto"
                            />
                          </TableCell>
                          <TableCell>
                            <textarea
                              value={row.note}
                              onChange={(e) => updateRow(w.id, { note: e.target.value })}
                              onInput={(e) => { const el = e.target as HTMLTextAreaElement; el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }}
                              placeholder="Not..."
                              rows={1}
                              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full min-w-[120px] resize-none overflow-hidden rounded-md border bg-transparent px-3 py-1.5 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

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

function MiniStat({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color?: string }) {
  return (
    <Card className="py-0">
      <CardContent className="px-2 py-2 text-center">
        <div className="mx-auto mb-0.5">{icon}</div>
        <p className={`text-base font-bold ${color ?? ""}`}>{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
