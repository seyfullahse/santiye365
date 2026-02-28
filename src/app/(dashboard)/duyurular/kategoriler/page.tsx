"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  X,
  Megaphone,
  GripVertical,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";

/* ═══════ TYPES ═══════ */
interface Category {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { announcements: number };
}

const PRESET_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
  "#DC2626", "#059669", "#D97706", "#7C3AED", "#0891B2",
];

export default function KategorilerPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", color: "#3B82F6", icon: "" });

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/duyurular/kategoriler");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Kategori yükleme hatası:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const resetForm = () => {
    setForm({ name: "", color: "#3B82F6", icon: "" });
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Kategori adı zorunludur");
      return;
    }
    try {
      const url = editingId
        ? `/api/duyurular/kategoriler/${editingId}`
        : "/api/duyurular/kategoriler";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success(editingId ? "Kategori güncellendi" : "Kategori eklendi");
        setShowDialog(false);
        resetForm();
        fetchCategories();
      } else {
        const err = await res.json();
        toast.error(err.error || "İşlem başarısız");
      }
    } catch {
      toast.error("İşlem sırasında bir hata oluştu");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" kategorisini silmek istediğinize emin misiniz?`)) return;
    try {
      const res = await fetch(`/api/duyurular/kategoriler/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Kategori silindi");
        fetchCategories();
      } else {
        const err = await res.json();
        toast.error(err.error || "Silme başarısız");
      }
    } catch {
      toast.error("Silme işlemi başarısız");
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      const res = await fetch(`/api/duyurular/kategoriler/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !cat.isActive }),
      });
      if (res.ok) {
        toast.success(cat.isActive ? "Kategori pasife alındı" : "Kategori aktifleştirildi");
        fetchCategories();
      }
    } catch {
      toast.error("İşlem başarısız");
    }
  };

  const openEdit = (cat: Category) => {
    setForm({ name: cat.name, color: cat.color, icon: cat.icon || "" });
    setEditingId(cat.id);
    setShowDialog(true);
  };

  const totalAnnouncements = categories.reduce((sum, c) => sum + (c._count?.announcements || 0), 0);
  const activeCount = categories.filter((c) => c.isActive).length;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tag className="h-7 w-7 text-sky-600" />
            Kategori Yönetimi
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Duyuru kategorilerini ekleyin, düzenleyin veya pasife alın
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            resetForm();
            setShowDialog(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Yeni Kategori
        </Button>
      </div>

      {/* İSTATİSTİKLER */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-100 rounded-lg">
                <Tag className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-xs text-muted-foreground">Toplam Kategori</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ToggleRight className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-xs text-muted-foreground">Aktif Kategori</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Megaphone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalAnnouncements}</p>
                <p className="text-xs text-muted-foreground">Toplam Duyuru</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KATEGORİ LİSTESİ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kategoriler</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Yükleniyor...</p>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">Henüz kategori eklenmemiş</p>
              <p className="text-sm mt-1">İlk kategoriyi eklemek için yukarıdaki butonu kullanın</p>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                    !cat.isActive ? "opacity-50 bg-muted/30" : "hover:bg-muted/20"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                    <div
                      className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${!cat.isActive ? "line-through" : ""}`}>
                          {cat.name}
                        </span>
                        {!cat.isActive && (
                          <Badge variant="secondary" className="text-[10px]">Pasif</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {cat._count?.announcements || 0} duyuru · Sıra: {cat.sortOrder}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      title={cat.isActive ? "Pasife Al" : "Aktifleştir"}
                      onClick={() => handleToggleActive(cat)}
                    >
                      {cat.isActive ? (
                        <ToggleRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => openEdit(cat)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(cat.id, cat.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* KATEGORİ EKLE/DÜZENLE DİALOG */}
      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Kategori Düzenle" : "Yeni Kategori Ekle"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Kategori Adı *</Label>
              <Input
                placeholder="ör: Proje, İSG, Genel, Acil..."
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Renk</Label>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${
                      form.color === c ? "border-foreground scale-110 ring-2 ring-offset-2 ring-primary" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setForm({ ...form, color: c })}
                  />
                ))}
                <div className="flex items-center gap-1 ml-2">
                  <Input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-9 h-9 p-0.5 border rounded cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground">Özel</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">Önizleme:</span>
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{ borderColor: form.color, color: form.color }}
                >
                  {form.name || "Kategori Adı"}
                </Badge>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>
                <X className="h-4 w-4 mr-1" />
                İptal
              </Button>
              <Button onClick={handleSave}>
                {editingId ? "Güncelle" : "Ekle"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
