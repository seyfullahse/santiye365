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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Floor {
  id: string;
  projectId: string;
  zoneId: string;
  name: string;
  orderNo: number;
  project: { name: string };
  zone: { name: string };
  _count: { activities: number };
}

interface Project {
  id: string;
  name: string;
}

interface Zone {
  id: string;
  name: string;
  projectId: string;
}

export default function KatlarPage() {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [filteredZones, setFilteredZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [deletingFloor, setDeletingFloor] = useState<Floor | null>(null);

  const [formProjectId, setFormProjectId] = useState("");
  const [formZoneId, setFormZoneId] = useState("");
  const [formName, setFormName] = useState("");
  const [formOrderNo, setFormOrderNo] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const fetchFloors = async () => {
    try {
      const res = await fetch("/api/katlar");
      if (!res.ok) throw new Error("Katlar yüklenemedi");
      const data = await res.json();
      setFloors(data);
    } catch {
      toast.error("Katlar yüklenirken bir hata oluştu.");
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

  const fetchZones = async (projectId?: string) => {
    try {
      const url = projectId
        ? `/api/mahaller?projectId=${projectId}`
        : "/api/mahaller";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Mahaller yüklenemedi");
      const data = await res.json();
      if (projectId) {
        setFilteredZones(data);
      } else {
        setZones(data);
      }
    } catch {
      toast.error("Mahaller yüklenirken bir hata oluştu.");
    }
  };

  useEffect(() => {
    fetchFloors();
    fetchProjects();
    fetchZones();
  }, []);

  useEffect(() => {
    if (formProjectId) {
      fetchZones(formProjectId);
      setFormZoneId("");
    } else {
      setFilteredZones([]);
    }
  }, [formProjectId]);

  const resetForm = () => {
    setFormProjectId("");
    setFormZoneId("");
    setFormName("");
    setFormOrderNo(0);
    setEditingFloor(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (floor: Floor) => {
    setEditingFloor(floor);
    setFormProjectId(floor.projectId);
    setFormName(floor.name);
    setFormOrderNo(floor.orderNo);
    // Zone will be set after filteredZones are loaded via the useEffect
    setTimeout(() => setFormZoneId(floor.zoneId), 300);
    setDialogOpen(true);
  };

  const openDeleteDialog = (floor: Floor) => {
    setDeletingFloor(floor);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formProjectId || !formZoneId || !formName.trim()) {
      toast.error("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }

    setSubmitting(true);

    try {
      const body = {
        projectId: formProjectId,
        zoneId: formZoneId,
        name: formName.trim(),
        orderNo: formOrderNo,
      };

      let res: Response;

      if (editingFloor) {
        res = await fetch(`/api/katlar/${editingFloor.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch("/api/katlar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "İşlem başarısız oldu");
      }

      toast.success(
        editingFloor ? "Kat başarıyla güncellendi." : "Kat başarıyla eklendi."
      );
      setDialogOpen(false);
      resetForm();
      fetchFloors();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Bir hata oluştu."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingFloor) return;

    setSubmitting(true);

    try {
      const res = await fetch(`/api/katlar/${deletingFloor.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Silme işlemi başarısız oldu");
      }

      toast.success("Kat başarıyla silindi.");
      setDeleteDialogOpen(false);
      setDeletingFloor(null);
      fetchFloors();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Silme sırasında bir hata oluştu."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Katlar</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Projelere ait kat bilgilerini yönetin.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Kat
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingFloor ? "Kat Düzenle" : "Yeni Kat Ekle"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="projectId">Proje</Label>
                <Select value={formProjectId} onValueChange={setFormProjectId}>
                  <SelectTrigger id="projectId">
                    <SelectValue placeholder="Proje seçin" />
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

              <div className="grid gap-2">
                <Label htmlFor="zoneId">Mahal</Label>
                <Select
                  value={formZoneId}
                  onValueChange={setFormZoneId}
                  disabled={!formProjectId}
                >
                  <SelectTrigger id="zoneId">
                    <SelectValue
                      placeholder={
                        formProjectId
                          ? "Mahal seçin"
                          : "Önce proje seçin"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredZones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Kat Adı</Label>
                <Input
                  id="name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Örn: Zemin Kat, 1. Kat"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="orderNo">Sıra No</Label>
                <Input
                  id="orderNo"
                  type="number"
                  value={formOrderNo}
                  onChange={(e) => setFormOrderNo(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                İptal
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting
                  ? "Kaydediliyor..."
                  : editingFloor
                  ? "Güncelle"
                  : "Ekle"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kat Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Yükleniyor...</p>
            </div>
          ) : floors.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">
                Henüz kat eklenmemiş.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kat Adı</TableHead>
                  <TableHead>Proje</TableHead>
                  <TableHead>Mahal</TableHead>
                  <TableHead>Sıra No</TableHead>
                  <TableHead>Aktivite Sayısı</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {floors.map((floor) => (
                  <TableRow key={floor.id}>
                    <TableCell className="font-medium">{floor.name}</TableCell>
                    <TableCell>{floor.project?.name}</TableCell>
                    <TableCell>{floor.zone?.name}</TableCell>
                    <TableCell>{floor.orderNo}</TableCell>
                    <TableCell>{floor._count?.activities ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditDialog(floor)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openDeleteDialog(floor)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
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

      {/* Silme Onay Diyaloğu */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Katı Sil</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">
              {deletingFloor?.name}
            </span>{" "}
            katını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletingFloor(null);
              }}
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
