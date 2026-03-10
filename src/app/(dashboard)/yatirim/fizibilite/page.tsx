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
import { toast } from "sonner";
import { Plus, Trash2, Calculator, TrendingUp, TrendingDown } from "lucide-react";

interface InvestmentProject {
  id: string;
  name: string;
}

interface FeasibilityItem {
  id: string;
  projectId: string;
  type: string;
  category: string;
  description: string | null;
  amount: number;
  sortOrder: number;
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(val);
}

const emptyForm = {
  type: "MALIYET",
  category: "",
  description: "",
  amount: "",
};

export default function FizibilitePage() {
  const [projects, setProjects] = useState<InvestmentProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [items, setItems] = useState<FeasibilityItem[]>([]);
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

  const fetchItems = useCallback(() => {
    if (!selectedProjectId) return;
    fetch(`/api/yatirim/fizibilite?projectId=${selectedProjectId}`)
      .then((r) => r.json())
      .then(setItems)
      .catch(console.error);
  }, [selectedProjectId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function handleAdd() {
    if (!form.category.trim()) {
      toast.error("Kategori zorunludur");
      return;
    }

    const res = await fetch("/api/yatirim/fizibilite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: selectedProjectId,
        ...form,
      }),
    });

    if (res.ok) {
      toast.success("Kalem eklendi");
      setDialogOpen(false);
      setForm(emptyForm);
      fetchItems();
    } else {
      toast.error("Hata oluştu");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu kalemi silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/yatirim/fizibilite/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Kalem silindi");
      fetchItems();
    }
  }

  const maliyetItems = items.filter((i) => i.type === "MALIYET");
  const gelirItems = items.filter((i) => i.type === "GELIR");
  const totalMaliyet = maliyetItems.reduce((s, i) => s + i.amount, 0);
  const totalGelir = gelirItems.reduce((s, i) => s + i.amount, 0);
  const netKar = totalGelir - totalMaliyet;
  const karMarji = totalGelir > 0 ? ((netKar / totalGelir) * 100).toFixed(1) : "0";
  const roi = totalMaliyet > 0 ? ((netKar / totalMaliyet) * 100).toFixed(1) : "0";

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Fizibilite Analizi</h1>
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fizibilite Analizi</h1>
          <p className="text-muted-foreground">Proje maliyet-gelir karşılaştırması</p>
        </div>
      </div>

      {/* Proje Seçici */}
      <div className="flex items-center gap-4">
        <div className="w-80">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Proje seçin" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { setForm(emptyForm); setDialogOpen(true); }} disabled={!selectedProjectId}>
          <Plus className="h-4 w-4 mr-2" /> Kalem Ekle
        </Button>
      </div>

      {!selectedProjectId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Fizibilite analizi için proje seçin</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Özet Kartlar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" /> Toplam Maliyet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(totalMaliyet)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" /> Toplam Gelir
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(totalGelir)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Net Kâr / Zarar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${netKar >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(netKar)}
                </div>
                <p className="text-xs text-muted-foreground">Kâr Marjı: %{karMarji}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">ROI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${parseFloat(roi) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  %{roi}
                </div>
                <p className="text-xs text-muted-foreground">Yatırım getiri oranı</p>
              </CardContent>
            </Card>
          </div>

          {/* Maliyet & Gelir Tabloları */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Maliyet */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" /> Maliyet Kalemleri
                </CardTitle>
              </CardHeader>
              <CardContent>
                {maliyetItems.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground">Henüz maliyet kalemi eklenmemiş</p>
                ) : (
                  <div className="space-y-2">
                    {maliyetItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                        <div>
                          <p className="font-medium">{item.category}</p>
                          {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-red-600">{formatCurrency(item.amount)}</span>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between p-3 border-t-2 font-bold">
                      <span>TOPLAM</span>
                      <span className="text-red-600">{formatCurrency(totalMaliyet)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gelir */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" /> Gelir Kalemleri
                </CardTitle>
              </CardHeader>
              <CardContent>
                {gelirItems.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground">Henüz gelir kalemi eklenmemiş</p>
                ) : (
                  <div className="space-y-2">
                    {gelirItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                        <div>
                          <p className="font-medium">{item.category}</p>
                          {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-green-600">{formatCurrency(item.amount)}</span>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between p-3 border-t-2 font-bold">
                      <span>TOPLAM</span>
                      <span className="text-green-600">{formatCurrency(totalGelir)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Fizibilite Özet Çubuğu */}
          {items.length > 0 && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Maliyet / Gelir Oranı</span>
                      <span>{totalGelir > 0 ? `%${((totalMaliyet / totalGelir) * 100).toFixed(0)}` : "—"}</span>
                    </div>
                    <div className="w-full h-4 bg-green-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-400 rounded-full transition-all"
                        style={{ width: `${totalGelir > 0 ? Math.min((totalMaliyet / totalGelir) * 100, 100) : 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span className="text-red-600">Maliyet: {formatCurrency(totalMaliyet)}</span>
                      <span className="text-green-600">Gelir: {formatCurrency(totalGelir)}</span>
                    </div>
                  </div>
                  <Badge variant={netKar >= 0 ? "default" : "destructive"} className="text-lg px-4 py-2">
                    {netKar >= 0 ? "KÂR" : "ZARAR"}: {formatCurrency(Math.abs(netKar))}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Kalem Ekle Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fizibilite Kalemi Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Tür</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALIYET">Maliyet</SelectItem>
                  <SelectItem value="GELIR">Gelir</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kategori *</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder={form.type === "MALIYET" ? "Arsa Maliyeti, İnşaat, Proje..." : "Daire Satışı, Dükkan Satışı..."}
              />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label>Tutar (₺)</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
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
