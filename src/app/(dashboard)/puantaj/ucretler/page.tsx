"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Banknote,
  Search,
  Loader2,
  Download,
  Building2,
  Users,
  AlertTriangle,
  Plus,
  History,
  ChevronDown,
  ChevronRight,
  Clock,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CompanyTypeSegment, PuantajPagination } from "../components";
import * as XLSX from "xlsx";

const MUHASEBE_ROLES = ["SUPER_ADMIN", "ADMIN", "MUHASEBE"];

type SalaryType = "MONTHLY" | "DAILY";

interface ActiveSalary {
  id: string;
  salaryType: SalaryType;
  amount: number;
  overtimeRate: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  note: string | null;
}

interface WorkerRow {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  dailyRate: number | null;
  overtimeRate: number | null;
  team: {
    id: string;
    name: string;
    company: { id: string; name: string; type: string };
  };
  salaries: ActiveSalary[];
}

interface SalaryHistoryRecord {
  id: string;
  salaryType: SalaryType;
  amount: number;
  overtimeRate: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  note: string | null;
  createdAt: string;
}

const SALARY_TYPE_LABELS: Record<SalaryType, string> = {
  MONTHLY: "Aylık Maaşlı",
  DAILY: "Günlük Yevmiyeli",
};

function formatCurrency(value: number): string {
  return value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatShortCurrency(value: number): string {
  if (value >= 1000) return `${(value / 1000).toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}K`;
  return formatCurrency(value);
}

function formatDateTR(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("tr-TR");
}

// ─── BRÜT / NET / MALİYET HESAPLAMA ─────────────────────
// 2025 Gelir Vergisi Dilimleri
const TAX_BRACKETS = [
  { limit: 158_000, rate: 0.15 },
  { limit: 330_000, rate: 0.20 },
  { limit: 800_000, rate: 0.27 },
  { limit: 4_300_000, rate: 0.35 },
  { limit: Infinity, rate: 0.40 },
];

// Çalışan kesintileri
const SGK_WORKER = 0.14;        // SGK işçi payı %14
const UNEMPLOYMENT_WORKER = 0.01; // İşsizlik sigortası %1
const STAMP_TAX_RATE = 0.00759;  // Damga vergisi %0.759

// İşveren ek maliyetleri
const SGK_EMPLOYER = 0.155;      // SGK işveren payı %20.5 - %5 hazine indirimi = %15.5
const UNEMPLOYMENT_EMPLOYER = 0.02; // İşveren işsizlik %2

interface SalaryBreakdown {
  net: number;
  gross: number;
  sgkWorker: number;
  unemploymentWorker: number;
  incomeTax: number;
  stampTax: number;
  totalWorkerDeductions: number;
  sgkEmployer: number;
  unemploymentEmployer: number;
  employerCost: number;
}

function calcFromGross(monthlyGross: number): SalaryBreakdown {
  const sgkWorker = monthlyGross * SGK_WORKER;
  const unemploymentWorker = monthlyGross * UNEMPLOYMENT_WORKER;
  const stampTax = monthlyGross * STAMP_TAX_RATE;
  const monthlyTaxBase = monthlyGross - sgkWorker - unemploymentWorker;
  const annualTaxBase = monthlyTaxBase * 12;
  let annualTax = 0, prev = 0;
  for (const b of TAX_BRACKETS) {
    const t = Math.min(annualTaxBase, b.limit) - prev;
    if (t <= 0) break;
    annualTax += t * b.rate;
    prev = b.limit;
  }
  const incomeTax = annualTax / 12;
  const totalWorkerDeductions = sgkWorker + unemploymentWorker + incomeTax + stampTax;
  const net = monthlyGross - totalWorkerDeductions;
  const sgkEmployer = monthlyGross * SGK_EMPLOYER;
  const unemploymentEmployer = monthlyGross * UNEMPLOYMENT_EMPLOYER;
  return {
    net: Math.round(net * 100) / 100,
    gross: Math.round(monthlyGross * 100) / 100,
    sgkWorker: Math.round(sgkWorker * 100) / 100,
    unemploymentWorker: Math.round(unemploymentWorker * 100) / 100,
    incomeTax: Math.round(incomeTax * 100) / 100,
    stampTax: Math.round(stampTax * 100) / 100,
    totalWorkerDeductions: Math.round(totalWorkerDeductions * 100) / 100,
    sgkEmployer: Math.round(sgkEmployer * 100) / 100,
    unemploymentEmployer: Math.round(unemploymentEmployer * 100) / 100,
    employerCost: Math.round((monthlyGross + sgkEmployer + unemploymentEmployer) * 100) / 100,
  };
}

function calcFromNet(netMonthly: number): SalaryBreakdown {
  let gross = netMonthly * 1.42;
  for (let i = 0; i < 50; i++) {
    const r = calcFromGross(gross);
    const diff = netMonthly - r.net;
    if (Math.abs(diff) < 0.01) break;
    gross += diff * 0.9;
  }
  return calcFromGross(gross);
}

export default function UcretlerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCompanyType, setFilterCompanyType] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogWorker, setDialogWorker] = useState<WorkerRow | null>(null);
  const [salaryType, setSalaryType] = useState<SalaryType>("MONTHLY");
  const [amount, setAmount] = useState("");
  const [overtimeRateInput, setOvertimeRateInput] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // History state
  const [historyWorkerId, setHistoryWorkerId] = useState<string | null>(null);
  const [historyRecords, setHistoryRecords] = useState<SalaryHistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const hasAccess = session?.user?.role && MUHASEBE_ROLES.includes(session.user.role);

  const fetchWorkers = useCallback(async () => {
    try {
      const res = await fetch("/api/puantaj/ucretler");
      if (res.status === 403) { router.push("/puantaj"); return; }
      if (!res.ok) throw new Error("Veri alınamadı");
      setWorkers(await res.json());
    } catch (error) {
      console.error("Ücretler yüklenemedi:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === "loading") return;
    if (!hasAccess) { router.push("/puantaj"); return; }
    fetchWorkers();
  }, [status, hasAccess, fetchWorkers, router]);

  // Firma listesi
  const companies = useMemo(() => {
    const map = new Map<string, { id: string; name: string; type: string }>();
    workers.forEach((w) => map.set(w.team.company.id, w.team.company));
    let list = Array.from(map.values());
    if (filterCompanyType !== "all") {
      list = list.filter((c) => c.type === filterCompanyType);
    }
    return list;
  }, [workers, filterCompanyType]);

  // Filtreleme
  const filtered = useMemo(() => {
    return workers.filter((w) => {
      if (search) {
        const q = search.toLowerCase();
        if (!`${w.firstName} ${w.lastName} ${w.role} ${w.team.name} ${w.team.company.name}`.toLowerCase().includes(q)) return false;
      }
      if (filterCompanyType !== "all" && w.team.company.type !== filterCompanyType) return false;
      if (companyFilter !== "all" && w.team.company.id !== companyFilter) return false;
      return true;
    });
  }, [workers, search, filterCompanyType, companyFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const s = (currentPage - 1) * pageSize;
    return filtered.slice(s, s + pageSize);
  }, [filtered, currentPage, pageSize]);

  // İstatistikler
  const statsWithSalary = workers.filter((w) => w.salaries.length > 0).length;
  const statsWithoutSalary = workers.length - statsWithSalary;
  const statsMonthly = workers.filter((w) => w.salaries[0]?.salaryType === "MONTHLY").length;
  const statsDaily = workers.filter((w) => w.salaries[0]?.salaryType === "DAILY").length;

  // Maaş geçmişi toggle
  const toggleHistory = async (workerId: string) => {
    if (expandedRows.has(workerId)) {
      setExpandedRows((prev) => { const n = new Set(prev); n.delete(workerId); return n; });
      return;
    }
    setHistoryLoading(true);
    setHistoryWorkerId(workerId);
    try {
      const res = await fetch(`/api/puantaj/ucretler?workerId=${workerId}`);
      if (res.ok) {
        setHistoryRecords(await res.json());
        setExpandedRows((prev) => new Set(prev).add(workerId));
      }
    } catch { /* ignore */ }
    finally { setHistoryLoading(false); setHistoryWorkerId(null); }
  };

  // Yeni maaş dialog aç
  const openSalaryDialog = (worker: WorkerRow) => {
    setDialogWorker(worker);
    // Yeni ücret her zaman boş başlar — mevcut bilgi read-only gösterilir
    setSalaryType(worker.team.company.type === "MAIN" ? "MONTHLY" : "DAILY");
    setAmount("");
    setOvertimeRateInput("");
    setEffectiveFrom(new Date().toISOString().slice(0, 10));
    setNote("");
    setDialogOpen(true);
  };

  // Dialog'daki mevcut maaş bilgisi (read-only gösterim için)
  const currentSalary = dialogWorker?.salaries[0] ?? null;

  // Otomatik günlük ücret ve mesai hesapla
  const computedDailyRate = salaryType === "MONTHLY" && amount
    ? (Number(amount) / 30)
    : salaryType === "DAILY" && amount ? Number(amount) : 0;
  const suggestedOvertimeRate = salaryType === "MONTHLY" && amount
    ? Math.round((Number(amount) / 225) * 1.5 * 100) / 100
    : 0;

  // Kaydet
  const handleSave = async () => {
    if (!dialogWorker || !amount || !effectiveFrom) { alert("Tutar ve geçerlilik başlangıcı zorunlu"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/puantaj/ucretler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId: dialogWorker.id,
          salaryType,
          amount: Number(amount),
          overtimeRate: Number(overtimeRateInput) || 0,
          effectiveFrom,
          note: note || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Kayıt başarısız");
        return;
      }
      setDialogOpen(false);
      setExpandedRows(new Set()); // collapse all
      await fetchWorkers();
    } catch {
      alert("Kayıt hatası");
    } finally {
      setSaving(false);
    }
  };

  // Silme
  const handleDeleteSalary = async (salaryId: string) => {
    if (!confirm("Bu maaş kaydı silinecek. Emin misiniz?")) return;
    try {
      const res = await fetch(`/api/puantaj/ucretler?id=${salaryId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Silme başarısız");
        return;
      }
      setExpandedRows(new Set());
      await fetchWorkers();
    } catch {
      alert("Silme hatası");
    }
  };

  // Excel
  const handleExport = () => {
    const data = filtered.map((w, i) => {
      const s = w.salaries[0];
      const bd = s && s.salaryType === "MONTHLY" ? calcFromNet(s.amount) : null;
      return {
        "#": i + 1,
        Firma: w.team.company.name,
        Ekip: w.team.name,
        "Ad Soyad": `${w.firstName} ${w.lastName}`,
        Görevi: w.role,
        "Ücret Tipi": s ? SALARY_TYPE_LABELS[s.salaryType] : "Belirlenmemiş",
        "Net Maaş (₺)": s ? s.amount : "",
        "Brüt Maaş (₺)": bd ? bd.gross : "",
        "İşveren Maliyeti (₺)": bd ? bd.employerCost : "",
        "Günlük Ücret (₺)": w.dailyRate ?? "",
        "Mesai Ücreti (₺/saat)": s ? s.overtimeRate : "",
        "SGK İşçi (₺)": bd ? bd.sgkWorker : "",
        "İşsizlik İşçi (₺)": bd ? bd.unemploymentWorker : "",
        "Gelir Vergisi (₺)": bd ? bd.incomeTax : "",
        "Damga Vergisi (₺)": bd ? bd.stampTax : "",
        "SGK İşveren (₺)": bd ? bd.sgkEmployer : "",
        "İşsizlik İşveren (₺)": bd ? bd.unemploymentEmployer : "",
        "Geçerlilik Başlangıcı": s ? formatDateTR(s.effectiveFrom) : "",
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ücretler");
    XLSX.writeFile(wb, "calisan-ucretleri.xlsx");
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-lg font-semibold">Erişim Yetkiniz Yok</h2>
        <p className="text-muted-foreground">Bu sayfa sadece muhasebe birimi tarafından görüntülenebilir.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Banknote className="h-5 w-5 text-emerald-600" />
            Çalışan Ücretleri
          </h2>
          <p className="text-sm text-muted-foreground">
            Maaş ve ücret geçmişi yönetimi — her değişiklik tarihsel kayıt olarak saklanır
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" /> Excel
        </Button>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniCard icon={<Users className="h-4 w-4" />} label="Toplam Çalışan" value={workers.length} />
        <MiniCard icon={<Banknote className="h-4 w-4 text-emerald-600" />} label="Ücreti Belirlenen" value={statsWithSalary} color="text-emerald-600" />
        <MiniCard icon={<AlertTriangle className="h-4 w-4 text-orange-500" />} label="Ücreti Belirlenmemiş" value={statsWithoutSalary} color="text-orange-500" />
        <MiniCard icon={<Building2 className="h-4 w-4 text-blue-600" />} label={`Maaşlı / Yevmiyeli`} value={`${statsMonthly} / ${statsDaily}`} color="text-blue-600" />
      </div>

      {/* Segment + Filtreler */}
      <CompanyTypeSegment value={filterCompanyType} onChange={(v) => { setFilterCompanyType(v); setCompanyFilter("all"); setCurrentPage(1); }} />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Çalışan, ekip veya firma ara..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="pl-9" />
        </div>
        <Select value={companyFilter} onValueChange={(v) => { setCompanyFilter(v); setCurrentPage(1); }}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Firma filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Firmalar</SelectItem>
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ücret Tablosu */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Firma</TableHead>
                  <TableHead>Ekip</TableHead>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>Görevi</TableHead>
                  <TableHead className="text-center">Ücret Tipi</TableHead>
                  <TableHead className="text-right">Net Maaş (₺)</TableHead>
                  <TableHead className="text-right">Brüt (₺)</TableHead>
                  <TableHead className="text-right">İşveren Maliyeti</TableHead>
                  <TableHead className="text-right">Mesai (₺/s)</TableHead>
                  <TableHead className="w-28"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-10 text-muted-foreground">
                      Çalışan bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((w, idx) => {
                    const s = w.salaries[0]; // aktif kayıt
                    const isExpanded = expandedRows.has(w.id);
                    const rowNum = (currentPage - 1) * pageSize + idx + 1;
                    return (
                      <SalaryRow
                        key={w.id}
                        worker={w}
                        salary={s}
                        rowNum={rowNum}
                        isExpanded={isExpanded}
                        isHistoryLoading={historyLoading && historyWorkerId === w.id}
                        historyRecords={isExpanded ? historyRecords : []}
                        onToggleHistory={() => toggleHistory(w.id)}
                        onAddSalary={() => openSalaryDialog(w)}
                        onDeleteSalary={handleDeleteSalary}
                      />
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <PuantajPagination
        totalItems={filtered.length}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      {/* Maaş Tanımla / Zam Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {currentSalary ? (
                <><Banknote className="h-5 w-5 text-emerald-600" /> Zam / Yeni Ücret Belirle</>
              ) : (
                <><Plus className="h-5 w-5" /> İlk Ücret Tanımla</>
              )}
            </DialogTitle>
          </DialogHeader>

          {dialogWorker && (
            <div className="space-y-4">
              {/* Çalışan bilgisi */}
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="font-medium">{dialogWorker.firstName} {dialogWorker.lastName}</p>
                <p className="text-sm text-muted-foreground">{dialogWorker.team.company.name} — {dialogWorker.team.name} — {dialogWorker.role}</p>
              </div>

              {/* Mevcut maaş bilgisi (read-only) */}
              {currentSalary && (
                <div className="border border-dashed border-orange-300 bg-orange-50/50 dark:bg-orange-950/10 rounded-lg p-3">
                  <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Mevcut Ücret (geçmişe taşınacak)
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Tip</span>
                      <span className="font-medium">{SALARY_TYPE_LABELS[currentSalary.salaryType]}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Tutar</span>
                      <span className="font-medium font-mono">{formatCurrency(currentSalary.amount)} ₺</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Mesai</span>
                      <span className="font-medium font-mono">{currentSalary.overtimeRate > 0 ? `${formatCurrency(currentSalary.overtimeRate)} ₺/s` : "-"}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {formatDateTR(currentSalary.effectiveFrom)} tarihinden beri geçerli
                  </p>
                </div>
              )}

              {/* Bilgilendirme */}
              {currentSalary && (
                <p className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-200 dark:border-blue-800 rounded-md px-3 py-2">
                  Yeni ücret kaydedildiğinde mevcut ücret otomatik olarak geçmişe taşınır. Geçmiş kayıtlar değiştirilemez ve puantaj hesaplamalarında kendi dönemine ait ücret kullanılır.
                </p>
              )}

              {/* Yeni ücret formu */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <Label>Yeni Ücret Tipi *</Label>
                  <Select value={salaryType} onValueChange={(v) => setSalaryType(v as SalaryType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONTHLY">Aylık Maaşlı</SelectItem>
                      <SelectItem value="DAILY">Günlük Yevmiyeli</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>{salaryType === "MONTHLY" ? "Yeni Net Maaş (₺) *" : "Yeni Günlük Ücret (₺) *"}</Label>
                  <Input type="number" step="0.01" min="0" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-right" />
                </div>

                <div className="space-y-1.5">
                  <Label>Geçerlilik Başlangıcı *</Label>
                  <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label>Yeni Mesai Ücreti (₺/saat)</Label>
                  <Input type="number" step="0.01" min="0" placeholder="0.00" value={overtimeRateInput} onChange={(e) => setOvertimeRateInput(e.target.value)} className="text-right" />
                  {salaryType === "MONTHLY" && suggestedOvertimeRate > 0 && (
                    <button type="button" className="text-[10px] text-blue-600 hover:underline" onClick={() => setOvertimeRateInput(String(suggestedOvertimeRate))}>
                      Önerilen: {formatCurrency(suggestedOvertimeRate)} ₺ (maaş/225×1.5)
                    </button>
                  )}
                </div>

                {amount && salaryType === "DAILY" && (
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground">Hesaplanan Günlük</Label>
                    <div className="h-9 flex items-center justify-end px-3 text-sm bg-muted/50 rounded-md font-medium">
                      {formatCurrency(computedDailyRate)} ₺
                    </div>
                  </div>
                )}

                {/* Brüt / Maliyet Hesaplama — sadece Aylık Maaşlı */}
                {amount && salaryType === "MONTHLY" && Number(amount) > 0 && (() => {
                  const bd = calcFromNet(Number(amount));
                  return (
                    <div className="col-span-2 border rounded-lg p-3 bg-gradient-to-r from-blue-50/50 to-red-50/50 dark:from-blue-950/10 dark:to-red-950/10 space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground">💰 Maaş Maliyet Hesaplaması</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-2 bg-background rounded-md border">
                          <span className="text-[10px] text-muted-foreground block">Net Maaş</span>
                          <span className="font-mono font-bold text-emerald-600">{formatCurrency(bd.net)} ₺</span>
                          <span className="text-[9px] text-muted-foreground block">Çalışan eline geçen</span>
                        </div>
                        <div className="text-center p-2 bg-background rounded-md border">
                          <span className="text-[10px] text-muted-foreground block">Brüt Maaş</span>
                          <span className="font-mono font-bold text-blue-600">{formatCurrency(bd.gross)} ₺</span>
                          <span className="text-[9px] text-muted-foreground block">Resmi brüt</span>
                        </div>
                        <div className="text-center p-2 bg-background rounded-md border border-red-200 dark:border-red-800">
                          <span className="text-[10px] text-muted-foreground block">İşveren Maliyeti</span>
                          <span className="font-mono font-bold text-red-600">{formatCurrency(bd.employerCost)} ₺</span>
                          <span className="text-[9px] text-muted-foreground block">Toplam maliyet</span>
                        </div>
                      </div>
                      <details className="text-[11px]">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium">Detaylı Hesaplama Göster</summary>
                        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
                          <span>SGK İşçi Payı (%14):</span>
                          <span className="text-right font-mono">{formatCurrency(bd.sgkWorker)} ₺</span>
                          <span>İşsizlik İşçi (%1):</span>
                          <span className="text-right font-mono">{formatCurrency(bd.unemploymentWorker)} ₺</span>
                          <span>Gelir Vergisi (dilimli):</span>
                          <span className="text-right font-mono">{formatCurrency(bd.incomeTax)} ₺</span>
                          <span>Damga Vergisi (%0.759):</span>
                          <span className="text-right font-mono">{formatCurrency(bd.stampTax)} ₺</span>
                          <span className="font-medium text-foreground">Toplam Çalışan Kesintisi:</span>
                          <span className="text-right font-mono font-medium text-foreground">{formatCurrency(bd.totalWorkerDeductions)} ₺</span>
                          <div className="col-span-2 border-t my-1"></div>
                          <span>SGK İşveren Payı (%15.5):</span>
                          <span className="text-right font-mono">{formatCurrency(bd.sgkEmployer)} ₺</span>
                          <span>İşsizlik İşveren (%2):</span>
                          <span className="text-right font-mono">{formatCurrency(bd.unemploymentEmployer)} ₺</span>
                          <span className="font-medium text-foreground">İşveren Ek Maliyet:</span>
                          <span className="text-right font-mono font-medium text-foreground">{formatCurrency(bd.sgkEmployer + bd.unemploymentEmployer)} ₺</span>
                        </div>
                      </details>
                    </div>
                  );
                })()}

                <div className="space-y-1.5 col-span-2">
                  <Label>Not</Label>
                  <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Zam, terfi, sözleşme yenileme vb." rows={2} />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button onClick={handleSave} disabled={saving || !amount || !effectiveFrom}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Banknote className="h-4 w-4 mr-1" />}
              {saving ? "Kaydediliyor..." : currentSalary ? "Zam Uygula" : "Ücret Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="text-xs text-muted-foreground text-center">
        Maaş değişiklikleri tarihsel kayıt olarak saklanır. Geçmiş kayıtlar değiştirilemez.
      </p>
    </div>
  );
}

// ─── Tablo Satırı ────────────────────────────────────
function SalaryRow({
  worker: w,
  salary: s,
  rowNum,
  isExpanded,
  isHistoryLoading,
  historyRecords,
  onToggleHistory,
  onAddSalary,
  onDeleteSalary,
}: {
  worker: WorkerRow;
  salary: ActiveSalary | undefined;
  rowNum: number;
  isExpanded: boolean;
  isHistoryLoading: boolean;
  historyRecords: SalaryHistoryRecord[];
  onToggleHistory: () => void;
  onAddSalary: () => void;
  onDeleteSalary: (id: string) => void;
}) {
  return (
    <>
      <TableRow className={!s ? "bg-orange-50/50 dark:bg-orange-950/10" : undefined}>
        <TableCell className="px-2">
          <button onClick={onToggleHistory} className="text-muted-foreground hover:text-foreground transition-colors" title="Maaş geçmişi">
            {isHistoryLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        </TableCell>
        <TableCell className="text-muted-foreground text-xs">{rowNum}</TableCell>
        <TableCell className="text-sm">{w.team.company.name}</TableCell>
        <TableCell>
          <Badge variant="outline" className="font-normal text-[11px]">{w.team.name}</Badge>
        </TableCell>
        <TableCell className="font-medium">{w.firstName} {w.lastName}</TableCell>
        <TableCell className="text-sm text-muted-foreground">{w.role}</TableCell>
        <TableCell className="text-center">
          {s ? (
            <Badge variant={s.salaryType === "MONTHLY" ? "default" : "secondary"} className="text-[10px]">
              {s.salaryType === "MONTHLY" ? "Maaşlı" : "Yevmiyeli"}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] text-orange-500 border-orange-300">Belirlenmemiş</Badge>
          )}
        </TableCell>
        <TableCell className="text-right">
          {s ? (
            <div>
              <span className="font-mono text-sm font-medium">{formatCurrency(s.amount)} ₺</span>
              {s.salaryType === "DAILY" && (
                <span className="text-[10px] text-muted-foreground block">günlük</span>
              )}
            </div>
          ) : "-"}
        </TableCell>
        <TableCell className="text-right">
          {s && s.salaryType === "MONTHLY" ? (
            <span className="font-mono text-sm text-blue-600 dark:text-blue-400">{formatShortCurrency(calcFromNet(s.amount).gross)} ₺</span>
          ) : <span className="text-muted-foreground">-</span>}
        </TableCell>
        <TableCell className="text-right">
          {s && s.salaryType === "MONTHLY" ? (
            <span className="font-mono text-sm text-red-600 dark:text-red-400 font-medium">{formatShortCurrency(calcFromNet(s.amount).employerCost)} ₺</span>
          ) : <span className="text-muted-foreground">-</span>}
        </TableCell>
        <TableCell className="text-right font-mono text-sm">
          {s && s.overtimeRate > 0 ? `${formatCurrency(s.overtimeRate)} ₺` : "-"}
        </TableCell>
        <TableCell>
          <Button variant="ghost" size="sm" onClick={onAddSalary} className="h-7 px-2 text-xs">
            {s ? (
              <><Banknote className="h-3 w-3 mr-1" /> Zam / Yeni Ücret</>
            ) : (
              <><Plus className="h-3 w-3 mr-1" /> Ücret Tanımla</>
            )}
          </Button>
        </TableCell>
      </TableRow>
      {/* Geçmiş Satırları */}
      {isExpanded && historyRecords.length > 0 && (
        <TableRow className="bg-muted/30">
          <TableCell colSpan={12} className="p-0">
            <div className="px-6 py-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <History className="h-3.5 w-3.5" />
                Maaş Geçmişi — {w.firstName} {w.lastName}
              </p>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-[11px] py-1.5">Tip</TableHead>
                      <TableHead className="text-[11px] py-1.5 text-right">Tutar (₺)</TableHead>
                      <TableHead className="text-[11px] py-1.5 text-right">Mesai (₺/s)</TableHead>
                      <TableHead className="text-[11px] py-1.5 text-center">Başlangıç</TableHead>
                      <TableHead className="text-[11px] py-1.5 text-center">Bitiş</TableHead>
                      <TableHead className="text-[11px] py-1.5">Not</TableHead>
                      <TableHead className="w-10 py-1.5"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyRecords.map((h) => (
                      <TableRow key={h.id} className={h.effectiveTo === null ? "bg-emerald-50/50 dark:bg-emerald-950/10" : ""}>
                        <TableCell className="text-[11px] py-1.5">
                          <Badge variant="outline" className="text-[9px]">
                            {h.salaryType === "MONTHLY" ? "Maaşlı" : "Yevmiyeli"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[11px] py-1.5 text-right font-mono">
                          {formatCurrency(h.amount)} ₺
                        </TableCell>
                        <TableCell className="text-[11px] py-1.5 text-right font-mono">
                          {h.overtimeRate > 0 ? `${formatCurrency(h.overtimeRate)} ₺` : "-"}
                        </TableCell>
                        <TableCell className="text-[11px] py-1.5 text-center">
                          {formatDateTR(h.effectiveFrom)}
                        </TableCell>
                        <TableCell className="text-[11px] py-1.5 text-center">
                          {h.effectiveTo ? formatDateTR(h.effectiveTo) : (
                            <Badge className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Aktif</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-[11px] py-1.5 text-muted-foreground max-w-[150px] truncate">
                          {h.note || "-"}
                        </TableCell>
                        <TableCell className="py-1.5">
                          {h.effectiveTo === null && (
                            <button onClick={() => onDeleteSalary(h.id)} className="text-red-500 hover:text-red-700" title="Aktif kaydı sil">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
      {isExpanded && historyRecords.length === 0 && !isHistoryLoading && (
        <TableRow className="bg-muted/30">
          <TableCell colSpan={12} className="text-center py-4 text-xs text-muted-foreground">
            Henüz maaş kaydı bulunmuyor
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ─── Mini Kart ────────────────────────────────────
function MiniCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color?: string }) {
  return (
    <Card className="py-0">
      <CardContent className="px-3 py-3">
        <div className="flex items-center gap-1.5 text-muted-foreground mb-1">{icon}<span className="text-[10px]">{label}</span></div>
        <p className={`text-xl font-bold ${color ?? ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
