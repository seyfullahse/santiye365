"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, ShoppingCart, Home, Trash2 } from "lucide-react";

interface ProjectUnit {
  id: string;
  unitNo: string;
  type: string;
  floor: number;
  grossArea: number | null;
  netArea: number | null;
  roomCount: string | null;
  listPrice: number;
  status: string;
  notes: string | null;
  sale: {
    id: string;
    buyerName: string;
    buyerPhone: string | null;
    salePrice: number;
    saleDate: string;
    contractNo: string | null;
    customer: { id: string; name: string } | null;
    payments: { id: string; amount: number; paidAmount: number; status: string }[];
  } | null;
}

interface InvestmentProject {
  id: string;
  name: string;
}

const unitTypeLabels: Record<string, string> = {
  DAIRE_1_1: "1+1 Daire",
  DAIRE_2_1: "2+1 Daire",
  DAIRE_3_1: "3+1 Daire",
  DAIRE_4_1: "4+1 Daire",
  DUKKAN: "Dükkan",
  OFIS: "Ofis",
  VILLA: "Villa",
  DIGER: "Diğer",
};

const statusLabels: Record<string, string> = {
  BOS: "Boş",
  OPSIYONLU: "Opsiyonlu",
  SATILDI: "Satıldı",
  TESLIM_EDILDI: "Teslim Edildi",
};

const statusColors: Record<string, string> = {
  BOS: "bg-gray-100 text-gray-800",
  OPSIYONLU: "bg-yellow-100 text-yellow-800",
  SATILDI: "bg-green-100 text-green-800",
  TESLIM_EDILDI: "bg-blue-100 text-blue-800",
};

function formatCurrency(val: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(val);
}

const emptyUnitForm = {
  unitNo: "",
  type: "DAIRE_2_1",
  floor: "0",
  grossArea: "",
  netArea: "",
  roomCount: "",
  listPrice: "",
  notes: "",
};

const emptySaleForm = {
  buyerName: "",
  buyerPhone: "",
  buyerEmail: "",
  salePrice: "",
  saleDate: new Date().toISOString().split("T")[0],
  contractNo: "",
  notes: "",
};

export default function SatisTakibiPage() {
  const [projects, setProjects] = useState<InvestmentProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [units, setUnits] = useState<ProjectUnit[]>([]);
  const [loading, setLoading] = useState(true);

  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [unitForm, setUnitForm] = useState(emptyUnitForm);

  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [saleForm, setSaleForm] = useState(emptySaleForm);
  const [sellingUnitId, setSellingUnitId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/yatirim/projeler")
      .then((r) => r.json())
      .then((data) => {
        setProjects(data);
        if (data.length > 0) setSelectedProjectId(data[0].id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fetchUnits = useCallback(() => {
    if (!selectedProjectId) return;
    fetch(`/api/yatirim/birimler?projectId=${selectedProjectId}`)
      .then((r) => r.json())
      .then(setUnits)
      .catch(console.error);
  }, [selectedProjectId]);

  useEffect(() => { fetchUnits(); }, [fetchUnits]);

  async function handleAddUnit() {
    if (!unitForm.unitNo.trim()) {
      toast.error("Birim No zorunludur");
      return;
    }

    const res = await fetch("/api/yatirim/birimler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: selectedProjectId, ...unitForm }),
    });

    if (res.ok) {
      toast.success("Birim eklendi");
      setUnitDialogOpen(false);
      setUnitForm(emptyUnitForm);
      fetchUnits();
    } else {
      toast.error("Hata oluştu");
    }
  }

  async function handleDeleteUnit(id: string) {
    if (!confirm("Bu birimi silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/yatirim/birimler/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Birim silindi");
      fetchUnits();
    }
  }

  function openSaleDialog(unitId: string, listPrice: number) {
    setSellingUnitId(unitId);
    setSaleForm({ ...emptySaleForm, salePrice: listPrice.toString() });
    setSaleDialogOpen(true);
  }

  async function handleSale() {
    if (!saleForm.buyerName.trim() || !saleForm.salePrice) {
      toast.error("Alıcı adı ve satış fiyatı zorunludur");
      return;
    }

    const res = await fetch("/api/yatirim/satis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unitId: sellingUnitId,
        ...saleForm,
      }),
    });

    if (res.ok) {
      toast.success("Satış kaydedildi");
      setSaleDialogOpen(false);
      fetchUnits();
    } else {
      toast.error("Hata oluştu");
    }
  }

  async function handleDeleteSale(saleId: string) {
    if (!confirm("Satışı iptal etmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/yatirim/satis/${saleId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Satış iptal edildi");
      fetchUnits();
    }
  }

  const totalUnits = units.length;
  const soldUnits = units.filter((u) => u.status === "SATILDI" || u.status === "TESLIM_EDILDI").length;
  const emptyUnits = units.filter((u) => u.status === "BOS").length;
  const totalListValue = units.reduce((s, u) => s + u.listPrice, 0);
  const totalSaleValue = units.reduce((s, u) => s + (u.sale?.salePrice || 0), 0);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Satış Takibi</h1>
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Satış Takibi</h1>
          <p className="text-muted-foreground">Birim yönetimi ve satış işlemleri</p>
        </div>
      </div>

      {/* Proje Seçici + Birim Ekle */}
      <div className="flex items-center gap-4">
        <div className="w-80">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger><SelectValue placeholder="Proje seçin" /></SelectTrigger>
            <SelectContent>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { setUnitForm(emptyUnitForm); setUnitDialogOpen(true); }} disabled={!selectedProjectId}>
          <Plus className="h-4 w-4 mr-2" /> Birim Ekle
        </Button>
      </div>

      {/* Özet */}
      {selectedProjectId && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Toplam Birim</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{totalUnits}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Satılan</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600">{soldUnits}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Boş</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-gray-600">{emptyUnits}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Satış Tutarı</CardTitle></CardHeader>
            <CardContent><div className="text-xl font-bold">{formatCurrency(totalSaleValue)}</div>
            <p className="text-xs text-muted-foreground">Liste: {formatCurrency(totalListValue)}</p></CardContent>
          </Card>
        </div>
      )}

      {/* Birimler Tablosu */}
      {selectedProjectId && (
        <Card>
          <CardHeader>
            <CardTitle>Birimler</CardTitle>
          </CardHeader>
          <CardContent>
            {units.length === 0 ? (
              <div className="flex flex-col items-center py-12">
                <Home className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Henüz birim eklenmemiş</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Birim No</TableHead>
                      <TableHead>Tip</TableHead>
                      <TableHead>Kat</TableHead>
                      <TableHead>Alan (m²)</TableHead>
                      <TableHead>Liste Fiyatı</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Alıcı</TableHead>
                      <TableHead>Satış Fiyatı</TableHead>
                      <TableHead className="text-right">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {units.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.unitNo}</TableCell>
                        <TableCell>{unitTypeLabels[u.type] || u.type}</TableCell>
                        <TableCell>{u.floor}. Kat</TableCell>
                        <TableCell>
                          {u.grossArea ? `${u.grossArea} brüt` : "—"}
                          {u.netArea ? ` / ${u.netArea} net` : ""}
                        </TableCell>
                        <TableCell>{formatCurrency(u.listPrice)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[u.status]}>
                            {statusLabels[u.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>{u.sale?.buyerName || "—"}</TableCell>
                        <TableCell>{u.sale ? formatCurrency(u.sale.salePrice) : "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {u.status === "BOS" && (
                              <Button variant="outline" size="sm" onClick={() => openSaleDialog(u.id, u.listPrice)}>
                                <ShoppingCart className="h-3 w-3 mr-1" /> Sat
                              </Button>
                            )}
                            {u.sale && (
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteSale(u.sale!.id)}>
                                İptal
                              </Button>
                            )}
                            {!u.sale && (
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteUnit(u.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Birim Ekle Dialog */}
      <Dialog open={unitDialogOpen} onOpenChange={setUnitDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yeni Birim Ekle</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label>Birim No *</Label>
              <Input value={unitForm.unitNo} onChange={(e) => setUnitForm({ ...unitForm, unitNo: e.target.value })} placeholder="A-101" />
            </div>
            <div>
              <Label>Tip</Label>
              <Select value={unitForm.type} onValueChange={(v) => setUnitForm({ ...unitForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(unitTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kat</Label>
              <Input type="number" value={unitForm.floor} onChange={(e) => setUnitForm({ ...unitForm, floor: e.target.value })} />
            </div>
            <div>
              <Label>Oda Sayısı</Label>
              <Input value={unitForm.roomCount} onChange={(e) => setUnitForm({ ...unitForm, roomCount: e.target.value })} placeholder="2+1" />
            </div>
            <div>
              <Label>Brüt Alan (m²)</Label>
              <Input type="number" value={unitForm.grossArea} onChange={(e) => setUnitForm({ ...unitForm, grossArea: e.target.value })} />
            </div>
            <div>
              <Label>Net Alan (m²)</Label>
              <Input type="number" value={unitForm.netArea} onChange={(e) => setUnitForm({ ...unitForm, netArea: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>Liste Fiyatı (₺)</Label>
              <Input type="number" value={unitForm.listPrice} onChange={(e) => setUnitForm({ ...unitForm, listPrice: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setUnitDialogOpen(false)}>İptal</Button>
            <Button onClick={handleAddUnit}>Ekle</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Satış Dialog */}
      <Dialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Satış Kaydı</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Alıcı Adı *</Label>
              <Input value={saleForm.buyerName} onChange={(e) => setSaleForm({ ...saleForm, buyerName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telefon</Label>
                <Input value={saleForm.buyerPhone} onChange={(e) => setSaleForm({ ...saleForm, buyerPhone: e.target.value })} />
              </div>
              <div>
                <Label>E-posta</Label>
                <Input value={saleForm.buyerEmail} onChange={(e) => setSaleForm({ ...saleForm, buyerEmail: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Satış Fiyatı (₺) *</Label>
                <Input type="number" value={saleForm.salePrice} onChange={(e) => setSaleForm({ ...saleForm, salePrice: e.target.value })} />
              </div>
              <div>
                <Label>Satış Tarihi</Label>
                <Input type="date" value={saleForm.saleDate} onChange={(e) => setSaleForm({ ...saleForm, saleDate: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Sözleşme No</Label>
              <Input value={saleForm.contractNo} onChange={(e) => setSaleForm({ ...saleForm, contractNo: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSaleDialogOpen(false)}>İptal</Button>
            <Button onClick={handleSale}>Satışı Kaydet</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
