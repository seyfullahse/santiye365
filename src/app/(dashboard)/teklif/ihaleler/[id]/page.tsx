"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  Search,
  Calculator,
  BarChart3,
  Building2,
  DollarSign,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Tipler ────────────────────────────────────────────────────────

interface TenderDetail {
  id: string;
  name: string;
  employer: string | null;
  location: string | null;
  status: string;
  type: string;
  currency: string;
  notes: string | null;
  dueDate: string | null;
  startDate: string | null;
  duration: number | null;
  versions: TenderVersion[];
  comparisons: TenderComparison[];
}

interface TenderVersion {
  id: string;
  versionNo: number;
  name: string | null;
  totalCost: number;
  markup: number;
  overhead: number;
  totalPrice: number;
  isActive: boolean;
}

interface TenderComparison {
  id: string;
  competitorName: string;
  totalPrice: number;
  currency: string;
  notes: string | null;
  rank: number | null;
}

interface TenderItem {
  id: string;
  groupCode: string | null;
  groupName: string | null;
  subGroupName: string | null;
  itemNumber: string | null;
  level: number;
  pozCode: string | null;
  description: string;
  detail: string | null;
  contractorNote: string | null;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  laborCost: number;
  materialCost: number;
  equipmentCost: number;
  importPercent: number;
  importAmount: number;
  localPercent: number;
  localAmount: number;
  sortOrder: number;
}

interface GroupTotal {
  code: string | null;
  total: number;
  itemCount: number;
}

interface Summary {
  totalItems: number;
  totalPrice: number;
  totalLabor: number;
  totalMaterial: number;
  totalEquipment: number;
  totalImport: number;
  totalLocal: number;
}

// ─── Yardımcılar ──────────────────────────────────────────────────

const statusLabels: Record<string, string> = {
  DRAFT: "Taslak",
  PREPARING: "Hazırlanıyor",
  SUBMITTED: "Teklif Verildi",
  WON: "Kazanıldı",
  LOST: "Kaybedildi",
  CANCELLED: "İptal",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PREPARING: "bg-blue-100 text-blue-700",
  SUBMITTED: "bg-amber-100 text-amber-700",
  WON: "bg-emerald-100 text-emerald-700",
  LOST: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

function fmt(val: number, currency = "USD"): string {
  const sym = currency === "TRY" ? "₺" : currency === "EUR" ? "€" : "$";
  if (val >= 1e6) return `${sym}${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e3) return `${sym}${(val / 1e3).toFixed(1)}K`;
  return `${sym}${val.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtFull(val: number, currency = "USD"): string {
  const sym = currency === "TRY" ? "₺" : currency === "EUR" ? "€" : "$";
  return `${sym}${val.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtNum(val: number): string {
  if (val === 0) return "-";
  return val.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Ana Bileşen ───────────────────────────────────────────────────

export default function IhaleDetayPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [tender, setTender] = useState<TenderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeVersionId, setActiveVersionId] = useState("");

  const [items, setItems] = useState<TenderItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [summary, setSummary] = useState<Summary>({
    totalItems: 0,
    totalPrice: 0,
    totalLabor: 0,
    totalMaterial: 0,
    totalEquipment: 0,
    totalImport: 0,
    totalLocal: 0,
  });
  const [groupTotals, setGroupTotals] = useState<GroupTotal[]>([]);
  const [search, setSearch] = useState("");
  const [activeGroupFilter, setActiveGroupFilter] = useState<string | null>(null);

  // Hiyerarşi açma/kapama
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Excel yükleme
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    inserted: number;
    totalCost: number;
    groups: { code: string; name: string; itemCount: number; total: number }[];
  } | null>(null);

  // Karlılık
  const [simMarkup, setSimMarkup] = useState(15);

  // ─── Veri Çekme ──────────────────────────────────────────────────

  const fetchTender = useCallback(async () => {
    try {
      const res = await fetch(`/api/teklif/ihaleler/${id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTender(data);
      const activeV = data.versions?.find((v: TenderVersion) => v.isActive) || data.versions?.[0];
      if (activeV) {
        setActiveVersionId(activeV.id);
        setSimMarkup(activeV.markup || 15);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchItems = useCallback(async () => {
    if (!activeVersionId) return;
    setItemsLoading(true);
    try {
      const q = new URLSearchParams({ limit: "5000" });
      if (search) q.set("search", search);
      if (activeGroupFilter) q.set("groupCode", activeGroupFilter);

      const res = await fetch(`/api/teklif/versiyon/${activeVersionId}/kalemler?${q}`);
      const data = await res.json();
      setItems(data.items || []);
      setSummary(
        data.summary || {
          totalItems: 0,
          totalPrice: 0,
          totalLabor: 0,
          totalMaterial: 0,
          totalEquipment: 0,
          totalImport: 0,
          totalLocal: 0,
        }
      );
      setGroupTotals(data.groupTotals || []);
    } catch {
      /* ignore */
    } finally {
      setItemsLoading(false);
    }
  }, [activeVersionId, search, activeGroupFilter]);

  useEffect(() => {
    fetchTender();
  }, [fetchTender]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ─── Excel Yükleme ──────────────────────────────────────────────

  const handleExcelUpload = async (file: File) => {
    if (!activeVersionId) return;
    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("versionId", activeVersionId);

      const res = await fetch("/api/teklif/excel-yukle", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Yükleme başarısız");

      setUploadResult(data);
      fetchItems();
      fetchTender();
    } catch {
      setUploadResult({
        success: false,
        inserted: 0,
        totalCost: 0,
        groups: [],
      });
    } finally {
      setUploading(false);
    }
  };

  // ─── Açma/Kapama ────────────────────────────────────────────────

  const toggleGroup = (code: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ─── Türetilmiş Değerler ────────────────────────────────────────

  const costTotal = summary.totalPrice || 0;
  const priceTotal = costTotal * (1 + simMarkup / 100);
  const profit = priceTotal - costTotal;

  const groups = items.filter((i) => i.level === 0);
  const dataItems = items.filter((i) => i.level === 2);

  // ─── Loading ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">İhale bulunamadı</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/teklif/ihaleler")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Geri Dön
        </Button>
      </div>
    );
  }

  const curr = tender.currency || "USD";

  // ─── Hiyerarşik Tablo Render ────────────────────────────────────

  function renderHierarchicalTable() {
    if (items.length === 0) {
      return (
        <div className="text-center py-16 space-y-4">
          <FileSpreadsheet className="h-16 w-16 mx-auto text-muted-foreground/30" />
          <div>
            <h3 className="text-lg font-semibold">Henüz keşif kalemi yok</h3>
            <p className="text-sm text-muted-foreground mt-1">
              İhale giyat Excel dosyasını yükleyerek otomatik keşif tablosu oluşturun
            </p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-2" /> Excel Yükle
          </Button>
        </div>
      );
    }

    let currentGroupCode: string | null = null;
    let currentSectionKey: string | null = null;
    const rows: React.ReactElement[] = [];

    for (const item of items) {
      // GRUP BAŞLIĞI (Level 0)
      if (item.level === 0) {
        currentGroupCode = item.groupCode;
        currentSectionKey = null;
        const isCollapsed = item.groupCode ? collapsedGroups.has(item.groupCode) : false;
        const gt = groupTotals.find((g) => g.code === item.groupCode);

        rows.push(
          <TableRow
            key={item.id}
            className="bg-slate-800 text-white hover:bg-slate-700 cursor-pointer"
            onClick={() => item.groupCode && toggleGroup(item.groupCode)}
          >
            <TableCell className="font-bold text-base" colSpan={2}>
              <div className="flex items-center gap-2">
                {isCollapsed ? (
                  <ChevronRight className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
                <span className="bg-white/20 px-2 py-0.5 rounded text-sm font-mono">
                  {item.groupCode}
                </span>
                {item.description}
              </div>
            </TableCell>
            <TableCell colSpan={5} />
            <TableCell className="text-right font-bold text-base" colSpan={3}>
              {gt ? fmtFull(gt.total, curr) : ""}
            </TableCell>
            <TableCell className="text-right text-xs text-white/70">
              {gt ? `${gt.itemCount} kalem` : ""}
            </TableCell>
          </TableRow>
        );
        continue;
      }

      // Grup kapalıysa alt satırları gösterme
      if (currentGroupCode && collapsedGroups.has(currentGroupCode)) {
        continue;
      }

      // BÖLÜM BAŞLIĞI (Level 1)
      if (item.level === 1) {
        currentSectionKey = `${currentGroupCode}-${item.itemNumber}`;
        const isSectionCollapsed = collapsedSections.has(currentSectionKey);

        rows.push(
          <TableRow
            key={item.id}
            className="bg-blue-50 hover:bg-blue-100 cursor-pointer border-t-2 border-blue-200"
            onClick={() => currentSectionKey && toggleSection(currentSectionKey)}
          >
            <TableCell className="font-semibold text-blue-900 pl-8" colSpan={2}>
              <div className="flex items-center gap-2">
                {isSectionCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-blue-600" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-blue-600" />
                )}
                <span className="font-mono text-blue-600">{item.itemNumber}</span>
                <span className="font-bold">{item.description}</span>
              </div>
            </TableCell>
            <TableCell colSpan={5} />
            <TableCell className="text-right font-semibold text-blue-800" colSpan={3}>
              {item.totalPrice > 0 ? fmtFull(item.totalPrice, curr) : ""}
            </TableCell>
            <TableCell />
          </TableRow>
        );
        continue;
      }

      // Bölüm kapalıysa kalemleri gösterme
      if (currentSectionKey && collapsedSections.has(currentSectionKey)) {
        continue;
      }

      // KALEM SATIRI (Level 2)
      rows.push(
        <TableRow key={item.id} className="hover:bg-accent/30 text-sm">
          <TableCell className="font-mono text-xs text-muted-foreground pl-12 w-16">
            {item.itemNumber}
          </TableCell>
          <TableCell className="font-mono text-xs w-24">{item.pozCode || "-"}</TableCell>
          <TableCell className="max-w-[300px]">
            <div className="truncate font-medium">{item.description}</div>
            {item.detail && (
              <div className="text-xs text-muted-foreground truncate mt-0.5">{item.detail}</div>
            )}
          </TableCell>
          <TableCell className="text-center w-16">{item.unit || "-"}</TableCell>
          <TableCell className="text-right w-20 font-mono">{fmtNum(item.quantity)}</TableCell>
          <TableCell className="text-right w-24 font-mono text-xs">{fmtNum(item.materialCost)}</TableCell>
          <TableCell className="text-right w-24 font-mono text-xs">{fmtNum(item.laborCost)}</TableCell>
          <TableCell className="text-right w-24 font-mono text-xs">{fmtNum(item.unitPrice)}</TableCell>
          <TableCell className="text-right w-28 font-mono font-semibold">
            {fmtFull(item.totalPrice, curr)}
          </TableCell>
          <TableCell className="text-right w-16 font-mono text-xs">
            {item.importPercent > 0 ? `%${item.importPercent.toFixed(0)}` : "-"}
          </TableCell>
          <TableCell className="text-right w-16 font-mono text-xs">
            {item.localPercent > 0 ? `%${item.localPercent.toFixed(0)}` : "-"}
          </TableCell>
        </TableRow>
      );
    }

    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-16 text-xs">Sıra No</TableHead>
                <TableHead className="w-24 text-xs">Poz No</TableHead>
                <TableHead className="text-xs">İşin Cinsi</TableHead>
                <TableHead className="text-center w-16 text-xs">Birim</TableHead>
                <TableHead className="text-right w-20 text-xs">Metraj</TableHead>
                <TableHead className="text-right w-24 text-xs">Malzeme BF</TableHead>
                <TableHead className="text-right w-24 text-xs">İşçilik BF</TableHead>
                <TableHead className="text-right w-24 text-xs">Toplam BF</TableHead>
                <TableHead className="text-right w-28 text-xs">Toplam Tutar</TableHead>
                <TableHead className="text-right w-16 text-xs">İthalat</TableHead>
                <TableHead className="text-right w-16 text-xs">Yerel</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows}
              {dataItems.length > 0 && (
                <TableRow className="bg-slate-900 text-white font-bold text-base">
                  <TableCell colSpan={8} className="text-right">
                    GENEL TOPLAM
                  </TableCell>
                  <TableCell className="text-right">{fmtFull(costTotal, curr)}</TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // ─── İcmal Tablosu ──────────────────────────────────────────────

  function renderIcmal() {
    if (groups.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Layers className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>İcmal verisi yok. Önce Excel yükleyin.</p>
        </div>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" /> İcmal Tablosu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-16">Kod</TableHead>
                <TableHead>Grup Adı</TableHead>
                <TableHead className="text-right w-24">Kalem</TableHead>
                <TableHead className="text-right w-40">Toplam Tutar</TableHead>
                <TableHead className="text-right w-20">Oran</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((g) => {
                const gt = groupTotals.find((t) => t.code === g.groupCode);
                const total = gt?.total || 0;
                const pct = costTotal > 0 ? (total / costTotal) * 100 : 0;
                return (
                  <TableRow key={g.id} className="hover:bg-accent/30">
                    <TableCell>
                      <Badge variant="outline" className="font-mono font-bold text-sm">
                        {g.groupCode}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{g.description}</TableCell>
                    <TableCell className="text-right font-mono">{gt?.itemCount || 0}</TableCell>
                    <TableCell className="text-right font-bold font-mono">
                      {fmtFull(total, curr)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono">%{pct.toFixed(1)}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="bg-slate-900 text-white font-bold">
                <TableCell colSpan={2}>GENEL TOPLAM</TableCell>
                <TableCell className="text-right font-mono">{dataItems.length}</TableCell>
                <TableCell className="text-right font-mono text-base">
                  {fmtFull(costTotal, curr)}
                </TableCell>
                <TableCell className="text-right">%100</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  // ─── JSX ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Button variant="ghost" size="sm" onClick={() => router.push("/teklif/ihaleler")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">{tender.name}</h1>
            <Badge className={statusColors[tender.status]}>
              {statusLabels[tender.status]}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground ml-10">
            {tender.employer && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" /> {tender.employer}
              </span>
            )}
            {tender.currency && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" /> {tender.currency}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            onClick={() => setUploadOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" /> Excel Yükle
          </Button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Toplam Maliyet</p>
            <p className="text-xl font-bold mt-1">{fmt(costTotal, curr)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Teklif (%{simMarkup})</p>
            <p className="text-xl font-bold text-blue-600 mt-1">{fmt(priceTotal, curr)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Brüt Kar</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">{fmt(profit, curr)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Gruplar</p>
            <p className="text-xl font-bold mt-1">{groups.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Toplam Kalem</p>
            <p className="text-xl font-bold mt-1">{dataItems.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* VERSİYON SEÇİCİ */}
      {tender.versions.length > 1 && (
        <div className="flex items-center gap-2">
          <Label className="text-sm">Revizyon:</Label>
          <Select value={activeVersionId} onValueChange={setActiveVersionId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tender.versions.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  Rev.{v.versionNo} {v.name || ""} {v.isActive ? "(Aktif)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* TABS */}
      <Tabs defaultValue="kesif" className="space-y-4">
        <TabsList>
          <TabsTrigger value="icmal" className="gap-1.5">
            <Layers className="h-4 w-4" /> İcmal
          </TabsTrigger>
          <TabsTrigger value="kesif" className="gap-1.5">
            <FileSpreadsheet className="h-4 w-4" /> Keşif Detayı
          </TabsTrigger>
          <TabsTrigger value="karlilik" className="gap-1.5">
            <Calculator className="h-4 w-4" /> Karlılık
          </TabsTrigger>
          <TabsTrigger value="mukayese" className="gap-1.5">
            <BarChart3 className="h-4 w-4" /> Mukayese
          </TabsTrigger>
        </TabsList>

        {/* İCMAL */}
        <TabsContent value="icmal">{renderIcmal()}</TabsContent>

        {/* KESİF DETAYI */}
        <TabsContent value="kesif" className="space-y-4">
          {items.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Kalem, poz no veya açıklama ara..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {groups.length > 0 && (
                <div className="flex gap-1">
                  <Button
                    variant={activeGroupFilter === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveGroupFilter(null)}
                  >
                    Tümü
                  </Button>
                  {groups.map((g) => (
                    <Button
                      key={g.groupCode}
                      variant={activeGroupFilter === g.groupCode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveGroupFilter(g.groupCode)}
                    >
                      {g.groupCode}
                    </Button>
                  ))}
                </div>
              )}
              <div className="flex gap-1 ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const allCodes = groups.map((g) => g.groupCode).filter(Boolean) as string[];
                    setCollapsedGroups(new Set(allCodes));
                  }}
                >
                  Tümünü Kapat
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCollapsedGroups(new Set());
                    setCollapsedSections(new Set());
                  }}
                >
                  Tümünü Aç
                </Button>
              </div>
            </div>
          )}

          {itemsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            renderHierarchicalTable()
          )}
        </TabsContent>

        {/* KARLILIK SİMÜLASYONU */}
        <TabsContent value="karlilik" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" /> Kar Oranı Simülasyonu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Kar Oranı (%)</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <input
                      type="range"
                      min={0}
                      max={50}
                      step={0.5}
                      value={simMarkup}
                      onChange={(e) => setSimMarkup(parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={simMarkup}
                      onChange={(e) => setSimMarkup(parseFloat(e.target.value) || 0)}
                      className="w-20"
                      step={0.5}
                    />
                  </div>
                </div>
                <div className="space-y-2 pt-4 border-t">
                  {[5, 10, 15, 20, 25, 30].map((m) => {
                    const price = costTotal * (1 + m / 100);
                    const pr = price - costTotal;
                    return (
                      <button
                        key={m}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-sm hover:bg-accent/50 transition-colors ${
                          simMarkup === m ? "bg-accent" : ""
                        }`}
                        onClick={() => setSimMarkup(m)}
                      >
                        <span>%{m} kar</span>
                        <span className="flex gap-4">
                          <span className="text-muted-foreground">{fmt(price, curr)}</span>
                          <span className="font-semibold text-emerald-600">+{fmt(pr, curr)}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" /> Özet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-accent/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">Toplam Maliyet</span>
                    <span className="text-lg font-bold">{fmtFull(costTotal, curr)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm text-blue-600">Teklif Fiyatı (%{simMarkup})</span>
                    <span className="text-lg font-bold text-blue-600">
                      {fmtFull(priceTotal, curr)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                    <span className="text-sm text-emerald-600">Brüt Kar</span>
                    <span className="text-lg font-bold text-emerald-600">
                      {fmtFull(profit, curr)}
                    </span>
                  </div>

                  {groupTotals.length > 0 && (
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-semibold mb-2">Grup Kırılımı</h4>
                      <div className="space-y-1.5">
                        {groupTotals.map((gt, i) => {
                          const pct = costTotal > 0 ? (gt.total / costTotal) * 100 : 0;
                          const grp = groups.find((g) => g.groupCode === gt.code);
                          return (
                            <div key={i} className="flex items-center gap-2">
                              <div className="flex-1">
                                <div className="flex justify-between text-xs mb-0.5">
                                  <span>
                                    <Badge variant="outline" className="mr-1 text-[10px]">
                                      {gt.code}
                                    </Badge>
                                    {grp?.description || gt.code}
                                  </span>
                                  <span>
                                    {fmtFull(gt.total, curr)} (%{pct.toFixed(1)})
                                  </span>
                                </div>
                                <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* MUKAYESE */}
        <TabsContent value="mukayese" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> Rakip Mukayesesi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tender.comparisons.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Henüz mukayese verisi yok
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-600">BİZ</Badge>
                      <span className="font-medium">Bizim Teklif</span>
                    </div>
                    <span className="text-lg font-bold">{fmtFull(priceTotal, curr)}</span>
                  </div>
                  {tender.comparisons.map((c) => {
                    const diff = ((c.totalPrice - priceTotal) / priceTotal) * 100;
                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-3 bg-accent/30 rounded-lg"
                      >
                        <div>
                          <span className="font-medium">{c.competitorName}</span>
                          {c.notes && (
                            <p className="text-xs text-muted-foreground">{c.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{fmtFull(c.totalPrice, curr)}</p>
                          <p
                            className={`text-xs ${diff > 0 ? "text-emerald-600" : "text-red-600"}`}
                          >
                            {diff > 0 ? "+" : ""}
                            {diff.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Excel Yükleme Dialog */}
      <Dialog
        open={uploadOpen}
        onOpenChange={(open) => {
          if (!uploading) {
            setUploadOpen(open);
            if (!open) setUploadResult(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <FileSpreadsheet className="h-4 w-4 text-white" />
              </div>
              İhale Giyat Excel Yükle
            </DialogTitle>
          </DialogHeader>

          {!uploading && !uploadResult && (
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                İhale giyat teklifi Excel dosyasını (.xlsx, .xls) yükleyin. Sistem dosyayı
                otomatik olarak analiz ederek İcmal ve Keşif tablosuna dönüştürecektir.
              </p>

              <div
                className="border-2 border-dashed border-emerald-300 rounded-xl p-8 text-center hover:bg-emerald-50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleExcelUpload(f);
                }}
              >
                <Upload className="h-10 w-10 mx-auto text-emerald-500 mb-3" />
                <p className="font-medium">Dosyayı sürükleyip bırakın</p>
                <p className="text-xs text-muted-foreground mt-1">
                  veya tıklayarak seçin (.xlsx, .xls)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleExcelUpload(f);
                  }}
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                <strong>Dikkat:</strong> Yeni dosya yüklendiğinde mevcut keşif kalemleri silinir
                ve yenileriyle değiştirilir.
              </div>
            </div>
          )}

          {uploading && (
            <div className="py-12 text-center space-y-4">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-emerald-600" />
              <div>
                <h3 className="text-lg font-semibold">Excel İşleniyor...</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Sayfalar okunuyor, kalemler tabloya aktarılıyor
                </p>
              </div>
            </div>
          )}

          {uploadResult && (
            <div className="py-6 space-y-4">
              {uploadResult.inserted > 0 ? (
                <>
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                      <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-semibold">Excel Başarıyla Yüklendi!</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-emerald-600">
                          {uploadResult.inserted}
                        </p>
                        <p className="text-xs text-muted-foreground">Toplam Satır</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {fmtFull(uploadResult.totalCost, curr)}
                        </p>
                        <p className="text-xs text-muted-foreground">Toplam Maliyet</p>
                      </CardContent>
                    </Card>
                  </div>

                  {uploadResult.groups && uploadResult.groups.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-semibold">Gruplar:</h4>
                      {uploadResult.groups.map((g, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-sm p-2 bg-accent/30 rounded"
                        >
                          <span>
                            <Badge variant="outline" className="mr-2 font-mono">
                              {g.code}
                            </Badge>
                            {g.name}
                          </span>
                          <span className="font-mono font-medium">
                            {g.itemCount} kalem · {fmtFull(g.total, curr)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <X className="h-8 w-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-red-700">Yükleme Başarısız</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Excel dosyası işlenemedi. Lütfen dosyanın formatını kontrol edin.
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => {
                    setUploadOpen(false);
                    setUploadResult(null);
                  }}
                >
                  Tamam
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
