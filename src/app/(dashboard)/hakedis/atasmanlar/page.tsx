"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  Plus, Trash2, ClipboardList, Save, Search, Eye, ChevronDown, ChevronRight, Download, Upload,
} from "lucide-react";
import { utils, read, writeFileXLSX } from "xlsx";
import { useSozlesme } from "../sozlesme-context";

/* ─── TYPES ─── */
interface Contract {
  id: string;
  name: string;
  type: string;
  projectId: string;
  project?: { name: string };
}

interface KesifKalemi {
  id: string;
  pozNo: string;
  description: string;
  unit: string;
  quantity: number;
  anaGrup: string;
  altGrup: string;
  malzemeFiyati: number;
  iscilikFiyati: number;
  ggkFiyati: number;
  toplamBirimFiyat: number;
}

interface Atasman {
  id?: string;
  atasmanNo: string;
  aciklama: string;
  katBolge: string;
  kalemler: AtasmanKalemi[];
}

interface AtasmanKalemi {
  id?: string;
  kesifKalemiId: string;
  pozNo?: string;
  description?: string;
  unit?: string;
  miktar: number;
}

/* ─── helpers ─── */
const fmtNum = (n: number) => new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(n);
const fmtMoney = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n);

/* ========================================================= */
export default function AtasmanlarPage() {
  const { selectedContractId } = useSozlesme();
  const [kesifKalemleri, setKesifKalemleri] = useState<KesifKalemi[]>([]);
  const [atasmanlar, setAtasmanlar] = useState<Atasman[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<Atasman | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedAtasman, setExpandedAtasman] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New ataşman form
  const [newAtasman, setNewAtasman] = useState<Atasman>({
    atasmanNo: "", aciklama: "", katBolge: "", kalemler: [],
  });

  /* ─── fetch keşif + ataşmanlar for contract ─── */
  const loadData = useCallback(async (contractId: string) => {
    if (!contractId) return;
    setLoading(true);
    try {
      const [kesifRes, atasmanRes] = await Promise.all([
        fetch(`/api/hakedis/kesif?contractId=${contractId}`),
        fetch(`/api/hakedis/atasmanlar?contractId=${contractId}`),
      ]);
      const kesifData = await kesifRes.json();
      const atasmanData = await atasmanRes.json();
      setKesifKalemleri(Array.isArray(kesifData) ? kesifData : []);
      setAtasmanlar(Array.isArray(atasmanData) ? atasmanData : []);
    } catch {
      toast.error("Veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedContractId) loadData(selectedContractId);
    else { setKesifKalemleri([]); setAtasmanlar([]); }
  }, [selectedContractId, loadData]);

  /* ─── add kalem to new ataşman ─── */
  const addKalem = () => {
    setNewAtasman((prev) => ({
      ...prev,
      kalemler: [...prev.kalemler, { kesifKalemiId: "", miktar: 0 }],
    }));
  };

  const updateKalem = (idx: number, field: keyof AtasmanKalemi, value: string | number) => {
    setNewAtasman((prev) => {
      const updated = [...prev.kalemler];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, kalemler: updated };
    });
  };

  const removeKalem = (idx: number) => {
    setNewAtasman((prev) => ({
      ...prev,
      kalemler: prev.kalemler.filter((_, i) => i !== idx),
    }));
  };

  /* ─── save ataşman ─── */
  const handleSave = async () => {
    if (!selectedContractId) { toast.error("Sözleşme seçin"); return; }
    if (!newAtasman.atasmanNo) { toast.error("Ataşman No girin"); return; }
    if (newAtasman.kalemler.length === 0) { toast.error("En az bir kalem ekleyin"); return; }

    const invalidKalem = newAtasman.kalemler.find((k) => !k.kesifKalemiId || k.miktar <= 0);
    if (invalidKalem) { toast.error("Tüm kalemlerde POZ seçili ve miktar > 0 olmalı"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/hakedis/atasmanlar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId: selectedContractId, ...newAtasman }),
      });
      if (!res.ok) throw new Error();
      toast.success("Ataşman kaydedildi");
      setShowCreate(false);
      setNewAtasman({ atasmanNo: "", aciklama: "", katBolge: "", kalemler: [] });
      loadData(selectedContractId);
    } catch {
      toast.error("Kayıt başarısız");
    } finally {
      setSaving(false);
    }
  };

  /* ─── delete ataşman ─── */
  const handleDelete = async (id: string) => {
    if (!confirm("Bu ataşmanı silmek istediğinize emin misiniz?")) return;
    try {
      await fetch(`/api/hakedis/atasmanlar/${id}`, { method: "DELETE" });
      toast.success("Ataşman silindi");
      loadData(selectedContractId);
    } catch {
      toast.error("Silme başarısız");
    }
  };

  /* ─── POZ toplamları hesapla (tüm ataşmanlar üzerinden) ─── */
  const pozToplamlar = atasmanlar.reduce<Record<string, number>>((acc, at) => {
    at.kalemler?.forEach((k) => {
      const key = k.kesifKalemiId;
      acc[key] = (acc[key] || 0) + k.miktar;
    });
    return acc;
  }, {});

  /* ─── filter ─── */
  const filtered = atasmanlar.filter((a) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return a.atasmanNo.toLowerCase().includes(s) || a.aciklama?.toLowerCase().includes(s) || a.katBolge?.toLowerCase().includes(s);
  });

  const toggleAtasman = (id: string) => {
    setExpandedAtasman((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const getKesifKalemi = (id: string) => kesifKalemleri.find((k) => k.id === id);

  // ─── Excel EXPORT ───
  const handleExport = () => {
    if (atasmanlar.length === 0) { toast.error("Dışa aktarılacak ataşman yok"); return; }
    const rows: Record<string, unknown>[] = [];
    for (const a of atasmanlar) {
      for (const k of a.kalemler || []) {
        const kesif = getKesifKalemi(k.kesifKalemiId);
        rows.push({
          "ATŞ No": a.atasmanNo,
          "Kat/Bölge": a.katBolge || "",
          "Poz No": kesif?.pozNo || k.pozNo || "",
          "İş Kalemi": kesif?.description || k.description || "",
          Birim: kesif?.unit || k.unit || "",
          Miktar: k.miktar,
          Açıklama: a.aciklama || "",
        });
      }
    }
    const ws = utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 35 }, { wch: 8 }, { wch: 12 }, { wch: 30 }];
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Ataşmanlar");
    writeFileXLSX(wb, "atasmanlar.xlsx");
    toast.success(`${rows.length} satır dışa aktarıldı`);
  };

  // ─── Excel IMPORT ───
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedContractId) return;
    try {
      const buffer = await file.arrayBuffer();
      const wb = read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = utils.sheet_to_json(ws) as Record<string, unknown>[];
      if (rows.length === 0) { toast.error("Excel dosyası boş"); return; }

      const groups = new Map<string, { katBolge: string; aciklama: string; kalemler: { kesifKalemiId: string; miktar: number }[] }>();
      let skipped = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const pozNo = String(row["Poz No"] || row.PozNo || "").trim();
        const miktar = Number(row.Miktar || row.miktar || 0);
        const katBolge = String(row["Kat/Bölge"] || row.KatBolge || "").trim();
        const aciklama = String(row["Açıklama"] || row.Aciklama || "").trim();
        const groupKey = String(row["ATŞ No"] || row["Atş No"] || `IMPORT-${i}`).trim();

        if (!pozNo || miktar <= 0) { skipped++; continue; }

        const kesif = kesifKalemleri.find((k) => k.pozNo.toLowerCase() === pozNo.toLowerCase());
        if (!kesif) { toast.warning(`Satır ${i + 2}: "${pozNo}" bulunamadı`); skipped++; continue; }

        if (!groups.has(groupKey)) groups.set(groupKey, { katBolge, aciklama, kalemler: [] });
        const grp = groups.get(groupKey)!;
        if (katBolge) grp.katBolge = katBolge;
        if (aciklama) grp.aciklama = aciklama;
        grp.kalemler.push({ kesifKalemiId: kesif.id, miktar });
      }

      let success = 0, fail = 0;
      for (const [atsNo, group] of groups) {
        try {
          const res = await fetch("/api/hakedis/atasmanlar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contractId: selectedContractId,
              atasmanNo: atsNo,
              aciklama: group.aciklama || null,
              katBolge: group.katBolge || null,
              kalemler: group.kalemler,
            }),
          });
          if (!res.ok) throw new Error();
          success++;
        } catch { fail++; }
      }

      toast.success(`${success} ataşman oluşturuldu`);
      if (skipped > 0) toast.warning(`${skipped} satır atlandı`);
      if (fail > 0) toast.error(`${fail} ataşman oluşturulamadı`);
      loadData(selectedContractId);
    } catch { toast.error("Excel içe aktarma başarısız"); }
    finally { e.target.value = ""; }
  };

  // ─── Excel ŞABLON ───
  const handleDownloadTemplate = () => {
    const rows = kesifKalemleri.map((k) => ({
      "ATŞ No": "", "Kat/Bölge": "", "Poz No": k.pozNo,
      "İş Kalemi": k.description, Birim: k.unit, Miktar: 0, Açıklama: "",
    }));
    const ws = utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 35 }, { wch: 8 }, { wch: 12 }, { wch: 30 }];
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Ataşman Şablon");
    writeFileXLSX(wb, "atasman-sablon.xlsx");
    toast.success("Şablon indirildi");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-indigo-600" />
            Ataşmanlar
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Saha ölçümlerini (AutoCAD ataşmanlarını) girin — her ataşmanda POZ No ve miktar belirtin
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={handleDownloadTemplate} disabled={!selectedContractId || kesifKalemleri.length === 0}>
            <Download className="h-4 w-4 mr-1" /> Şablon
          </Button>
          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={!selectedContractId}>
            <Upload className="h-4 w-4 mr-1" /> Excel İçe Aktar
          </Button>
          <Button size="sm" variant="outline" onClick={handleExport} disabled={atasmanlar.length === 0}>
            <Download className="h-4 w-4 mr-1" /> Excel Dışa Aktar
          </Button>
          <Button size="sm" onClick={() => {
            if (!selectedContractId) { toast.error("Önce bir sözleşme seçin"); return; }
            if (kesifKalemleri.length === 0) { toast.error("Bu sözleşmede keşif kalemi yok — önce keşif ekleyin"); return; }
            setShowCreate(true);
          }}>
            <Plus className="h-4 w-4 mr-1" /> Yeni Ataşman
          </Button>
        </div>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
      </div>

      {/* Sözleşme Bilgisi + summary */}
      {!selectedContractId ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="font-medium">Sözleşme seçili değil</p>
            <p className="text-sm mt-1">Sağ üstteki sözleşme seçiciden bir sözleşme seçin</p>
          </CardContent>
        </Card>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <Card>
          <CardHeader className="pb-2"><CardDescription>Toplam Ataşman</CardDescription></CardHeader>
          <CardContent><p className="text-2xl font-bold text-indigo-600">{atasmanlar.length}</p></CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardDescription>Keşif Kalemleri</CardDescription></CardHeader>
          <CardContent><p className="text-2xl font-bold">{kesifKalemleri.length}</p></CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardDescription>Ölçülen POZ Sayısı</CardDescription></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{Object.keys(pozToplamlar).length}</p></CardContent>
        </Card>
      </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Ataşman no, açıklama veya kat/bölge..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Ataşman List */}
      {loading ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Yükleniyor...</CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{selectedContractId ? "Henüz ataşman yok" : "Sözleşme seçin"}</p>
            <p className="text-sm mt-1">Yeni ataşman oluşturup saha ölçümlerini ekleyin</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((at) => {
            const isExpanded = expandedAtasman.has(at.id || at.atasmanNo);
            const kalemler = at.kalemler || [];
            return (
              <Card key={at.id || at.atasmanNo}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleAtasman(at.id || at.atasmanNo)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <div>
                        <CardTitle className="text-base">{at.atasmanNo}</CardTitle>
                        <CardDescription>
                          {at.katBolge && <span>{at.katBolge} · </span>}
                          {at.aciklama && <span>{at.aciklama}</span>}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{kalemler.length} kalem</Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); if (at.id) handleDelete(at.id); }}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="pt-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="text-xs">
                          <TableHead>POZ No</TableHead>
                          <TableHead>Açıklama</TableHead>
                          <TableHead>Birim</TableHead>
                          <TableHead className="text-right">Bu Ataşman</TableHead>
                          <TableHead className="text-right">Toplam (Tüm Atş.)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {kalemler.map((k, idx) => {
                          const kesif = getKesifKalemi(k.kesifKalemiId);
                          return (
                            <TableRow key={idx} className="text-xs">
                              <TableCell className="font-mono font-medium">{kesif?.pozNo || k.pozNo || "-"}</TableCell>
                              <TableCell>{kesif?.description || k.description || "-"}</TableCell>
                              <TableCell>{kesif?.unit || k.unit || "-"}</TableCell>
                              <TableCell className="text-right font-medium">{fmtNum(k.miktar)}</TableCell>
                              <TableCell className="text-right font-bold text-indigo-600">
                                {fmtNum(pozToplamlar[k.kesifKalemiId] || k.miktar)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Ataşman Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Ataşman Oluştur</DialogTitle>
            <DialogDescription>AutoCAD çiziminden gelen ölçümleri girin</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Ataşman No *</Label>
              <Input placeholder="ATŞ-001" value={newAtasman.atasmanNo}
                onChange={(e) => setNewAtasman({ ...newAtasman, atasmanNo: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Kat / Bölge</Label>
              <Input placeholder="1. Kat, A Blok" value={newAtasman.katBolge}
                onChange={(e) => setNewAtasman({ ...newAtasman, katBolge: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Açıklama</Label>
              <Input placeholder="Aydınlatma ataşmanı" value={newAtasman.aciklama}
                onChange={(e) => setNewAtasman({ ...newAtasman, aciklama: e.target.value })} />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">İş Kalemleri</Label>
            <Button size="sm" variant="outline" onClick={addKalem}>
              <Plus className="h-4 w-4 mr-1" /> Kalem Ekle
            </Button>
          </div>

          {newAtasman.kalemler.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Henüz kalem eklenmedi — keşiften POZ seçip miktar girin
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="w-[40%]">POZ (Keşiften Seç)</TableHead>
                  <TableHead className="text-right">Miktar</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {newAtasman.kalemler.map((k, idx) => {
                  const selectedKesif = getKesifKalemi(k.kesifKalemiId);
                  return (
                    <TableRow key={idx}>
                      <TableCell>
                        <Select value={k.kesifKalemiId} onValueChange={(v) => updateKalem(idx, "kesifKalemiId", v)}>
                          <SelectTrigger className="text-xs">
                            <SelectValue placeholder="POZ seçin..." />
                          </SelectTrigger>
                          <SelectContent>
                            {kesifKalemleri.map((kk) => (
                              <SelectItem key={kk.id} value={kk.id}>
                                <span className="font-mono">{kk.pozNo}</span> — {kk.description} ({kk.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedKesif && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Söz. Miktar: {fmtNum(selectedKesif.quantity)} {selectedKesif.unit} · B.Fiyat: {fmtMoney(selectedKesif.toplamBirimFiyat)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input type="number" className="text-right" value={k.miktar || ""}
                          onChange={(e) => updateKalem(idx, "miktar", parseFloat(e.target.value) || 0)} />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeKalem(idx)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>İptal</Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-1" /> {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
