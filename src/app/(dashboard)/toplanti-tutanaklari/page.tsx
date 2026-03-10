"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  DialogFooter,
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
import {
  Plus,
  Trash2,
  ClipboardCheck,
  Search,
  Eye,
  CalendarDays,
  MapPin,
  Users,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

/* ─────── Types ─────── */
interface Project {
  id: string;
  name: string;
}

interface Meeting {
  id: string;
  title: string;
  meetingNo: number;
  type: string;
  status: string;
  date: string;
  location: string | null;
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
  project: { id: string; name: string } | null;
  participants: { id: string; name: string; company: string | null; isPresent: boolean }[];
  _count: { items: number; columns: number };
}

const MEETING_TYPES = [
  { value: "ISVEREN", label: "İşveren Toplantısı" },
  { value: "TASERON", label: "Taşeron Toplantısı" },
  { value: "KOORDINASYON", label: "Koordinasyon Toplantısı" },
  { value: "ISG", label: "İSG Toplantısı" },
  { value: "TEKNIK", label: "Teknik Toplantı" },
  { value: "HAFTALIK", label: "Haftalık Toplantı" },
  { value: "DIGER", label: "Diğer" },
];

const MEETING_STATUSES = [
  { value: "PLANNED", label: "Planlandı", color: "bg-blue-100 text-blue-700" },
  { value: "IN_PROGRESS", label: "Devam Ediyor", color: "bg-yellow-100 text-yellow-700" },
  { value: "COMPLETED", label: "Tamamlandı", color: "bg-green-100 text-green-700" },
  { value: "CANCELLED", label: "İptal", color: "bg-red-100 text-red-700" },
];

function getTypeLabel(type: string) {
  return MEETING_TYPES.find((t) => t.value === type)?.label ?? type;
}

function getStatusBadge(status: string) {
  const s = MEETING_STATUSES.find((st) => st.value === status);
  if (!s) return <Badge variant="outline">{status}</Badge>;
  return <Badge className={s.color}>{s.label}</Badge>;
}

export default function ToplantiTutanaklariPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterProject, setFilterProject] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    projectId: "",
    title: "",
    type: "HAFTALIK",
    date: new Date().toISOString().split("T")[0],
    location: "",
    startTime: "",
    endTime: "",
    notes: "",
    participants: [{ name: "", company: "", role: "" }],
  });
  const [saving, setSaving] = useState(false);

  const fetchMeetings = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterProject) params.set("projectId", filterProject);
      if (filterType) params.set("type", filterType);
      if (filterStatus) params.set("status", filterStatus);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/toplanti-tutanaklari?${params}`);
      if (!res.ok) throw new Error("Toplantılar yüklenemedi");
      const data = await res.json();
      setMeetings(data);
    } catch {
      toast.error("Toplantılar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [filterProject, filterType, filterStatus, searchQuery]);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projeler");
      if (!res.ok) return;
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : data.projects || []);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handleCreate = async () => {
    if (!form.title) {
      toast.error("Toplantı başlığı zorunludur");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/toplanti-tutanaklari", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          type: form.type,
          date: form.date,
          location: form.location || null,
          startTime: form.startTime || null,
          endTime: form.endTime || null,
          notes: form.notes || null,
          projectId: form.projectId || null,
          participants: form.participants.filter((p) => p.name.trim()),
        }),
      });
      if (!res.ok) throw new Error("Oluşturulamadı");
      const newMeeting = await res.json();
      toast.success("Toplantı tutanağı oluşturuldu");
      setCreateOpen(false);
      setForm({
        projectId: "",
        title: "",
        type: "HAFTALIK",
        date: new Date().toISOString().split("T")[0],
        location: "",
        startTime: "",
        endTime: "",
        notes: "",
        participants: [{ name: "", company: "", role: "" }],
      });
      router.push(`/toplanti-tutanaklari/${newMeeting.id}`);
    } catch {
      toast.error("Toplantı oluşturulurken hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu toplantı tutanağını silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/toplanti-tutanaklari/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Toplantı silindi");
      fetchMeetings();
    } catch {
      toast.error("Silinemedi");
    }
  };

  const addParticipantRow = () => {
    setForm((f) => ({
      ...f,
      participants: [...f.participants, { name: "", company: "", role: "" }],
    }));
  };

  const updateParticipant = (index: number, field: string, value: string) => {
    setForm((f) => ({
      ...f,
      participants: f.participants.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      ),
    }));
  };

  const removeParticipant = (index: number) => {
    setForm((f) => ({
      ...f,
      participants: f.participants.filter((_, i) => i !== index),
    }));
  };

  /* ─────── Stats ─────── */
  const totalMeetings = meetings.length;
  const completedMeetings = meetings.filter((m) => m.status === "COMPLETED").length;
  const totalItems = meetings.reduce((sum, m) => sum + m._count.items, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-7 w-7 text-lime-600" />
            Toplantı Tutanakları
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Haftalık toplantı tutanaklarını yönetin ve takip edin
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Toplantı
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Yeni Toplantı Tutanağı</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Proje</Label>
                  <Select
                    value={form.projectId}
                    onValueChange={(v) => setForm((f) => ({ ...f, projectId: v === "none" ? "" : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Proje seçin (opsiyonel)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Proje Atanmasın</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Toplantı Türü</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEETING_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Toplantı Başlığı *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Örn: 12. Hafta Koordinasyon Toplantısı"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tarih</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Başlangıç Saati</Label>
                  <Input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bitiş Saati</Label>
                  <Input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Toplantı Yeri</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="Örn: Şantiye Ofisi"
                />
              </div>

              <div className="space-y-2">
                <Label>Genel Notlar</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Toplantı ile ilgili genel açıklama..."
                  rows={3}
                />
              </div>

              {/* Katılımcılar */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-semibold">Katılımcılar</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addParticipantRow}>
                    <Plus className="mr-1 h-3 w-3" /> Katılımcı Ekle
                  </Button>
                </div>
                {form.participants.map((p, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      placeholder="Ad Soyad"
                      value={p.name}
                      onChange={(e) => updateParticipant(i, "name", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Firma"
                      value={p.company}
                      onChange={(e) => updateParticipant(i, "company", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Görev"
                      value={p.role}
                      onChange={(e) => updateParticipant(i, "role", e.target.value)}
                      className="w-32"
                    />
                    {form.participants.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeParticipant(i)}
                        className="text-destructive shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? "Oluşturuluyor..." : "Oluştur"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-lime-600" />
              <div>
                <p className="text-2xl font-bold">{totalMeetings}</p>
                <p className="text-sm text-muted-foreground">Toplam Toplantı</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{completedMeetings}</p>
                <p className="text-sm text-muted-foreground">Tamamlanan</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{totalItems}</p>
                <p className="text-sm text-muted-foreground">Toplam Madde</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Toplantı ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tüm Projeler" />
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
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tüm Türler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Türler</SelectItem>
                {MEETING_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Tüm Durumlar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                {MEETING_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Toplantılar</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Yükleniyor...
            </div>
          ) : meetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ClipboardCheck className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">Henüz toplantı tutanağı yok</p>
              <p className="text-sm">Yeni bir toplantı oluşturarak başlayın</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">No</TableHead>
                    <TableHead>Başlık</TableHead>
                    <TableHead>Proje</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Katılımcı</TableHead>
                    <TableHead>Madde</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="w-24 text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meetings.map((m) => (
                    <TableRow
                      key={m.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/toplanti-tutanaklari/${m.id}`)}
                    >
                      <TableCell className="font-mono font-semibold">
                        #{m.meetingNo}
                      </TableCell>
                      <TableCell className="font-medium max-w-[250px] truncate">
                        {m.title}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {m.project?.name || <span className="italic text-xs">Proje atanmamış</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(m.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                        {new Date(m.date).toLocaleDateString("tr-TR")}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          {m.participants.length}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {m._count.items} madde
                      </TableCell>
                      <TableCell>{getStatusBadge(m.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/toplanti-tutanaklari/${m.id}`)}
                            title="Görüntüle"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(m.id)}
                            className="text-destructive hover:text-destructive"
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
