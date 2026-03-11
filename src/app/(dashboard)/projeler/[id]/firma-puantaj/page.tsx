// @ts-nocheck
"use client";

import { useEffect, useState, useCallback, useMemo, Fragment } from "react";
import { useParams } from "next/navigation";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  ChevronLeft,
  ChevronRight,
  Users,
  UserCheck,
  UserX,
  CalendarDays,
  Sun,
  Moon,
  Plus,
  Search,
  Trash2,
  UserPlus,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";

// ─── Tipler ──────────────────────────────────────────────
type AttendanceStatus = "PRESENT" | "HALF_DAY" | "ABSENT" | "DAY_OFF";
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

interface PoolWorker {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  team: {
    name: string;
    company: { id: string; name: string; type: string };
    discipline: { name: string };
  };
}

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
  DAY_OFF: "Hafta Tatili",
};

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  PRESENT: "bg-green-500",
  HALF_DAY: "bg-blue-500",
  ABSENT: "bg-red-500",
  DAY_OFF: "bg-gray-400",
};

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const turkishDays = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

/* ═══════════════════════════════════════════════════════════ */
export default function FirmaPuantajPage() {
  const params = useParams();
  const projectId = params.id as string;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-teal-600" />
          Firma Puantaj
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Firma çalışanlarının günlük devam takibi
        </p>
      </div>

      <Tabs defaultValue="gunluk" className="space-y-4">
        <TabsList>
          <TabsTrigger value="gunluk" className="gap-2">
            <CalendarDays className="h-4 w-4" /> Günlük Puantaj
          </TabsTrigger>
          <TabsTrigger value="atamalar" className="gap-2">
            <Users className="h-4 w-4" /> Çalışan Atamaları
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gunluk">
          <GunlukPuantaj projectId={projectId} />
        </TabsContent>

        <TabsContent value="atamalar">
          <CalisanAtamalari projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   GÜNLÜK PUANTAJ (projeye atanmış firma çalışanları için)
   ═══════════════════════════════════════════════════════════ */
function GunlukPuantaj({ projectId }: { projectId: string }) {
  const [date, setDate] = useState(() => formatDate(new Date()));
  const [shift, setShift] = useState<ShiftType>("DAY");
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMap, setEditMap] = useState<Record<string, EditRow>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const currentDate = useMemo(() => new Date(date + "T00:00:00"), [date]);
  const dayName = turkishDays[currentDate.getDay()];
  const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/projeler/${projectId}/puantaj?date=${date}&shift=${shift}`
      );
      if (!res.ok) throw new Error();
      const data: WorkerRow[] = await res.json();
      setWorkers(data);

      // EditMap oluştur
      const map: Record<string, EditRow> = {};
      data.forEach((w) => {
        const att = w.attendances.find((a) => a.shift === shift);
        map[w.id] = {
          workerId: w.id,
          shift,
          status: att?.status || (isWeekend ? "DAY_OFF" : "ABSENT"),
          totalHours: att?.totalHours ?? (isWeekend ? 0 : 8),
          overtime: att?.overtime ?? 0,
          note: att?.note || "",
        };
      });
      setEditMap(map);
      setHasChanges(false);
    } catch {
      toast.error("Puantaj verileri yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [projectId, date, shift, isWeekend]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateRow = (workerId: string, field: keyof EditRow, value: any) => {
    setEditMap((prev) => {
      const current = prev[workerId];
      if (!current) return prev;
      const updated = { ...current, [field]: value };
      if (field === "status") {
        if (value === "PRESENT") updated.totalHours = 8;
        else if (value === "HALF_DAY") updated.totalHours = 4;
        else if (value === "ABSENT" || value === "DAY_OFF") {
          updated.totalHours = 0;
          updated.overtime = 0;
        }
      }
      return { ...prev, [workerId]: updated };
    });
    setHasChanges(true);
  };

  const markAll = (status: AttendanceStatus) => {
    setEditMap((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        next[id] = {
          ...next[id],
          status,
          totalHours: status === "PRESENT" ? 8 : status === "HALF_DAY" ? 4 : 0,
          overtime: status === "ABSENT" || status === "DAY_OFF" ? 0 : next[id].overtime,
        };
      });
      return next;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = Object.values(editMap);
      const res = await fetch(`/api/projeler/${projectId}/puantaj`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, shift, records }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(`${data.count} kayıt kaydedildi`);
      setHasChanges(false);
      fetchData();
    } catch {
      toast.error("Kayıt başarısız");
    } finally {
      setSaving(false);
    }
  };

  const goDate = (delta: number) => {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + delta);
    setDate(formatDate(d));
  };

  // Firma bazlı gruplama
  const grouped = useMemo(() => {
    const groups: Record<string, { company: { id: string; name: string; type: string }; workers: WorkerRow[] }> = {};
    workers.forEach((w) => {
      const cid = w.team.company.id;
      if (!groups[cid]) groups[cid] = { company: w.team.company, workers: [] };
      groups[cid].workers.push(w);
    });
    return Object.values(groups);
  }, [workers]);

  // İstatistikler
  const stats = useMemo(() => {
    const total = Object.keys(editMap).length;
    const present = Object.values(editMap).filter((r) => r.status === "PRESENT").length;
    const halfDay = Object.values(editMap).filter((r) => r.status === "HALF_DAY").length;
    const absent = Object.values(editMap).filter((r) => r.status === "ABSENT").length;
    return { total, present, halfDay, absent };
  }, [editMap]);

  if (workers.length === 0 && !loading) {
    return (
      <Card className="border-dashed border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="py-10 text-center">
          <Users className="h-12 w-12 mx-auto mb-3 text-amber-500 opacity-50" />
          <p className="font-medium text-amber-800 dark:text-amber-200">Projeye henüz çalışan atanmamış</p>
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
            &quot;Çalışan Atamaları&quot; sekmesinden projeye çalışan atayın
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Üst Kontroller */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Tarih Navigasyonu */}
        <div className="flex items-center gap-1 border rounded-lg p-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => goDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-8 w-36 border-0 text-center text-sm"
          />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => goDate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Badge variant={isWeekend ? "destructive" : "outline"} className="text-xs">
          {dayName}
        </Badge>

        {/* Vardiya */}
        <div className="flex items-center gap-1 border rounded-lg p-1">
          <Button
            variant={shift === "DAY" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setShift("DAY")}
          >
            <Sun className="h-3 w-3" /> Gündüz
          </Button>
          <Button
            variant={shift === "NIGHT" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setShift("NIGHT")}
          >
            <Moon className="h-3 w-3" /> Gece
          </Button>
        </div>

        {/* Toplu İşlemler */}
        <div className="flex items-center gap-1 ml-auto">
          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => markAll("PRESENT")}>
            <CheckCircle2 className="h-3 w-3 text-green-500" /> Hepsi Geldi
          </Button>
          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => markAll("ABSENT")}>
            <XCircle className="h-3 w-3 text-red-500" /> Hepsi Gelmedi
          </Button>
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Toplam</p>
          <p className="text-xl font-bold">{stats.total}</p>
        </CardContent></Card>
        <Card className="border-l-4 border-l-green-500"><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Geldi</p>
          <p className="text-xl font-bold text-green-600">{stats.present}</p>
        </CardContent></Card>
        <Card className="border-l-4 border-l-blue-500"><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Yarım Gün</p>
          <p className="text-xl font-bold text-blue-600">{stats.halfDay}</p>
        </CardContent></Card>
        <Card className="border-l-4 border-l-red-500"><CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">Gelmedi</p>
          <p className="text-xl font-bold text-red-600">{stats.absent}</p>
        </CardContent></Card>
      </div>

      {/* Puantaj Tablosu */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Çalışan</TableHead>
                  <TableHead className="w-[120px]">Görev</TableHead>
                  <TableHead className="w-[140px]">Durum</TableHead>
                  <TableHead className="w-[90px] text-center">Saat</TableHead>
                  <TableHead className="w-[90px] text-center">Mesai</TableHead>
                  <TableHead>Not</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grouped.map((group) => (
                  <Fragment key={group.company.id}>
                    {/* Firma Başlığı */}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={6} className="py-2 font-semibold text-sm">
                        🏢 {group.company.name}
                        <Badge variant="outline" className="ml-2 text-xs">{group.workers.length} kişi</Badge>
                      </TableCell>
                    </TableRow>
                    {/* Çalışanlar */}
                    {group.workers.map((w) => {
                      const edit = editMap[w.id];
                      if (!edit) return null;
                      return (
                        <TableRow key={w.id}>
                          <TableCell className="font-medium text-sm">
                            {w.firstName} {w.lastName}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{w.role}</TableCell>
                          <TableCell>
                            <Select
                              value={edit.status}
                              onValueChange={(v) => updateRow(w.id, "status", v)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                                  <SelectItem key={val} value={val}>
                                    <span className="flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[val as AttendanceStatus]}`} />
                                      {label}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={edit.totalHours}
                              onChange={(e) => updateRow(w.id, "totalHours", Number(e.target.value))}
                              className="h-8 w-16 text-center text-sm mx-auto"
                              min={0}
                              max={24}
                              step={0.5}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={edit.overtime}
                              onChange={(e) => updateRow(w.id, "overtime", Number(e.target.value))}
                              className="h-8 w-16 text-center text-sm mx-auto"
                              min={0}
                              max={16}
                              step={0.5}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={edit.note}
                              onChange={(e) => updateRow(w.id, "note", e.target.value)}
                              className="h-8 text-sm"
                              placeholder="Not..."
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Kaydet */}
      {hasChanges && (
        <div className="sticky bottom-4 flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gap-2 shadow-lg">
            <Save className="h-4 w-4" />
            {saving ? "Kaydediliyor..." : "Puantajı Kaydet"}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ÇALIŞAN ATAMALARI (projeye çalışan ata/çıkar)
   ═══════════════════════════════════════════════════════════ */
function CalisanAtamalari({ projectId }: { projectId: string }) {
  const [assigned, setAssigned] = useState<(WorkerRow & { assignmentId: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [poolOpen, setPoolOpen] = useState(false);
  const [pool, setPool] = useState<PoolWorker[]>([]);
  const [poolLoading, setPoolLoading] = useState(false);
  const [poolSearch, setPoolSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [assigning, setAssigning] = useState(false);

  const fetchAssigned = useCallback(async () => {
    try {
      const res = await fetch(`/api/projeler/${projectId}/puantaj/atamalar`);
      if (!res.ok) throw new Error();
      setAssigned(await res.json());
    } catch {
      toast.error("Atamalar yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchAssigned(); }, [fetchAssigned]);

  const fetchPool = useCallback(async (search: string) => {
    setPoolLoading(true);
    try {
      const res = await fetch(`/api/projeler/${projectId}/puantaj/havuz?search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error();
      setPool(await res.json());
    } catch {
      toast.error("Çalışan havuzu yüklenemedi");
    } finally {
      setPoolLoading(false);
    }
  }, [projectId]);

  const openPool = () => {
    setPoolOpen(true);
    setPoolSearch("");
    setSelectedIds(new Set());
    fetchPool("");
  };

  const handlePoolSearch = (val: string) => {
    setPoolSearch(val);
    fetchPool(val);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === pool.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pool.map((w) => w.id)));
    }
  };

  const handleAssign = async () => {
    if (selectedIds.size === 0) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/projeler/${projectId}/puantaj/atamalar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerIds: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(data.message);
      setPoolOpen(false);
      fetchAssigned();
    } catch {
      toast.error("Atama başarısız");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (workerId: string, name: string) => {
    if (!confirm(`${name} adlı çalışanı projeden çıkarmak istediğinize emin misiniz?`)) return;
    try {
      const res = await fetch(`/api/projeler/${projectId}/puantaj/atamalar?workerId=${workerId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Çalışan projeden çıkarıldı");
      fetchAssigned();
    } catch {
      toast.error("Çıkarma başarısız");
    }
  };

  // Firma bazlı gruplama
  const grouped = useMemo(() => {
    const groups: Record<string, { company: { name: string; type: string }; workers: typeof assigned }> = {};
    assigned.forEach((w) => {
      const cid = w.team?.company?.id || "unknown";
      if (!groups[cid]) groups[cid] = { company: w.team?.company || { name: "Bilinmiyor", type: "MAIN" }, workers: [] };
      groups[cid].workers.push(w);
    });
    return Object.values(groups);
  }, [assigned]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Projeye <strong>{assigned.length}</strong> çalışan atanmış
          </p>
        </div>
        <Button onClick={openPool} size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Çalışan Ekle
        </Button>
      </div>

      {/* Atanmış Çalışanlar */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : assigned.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Users className="h-10 w-10 mb-2 opacity-30" />
              <p>Henüz projeye çalışan atanmamış</p>
              <p className="text-xs mt-1">&quot;Çalışan Ekle&quot; butonundan başlayın</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>Görev</TableHead>
                  <TableHead>Firma</TableHead>
                  <TableHead>Ekip</TableHead>
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grouped.map((group) => (
                  <Fragment key={group.company.name}>
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={5} className="py-2 font-semibold text-sm">
                        🏢 {group.company.name}
                        <Badge variant="outline" className="ml-2 text-xs">{group.workers.length} kişi</Badge>
                      </TableCell>
                    </TableRow>
                    {group.workers.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-green-500" />
                            {w.firstName} {w.lastName}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{w.role}</TableCell>
                        <TableCell className="text-muted-foreground">{w.team?.company?.name}</TableCell>
                        <TableCell className="text-muted-foreground">{w.team?.name}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleRemove(w.id, `${w.firstName} ${w.lastName}`)}
                            title="Projeden Çıkar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Çalışan Havuzu Dialog */}
      <Dialog open={poolOpen} onOpenChange={setPoolOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Projeye Çalışan Ata
            </DialogTitle>
          </DialogHeader>

          {/* Arama */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ad, soyad veya görev ile ara..."
              value={poolSearch}
              onChange={(e) => handlePoolSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Seçim Bilgisi */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {pool.length} çalışan mevcut · <strong>{selectedIds.size}</strong> seçili
            </span>
            <Button variant="ghost" size="sm" className="text-xs" onClick={selectAll}>
              {selectedIds.size === pool.length ? "Tümünü Kaldır" : "Tümünü Seç"}
            </Button>
          </div>

          {/* Liste */}
          <div className="flex-1 overflow-y-auto border rounded-md max-h-[400px]">
            {poolLoading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : pool.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                {poolSearch ? "Aramayla eşleşen çalışan bulunamadı" : "Atanabilecek çalışan bulunamadı"}
              </div>
            ) : (
              <div className="divide-y">
                {pool.map((w) => (
                  <label
                    key={w.id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedIds.has(w.id) ? "bg-primary/5" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(w.id)}
                      onChange={() => toggleSelect(w.id)}
                      className="rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {w.firstName} {w.lastName}
                        <span className="ml-2 text-muted-foreground font-normal">— {w.role}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {w.team.company.name} · {w.team.name} · {w.team.discipline.name}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Ata butonu */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setPoolOpen(false)}>İptal</Button>
            <Button onClick={handleAssign} disabled={selectedIds.size === 0 || assigning} className="gap-2">
              <Plus className="h-4 w-4" />
              {assigning ? "Atanıyor..." : `${selectedIds.size} Çalışan Ata`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
