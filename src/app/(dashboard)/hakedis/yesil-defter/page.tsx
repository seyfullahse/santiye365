"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Calculator, Search, Package, Wrench, FileSpreadsheet,
  ChevronDown, ChevronRight, Download,
} from "lucide-react";
import { useSozlesme } from "../sozlesme-context";

/* ─── TYPES ─── */
interface KesifKalemi {
  id: string;
  anaGrup: string;
  altGrup: string;
  isKalemiGrubu: string;
  pozNo: string;
  description: string;
  unit: string;
  quantity: number;  // Sözleşme miktarı
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

/* ─── helpers ─── */
const fmtNum = (n: number) => new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(n);
const fmtMoney = (n: number, currency: string = "TRY") => new Intl.NumberFormat("tr-TR", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
const currencySymbol: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€", GBP: "£" };

/* ─── Yeşil Defter satırı ─── */
interface YesilDefterRow {
  kesifKalemi: KesifKalemi;
  atasMiktar: number;           // Ataşmanlardan gelen toplam miktar
  malzemeTutar: number;         // atasMiktar × malzemeFiyati
  iscilikTutar: number;         // atasMiktar × iscilikFiyati
  ggkTutar: number;             // atasMiktar × ggkFiyati
  toplamTutar: number;          // atasMiktar × toplamBirimFiyat
  yuzde: number;                // (atasMiktar / sözleşme miktar) × 100
}

/* ========================================================= */
export default function YesilDefterPage() {
  const { selectedContractId, selectedContract: ctxContract } = useSozlesme();
  const currency = ctxContract?.currency || "TRY";
  const sym = currencySymbol[currency] || currency;
  const isDetailed = ctxContract?.pricingModel !== "TEKFIYAT";
  const [kesifKalemleri, setKesifKalemleri] = useState<KesifKalemi[]>([]);
  const [atasmanToplamlar, setAtasmanToplamlar] = useState<AtasmanToplamKalem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  /* ─── fetch data ─── */
  const loadData = useCallback(async (contractId: string) => {
    if (!contractId) return;
    setLoading(true);
    try {
      const [kesifRes, atasRes] = await Promise.all([
        fetch(`/api/hakedis/kesif?contractId=${contractId}`),
        fetch(`/api/hakedis/atasmanlar/toplamlar?contractId=${contractId}`),
      ]);
      setKesifKalemleri(await kesifRes.json());
      setAtasmanToplamlar(await atasRes.json());
    } catch {
      toast.error("Veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedContractId) loadData(selectedContractId);
    else { setKesifKalemleri([]); setAtasmanToplamlar([]); }
  }, [selectedContractId, loadData]);

  /* ─── Yeşil Defter hesaplama ─── */
  const atasMap = atasmanToplamlar.reduce<Record<string, number>>((acc, t) => {
    acc[t.kesifKalemiId] = t.toplamMiktar;
    return acc;
  }, {});

  const yesilDefter: YesilDefterRow[] = kesifKalemleri
    .filter((k) => atasMap[k.id] && atasMap[k.id] > 0)
    .map((k) => {
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

  /* ─── filter ─── */
  const filtered = yesilDefter.filter((row) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      row.kesifKalemi.pozNo.toLowerCase().includes(s) ||
      row.kesifKalemi.description.toLowerCase().includes(s) ||
      row.kesifKalemi.anaGrup.toLowerCase().includes(s)
    );
  });

  /* ─── group by anaGrup ─── */
  const grouped = filtered.reduce<Record<string, YesilDefterRow[]>>((acc, row) => {
    const g = row.kesifKalemi.anaGrup || "DİĞER";
    if (!acc[g]) acc[g] = [];
    acc[g].push(row);
    return acc;
  }, {});

  /* ─── totals ─── */
  const totalMalzeme = filtered.reduce((s, r) => s + r.malzemeTutar, 0);
  const totalIscilik = filtered.reduce((s, r) => s + r.iscilikTutar, 0);
  const totalGGK = filtered.reduce((s, r) => s + r.ggkTutar, 0);
  const totalGenel = filtered.reduce((s, r) => s + r.toplamTutar, 0);

  const toggleGroup = (g: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g); else next.add(g);
      return next;
    });
  };

  const expandAll = () => setExpandedGroups(new Set(Object.keys(grouped)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-7 w-7 text-emerald-600" />
            Yeşil Defter
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Keşif + Ataşman toplamları — otomatik hesaplanan hakediş özeti
          </p>
        </div>
        <Button variant="outline" size="sm" disabled>
          <Download className="h-4 w-4 mr-1" /> Excel İndir
        </Button>
      </div>

      {/* Sözleşme Bilgisi + KPI */}
      {!selectedContractId ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            <Calculator className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="font-medium">Sözleşme seçili değil</p>
            <p className="text-sm mt-1">Sağ üstteki sözleşme seçiciden bir sözleşme seçin</p>
          </CardContent>
        </Card>
      ) : (
      <div className={`grid grid-cols-1 ${isDetailed ? "lg:grid-cols-4" : "lg:grid-cols-2"} gap-4`}>

        {isDetailed && (
        <>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Package className="h-3.5 w-3.5" /> Malzeme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-blue-600">{fmtMoney(totalMalzeme, currency)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Wrench className="h-3.5 w-3.5" /> İşçilik
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-orange-600">{fmtMoney(totalIscilik, currency)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Calculator className="h-3.5 w-3.5" /> GGK
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-green-600">{fmtMoney(totalGGK, currency)}</p>
          </CardContent>
        </Card>
        </>
        )}

        <Card className="bg-emerald-50 dark:bg-emerald-950/20">
          <CardHeader className="pb-2">
            <CardDescription>Hakediş Toplamı</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-emerald-700">{fmtMoney(totalGenel, currency)}</p>
            <p className="text-xs text-muted-foreground">{filtered.length} iş kalemi</p>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="POZ No veya açıklama..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="ghost" size="sm" onClick={expandAll}>Tümünü Aç</Button>
        <Button variant="ghost" size="sm" onClick={() => setExpandedGroups(new Set())}>Tümünü Kapat</Button>
      </div>

      {/* Table */}
      {loading ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Yükleniyor...</CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calculator className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{selectedContractId ? "Henüz ataşman verisi yok" : "Sözleşme seçin"}</p>
            <p className="text-sm mt-1">Ataşmanlar oluşturulduğunda Yeşil Defter otomatik hesaplanır</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead>POZ No</TableHead>
                    <TableHead>İş Kalemi</TableHead>
                    <TableHead>Birim</TableHead>
                    <TableHead className="text-right">Söz. Miktar</TableHead>
                    <TableHead className="text-right">Ataş. Miktar</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    {isDetailed && (
                      <>
                        <TableHead className="text-right">Malzeme {sym}</TableHead>
                        <TableHead className="text-right">İşçilik {sym}</TableHead>
                        <TableHead className="text-right">GGK {sym}</TableHead>
                      </>
                    )}
                    <TableHead className="text-right">Toplam {sym}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(grouped).map(([groupName, rows]) => {
                    const isExpanded = expandedGroups.has(groupName);
                    const gMalzeme = rows.reduce((s, r) => s + r.malzemeTutar, 0);
                    const gIscilik = rows.reduce((s, r) => s + r.iscilikTutar, 0);
                    const gGGK = rows.reduce((s, r) => s + r.ggkTutar, 0);
                    const gTotal = rows.reduce((s, r) => s + r.toplamTutar, 0);

                    return (
                      <Fragment key={`g-${groupName}`}>
                        <TableRow
                          className="bg-muted/50 cursor-pointer hover:bg-muted"
                          onClick={() => toggleGroup(groupName)}
                        >
                          <TableCell colSpan={6} className="font-semibold text-sm">
                            <span className="flex items-center gap-2">
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              {groupName}
                              <Badge variant="secondary" className="text-xs">{rows.length}</Badge>
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

                        {isExpanded && rows.map((row, idx) => (
                          <TableRow key={`r-${row.kesifKalemi.id}-${idx}`} className="text-xs">
                            <TableCell className="font-mono font-medium">{row.kesifKalemi.pozNo}</TableCell>
                            <TableCell>
                              <div>{row.kesifKalemi.description}</div>
                              {row.kesifKalemi.altGrup && <div className="text-[10px] text-muted-foreground">{row.kesifKalemi.altGrup}</div>}
                            </TableCell>
                            <TableCell>{row.kesifKalemi.unit}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{fmtNum(row.kesifKalemi.quantity)}</TableCell>
                            <TableCell className="text-right font-bold">{fmtNum(row.atasMiktar)}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={row.yuzde >= 100 ? "destructive" : row.yuzde >= 80 ? "default" : "secondary"} className="text-[10px]">
                                %{row.yuzde.toFixed(1)}
                              </Badge>
                            </TableCell>
                            {isDetailed && (
                              <>
                                <TableCell className="text-right text-blue-600">{fmtMoney(row.malzemeTutar, currency)}</TableCell>
                                <TableCell className="text-right text-orange-600">{fmtMoney(row.iscilikTutar, currency)}</TableCell>
                                <TableCell className="text-right text-green-600">{fmtMoney(row.ggkTutar, currency)}</TableCell>
                              </>
                            )}
                            <TableCell className="text-right font-bold">{fmtMoney(row.toplamTutar, currency)}</TableCell>
                          </TableRow>
                        ))}
                      </Fragment>
                    );
                  })}

                  {/* Grand Total */}
                  <TableRow className="bg-emerald-50 dark:bg-emerald-950/20 font-bold text-sm border-t-2">
                    <TableCell colSpan={6} className="text-right">YEŞİL DEFTER TOPLAMI</TableCell>
                    {isDetailed && (
                      <>
                        <TableCell className="text-right text-blue-600">{fmtMoney(totalMalzeme, currency)}</TableCell>
                        <TableCell className="text-right text-orange-600">{fmtMoney(totalIscilik, currency)}</TableCell>
                        <TableCell className="text-right text-green-600">{fmtMoney(totalGGK, currency)}</TableCell>
                      </>
                    )}
                    <TableCell className="text-right text-lg text-emerald-700">{fmtMoney(totalGenel, currency)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
