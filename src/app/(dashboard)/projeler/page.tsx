"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface Project {
  id: string;
  name: string;
  client: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  totalProgress: number;
  _count: { zones: number; activities: number };
}

const statusLabels: Record<string, string> = {
  ACTIVE: "Aktif",
  COMPLETED: "Tamamlandı",
  ON_HOLD: "Beklemede",
  CANCELLED: "İptal",
};

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  COMPLETED: "secondary",
  ON_HOLD: "outline",
  CANCELLED: "destructive",
};

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projeler");
      const data = await res.json();
      setProjects(data);
    } catch {
      toast.error("Projeler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const body = {
      name: formData.get("name"),
      client: formData.get("client"),
      startDate: formData.get("startDate") || null,
      endDate: formData.get("endDate") || null,
      status: formData.get("status") || "ACTIVE",
    };

    try {
      const url = editProject
        ? `/api/projeler/${editProject.id}`
        : "/api/projeler";
      const method = editProject ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editProject ? "Proje güncellendi" : "Proje oluşturuldu");
        setDialogOpen(false);
        setEditProject(null);
        fetchProjects();
      } else {
        toast.error("İşlem başarısız oldu");
      }
    } catch {
      toast.error("Bir hata oluştu");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu projeyi silmek istediğinizden emin misiniz?")) return;
    try {
      const res = await fetch(`/api/projeler/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Proje silindi");
        fetchProjects();
      } else {
        toast.error("Proje silinemedi");
      }
    } catch {
      toast.error("Bir hata oluştu");
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Projeler</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Tüm inşaat projelerinizi yönetin
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditProject(null);
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Proje
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editProject ? "Proje Düzenle" : "Yeni Proje"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Proje Adı</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editProject?.name ?? ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">Müşteri</Label>
                <Input
                  id="client"
                  name="client"
                  defaultValue={editProject?.client ?? ""}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Başlangıç Tarihi</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    defaultValue={
                      editProject?.startDate
                        ? editProject.startDate.split("T")[0]
                        : ""
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Bitiş Tarihi</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    defaultValue={
                      editProject?.endDate
                        ? editProject.endDate.split("T")[0]
                        : ""
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Durum</Label>
                <Select
                  name="status"
                  defaultValue={editProject?.status ?? "ACTIVE"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Aktif</SelectItem>
                    <SelectItem value="COMPLETED">Tamamlandı</SelectItem>
                    <SelectItem value="ON_HOLD">Beklemede</SelectItem>
                    <SelectItem value="CANCELLED">İptal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                {editProject ? "Güncelle" : "Oluştur"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Proje Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">
              Yükleniyor...
            </p>
          ) : projects.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Henüz proje bulunmuyor
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proje Adı</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead className="text-center">İlerleme</TableHead>
                  <TableHead className="text-center">Mahal</TableHead>
                  <TableHead className="text-center">Aktivite</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Başlangıç</TableHead>
                  <TableHead>Bitiş</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow
                    key={project.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard?project=${project.id}`)}
                  >
                    <TableCell className="font-medium">
                      {project.name}
                    </TableCell>
                    <TableCell>{project.client ?? "-"}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{
                              width: `${Math.min(project.totalProgress, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm">%{project.totalProgress}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {project._count.zones}
                    </TableCell>
                    <TableCell className="text-center">
                      {project._count.activities}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[project.status]}>
                        {statusLabels[project.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {project.startDate
                        ? new Date(project.startDate).toLocaleDateString("tr-TR")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {project.endDate
                        ? new Date(project.endDate).toLocaleDateString("tr-TR")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditProject(project);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(project.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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
    </div>
  );
}
