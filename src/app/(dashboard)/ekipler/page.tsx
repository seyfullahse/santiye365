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
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
}

interface Discipline {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
  companyId: string;
  disciplineId: string;
  sortOrder: number;
  company: { name: string };
  discipline: { name: string };
}

export default function EkiplerPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [formName, setFormName] = useState("");
  const [formCompanyId, setFormCompanyId] = useState("");
  const [formDisciplineId, setFormDisciplineId] = useState("");
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/ekipler?companyType=SUBCONTRACTOR");
      if (!res.ok) throw new Error("Ekipler yüklenemedi");
      const data = await res.json();
      setTeams(data);
    } catch {
      toast.error("Ekipler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/sirketler");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCompanies(data);
    } catch {
      toast.error("Şirketler yüklenirken bir hata oluştu.");
    }
  };

  const fetchDisciplines = async () => {
    try {
      const res = await fetch("/api/disiplinler");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDisciplines(data);
    } catch {
      toast.error("Disiplinler yüklenirken bir hata oluştu.");
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchCompanies();
    fetchDisciplines();
  }, []);

  const resetForm = () => {
    setFormName("");
    setFormCompanyId("");
    setFormDisciplineId("");
    setFormSortOrder(0);
    setSelectedTeam(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (team: Team) => {
    setSelectedTeam(team);
    setFormName(team.name);
    setFormCompanyId(team.companyId);
    setFormDisciplineId(team.disciplineId);
    setFormSortOrder(team.sortOrder);
    setDialogOpen(true);
  };

  const openDeleteDialog = (team: Team) => {
    setSelectedTeam(team);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) {
      toast.error("Ekip adı boş bırakılamaz.");
      return;
    }
    if (!formCompanyId) {
      toast.error("Şirket seçimi zorunludur.");
      return;
    }
    if (!formDisciplineId) {
      toast.error("Disiplin seçimi zorunludur.");
      return;
    }

    setSubmitting(true);
    try {
      const isEdit = !!selectedTeam;
      const url = isEdit
        ? `/api/ekipler/${selectedTeam.id}`
        : "/api/ekipler";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          companyId: formCompanyId,
          disciplineId: formDisciplineId,
          sortOrder: formSortOrder,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success(
        isEdit
          ? "Ekip başarıyla güncellendi."
          : "Ekip başarıyla oluşturuldu."
      );
      setDialogOpen(false);
      resetForm();
      fetchTeams();
    } catch {
      toast.error("İşlem sırasında bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTeam) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/ekipler/${selectedTeam.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      toast.success("Ekip başarıyla silindi.");
      setDeleteDialogOpen(false);
      setSelectedTeam(null);
      fetchTeams();
    } catch {
      toast.error("Ekip silinirken bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 sm:h-6 sm:w-6" />
          <h1 className="text-xl sm:text-2xl font-bold">Ekipler</h1>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Ekip
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedTeam ? "Ekibi Düzenle" : "Yeni Ekip Oluştur"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ekip Adı</Label>
                <Input
                  id="name"
                  placeholder="Ekip adını girin"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyId">Şirket</Label>
                <Select
                  value={formCompanyId}
                  onValueChange={setFormCompanyId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Şirket seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="disciplineId">Disiplin</Label>
                <Select
                  value={formDisciplineId}
                  onValueChange={setFormDisciplineId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Disiplin seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {disciplines.map((discipline) => (
                      <SelectItem key={discipline.id} value={discipline.id}>
                        {discipline.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sıra No</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  placeholder="0"
                  value={formSortOrder}
                  onChange={(e) => setFormSortOrder(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">Küçük numara önce gösterilir (1 = ilk sıra)</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                  disabled={submitting}
                >
                  İptal
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting
                    ? "Kaydediliyor..."
                    : selectedTeam
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
          <CardTitle>Ekip Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Yükleniyor...
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz ekip eklenmemiş.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px] text-center">Sıra</TableHead>
                  <TableHead>Ekip Adı</TableHead>
                  <TableHead>Şirket</TableHead>
                  <TableHead>Disiplin</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="text-center font-mono text-sm text-muted-foreground">{team.sortOrder}</TableCell>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{team.company.name}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{team.discipline.name}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditDialog(team)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openDeleteDialog(team)}
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ekibi Sil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p>
              <strong>{selectedTeam?.name}</strong> ekibini silmek istediğinize
              emin misiniz? Bu işlem geri alınamaz.
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
