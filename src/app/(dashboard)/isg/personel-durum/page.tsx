"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Search, Users, ShieldCheck, ShieldAlert, ShieldX, GraduationCap,
  HardHat, CheckCircle2, Clock, XCircle, AlertTriangle, Loader2, Eye, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { TablePagination } from "@/components/ui/table-pagination";

const PAGE_SIZE_DEFAULT = 25;

const statusOptions = [
  { value: "PLANNED", label: "Planlandı", color: "text-amber-700 bg-amber-50" },
  { value: "COMPLETED_TRAINING", label: "Tamamlandı", color: "text-green-700 bg-green-50" },
  { value: "FAILED", label: "Başarısız", color: "text-red-700 bg-red-50" },
  { value: "EXPIRED_TRAINING", label: "Süresi Doldu", color: "text-orange-700 bg-orange-50" },
];

const statusLabel: Record<string, string> = {
  PLANNED: "Planlandı",
  COMPLETED_TRAINING: "Tamamlandı",
  FAILED: "Başarısız",
  EXPIRED_TRAINING: "Süresi Doldu",
};

/* ─── Types ─── */
interface TrainingItem {
  id: string;
  name: string;
  category: string;
  status?: string;
  date?: string;
  expiryDate?: string | null;
  score?: number | null;
  isMandatory?: boolean;
}

interface PPEItem {
  name: string;
  category: string | null;
  assignDate: string;
  expiryDate: string | null;
  isExpired: boolean;
}

interface EmployeeISG {
  id: string;
  firstName: string;
  lastName: string;
  employeeNo: string | null;
  collarType: string | null;
  department: string | null;
  position: string | null;
  trainings: {
    completed: TrainingItem[];
    planned: TrainingItem[];
    expired: TrainingItem[];
    missingMandatory: TrainingItem[];
  };
  ppe: {
    active: number;
    expired: number;
    items: PPEItem[];
  };
  complianceScore: number;
}

interface Summary {
  totalEmployees: number;
  fullCompliance: number;
  partialCompliance: number;
  noCompliance: number;
  mandatoryTrainingCount: number;
}

const categoryMap: Record<string, string> = {
  ISG: "İSG Genel",
  TECHNICAL: "Teknik",
  PROFESSIONAL: "Mesleki",
  ORIENTATION: "Oryantasyon",
};

/* ─── Page ─── */
export default function PersonelISGPage() {
  const [employees, setEmployees] = useState<EmployeeISG[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [collarFilter, setCollarFilter] = useState("all");
  const [complianceFilter, setComplianceFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeISG | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/isg/personel-durum");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
        setSummary(data.summary || null);
      }
    } catch {
      toast.error("Veri alınamadı");
    }
    setLoading(false);
  };

  const departments = useMemo(() => {
    const depts = new Set<string>();
    employees.forEach((e) => { if (e.department) depts.add(e.department); });
    return Array.from(depts).sort((a, b) => a.localeCompare(b, "tr"));
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      if (search) {
        const s = search.toLowerCase();
        if (!`${e.firstName} ${e.lastName} ${e.employeeNo || ""}`.toLowerCase().includes(s)) return false;
      }
      if (deptFilter !== "all" && e.department !== deptFilter) return false;
      if (collarFilter !== "all" && e.collarType !== collarFilter) return false;
      if (complianceFilter === "full" && e.complianceScore !== 100) return false;
      if (complianceFilter === "partial" && (e.complianceScore === 0 || e.complianceScore === 100)) return false;
      if (complianceFilter === "none" && e.complianceScore !== 0) return false;
      if (complianceFilter === "missing" && e.trainings.missingMandatory.length === 0) return false;
      return true;
    });
  }, [employees, search, deptFilter, collarFilter, complianceFilter]);

  // Filtre değişince ilk sayfaya dön
  useEffect(() => {
    setCurrentPage(1);
  }, [search, deptFilter, collarFilter, complianceFilter]);

  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  const openDetail = (emp: EmployeeISG) => {
    setSelectedEmployee(emp);
    setDetailDialogOpen(true);
  };

  const updateTrainingStatus = async (trainingRecordId: string, newStatus: string) => {
    setUpdatingId(trainingRecordId);
    try {
      const res = await fetch(`/api/isg/egitimler/${trainingRecordId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Durum güncellendi: ${statusLabel[newStatus] || newStatus}`);
        // Veriyi yeniden yükle ve dialog'u güncelle
        const dataRes = await fetch("/api/isg/personel-durum");
        if (dataRes.ok) {
          const data = await dataRes.json();
          setEmployees(data.employees || []);
          setSummary(data.summary || null);
          // Seçili personeli güncelle
          if (selectedEmployee) {
            const updated = (data.employees || []).find((e: EmployeeISG) => e.id === selectedEmployee.id);
            if (updated) setSelectedEmployee(updated);
          }
        }
      } else {
        toast.error("Durum güncellenemedi");
      }
    } catch {
      toast.error("Bir hata oluştu");
    }
    setUpdatingId(null);
  };

  /* Inline status select component */
  const StatusSelect = ({ training }: { training: TrainingItem }) => (
    <Select
      value={training.status || "PLANNED"}
      onValueChange={(v) => updateTrainingStatus(training.id, v)}
      disabled={updatingId === training.id}
    >
      <SelectTrigger className="h-7 w-[130px] text-xs">
        {updatingId === training.id
          ? <RefreshCw className="h-3 w-3 animate-spin" />
          : <SelectValue />
        }
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            <span className={`text-xs font-medium ${s.color} px-1.5 py-0.5 rounded`}>{s.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const getScoreColor = (score: number) => {
    if (score === 100) return "text-green-600";
    if (score >= 50) return "text-amber-600";
    return "text-red-600";
  };

  const getProgressColor = (score: number) => {
    if (score === 100) return "[&>div]:bg-green-500";
    if (score >= 50) return "[&>div]:bg-amber-500";
    return "[&>div]:bg-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />Personel İSG Durumu
        </h1>
        <p className="text-muted-foreground">Her personelin aldığı, alacağı eğitimler, KKD durumu ve zorunlu eksikler</p>
      </div>

      {/* İstatistikler */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100"><Users className="h-5 w-5 text-blue-600" /></div>
              <div><p className="text-2xl font-bold">{summary.totalEmployees}</p><p className="text-xs text-muted-foreground">Toplam Personel</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100"><ShieldCheck className="h-5 w-5 text-green-600" /></div>
              <div><p className="text-2xl font-bold">{summary.fullCompliance}</p><p className="text-xs text-muted-foreground">Tam Uyumlu</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100"><ShieldAlert className="h-5 w-5 text-amber-600" /></div>
              <div><p className="text-2xl font-bold">{summary.partialCompliance}</p><p className="text-xs text-muted-foreground">Kısmi Uyumlu</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100"><ShieldX className="h-5 w-5 text-red-600" /></div>
              <div><p className="text-2xl font-bold">{summary.noCompliance}</p><p className="text-xs text-muted-foreground">Uyumsuz</p></div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtreler */}
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Personel ara..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Departman" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Departmanlar</SelectItem>
            {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={collarFilter} onValueChange={setCollarFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Yaka Tipi" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Yakalar</SelectItem>
            <SelectItem value="BLUE">🔵 Mavi Yaka</SelectItem>
            <SelectItem value="WHITE">⚪ Beyaz Yaka</SelectItem>
          </SelectContent>
        </Select>
        <Select value={complianceFilter} onValueChange={setComplianceFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Uyum Durumu" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="full">✅ Tam Uyumlu</SelectItem>
            <SelectItem value="partial">⚠️ Kısmi Uyumlu</SelectItem>
            <SelectItem value="none">❌ Uyumsuz</SelectItem>
            <SelectItem value="missing">🔴 Eksik Eğitimi Var</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tablo */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /><span className="ml-2">Yükleniyor...</span></div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {employees.length === 0
                ? "Henüz personel İSG verisi bulunamadı. Önce eğitim tanımlayıp personele atayın."
                : "Filtrelere uygun personel bulunamadı."
              }
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Personel</TableHead>
                    <TableHead>Departman</TableHead>
                    <TableHead>Pozisyon</TableHead>
                    <TableHead className="text-center">Uyum</TableHead>
                    <TableHead className="text-center">
                      <span className="flex items-center gap-1 justify-center"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" />Tamamlanan</span>
                    </TableHead>
                    <TableHead className="text-center">
                      <span className="flex items-center gap-1 justify-center"><Clock className="h-3.5 w-3.5 text-amber-500" />Planlanan</span>
                    </TableHead>
                    <TableHead className="text-center">
                      <span className="flex items-center gap-1 justify-center"><XCircle className="h-3.5 w-3.5 text-red-500" />Eksik Zorunlu</span>
                    </TableHead>
                    <TableHead className="text-center">
                      <span className="flex items-center gap-1 justify-center"><AlertTriangle className="h-3.5 w-3.5 text-orange-500" />Süresi Dolan</span>
                    </TableHead>
                    <TableHead className="text-center">
                      <span className="flex items-center gap-1 justify-center"><HardHat className="h-3.5 w-3.5" />KKD</span>
                    </TableHead>
                    <TableHead className="w-14"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEmployees.map((emp) => (
                    <TableRow key={emp.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(emp)}>
                      <TableCell>
                        <div>
                          <span className="font-medium">{emp.firstName} {emp.lastName}</span>
                          {emp.employeeNo && <span className="text-xs text-muted-foreground ml-2">#{emp.employeeNo}</span>}
                          <div className="mt-0.5">
                            {emp.collarType === "BLUE" ? (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-300 text-blue-700 bg-blue-50">Mavi Yaka</Badge>
                            ) : emp.collarType === "WHITE" ? (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-gray-300 text-gray-600 bg-gray-50">Beyaz Yaka</Badge>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{emp.department || "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{emp.position || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center gap-1 min-w-[80px]">
                          <span className={`text-sm font-bold ${getScoreColor(emp.complianceScore)}`}>{emp.complianceScore}%</span>
                          <Progress value={emp.complianceScore} className={`h-1.5 w-16 ${getProgressColor(emp.complianceScore)}`} />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {emp.trainings.completed.length > 0 ? (
                          <Badge variant="secondary" className="bg-green-50 text-green-700">{emp.trainings.completed.length}</Badge>
                        ) : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {emp.trainings.planned.length > 0 ? (
                          <Badge variant="secondary" className="bg-amber-50 text-amber-700">{emp.trainings.planned.length}</Badge>
                        ) : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {emp.trainings.missingMandatory.length > 0 ? (
                          <Badge variant="destructive">{emp.trainings.missingMandatory.length}</Badge>
                        ) : <span className="text-green-600">✓</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {emp.trainings.expired.length > 0 ? (
                          <Badge variant="outline" className="border-orange-300 text-orange-700">{emp.trainings.expired.length}</Badge>
                        ) : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        {emp.ppe.active > 0 ? (
                          <div className="flex items-center justify-center gap-1">
                            <Badge variant="secondary">{emp.ppe.active}</Badge>
                            {emp.ppe.expired > 0 && <Badge variant="destructive" className="text-[10px] px-1">{emp.ppe.expired}⚠</Badge>}
                          </div>
                        ) : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDetail(emp); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && filteredEmployees.length > 0 && (
            <TablePagination
              totalItems={filteredEmployees.length}
              pageSize={pageSize}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel="personel"
            />
          )}
        </CardContent>
      </Card>

      {/* ═══════ Detay Dialog ═══════ */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedEmployee && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span>{selectedEmployee.firstName} {selectedEmployee.lastName}</span>
                  <Badge variant="outline">{selectedEmployee.department || "Departman Yok"}</Badge>
                  <span className={`text-sm font-bold ${getScoreColor(selectedEmployee.complianceScore)}`}>
                    %{selectedEmployee.complianceScore} Uyum
                  </span>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 pt-2">
                {/* Eksik Zorunlu Eğitimler */}
                {selectedEmployee.trainings.missingMandatory.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm flex items-center gap-2 mb-2 text-red-700">
                      <XCircle className="h-4 w-4" />Eksik Zorunlu Eğitimler ({selectedEmployee.trainings.missingMandatory.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedEmployee.trainings.missingMandatory.map((t) => (
                        <div key={t.id} className="flex items-center gap-2 p-2 rounded border border-red-200 bg-red-50">
                          <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                          <div>
                            <p className="text-sm font-medium">{t.name}</p>
                            <p className="text-xs text-muted-foreground">{categoryMap[t.category] || t.category}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Süresi Dolan Eğitimler */}
                {selectedEmployee.trainings.expired.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm flex items-center gap-2 mb-2 text-orange-700">
                      <AlertTriangle className="h-4 w-4" />Süresi Dolan Eğitimler ({selectedEmployee.trainings.expired.length})
                    </h3>
                    <div className="space-y-1">
                      {selectedEmployee.trainings.expired.map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-2 rounded border border-orange-200 bg-orange-50">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
                            <span className="text-sm">{t.name}</span>
                            {t.isMandatory && <Badge variant="destructive" className="text-[10px] px-1">Zorunlu</Badge>}
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusSelect training={t} />
                            <span className="text-xs text-muted-foreground">
                              {t.expiryDate ? new Date(t.expiryDate).toLocaleDateString("tr-TR") : "-"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Planlanan Eğitimler */}
                {selectedEmployee.trainings.planned.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm flex items-center gap-2 mb-2 text-amber-700">
                      <Clock className="h-4 w-4" />Planlanan Eğitimler ({selectedEmployee.trainings.planned.length})
                    </h3>
                    <div className="space-y-1">
                      {selectedEmployee.trainings.planned.map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-2 rounded border border-amber-200 bg-amber-50">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                            <span className="text-sm">{t.name}</span>
                            {t.isMandatory && <Badge className="bg-red-100 text-red-700 text-[10px] px-1">Zorunlu</Badge>}
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusSelect training={t} />
                            <span className="text-xs text-muted-foreground">
                              {t.date ? new Date(t.date).toLocaleDateString("tr-TR") : "-"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tamamlanan Eğitimler */}
                {selectedEmployee.trainings.completed.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm flex items-center gap-2 mb-2 text-green-700">
                      <CheckCircle2 className="h-4 w-4" />Tamamlanan Eğitimler ({selectedEmployee.trainings.completed.length})
                    </h3>
                    <div className="space-y-1">
                      {selectedEmployee.trainings.completed.map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-2 rounded border border-green-200 bg-green-50">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                            <span className="text-sm">{t.name}</span>
                            <Badge variant="outline" className="text-[10px]">{categoryMap[t.category] || t.category}</Badge>
                            {t.score != null && <span className="text-xs text-muted-foreground">Puan: {t.score}</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusSelect training={t} />
                            <div className="text-right">
                              <p className="text-xs">{t.date ? new Date(t.date).toLocaleDateString("tr-TR") : "-"}</p>
                              {t.expiryDate && (
                                <p className={`text-[10px] ${new Date(t.expiryDate) < new Date() ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                                  Son: {new Date(t.expiryDate).toLocaleDateString("tr-TR")}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Eğitim yok durumu */}
                {selectedEmployee.trainings.completed.length === 0 &&
                  selectedEmployee.trainings.planned.length === 0 &&
                  selectedEmployee.trainings.expired.length === 0 &&
                  selectedEmployee.trainings.missingMandatory.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Henüz eğitim kaydı bulunmuyor</p>
                  </div>
                )}

                {/* KKD Durumu */}
                <div>
                  <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
                    <HardHat className="h-4 w-4" />KKD Zimmet Durumu ({selectedEmployee.ppe.active})
                  </h3>
                  {selectedEmployee.ppe.items.length > 0 ? (
                    <div className="space-y-1">
                      {selectedEmployee.ppe.items.map((p, idx) => (
                        <div key={idx} className={`flex items-center justify-between p-2 rounded border ${p.isExpired ? "border-red-200 bg-red-50" : "border-gray-200"}`}>
                          <div className="flex items-center gap-2">
                            <HardHat className={`h-4 w-4 shrink-0 ${p.isExpired ? "text-red-500" : "text-gray-500"}`} />
                            <span className="text-sm">{p.name}</span>
                            {p.category && <Badge variant="outline" className="text-[10px]">{p.category}</Badge>}
                          </div>
                          <div className="text-right">
                            <p className="text-xs">{new Date(p.assignDate).toLocaleDateString("tr-TR")}</p>
                            {p.expiryDate && (
                              <p className={`text-[10px] ${p.isExpired ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                                {p.isExpired ? "⚠️ " : ""}Son: {new Date(p.expiryDate).toLocaleDateString("tr-TR")}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">Zimmetli KKD bulunmuyor</p>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
