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
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface CashFlowEntry {
  id: string;
  projectId: string;
  type: string;
  category: string;
  description: string | null;
  amount: number;
  entryDate: string;
  isProjection: boolean;
}

interface InvestmentProject {
  id: string;
  name: string;
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(val);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("tr-TR");
}

const emptyForm = {
  type: "GIRIS",
  category: "",
  description: "",
  amount: "",
  entryDate: new Date().toISOString().split("T")[0],
  isProjection: false,
};

export default function NakitProjeksiyonuPage() {
  const [projects, setProjects] = useState<InvestmentProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [entries, setEntries] = useState<CashFlowEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

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

  const fetchEntries = useCallback(() => {
    if (!selectedProjectId) return;
    fetch(`/api/yatirim/nakit?projectId=${selectedProjectId}`)
      .then((r) => r.json())
      .then(setEntries)
      .catch(console.error);
  }, [selectedProjectId]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  async function handleAdd() {
    if (!form.category.trim() || !form.amount) {
      toast.error("Kategori ve tutar zorunludur");
      return;
    }

    const res = await fetch("/api/yatirim/nakit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: selectedProjectId, ...form }),
    });

    if (res.ok) {
      toast.success("Kayıt eklendi");
      setDialogOpen(false);
      setForm(emptyForm);
      fetchEntries();
    } else {
      toast.error("Hata oluştu");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/yatirim/nakit/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Kayıt silindi");
      fetchEntries();
    }
  }

  // Hesaplamalar
  const realEntries = entries.filter((e) => !e.isProjection);
  const projectionEntries = entries.filter((e) => e.isProjection);

  const totalGiris = realEntries.filter((e) => e.type === "GIRIS").reduce((s, e) => s + e.amount, 0);
  const totalCikis = realEntries.filter((e) => e.type === "CIKIS").reduce((s, e) => s + e.amount, 0);
  const netCash = totalGiris - totalCikis;

  const projGiris = projectionEntries.filter((e) => e.type === "GIRIS").reduce((s, e) => s + e.amount, 0);
  const projCikis = projectionEntries.filter((e) => e.type === "CIKIS").reduce((s, e) => s + e.amount, 0);
  const projNet = projGiris - projCikis;

  // Aylık bazda kümülatif hesaplama
  const monthlyData: Record<string, { giris: number; cikis: number; projGiris: number; projCikis: number }> = {};
  entries.forEach((e) => {
    const month = e.entryDate.substring(0, 7); // YYYY-MM
    if (!monthlyData[month]) monthlyData[month] = { giris: 0, cikis: 0, projGiris: 0, projCikis: 0 };
    if (e.isProjection) {
      if (e.type === "GIRIS") monthlyData[month].projGiris += e.amount;
      else monthlyData[month].projCikis += e.amount;
    } else {
      if (e.type === "GIRIS") monthlyData[month].giris += e.amount;
      else monthlyData[month].cikis += e.amount;
    }
  });

  const sortedMonths = Object.keys(monthlyData).sort();

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Nakit Projeksiyonu</h1>
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Nakit Projeksiyonu</h1>
          <p className="text-muted-foreground">Nakit giriş-çıkış takibi ve projeksiyon</p>
        </div>
      </div>

      {/* Proje + Ekle */}
      <div className="flex items-center gap-4">
        <div className="w-80">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger><SelectValue placeholder="Proje seçin" /></SelectTrigger>
            <SelectContent>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { setForm(emptyForm); setDialogOpen(true); }} disabled={!selectedProjectId}>
          <Plus className="h-4 w-4 mr-2" /> Kayıt Ekle
        </Button>
      </div>

      {selectedProjectId && (
        <>
          {/* KPI */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Gerçek Giriş</CardTitle></CardHeader>
              <CardContent><div className="text-xl font-bold text-green-600">{formatCurrency(totalGiris)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Gerçek Çıkış</CardTitle></CardHeader>
              <CardContent><div className="text-xl font-bold text-red-600">{formatCurrency(totalCikis)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Net Nakit</CardTitle></CardHeader>
              <CardContent><div className={`text-xl font-bold ${netCash >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(netCash)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Proj. Giriş</CardTitle></CardHeader>
              <CardContent><div className="text-xl font-bold text-green-400">{formatCurrency(projGiris)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Proj. Çıkış</CardTitle></CardHeader>
              <CardContent><div className="text-xl font-bold text-red-400">{formatCurrency(projCikis)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Proj. Net</CardTitle></CardHeader>
              <CardContent><div className={`text-xl font-bold ${projNet >= 0 ? "text-green-400" : "text-red-400"}`}>{formatCurrency(projNet)}</div></CardContent>
            </Card>
          </div>

          {/* Aylık Özet */}
          {sortedMonths.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" /> Aylık Nakit Akışı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ay</TableHead>
                        <TableHead className="text-right">Giriş</TableHead>
                        <TableHead className="text-right">Çıkış</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                        <TableHead className="text-right">Proj. Giriş</TableHead>
                        <TableHead className="text-right">Proj. Çıkış</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedMonths.map((month) => {
                        const d = monthlyData[month];
                        const net = d.giris - d.cikis;
                        return (
                          <TableRow key={month}>
                            <TableCell className="font-medium">{month}</TableCell>
                            <TableCell className="text-right text-green-600">{formatCurrency(d.giris)}</TableCell>
                            <TableCell className="text-right text-red-600">{formatCurrency(d.cikis)}</TableCell>
                            <TableCell className={`text-right font-semibold ${net >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {formatCurrency(net)}
                            </TableCell>
                            <TableCell className="text-right text-green-400">{d.projGiris > 0 ? formatCurrency(d.projGiris) : "—"}</TableCell>
                            <TableCell className="text-right text-red-400">{d.projCikis > 0 ? formatCurrency(d.projCikis) : "—"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detay Tablo */}
          <Card>
            <CardHeader>
              <CardTitle>Nakit Akış Kayıtları</CardTitle>
            </CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">Henüz nakit akış kaydı bulunmuyor</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Tür</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Açıklama</TableHead>
                        <TableHead className="text-right">Tutar</TableHead>
                        <TableHead>Projeksiyon</TableHead>
                        <TableHead className="text-right">İşlem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.map((e) => (
                        <TableRow key={e.id} className={e.isProjection ? "opacity-60" : ""}>
                          <TableCell>{formatDate(e.entryDate)}</TableCell>
                          <TableCell>
                            {e.type === "GIRIS" ? (
                              <Badge variant="outline" className="bg-green-100 text-green-800">
                                <TrendingUp className="h-3 w-3 mr-1" /> Giriş
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-100 text-red-800">
                                <TrendingDown className="h-3 w-3 mr-1" /> Çıkış
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{e.category}</TableCell>
                          <TableCell className="text-muted-foreground">{e.description || "—"}</TableCell>
                          <TableCell className={`text-right font-semibold ${e.type === "GIRIS" ? "text-green-600" : "text-red-600"}`}>
                            {e.type === "GIRIS" ? "+" : "-"}{formatCurrency(e.amount)}
                          </TableCell>
                          <TableCell>
                            {e.isProjection && <Badge variant="secondary">Projeksiyon</Badge>}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Ekle Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nakit Akış Kaydı Ekle</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Tür</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GIRIS">Giriş (Tahsilat)</SelectItem>
                  <SelectItem value="CIKIS">Çıkış (Harcama)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kategori *</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder={form.type === "GIRIS" ? "Satış Tahsilatı, Kira Geliri..." : "İnşaat Maliyeti, Arsa Ödemesi..."}
              />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tutar (₺) *</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <Label>Tarih</Label>
                <Input type="date" value={form.entryDate} onChange={(e) => setForm({ ...form, entryDate: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isProjection"
                checked={form.isProjection}
                onChange={(e) => setForm({ ...form, isProjection: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isProjection">Bu bir projeksiyon (tahmini) kaydıdır</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button onClick={handleAdd}>Ekle</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
