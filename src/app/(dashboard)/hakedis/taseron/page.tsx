"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Trash2,
  Eye,
  FileText,
  ClipboardList,
  Package,
  TrendingUp,
  Wallet,
  Calculator,
  Search,
  Wrench,
  ChevronDown,
  ChevronRight,
  Download,
} from "lucide-react";
import { useSozlesme } from "../sozlesme-context";

/* ─── TYPES ─── */
interface Contract {
  id: string;
  name: string;
  contractNo: string | null;
  type: "ISVEREN" | "TASERON";
  totalAmount: number;
  project: { id: string; name: string };
  _count: { items: number };
}

interface Hakedis {
  id: string;
  no: number;
  period: string;
  startDate: string | null;
  endDate: string | null;
  currentAmount: number;
  previousAmount: number;
  totalAmount: number;
  netAmount: number;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "PAID";
  notes: string | null;
  project: { id: string; name: string };
  contract: { id: string; name: string; contractNo: string | null } | null;
  _count: { atasmanlar: number; ihzaratlar: number };
  createdAt: string;
}

interface KesifKalemi {
  id: string;
  anaGrup: string;
  altGrup: string;
  isKalemiGrubu: string;
  pozNo: string;
  description: string;
  unit: string;
  quantity: number;
  marka: string;
  sartname: string;
  malzemeFiyati: number;
  iscilikFiyati: number;
  ggkFiyati: number;
  toplamBirimFiyat: number;
}

interface AtasmanToplamKalem {
  kesifKalemiId: string;
  toplamMiktar: number;
}

interface YesilDefterRow {
  kesifKalemi: KesifKalemi;
  atasMiktar: number;
  malzemeTutar: number;
  iscilikTutar: number;
  ggkTutar: number;
  toplamTutar: number;
  yuzde: number;
}

const STATUS_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  DRAFT: { label: "Taslak", variant: "secondary" },
  SUBMITTED: { label: "Gönderildi", variant: "default" },
  APPROVED: { label: "Onaylandı", variant: "outline" },
  PAID: { label: "Ödendi", variant: "default" },
};

/* ─── helpers ─── */
const fmtNum = (n: number) =>
  new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(n);
const fmtMoney = (n: number, currency: string = "TRY") =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
const fmtCurrency = (n: number, currency: string = "TRY") =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
const currencySymbol: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€", GBP: "£" };

export default function TaseronHakedisPage() {
  const router = useRouter();
  const { contracts: allContracts, selectedContractId, selectedContract: ctxContract } = useSozlesme();
  const contracts = allContracts.filter((c) => c.type === "TASERON");
  const [hakedisler, setHakedisler] = useState<Hakedis[]>([]);
  const [loadingHakedis, setLoadingHakedis] = useState(false);

  // Yeşil defter verileri
  const [kesifKalemleri, setKesifKalemleri] = useState<KesifKalemi[]>([]);
  const [atasmanToplamlar, setAtasmanToplamlar] = useState<AtasmanToplamKalem[]>([]);
  const [loadingDefter, setLoadingDefter] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Yeni hakediş oluşturma dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [formPeriod, setFormPeriod] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Aktif sekme
  const [activeTab, setActiveTab] = useState<"hakedisler" | "yesilDefter">("yesilDefter");

  // Derived
  const effectiveContractId = ctxContract?.type === "TASERON" ? selectedContractId : "";
  const selectedContract = contracts.find((c) => c.id === effectiveContractId) ?? null;
  const currency = ctxContract?.currency || "TRY";
  const sym = currencySymbol[currency] || currency;
  const isDetailed = ctxContract?.pricingModel !== "TEKFIYAT";

  // ─── Fetch hakedişler ───
  const fetchHakedisler = useCallback(async (contractId: string) => {
    if (!contractId) { setHakedisler([]); return; }
    setLoadingHakedis(true);
    try {
      const res = await fetch(`/api/hakedis/hakedisler?contractId=${contractId}`);
      if (res.ok) {
        const data = await res.json();
        setHakedisler(Array.isArray(data) ? data : []);
      }
    } catch { toast.error("Hakedişler yüklenemedi"); }
    finally { setLoadingHakedis(false); }
  }, []);

  // ─── Fetch yeşil defter ───
  const fetchYesilDefter = useCallback(async (contractId: string) => {
    if (!contractId) return;
    setLoadingDefter(true);
    try {
      const [kesifRes, atasRes] = await Promise.all([
        fetch(`/api/hakedis/kesif?contractId=${contractId}`),
        fetch(`/api/hakedis/atasmanlar/toplamlar?contractId=${contractId}`),
      ]);
      setKesifKalemleri(await kesifRes.json());
      setAtasmanToplamlar(await atasRes.json());
    } catch { toast.error("Yeşil defter verileri yüklenemedi"); }
    finally { setLoadingDefter(false); }
  }, []);

  useEffect(() => {
    if (effectiveContractId) {
      fetchHakedisler(effectiveContractId);
      fetchYesilDefter(effectiveContractId);
    } else {
      setHakedisler([]);
      setKesifKalemleri([]);
      setAtasmanToplamlar([]);
    }
  }, [effectiveContractId, fetchHakedisler, fetchYesilDefter]);

  // ─── Yeşil Defter hesaplama ───
  const atasMap = atasmanToplamlar.reduce<Record<string, number>>((acc, t) => {
    acc[t.kesifKalemiId] = t.toplamMiktar;
    return acc;
  }, {});

  const yesilDefter: YesilDefterRow[] = kesifKalemleri.map((k) => {
    const atasMiktar = atasMap[k.id] || 0;
    return {
      kesifKalemi: k,
      atasMiktar,
      malzemeTutar: atasMiktar * k.malzemeFiyati,
      iscilikTutar: atasMiktar * k.iscilikFiyati,
      ggkTutar: atasMiktar * k.ggkFiyati,
      toplamTutar: atasMiktar * k.toplamBirimFiyat,
      yuzde: k.quantity > 0 ? (atasMiktar / k.quantity) * 100 : 0,
    };
  });

  const filtered = yesilDefter.filter((row) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      row.kesifKalemi.pozNo.toLowerCase().includes(s) ||
      row.kesifKalemi.description.toLowerCase().includes(s) ||
      row.kesifKalemi.anaGrup.toLowerCase().includes(s)
    );
  });

  const grouped = filtered.reduce<Record<string, YesilDefterRow[]>>((acc, row) => {
    const g = row.kesifKalemi.anaGrup || "DİĞER";
    if (!acc[g]) acc[g] = [];
    acc[g].push(row);
    return acc;
  }, {});

  const filteredWithAtas = filtered.filter((r) => r.atasMiktar > 0);
  const totalMalzeme = filteredWithAtas.reduce((s, r) => s + r.malzemeTutar, 0);
  const totalIscilik = filteredWithAtas.reduce((s, r) => s + r.iscilikTutar, 0);
  const totalGGK = filteredWithAtas.reduce((s, r) => s + r.ggkTutar, 0);
  const totalGenel = filteredWithAtas.reduce((s, r) => s + r.toplamTutar, 0);

  // Hakediş KPI
  const toplamHakedis = hakedisler.length > 0
    ? Math.max(...hakedisler.map((h) => h.totalAmount))
    : 0;
  const sonDonemTutar = hakedisler.length > 0
    ? hakedisler.reduce((max, h) => h.no > max.no ? h : max, hakedisler[0]).currentAmount
    : 0;
  const sozlesmeTutar = selectedContract?.totalAmount ?? 0;
  const kalanTutar = sozlesmeTutar - toplamHakedis;
  const ilerlemeYuzde = sozlesmeTutar > 0 ? (toplamHakedis / sozlesmeTutar) * 100 : 0;

  const toggleGroup = (g: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g); else next.add(g);
      return next;
    });
  };
  const expandAll = () => setExpandedGroups(new Set(Object.keys(grouped)));

  // ─── Yeni hakediş oluştur ───
  const handleCreate = async () => {
    if (!effectiveContractId) {
      toast.error("Lütfen sağ üstten bir Taşeron sözleşmesi seçin");
      return;
    }
    try {
      const res = await fetch("/api/hakedis/hakedisler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId: effectiveContractId,
          period: formPeriod || undefined,
          startDate: formStartDate || undefined,
          endDate: formEndDate || undefined,
          notes: formNotes || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Hakediş oluşturulamadı");
      }
      toast.success("Yeni hakediş oluşturuldu");
      setCreateOpen(false);
      resetForm();
      fetchHakedisler(effectiveContractId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Hakediş oluşturulamadı");
    }
  };

  // ─── Hakediş sil ───
  const handleDelete = async (id: string) => {
    if (!confirm("Bu hakedişi silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/hakedis/hakedisler/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Silinemedi");
      }
      toast.success("Hakediş silindi");
      fetchHakedisler(effectiveContractId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Hakediş silinemedi");
    }
  };

  const resetForm = () => {
    setFormPeriod("");
    setFormStartDate("");
    setFormEndDate("");
    setFormNotes("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-orange-600" />
            Taşeron Hakedişi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sözleşme seçin → Hakediş oluşturun → Ataşman / İhzarat ekleyin
          </p>
        </div>
        {effectiveContractId && (
          <Button variant="outline" size="sm" disabled>
            <Download className="h-4 w-4 mr-1" /> Excel İndir
          </Button>
        )}
      </div>

      {/* Sözleşme Seçilmemiş */}
      {!effectiveContractId ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="font-medium">Sözleşme seçili değil</p>
            <p className="text-sm mt-1">Sağ üstteki sözleşme seçiciden bir <strong>Taşeron</strong> sözleşmesi seçin</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Sözleşme Bilgi Çubuğu */}
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-orange-600" />
                  <strong>{selectedContract?.name}</strong>
                </div>
                {selectedContract && (
                  <>
                    <span className="text-muted-foreground">
                      Proje: <strong>{selectedContract.project.name}</strong>
                    </span>
                    <span className="text-muted-foreground">
                      Keşif: <strong>{selectedContract._count?.items ?? 0} kalem</strong>
                    </span>
                    <Badge variant="outline" className="text-xs font-mono">{currency}</Badge>
                    <span className="text-muted-foreground">
                      Hakedişler: <strong>{hakedisler.length}</strong>
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* KPI Kartları */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card>
              <CardContent className="py-2.5 px-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-md bg-blue-100 p-1.5"><FileText className="h-4 w-4 text-blue-600" /></div>
                  <div>
                    <p className="text-[11px] text-muted-foreground leading-none">Sözleşme Tutarı</p>
                    <p className="text-sm font-bold leading-tight mt-0.5">{fmtMoney(sozlesmeTutar, currency)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-2.5 px-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-md bg-orange-100 p-1.5"><TrendingUp className="h-4 w-4 text-orange-600" /></div>
                  <div>
                    <p className="text-[11px] text-muted-foreground leading-none">Toplam Hakediş <span className="text-[10px]">(%{ilerlemeYuzde.toFixed(1)})</span></p>
                    <p className="text-sm font-bold text-orange-600 leading-tight mt-0.5">{fmtMoney(toplamHakedis, currency)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-2.5 px-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-md bg-red-100 p-1.5"><Calculator className="h-4 w-4 text-red-600" /></div>
                  <div>
                    <p className="text-[11px] text-muted-foreground leading-none">Son Dönem <span className="text-[10px]">({hakedisler.length} hak.)</span></p>
                    <p className="text-sm font-bold text-red-600 leading-tight mt-0.5">{fmtMoney(sonDonemTutar, currency)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-2.5 px-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-md bg-purple-100 p-1.5"><Wallet className="h-4 w-4 text-purple-600" /></div>
                  <div>
                    <p className="text-[11px] text-muted-foreground leading-none">Kalan Tutar</p>
                    <p className="text-sm font-bold text-purple-600 leading-tight mt-0.5">{fmtMoney(kalanTutar, currency)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-2 border-b pb-0">
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "yesilDefter"
                  ? "border-orange-600 text-orange-700"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("yesilDefter")}
            >
              <Calculator className="h-4 w-4 inline mr-1.5" />
              İş Kalemleri & Hakediş
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "hakedisler"
                  ? "border-orange-600 text-orange-700"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab("hakedisler")}
            >
              <ClipboardList className="h-4 w-4 inline mr-1.5" />
              Hakediş Listesi
              <Badge variant="secondary" className="ml-1.5 text-[10px]">{hakedisler.length}</Badge>
            </button>
          </div>

          {/* ═══════════════════════════════════════════════ */}
          {/*  TAB 1: YEŞİL DEFTER TABLOSU                   */}
          {/* ═══════════════════════════════════════════════ */}
          {activeTab === "yesilDefter" && (
            <>
              {/* Fiyat alt toplamları */}
              {filteredWithAtas.length > 0 && (
                <div className={`grid grid-cols-2 ${isDetailed ? "lg:grid-cols-4" : "lg:grid-cols-2"} gap-3`}>
                  {isDetailed && (
                    <>
                      <Card>
                        <CardContent className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-blue-500" />
                            <div>
                              <p className="text-[11px] text-muted-foreground leading-none">Malzeme</p>
                              <p className="text-sm font-bold text-blue-600 leading-tight mt-0.5">{fmtMoney(totalMalzeme, currency)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            <Wrench className="h-4 w-4 text-orange-500" />
                            <div>
                              <p className="text-[11px] text-muted-foreground leading-none">İşçilik</p>
                              <p className="text-sm font-bold text-orange-600 leading-tight mt-0.5">{fmtMoney(totalIscilik, currency)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            <Calculator className="h-4 w-4 text-green-500" />
                            <div>
                              <p className="text-[11px] text-muted-foreground leading-none">GGK</p>
                              <p className="text-sm font-bold text-green-600 leading-tight mt-0.5">{fmtMoney(totalGGK, currency)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                  <Card className="bg-orange-50 dark:bg-orange-950/20">
                    <CardContent className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-orange-600" />
                        <div>
                          <p className="text-[11px] text-muted-foreground leading-none">Hakediş Toplamı <span className="text-[10px]">({filteredWithAtas.length} kalem)</span></p>
                          <p className="text-sm font-bold text-orange-700 leading-tight mt-0.5">{fmtMoney(totalGenel, currency)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Search + Expand controls */}
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="POZ No veya açıklama ara..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={expandAll}>Tümünü Aç</Button>
                <Button variant="ghost" size="sm" onClick={() => setExpandedGroups(new Set())}>Tümünü Kapat</Button>
              </div>

              {/* Tablo */}
              {loadingDefter ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">Yükleniyor...</CardContent></Card>
              ) : filtered.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Calculator className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">{selectedContractId ? "Keşif kalemi bulunamadı" : "Sözleşme seçin"}</p>
                    <p className="text-sm mt-1">Önce Keşif sayfasından iş kalemleri ekleyin</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="text-xs">
                            <TableHead className="min-w-[100px]">POZ No</TableHead>
                            <TableHead className="min-w-[200px]">İş Kalemi</TableHead>
                            <TableHead className="min-w-[60px]">Birim</TableHead>
                            <TableHead className="text-right min-w-[90px]">Söz. Miktar</TableHead>
                            <TableHead className="text-right min-w-[90px]">Ataş. Miktar</TableHead>
                            <TableHead className="text-right min-w-[60px]">%</TableHead>
                            <TableHead className="text-right min-w-[90px]">B. Fiyat {sym}</TableHead>
                            {isDetailed && (
                              <>
                                <TableHead className="text-right min-w-[100px]">Malzeme {sym}</TableHead>
                                <TableHead className="text-right min-w-[100px]">İşçilik {sym}</TableHead>
                                <TableHead className="text-right min-w-[100px]">GGK {sym}</TableHead>
                              </>
                            )}
                            <TableHead className="text-right min-w-[110px]">Toplam {sym}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(grouped).map(([groupName, rows]) => {
                            const isExpanded = expandedGroups.has(groupName);
                            const gMalzeme = rows.reduce((s, r) => s + r.malzemeTutar, 0);
                            const gIscilik = rows.reduce((s, r) => s + r.iscilikTutar, 0);
                            const gGGK = rows.reduce((s, r) => s + r.ggkTutar, 0);
                            const gTotal = rows.reduce((s, r) => s + r.toplamTutar, 0);
                            const gAtas = rows.filter((r) => r.atasMiktar > 0).length;

                            const colSpanBase = 7;

                            return (
                              <Fragment key={`g-${groupName}`}>
                                {/* Group Header */}
                                <TableRow
                                  className="bg-muted/50 cursor-pointer hover:bg-muted"
                                  onClick={() => toggleGroup(groupName)}
                                >
                                  <TableCell colSpan={colSpanBase} className="font-semibold text-sm">
                                    <span className="flex items-center gap-2">
                                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                      {groupName}
                                      <Badge variant="secondary" className="text-xs">{rows.length} kalem</Badge>
                                      {gAtas > 0 && (
                                        <Badge variant="outline" className="text-[10px] text-orange-600">{gAtas} ataşmanlı</Badge>
                                      )}
                                    </span>
                                  </TableCell>
                                  {isDetailed && (
                                    <>
                                      <TableCell className="text-right text-xs font-medium text-blue-600">{fmtMoney(gMalzeme, currency)}</TableCell>
                                      <TableCell className="text-right text-xs font-medium text-orange-600">{fmtMoney(gIscilik, currency)}</TableCell>
                                      <TableCell className="text-right text-xs font-medium text-green-600">{fmtMoney(gGGK, currency)}</TableCell>
                                    </>
                                  )}
                                  <TableCell className="text-right text-xs font-bold">{fmtMoney(gTotal, currency)}</TableCell>
                                </TableRow>

                                {/* Items */}
                                {isExpanded && rows.map((row, idx) => {
                                  const hasAtas = row.atasMiktar > 0;
                                  return (
                                    <TableRow
                                      key={`r-${row.kesifKalemi.id}-${idx}`}
                                      className={`text-xs ${!hasAtas ? "opacity-50" : ""}`}
                                    >
                                      <TableCell className="font-mono font-medium">{row.kesifKalemi.pozNo}</TableCell>
                                      <TableCell>
                                        <div className="max-w-[250px]">
                                          <div className="truncate">{row.kesifKalemi.description}</div>
                                          {row.kesifKalemi.altGrup && (
                                            <div className="text-[10px] text-muted-foreground truncate">{row.kesifKalemi.altGrup}</div>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell>{row.kesifKalemi.unit}</TableCell>
                                      <TableCell className="text-right text-muted-foreground">{fmtNum(row.kesifKalemi.quantity)}</TableCell>
                                      <TableCell className="text-right font-bold">
                                        {hasAtas ? fmtNum(row.atasMiktar) : "—"}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {hasAtas ? (
                                          <Badge
                                            variant={row.yuzde >= 100 ? "destructive" : row.yuzde >= 80 ? "default" : "secondary"}
                                            className="text-[10px]"
                                          >
                                            %{row.yuzde.toFixed(1)}
                                          </Badge>
                                        ) : (
                                          <span className="text-muted-foreground">—</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-right text-muted-foreground font-mono">
                                        {fmtCurrency(row.kesifKalemi.toplamBirimFiyat, currency)}
                                      </TableCell>
                                      {isDetailed && (
                                        <>
                                          <TableCell className="text-right text-blue-600">
                                            {hasAtas ? fmtMoney(row.malzemeTutar, currency) : "—"}
                                          </TableCell>
                                          <TableCell className="text-right text-orange-600">
                                            {hasAtas ? fmtMoney(row.iscilikTutar, currency) : "—"}
                                          </TableCell>
                                          <TableCell className="text-right text-green-600">
                                            {hasAtas ? fmtMoney(row.ggkTutar, currency) : "—"}
                                          </TableCell>
                                        </>
                                      )}
                                      <TableCell className="text-right font-bold">
                                        {hasAtas ? fmtMoney(row.toplamTutar, currency) : "—"}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </Fragment>
                            );
                          })}

                          {/* Grand Total */}
                          {filteredWithAtas.length > 0 && (
                            <TableRow className="bg-orange-50 dark:bg-orange-950/20 font-bold text-sm border-t-2">
                              <TableCell colSpan={7} className="text-right">
                                TAŞERON HAKEDİŞ TOPLAMI
                              </TableCell>
                              {isDetailed && (
                                <>
                                  <TableCell className="text-right text-blue-600">{fmtMoney(totalMalzeme, currency)}</TableCell>
                                  <TableCell className="text-right text-orange-600">{fmtMoney(totalIscilik, currency)}</TableCell>
                                  <TableCell className="text-right text-green-600">{fmtMoney(totalGGK, currency)}</TableCell>
                                </>
                              )}
                              <TableCell className="text-right text-lg text-orange-700">{fmtMoney(totalGenel, currency)}</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* ═══════════════════════════════════════════════ */}
          {/*  TAB 2: HAKEDİŞ LİSTESİ                        */}
          {/* ═══════════════════════════════════════════════ */}
          {activeTab === "hakedisler" && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Hakedişler</CardTitle>
                    <CardDescription>
                      {selectedContract?.name} sözleşmesine ait hakediş dönemleri
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={() => {
                      if (!selectedContract || (selectedContract._count?.items ?? 0) === 0) {
                        toast.error("Bu sözleşmede keşif kalemi yok. Önce Keşif sayfasından kalem ekleyin.");
                        return;
                      }
                      setCreateOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Yeni Hakediş
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingHakedis ? (
                  <div className="text-center py-10 text-muted-foreground">Yükleniyor…</div>
                ) : hakedisler.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    Henüz hakediş oluşturulmamış. &quot;Yeni Hakediş&quot; ile başlayın.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-24">Hakediş No</TableHead>
                          <TableHead>Dönem</TableHead>
                          <TableHead className="text-center">Ataşman</TableHead>
                          <TableHead className="text-center">İhzarat</TableHead>
                          <TableHead className="text-right">Önceki Toplam</TableHead>
                          <TableHead className="text-right">Bu Dönem</TableHead>
                          <TableHead className="text-right">Kümülatif</TableHead>
                          <TableHead className="text-center">Durum</TableHead>
                          <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {hakedisler.map((h) => {
                          const st = STATUS_LABELS[h.status];
                          return (
                            <TableRow key={h.id}>
                              <TableCell className="font-mono font-bold text-base">HAK-{h.no}</TableCell>
                              <TableCell>{h.period}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="gap-1">
                                  <ClipboardList className="h-3 w-3" />{h._count.atasmanlar}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="gap-1">
                                  <Package className="h-3 w-3" />{h._count.ihzaratlar}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {fmtCurrency(h.previousAmount, currency)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm font-semibold">
                                {fmtCurrency(h.currentAmount, currency)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {fmtCurrency(h.totalAmount, currency)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={st.variant}>{st.label}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => router.push(`/hakedis/taseron/${h.id}`)}
                                    title="Detay"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                  {h.status === "DRAFT" && (
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 text-red-500"
                                      onClick={() => handleDelete(h.id)}
                                      title="Sil"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
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
          )}
        </>
      )}

      {/* Yeni Hakediş Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) resetForm();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Yeni Taşeron Hakedişi Oluştur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="p-3 bg-muted rounded-lg text-sm">
              <strong>{selectedContract?.name}</strong>
              {selectedContract?.contractNo && (
                <span className="text-muted-foreground"> ({selectedContract.contractNo})</span>
              )}
              <br />
              <span className="text-muted-foreground">
                Bir sonraki hakediş numarası otomatik atanacaktır.
              </span>
            </div>
            <div>
              <Label>Dönem</Label>
              <Input
                placeholder="Örn: Haziran 2025"
                value={formPeriod}
                onChange={(e) => setFormPeriod(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Başlangıç Tarihi</Label>
                <Input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} />
              </div>
              <div>
                <Label>Bitiş Tarihi</Label>
                <Input type="date" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Notlar</Label>
              <Textarea rows={2} placeholder="Ek açıklama…" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
            </div>
            <Separator />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm(); }}>İptal</Button>
              <Button onClick={handleCreate}><Plus className="h-4 w-4 mr-1" /> Hakediş Oluştur</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
