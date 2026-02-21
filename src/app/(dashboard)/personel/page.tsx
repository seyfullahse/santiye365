"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
import { Plus, HardHat, Calendar, Pencil } from "lucide-react";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
  company: { name: string };
  discipline: { name: string };
}

interface WorkforceEntry {
  id: string;
  projectId: string;
  date: string;
  teamId: string;
  workerCount: number;
  team: {
    name: string;
    company: { name: string };
    discipline: { name: string };
  };
  project: { name: string };
}

interface WorkforceForm {
  projectId: string;
  teamId: string;
  date: string;
  workerCount: number;
}

const EMPTY_FORM: WorkforceForm = {
  projectId: "",
  teamId: "",
  date: new Date().toISOString().split("T")[0],
  workerCount: 0,
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("tr-TR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function toDateKey(dateStr: string): string {
  return new Date(dateStr).toISOString().split("T")[0];
}

export default function PersonelPage() {
  const [entries, setEntries] = useState<WorkforceEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterProjectId, setFilterProjectId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<WorkforceEntry | null>(null);
  const [editCount, setEditCount] = useState<number>(0);
  const [form, setForm] = useState<WorkforceForm>(EMPTY_FORM);

  // Fetch projects and teams on mount
  useEffect(() => {
    Promise.all([
      fetch("/api/projeler").then((r) => r.json()),
      fetch("/api/ekipler").then((r) => r.json()),
    ]).then(([projeler, ekipler]) => {
      setProjects(projeler);
      setTeams(ekipler);
    });
  }, []);

  // Fetch workforce data
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterProjectId) params.set("projectId", filterProjectId);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const qs = params.toString();
      const url = qs ? `/api/personel?${qs}` : "/api/personel";
      const res = await fetch(url);
      const data = await res.json();
      setEntries(data);
    } catch {
      toast.error("Personel verileri yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [filterProjectId, startDate, endDate]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Summary: total worker count
  const totalWorkers = useMemo(
    () => entries.reduce((sum, e) => sum + e.workerCount, 0),
    [entries]
  );

  // Group entries by date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, WorkforceEntry[]> = {};
    for (const entry of entries) {
      const key = toDateKey(entry.date);
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    }
    // Sort dates descending
    const sortedKeys = Object.keys(groups).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );
    return sortedKeys.map((key) => ({ date: key, entries: groups[key] }));
  }, [entries]);

  // Handle form submit
  const handleSubmit = async () => {
    if (!form.projectId || !form.teamId || !form.date || form.workerCount <= 0) {
      toast.error("Lütfen tüm alanları doldurun");
      return;
    }
    try {
      const res = await fetch("/api/personel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("Personel kaydı başarıyla eklendi");
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      fetchEntries();
    } catch {
      toast.error("Personel kaydı eklenirken hata oluştu");
    }
  };

  const openEdit = (entry: WorkforceEntry) => {
    setEditEntry(entry);
    setEditCount(entry.workerCount);
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editEntry) return;
    if (editCount <= 0) {
      toast.error("Lütfen geçerli bir sayı girin");
      return;
    }
    try {
      const res = await fetch("/api/personel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: editEntry.projectId,
          teamId: editEntry.teamId,
          date: editEntry.date,
          workerCount: editCount,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Personel kaydı güncellendi");
      setEditDialogOpen(false);
      setEditEntry(null);
      fetchEntries();
    } catch {
      toast.error("Personel kaydı güncellenemedi");
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Günlük Personel</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Günlük iş gücü takibi ve raporlama
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setForm(EMPTY_FORM)}>
              <Plus className="mr-2 h-4 w-4" />
              Personel Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Günlük Personel Kaydı Ekle</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Project Select */}
              <div className="grid gap-2">
                <Label htmlFor="projectId">Proje</Label>
                <Select
                  value={form.projectId}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, projectId: v }))
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

              {/* Team Select */}
              <div className="grid gap-2">
                <Label htmlFor="teamId">Ekip</Label>
                <Select
                  value={form.teamId}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, teamId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ekip seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} — {t.company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className="grid gap-2">
                <Label htmlFor="date">Tarih</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, date: e.target.value }))
                  }
                />
              </div>

              {/* Worker Count */}
              <div className="grid gap-2">
                <Label htmlFor="workerCount">Personel Sayısı</Label>
                <Input
                  id="workerCount"
                  type="number"
                  min={1}
                  value={form.workerCount || ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      workerCount: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="Kişi sayısı"
                />
              </div>

              <Button onClick={handleSubmit} className="mt-2">
                Kaydet
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Personel Kaydını Güncelle</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-1 text-sm text-muted-foreground">
                <span>{editEntry?.project.name}</span>
                <span>{editEntry?.team.name} — {editEntry?.team.company.name}</span>
                <span>{editEntry ? formatDate(editEntry.date) : ""}</span>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editCount">Personel Sayısı</Label>
                <Input
                  id="editCount"
                  type="number"
                  min={1}
                  value={editCount || ""}
                  onChange={(e) => setEditCount(parseInt(e.target.value) || 0)}
                />
              </div>
              <Button onClick={handleUpdate} className="mt-2">
                Güncelle
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-end gap-3 sm:gap-4">
            <div className="grid gap-2">
              <Label>Proje</Label>
              <Select
                value={filterProjectId}
                onValueChange={setFilterProjectId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tüm projeler" />
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
            <div className="grid gap-2">
              <Label className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Başlangıç Tarihi
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Bitiş Tarihi
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            {(filterProjectId || startDate || endDate) && (
              <Button
                variant="outline"
                onClick={() => {
                  setFilterProjectId("");
                  setStartDate("");
                  setEndDate("");
                }}
              >
                Filtreleri Temizle
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Toplam Personel Sayısı
          </CardTitle>
          <HardHat className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalWorkers}</div>
          <p className="text-xs text-muted-foreground">
            {entries.length} kayıt ·{" "}
            {groupedByDate.length} gün
          </p>
        </CardContent>
      </Card>

      {/* Data Table grouped by date */}
      {loading ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Yükleniyor...
          </CardContent>
        </Card>
      ) : groupedByDate.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Kayıt bulunamadı. Yeni personel kaydı eklemek için yukarıdaki
            butonu kullanın.
          </CardContent>
        </Card>
      ) : (
        groupedByDate.map((group) => {
          const dayTotal = group.entries.reduce(
            (s, e) => s + e.workerCount,
            0
          );
          return (
            <Card key={group.date}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(group.date)}
                  </CardTitle>
                  <span className="text-sm font-medium text-muted-foreground">
                    Toplam: {dayTotal} kişi
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ekip</TableHead>
                      <TableHead>Şirket</TableHead>
                      <TableHead>Disiplin</TableHead>
                      <TableHead className="text-right">
                        Personel Sayısı
                      </TableHead>
                      <TableHead className="text-right">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">
                          {entry.team.name}
                        </TableCell>
                        <TableCell>{entry.team.company.name}</TableCell>
                        <TableCell>{entry.team.discipline.name}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {entry.workerCount}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(entry)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Düzenle</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
