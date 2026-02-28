"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Megaphone,
  ArrowLeft,
  Pin,
  Send,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
}

const priorityConfig: Record<string, { label: string; emoji: string; color: string }> = {
  NORMAL: { label: "Normal", emoji: "🔵", color: "bg-blue-100 text-blue-700 border-blue-200" },
  IMPORTANT: { label: "Önemli", emoji: "🟠", color: "bg-orange-100 text-orange-700 border-orange-200" },
  URGENT: { label: "Acil", emoji: "🔴", color: "bg-red-100 text-red-700 border-red-200" },
};

export default function YeniDuyuruPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [form, setForm] = useState({
    title: "",
    content: "",
    categoryId: "",
    priority: "NORMAL",
    isPinned: false,
    targetType: "EVERYONE",
    targetRoles: [] as string[],
    publishDate: "",
    expiresAt: "",
  });

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/duyurular/kategoriler");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.filter((c: Category) => c.isActive));
      }
    } catch (err) {
      console.error("Kategori yükleme hatası:", err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // İlk aktif kategoriyi otomatik seç
  useEffect(() => {
    if (categories.length > 0 && !form.categoryId) {
      setForm((f) => ({ ...f, categoryId: categories[0].id }));
    }
  }, [categories, form.categoryId]);

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("Başlık zorunludur");
      return;
    }
    if (!form.content.trim()) {
      toast.error("İçerik zorunludur");
      return;
    }
    if (!form.categoryId) {
      toast.error("Kategori seçiniz");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/duyurular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          publishDate: form.publishDate || undefined,
          expiresAt: form.expiresAt || undefined,
        }),
      });

      if (res.ok) {
        toast.success("Duyuru başarıyla yayınlandı!");
        router.push("/duyurular");
      } else {
        const err = await res.json();
        toast.error(err.error || "Duyuru oluşturulamadı");
      }
    } catch {
      toast.error("İşlem sırasında bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategory = categories.find((c) => c.id === form.categoryId);
  const pConfig = priorityConfig[form.priority];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-7 w-7 text-sky-600" />
            Yeni Duyuru Oluştur
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Duyurunuzu oluşturun ve hedef kitlenize ulaştırın
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/duyurular")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Geri Dön
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="h-4 w-4 mr-1" />
            {showPreview ? "Formu Göster" : "Önizleme"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SOL: FORM */}
        <div className={`lg:col-span-2 space-y-4 ${showPreview ? "hidden lg:block" : ""}`}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Duyuru İçeriği</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Başlık *</Label>
                <Input
                  placeholder="Duyuru başlığını yazın..."
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="text-lg"
                />
              </div>
              <div>
                <Label>İçerik *</Label>
                <Textarea
                  placeholder="Duyuru içeriğini detaylı olarak yazın..."
                  rows={10}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  {form.content.length} karakter
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ayarlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Kategori *</Label>
                  <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <span className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            {cat.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Öncelik</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NORMAL">🔵 Normal</SelectItem>
                      <SelectItem value="IMPORTANT">🟠 Önemli</SelectItem>
                      <SelectItem value="URGENT">🔴 Acil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Hedef Kitle</Label>
                  <Select value={form.targetType} onValueChange={(v) => setForm({ ...form, targetType: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EVERYONE">Herkes</SelectItem>
                      <SelectItem value="ROLE_BASED">Rol Bazlı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.targetType === "ROLE_BASED" && (
                  <div>
                    <Label>Hedef Roller</Label>
                    <div className="flex gap-3 mt-2">
                      <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.targetRoles.includes("ADMIN")}
                          onChange={(e) => {
                            const roles = e.target.checked
                              ? [...form.targetRoles, "ADMIN"]
                              : form.targetRoles.filter((r) => r !== "ADMIN");
                            setForm({ ...form, targetRoles: roles });
                          }}
                          className="rounded"
                        />
                        Admin
                      </label>
                      <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.targetRoles.includes("USER")}
                          onChange={(e) => {
                            const roles = e.target.checked
                              ? [...form.targetRoles, "USER"]
                              : form.targetRoles.filter((r) => r !== "USER");
                            setForm({ ...form, targetRoles: roles });
                          }}
                          className="rounded"
                        />
                        Kullanıcı
                      </label>
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Yayın Tarihi</Label>
                  <Input
                    type="datetime-local"
                    value={form.publishDate}
                    onChange={(e) => setForm({ ...form, publishDate: e.target.value })}
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">Boş bırakılırsa hemen yayınlanır</p>
                </div>
                <div>
                  <Label>Bitiş Tarihi</Label>
                  <Input
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">Boş bırakılırsa süresiz geçerli</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/20">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={form.isPinned}
                  onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isPinned" className="cursor-pointer flex items-center gap-1.5">
                  <Pin className="h-4 w-4 text-purple-500" />
                  Bu duyuruyu sabitle (listenin başında sabit kalır)
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* YAYINLA BUTONU */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => router.push("/duyurular")}>
              İptal
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} size="lg">
              <Send className="h-4 w-4 mr-2" />
              {submitting ? "Yayınlanıyor..." : "Duyuruyu Yayınla"}
            </Button>
          </div>
        </div>

        {/* SAĞ: ÖNİZLEME */}
        <div className={`space-y-4 ${!showPreview ? "hidden lg:block" : ""}`}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Önizleme</CardTitle>
            </CardHeader>
            <CardContent>
              {form.title || form.content ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {form.isPinned && <Pin className="h-3.5 w-3.5 text-purple-500" />}
                    <h3 className="font-semibold text-base">
                      {form.title || "Başlık yazın..."}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCategory && (
                      <Badge
                        variant="outline"
                        className="text-[11px]"
                        style={{ borderColor: selectedCategory.color, color: selectedCategory.color }}
                      >
                        {selectedCategory.name}
                      </Badge>
                    )}
                    {pConfig && (
                      <Badge variant="outline" className={`text-[11px] ${pConfig.color}`}>
                        {pConfig.emoji} {pConfig.label}
                      </Badge>
                    )}
                  </div>
                  <div className="border rounded-lg p-3 bg-muted/30 whitespace-pre-wrap text-sm leading-relaxed">
                    {form.content || "İçerik yazın..."}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Hedef: {form.targetType === "EVERYONE" ? "Herkes" : `Rol bazlı (${form.targetRoles.join(", ") || "seçilmedi"})`}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Formu doldurunca önizleme burada görünecek</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
