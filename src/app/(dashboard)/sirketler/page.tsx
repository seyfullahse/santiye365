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
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";

type CompanyType = "MAIN" | "SUBCONTRACTOR" | "MANAGEMENT";

interface Company {
  id: string;
  name: string;
  type: CompanyType;
  sortOrder: number;
  _count: {
    teams: number;
  };
}

const typeLabels: Record<CompanyType, string> = {
  SUBCONTRACTOR: "Taşeron",
  MAIN: "Ana Yüklenici",
  MANAGEMENT: "Yönetim",
};

const typeBadgeVariants: Record<CompanyType, "default" | "secondary" | "outline"> = {
  MAIN: "default",
  SUBCONTRACTOR: "secondary",
  MANAGEMENT: "outline",
};

export default function SirketlerPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<CompanyType>("SUBCONTRACTOR");
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/sirketler");
      if (!res.ok) throw new Error("Şirketler yüklenemedi");
      const data = await res.json();
      setCompanies(data);
    } catch {
      toast.error("Şirketler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const resetForm = () => {
    setFormName("");
    setFormType("SUBCONTRACTOR");
    setFormSortOrder(0);
    setSelectedCompany(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (company: Company) => {
    setSelectedCompany(company);
    setFormName(company.name);
    setFormType(company.type);
    setFormSortOrder(company.sortOrder);
    setDialogOpen(true);
  };

  const openDeleteDialog = (company: Company) => {
    setSelectedCompany(company);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) {
      toast.error("Şirket adı boş bırakılamaz.");
      return;
    }

    setSubmitting(true);
    try {
      const isEdit = !!selectedCompany;
      const url = isEdit
        ? `/api/sirketler/${selectedCompany.id}`
        : "/api/sirketler";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName.trim(), type: formType, sortOrder: formSortOrder }),
      });

      if (!res.ok) throw new Error();

      toast.success(
        isEdit
          ? "Şirket başarıyla güncellendi."
          : "Şirket başarıyla oluşturuldu."
      );
      setDialogOpen(false);
      resetForm();
      fetchCompanies();
    } catch {
      toast.error("İşlem sırasında bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCompany) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/sirketler/${selectedCompany.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      toast.success("Şirket başarıyla silindi.");
      setDeleteDialogOpen(false);
      setSelectedCompany(null);
      fetchCompanies();
    } catch {
      toast.error("Şirket silinirken bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
          <h1 className="text-xl sm:text-2xl font-bold">Şirketler</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Şirket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedCompany ? "Şirketi Düzenle" : "Yeni Şirket Oluştur"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Şirket Adı</Label>
                <Input
                  id="name"
                  placeholder="Şirket adını girin"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tip</Label>
                <Select value={formType} onValueChange={(v) => setFormType(v as CompanyType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tip seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUBCONTRACTOR">Taşeron</SelectItem>
                    <SelectItem value="MAIN">Ana Yüklenici</SelectItem>
                    <SelectItem value="MANAGEMENT">Yönetim</SelectItem>
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
                    : selectedCompany
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
          <CardTitle>Şirket Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Yükleniyor...
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz şirket eklenmemiş.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px] text-center">Sıra</TableHead>
                  <TableHead>Şirket Adı</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Ekip Sayısı</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="text-center font-mono text-sm text-muted-foreground">{company.sortOrder}</TableCell>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>
                      <Badge variant={typeBadgeVariants[company.type]}>
                        {typeLabels[company.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>{company._count.teams}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditDialog(company)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openDeleteDialog(company)}
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
            <DialogTitle>Şirketi Sil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p>
              <strong>{selectedCompany?.name}</strong> şirketini silmek
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
    </div>
  );
}
