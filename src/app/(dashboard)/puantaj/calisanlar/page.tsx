"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  Phone,
  CreditCard,
  Building2,
  UserCheck,
  UserX,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";
import { CompanyTypeSegment, PuantajPagination } from "../components";

interface Team {
  id: string;
  name: string;
  company: { id: string; name: string; type: string };
  discipline: { name: string };
  project?: { id: string; name: string } | null;
}

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  identityNo?: string | null;
  phone?: string | null;
  position?: string | null;
  bloodType?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  sortOrder: number;
  team: Team;
  _count?: { attendances: number };
}

interface WorkerForm {
  firstName: string;
  lastName: string;
  role: string;
  teamId: string;
  identityNo: string;
  phone: string;
  position: string;
  bloodType: string;
  emergencyContact: string;
  emergencyPhone: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

const emptyForm: WorkerForm = {
  firstName: "", lastName: "", role: "", teamId: "",
  identityNo: "", phone: "",
  position: "", bloodType: "", emergencyContact: "", emergencyPhone: "",
  isActive: true, startDate: "", endDate: "",
};

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "0+", "0-"];

export default function CalisanlarPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCompanyType, setFilterCompanyType] = useState("all");
  const [filterCompany, setFilterCompany] = useState("all");
  const [filterTeam, setFilterTeam] = useState("all");
  const [filterActive, setFilterActive] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WorkerForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const companies = Array.from(
    new Map(teams.map((t) => [t.company.id, t.company.name])),
    ([id, name]) => ({ id, name })
  );

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/puantaj/calisanlar").then((r) => r.json()),
      fetch("/api/ekipler").then((r) => r.json()),
    ])
      .then(([workerData, teamData]) => {
        setWorkers(workerData);
        setTeams(teamData);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredCompanies = useMemo(() => {
    if (filterCompanyType === "all") return companies;
    return companies.filter((c) => {
      const team = teams.find((t) => t.company.id === c.id);
      if (!team) return false;
      if (filterCompanyType === "MAIN") return team.company.type === "MAIN";
      if (filterCompanyType === "SUBCONTRACTOR") return team.company.type === "SUBCONTRACTOR";
      return true;
    });
  }, [companies, teams, filterCompanyType]);

  const filtered = workers.filter((w) => {
    if (search) {
      const q = search.toLowerCase();
      const match = `${w.firstName} ${w.lastName} ${w.role} ${w.identityNo ?? ""} ${w.phone ?? ""}`.toLowerCase();
      if (!match.includes(q)) return false;
    }
    if (filterCompanyType !== "all" && w.team.company.type !== filterCompanyType) return false;
    if (filterCompany !== "all" && w.team.company.id !== filterCompany) return false;
    if (filterTeam !== "all" && w.team.id !== filterTeam) return false;
    if (filterActive === "active" && !w.isActive) return false;
    if (filterActive === "inactive" && w.isActive) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedFiltered = useMemo(() => {
    const s = (currentPage - 1) * pageSize;
    return filtered.slice(s, s + pageSize);
  }, [filtered, currentPage, pageSize]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (w: Worker) => {
    setEditingId(w.id);
    setForm({
      firstName: w.firstName,
      lastName: w.lastName,
      role: w.role,
      teamId: w.team.id,
      identityNo: w.identityNo || "",
      phone: w.phone || "",
      position: w.position || "",
      bloodType: w.bloodType || "",
      emergencyContact: w.emergencyContact || "",
      emergencyPhone: w.emergencyPhone || "",
      isActive: w.isActive,
      startDate: w.startDate ? w.startDate.slice(0, 10) : "",
      endDate: w.endDate ? w.endDate.slice(0, 10) : "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.firstName || !form.lastName || !form.role || !form.teamId) {
      alert("Ad, soyad, görev ve ekip zorunludur.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        firstName: form.firstName,
        lastName: form.lastName,
        role: form.role,
        teamId: form.teamId,
        identityNo: form.identityNo || null,
        phone: form.phone || null,
        position: form.position || null,
        bloodType: form.bloodType || null,
        emergencyContact: form.emergencyContact || null,
        emergencyPhone: form.emergencyPhone || null,
        isActive: form.isActive,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };

      const url = editingId
        ? `/api/puantaj/calisanlar?id=${editingId}`
        : "/api/puantaj/calisanlar";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Kayıt başarısız");
      setDialogOpen(false);
      fetchData();
    } catch (e) {
      alert(`Hata: ${e instanceof Error ? e.message : "Bilinmeyen"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" silinecek. Emin misiniz?`)) return;
    try {
      await fetch(`/api/puantaj/calisanlar?id=${id}`, { method: "DELETE" });
      fetchData();
    } catch {
      alert("Silme hatası");
    }
  };

  const exportExcel = () => {
    const rows = filtered.map((w, i) => ({
      "#": i + 1,
      Ad: w.firstName,
      Soyad: w.lastName,
      Görevi: w.role,
      Pozisyon: w.position || "",
      Firma: w.team.company.name,
      Ekip: w.team.name,
      "TC Kimlik": w.identityNo || "",
      Telefon: w.phone || "",
      "Kan Grubu": w.bloodType || "",
      Durum: w.isActive ? "Aktif" : "Pasif",
      "İşe Başlama": w.startDate ? w.startDate.slice(0, 10) : "",
      "Ayrılış": w.endDate ? w.endDate.slice(0, 10) : "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Çalışanlar");
    XLSX.writeFile(wb, "puantaj-calisanlar.xlsx");
  };

  const activeCount = workers.filter((w) => w.isActive).length;
  const inactiveCount = workers.length - activeCount;

  return (
    <div className="space-y-4">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Çalışan Yönetimi</h1>
          <p className="text-muted-foreground text-sm">
            Puantaj sistemindeki çalışanları yönetin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary"><UserCheck className="h-3 w-3 mr-1" /> {activeCount} aktif</Badge>
          <Badge variant="outline"><UserX className="h-3 w-3 mr-1" /> {inactiveCount} pasif</Badge>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> Çalışan Ekle
          </Button>
        </div>
      </div>

      {/* Ana Yüklenici / Taşeron Segment */}
      <CompanyTypeSegment value={filterCompanyType} onChange={(v) => { setFilterCompanyType(v); setFilterCompany("all"); setFilterTeam("all"); setCurrentPage(1); }} />

      {/* Filtreler */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[350px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ad, soyad, TC, telefon ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filterCompany} onValueChange={(v) => { setFilterCompany(v); setFilterTeam("all"); setCurrentPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Firma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Firmalar</SelectItem>
            {filteredCompanies.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterTeam} onValueChange={setFilterTeam}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Ekip" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Ekipler</SelectItem>
            {teams
              .filter((t) => filterCompany === "all" || t.company.id === filterCompany)
              .map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
          </SelectContent>
        </Select>

        <Select value={filterActive} onValueChange={setFilterActive}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="inactive">Pasif</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={exportExcel}>
          <Download className="h-4 w-4 mr-1" /> Excel
        </Button>
      </div>

      {/* Tablo */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">Çalışan bulunamadı</p>
            <p className="text-sm">Filtreleri değiştirin veya yeni çalışan ekleyin.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>Görevi</TableHead>
                  <TableHead>Firma</TableHead>
                  <TableHead>Ekip</TableHead>
                  <TableHead>TC Kimlik</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead className="text-center">Durum</TableHead>
                  <TableHead className="w-24">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedFiltered.map((w, idx) => (
                  <TableRow key={w.id} className={!w.isActive ? "opacity-50" : ""}>
                    <TableCell className="text-muted-foreground text-xs">{(currentPage - 1) * pageSize + idx + 1}</TableCell>
                    <TableCell className="font-medium">
                      {w.firstName} {w.lastName}
                      {w.position && <span className="text-xs text-muted-foreground ml-1">({w.position})</span>}
                    </TableCell>
                    <TableCell className="text-sm">{w.role}</TableCell>
                    <TableCell className="text-sm">{w.team.company.name}</TableCell>
                    <TableCell className="text-sm">{w.team.name}</TableCell>
                    <TableCell className="text-xs font-mono">{w.identityNo || "-"}</TableCell>
                    <TableCell className="text-xs">{w.phone || "-"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={w.isActive ? "default" : "secondary"} className="text-[10px]">
                        {w.isActive ? "Aktif" : "Pasif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(w)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => handleDelete(w.id, `${w.firstName} ${w.lastName}`)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Sayfalama */}
      {!loading && filtered.length > 0 && (
        <PuantajPagination
          totalItems={filtered.length}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* Çalışan Ekle / Düzenle Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Çalışan Düzenle" : "Yeni Çalışan Ekle"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            {/* Temel Bilgiler */}
            <div className="col-span-2">
              <p className="text-sm font-semibold text-muted-foreground mb-2">Temel Bilgiler</p>
            </div>
            <div className="space-y-1.5">
              <Label>Ad *</Label>
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Soyad *</Label>
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Görevi *</Label>
              <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Kalıpçı, Formen, vb." />
            </div>
            <div className="space-y-1.5">
              <Label>Pozisyon</Label>
              <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="Usta, Kalfa, İşçi, vb." />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Ekip *</Label>
              <Select value={form.teamId} onValueChange={(v) => setForm({ ...form, teamId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Ekip seçin" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.company.name} — {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Kişisel Bilgiler */}
            <div className="col-span-2 pt-2">
              <p className="text-sm font-semibold text-muted-foreground mb-2">Kişisel Bilgiler</p>
            </div>
            <div className="space-y-1.5">
              <Label><CreditCard className="inline h-3.5 w-3.5 mr-1" /> TC Kimlik No</Label>
              <Input value={form.identityNo} onChange={(e) => setForm({ ...form, identityNo: e.target.value })} maxLength={11} />
            </div>
            <div className="space-y-1.5">
              <Label><Phone className="inline h-3.5 w-3.5 mr-1" /> Telefon</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="05xx xxx xx xx" />
            </div>
            <div className="space-y-1.5">
              <Label>Kan Grubu</Label>
              <Select value={form.bloodType || "none"} onValueChange={(v) => setForm({ ...form, bloodType: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Belirtilmemiş</SelectItem>
                  {BLOOD_TYPES.map((bt) => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Durum</Label>
              <Select value={form.isActive ? "active" : "inactive"} onValueChange={(v) => setForm({ ...form, isActive: v === "active" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tarihler */}
            <div className="space-y-1.5">
              <Label>İşe Başlama Tarihi</Label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Ayrılış Tarihi</Label>
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>

            {/* Acil Durum */}
            <div className="col-span-2 pt-2">
              <p className="text-sm font-semibold text-muted-foreground mb-2">Acil Durum İletişim</p>
            </div>
            <div className="space-y-1.5">
              <Label>Yakını Adı</Label>
              <Input value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Yakını Telefon</Label>
              <Input value={form.emergencyPhone} onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Kaydediliyor..." : editingId ? "Güncelle" : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
