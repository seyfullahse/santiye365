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
  Plus, HardHat, Search, Pencil, Trash2, Users, BookOpen, CheckCircle2,
  AlertTriangle, Loader2, Download, Package, Undo2, ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { TablePagination } from "@/components/ui/table-pagination";

const ASS_PAGE_SIZE = 25;

/* ─── Types ─── */
interface PPEType {
  id: string;
  name: string;
  category: string | null;
  validityDays: number | null;
  _count?: { assignments: number };
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeNo: string | null;
  department: { name: string } | null;
  position: { name: string } | null;
}

interface PPEAssignment {
  id: string;
  employeeId: string;
  ppeTypeId: string;
  assignDate: string;
  returnDate: string | null;
  expiryDate: string | null;
  serialNo: string | null;
  status: string;
  notes: string | null;
  employee: { id: string; firstName: string; lastName: string; employeeNo?: string; department?: { name: string } | null };
  ppeType: { id: string; name: string; category: string | null };
}

/* ─── Constants ─── */
const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ASSIGNED: { label: "Zimmetli", variant: "default" },
  RETURNED: { label: "İade Edildi", variant: "secondary" },
  DAMAGED: { label: "Hasarlı", variant: "destructive" },
  LOST: { label: "Kayıp", variant: "outline" },
  EXPIRED_PPE: { label: "Süresi Doldu", variant: "destructive" },
};

const emptyTypeForm = { name: "", category: "", validityDays: "" };

/* ─── Page ─── */
export default function KKDPage() {
  // KKD türleri
  const [ppeTypes, setPpeTypes] = useState<PPEType[]>([]);
  const [typeLoading, setTypeLoading] = useState(true);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<PPEType | null>(null);
  const [typeForm, setTypeForm] = useState(emptyTypeForm);

  // Zimmet kayıtları
  const [assignments, setAssignments] = useState<PPEAssignment[]>([]);
  const [assLoading, setAssLoading] = useState(true);
  const [assSearch, setAssSearch] = useState("");
  const [assStatusFilter, setAssStatusFilter] = useState("all");
  const [assTypeFilter, setAssTypeFilter] = useState("all");
  const [assPage, setAssPage] = useState(1);
  const [assPageSize, setAssPageSize] = useState(ASS_PAGE_SIZE);

  // Personel
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Toplu zimmet
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignPpeTypeId, setAssignPpeTypeId] = useState("");
  const [assignDate, setAssignDate] = useState(new Date().toISOString().split("T")[0]);
  const [assignSerialNo, setAssignSerialNo] = useState("");
  const [assignNotes, setAssignNotes] = useState("");
  const [assignSelected, setAssignSelected] = useState<Set<string>>(new Set());
  const [assignSearch, setAssignSearch] = useState("");
  const [assignDeptFilter, setAssignDeptFilter] = useState("all");
  const [assigning, setAssigning] = useState(false);

  // Seed
  const [seeding, setSeeding] = useState(false);

  // İade dialog
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returningId, setReturningId] = useState("");
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split("T")[0]);
  const [returnStatus, setReturnStatus] = useState("RETURNED");

  /* ─── Fetch ─── */
  const fetchTypes = useCallback(async () => {
    setTypeLoading(true);
    try {
      const res = await fetch("/api/isg/kkd-turleri");
      if (res.ok) setPpeTypes(await res.json());
    } catch { /* ignore */ }
    setTypeLoading(false);
  }, []);

  const fetchAssignments = useCallback(async () => {
    setAssLoading(true);
    try {
      const res = await fetch("/api/isg/kkd");
      if (res.ok) setAssignments(await res.json());
    } catch { /* ignore */ }
    setAssLoading(false);
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

  useEffect(() => {
    fetchTypes();
    fetchAssignments();
    fetchEmployees();
  }, [fetchTypes, fetchAssignments, fetchEmployees]);

  /* ─── KKD Türü CRUD ─── */
  const openCreateType = () => {
    setEditingType(null);
    setTypeForm(emptyTypeForm);
    setTypeDialogOpen(true);
  };

  const openEditType = (t: PPEType) => {
    setEditingType(t);
    setTypeForm({
      name: t.name,
      category: t.category || "",
      validityDays: t.validityDays?.toString() || "",
    });
    setTypeDialogOpen(true);
  };

  const handleSaveType = async () => {
    if (!typeForm.name.trim()) return toast.error("KKD adı zorunludur");
    const body = {
      name: typeForm.name,
      category: typeForm.category || null,
      validityDays: typeForm.validityDays || null,
    };
    try {
      const res = editingType
        ? await fetch(`/api/isg/kkd-turleri/${editingType.id}`, {
            method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
          })
        : await fetch("/api/isg/kkd-turleri", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
          });
      if (res.ok) {
        toast.success(editingType ? "KKD türü güncellendi" : "KKD türü oluşturuldu");
        setTypeDialogOpen(false);
        fetchTypes();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "İşlem başarısız");
      }
    } catch { toast.error("Bağlantı hatası"); }
  };

  const handleDeleteType = async (id: string) => {
    if (!confirm("Bu KKD türünü silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/isg/kkd-turleri/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("KKD türü silindi");
        fetchTypes();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Silme başarısız");
      }
    } catch { toast.error("Bağlantı hatası"); }
  };

  /* ─── Seed ─── */
  const handleSeed = async () => {
    if (!confirm("Standart KKD türleri içe aktarılsın mı? (Mevcut türler korunur, sadece yeni olanlar eklenir)")) return;
    setSeeding(true);
    try {
      const res = await fetch("/api/isg/kkd-turleri/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${data.created} yeni KKD türü eklendi`);
        if (data.skipped > 0) toast.info(`${data.skipped} tür zaten mevcut, atlandı`);
        fetchTypes();
      } else toast.error(data.error || "İçe aktarma başarısız");
    } catch { toast.error("Bağlantı hatası"); }
    finally { setSeeding(false); }
  };

  /* ─── Zimmet Kaydı Silme ─── */
  const handleDeleteAssignment = async (id: string) => {
    if (!confirm("Bu zimmet kaydını silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/isg/kkd/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Zimmet kaydı silindi");
        fetchAssignments();
      } else toast.error("Silme başarısız");
    } catch { toast.error("Bağlantı hatası"); }
  };

  /* ─── İade İşlemi ─── */
  const openReturnDialog = (id: string) => {
    setReturningId(id);
    setReturnDate(new Date().toISOString().split("T")[0]);
    setReturnStatus("RETURNED");
    setReturnDialogOpen(true);
  };

  const handleReturn = async () => {
    try {
      const res = await fetch(`/api/isg/kkd/${returningId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: returnStatus, returnDate: returnDate }),
      });
      if (res.ok) {
        toast.success("KKD iade/durum güncellendi");
        setReturnDialogOpen(false);
        fetchAssignments();
      } else toast.error("Güncelleme başarısız");
    } catch { toast.error("Bağlantı hatası"); }
  };

  /* ─── Toplu Zimmet ─── */
  const openAssignDialog = () => {
    setAssignDialogOpen(true);
    setAssignPpeTypeId("");
    setAssignDate(new Date().toISOString().split("T")[0]);
    setAssignSerialNo("");
    setAssignNotes("");
    setAssignSelected(new Set());
    setAssignSearch("");
    setAssignDeptFilter("all");
  };

  const handlePpeTypeSelect = (typeId: string) => {
    setAssignPpeTypeId(typeId);
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

  const toggleSelect = (id: string) => {
    setAssignSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
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
    if (!assignPpeTypeId) return toast.error("KKD türü seçin");
    if (!assignDate) return toast.error("Zimmet tarihi seçin");

    setAssigning(true);
    let created = 0;
    let failed = 0;

    // Geçerlilik tarihi hesapla
    const selectedType = ppeTypes.find((t) => t.id === assignPpeTypeId);
    let expiryDate: string | null = null;
    if (selectedType?.validityDays) {
      const exp = new Date(assignDate);
      exp.setDate(exp.getDate() + selectedType.validityDays);
      expiryDate = exp.toISOString().split("T")[0];
    }

    for (const empId of Array.from(assignSelected)) {
      try {
        const res = await fetch("/api/isg/kkd", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: empId,
            ppeTypeId: assignPpeTypeId,
            assignDate: assignDate,
            expiryDate,
            serialNo: assignSerialNo || null,
            status: "ASSIGNED",
            notes: assignNotes || null,
          }),
        });
        if (res.ok) created++;
        else failed++;
      } catch { failed++; }
    }

    if (created > 0) toast.success(`${created} personele KKD zimmetlendi`);
    if (failed > 0) toast.error(`${failed} kayıt başarısız`);
    setAssignDialogOpen(false);
    fetchAssignments();
    setAssigning(false);
  };

  /* ─── Filtered Assignments ─── */
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if (assSearch) {
        const s = assSearch.toLowerCase();
        if (!`${a.employee.firstName} ${a.employee.lastName} ${a.ppeType.name} ${a.serialNo || ""}`.toLowerCase().includes(s)) return false;
      }
      if (assStatusFilter !== "all" && a.status !== assStatusFilter) return false;
      if (assTypeFilter !== "all" && a.ppeTypeId !== assTypeFilter) return false;
      return true;
    });
  }, [assignments, assSearch, assStatusFilter, assTypeFilter]);

  // Filtre değişince sayfa sıfırla
  useEffect(() => { setAssPage(1); }, [assSearch, assStatusFilter, assTypeFilter]);

  const paginatedAssignments = useMemo(() => {
    const start = (assPage - 1) * assPageSize;
    return filteredAssignments.slice(start, start + assPageSize);
  }, [filteredAssignments, assPage, assPageSize]);

  /* ─── Stats ─── */
  const stats = useMemo(() => {
    const total = assignments.length;
    const assigned = assignments.filter((a) => a.status === "ASSIGNED").length;
    const returned = assignments.filter((a) => a.status === "RETURNED").length;
    const expired = assignments.filter((a) => a.status === "EXPIRED_PPE" || (a.expiryDate && new Date(a.expiryDate) < new Date() && a.status === "ASSIGNED")).length;
    return { total, assigned, returned, expired };
  }, [assignments]);

  /* ─── Categories for type grouping ─── */
  const typeCategories = useMemo(() => {
    const cats = new Set<string>();
    ppeTypes.forEach((t) => { if (t.category) cats.add(t.category); });
    return Array.from(cats).sort((a, b) => a.localeCompare(b, "tr"));
  }, [ppeTypes]);

  const setTypeField = (f: string, v: string) => setTypeForm((p) => ({ ...p, [f]: v }));

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HardHat className="h-6 w-6" />KKD Yönetimi
          </h1>
          <p className="text-muted-foreground">Kişisel Koruyucu Donanım türleri ve zimmet takibi</p>
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100"><Package className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Toplam Kayıt</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100"><CheckCircle2 className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold">{stats.assigned}</p><p className="text-xs text-muted-foreground">Zimmetli</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100"><Undo2 className="h-5 w-5 text-gray-600" /></div>
            <div><p className="text-2xl font-bold">{stats.returned}</p><p className="text-xs text-muted-foreground">İade Edilen</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
            <div><p className="text-2xl font-bold">{stats.expired}</p><p className="text-xs text-muted-foreground">Süresi Dolan</p></div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="zimmet">
        <TabsList>
          <TabsTrigger value="zimmet" className="gap-1.5"><Users className="h-4 w-4" />Zimmet Kayıtları</TabsTrigger>
          <TabsTrigger value="turler" className="gap-1.5"><BookOpen className="h-4 w-4" />KKD Türleri</TabsTrigger>
        </TabsList>

        {/* ═══════ TAB: Zimmet Kayıtları ═══════ */}
        <TabsContent value="zimmet" className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Personel, KKD veya seri no ara..." className="pl-9" value={assSearch} onChange={(e) => setAssSearch(e.target.value)} />
            </div>
            <Select value={assTypeFilter} onValueChange={setAssTypeFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="KKD Türü" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Türler</SelectItem>
                {ppeTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={assStatusFilter} onValueChange={setAssStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Durum" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                {Object.entries(statusMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={openAssignDialog} className="whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" />KKD Zimmetle
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {assLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /><span className="ml-2">Yükleniyor...</span></div>
              ) : filteredAssignments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {assignments.length === 0 ? "Henüz zimmet kaydı yok. \"KKD Zimmetle\" ile başlayın." : "Filtrelere uygun kayıt bulunamadı."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Personel</TableHead>
                        <TableHead>Departman</TableHead>
                        <TableHead>KKD</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Seri No</TableHead>
                        <TableHead>Zimmet Tarihi</TableHead>
                        <TableHead>Geçerlilik</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead className="w-24">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedAssignments.map((a) => {
                        const isExpired = a.expiryDate && new Date(a.expiryDate) < new Date() && a.status === "ASSIGNED";
                        return (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium">{a.employee.firstName} {a.employee.lastName}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{a.employee.department?.name || "-"}</TableCell>
                            <TableCell>{a.ppeType.name}</TableCell>
                            <TableCell><Badge variant="outline">{a.ppeType.category || "-"}</Badge></TableCell>
                            <TableCell className="font-mono text-xs">{a.serialNo || "-"}</TableCell>
                            <TableCell>{new Date(a.assignDate).toLocaleDateString("tr-TR")}</TableCell>
                            <TableCell>
                              {a.expiryDate ? (
                                <span className={isExpired ? "text-red-600 font-medium" : ""}>
                                  {new Date(a.expiryDate).toLocaleDateString("tr-TR")}
                                  {isExpired && " ⚠️"}
                                </span>
                              ) : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={isExpired ? "destructive" : (statusMap[a.status]?.variant || "secondary")}>
                                {isExpired ? "Süresi Doldu" : (statusMap[a.status]?.label || a.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {a.status === "ASSIGNED" && (
                                  <Button variant="ghost" size="icon" title="İade / Durum Güncelle" onClick={() => openReturnDialog(a.id)}>
                                    <Undo2 className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteAssignment(a.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
              {!assLoading && filteredAssignments.length > 0 && (
                <TablePagination
                  totalItems={filteredAssignments.length}
                  pageSize={assPageSize}
                  currentPage={assPage}
                  onPageChange={setAssPage}
                  onPageSizeChange={setAssPageSize}
                  itemLabel="zimmet kaydı"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ TAB: KKD Türleri ═══════ */}
        <TabsContent value="turler" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">KKD türlerini tanımlayın, sonra personele zimmetleyin</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleSeed} disabled={seeding}>
                {seeding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Standart KKD Türlerini İçe Aktar
              </Button>
              <Button size="sm" onClick={openCreateType}><Plus className="h-4 w-4 mr-2" />Yeni KKD Türü</Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {typeLoading ? (
                <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
              ) : ppeTypes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Henüz KKD türü tanımlanmamış</p>
                  <p className="text-sm mt-1">&quot;Standart KKD Türlerini İçe Aktar&quot; ile hızlı başlayın</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>KKD Adı</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Geçerlilik Süresi</TableHead>
                      <TableHead>Zimmet Sayısı</TableHead>
                      <TableHead className="w-24">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ppeTypes.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell><Badge variant="outline">{t.category || "-"}</Badge></TableCell>
                        <TableCell>
                          {t.validityDays
                            ? t.validityDays >= 365
                              ? `${Math.round(t.validityDays / 365)} yıl`
                              : t.validityDays >= 30
                                ? `${Math.round(t.validityDays / 30)} ay`
                                : `${t.validityDays} gün`
                            : "Belirtilmemiş"}
                        </TableCell>
                        <TableCell>{t._count?.assignments || 0}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditType(t)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteType(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

      {/* ═══════ KKD Türü Dialog ═══════ */}
      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingType ? "KKD Türünü Düzenle" : "Yeni KKD Türü"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>KKD Adı *</Label>
              <Input value={typeForm.name} onChange={(e) => setTypeField("name", e.target.value)} placeholder="Örn: Çelik Burunlu Ayakkabı" />
            </div>
            <div>
              <Label>Kategori</Label>
              <Select value={typeForm.category} onValueChange={(v) => setTypeField("category", v)}>
                <SelectTrigger><SelectValue placeholder="Kategori seçin veya yeni yazın" /></SelectTrigger>
                <SelectContent>
                  {typeCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  <SelectItem value="Baş Koruma">Baş Koruma</SelectItem>
                  <SelectItem value="Ayak Koruma">Ayak Koruma</SelectItem>
                  <SelectItem value="El Koruma">El Koruma</SelectItem>
                  <SelectItem value="Göz ve Yüz Koruma">Göz ve Yüz Koruma</SelectItem>
                  <SelectItem value="Vücut Koruma">Vücut Koruma</SelectItem>
                  <SelectItem value="Yüksekte Çalışma">Yüksekte Çalışma</SelectItem>
                  <SelectItem value="Solunum Koruma">Solunum Koruma</SelectItem>
                  <SelectItem value="İşitme Koruma">İşitme Koruma</SelectItem>
                  <SelectItem value="Diz Koruma">Diz Koruma</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Geçerlilik Süresi (Gün)</Label>
              <Input type="number" min="0" value={typeForm.validityDays} onChange={(e) => setTypeField("validityDays", e.target.value)} placeholder="365" />
              <p className="text-xs text-muted-foreground mt-1">Boş bırakılırsa geçerlilik süresi hesaplanmaz</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTypeDialogOpen(false)}>İptal</Button>
            <Button onClick={handleSaveType} disabled={!typeForm.name.trim()}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════ Toplu Zimmet Dialog ═══════ */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>KKD Zimmetle</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>KKD Türü *</Label>
                <Select value={assignPpeTypeId} onValueChange={handlePpeTypeSelect}>
                  <SelectTrigger><SelectValue placeholder="KKD seçin" /></SelectTrigger>
                  <SelectContent>
                    {ppeTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} {t.category ? `(${t.category})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {ppeTypes.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">Önce &quot;KKD Türleri&quot; sekmesinden KKD ekleyin</p>
                )}
              </div>
              <div>
                <Label>Zimmet Tarihi *</Label>
                <Input type="date" value={assignDate} onChange={(e) => setAssignDate(e.target.value)} />
              </div>
              <div>
                <Label>Seri No</Label>
                <Input value={assignSerialNo} onChange={(e) => setAssignSerialNo(e.target.value)} placeholder="İsteğe bağlı" />
              </div>
              <div>
                <Label>Not</Label>
                <Input value={assignNotes} onChange={(e) => setAssignNotes(e.target.value)} placeholder="İsteğe bağlı not..." />
              </div>
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
                          onCheckedChange={toggleSelectAll}
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
                        onClick={() => toggleSelect(emp.id)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={assignSelected.has(emp.id)} onCheckedChange={() => toggleSelect(emp.id)} />
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
              disabled={assigning || assignSelected.size === 0 || !assignPpeTypeId || !assignDate}
            >
              {assigning ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Zimmetleniyor...</>
              ) : (
                `${assignSelected.size} Personele Zimmetle`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════ İade / Durum Güncelle Dialog ═══════ */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>KKD İade / Durum Güncelle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Yeni Durum</Label>
              <Select value={returnStatus} onValueChange={setReturnStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="RETURNED">İade Edildi</SelectItem>
                  <SelectItem value="DAMAGED">Hasarlı</SelectItem>
                  <SelectItem value="LOST">Kayıp</SelectItem>
                  <SelectItem value="EXPIRED_PPE">Süresi Doldu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>İade Tarihi</Label>
              <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>İptal</Button>
            <Button onClick={handleReturn}>Güncelle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
