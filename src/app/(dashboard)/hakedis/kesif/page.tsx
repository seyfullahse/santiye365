"use client";

import { useEffect, useState, useCallback, useRef, Fragment } from "react";
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
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Upload, Plus, Trash2, FileSpreadsheet, Save, Download, Search,
  Package, Wrench, Calculator, ChevronDown, ChevronRight,
} from "lucide-react";
import { useSozlesme } from "../sozlesme-context";

/* ─── TYPES ─── */
interface KesifKalemi {
  id?: string;
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
  toplamTutar: number;
}

/* ─── helpers ─── */
const currencySymbol: Record<string, string> = { TRY: "₺", USD: "$", EUR: "€", GBP: "£" };
const fmtMoney = (n: number, currency: string = "TRY") =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
const fmtNum = (n: number) =>
  new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(n);

/* ========================================================= */
export default function KesifPage() {
  const { selectedContractId, selectedContract: ctxContract } = useSozlesme();
  const currency = ctxContract?.currency || "TRY";
  const sym = currencySymbol[currency] || currency;
  const isDetailed = ctxContract?.pricingModel !== "TEKFIYAT"; // AYRINTILI or default
  const [kalemler, setKalemler] = useState<KesifKalemi[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // New item form
  const emptyItem: KesifKalemi = {
    anaGrup: "", altGrup: "", isKalemiGrubu: "",
    pozNo: "", description: "", unit: "adet",
    quantity: 0, marka: "", sartname: "",
    malzemeFiyati: 0, iscilikFiyati: 0, ggkFiyati: 0,
    toplamBirimFiyat: 0, toplamTutar: 0,
  };
  const [newItem, setNewItem] = useState<KesifKalemi>({ ...emptyItem });

  /* ─── fetch keşif for selected contract ─── */
  const loadKesif = useCallback(async (contractId: string) => {
    if (!contractId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/hakedis/kesif?contractId=${contractId}`);
      const data = await res.json();
      setKalemler(data);
    } catch {
      toast.error("Keşif kalemleri yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedContractId) loadKesif(selectedContractId);
    else setKalemler([]);
  }, [selectedContractId, loadKesif]);

  /* ─── CSV/Excel upload ─── */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith(".csv")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const lines = text.split("\n").filter((l) => l.trim());
        if (lines.length < 2) { toast.error("CSV dosyası boş"); return; }

        const parsed: KesifKalemi[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(";").map((c) => c.trim());
          if (cols.length < 13) continue;
          const malzeme = parseFloat(cols[9]) || 0;
          const iscilik = parseFloat(cols[10]) || 0;
          const ggk = parseFloat(cols[11]) || 0;
          const tbf = malzeme + iscilik + ggk;
          const miktar = parseFloat(cols[5]) || 0;
          parsed.push({
            anaGrup: cols[0],
            altGrup: cols[1],
            isKalemiGrubu: cols[2],
            pozNo: cols[3],
            description: cols[4] || "",
            unit: cols[6] || "adet",
            quantity: miktar,
            marka: cols[7] || "",
            sartname: cols[8] || "",
            malzemeFiyati: malzeme,
            iscilikFiyati: iscilik,
            ggkFiyati: ggk,
            toplamBirimFiyat: parseFloat(cols[12]) || tbf,
            toplamTutar: parseFloat(cols[13]) || tbf * miktar,
          });
        }
        setKalemler((prev) => [...prev, ...parsed]);
        toast.success(`${parsed.length} kalem yüklendi`);
      };
      reader.readAsText(file, "UTF-8");
    } else {
      toast.info("Excel desteği yakında eklenecek. Şimdilik CSV kullanın.");
    }
    e.target.value = "";
  };

  /* ─── save keşif ─── */
  const handleSave = async () => {
    if (!selectedContractId) { toast.error("Sözleşme seçin"); return; }
    if (kalemler.length === 0) { toast.error("Kalem ekleyin"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/hakedis/kesif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId: selectedContractId, items: kalemler }),
      });
      if (!res.ok) throw new Error();
      toast.success("Keşif kaydedildi");
      loadKesif(selectedContractId);
    } catch {
      toast.error("Kayıt başarısız");
    } finally {
      setSaving(false);
    }
  };

  /* ─── add single item ─── */
  const handleAddItem = () => {
    let tbf: number;
    if (isDetailed) {
      tbf = newItem.malzemeFiyati + newItem.iscilikFiyati + newItem.ggkFiyati;
    } else {
      tbf = newItem.toplamBirimFiyat;
    }
    const item: KesifKalemi = {
      ...newItem,
      toplamBirimFiyat: tbf,
      toplamTutar: tbf * newItem.quantity,
    };
    setKalemler((prev) => [...prev, item]);
    setNewItem({ ...emptyItem });
    setShowAddDialog(false);
    toast.success("Kalem eklendi");
  };

  /* ─── remove item ─── */
  const handleRemoveItem = (index: number) => {
    setKalemler((prev) => prev.filter((_, i) => i !== index));
  };

  /* ─── CSV template download ─── */
  const downloadTemplate = () => {
    const header = "Ana Grup;Alt Grup;İş Kalemi Grubu;POZ No;Açıklama;Sözleşme Miktar;Birim;Marka;Şartname;Malzeme Fiyatı;İşçilik Fiyatı;GGK Fiyatı;Toplam Birim Fiyat;Toplam Tutar";
    const sample = "ELEKTRİK TESİSATI;Aydınlatma Sistemleri;LED Armatürler;EL.01.001;60x60 LED Panel Armatür;20;adet;Philips;36W, 4000K, IP44;300;100;50;450;9000";
    const blob = new Blob([`${header}\n${sample}`], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "kesif-sablonu.csv";
    link.click();
  };

  /* ─── grouping ─── */
  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group); else next.add(group);
      return next;
    });
  };

  const expandAll = () => {
    const groups = new Set(kalemler.map((k) => k.anaGrup).filter(Boolean));
    setExpandedGroups(groups);
  };

  /* ─── filter ─── */
  const filtered = kalemler.filter((k) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      k.pozNo.toLowerCase().includes(s) ||
      k.description.toLowerCase().includes(s) ||
      k.anaGrup.toLowerCase().includes(s) ||
      k.altGrup.toLowerCase().includes(s)
    );
  });

  /* ─── group by anaGrup ─── */
  const grouped = filtered.reduce<Record<string, KesifKalemi[]>>((acc, k) => {
    const group = k.anaGrup || "DİĞER";
    if (!acc[group]) acc[group] = [];
    acc[group].push(k);
    return acc;
  }, {});

  /* ─── totals ─── */
  const totalMalzeme = filtered.reduce((s, k) => s + k.malzemeFiyati * k.quantity, 0);
  const totalIscilik = filtered.reduce((s, k) => s + k.iscilikFiyati * k.quantity, 0);
  const totalGGK = filtered.reduce((s, k) => s + k.ggkFiyati * k.quantity, 0);
  const totalGenel = filtered.reduce((s, k) => s + k.toplamTutar, 0);

  const selectedContract = ctxContract;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-7 w-7 text-purple-600" />
            Keşif Listesi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sözleşme keşif kalemlerini yönetin — Excel/CSV yükleyin veya manuel girin
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-1" /> Şablon İndir
          </Button>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileUpload} />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1" /> CSV Yükle
          </Button>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-1" /> Kalem Ekle
          </Button>
        </div>
      </div>

      {/* Sözleşme Bilgisi + KPI */}
      {!selectedContractId ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 opacity-40" />
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
                <Package className="h-3.5 w-3.5" /> Malzeme Toplamı
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-blue-600">{fmtMoney(totalMalzeme, currency)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Wrench className="h-3.5 w-3.5" /> İşçilik Toplamı
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-orange-600">{fmtMoney(totalIscilik, currency)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Calculator className="h-3.5 w-3.5" /> GGK Toplamı
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-green-600">{fmtMoney(totalGGK, currency)}</p>
            </CardContent>
          </Card>
          </>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Genel Toplam</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{fmtMoney(totalGenel, currency)}</p>
              <p className="text-xs text-muted-foreground">{filtered.length} kalem</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search + Actions */}
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
        <div className="ml-auto">
          <Button onClick={handleSave} disabled={saving || !selectedContractId || kalemler.length === 0}>
            <Save className="h-4 w-4 mr-1" />
            {saving ? "Kaydediliyor..." : "Keşifi Kaydet"}
          </Button>
        </div>
      </div>

      {/* Keşif Table - grouped */}
      {loading ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Yükleniyor...</CardContent></Card>
      ) : kalemler.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Henüz keşif kalemi yok</p>
            <p className="text-sm mt-1">Sözleşme seçip CSV yükleyin veya manuel kalem ekleyin</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>POZ No</TableHead>
                    <TableHead>İş Kalemi</TableHead>
                    <TableHead>Birim</TableHead>
                    <TableHead className="text-right">Söz. Miktar</TableHead>
                    <TableHead>Marka</TableHead>
                    {isDetailed && (
                      <>
                        <TableHead className="text-right">Malzeme {sym}</TableHead>
                        <TableHead className="text-right">İşçilik {sym}</TableHead>
                        <TableHead className="text-right">GGK {sym}</TableHead>
                      </>
                    )}
                    <TableHead className="text-right">B.Fiyat {sym}</TableHead>
                    <TableHead className="text-right">Toplam {sym}</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(grouped).map(([groupName, items]) => {
                    const isExpanded = expandedGroups.has(groupName);
                    const groupMalzeme = items.reduce((s, k) => s + k.malzemeFiyati * k.quantity, 0);
                    const groupIscilik = items.reduce((s, k) => s + k.iscilikFiyati * k.quantity, 0);
                    const groupGGK = items.reduce((s, k) => s + k.ggkFiyati * k.quantity, 0);
                    const groupTotal = items.reduce((s, k) => s + k.toplamTutar, 0);

                    return (
                      <Fragment key={`g-${groupName}`}>
                        {/* Group header row */}
                        <TableRow
                          className="bg-muted/50 cursor-pointer hover:bg-muted"
                          onClick={() => toggleGroup(groupName)}
                        >
                          <TableCell colSpan={6} className="font-semibold text-sm">
                            <span className="flex items-center gap-2">
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              {groupName}
                              <Badge variant="secondary" className="text-xs">{items.length} kalem</Badge>
                            </span>
                          </TableCell>
                          {isDetailed && (
                            <>
                              <TableCell className="text-right text-xs font-medium text-blue-600">{fmtMoney(groupMalzeme, currency)}</TableCell>
                              <TableCell className="text-right text-xs font-medium text-orange-600">{fmtMoney(groupIscilik, currency)}</TableCell>
                              <TableCell className="text-right text-xs font-medium text-green-600">{fmtMoney(groupGGK, currency)}</TableCell>
                            </>
                          )}
                          <TableCell></TableCell>
                          <TableCell className="text-right text-xs font-bold">{fmtMoney(groupTotal, currency)}</TableCell>
                          <TableCell></TableCell>
                        </TableRow>

                        {/* Item rows */}
                        {isExpanded && items.map((k, idx) => {
                          const globalIdx = kalemler.indexOf(k);
                          return (
                            <TableRow key={`i-${globalIdx}`} className="text-xs">
                              <TableCell className="text-muted-foreground">{globalIdx + 1}</TableCell>
                              <TableCell className="font-mono font-medium">{k.pozNo}</TableCell>
                              <TableCell>
                                <div>{k.description}</div>
                                {k.sartname && <div className="text-muted-foreground text-[10px]">{k.sartname}</div>}
                              </TableCell>
                              <TableCell>{k.unit}</TableCell>
                              <TableCell className="text-right font-medium">{fmtNum(k.quantity)}</TableCell>
                              <TableCell className="text-muted-foreground">{k.marka}</TableCell>
                              {isDetailed && (
                                <>
                                  <TableCell className="text-right text-blue-600">{fmtNum(k.malzemeFiyati)}</TableCell>
                                  <TableCell className="text-right text-orange-600">{fmtNum(k.iscilikFiyati)}</TableCell>
                                  <TableCell className="text-right text-green-600">{fmtNum(k.ggkFiyati)}</TableCell>
                                </>
                              )}
                              <TableCell className="text-right font-medium">{fmtNum(k.toplamBirimFiyat)}</TableCell>
                              <TableCell className="text-right font-bold">{fmtMoney(k.toplamTutar, currency)}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveItem(globalIdx)}>
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </Fragment>
                    );
                  })}

                  {/* Grand Total Row */}
                  <TableRow className="bg-primary/5 font-bold text-sm border-t-2">
                    <TableCell colSpan={6} className="text-right">GENEL TOPLAM</TableCell>
                    {isDetailed && (
                      <>
                        <TableCell className="text-right text-blue-600">{fmtMoney(totalMalzeme, currency)}</TableCell>
                        <TableCell className="text-right text-orange-600">{fmtMoney(totalIscilik, currency)}</TableCell>
                        <TableCell className="text-right text-green-600">{fmtMoney(totalGGK, currency)}</TableCell>
                      </>
                    )}
                    <TableCell></TableCell>
                    <TableCell className="text-right text-lg">{fmtMoney(totalGenel, currency)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Keşif Kalemi</DialogTitle>
            <DialogDescription>POZ bilgilerini ve fiyatları girin</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Ana Grup</Label>
              <Input placeholder="ELEKTRİK TESİSATI" value={newItem.anaGrup}
                onChange={(e) => setNewItem({ ...newItem, anaGrup: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Alt Grup</Label>
              <Input placeholder="Aydınlatma Sistemleri" value={newItem.altGrup}
                onChange={(e) => setNewItem({ ...newItem, altGrup: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">İş Kalemi Grubu</Label>
              <Input placeholder="LED Armatürler" value={newItem.isKalemiGrubu}
                onChange={(e) => setNewItem({ ...newItem, isKalemiGrubu: e.target.value })} />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">POZ No *</Label>
              <Input placeholder="EL.01.001" value={newItem.pozNo}
                onChange={(e) => setNewItem({ ...newItem, pozNo: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Açıklama *</Label>
              <Input placeholder="60x60 LED Panel Armatür" value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Birim</Label>
              <Select value={newItem.unit} onValueChange={(v) => setNewItem({ ...newItem, unit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["adet", "mt", "m²", "m³", "kg", "ton", "lt", "takım", "set"].map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Sözleşme Miktar</Label>
              <Input type="number" value={newItem.quantity || ""}
                onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <Label className="text-xs">Marka</Label>
              <Input placeholder="Philips" value={newItem.marka}
                onChange={(e) => setNewItem({ ...newItem, marka: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Şartname</Label>
              <Input placeholder="36W, 4000K" value={newItem.sartname}
                onChange={(e) => setNewItem({ ...newItem, sartname: e.target.value })} />
            </div>
          </div>

          <Separator />

          {isDetailed ? (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-blue-600">Malzeme Fiyatı {sym}</Label>
                <Input type="number" value={newItem.malzemeFiyati || ""}
                  onChange={(e) => setNewItem({ ...newItem, malzemeFiyati: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label className="text-xs text-orange-600">İşçilik Fiyatı {sym}</Label>
                <Input type="number" value={newItem.iscilikFiyati || ""}
                  onChange={(e) => setNewItem({ ...newItem, iscilikFiyati: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label className="text-xs text-green-600">GGK Fiyatı {sym}</Label>
                <Input type="number" value={newItem.ggkFiyati || ""}
                  onChange={(e) => setNewItem({ ...newItem, ggkFiyati: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label className="text-xs font-semibold">Birim Fiyat {sym}</Label>
                <Input type="number" value={newItem.toplamBirimFiyat || ""}
                  onChange={(e) => setNewItem({ ...newItem, toplamBirimFiyat: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span>Toplam Birim Fiyat:</span>
              <span className="font-bold">
                {fmtMoney(
                  isDetailed
                    ? newItem.malzemeFiyati + newItem.iscilikFiyati + newItem.ggkFiyati
                    : newItem.toplamBirimFiyat,
                  currency
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Toplam Tutar:</span>
              <span className="font-bold text-lg">
                {fmtMoney(
                  (isDetailed
                    ? newItem.malzemeFiyati + newItem.iscilikFiyati + newItem.ggkFiyati
                    : newItem.toplamBirimFiyat) * newItem.quantity,
                  currency
                )}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>İptal</Button>
            <Button onClick={handleAddItem} disabled={!newItem.pozNo || !newItem.description}>
              <Plus className="h-4 w-4 mr-1" /> Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
