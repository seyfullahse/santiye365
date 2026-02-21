"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { utils, read, writeFileXLSX } from "xlsx";

interface Project {
  id: string;
  name: string;
}

interface Zone {
  id: string;
  name: string;
}

interface Floor {
  id: string;
  name: string;
}

interface Discipline {
  id: string;
  name: string;
}

interface Activity {
  id: string;
  projectId: string;
  zoneId: string;
  floorId: string;
  disciplineId: string;
  name: string;
  weight: number;
  orderNo: number;
  progressPercent: number;
  plannedStart: string | null;
  plannedFinish: string | null;
  forecastFinish: string | null;
  actualFinish: string | null;
  isCritical: boolean;
  status: string;
  notes: string | null;
  project: { name: string };
  zone: { name: string };
  floor: { name: string };
  discipline: { name: string };
  _count: { approvals: number; risks: number; comments: number };
}

type ActivityStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "DELAYED"
  | "ON_HOLD";

const STATUS_LABELS: Record<ActivityStatus, string> = {
  NOT_STARTED: "Başlamadı",
  IN_PROGRESS: "Devam Ediyor",
  COMPLETED: "Tamamlandı",
  DELAYED: "Gecikmiş",
  ON_HOLD: "Beklemede",
};

function getStatusBadge(status: string) {
  switch (status) {
    case "NOT_STARTED":
      return <Badge variant="secondary">{STATUS_LABELS.NOT_STARTED}</Badge>;
    case "IN_PROGRESS":
      return <Badge variant="default">{STATUS_LABELS.IN_PROGRESS}</Badge>;
    case "COMPLETED":
      return (
        <Badge variant="outline" className="border-green-500 text-green-600">
          {STATUS_LABELS.COMPLETED}
        </Badge>
      );
    case "DELAYED":
      return <Badge variant="destructive">{STATUS_LABELS.DELAYED}</Badge>;
    case "ON_HOLD":
      return <Badge variant="outline">{STATUS_LABELS.ON_HOLD}</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

const EMPTY_FORM = {
  projectId: "",
  zoneId: "",
  floorId: "",
  disciplineId: "",
  name: "",
  weight: 0,
  orderNo: 0,
  progressPercent: 0,
  plannedStart: "",
  plannedFinish: "",
  forecastFinish: "",
  actualFinish: "",
  isCritical: false,
  status: "NOT_STARTED" as ActivityStatus,
  notes: "",
};

export default function AktivitelerPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [formZones, setFormZones] = useState<Zone[]>([]);
  const [formFloors, setFormFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterProjectId, setFilterProjectId] = useState<string>("");
  const [filterDisciplineId, setFilterDisciplineId] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExport = async () => {
    try {
      const res = await fetch("/api/aktiviteler");
      const allActivities: Activity[] = await res.json();
      const rows = allActivities.map((a) => ({
        SiraNo: a.orderNo ?? 0,
        Proje: a.project?.name ?? "",
        Mahal: a.zone?.name ?? "",
        Kat: a.floor?.name ?? "",
        Disiplin: a.discipline?.name ?? "",
        Ad: a.name,
        Agirlik: a.weight,
        Ilerleme: a.progressPercent,
        PlanBaslangic: a.plannedStart ? new Date(a.plannedStart).toISOString().split("T")[0] : "",
        PlanBitis: a.plannedFinish ? new Date(a.plannedFinish).toISOString().split("T")[0] : "",
        TahminiBitis: a.forecastFinish ? new Date(a.forecastFinish).toISOString().split("T")[0] : "",
        GercekBitis: a.actualFinish ? new Date(a.actualFinish).toISOString().split("T")[0] : "",
        Kritik: a.isCritical ? 1 : 0,
        Durum: a.status,
        Notlar: a.notes ?? "",
      }));

      const ws = utils.json_to_sheet(rows);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Aktiviteler");
      writeFileXLSX(wb, "aktiviteler.xlsx");
      toast.success(`${rows.length} aktivite dışa aktarıldı`);
    } catch {
      toast.error("Dışa aktarma başarısız");
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const parseBoolean = (val: unknown) => {
    if (typeof val === "boolean") return val;
    if (typeof val === "number") return val !== 0;
    if (typeof val === "string") {
      const v = val.toLowerCase();
      return v === "1" || v === "true" || v === "evet" || v === "kritik";
    }
    return false;
  };

  const findByName = <T extends { id: string; name: string }>(list: T[], name: unknown): string | null => {
    if (!name) return null;
    const n = String(name).trim().toLowerCase();
    const match = list.find((item) => item.name.toLowerCase() === n);
    return match?.id ?? null;
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const wb = read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = utils.sheet_to_json(ws);

      // Tüm mahalleri ve katları çek (isim eşleştirme için)
      const [allZones, allFloors] = await Promise.all([
        fetch("/api/mahaller").then((r) => r.json()),
        fetch("/api/katlar").then((r) => r.json()),
      ]);

      let success = 0;
      let fail = 0;
      const errors: string[] = [];

      for (let i = 0; i < (rows as Record<string, unknown>[]).length; i++) {
        const row = (rows as Record<string, unknown>[])[i];
        const rowNum = i + 2; // Excel satır numarası (1=başlık)
        const name = String(row.Ad || row.name || "").trim();

        if (!name) {
          errors.push(`Satır ${rowNum}: Ad boş`);
          fail++;
          continue;
        }

        // İsimden ID'ye çevir
        const projectId = findByName(projects, row.Proje || row.ProjeID || row.projectId);
        const zoneId = findByName(allZones, row.Mahal || row.MahalID || row.zoneId);
        const floorId = findByName(allFloors, row.Kat || row.KatID || row.floorId);
        const disciplineId = findByName(disciplines, row.Disiplin || row.DisiplinID || row.disciplineId);

        const missing: string[] = [];
        if (!projectId) missing.push("Proje");
        if (!zoneId) missing.push("Mahal");
        if (!floorId) missing.push("Kat");
        if (!disciplineId) missing.push("Disiplin");

        if (missing.length > 0) {
          errors.push(`Satır ${rowNum} (${name}): ${missing.join(", ")} bulunamadı`);
          fail++;
          continue;
        }

        const payload = {
          projectId,
          zoneId,
          floorId,
          disciplineId,
          orderNo: Number(row.SiraNo ?? row.orderNo ?? 0),
          name,
          weight: Number(row.Agirlik ?? row.weight ?? 0),
          progressPercent: Number(row.Ilerleme ?? row.progressPercent ?? 0),
          plannedStart: row.PlanBaslangic || row.plannedStart || null,
          plannedFinish: row.PlanBitis || row.plannedFinish || null,
          forecastFinish: row.TahminiBitis || row.forecastFinish || null,
          actualFinish: row.GercekBitis || row.actualFinish || null,
          isCritical: parseBoolean(row.Kritik ?? row.isCritical),
          status: String(row.Durum || row.status || "NOT_STARTED"),
          notes: (row.Notlar ?? row.notes ?? "") as string,
        };

        try {
          const res = await fetch("/api/aktiviteler", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error();
          success++;
        } catch (err) {
          console.error("Import hata", err);
          errors.push(`Satır ${rowNum} (${name}): API hatası`);
          fail++;
        }
      }

      toast.success(`İçeri aktarıldı: ${success} kayıt`);
      if (fail) {
        toast.warning(`${fail} kayıt atlandı`);
        errors.slice(0, 5).forEach((e) => toast.error(e));
      }
      fetchActivities();
    } catch (err) {
      console.error(err);
      toast.error("Excel içe aktarma başarısız oldu");
    } finally {
      e.target.value = "";
    }
  };

  // Fetch projects & disciplines on mount
  useEffect(() => {
    Promise.all([
      fetch("/api/projeler").then((r) => r.json()),
      fetch("/api/disiplinler").then((r) => r.json()),
    ]).then(([projeler, disiplinler]) => {
      setProjects(projeler);
      setDisciplines(disiplinler);
    });
  }, []);

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterProjectId) params.set("projectId", filterProjectId);
      if (filterDisciplineId) params.set("disciplineId", filterDisciplineId);
      const qs = params.toString();
      const url = qs ? `/api/aktiviteler?${qs}` : "/api/aktiviteler";
      const res = await fetch(url);
      const data = await res.json();
      setActivities(data);
      setSelectedIds(new Set());
    } catch {
      toast.error("Aktiviteler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [filterProjectId, filterDisciplineId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Cascading: when filter project changes, load zones for that project
  useEffect(() => {
    if (filterProjectId) {
      fetch(`/api/mahaller?projectId=${filterProjectId}`)
        .then((r) => r.json())
        .then(setZones);
    } else {
      setZones([]);
      setFloors([]);
    }
  }, [filterProjectId]);

  // Form cascading: load zones when form projectId changes
  useEffect(() => {
    if (form.projectId) {
      fetch(`/api/mahaller?projectId=${form.projectId}`)
        .then((r) => r.json())
        .then(setFormZones);
    } else {
      setFormZones([]);
      setFormFloors([]);
    }
  }, [form.projectId]);

  // Form cascading: load floors when form zoneId changes
  useEffect(() => {
    if (form.zoneId) {
      fetch(`/api/katlar?zoneId=${form.zoneId}`)
        .then((r) => r.json())
        .then(setFormFloors);
    } else {
      setFormFloors([]);
    }
  }, [form.zoneId]);

  function formatDate(val: string | null) {
    if (!val) return "-";
    return new Date(val).toLocaleDateString("tr-TR");
  }

  function toInputDate(val: string | null | undefined) {
    if (!val) return "";
    return new Date(val).toISOString().split("T")[0];
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormZones([]);
    setFormFloors([]);
    setDialogOpen(true);
  }

  async function openEdit(activity: Activity) {
    setEditingId(activity.id);
    setForm({
      projectId: activity.projectId,
      zoneId: activity.zoneId,
      floorId: activity.floorId,
      disciplineId: activity.disciplineId,
      name: activity.name,
      weight: activity.weight,
      orderNo: activity.orderNo ?? 0,
      progressPercent: activity.progressPercent,
      plannedStart: toInputDate(activity.plannedStart),
      plannedFinish: toInputDate(activity.plannedFinish),
      forecastFinish: toInputDate(activity.forecastFinish),
      actualFinish: toInputDate(activity.actualFinish),
      isCritical: activity.isCritical,
      status: activity.status as ActivityStatus,
      notes: activity.notes || "",
    });
    // Cascading: mahal ve katları yükle
    if (activity.projectId) {
      const [z, f] = await Promise.all([
        fetch(`/api/mahaller?projectId=${activity.projectId}`).then(r => r.json()),
        fetch(`/api/katlar?zoneId=${activity.zoneId}`).then(r => r.json()),
      ]);
      setFormZones(z);
      setFormFloors(f);
    }
    setDialogOpen(true);
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === activities.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(activities.map((a) => a.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.size) {
      toast.error("Silmek için kayıt seçin");
      return;
    }
    try {
      const res = await fetch("/api/aktiviteler", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error();
      toast.success("Seçilen aktiviteler silindi");
      setSelectedIds(new Set());
      fetchActivities();
    } catch {
      toast.error("Toplu silme başarısız oldu");
    }
  };

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Aktivite adı zorunludur");
      return;
    }
    if (!form.projectId) {
      toast.error("Proje seçimi zorunludur");
      return;
    }

    const body = {
      ...form,
      orderNo: Number(form.orderNo) || 0,
      weight: Number(form.weight),
      progressPercent: Number(form.progressPercent),
      plannedStart: form.plannedStart || null,
      plannedFinish: form.plannedFinish || null,
      forecastFinish: form.forecastFinish || null,
      actualFinish: form.actualFinish || null,
    };

    try {
      const res = editingId
        ? await fetch(`/api/aktiviteler/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/aktiviteler", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "İşlem başarısız");
      }

      toast.success(editingId ? "Aktivite güncellendi" : "Aktivite oluşturuldu");
      setDialogOpen(false);
      fetchActivities();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Bir hata oluştu";
      toast.error(message);
    }
  }

  function openDelete(id: string) {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/aktiviteler/${deletingId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Silme işlemi başarısız");
      toast.success("Aktivite silindi");
      setDeleteDialogOpen(false);
      setDeletingId(null);
      fetchActivities();
    } catch {
      toast.error("Aktivite silinirken hata oluştu");
    }
  }

  const totalWeight = activities.reduce(
    (sum, activity) => sum + Number(activity.weight || 0),
    0
  );

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="shrink-0">Aktiviteler</CardTitle>
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
              <Select
                value={filterProjectId}
                onValueChange={(val) =>
                  setFilterProjectId(val === "all" ? "" : val)
                }
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Proje filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Projeler</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filterDisciplineId}
                onValueChange={(val) =>
                  setFilterDisciplineId(val === "all" ? "" : val)
                }
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Disiplin filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Disiplinler</SelectItem>
                  {disciplines.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleExport} className="text-xs">
                Dışa Aktar
              </Button>
              <Button variant="outline" size="sm" onClick={handleImportClick} className="text-xs">
                İçe Aktar
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={handleImportFile}
              />
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreate} className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Aktivite
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Aktivite Düzenle" : "Yeni Aktivite"}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {/* Row: Proje & Disiplin */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Proje *</Label>
                      <Select
                        value={form.projectId}
                        onValueChange={(val) =>
                          setForm((f) => ({
                            ...f,
                            projectId: val,
                            zoneId: "",
                            floorId: "",
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Proje seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Disiplin</Label>
                      <Select
                        value={form.disciplineId}
                        onValueChange={(val) =>
                          setForm((f) => ({ ...f, disciplineId: val }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Disiplin seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {disciplines.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Row: Mahal & Kat */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Mahal</Label>
                      <Select
                        value={form.zoneId}
                        onValueChange={(val) =>
                          setForm((f) => ({ ...f, zoneId: val, floorId: "" }))
                        }
                        disabled={!form.projectId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Mahal seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {formZones.map((z) => (
                            <SelectItem key={z.id} value={z.id}>
                              {z.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Kat</Label>
                      <Select
                        value={form.floorId}
                        onValueChange={(val) =>
                          setForm((f) => ({ ...f, floorId: val }))
                        }
                        disabled={!form.zoneId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Kat seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {formFloors.map((fl) => (
                            <SelectItem key={fl.id} value={fl.id}>
                              {fl.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Sıra No & Aktivite Adı */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Sıra No</Label>
                      <Input
                        type="number"
                        min={0}
                        value={form.orderNo}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            orderNo: Number(e.target.value),
                          }))
                        }
                        placeholder="Sıra numarasını girin"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Aktivite Adı *</Label>
                      <Input
                        value={form.name}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, name: e.target.value }))
                        }
                        placeholder="Aktivite adını girin"
                      />
                    </div>
                  </div>

                  {/* Row: Ağırlık & İlerleme & Durum */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Ağırlık</Label>
                      <Input
                        type="number"
                        min={0}
                        value={form.weight}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            weight: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>İlerleme %</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={form.progressPercent}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            progressPercent: Math.min(
                              100,
                              Math.max(0, Number(e.target.value))
                            ),
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Durum</Label>
                      <Select
                        value={form.status}
                        onValueChange={(val) =>
                          setForm((f) => ({
                            ...f,
                            status: val as ActivityStatus,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            Object.keys(STATUS_LABELS) as ActivityStatus[]
                          ).map((key) => (
                            <SelectItem key={key} value={key}>
                              {STATUS_LABELS[key]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Row: Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Planlanan Başlangıç</Label>
                      <Input
                        type="date"
                        value={form.plannedStart}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            plannedStart: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Planlanan Bitiş</Label>
                      <Input
                        type="date"
                        value={form.plannedFinish}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            plannedFinish: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Öngörülen Bitiş</Label>
                      <Input
                        type="date"
                        value={form.forecastFinish}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            forecastFinish: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Gerçekleşen Bitiş</Label>
                      <Input
                        type="date"
                        value={form.actualFinish}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            actualFinish: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  {/* Kritik */}
                  <div className="space-y-2">
                    <Label>Kritik</Label>
                    <Select
                      value={form.isCritical ? "true" : "false"}
                      onValueChange={(val) =>
                        setForm((f) => ({
                          ...f,
                          isCritical: val === "true",
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">Hayır</SelectItem>
                        <SelectItem value="true">Evet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Notlar */}
                  <div className="space-y-2">
                    <Label>Notlar</Label>
                    <Textarea
                      value={form.notes}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, notes: e.target.value }))
                      }
                      placeholder="Varsa notlarınızı girin"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button onClick={handleSubmit}>
                    {editingId ? "Güncelle" : "Oluştur"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            {selectedIds.size > 0 && (
              <Button variant="destructive" onClick={handleBulkDelete}>
                Seçilenleri Sil ({selectedIds.size})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">
              Yükleniyor...
            </div>
          ) : activities.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              Henüz aktivite bulunmamaktadır.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        aria-label="Tümünü seç"
                        onChange={toggleSelectAll}
                        checked={selectedIds.size === activities.length && activities.length > 0}
                      />
                    </TableHead>
                    <TableHead className="w-24 text-center">Sıra</TableHead>
                    <TableHead>Aktivite Adı</TableHead>
                    <TableHead>Disiplin</TableHead>
                    <TableHead>Mahal</TableHead>
                    <TableHead>Kat</TableHead>
                    <TableHead className="text-right">Ağırlık</TableHead>
                    <TableHead className="text-right">İlerleme %</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Kritik</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          aria-label="Aktivite seç"
                          checked={selectedIds.has(activity.id)}
                          onChange={() => toggleSelect(activity.id)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        {activity.orderNo ?? 0}
                      </TableCell>
                      <TableCell className="font-medium">
                        {activity.name}
                      </TableCell>
                      <TableCell>{activity.discipline?.name ?? "-"}</TableCell>
                      <TableCell>{activity.zone?.name ?? "-"}</TableCell>
                      <TableCell>{activity.floor?.name ?? "-"}</TableCell>
                      <TableCell className="text-right">
                        {activity.weight}
                      </TableCell>
                      <TableCell className="text-right">
                        %{activity.progressPercent}
                      </TableCell>
                      <TableCell>{getStatusBadge(activity.status)}</TableCell>
                      <TableCell>
                        {activity.isCritical ? (
                          <Badge variant="destructive">Evet</Badge>
                        ) : (
                          <span className="text-muted-foreground">Hayır</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(activity)}
                            title="Düzenle"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDelete(activity.id)}
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                <span>Toplam Ağırlık</span>
                <span className="font-semibold text-foreground">{totalWeight}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aktiviteyi Sil</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bu aktiviteyi silmek istediğinizden emin misiniz? Bu işlem geri
            alınamaz.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Sil
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
