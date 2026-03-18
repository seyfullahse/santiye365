"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Plus, Check, X, Search, CalendarDays, Filter, RotateCcw, Download,
  Clock, CheckCircle2, XCircle, AlertCircle, Calendar, ChevronDown,
  Users, ArrowUpDown, FileText, Eye
} from "lucide-react";
import { toast } from "sonner";

interface LeaveRequest {
  id: string;
  employeeId: string;
  type: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  status: string;
  createdAt: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNo: string | null;
    department: { name: string } | null;
  };
}
interface Employee {
  id: string;
  firstName: string;
  lastName: string;
}

const leaveTypeMap: Record<string, { label: string; color: string; bg: string }> = {
  ANNUAL:      { label: "Yıllık İzin", color: "text-cyan-700 dark:text-cyan-400",    bg: "bg-cyan-50 border-cyan-200 dark:bg-cyan-950 dark:border-cyan-800" },
  SICK:        { label: "Hastalık",     color: "text-purple-700 dark:text-purple-400", bg: "bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800" },
  MATERNITY:   { label: "Doğum",        color: "text-pink-700 dark:text-pink-400",     bg: "bg-pink-50 border-pink-200 dark:bg-pink-950 dark:border-pink-800" },
  PATERNITY:   { label: "Babalık",      color: "text-blue-700 dark:text-blue-400",     bg: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800" },
  MARRIAGE:    { label: "Evlilik",      color: "text-rose-700 dark:text-rose-400",     bg: "bg-rose-50 border-rose-200 dark:bg-rose-950 dark:border-rose-800" },
  BEREAVEMENT: { label: "Vefat",        color: "text-slate-700 dark:text-slate-400",   bg: "bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800" },
  UNPAID:      { label: "Ücretsiz",     color: "text-amber-700 dark:text-amber-400",   bg: "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800" },
  COMPENSATION:{ label: "Telafi",       color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800" },
  OTHER_LEAVE: { label: "Diğer",        color: "text-gray-700 dark:text-gray-400",     bg: "bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800" },
};

const statusMap: Record<string, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  PENDING:   { label: "Bekliyor",   icon: Clock,        color: "text-amber-700 dark:text-amber-400",   bg: "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800" },
  APPROVED:  { label: "Onaylandı",  icon: CheckCircle2, color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800" },
  REJECTED:  { label: "Reddedildi", icon: XCircle,      color: "text-red-700 dark:text-red-400",       bg: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800" },
  CANCELLED: { label: "İptal",      icon: AlertCircle,  color: "text-gray-600 dark:text-gray-400",     bg: "bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800" },
};

type SortField = "employee" | "type" | "startDate" | "totalDays" | "status" | "createdAt";
type SortDir = "asc" | "desc";

const fmtDate = (d: string) => new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
const fmtDateRange = (s: string, e: string) => {
  const sd = new Date(s), ed = new Date(e);
  if (sd.getMonth() === ed.getMonth() && sd.getFullYear() === ed.getFullYear()) {
    return `${sd.getDate()}–${ed.getDate()} ${sd.toLocaleDateString("tr-TR", { month: "short", year: "numeric" })}`;
  }
  return `${fmtDate(s)} – ${fmtDate(e)}`;
};

export default function IzinlerPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<LeaveRequest | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Sort
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Form
  const [form, setForm] = useState({ employeeId: "", type: "ANNUAL", startDate: "", endDate: "", totalDays: "1", reason: "" });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter && typeFilter !== "all") params.set("type", typeFilter);
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      if (dateFrom) params.set("startDate", dateFrom);
      if (dateTo) params.set("endDate", dateTo);

      const qs = params.toString();
      const [reqRes, empRes] = await Promise.all([
        fetch(`/api/ik/izinler${qs ? `?${qs}` : ""}`),
        fetch("/api/ik/personel?limit=500"),
      ]);
      const [reqData, empData] = await Promise.all([reqRes.json(), empRes.json()]);
      setRequests(Array.isArray(reqData) ? reqData : []);
      setEmployees(empData.employees || []);
    } catch {
      toast.error("Veriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, searchTerm, dateFrom, dateTo]);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), searchTerm ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchData, searchTerm]);

  // Auto-compute totalDays
  useEffect(() => {
    if (form.startDate && form.endDate) {
      const s = new Date(form.startDate), e = new Date(form.endDate);
      if (e >= s) {
        const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        setForm(prev => ({ ...prev, totalDays: String(diff) }));
      }
    }
  }, [form.startDate, form.endDate]);

  // Sorted and filtered
  const sorted = useMemo(() => {
    const arr = [...requests];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "employee": cmp = `${a.employee.firstName} ${a.employee.lastName}`.localeCompare(`${b.employee.firstName} ${b.employee.lastName}`, "tr"); break;
        case "type": cmp = (leaveTypeMap[a.type]?.label ?? a.type).localeCompare(leaveTypeMap[b.type]?.label ?? b.type, "tr"); break;
        case "startDate": cmp = new Date(a.startDate).getTime() - new Date(b.startDate).getTime(); break;
        case "totalDays": cmp = a.totalDays - b.totalDays; break;
        case "status": cmp = (statusMap[a.status]?.label ?? a.status).localeCompare(statusMap[b.status]?.label ?? b.status, "tr"); break;
        case "createdAt": cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [requests, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  // Stats
  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter(r => r.status === "PENDING").length;
    const approved = requests.filter(r => r.status === "APPROVED").length;
    const rejected = requests.filter(r => r.status === "REJECTED").length;
    const totalDays = requests.filter(r => r.status === "APPROVED").reduce((s, r) => s + r.totalDays, 0);
    return { total, pending, approved, rejected, totalDays };
  }, [requests]);

  const handleSave = async () => {
    if (!form.employeeId || !form.startDate || !form.endDate) {
      toast.error("Zorunlu alanları doldurun");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/ik/izinler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Kayıt başarısız"); return; }
      toast.success("İzin talebi oluşturuldu");
      setDialogOpen(false);
      setForm({ employeeId: "", type: "ANNUAL", startDate: "", endDate: "", totalDays: "1", reason: "" });
      fetchData();
    } catch { toast.error("Bir hata oluştu"); } finally { setSaving(false); }
  };

  const handleAction = async (id: string, status: string) => {
    const label = status === "APPROVED" ? "onaylamak" : "reddetmek";
    if (!confirm(`Bu izin talebini ${label} istediğinize emin misiniz?`)) return;
    try {
      const res = await fetch(`/api/ik/izinler/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { toast.error("İşlem başarısız"); return; }
      toast.success(status === "APPROVED" ? "İzin onaylandı" : "İzin reddedildi");
      fetchData();
    } catch { toast.error("Bir hata oluştu"); }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setTypeFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters = searchTerm || statusFilter !== "all" || typeFilter !== "all" || dateFrom || dateTo;

  const exportCSV = () => {
    const headers = ["Personel", "Sicil No", "Departman", "İzin Türü", "Başlangıç", "Bitiş", "Gün", "Durum", "Açıklama"];
    const rows = sorted.map(r => [
      `${r.employee.firstName} ${r.employee.lastName}`,
      r.employee.employeeNo || "-",
      r.employee.department?.name || "-",
      leaveTypeMap[r.type]?.label || r.type,
      fmtDate(r.startDate),
      fmtDate(r.endDate),
      String(r.totalDays),
      statusMap[r.status]?.label || r.status,
      r.reason || "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `izin-talepleri-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("CSV indirildi");
  };

  const setField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const SortHeader = ({ field, children, className = "" }: { field: SortField; children: React.ReactNode; className?: string }) => (
    <TableHead className={`cursor-pointer select-none hover:bg-muted/50 transition-colors ${className}`} onClick={() => toggleSort(field)}>
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`h-3 w-3 ${sortField === field ? "text-foreground" : "text-muted-foreground/50"}`} />
      </div>
    </TableHead>
  );

  return (
    <div className="p-4 lg:p-8 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">İzin Yönetimi</h1>
          <p className="text-sm text-muted-foreground mt-0.5">İzin talepleri ve onay süreci</p>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={exportCSV} disabled={requests.length === 0}>
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>CSV İndir</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" /> Yeni İzin Talebi
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" /> Yeni İzin Talebi
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Personel *</Label>
                  <Select value={form.employeeId} onValueChange={(v) => setField("employeeId", v)}>
                    <SelectTrigger><SelectValue placeholder="Personel seçiniz" /></SelectTrigger>
                    <SelectContent>
                      {employees.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>İzin Türü *</Label>
                  <Select value={form.type} onValueChange={(v) => setField("type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(leaveTypeMap).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Başlangıç *</Label><Input type="date" value={form.startDate} onChange={(e) => setField("startDate", e.target.value)} /></div>
                  <div><Label>Bitiş *</Label><Input type="date" value={form.endDate} onChange={(e) => setField("endDate", e.target.value)} /></div>
                </div>
                <div>
                  <Label>Gün Sayısı</Label>
                  <Input type="number" min="0.5" step="0.5" value={form.totalDays} onChange={(e) => setField("totalDays", e.target.value)} />
                </div>
                <div>
                  <Label>Açıklama</Label>
                  <Input value={form.reason} onChange={(e) => setField("reason", e.target.value)} placeholder="Opsiyonel" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                  <Button onClick={handleSave} disabled={saving || !form.employeeId || !form.startDate || !form.endDate}>
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Toplam", value: stats.total, icon: FileText, color: "text-foreground", bg: "bg-muted/50" },
          { label: "Bekleyen", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950" },
          { label: "Onaylanan", value: stats.approved, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950" },
          { label: "Reddedilen", value: stats.rejected, icon: XCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950" },
          { label: "Toplam Gün", value: stats.totalDays, icon: CalendarDays, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950" },
        ].map((s) => (
          <Card key={s.label} className={`${s.bg} border`}>
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                </div>
                <s.icon className={`h-5 w-5 ${s.color} opacity-60`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex flex-col gap-3">
            {/* Top row: Search + toggle */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Personel adı veya sicil no ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Button
                variant={filtersOpen ? "secondary" : "outline"}
                size="sm"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="gap-1.5"
              >
                <Filter className="h-3.5 w-3.5" />
                Filtreler
                {hasActiveFilters && <span className="ml-1 h-2 w-2 rounded-full bg-primary" />}
                <ChevronDown className={`h-3 w-3 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
                  <RotateCcw className="h-3.5 w-3.5" /> Temizle
                </Button>
              )}
            </div>

            {/* Expanded filters */}
            {filtersOpen && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Durum</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Tümü" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      {Object.entries(statusMap).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">İzin Türü</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Tümü" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      {Object.entries(leaveTypeMap).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Başlangıç</Label>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Bitiş</Label>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9" />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4.5 w-4.5" /> İzin Talepleri
              <Badge variant="secondary" className="ml-1 text-xs">{sorted.length}</Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
              <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              Yükleniyor...
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">İzin talebi bulunamadı</p>
              <p className="text-xs text-muted-foreground mt-1">
                {hasActiveFilters ? "Filtre kriterlerini değiştirmeyi deneyin" : "Yeni talep oluşturarak başlayın"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <SortHeader field="employee">Personel</SortHeader>
                    <TableHead className="hidden lg:table-cell">Departman</TableHead>
                    <SortHeader field="type">İzin Türü</SortHeader>
                    <SortHeader field="startDate">Tarih Aralığı</SortHeader>
                    <SortHeader field="totalDays" className="text-center">Gün</SortHeader>
                    <SortHeader field="status">Durum</SortHeader>
                    <SortHeader field="createdAt" className="hidden md:table-cell">Talep Tarihi</SortHeader>
                    <TableHead className="w-28 text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((r) => {
                    const st = statusMap[r.status];
                    const lt = leaveTypeMap[r.type];
                    const StIcon = st?.icon ?? Clock;
                    return (
                      <TableRow key={r.id} className="group">
                        <TableCell>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {r.employee.firstName} {r.employee.lastName}
                            </p>
                            {r.employee.employeeNo && (
                              <p className="text-[11px] text-muted-foreground">{r.employee.employeeNo}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {r.employee.department?.name || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[11px] font-medium ${lt?.color ?? ""} ${lt?.bg ?? ""}`}>
                            {lt?.label || r.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="whitespace-nowrap">{fmtDateRange(r.startDate, r.endDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-semibold text-sm">{r.totalDays}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`gap-1 text-[11px] ${st?.color ?? ""} ${st?.bg ?? ""}`}>
                            <StIcon className="h-3 w-3" />
                            {st?.label || r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {fmtDate(r.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => { setSelectedReq(r); setDetailOpen(true); }}
                                  >
                                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Detay</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            {r.status === "PENDING" && (
                              <>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleAction(r.id, "APPROVED")}>
                                        <Check className="h-4 w-4 text-emerald-600" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Onayla</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleAction(r.id, "REJECTED")}>
                                        <X className="h-4 w-4 text-red-600" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Reddet</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> İzin Talebi Detayı
            </DialogTitle>
          </DialogHeader>
          {selectedReq && (() => {
            const r = selectedReq;
            const st = statusMap[r.status];
            const lt = leaveTypeMap[r.type];
            const StIcon = st?.icon ?? Clock;
            return (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Personel</p>
                    <p className="font-medium">{r.employee.firstName} {r.employee.lastName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sicil No</p>
                    <p className="font-medium">{r.employee.employeeNo || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Departman</p>
                    <p className="font-medium">{r.employee.department?.name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">İzin Türü</p>
                    <Badge variant="outline" className={`mt-0.5 ${lt?.color ?? ""} ${lt?.bg ?? ""}`}>{lt?.label || r.type}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Başlangıç</p>
                    <p className="font-medium">{fmtDate(r.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bitiş</p>
                    <p className="font-medium">{fmtDate(r.endDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Toplam Gün</p>
                    <p className="font-bold text-lg">{r.totalDays}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Durum</p>
                    <Badge variant="outline" className={`gap-1 mt-0.5 ${st?.color ?? ""} ${st?.bg ?? ""}`}>
                      <StIcon className="h-3 w-3" /> {st?.label || r.status}
                    </Badge>
                  </div>
                </div>
                {r.reason && (
                  <div className="text-sm border-t pt-3">
                    <p className="text-xs text-muted-foreground mb-1">Açıklama</p>
                    <p className="text-sm">{r.reason}</p>
                  </div>
                )}
                <div className="text-xs text-muted-foreground border-t pt-3">
                  Talep Tarihi: {fmtDate(r.createdAt)}
                </div>
                {r.status === "PENDING" && (
                  <div className="flex gap-2 pt-2">
                    <Button className="flex-1 gap-1.5" onClick={() => { handleAction(r.id, "APPROVED"); setDetailOpen(false); }}>
                      <Check className="h-4 w-4" /> Onayla
                    </Button>
                    <Button variant="destructive" className="flex-1 gap-1.5" onClick={() => { handleAction(r.id, "REJECTED"); setDetailOpen(false); }}>
                      <X className="h-4 w-4" /> Reddet
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
