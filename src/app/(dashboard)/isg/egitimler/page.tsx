"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus, GraduationCap, Search, Pencil, Trash2, Users, BookOpen, CheckCircle2,
  AlertTriangle, Clock, XCircle, Loader2, Download,
} from "lucide-react";
import { toast } from "sonner";
import { TablePagination } from "@/components/ui/table-pagination";

const REC_PAGE_SIZE = 25;

/* ─── Types ─── */
interface TrainingRequirement {
  id?: string;
  targetType: string;
  targetValue: string | null;
}

interface TrainingDef {
  id: string;
  name: string;
  description: string | null;
  durationHours: number;
  isMandatory: boolean;
  validityMonths: number | null;
  category: string;
  _count?: { trainings: number };
  requirements?: TrainingRequirement[];
}

interface Department { id: string; name: string }
interface PositionItem { id: string; name: string; department?: { name: string } }

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeNo: string | null;
  department: { name: string } | null;
  position: { name: string } | null;
}

interface TrainingRecord {
  id: string;
  employeeId: string;
  trainingId: string;
  trainingDate: string;
  expiryDate: string | null;
  status: string;
  score: number | null;
  notes: string | null;
  employee: { id: string; firstName: string; lastName: string; employeeNo?: string; department?: { name: string } | null };
  training: { id: string; name: string; category: string; durationHours: number };
}

/* ─── Constants ─── */
const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }> = {
  PLANNED: { label: "Planlandı", variant: "secondary", icon: Clock },
  COMPLETED_TRAINING: { label: "Tamamlandı", variant: "default", icon: CheckCircle2 },
  FAILED: { label: "Başarısız", variant: "destructive", icon: XCircle },
  EXPIRED_TRAINING: { label: "Süresi Doldu", variant: "outline", icon: AlertTriangle },
};

const categoryMap: Record<string, string> = {
  ISG: "İSG Genel",
  TECHNICAL: "Teknik",
  PROFESSIONAL: "Mesleki",
  ORIENTATION: "Oryantasyon",
};

const emptyDefForm = {
  name: "", description: "", durationHours: "", isMandatory: false,
  validityMonths: "", category: "ISG",
};

const targetTypeLabels: Record<string, string> = {
  ALL: "Tüm Personel",
  COLLAR_TYPE: "Yaka Tipi",
  DEPARTMENT: "Departman",
  POSITION: "Pozisyon",
  EMPLOYEE: "Kişi",
};

/* ─── Page ─── */
export default function EgitimlerPage() {
  // Eğitim tanımları
  const [definitions, setDefinitions] = useState<TrainingDef[]>([]);
  const [defLoading, setDefLoading] = useState(true);
  const [defDialogOpen, setDefDialogOpen] = useState(false);
  const [editingDef, setEditingDef] = useState<TrainingDef | null>(null);
  const [defForm, setDefForm] = useState(emptyDefForm);
  const [defRequirements, setDefRequirements] = useState<TrainingRequirement[]>([]);

  // Departman/Pozisyon listeleri (hedef kitle için)
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [allPositions, setAllPositions] = useState<PositionItem[]>([]);

  // Eğitim kayıtları
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [recLoading, setRecLoading] = useState(true);
  const [recSearch, setRecSearch] = useState("");
  const [recStatusFilter, setRecStatusFilter] = useState("all");
  const [recDefFilter, setRecDefFilter] = useState("all");
  const [recPage, setRecPage] = useState(1);
  const [recPageSize, setRecPageSize] = useState(REC_PAGE_SIZE);

  // Personel listesi (tüm İK personeli)
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Toplu atama
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignTrainingId, setAssignTrainingId] = useState("");
  const [assignDate, setAssignDate] = useState(new Date().toISOString().split("T")[0]);
  const [assignExpiryDate, setAssignExpiryDate] = useState("");
  const [assignStatus, setAssignStatus] = useState("PLANNED");
  const [assignNotes, setAssignNotes] = useState("");
  const [assignSelected, setAssignSelected] = useState<Set<string>>(new Set());
  const [assignSearch, setAssignSearch] = useState("");
  const [assignDeptFilter, setAssignDeptFilter] = useState("all");
  const [assigning, setAssigning] = useState(false);
  const [seeding, setSeeding] = useState(false);

  /* ─── Fetch ─── */
  const fetchDefinitions = useCallback(async () => {
    setDefLoading(true);
    try {
      const res = await fetch("/api/isg/egitim-tanimlari");
      if (res.ok) setDefinitions(await res.json());
    } catch { /* ignore */ }
    setDefLoading(false);
  }, []);

  const fetchRecords = useCallback(async () => {
    setRecLoading(true);
    try {
      const res = await fetch("/api/isg/egitimler");
      if (res.ok) setRecords(await res.json());
    } catch { /* ignore */ }
    setRecLoading(false);
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/ik/personel?limit=9999");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchDeptPos = useCallback(async () => {
    try {
      const [dRes, pRes] = await Promise.all([
        fetch("/api/ik/departmanlar"),
        fetch("/api/ik/pozisyonlar"),
      ]);
      if (dRes.ok) setAllDepartments(await dRes.json());
      if (pRes.ok) setAllPositions(await pRes.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchDefinitions();
    fetchRecords();
    fetchEmployees();
    fetchDeptPos();
  }, [fetchDefinitions, fetchRecords, fetchEmployees, fetchDeptPos]);

  /* ─── Standart Eğitim İçe Aktar ─── */
  const handleSeedDefinitions = async () => {
    if (!confirm("Standart İSG eğitim tanımları içe aktarılsın mı? (Mevcut tanımlar korunur, sadece yeni olanlar eklenir)")) return;
    setSeeding(true);
    try {
      const res = await fetch("/api/isg/egitim-tanimlari/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${data.created} yeni eğitim tanımı eklendi`);
        if (data.skipped > 0) toast.info(`${data.skipped} tanım zaten mevcut, atlandı`);
        fetchDefinitions();
      } else {
        toast.error(data.error || "İçe aktarma başarısız");
      }
    } catch { toast.error("Bağlantı hatası"); }
    finally { setSeeding(false); }
  };

  /* ─── Eğitim Tanımı CRUD ─── */
  const openCreateDef = () => {
    setEditingDef(null);
    setDefForm(emptyDefForm);
    setDefRequirements([]);
    setDefDialogOpen(true);
  };

  const openEditDef = (d: TrainingDef) => {
    setEditingDef(d);
    setDefForm({
      name: d.name,
      description: d.description || "",
      durationHours: d.durationHours.toString(),
      isMandatory: d.isMandatory,
      validityMonths: d.validityMonths?.toString() || "",
      category: d.category,
    });
    setDefRequirements(d.requirements || []);
    setDefDialogOpen(true);
  };

  const handleSaveDef = async () => {
    if (!defForm.name.trim()) return toast.error("Eğitim adı zorunludur");
    // isMandatory: requirements varsa true yap
    const hasRequirements = defRequirements.length > 0;
    const body = {
      ...defForm,
      isMandatory: hasRequirements || defForm.isMandatory,
      durationHours: defForm.durationHours || "0",
      validityMonths: defForm.validityMonths || null,
      requirements: defRequirements.map((r) => ({
        targetType: r.targetType,
        targetValue: r.targetValue,
      })),
    };
    try {
      const res = editingDef
        ? await fetch(`/api/isg/egitim-tanimlari/${editingDef.id}`, {
            method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
          })
        : await fetch("/api/isg/egitim-tanimlari", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
          });
      if (res.ok) {
        toast.success(editingDef ? "Eğitim tanımı güncellendi" : "Eğitim tanımı oluşturuldu");
        setDefDialogOpen(false);
        fetchDefinitions();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "İşlem başarısız");
      }
    } catch { toast.error("Bağlantı hatası"); }
  };

  const handleDeleteDef = async (id: string) => {
    if (!confirm("Bu eğitim tanımını silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/isg/egitim-tanimlari/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Eğitim tanımı silindi");
        fetchDefinitions();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Silme başarısız");
      }
    } catch { toast.error("Bağlantı hatası"); }
  };

  /* ─── Eğitim Kaydı Silme ─── */
  const handleDeleteRecord = async (id: string) => {
    if (!confirm("Bu eğitim kaydını silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/isg/egitimler/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Eğitim kaydı silindi");
        fetchRecords();
      } else toast.error("Silme başarısız");
    } catch { toast.error("Bağlantı hatası"); }
  };

  /* ─── Toplu Atama ─── */
  const openAssignDialog = () => {
    setAssignDialogOpen(true);
    setAssignTrainingId("");
    setAssignDate(new Date().toISOString().split("T")[0]);
    setAssignExpiryDate("");
    setAssignStatus("PLANNED");
    setAssignNotes("");
    setAssignSelected(new Set());
    setAssignSearch("");
    setAssignDeptFilter("all");
  };

  // Eğitim tanımı seçildiğinde geçerlilik süresini otomatik hesapla
  const handleTrainingSelect = (trainingId: string) => {
    setAssignTrainingId(trainingId);
    const def = definitions.find((d) => d.id === trainingId);
    if (def?.validityMonths && assignDate) {
      const expiry = new Date(assignDate);
      expiry.setMonth(expiry.getMonth() + def.validityMonths);
      setAssignExpiryDate(expiry.toISOString().split("T")[0]);
    }
  };

  const departments = useMemo(() => {
    const depts = new Map<string, string>();
    employees.forEach((e) => {
      if (e.department) depts.set(e.department.name, e.department.name);
    });
    return Array.from(depts.values()).sort((a, b) => a.localeCompare(b, "tr"));
  }, [employees]);

  const filteredAssignEmployees = useMemo(() => {
    return employees.filter((e) => {
      if (assignSearch) {
        const s = assignSearch.toLowerCase();
        if (!`${e.firstName} ${e.lastName} ${e.employeeNo || ""}`.toLowerCase().includes(s)) return false;
      }
      if (assignDeptFilter !== "all" && e.department?.name !== assignDeptFilter) return false;
      return true;
    });
  }, [employees, assignSearch, assignDeptFilter]);

  const toggleAssignSelect = (id: string) => {
    setAssignSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAssignSelectAll = () => {
    const ids = filteredAssignEmployees.map((e) => e.id);
    const allSelected = ids.every((id) => assignSelected.has(id));
    setAssignSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleBulkAssign = async () => {
    if (assignSelected.size === 0) return toast.error("En az bir personel seçin");
    if (!assignTrainingId) return toast.error("Eğitim tanımı seçin");
    if (!assignDate) return toast.error("Eğitim tarihi seçin");

    setAssigning(true);
    try {
      const res = await fetch("/api/isg/egitimler/toplu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeIds: Array.from(assignSelected),
          trainingId: assignTrainingId,
          trainingDate: assignDate,
          expiryDate: assignExpiryDate || null,
          status: assignStatus,
          notes: assignNotes || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${data.created} personele eğitim atandı`);
        if (data.skipped > 0) toast.warning(`${data.skipped} personel zaten bu eğitime kayıtlı`);
        setAssignDialogOpen(false);
        fetchRecords();
      } else {
        toast.error(data.error || "Atama başarısız");
      }
    } catch { toast.error("Bağlantı hatası"); }
    finally { setAssigning(false); }
  };

  /* ─── Filtered Records ─── */
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (recSearch) {
        const s = recSearch.toLowerCase();
        if (!`${r.employee.firstName} ${r.employee.lastName} ${r.training.name}`.toLowerCase().includes(s)) return false;
      }
      if (recStatusFilter !== "all" && r.status !== recStatusFilter) return false;
      if (recDefFilter !== "all" && r.trainingId !== recDefFilter) return false;
      return true;
    });
  }, [records, recSearch, recStatusFilter, recDefFilter]);

  // Filtre değişince sayfa sıfırla
  useEffect(() => { setRecPage(1); }, [recSearch, recStatusFilter, recDefFilter]);

  const paginatedRecords = useMemo(() => {
    const start = (recPage - 1) * recPageSize;
    return filteredRecords.slice(start, start + recPageSize);
  }, [filteredRecords, recPage, recPageSize]);

  /* ─── Stats ─── */
  const stats = useMemo(() => {
    const total = records.length;
    const completed = records.filter((r) => r.status === "COMPLETED_TRAINING").length;
    const planned = records.filter((r) => r.status === "PLANNED").length;
    const expired = records.filter((r) => r.status === "EXPIRED_TRAINING").length;
    return { total, completed, planned, expired };
  }, [records]);

  const setDefField = (f: string, v: string | boolean) => setDefForm((p) => ({ ...p, [f]: v }));

  /* ─── Hedef Kitle Yönetimi ─── */
  const addRequirement = (targetType: string, targetValue: string | null) => {
    // Aynı kural varsa ekleme
    if (defRequirements.some((r) => r.targetType === targetType && r.targetValue === targetValue)) return;
    setDefRequirements((prev) => [...prev, { targetType, targetValue }]);
  };

  const removeRequirement = (idx: number) => {
    setDefRequirements((prev) => prev.filter((_, i) => i !== idx));
  };

  const getRequirementLabel = (r: TrainingRequirement): string => {
    switch (r.targetType) {
      case "ALL": return "Tüm Personel";
      case "COLLAR_TYPE": return r.targetValue === "WHITE" ? "Beyaz Yaka" : "Mavi Yaka";
      case "DEPARTMENT": {
        const dept = allDepartments.find((d) => d.id === r.targetValue);
        return dept ? `Dept: ${dept.name}` : `Dept: ${r.targetValue}`;
      }
      case "POSITION": {
        const pos = allPositions.find((p) => p.id === r.targetValue);
        return pos ? `Poz: ${pos.name}` : `Poz: ${r.targetValue}`;
      }
      case "EMPLOYEE": {
        const emp = employees.find((e) => e.id === r.targetValue);
        return emp ? `${emp.firstName} ${emp.lastName}` : `Kişi: ${r.targetValue}`;
      }
      default: return r.targetType;
    }
  };

  const getDefRequirementsSummary = (d: TrainingDef): string => {
    if (!d.requirements || d.requirements.length === 0) {
      return d.isMandatory ? "Tüm Personel (eski)" : "";
    }
    return d.requirements.map((r) => getRequirementLabel(r)).join(", ");
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />Eğitim Yönetimi
          </h1>
          <p className="text-muted-foreground">Eğitim tanımları oluşturun ve personele toplu eğitim atayın</p>
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100"><BookOpen className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Toplam Kayıt</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100"><CheckCircle2 className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold">{stats.completed}</p><p className="text-xs text-muted-foreground">Tamamlanan</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100"><Clock className="h-5 w-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold">{stats.planned}</p><p className="text-xs text-muted-foreground">Planlanan</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
            <div><p className="text-2xl font-bold">{stats.expired}</p><p className="text-xs text-muted-foreground">Süresi Dolan</p></div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="kayitlar">
        <TabsList>
          <TabsTrigger value="kayitlar" className="gap-1.5"><Users className="h-4 w-4" />Eğitim Kayıtları</TabsTrigger>
          <TabsTrigger value="tanimlar" className="gap-1.5"><BookOpen className="h-4 w-4" />Eğitim Tanımları</TabsTrigger>
        </TabsList>

        {/* ═══════ TAB: Eğitim Kayıtları ═══════ */}
        <TabsContent value="kayitlar" className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Personel veya eğitim adı ara..." className="pl-9" value={recSearch} onChange={(e) => setRecSearch(e.target.value)} />
            </div>
            <Select value={recDefFilter} onValueChange={setRecDefFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Eğitim" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Eğitimler</SelectItem>
                {definitions.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={recStatusFilter} onValueChange={setRecStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Durum" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                {Object.entries(statusMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={openAssignDialog} className="whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" />Eğitim Ata
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {recLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /><span className="ml-2">Yükleniyor...</span></div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {records.length === 0 ? "Henüz eğitim kaydı yok. \"Eğitim Ata\" ile başlayın." : "Filtrelere uygun kayıt bulunamadı."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Personel</TableHead>
                        <TableHead>Departman</TableHead>
                        <TableHead>Eğitim</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Geçerlilik</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Puan</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRecords.map((r) => {
                        const st = statusMap[r.status];
                        return (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.employee.firstName} {r.employee.lastName}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{r.employee.department?.name || "-"}</TableCell>
                            <TableCell>{r.training.name}</TableCell>
                            <TableCell><Badge variant="outline">{categoryMap[r.training.category] || r.training.category}</Badge></TableCell>
                            <TableCell>{new Date(r.trainingDate).toLocaleDateString("tr-TR")}</TableCell>
                            <TableCell>
                              {r.expiryDate ? (
                                <span className={new Date(r.expiryDate) < new Date() ? "text-red-600 font-medium" : ""}>
                                  {new Date(r.expiryDate).toLocaleDateString("tr-TR")}
                                </span>
                              ) : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={st?.variant || "secondary"}>
                                {st?.label || r.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{r.score ?? "-"}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteRecord(r.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
              {!recLoading && filteredRecords.length > 0 && (
                <TablePagination
                  totalItems={filteredRecords.length}
                  pageSize={recPageSize}
                  currentPage={recPage}
                  onPageChange={setRecPage}
                  onPageSizeChange={setRecPageSize}
                  itemLabel="eğitim kaydı"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ TAB: Eğitim Tanımları ═══════ */}
        <TabsContent value="tanimlar" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">Eğitim türlerini tanımlayın, sonra personele atayın</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleSeedDefinitions} disabled={seeding}>
                {seeding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Standart Eğitimleri İçe Aktar
              </Button>
              <Button size="sm" onClick={openCreateDef}><Plus className="h-4 w-4 mr-2" />Yeni Tanım</Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {defLoading ? (
                <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
              ) : definitions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Henüz eğitim tanımı yok</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Eğitim Adı</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Süre (Saat)</TableHead>
                      <TableHead>Geçerlilik</TableHead>
                      <TableHead>Hedef Kitle</TableHead>
                      <TableHead>Kayıt Sayısı</TableHead>
                      <TableHead className="w-24">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {definitions.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>
                          <div>
                            <span className="font-medium">{d.name}</span>
                            {d.description && <p className="text-xs text-muted-foreground mt-0.5">{d.description}</p>}
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{categoryMap[d.category] || d.category}</Badge></TableCell>
                        <TableCell>{d.durationHours > 0 ? `${d.durationHours} saat` : "-"}</TableCell>
                        <TableCell>{d.validityMonths ? `${d.validityMonths} ay` : "Süresiz"}</TableCell>
                        <TableCell>
                          {(() => {
                            const summary = getDefRequirementsSummary(d);
                            return summary ? (
                              <span className="text-xs" title={summary}>
                                {summary.length > 30 ? summary.slice(0, 30) + "..." : summary}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">İsteğe bağlı</span>
                            );
                          })()}
                        </TableCell>
                        <TableCell>{d._count?.trainings || 0}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditDef(d)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteDef(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══════ Eğitim Tanımı Dialog ═══════ */}
      <Dialog open={defDialogOpen} onOpenChange={setDefDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDef ? "Eğitim Tanımını Düzenle" : "Yeni Eğitim Tanımı"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Eğitim Adı *</Label>
              <Input value={defForm.name} onChange={(e) => setDefField("name", e.target.value)} placeholder="Örn: Yüksekte Çalışma Eğitimi" />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Input value={defForm.description} onChange={(e) => setDefField("description", e.target.value)} placeholder="Kısa açıklama..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kategori</Label>
                <Select value={defForm.category} onValueChange={(v) => setDefField("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryMap).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Süre (Saat)</Label>
                <Input type="number" min="0" value={defForm.durationHours} onChange={(e) => setDefField("durationHours", e.target.value)} placeholder="8" />
              </div>
              <div>
                <Label>Geçerlilik (Ay)</Label>
                <Input type="number" min="0" value={defForm.validityMonths} onChange={(e) => setDefField("validityMonths", e.target.value)} placeholder="12" />
                <p className="text-xs text-muted-foreground mt-1">Boş bırakılırsa süresiz</p>
              </div>
            </div>

            {/* ─── Zorunlu Hedef Kitle ─── */}
            <div className="border-t pt-4 space-y-3">
              <Label className="text-sm font-semibold">Zorunlu Hedef Kitle</Label>
              <p className="text-xs text-muted-foreground -mt-2">Bu eğitim kimlere zorunlu? Boş bırakılırsa isteğe bağlı eğitim olur.</p>

              {/* Mevcut kurallar */}
              {defRequirements.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {defRequirements.map((r, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-1 pr-1">
                      {getRequirementLabel(r)}
                      <button
                        type="button"
                        onClick={() => removeRequirement(idx)}
                        className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                      >
                        <XCircle className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Hızlı ekleme butonları */}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button" variant="outline" size="sm"
                  onClick={() => addRequirement("ALL", null)}
                  disabled={defRequirements.some((r) => r.targetType === "ALL")}
                >
                  Tüm Personel
                </Button>
                <Button
                  type="button" variant="outline" size="sm"
                  onClick={() => addRequirement("COLLAR_TYPE", "BLUE")}
                  disabled={defRequirements.some((r) => r.targetType === "COLLAR_TYPE" && r.targetValue === "BLUE") || defRequirements.some((r) => r.targetType === "ALL")}
                >
                  🔵 Mavi Yaka
                </Button>
                <Button
                  type="button" variant="outline" size="sm"
                  onClick={() => addRequirement("COLLAR_TYPE", "WHITE")}
                  disabled={defRequirements.some((r) => r.targetType === "COLLAR_TYPE" && r.targetValue === "WHITE") || defRequirements.some((r) => r.targetType === "ALL")}
                >
                  ⚪ Beyaz Yaka
                </Button>
              </div>

              {/* Departman / Pozisyon / Kişi seçimi */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Select
                  value=""
                  onValueChange={(v) => addRequirement("DEPARTMENT", v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="+ Departman ekle" />
                  </SelectTrigger>
                  <SelectContent>
                    {allDepartments
                      .filter((d) => !defRequirements.some((r) => r.targetType === "DEPARTMENT" && r.targetValue === d.id))
                      .map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)
                    }
                  </SelectContent>
                </Select>

                <Select
                  value=""
                  onValueChange={(v) => addRequirement("POSITION", v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="+ Pozisyon ekle" />
                  </SelectTrigger>
                  <SelectContent>
                    {allPositions
                      .filter((p) => !defRequirements.some((r) => r.targetType === "POSITION" && r.targetValue === p.id))
                      .map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)
                    }
                  </SelectContent>
                </Select>

                <Select
                  value=""
                  onValueChange={(v) => addRequirement("EMPLOYEE", v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="+ Kişi ekle" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees
                      .filter((e) => !defRequirements.some((r) => r.targetType === "EMPLOYEE" && r.targetValue === e.id))
                      .slice(0, 100)
                      .map((e) => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDefDialogOpen(false)}>İptal</Button>
            <Button onClick={handleSaveDef} disabled={!defForm.name.trim()}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════ Toplu Eğitim Atama Dialog ═══════ */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Eğitim Ata</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Eğitim Seçimi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Eğitim Tanımı *</Label>
                <Select value={assignTrainingId} onValueChange={handleTrainingSelect}>
                  <SelectTrigger><SelectValue placeholder="Eğitim seçin" /></SelectTrigger>
                  <SelectContent>
                    {definitions.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name} ({categoryMap[d.category] || d.category})
                        {d.isMandatory ? " ⚠️" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {definitions.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">Önce &quot;Eğitim Tanımları&quot; sekmesinden eğitim ekleyin</p>
                )}
              </div>
              <div>
                <Label>Durum</Label>
                <Select value={assignStatus} onValueChange={setAssignStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Eğitim Tarihi *</Label>
                <Input type="date" value={assignDate} onChange={(e) => setAssignDate(e.target.value)} />
              </div>
              <div>
                <Label>Geçerlilik Tarihi</Label>
                <Input type="date" value={assignExpiryDate} onChange={(e) => setAssignExpiryDate(e.target.value)} />
                <p className="text-xs text-muted-foreground mt-1">Eğitim tanımından otomatik hesaplanır</p>
              </div>
            </div>

            <div>
              <Label>Not</Label>
              <Input value={assignNotes} onChange={(e) => setAssignNotes(e.target.value)} placeholder="İsteğe bağlı not..." />
            </div>

            {/* Personel Seçimi */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Personel Seçimi</h3>
                <span className="text-sm text-muted-foreground">{assignSelected.size} / {employees.length} seçili</span>
              </div>

              <div className="flex gap-3 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Personel ara..." className="pl-9" value={assignSearch} onChange={(e) => setAssignSearch(e.target.value)} />
                </div>
                <Select value={assignDeptFilter} onValueChange={setAssignDeptFilter}>
                  <SelectTrigger className="w-48"><SelectValue placeholder="Departman" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Departmanlar</SelectItem>
                    {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="max-h-60 overflow-y-auto border rounded">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={filteredAssignEmployees.length > 0 && filteredAssignEmployees.every((e) => assignSelected.has(e.id))}
                          onCheckedChange={toggleAssignSelectAll}
                        />
                      </TableHead>
                      <TableHead>Ad Soyad</TableHead>
                      <TableHead>Sicil No</TableHead>
                      <TableHead>Departman</TableHead>
                      <TableHead>Pozisyon</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssignEmployees.map((emp) => (
                      <TableRow
                        key={emp.id}
                        className={`cursor-pointer ${assignSelected.has(emp.id) ? "bg-primary/5" : "hover:bg-muted/50"}`}
                        onClick={() => toggleAssignSelect(emp.id)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={assignSelected.has(emp.id)} onCheckedChange={() => toggleAssignSelect(emp.id)} />
                        </TableCell>
                        <TableCell className="font-medium">{emp.firstName} {emp.lastName}</TableCell>
                        <TableCell className="font-mono text-xs">{emp.employeeNo || "-"}</TableCell>
                        <TableCell>{emp.department?.name || "-"}</TableCell>
                        <TableCell>{emp.position?.name || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>İptal</Button>
            <Button
              onClick={handleBulkAssign}
              disabled={assigning || assignSelected.size === 0 || !assignTrainingId || !assignDate}
            >
              {assigning ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Atanıyor...</>
              ) : (
                `${assignSelected.size} Personele Ata`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
