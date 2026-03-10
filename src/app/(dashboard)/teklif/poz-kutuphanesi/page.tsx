"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Plus,
  Search,
  Library,
  FolderTree,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
} from "lucide-react";

interface Discipline {
  id: string;
  name: string;
  code: string;
  color: string;
}

interface PozCategory {
  id: string;
  name: string;
  code: string;
  discipline: Discipline;
}

interface PozItem {
  id: string;
  code: string;
  description: string;
  unit: string;
  laborCost: number;
  materialCost: number;
  equipmentCost: number;
  unitPrice: number;
  notes: string | null;
  category: { id: string; name: string; code: string; discipline: Discipline };
}

function formatPrice(val: number): string {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 }).format(val);
}

export default function PozKutuphanesiPage() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [categories, setCategories] = useState<PozCategory[]>([]);
  const [items, setItems] = useState<PozItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Filtreler
  const [search, setSearch] = useState("");
  const [filterDiscipline, setFilterDiscipline] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PozItem | null>(null);

  const [form, setForm] = useState({
    code: "", description: "", unit: "m²", laborCost: "", materialCost: "", equipmentCost: "", notes: "", categoryId: "",
  });
  const [catForm, setCatForm] = useState({ name: "", code: "", disciplineId: "" });

  // Disiplinler
  useEffect(() => {
    fetch("/api/teklif/disiplinler").then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) setDisciplines(data);
    }).catch(() => {});
  }, []);

  // Kategoriler (disipline göre)
  useEffect(() => {
    const url = filterDiscipline ? `/api/teklif/poz-kategoriler?disciplineId=${filterDiscipline}` : "/api/teklif/poz-kategoriler";
    fetch(url).then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) setCategories(data);
    }).catch(() => {});
  }, [filterDiscipline]);

  // Poz kalemleri
  const fetchItems = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
    if (search) params.set("search", search);
    if (filterDiscipline) params.set("disciplineId", filterDiscipline);
    if (filterCategory) params.set("categoryId", filterCategory);

    fetch(`/api/teklif/poz-kalemleri?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.items) {
          setItems(data.items);
          setTotal(data.total);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, filterDiscipline, filterCategory]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  function openCreateItem() {
    setEditingItem(null);
    setForm({ code: "", description: "", unit: "m²", laborCost: "", materialCost: "", equipmentCost: "", notes: "", categoryId: "" });
    setDialogOpen(true);
  }

  function openEditItem(item: PozItem) {
    setEditingItem(item);
    setForm({
      code: item.code,
      description: item.description,
      unit: item.unit,
      laborCost: item.laborCost.toString(),
      materialCost: item.materialCost.toString(),
      equipmentCost: item.equipmentCost.toString(),
      notes: item.notes || "",
      categoryId: item.category.id,
    });
    setDialogOpen(true);
  }

  async function handleSaveItem() {
    if (!form.code.trim() || !form.description.trim() || !form.categoryId) {
      toast.error("Kod, açıklama ve kategori zorunlu");
      return;
    }
    const body = {
      ...form,
      laborCost: parseFloat(form.laborCost) || 0,
      materialCost: parseFloat(form.materialCost) || 0,
      equipmentCost: parseFloat(form.equipmentCost) || 0,
    };
    const url = editingItem ? `/api/teklif/poz-kalemleri/${editingItem.id}` : "/api/teklif/poz-kalemleri";
    const method = editingItem ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      toast.success(editingItem ? "Poz güncellendi" : "Poz oluşturuldu");
      setDialogOpen(false);
      fetchItems();
    } else {
      const err = await res.json().catch(() => null);
      toast.error(err?.error || "Hata oluştu");
    }
  }

  async function handleDeleteItem(id: string) {
    if (!confirm("Bu poz kalemini silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/teklif/poz-kalemleri/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Poz silindi"); fetchItems(); }
  }

  async function handleSaveCategory() {
    if (!catForm.name.trim() || !catForm.code.trim() || !catForm.disciplineId) {
      toast.error("Ad, kod ve disiplin zorunlu");
      return;
    }
    const res = await fetch("/api/teklif/poz-kategoriler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(catForm),
    });
    if (res.ok) {
      toast.success("Kategori oluşturuldu");
      setCatDialogOpen(false);
      // Refresh categories
      const url = filterDiscipline ? `/api/teklif/poz-kategoriler?disciplineId=${filterDiscipline}` : "/api/teklif/poz-kategoriler";
      fetch(url).then((r) => r.json()).then((data) => { if (Array.isArray(data)) setCategories(data); });
    } else {
      const err = await res.json().catch(() => null);
      toast.error(err?.error || "Hata oluştu");
    }
  }

  const totalPages = Math.ceil(total / pageSize);
  const unitOptions = ["m²", "m³", "m", "kg", "ton", "adet", "takım", "gün", "saat", "sefer", "lt"];

  const calculatedUnitPrice = (parseFloat(form.laborCost) || 0) + (parseFloat(form.materialCost) || 0) + (parseFloat(form.equipmentCost) || 0);

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setFilterDiscipline("");
    setFilterCategory("");
    setPage(1);
  }

  const hasFilters = search || filterDiscipline || filterCategory;

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Poz Kütüphanesi</h1>
          <p className="text-muted-foreground text-sm">Birim fiyat pozları — arama, filtreleme ve düzenleme</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setCatForm({ name: "", code: "", disciplineId: "" }); setCatDialogOpen(true); }}>
            <FolderTree className="h-4 w-4 mr-2" /> Kategori Ekle
          </Button>
          <Button onClick={openCreateItem}>
            <Plus className="h-4 w-4 mr-2" /> Yeni Poz
          </Button>
        </div>
      </div>

      {/* Filtreler */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Poz kodu veya adı ile ara..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterDiscipline} onValueChange={(v) => { setFilterDiscipline(v === "ALL" ? "" : v); setFilterCategory(""); setPage(1); }}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Disiplin" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tüm Disiplinler</SelectItem>
                {disciplines.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    <span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: d.color }} />
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {categories.length > 0 && (
              <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v === "ALL" ? "" : v); setPage(1); }}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder="Kategori" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tüm Kategoriler</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" /> Temizle
              </Button>
            )}

            <div className="ml-auto text-sm text-muted-foreground">{total} poz kalemi</div>
          </div>
        </CardContent>
      </Card>

      {/* Tablo */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Kod</TableHead>
                <TableHead>Poz Adı</TableHead>
                <TableHead className="w-[100px]">Disiplin</TableHead>
                <TableHead className="w-[60px]">Birim</TableHead>
                <TableHead className="w-[100px] text-right">İşçilik</TableHead>
                <TableHead className="w-[100px] text-right">Malzeme</TableHead>
                <TableHead className="w-[100px] text-right">Ekipman</TableHead>
                <TableHead className="w-[110px] text-right">B. Fiyat</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Yükleniyor...</TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    <Library className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>Poz kalemi bulunamadı</p>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-accent/50">
                    <TableCell className="font-mono text-xs">{item.code}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{item.description}</p>
                        <p className="text-xs text-muted-foreground">{item.category.code} — {item.category.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]" style={{ borderColor: item.category.discipline.color, color: item.category.discipline.color }}>
                        {item.category.discipline.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{item.unit}</TableCell>
                    <TableCell className="text-right text-xs">{formatPrice(item.laborCost)}</TableCell>
                    <TableCell className="text-right text-xs">{formatPrice(item.materialCost)}</TableCell>
                    <TableCell className="text-right text-xs">{formatPrice(item.equipmentCost)}</TableCell>
                    <TableCell className="text-right font-semibold text-sm">{formatPrice(item.unitPrice)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditItem(item)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteItem(item.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} / {total}
          </p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" /> Önceki
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Sonraki <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Poz Ekleme/Düzenleme Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Poz Düzenle" : "Yeni Poz Kalemi"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Poz Kodu *</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="ör: 04.503/2A" />
              </div>
              <div>
                <Label>Birim</Label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {unitOptions.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Poz Açıklaması *</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="ör: 250 Dozlu beton dökülmesi" />
            </div>
            <div>
              <Label>Kategori *</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                <SelectTrigger><SelectValue placeholder="Kategori seçin" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <Badge variant="outline" className="text-[10px] mr-1" style={{ borderColor: c.discipline.color, color: c.discipline.color }}>{c.discipline.code}</Badge>
                      {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>İşçilik (₺)</Label>
                <Input type="number" step="0.01" value={form.laborCost} onChange={(e) => setForm({ ...form, laborCost: e.target.value })} placeholder="0.00" />
              </div>
              <div>
                <Label>Malzeme (₺)</Label>
                <Input type="number" step="0.01" value={form.materialCost} onChange={(e) => setForm({ ...form, materialCost: e.target.value })} placeholder="0.00" />
              </div>
              <div>
                <Label>Ekipman (₺)</Label>
                <Input type="number" step="0.01" value={form.equipmentCost} onChange={(e) => setForm({ ...form, equipmentCost: e.target.value })} placeholder="0.00" />
              </div>
            </div>
            <div className="bg-accent/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Hesaplanan Birim Fiyat</p>
              <p className="text-xl font-bold">{formatPrice(calculatedUnitPrice)}</p>
            </div>
            <div>
              <Label>Not</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="İsteğe bağlı" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button onClick={handleSaveItem}>{editingItem ? "Güncelle" : "Oluştur"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Kategori Ekleme Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yeni Poz Kategorisi</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Disiplin *</Label>
              <Select value={catForm.disciplineId} onValueChange={(v) => setCatForm({ ...catForm, disciplineId: v })}>
                <SelectTrigger><SelectValue placeholder="Disiplin seçin" /></SelectTrigger>
                <SelectContent>
                  {disciplines.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      <span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kategori Kodu *</Label>
              <Input value={catForm.code} onChange={(e) => setCatForm({ ...catForm, code: e.target.value })} placeholder="ör: BETON" />
            </div>
            <div>
              <Label>Kategori Adı *</Label>
              <Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="ör: Beton İşleri" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCatDialogOpen(false)}>İptal</Button>
            <Button onClick={handleSaveCategory}>Oluştur</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
