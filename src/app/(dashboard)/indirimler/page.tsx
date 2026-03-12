// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  Tag,
  Percent,
  Utensils,
  Shirt,
  Smartphone,
  Gift,
  Store,
  Search,
  ToggleLeft,
  ToggleRight,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

/* ─────── Sabitler ─────── */
const CATEGORIES = ["Gıda", "Giyim", "Teknoloji", "Hediye", "Sağlık", "Eğlence", "Ulaşım", "Diğer"];

const CATEGORY_ICONS: Record<string, typeof Tag> = {
  "Gıda": Utensils,
  "Giyim": Shirt,
  "Teknoloji": Smartphone,
  "Hediye": Gift,
  "Sağlık": Plus,
  "Eğlence": Gift,
  "Ulaşım": Store,
  "Diğer": Store,
};

const CATEGORY_COLORS: Record<string, string> = {
  "Gıda": "bg-orange-500",
  "Giyim": "bg-pink-500",
  "Teknoloji": "bg-blue-500",
  "Hediye": "bg-purple-500",
  "Sağlık": "bg-emerald-500",
  "Eğlence": "bg-amber-500",
  "Ulaşım": "bg-cyan-500",
  "Diğer": "bg-gray-500",
};

/* ─────── Tipler ─────── */
interface Discount {
  id: string;
  companyName: string;
  category: string;
  discountRate: number;
  description: string | null;
  logo: string | null;
  contactInfo: string | null;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
}

interface DiscountForm {
  companyName: string;
  category: string;
  discountRate: string;
  description: string;
  logo: string;
  contactInfo: string;
  validUntil: string;
  isActive: boolean;
}

const EMPTY_FORM: DiscountForm = {
  companyName: "",
  category: "",
  discountRate: "",
  description: "",
  logo: "",
  contactInfo: "",
  validUntil: "",
  isActive: true,
};

/* ─────── Sayfa ─────── */
export default function IndirimlerPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DiscountForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

  /* ── Veri çek ── */
  const fetchDiscounts = async () => {
    try {
      const res = await fetch("/api/indirimler");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDiscounts(Array.isArray(data) ? data : []);
    } catch {
      toast.error("İndirimler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  /* ── Filtrele ── */
  const filtered = discounts.filter((d) => {
    if (filterCategory !== "all" && d.category !== filterCategory) return false;
    if (filterStatus === "active" && !d.isActive) return false;
    if (filterStatus === "inactive" && d.isActive) return false;
    if (search) {
      const s = search.toLowerCase();
      if (
        !d.companyName.toLowerCase().includes(s) &&
        !d.category.toLowerCase().includes(s) &&
        !(d.description || "").toLowerCase().includes(s)
      )
        return false;
    }
    return true;
  });

  /* ── İstatistikler ── */
  const totalActive = discounts.filter((d) => d.isActive).length;
  const totalInactive = discounts.filter((d) => !d.isActive).length;
  const categories = [...new Set(discounts.map((d) => d.category))];
  const avgDiscount = discounts.length > 0 ? Math.round(discounts.reduce((s, d) => s + d.discountRate, 0) / discounts.length) : 0;

  /* ── Form aç ── */
  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (d: Discount) => {
    setEditingId(d.id);
    setForm({
      companyName: d.companyName,
      category: d.category,
      discountRate: String(d.discountRate),
      description: d.description || "",
      logo: d.logo || "",
      contactInfo: d.contactInfo || "",
      validUntil: d.validUntil ? d.validUntil.slice(0, 10) : "",
      isActive: d.isActive,
    });
    setDialogOpen(true);
  };

  /* ── Kaydet ── */
  const handleSave = async () => {
    if (!form.companyName || !form.category || !form.discountRate) {
      toast.error("Firma adı, kategori ve indirim oranı zorunludur");
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/indirimler?id=${editingId}` : "/api/indirimler";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          discountRate: parseInt(form.discountRate),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(editingId ? "İndirim güncellendi" : "İndirim eklendi");
      setDialogOpen(false);
      fetchDiscounts();
    } catch {
      toast.error("İşlem başarısız");
    } finally {
      setSaving(false);
    }
  };

  /* ── Sil ── */
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" indirimi silinecek. Emin misiniz?`)) return;
    try {
      const res = await fetch(`/api/indirimler?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("İndirim silindi");
      fetchDiscounts();
    } catch {
      toast.error("Silme başarısız");
    }
  };

  /* ── Aktif/Pasif Değiştir ── */
  const toggleActive = async (d: Discount) => {
    try {
      const res = await fetch(`/api/indirimler?id=${d.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !d.isActive }),
      });
      if (!res.ok) throw new Error();
      toast.success(d.isActive ? "İndirim pasife alındı" : "İndirim aktifleştirildi");
      fetchDiscounts();
    } catch {
      toast.error("İşlem başarısız");
    }
  };

  /* ── Format date ── */
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Tag className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Çalışan İndirimleri</h1>
            <p className="text-sm text-muted-foreground">Partner firmalardan sağlanan indirim anlaşmaları</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} size="sm">
              <Plus className="mr-2 h-4 w-4" /> Yeni İndirim
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "İndirim Düzenle" : "Yeni İndirim Ekle"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {/* Firma Adı */}
              <div className="space-y-1.5">
                <Label>Firma Adı *</Label>
                <Input
                  placeholder="örn: Starbucks, LC Waikiki..."
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                />
              </div>

              {/* Kategori + İndirim Oranı */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Kategori *</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm({ ...form, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>İndirim Oranı (%) *</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="örn: 20"
                    value={form.discountRate}
                    onChange={(e) => setForm({ ...form, discountRate: e.target.value })}
                  />
                </div>
              </div>

              {/* Açıklama */}
              <div className="space-y-1.5">
                <Label>Açıklama</Label>
                <Textarea
                  placeholder="İndirim detayları, geçerli ürünler vb."
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {/* İletişim */}
              <div className="space-y-1.5">
                <Label>İletişim Bilgisi</Label>
                <Input
                  placeholder="Telefon, e-posta veya adres"
                  value={form.contactInfo}
                  onChange={(e) => setForm({ ...form, contactInfo: e.target.value })}
                />
              </div>

              {/* Logo URL + Geçerlilik */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Logo URL</Label>
                  <Input
                    placeholder="https://..."
                    value={form.logo}
                    onChange={(e) => setForm({ ...form, logo: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Geçerlilik Tarihi</Label>
                  <Input
                    type="date"
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                  />
                </div>
              </div>

              {/* Aktif/Pasif */}
              <div className="flex items-center gap-3">
                <Label>Durum:</Label>
                <Button
                  type="button"
                  variant={form.isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                >
                  {form.isActive ? (
                    <>
                      <ToggleRight className="mr-1.5 h-4 w-4" /> Aktif
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="mr-1.5 h-4 w-4" /> Pasif
                    </>
                  )}
                </Button>
              </div>

              {/* Kaydet */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Kaydediliyor..." : editingId ? "Güncelle" : "Ekle"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <Tag className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{discounts.length}</p>
              <p className="text-xs text-muted-foreground">Toplam Anlaşma</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <ToggleRight className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalActive}</p>
              <p className="text-xs text-muted-foreground">Aktif</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
              <Percent className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">%{avgDiscount}</p>
              <p className="text-xs text-muted-foreground">Ort. İndirim</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
              <Store className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{categories.length}</p>
              <p className="text-xs text-muted-foreground">Kategori</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Firma veya kategori ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Kategoriler</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as "all" | "active" | "inactive")}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="inactive">Pasif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tablo */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Firma</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-center">İndirim</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>İletişim</TableHead>
                <TableHead className="text-center">Geçerlilik</TableHead>
                <TableHead className="text-center">Durum</TableHead>
                <TableHead className="text-right w-[120px]">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    {discounts.length === 0
                      ? "Henüz indirim anlaşması eklenmemiş"
                      : "Filtre sonuçlarına uygun kayıt bulunamadı"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((d) => {
                  const CatIcon = CATEGORY_ICONS[d.category] || Tag;
                  const catColor = CATEGORY_COLORS[d.category] || "bg-gray-500";
                  const isExpired = d.validUntil && new Date(d.validUntil) < new Date();
                  return (
                    <TableRow key={d.id} className={!d.isActive ? "opacity-50" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${catColor} text-white shrink-0`}>
                            <CatIcon className="h-4 w-4" />
                          </div>
                          <span className="font-medium">{d.companyName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{d.category}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-red-500 text-white text-xs font-bold">
                          %{d.discountRate}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground line-clamp-1">{d.description || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{d.contactInfo || "—"}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`text-xs ${isExpired ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                          {d.validUntil ? (
                            <>
                              {formatDate(d.validUntil)}
                              {isExpired && " (Süresi dolmuş)"}
                            </>
                          ) : (
                            "Süresiz"
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <button onClick={() => toggleActive(d)} className="cursor-pointer">
                          {d.isActive ? (
                            <Badge className="bg-emerald-500 text-white text-xs">Aktif</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">Pasif</Badge>
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(d)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(d.id, d.companyName)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
