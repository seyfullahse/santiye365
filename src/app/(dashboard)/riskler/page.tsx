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
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
}

interface Activity {
  id: string;
  name: string;
  projectId: string;
}

interface Risk {
  id: string;
  projectId: string;
  activityId: string | null;
  title: string;
  impact: number;
  probability: number;
  score: number;
  action: string;
  responsible: string;
  status: string;
  createdAt: string;
  project: { name: string };
  activity: { name: string } | null;
}

interface RiskForm {
  projectId: string;
  activityId: string;
  title: string;
  impact: string;
  probability: string;
  action: string;
  responsible: string;
  status: string;
}

const initialForm: RiskForm = {
  projectId: "",
  activityId: "",
  title: "",
  impact: "",
  probability: "",
  action: "",
  responsible: "",
  status: "OPEN",
};

export default function RisklerPage() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [deletingRisk, setDeletingRisk] = useState<Risk | null>(null);
  const [form, setForm] = useState<RiskForm>(initialForm);
  const [filterProjectId, setFilterProjectId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const fetchRisks = async () => {
    try {
      const url = filterProjectId
        ? `/api/riskler?projectId=${filterProjectId}`
        : "/api/riskler";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Riskler yüklenemedi");
      const data = await res.json();
      setRisks(data);
    } catch {
      toast.error("Riskler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projeler");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProjects(data);
    } catch {
      toast.error("Projeler yüklenirken hata oluştu");
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await fetch("/api/aktiviteler");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setActivities(data);
    } catch {
      toast.error("Aktiviteler yüklenirken hata oluştu");
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchActivities();
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchRisks();
  }, [filterProjectId]);

  const filteredActivities = form.projectId
    ? activities.filter((a) => a.projectId === form.projectId)
    : [];

  const calculatedScore =
    form.impact && form.probability
      ? parseInt(form.impact) * parseInt(form.probability)
      : 0;

  const getScoreBadge = (score: number) => {
    if (score >= 15) {
      return <Badge variant="destructive">{score}</Badge>;
    }
    if (score >= 8) {
      return <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">{score}</Badge>;
    }
    return <Badge variant="secondary">{score}</Badge>;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "OPEN":
        return "Açık";
      case "MITIGATED":
        return "Azaltıldı";
      case "CLOSED":
        return "Kapatıldı";
      default:
        return status;
    }
  };

  const openCreateDialog = () => {
    setEditingRisk(null);
    setForm(initialForm);
    setDialogOpen(true);
  };

  const openEditDialog = (risk: Risk) => {
    setEditingRisk(risk);
    setForm({
      projectId: risk.projectId,
      activityId: risk.activityId || "",
      title: risk.title,
      impact: risk.impact.toString(),
      probability: risk.probability.toString(),
      action: risk.action,
      responsible: risk.responsible,
      status: risk.status,
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (risk: Risk) => {
    setDeletingRisk(risk);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.projectId || !form.title || !form.impact || !form.probability) {
      toast.error("Lütfen zorunlu alanları doldurun");
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        projectId: form.projectId,
        activityId: form.activityId || null,
        title: form.title,
        impact: parseInt(form.impact),
        probability: parseInt(form.probability),
        action: form.action,
        responsible: form.responsible,
        ...(editingRisk ? { status: form.status } : {}),
      };

      const url = editingRisk
        ? `/api/riskler/${editingRisk.id}`
        : "/api/riskler";
      const method = editingRisk ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();

      toast.success(
        editingRisk
          ? "Risk başarıyla güncellendi"
          : "Risk başarıyla oluşturuldu"
      );
      setDialogOpen(false);
      setEditingRisk(null);
      setForm(initialForm);
      fetchRisks();
    } catch {
      toast.error("İşlem sırasında hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRisk) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/riskler/${deletingRisk.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();

      toast.success("Risk başarıyla silindi");
      setDeleteDialogOpen(false);
      setDeletingRisk(null);
      fetchRisks();
    } catch {
      toast.error("Silme işlemi sırasında hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
          <h1 className="text-xl sm:text-2xl font-bold">Riskler</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Risk
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRisk ? "Risk Düzenle" : "Yeni Risk Oluştur"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="projectId">Proje *</Label>
                <Select
                  value={form.projectId}
                  onValueChange={(value) =>
                    setForm({ ...form, projectId: value, activityId: "" })
                  }
                >
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label htmlFor="activityId">Aktivite</Label>
                <Select
                  value={form.activityId}
                  onValueChange={(value) =>
                    setForm({ ...form, activityId: value })
                  }
                  disabled={!form.projectId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Aktivite seçin (opsiyonel)" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredActivities.map((activity) => (
                      <SelectItem key={activity.id} value={activity.id}>
                        {activity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Risk Başlığı *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Risk başlığını girin"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="impact">Etki (1-5) *</Label>
                  <Select
                    value={form.impact}
                    onValueChange={(value) =>
                      setForm({ ...form, impact: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Etki" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((v) => (
                        <SelectItem key={v} value={v.toString()}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="probability">Olasılık (1-5) *</Label>
                  <Select
                    value={form.probability}
                    onValueChange={(value) =>
                      setForm({ ...form, probability: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Olasılık" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((v) => (
                        <SelectItem key={v} value={v.toString()}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {calculatedScore > 0 && (
                <div className="flex items-center gap-2">
                  <Label>Hesaplanan Skor:</Label>
                  {getScoreBadge(calculatedScore)}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="action">Aksiyon</Label>
                <Textarea
                  id="action"
                  value={form.action}
                  onChange={(e) => setForm({ ...form, action: e.target.value })}
                  placeholder="Alınacak aksiyonu açıklayın"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsible">Sorumlu</Label>
                <Input
                  id="responsible"
                  value={form.responsible}
                  onChange={(e) =>
                    setForm({ ...form, responsible: e.target.value })
                  }
                  placeholder="Sorumlu kişiyi girin"
                />
              </div>

              {editingRisk && (
                <div className="space-y-2">
                  <Label htmlFor="status">Durum</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value) =>
                      setForm({ ...form, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">Açık</SelectItem>
                      <SelectItem value="MITIGATED">Azaltıldı</SelectItem>
                      <SelectItem value="CLOSED">Kapatıldı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
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
                    : editingRisk
                    ? "Güncelle"
                    : "Oluştur"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Riski Sil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>
              <strong>&quot;{deletingRisk?.title}&quot;</strong> riskini silmek
              istediğinize emin misiniz? Bu işlem geri alınamaz.
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

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtrele</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-64">
              <Select
                value={filterProjectId}
                onValueChange={setFilterProjectId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tüm projeler" />
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
            {filterProjectId && filterProjectId !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilterProjectId("")}
              >
                Filtreyi Temizle
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Risk Başlığı</TableHead>
                <TableHead>Proje</TableHead>
                <TableHead>Aktivite</TableHead>
                <TableHead className="text-center">Etki</TableHead>
                <TableHead className="text-center">Olasılık</TableHead>
                <TableHead className="text-center">Skor</TableHead>
                <TableHead>Aksiyon</TableHead>
                <TableHead>Sorumlu</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : risks.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Henüz risk kaydı bulunmuyor.
                  </TableCell>
                </TableRow>
              ) : (
                risks.map((risk) => (
                  <TableRow key={risk.id}>
                    <TableCell className="font-medium">{risk.title}</TableCell>
                    <TableCell>{risk.project?.name}</TableCell>
                    <TableCell>{risk.activity?.name || "—"}</TableCell>
                    <TableCell className="text-center">{risk.impact}</TableCell>
                    <TableCell className="text-center">
                      {risk.probability}
                    </TableCell>
                    <TableCell className="text-center">
                      {getScoreBadge(risk.score)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {risk.action || "—"}
                    </TableCell>
                    <TableCell>{risk.responsible || "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          risk.status === "CLOSED"
                            ? "secondary"
                            : risk.status === "MITIGATED"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {getStatusLabel(risk.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(risk)}
                          title="Düzenle"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(risk)}
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
