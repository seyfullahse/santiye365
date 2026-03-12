// @ts-nocheck
"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  Search,
  Phone,
  CreditCard,
  UserCheck,
  UserMinus,
  Download,
  UserPlus,
  Building2,
  Loader2,
} from "lucide-react";
import * as XLSX from "xlsx";
import { PuantajPagination } from "../components";

/* ─── Tipler ─── */
interface Team {
  id: string;
  name: string;
  company: { id: string; name: string; type: string };
  discipline?: { name: string };
}

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  collarType?: string;
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
  assignmentId?: string;
  assignedAt?: string;
}

interface PoolWorker {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  position?: string | null;
  team: Team;
}

interface WorkerForm {
  firstName: string;
  lastName: string;
  role: string;
  collarType: string;
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
  firstName: "", lastName: "", role: "", collarType: "BLUE", teamId: "",
  identityNo: "", phone: "",
  position: "", bloodType: "", emergencyContact: "", emergencyPhone: "",
  isActive: true, startDate: "", endDate: "",
};

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "0+", "0-"];

/* ─── Wrapper ─── */
export default function CalisanlarPageWrapper() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Yükleniyor...</div>}>
      <CalisanlarPage />
    </Suspense>
  );
}

/* ─── Ana Bileşen ─── */
function CalisanlarPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get("project");

  // Ana state
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("");

  // Filtreler
  const [search, setSearch] = useState("");
  const [filterCompany, setFilterCompany] = useState("all");
  const [filterTeam, setFilterTeam] = useState("all");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Çalışan düzenleme dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WorkerForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Personel atama dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [poolWorkers, setPoolWorkers] = useState<PoolWorker[]>([]);
  const [poolSearch, setPoolSearch] = useState("");
  const [poolLoading, setPoolLoading] = useState(false);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<Set<string>>(new Set());
  const [assigning, setAssigning] = useState(false);

  // Proje yönlendirme
  useEffect(() => {
    if (!projectId) { router.push("/puantaj"); return; }
    fetch("/api/projeler").then((r) => r.json()).then((data) => {
      const proj = data.find((p: { id: string; name: string }) => p.id === projectId);
      setProjectName(proj?.name || "");
    });
  }, [projectId, router]);

  // Firma listesi (atanmış çalışanlardan)
  const companies = useMemo(() => {
    const map = new Map<string, string>();
    workers.forEach((w) => map.set(w.team.company.id, w.team.company.name));
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [workers]);

  // Ekip listesi (atanmış çalışanlardan)
  const workerTeams = useMemo(() => {
    const map = new Map<string, { id: string; name: string; companyId: string }>();
    workers.forEach((w) => map.set(w.team.id, { id: w.team.id, name: w.team.name, companyId: w.team.company.id }));
    return Array.from(map.values());
  }, [workers]);

  /* ─── Veri Çekme ─── */
  const fetchAssigned = useCallback(() => {
    if (!projectId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/projeler/${projectId}/puantaj/atamalar`).then((r) => r.json()),
      fetch("/api/ekipler").then((r) => r.json()),
    ])
      .then(([assignedData, teamData]) => {
        setWorkers(Array.isArray(assignedData) ? assignedData : []);
        setTeams(Array.isArray(teamData) ? teamData : []);
        setCurrentPage(1);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    fetchAssigned();
  }, [fetchAssigned]);

  /* ─── Filtreleme ─── */
  const filtered = useMemo(() => {
    return workers.filter((w) => {
      if (search) {
        const q = search.toLowerCase();
        const match = `${w.firstName} ${w.lastName} ${w.role} ${w.identityNo ?? ""} ${w.phone ?? ""}`.toLowerCase();
        if (!match.includes(q)) return false;
      }
      if (filterCompany !== "all" && w.team.company.id !== filterCompany) return false;
      if (filterTeam !== "all" && w.team.id !== filterTeam) return false;
      return true;
    });
  }, [workers, search, filterCompany, filterTeam]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedFiltered = useMemo(() => {
    const s = (currentPage - 1) * pageSize;
    return filtered.slice(s, s + pageSize);
  }, [filtered, currentPage, pageSize]);

  /* ─── Çalışan Düzenleme ─── */
  const openEdit = (w: Worker) => {
    setEditingId(w.id);
    setForm({
      firstName: w.firstName,
      lastName: w.lastName,
      role: w.role,
      collarType: w.collarType || "BLUE",
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
    setEditDialogOpen(true);
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
        collarType: form.collarType,
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

      // Yeni çalışan oluştuysa otomatik olarak projeye ata
      if (!editingId && projectId) {
        const newWorker = await res.json();
        await fetch(`/api/projeler/${projectId}/puantaj/atamalar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workerIds: [newWorker.id] }),
        });
      }

      setEditDialogOpen(false);
      fetchAssigned();
    } catch (e) {
      alert(`Hata: ${e instanceof Error ? e.message : "Bilinmeyen"}`);
    } finally {
      setSaving(false);
    }
  };

  /* ─── Projeden Çıkarma ─── */
  const handleRemoveFromProject = async (workerId: string, name: string) => {
    if (!confirm(`"${name}" bu projeden çıkarılacak.\nGeçmiş puantaj verileri korunacaktır.\n\nDevam edilsin mi?`)) return;
    try {
      const res = await fetch(`/api/projeler/${projectId}/puantaj/atamalar?workerId=${workerId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Çıkarma başarısız");
      fetchAssigned();
    } catch {
      alert("Projeden çıkarma hatası");
    }
  };

  /* ─── Personel Atama (Havuz) ─── */
  const openAssignDialog = async () => {
    setAssignDialogOpen(true);
    setSelectedWorkerIds(new Set());
    setPoolSearch("");
    fetchPool("");
  };

  const fetchPool = async (q: string) => {
    if (!projectId) return;
    setPoolLoading(true);
    try {
      const params = new URLSearchParams({ companyType: "MAIN" });
      if (q) params.set("search", q);
      const res = await fetch(`/api/projeler/${projectId}/puantaj/havuz?${params}`);
      const data = await res.json();
      setPoolWorkers(data);
    } catch {
      setPoolWorkers([]);
    } finally {
      setPoolLoading(false);
    }
  };

  const togglePoolSelection = (id: string) => {
    setSelectedWorkerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAssign = async () => {
    if (selectedWorkerIds.size === 0) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/projeler/${projectId}/puantaj/atamalar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerIds: Array.from(selectedWorkerIds) }),
      });
      if (!res.ok) throw new Error("Atama başarısız");
      setAssignDialogOpen(false);
      fetchAssigned();
    } catch (e) {
      alert(`Hata: ${e instanceof Error ? e.message : "Bilinmeyen"}`);
    } finally {
      setAssigning(false);
    }
  };

  /* ─── Excel ─── */
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
      "Atanma Tarihi": w.assignedAt ? new Date(w.assignedAt).toLocaleDateString("tr-TR") : "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Proje Çalışanları");
    XLSX.writeFile(wb, `proje-calisanlari-${projectName || "export"}.xlsx`);
  };

  const mainCount = workers.filter((w) => w.team.company.type === "MAIN").length;
  const subCount = workers.filter((w) => w.team.company.type === "SUBCONTRACTOR").length;

  /* ─── Render ─── */
  return (
    <div className="space-y-4">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Proje Personeli</h1>
          <p className="text-muted-foreground text-sm">
            {projectName} · Projeye atanmış çalışanları yönetin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            <Building2 className="h-3 w-3 mr-1" /> {mainCount} firma
          </Badge>
          <Badge variant="outline">
            <Users className="h-3 w-3 mr-1" /> {subCount} taşeron
          </Badge>
          <Button size="sm" variant="outline" onClick={openAssignDialog}>
            <UserPlus className="h-4 w-4 mr-1" /> Personel Ata
          </Button>
          <Button size="sm" onClick={() => { setEditingId(null); setForm(emptyForm); setEditDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Yeni Çalışan
          </Button>
        </div>
      </div>

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
            {companies.map((c) => (
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
            {workerTeams
              .filter((t) => filterCompany === "all" || t.companyId === filterCompany)
              .map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
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
            <p className="text-lg font-medium">Projeye atanmış çalışan yok</p>
            <p className="text-sm mb-4">Personel Ata butonunu kullanarak çalışan ekleyin.</p>
            <Button onClick={openAssignDialog}>
              <UserPlus className="h-4 w-4 mr-1" /> Personel Ata
            </Button>
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
                  <TableHead>Firma / Ekip</TableHead>
                  <TableHead>TC Kimlik</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead className="text-center">Durum</TableHead>
                  <TableHead className="w-28 text-right">İşlem</TableHead>
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
                    <TableCell className="text-sm">
                      <span className="text-muted-foreground">{w.team.company.name}</span>
                      <span className="mx-1">›</span>
                      <span>{w.team.name}</span>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{w.identityNo || "-"}</TableCell>
                    <TableCell className="text-xs">{w.phone || "-"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={w.isActive ? "default" : "secondary"} className="text-[10px]">
                        {w.isActive ? "Aktif" : "Pasif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Düzenle" onClick={() => openEdit(w)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-orange-600 hover:text-orange-700"
                          title="Projeden Çıkar"
                          onClick={() => handleRemoveFromProject(w.id, `${w.firstName} ${w.lastName}`)}
                        >
                          <UserMinus className="h-3.5 w-3.5" />
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

      {/* ══════ Personel Atama Dialog ══════ */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              <UserPlus className="inline h-5 w-5 mr-2" />
              Projeye Personel Ata
            </DialogTitle>
            <p className="text-sm text-muted-foreground">Ana firma çalışanlarından seçin</p>
          </DialogHeader>

          {/* Arama */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ad, soyad veya görev ara..."
              value={poolSearch}
              onChange={(e) => {
                setPoolSearch(e.target.value);
                fetchPool(e.target.value);
              }}
              className="pl-9"
            />
          </div>

          {/* Liste */}
          <div className="flex-1 overflow-y-auto border rounded-md min-h-[200px] max-h-[400px]">
            {poolLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : poolWorkers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                {poolSearch ? "Arama sonucu bulunamadı" : "Atanabilecek personel yok"}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Ad Soyad</TableHead>
                    <TableHead>Görevi</TableHead>
                    <TableHead>Firma / Ekip</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {poolWorkers.map((w) => {
                    const selected = selectedWorkerIds.has(w.id);
                    return (
                      <TableRow
                        key={w.id}
                        className={`cursor-pointer ${selected ? "bg-primary/5" : "hover:bg-muted/50"}`}
                        onClick={() => togglePoolSelection(w.id)}
                      >
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => togglePoolSelection(w.id)}
                            className="h-4 w-4 rounded"
                          />
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {w.firstName} {w.lastName}
                          {w.position && <span className="text-xs text-muted-foreground ml-1">({w.position})</span>}
                        </TableCell>
                        <TableCell className="text-sm">{w.role}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {w.team.company.name} › {w.team.name}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedWorkerIds.size > 0 ? `${selectedWorkerIds.size} kişi seçildi` : "Personel seçin"}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>İptal</Button>
              <Button onClick={handleAssign} disabled={assigning || selectedWorkerIds.size === 0}>
                {assigning ? (
                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Atanıyor...</>
                ) : (
                  <><UserCheck className="h-4 w-4 mr-1" /> Ata ({selectedWorkerIds.size})</>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════ Çalışan Düzenle / Yeni Çalışan Dialog ══════ */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Çalışan Düzenle" : "Yeni Çalışan Ekle"}</DialogTitle>
            {!editingId && (
              <p className="text-sm text-muted-foreground">Çalışan oluşturulacak ve otomatik olarak projeye atanacak</p>
            )}
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
              <Label>Yaka Tipi *</Label>
              <Select value={form.collarType} onValueChange={(v) => setForm({ ...form, collarType: v })}>
                <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BLUE">Mavi Yaka</SelectItem>
                  <SelectItem value="WHITE">Beyaz Yaka</SelectItem>
                </SelectContent>
              </Select>
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
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>İptal</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Kaydediliyor..." : editingId ? "Güncelle" : "Oluştur ve Ata"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
