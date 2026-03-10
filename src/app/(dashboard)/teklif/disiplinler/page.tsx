"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  FolderTree,
  Layers,
  HardHat,
  Zap,
  Wrench,
  Droplets,
  Flame,
  Boxes,
  TreePine,
  Shovel,
  Building2,
  Shield,
  Cable,
} from "lucide-react";

interface Discipline {
  id: string;
  name: string;
  code: string;
  description: string | null;
  color: string;
  sortOrder: number;
  _count: { categories: number; pozItems?: number };
}

const disciplineIcons: Record<string, typeof HardHat> = {
  "KABA": HardHat,
  "INCE": Layers,
  "CELIK": Building2,
  "MEKA": Wrench,
  "ELEK": Zap,
  "ALTI": Cable,
  "IZOL": Droplets,
  "YANG": Flame,
  "ASAN": Boxes,
  "PEYZ": TreePine,
  "HAFR": Shovel,
  "PREF": Building2,
};

export default function DisiplinlerPage() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Discipline | null>(null);
  const [form, setForm] = useState({ name: "", code: "", description: "", color: "#3B82F6" });

  const fetchData = useCallback(() => {
    fetch("/api/teklif/disiplinler")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setDisciplines(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", code: "", description: "", color: "#3B82F6" });
    setDialogOpen(true);
  }

  function openEdit(d: Discipline) {
    setEditing(d);
    setForm({ name: d.name, code: d.code, description: d.description || "", color: d.color });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.code.trim()) { toast.error("Ad ve kod zorunlu"); return; }
    const url = editing ? `/api/teklif/disiplinler/${editing.id}` : "/api/teklif/disiplinler";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      toast.success(editing ? "Disiplin güncellendi" : "Disiplin oluşturuldu");
      setDialogOpen(false);
      fetchData();
    } else {
      const err = await res.json().catch(() => null);
      toast.error(err?.error || "Hata oluştu");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu disiplini silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/teklif/disiplinler/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Disiplin silindi"); fetchData(); }
    else { toast.error("Silinemedi — alt kategoriler olabilir"); }
  }

  const presetColors = [
    "#EF4444", "#F97316", "#F59E0B", "#84CC16", "#22C55E", "#14B8A6",
    "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899", "#F43F5E", "#64748B",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Disiplinler</h1>
          <p className="text-muted-foreground text-sm">İnşaat iş disiplinlerini yönetin. Her disiplin altında poz kategorileri ve kalemleri tanımlanır.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Yeni Disiplin
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Yükleniyor...</div>
      ) : disciplines.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FolderTree className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Henüz disiplin tanımlanmamış</p>
            <p className="text-sm mb-4">Standart inşaat disiplinlerini ekleyerek başlayın</p>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> İlk Disiplini Ekle</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {disciplines.map((d) => {
            const IconComp = disciplineIcons[d.code] || FolderTree;
            return (
              <Card key={d.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: d.color + "20" }}
                      >
                        <IconComp className="h-5 w-5" style={{ color: d.color }} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{d.name}</h3>
                        <p className="text-xs text-muted-foreground">{d.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(d)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(d.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {d.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{d.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t text-xs text-muted-foreground">
                    <span>{d._count.categories} kategori</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Disiplin Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Disiplin Düzenle" : "Yeni Disiplin"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Disiplin Adı *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ör: Kaba İnşaat" />
            </div>
            <div>
              <Label>Kod *</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="ör: KABA" maxLength={10} />
              <p className="text-xs text-muted-foreground mt-1">Benzersiz kısa kod (maks 10 karakter)</p>
            </div>
            <div>
              <Label>Açıklama</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="İsteğe bağlı açıklama" />
            </div>
            <div>
              <Label>Renk</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {presetColors.map((c) => (
                  <button
                    key={c}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${form.color === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setForm({ ...form, color: c })}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button onClick={handleSave}>{editing ? "Güncelle" : "Oluştur"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
