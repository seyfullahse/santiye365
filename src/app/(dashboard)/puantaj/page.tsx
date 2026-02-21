"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import * as XLSX from "xlsx";

// ─── Tipler ──────────────────────────────────────────────
type AttendanceStatus = "PRESENT" | "HALF_DAY" | "ABSENT" | "PAID_LEAVE" | "UNPAID_LEAVE" | "ANNUAL_LEAVE" | "SICK_LEAVE" | "DAY_OFF";
type ShiftType = "DAY" | "NIGHT";
type ViewMode = "daily" | "weekly" | "monthly";

interface Team {
  id: string;
  name: string;
  sortOrder: number;
  company: { id: string; name: string; sortOrder: number };
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

// Lokal düzenleme state'i (günlük görünüm)
interface EditRow {
  workerId: string;
  shift: ShiftType;
  status: AttendanceStatus;
  totalHours: number;
  overtime: number;
  note: string;
}

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: "Geldi",
  HALF_DAY: "Yarım Gün",
  ABSENT: "Gelmedi",
  PAID_LEAVE: "Ücretli İzin",
  UNPAID_LEAVE: "Ücretsiz İzin",
  ANNUAL_LEAVE: "Yıllık İzin",
  SICK_LEAVE: "Raporlu",
  DAY_OFF: "Hafta Tatili",
};

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  PRESENT: "bg-green-500",
  HALF_DAY: "bg-blue-500",
  ABSENT: "bg-red-500",
  PAID_LEAVE: "bg-yellow-500",
  UNPAID_LEAVE: "bg-orange-500",
  ANNUAL_LEAVE: "bg-purple-500",
  SICK_LEAVE: "bg-pink-500",
  DAY_OFF: "bg-gray-400",
};

const STATUS_SHORT: Record<AttendanceStatus, string> = {
  PRESENT: "G",
  HALF_DAY: "Y",
  ABSENT: "-",
  PAID_LEAVE: "Üİ",
  UNPAID_LEAVE: "ÜZ",
  ANNUAL_LEAVE: "Yİ",
  SICK_LEAVE: "R",
  DAY_OFF: "HT",
};

const STATUS_SHORT_COLORS: Record<AttendanceStatus, string> = {
  PRESENT: "text-green-600 font-bold",
  HALF_DAY: "text-blue-600",
  ABSENT: "text-red-500",
  PAID_LEAVE: "text-yellow-600",
  UNPAID_LEAVE: "text-orange-600",
  ANNUAL_LEAVE: "text-purple-600",
  SICK_LEAVE: "text-pink-600",
  DAY_OFF: "text-gray-400",
};

// ─── Yardımcı ────────────────────────────────────────────
function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDisplayDate(d: Date): string {
  return d.toLocaleDateString("tr-TR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getWeekDates(dateStr: string): string[] {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    dates.push(formatDate(dd));
  }
  return dates;
}

function getMonthDates(dateStr: string): string[] {
  const d = new Date(dateStr + "T00:00:00");
  const year = d.getFullYear();
  const month = d.getMonth();
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

function getDayNum(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").getDate().toString();
}

// ─── Sayfa ───────────────────────────────────────────────
export default function PuantajPage() {
  const [date, setDate] = useState(() => formatDate(new Date()));
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [editRows, setEditRows] = useState<Map<string, EditRow>>(new Map());
  const [teams, setTeams] = useState<Team[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [filterTeam, setFilterTeam] = useState("all");
  const [filterCompany, setFilterCompany] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Ekip ve şirket listesi
  useEffect(() => {
    fetch("/api/ekipler")
      .then((r) => r.json())
      .then((data: Team[]) => {
        setTeams(data);
        const compMap = new Map<string, string>();
        data.forEach((t) => compMap.set(t.company.id, t.company.name));
        setCompanies(Array.from(compMap, ([id, name]) => ({ id, name })));
      });
  }, []);

  // Tarih aralığı hesapla
  const dateRange = useMemo(() => {
    if (viewMode === "daily") return { start: date, end: date };
    if (viewMode === "weekly") {
      const days = getWeekDates(date);
      return { start: days[0], end: days[6] };
    }
    const days = getMonthDates(date);
    return { start: days[0], end: days[days.length - 1] };
  }, [date, viewMode]);

  // Puantaj verilerini yükle
  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      date: dateRange.start,
      endDate: dateRange.end,
      shift: "all",
    });
    if (filterTeam !== "all") params.set("teamId", filterTeam);
    if (filterCompany !== "all") params.set("companyId", filterCompany);

    fetch(`/api/puantaj?${params}`)
      .then((r) => r.json())
      .then((data: WorkerRow[]) => {
        setWorkers(data);
        // Günlük görünümde editRows oluştur
        if (viewMode === "daily") {
          const map = new Map<string, EditRow>();
          data.forEach((w) => {
            const att = w.attendances.find(
              (a) => a.date === date
            );
            map.set(w.id, {
              workerId: w.id,
              shift: att?.shift ?? "DAY",
              status: att?.status ?? "ABSENT",
              totalHours: att?.totalHours ?? 0,
              overtime: att?.overtime ?? 0,
              note: att?.note ?? "",
            });
          });
          setEditRows(map);
        }
        setHasChanges(false);
      })
      .finally(() => setLoading(false));
  }, [dateRange, filterTeam, filterCompany, viewMode, date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Edit helpers ────────────────────────────────────
  const updateRow = (workerId: string, patch: Partial<EditRow>) => {
    setEditRows((prev) => {
      const next = new Map(prev);
      const row = next.get(workerId);
      if (row) next.set(workerId, { ...row, ...patch });
      return next;
    });
    setHasChanges(true);
  };

  // Durum değiştiğinde saatleri otomatik ayarla
  const changeStatus = (workerId: string, status: AttendanceStatus) => {
    const newHours = status === "PRESENT" ? 8 : status === "HALF_DAY" ? 4 : 0;
    const update: Partial<EditRow> = { status, totalHours: newHours };
    if (newHours === 0) update.overtime = 0;
    updateRow(workerId, update);
  };

  // Vardiya değiştir
  const changeShift = (workerId: string, newShift: ShiftType) => {
    updateRow(workerId, { shift: newShift });
  };

  // Tümünü Geldi Yap
  const markAllPresent = () => {
    setEditRows((prev) => {
      const next = new Map(prev);
      next.forEach((row, key) => {
        next.set(key, { ...row, status: "PRESENT", totalHours: 8 });
      });
      return next;
    });
    setHasChanges(true);
  };

  // Tümünü Gelmedi Yap
  const markAllAbsent = () => {
    setEditRows((prev) => {
      const next = new Map(prev);
      next.forEach((row, key) => {
        next.set(key, { ...row, status: "ABSENT", totalHours: 0, overtime: 0 });
      });
      return next;
    });
    setHasChanges(true);
  };

  // ─── Kaydet ──────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const records = Array.from(editRows.values()).map((r) => ({
        workerId: r.workerId,
        shift: r.shift,
        status: r.status,
        totalHours: r.totalHours,
        overtime: r.overtime,
        note: r.note,
      }));
      const res = await fetch("/api/puantaj", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, records }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Kayıt başarısız");
      }
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
    if (viewMode === "daily") d.setDate(d.getDate() + offset);
    else if (viewMode === "weekly") d.setDate(d.getDate() + offset * 7);
    else d.setMonth(d.getMonth() + offset);
    setDate(formatDate(d));
  };

  // ─── Excel dışa aktar ───────────────────────────────
  const exportExcel = () => {
    if (viewMode === "daily") {
      const rows = workers.map((w, i) => {
        const row = editRows.get(w.id);
        return {
          "#": i + 1,
          Şirket: w.team.company.name,
          Ekip: w.team.name,
          "Ad Soyad": `${w.firstName} ${w.lastName}`,
          Görevi: w.role,
          Vardiya: row?.shift === "NIGHT" ? "Gece" : "Gündüz",
          Durum: row ? STATUS_LABELS[row.status] : "Gelmedi",
          "Çalışma Saati": row?.totalHours ?? 0,
          "Mesai Saati": row?.overtime ?? 0,
          Not: row?.note ?? "",
        };
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Puantaj");
      XLSX.writeFile(wb, `puantaj-${date}.xlsx`);
    } else {
      const dates =
        viewMode === "weekly" ? getWeekDates(date) : getMonthDates(date);
      const rows = workers.map((w, i) => {
        const base: Record<string, string | number> = {
          "#": i + 1,
          Şirket: w.team.company.name,
          Ekip: w.team.name,
          "Ad Soyad": `${w.firstName} ${w.lastName}`,
          Görevi: w.role,
        };
        let totalH = 0;
        let totalO = 0;
        dates.forEach((dd) => {
          const att = w.attendances.find((a) => a.date === dd);
          base[dd] = att ? STATUS_SHORT[att.status] : "X";
          totalH += att?.totalHours ?? 0;
          totalO += att?.overtime ?? 0;
        });
        base["Toplam Saat"] = totalH;
        base["Mesai Saat"] = totalO;
        return base;
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Puantaj");
      XLSX.writeFile(wb, `puantaj-${viewMode}-${dateRange.start}.xlsx`);
    }
  };

  // ─── İstatistikler ──────────────────────────────────
  const stats = useMemo(() => {
    let total = 0,
      present = 0,
      absent = 0,
      leave = 0,
      halfDay = 0,
      dayOff = 0,
      totalHours = 0,
      totalOvertime = 0;
    const countStatus = (s: AttendanceStatus, hours: number, ot: number) => {
      if (s === "PRESENT") present++;
      else if (s === "ABSENT") absent++;
      else if (s === "HALF_DAY") halfDay++;
      else if (s === "DAY_OFF") dayOff++;
      else if (["PAID_LEAVE", "UNPAID_LEAVE", "ANNUAL_LEAVE", "SICK_LEAVE"].includes(s)) leave++;
      totalHours += hours;
      totalOvertime += ot;
    };
    if (viewMode === "daily") {
      editRows.forEach((r) => {
        total++;
        countStatus(r.status, r.totalHours, r.overtime);
      });
    } else {
      total = workers.length;
      workers.forEach((w) => {
        w.attendances.forEach((a) => {
          countStatus(a.status, a.totalHours, a.overtime);
        });
      });
    }
    return { total, present, absent, leave, halfDay, dayOff, totalHours, totalOvertime };
  }, [editRows, workers, viewMode]);

  // ─── Render ──────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* ─── Başlık + Tarih ─────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Puantaj</h1>
          <p className="text-muted-foreground text-sm">
            Günlük çalışan yoklama ve çalışma saati takibi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-40"
          />
          <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ─── Görünüm seçici + Vardiya + Tarih bilgisi ───── */}
      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={viewMode}
          onValueChange={(v) => setViewMode(v as ViewMode)}
        >
          <TabsList>
            <TabsTrigger value="daily">Günlük</TabsTrigger>
            <TabsTrigger value="weekly">Haftalık</TabsTrigger>
            <TabsTrigger value="monthly">Aylık</TabsTrigger>
          </TabsList>
        </Tabs>



        <p className="text-sm text-muted-foreground">
          <CalendarDays className="inline h-4 w-4 mr-1" />
          {viewMode === "daily"
            ? formatDisplayDate(new Date(date + "T00:00:00"))
            : viewMode === "weekly"
            ? `${new Date(dateRange.start + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} — ${new Date(dateRange.end + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}`
            : new Date(date + "T00:00:00").toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* ─── İstatistik kartları ────────────────────────── */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        <Card className="py-0">
          <CardContent className="px-2 py-2 text-center">
            <Users className="h-3.5 w-3.5 mx-auto mb-0.5 text-muted-foreground" />
            <p className="text-base font-bold">{stats.total}</p>
            <p className="text-[10px] text-muted-foreground">Toplam</p>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardContent className="px-2 py-2 text-center">
            <UserCheck className="h-3.5 w-3.5 mx-auto mb-0.5 text-green-600" />
            <p className="text-base font-bold text-green-600">{stats.present}</p>
            <p className="text-[10px] text-muted-foreground">Geldi</p>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardContent className="px-2 py-2 text-center">
            <UserX className="h-3.5 w-3.5 mx-auto mb-0.5 text-red-600" />
            <p className="text-base font-bold text-red-600">{stats.absent}</p>
            <p className="text-[10px] text-muted-foreground">Gelmedi</p>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardContent className="px-2 py-2 text-center">
            <Clock className="h-3.5 w-3.5 mx-auto mb-0.5 text-yellow-600" />
            <p className="text-base font-bold text-yellow-600">{stats.leave}</p>
            <p className="text-[10px] text-muted-foreground">İzinli</p>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardContent className="px-2 py-2 text-center">
            <Clock className="h-3.5 w-3.5 mx-auto mb-0.5 text-blue-600" />
            <p className="text-base font-bold text-blue-600">{stats.halfDay}</p>
            <p className="text-[10px] text-muted-foreground">Yarım Gün</p>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardContent className="px-2 py-2 text-center">
            <Clock className="h-3.5 w-3.5 mx-auto mb-0.5 text-gray-500" />
            <p className="text-base font-bold text-gray-500">{stats.dayOff}</p>
            <p className="text-[10px] text-muted-foreground">H. Tatili</p>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardContent className="px-2 py-2 text-center">
            <Clock className="h-3.5 w-3.5 mx-auto mb-0.5 text-muted-foreground" />
            <p className="text-base font-bold">{stats.totalHours}</p>
            <p className="text-[10px] text-muted-foreground">Toplam Saat</p>
          </CardContent>
        </Card>
        <Card className="py-0">
          <CardContent className="px-2 py-2 text-center">
            <Clock className="h-3.5 w-3.5 mx-auto mb-0.5 text-orange-600" />
            <p className="text-base font-bold text-orange-600">{stats.totalOvertime}</p>
            <p className="text-[10px] text-muted-foreground">Mesai Saati</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Filtreler + Aksiyonlar ─────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterCompany} onValueChange={(v) => { setFilterCompany(v); setFilterTeam("all"); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Şirket" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Şirketler</SelectItem>
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

        {viewMode === "daily" && (
          <>
            <Button variant="outline" size="sm" onClick={markAllPresent}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Tümü Geldi
            </Button>
            <Button variant="outline" size="sm" onClick={markAllAbsent}>
              <XCircle className="h-4 w-4 mr-1" />
              Tümü Gelmedi
            </Button>
          </>
        )}
        <Button variant="outline" size="sm" onClick={exportExcel}>
          <Download className="h-4 w-4 mr-1" />
          Excel
        </Button>
        {viewMode === "daily" && (
          <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm">
            <Save className="h-4 w-4 mr-1" />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        )}
      </div>

      {/* ─── Tablo ──────────────────────────────────────── */}
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
            <p className="text-sm">Çalışan eklemek için önce Çalışanlar sayfasını kullanın.</p>
          </CardContent>
        </Card>
      ) : viewMode === "daily" ? (
        /* ─── GÜNLÜK GÖRÜNÜM ─────────────────────────────── */
        <Card className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead className="w-32">Şirket</TableHead>
                  <TableHead className="w-28">Ekip</TableHead>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead className="w-28">Görevi</TableHead>
                  <TableHead className="w-28">Vardiya</TableHead>
                  <TableHead className="w-32">Durum</TableHead>
                  <TableHead className="w-24 text-center">Çalışma (s)</TableHead>
                  <TableHead className="w-24 text-center">Mesai (s)</TableHead>
                  <TableHead className="w-40">Not</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workers.map((w, idx) => {
                  const row = editRows.get(w.id);
                  if (!row) return null;
                  return (
                    <TableRow key={w.id}>
                      <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                      <TableCell className="text-xs">{w.team.company.name}</TableCell>
                      <TableCell className="text-xs">{w.team.name}</TableCell>
                      <TableCell className="font-medium text-sm">
                        {w.firstName} {w.lastName}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{w.role}</TableCell>
                      <TableCell>
                        <Select
                          value={row.shift}
                          onValueChange={(v) => changeShift(w.id, v as ShiftType)}
                        >
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
                        <Select
                          value={row.status}
                          onValueChange={(v) => changeStatus(w.id, v as AttendanceStatus)}
                        >
                          <SelectTrigger className="h-8 w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent position="popper" className="max-h-60">
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
                          type="number"
                          min={0}
                          max={24}
                          step={0.5}
                          value={row.totalHours}
                          onChange={(e) =>
                            updateRow(w.id, { totalHours: parseFloat(e.target.value) || 0 })
                          }
                          className="h-8 w-20 text-center mx-auto"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min={0}
                          max={12}
                          step={0.5}
                          value={row.overtime}
                          onChange={(e) =>
                            updateRow(w.id, { overtime: parseFloat(e.target.value) || 0 })
                          }
                          className="h-8 w-20 text-center mx-auto"
                        />
                      </TableCell>
                      <TableCell>
                        <textarea
                          value={row.note}
                          onChange={(e) => updateRow(w.id, { note: e.target.value })}
                          onInput={(e) => {
                            const el = e.target as HTMLTextAreaElement;
                            el.style.height = "auto";
                            el.style.height = el.scrollHeight + "px";
                          }}
                          placeholder="Not..."
                          rows={1}
                          className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full min-w-[120px] resize-none overflow-hidden rounded-md border bg-transparent px-3 py-1.5 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        /* ─── HAFTALIK / AYLIK GÖRÜNÜM ───────────────────── */
        <WeeklyMonthlyView
          workers={workers}
          viewMode={viewMode}
          date={date}
        />
      )}
    </div>
  );
}

// ─── Haftalık / Aylık Görünüm Bileşeni ──────────────────
function WeeklyMonthlyView({
  workers,
  viewMode,
  date,
}: {
  workers: WorkerRow[];
  viewMode: ViewMode;
  date: string;
}) {
  const dates = useMemo(
    () => (viewMode === "weekly" ? getWeekDates(date) : getMonthDates(date)),
    [viewMode, date]
  );

  return (
    <Card className="p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 sticky left-0 bg-background z-10">#</TableHead>
              <TableHead className="w-28 sticky left-10 bg-background z-10">Şirket</TableHead>
              <TableHead className="w-24 sticky left-[152px] bg-background z-10">Ekip</TableHead>
              <TableHead className="min-w-[140px] sticky left-[248px] bg-background z-10">Ad Soyad</TableHead>
              {dates.map((dd) => (
                <TableHead key={dd} className="w-10 text-center px-1">
                  <div className="text-[10px] text-muted-foreground leading-tight">
                    {getDayName(dd)}
                  </div>
                  <div className="text-xs font-medium">{getDayNum(dd)}</div>
                </TableHead>
              ))}
              <TableHead className="w-16 text-center">Saat</TableHead>
              <TableHead className="w-16 text-center">Mesai</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workers.map((w, idx) => {
              let totalH = 0;
              let totalO = 0;
              return (
                <TableRow key={w.id}>
                  <TableCell className="text-muted-foreground text-xs sticky left-0 bg-background">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="text-xs sticky left-10 bg-background">
                    {w.team.company.name}
                  </TableCell>
                  <TableCell className="text-xs sticky left-[152px] bg-background">
                    {w.team.name}
                  </TableCell>
                  <TableCell className="font-medium text-sm sticky left-[248px] bg-background">
                    {w.firstName} {w.lastName}
                  </TableCell>
                  {dates.map((dd) => {
                    const att = w.attendances.find((a) => a.date === dd);
                    if (att) {
                      totalH += att.totalHours;
                      totalO += att.overtime;
                    }
                    const status = att?.status ?? "ABSENT";
                    return (
                      <TableCell
                        key={dd}
                        className="text-center px-1"
                        title={`${dd}: ${STATUS_LABELS[status]}${att ? ` (${att.totalHours}s)` : ""}`}
                      >
                        <span className={`text-xs ${STATUS_SHORT_COLORS[status]}`}>
                          {STATUS_SHORT[status]}
                        </span>
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center text-xs font-medium">{totalH}</TableCell>
                  <TableCell className="text-center text-xs font-medium text-orange-600">
                    {totalO > 0 ? totalO : ""}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
