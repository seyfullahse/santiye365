"use client";

import { useEffect, useState } from "react";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
}

interface Mahal {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  project: { name: string };
  _count: { floors: number; activities: number };
}

interface MahalForm {
  projectId: string;
  name: string;
  description: string;
}

const emptyForm: MahalForm = {
  projectId: "",
  name: "",
  description: "",
};

export default function MahallerPage() {
  const [mahaller, setMahaller] = useState<Mahal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProjectId, setFilterProjectId] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMahal, setSelectedMahal] = useState<Mahal | null>(null);
  const [form, setForm] = useState<MahalForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchMahaller = async () => {
    try {
      const params = filterProjectId ? `?projectId=${filterProjectId}` : "";
      const res = await fetch(`/api/mahaller${params}`);
      if (!res.ok) throw new Error("Mahaller yüklenemedi");
      const data = await res.json();
      setMahaller(data);
    } catch {
      toast.error("Mahaller yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projeler");
      if (!res.ok) throw new Error("Projeler yüklenemedi");
      const data = await res.json();
      setProjects(data);
    } catch {
      toast.error("Projeler yüklenirken bir hata oluştu.");
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchMahaller();
  }, [filterProjectId]);

  const handleOpenCreate = () => {
    setSelectedMahal(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleOpenEdit = (mahal: Mahal) => {
    setSelectedMahal(mahal);
    setForm({
      projectId: mahal.projectId,
      name: mahal.name,
      description: mahal.description ?? "",
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (mahal: Mahal) => {
    setSelectedMahal(mahal);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.projectId || !form.name.trim()) {
      toast.error("Proje ve mahal adı zorunludur.");
      return;
    }

    setSubmitting(true);
    try {
      const isEdit = !!selectedMahal;
      const url = isEdit
        ? `/api/mahaller/${selectedMahal.id}`
        : "/api/mahaller";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: form.projectId,
          name: form.name.trim(),
          description: form.description.trim() || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.error || "İşlem başarısız oldu");
      }

      toast.success(isEdit ? "Mahal başarıyla güncellendi." : "Mahal başarıyla oluşturuldu.");
      setDialogOpen(false);
      setForm(emptyForm);
      setSelectedMahal(null);
      fetchMahaller();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMahal) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/mahaller/${selectedMahal.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.error || "Silme işlemi başarısız oldu");
      }

      toast.success("Mahal başarıyla silindi.");
      setDeleteDialogOpen(false);
      setSelectedMahal(null);
      fetchMahaller();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Mahaller</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Mahal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedMahal ? "Mahal Düzenle" : "Yeni Mahal Oluştur"}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 pt-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="projectId">Proje *</Label>
                <Select
                  value={form.projectId}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, projectId: value }))
                  }
                >
                  <SelectTrigger id="projectId">
                    <SelectValue placeholder="Proje seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Mahal Adı *</Label>
                <Input
                  id="name"
                  placeholder="Mahal adını giriniz"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  placeholder="Açıklama giriniz (isteğe bağlı)"
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  İptal
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting
                    ? "Kaydediliyor..."
                    : selectedMahal
                      ? "Güncelle"
                      : "Oluştur"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Mahal Listesi</CardTitle>
            <div className="w-64">
              <Select
                value={filterProjectId}
                onValueChange={(value) =>
                  setFilterProjectId(value === "all" ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Projeye göre filtrele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Projeler</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              Yükleniyor...
            </div>
          ) : mahaller.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <p>Henüz mahal bulunmuyor.</p>
              <p className="text-sm">
                Yeni bir mahal eklemek için &quot;Yeni Mahal&quot; butonuna
                tıklayın.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mahal Adı</TableHead>
                  <TableHead>Proje</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead className="text-center">Kat Sayısı</TableHead>
                  <TableHead className="text-center">
                    Aktivite Sayısı
                  </TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mahaller.map((mahal) => (
                  <TableRow key={mahal.id}>
                    <TableCell className="font-medium">{mahal.name}</TableCell>
                    <TableCell>{mahal.project.name}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {mahal.description || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {mahal._count.floors}
                    </TableCell>
                    <TableCell className="text-center">
                      {mahal._count.activities}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleOpenEdit(mahal)}
                          title="Düzenle"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleOpenDelete(mahal)}
                          title="Sil"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Silme Onay Dialogu */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mahal Sil</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-2">
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">
                {selectedMahal?.name}
              </span>{" "}
              adlı mahali silmek istediğinize emin misiniz? Bu işlem geri
              alınamaz.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={submitting}
              >
                İptal
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={submitting}
              >
                {submitting ? "Siliniyor..." : "Sil"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
