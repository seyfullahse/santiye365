"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  FolderKanban,
  MapPin,
  Activity,
  CalendarDays,
  Building2,
  ArrowRight,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";

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

const statusDotColors: Record<string, string> = {
  ACTIVE: "bg-green-500",
  COMPLETED: "bg-blue-500",
  ON_HOLD: "bg-yellow-500",
  CANCELLED: "bg-red-500",
};

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

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

  // Filtreleme
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.client?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = projects.filter((p) => p.status === "ACTIVE").length;
  const completedCount = projects.filter((p) => p.status === "COMPLETED").length;
  const onHoldCount = projects.filter((p) => p.status === "ON_HOLD").length;

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <FolderKanban className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
            Proje Yönetimi
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Yönetmek istediğiniz projeyi seçin veya yeni bir proje oluşturun
          </p>
        </div>
        <Dialog
          open={dialogOpen && !editProject}
          onOpenChange={(open) => {
            if (!editProject) {
              setDialogOpen(open);
            }
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
              <DialogTitle>Yeni Proje</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Proje Adı</Label>
                <Input id="name" name="name" required placeholder="Örn: Merkez Residence" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">Müşteri</Label>
                <Input id="client" name="client" placeholder="Örn: ABC İnşaat A.Ş." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Başlangıç Tarihi</Label>
                  <Input id="startDate" name="startDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Bitiş Tarihi</Label>
                  <Input id="endDate" name="endDate" type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Durum</Label>
                <Select name="status" defaultValue="ACTIVE">
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
                <Plus className="mr-2 h-4 w-4" />
                Proje Oluştur
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-muted-foreground">Toplam Proje</p>
            <p className="text-xl sm:text-2xl font-bold">{projects.length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-muted-foreground">Aktif</p>
            <p className="text-xl sm:text-2xl font-bold text-green-600">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-muted-foreground">Tamamlanan</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{completedCount}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-muted-foreground">Beklemede</p>
            <p className="text-xl sm:text-2xl font-bold text-yellow-600">{onHoldCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Arama ve Filtre */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Proje veya müşteri ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Durum Filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tüm Durumlar</SelectItem>
              <SelectItem value="ACTIVE">Aktif</SelectItem>
              <SelectItem value="COMPLETED">Tamamlandı</SelectItem>
              <SelectItem value="ON_HOLD">Beklemede</SelectItem>
              <SelectItem value="CANCELLED">İptal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Proje Kartları Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-2/3 mb-3" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-2 w-full mb-4" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Proje Kartları */}
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="group cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-200 flex flex-col"
              onClick={() => router.push(`/dashboard?project=${project.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                      {project.name}
                    </CardTitle>
                    {project.client && (
                      <CardDescription className="flex items-center gap-1.5 mt-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {project.client}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 ml-2 shrink-0">
                    <div className={`h-2 w-2 rounded-full ${statusDotColors[project.status]}`} />
                    <Badge variant={statusColors[project.status]} className="text-xs">
                      {statusLabels[project.status]}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 pb-3 space-y-4">
                {/* İlerleme Çubuğu */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Genel İlerleme</span>
                    <span className="text-sm font-bold">%{project.totalProgress}</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.min(project.totalProgress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* İstatistikler */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <span><strong className="text-foreground">{project._count.zones}</strong> Mahal</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Activity className="h-4 w-4 text-orange-500" />
                    <span><strong className="text-foreground">{project._count.activities}</strong> Aktivite</span>
                  </div>
                </div>

                {/* Tarihler */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>
                    {project.startDate
                      ? new Date(project.startDate).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })
                      : "Başlangıç yok"}
                    {" — "}
                    {project.endDate
                      ? new Date(project.endDate).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })
                      : "Bitiş yok"}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="pt-3 border-t flex items-center justify-between">
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditProject(project);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(project.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
                <div className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Projeye Git
                  <ArrowRight className="h-4 w-4" />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Sonuç bulunamadı */}
      {!loading && filteredProjects.length === 0 && projects.length > 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-lg font-medium text-muted-foreground">Sonuç bulunamadı</p>
          <p className="text-sm text-muted-foreground mt-1">
            Arama kriterlerinize uygun proje bulunamadı
          </p>
        </div>
      )}

      {/* Proje yoksa */}
      {!loading && projects.length === 0 && (
        <div className="text-center py-16">
          <FolderKanban className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-xl font-semibold text-muted-foreground">Henüz proje bulunmuyor</p>
          <p className="text-sm text-muted-foreground mt-2 mb-6">
            İlk projenizi oluşturarak başlayın
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            İlk Projenizi Oluşturun
          </Button>
        </div>
      )}

      {/* Düzenleme Dialog */}
      <Dialog
        open={dialogOpen && !!editProject}
        onOpenChange={(open) => {
          if (editProject) {
            setDialogOpen(open);
            if (!open) setEditProject(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proje Düzenle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Proje Adı</Label>
              <Input
                id="edit-name"
                name="name"
                defaultValue={editProject?.name ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-client">Müşteri</Label>
              <Input
                id="edit-client"
                name="client"
                defaultValue={editProject?.client ?? ""}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">Başlangıç Tarihi</Label>
                <Input
                  id="edit-startDate"
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
                <Label htmlFor="edit-endDate">Bitiş Tarihi</Label>
                <Input
                  id="edit-endDate"
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
              <Label htmlFor="edit-status">Durum</Label>
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
              Güncelle
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
