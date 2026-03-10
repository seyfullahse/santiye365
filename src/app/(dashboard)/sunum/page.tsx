"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
import {
  Plus,
  Trash2,
  Monitor,
  Upload,
  Image as ImageIcon,
  Play,
  Pencil,
  GripVertical,
  LayoutGrid,
  Presentation as PresentationIcon,
  ExternalLink,
  X,
  Clock,
  Type,
  BarChart3,
  Timer,
} from "lucide-react";
import Link from "next/link";

interface PresentationItem {
  id: number;
  name: string;
  description: string | null;
  mode: string;
  interval: number;
  transition: string;
  isActive: boolean;
  slideCount: number;
  showClock: boolean;
  tickerText: string | null;
  createdAt: string;
}

interface SlideItem {
  id: number;
  imageUrl: string;
  fileName: string | null;
  sortOrder: number;
}

interface PresentationDetail {
  id: number;
  name: string;
  description: string | null;
  mode: string;
  interval: number;
  transition: string;
  isActive: boolean;
  logoUrl: string | null;
  showClock: boolean;
  tickerText: string | null;
  tickerSpeed: number;
  showProgress: boolean;
  countdownTimerId: string | null;
  countdownTimer: { id: string; title: string; targetDate: string; emoji: string } | null;
  slides: SlideItem[];
}

const modeLabels: Record<string, string> = {
  SLIDE: "Tekli Slayt",
  GRID_2: "2'li Izgara",
  GRID_3: "3'lü Izgara",
  GRID_4: "4'lü Izgara",
  GRID_6: "6'lı Izgara",
};

const transitionLabels: Record<string, string> = {
  fade: "Geçişli (Fade)",
  slide: "Kayar (Slide)",
  zoom: "Yakınlaştır (Zoom)",
  kenburns: "Ken Burns",
  flip: "Çevir (Flip)",
  blur: "Bulanık (Blur)",
  wipe: "Silme (Wipe)",
};

// Client-side image compression
function compressImage(file: File, maxWidth = 1920, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        const maxHeight = maxWidth * 0.75; // 4:3 max
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function SunumPage() {
  const [presentations, setPresentations] = useState<PresentationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "", mode: "SLIDE", interval: "5", transition: "fade", showClock: false, tickerText: "", tickerSpeed: "30", showProgress: false });
  const [editForm, setEditForm] = useState({ id: 0, name: "", description: "", mode: "SLIDE", interval: "5", transition: "fade", showClock: false, tickerText: "", tickerSpeed: "30", showProgress: false, logoUrl: "", countdownTimerId: "" });
  const [activePresentation, setActivePresentation] = useState<PresentationDetail | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [countdownTimers, setCountdownTimers] = useState<{ id: string; title: string; emoji: string; targetDate: string }[]>([]);

  const fetchPresentations = useCallback(() => {
    fetch("/api/sunum")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPresentations(data);
        } else {
          setPresentations([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setPresentations([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchPresentations(); }, [fetchPresentations]);

  const fetchDetail = useCallback(async (id: number) => {
    const res = await fetch(`/api/sunum/${id}`);
    if (res.ok) {
      const data = await res.json();
      setActivePresentation(data);
    }
  }, []);

  async function handleCreate() {
    if (!createForm.name.trim()) { toast.error("Sunum adı zorunlu"); return; }

    const res = await fetch("/api/sunum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: createForm.name,
        description: createForm.description,
        mode: createForm.mode,
        interval: parseInt(createForm.interval) || 5,
        transition: createForm.transition,
        showClock: createForm.showClock,
        tickerText: createForm.tickerText || null,
        tickerSpeed: parseInt(createForm.tickerSpeed) || 30,
        showProgress: createForm.showProgress,
      }),
    });

    if (res.ok) {
      const p = await res.json();
      toast.success("Sunum oluşturuldu");
      setCreateDialogOpen(false);
      setCreateForm({ name: "", description: "", mode: "SLIDE", interval: "5", transition: "fade", showClock: false, tickerText: "", tickerSpeed: "30", showProgress: false });
      fetchPresentations();
      // Otomatik detay aç
      await fetchDetail(p.id);
      setDetailDialogOpen(true);
    } else {
      const err = await res.json().catch(() => null);
      console.error("Create error:", res.status, err);
      toast.error(err?.error || "Hata oluştu");
    }
  }

  async function handleUpdate() {
    const res = await fetch(`/api/sunum/${editForm.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.name,
        description: editForm.description,
        mode: editForm.mode,
        interval: parseInt(editForm.interval) || 5,
        transition: editForm.transition,
        logoUrl: editForm.logoUrl || null,
        showClock: editForm.showClock,
        tickerText: editForm.tickerText || null,
        tickerSpeed: parseInt(editForm.tickerSpeed) || 30,
        showProgress: editForm.showProgress,
        countdownTimerId: editForm.countdownTimerId || null,
      }),
    });

    if (res.ok) {
      toast.success("Sunum güncellendi");
      setEditDialogOpen(false);
      fetchPresentations();
      if (activePresentation?.id === editForm.id) {
        fetchDetail(editForm.id);
      }
    } else {
      const err = await res.json().catch(() => null);
      console.error("Update error:", res.status, err);
      toast.error(err?.error || "Hata oluştu");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Bu sunumu ve tüm slaytlarını silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/sunum/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Sunum silindi");
      fetchPresentations();
      if (activePresentation?.id === id) {
        setActivePresentation(null);
        setDetailDialogOpen(false);
      }
    }
  }

  async function openEdit(p: PresentationItem) {
    setEditForm({
      id: p.id,
      name: p.name,
      description: p.description || "",
      mode: p.mode,
      interval: p.interval.toString(),
      transition: p.transition || "fade",
      showClock: false,
      tickerText: "",
      tickerSpeed: "30",
      showProgress: false,
      logoUrl: "",
      countdownTimerId: "",
    });
    setEditDialogOpen(true);
    // Sayaçları yükle
    fetch("/api/sayac").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setCountdownTimers(data.filter((t: any) => t.isActive));
    }).catch(() => {});
    // Detayları yükle (overlay ayarları için)
    const res = await fetch(`/api/sunum/${p.id}`);
    if (res.ok) {
      const detail = await res.json();
      setEditForm(prev => ({
        ...prev,
        showClock: detail.showClock ?? false,
        tickerText: detail.tickerText || "",
        tickerSpeed: (detail.tickerSpeed || 30).toString(),
        showProgress: detail.showProgress ?? false,
        logoUrl: detail.logoUrl || "",
        countdownTimerId: detail.countdownTimerId || "",
      }));
    }
  }

  async function openDetail(p: PresentationItem) {
    await fetchDetail(p.id);
    setDetailDialogOpen(true);
  }

  // Resim yükleme
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!activePresentation || !e.target.files?.length) return;
    setUploading(true);

    try {
      const files = Array.from(e.target.files);
      const slides: { imageUrl: string; fileName: string }[] = [];

      for (const file of files) {
        const compressed = await compressImage(file);
        slides.push({ imageUrl: compressed, fileName: file.name });
      }

      const res = await fetch(`/api/sunum/${activePresentation.id}/slides`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`${data.added} resim eklendi`);
        await fetchDetail(activePresentation.id);
        fetchPresentations();
      } else {
        toast.error("Yükleme başarısız");
      }
    } catch {
      toast.error("Resim işlenirken hata oluştu");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDeleteSlide(slideId: number) {
    if (!activePresentation) return;
    const res = await fetch(`/api/sunum/${activePresentation.id}/slides?slideId=${slideId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Slayt silindi");
      await fetchDetail(activePresentation.id);
      fetchPresentations();
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Sunum Yönetimi</h1>
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sunum Yönetimi</h1>
          <p className="text-muted-foreground">TV ve büyük ekranlar için görsel sunum oluşturun</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Yeni Sunum
        </Button>
      </div>

      {/* Sunum Listesi */}
      {presentations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Monitor className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="font-semibold text-lg mb-1">Henüz sunum oluşturulmamış</h3>
            <p className="text-sm text-muted-foreground mb-4">Mimari renderlerinizi TV&apos;de sergilemek için bir sunum oluşturun</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> İlk Sunumunuzu Oluşturun
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {presentations.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                      {p.mode === "SLIDE" ? <PresentationIcon className="h-5 w-5" /> : <LayoutGrid className="h-5 w-5" />}
                    </div>
                    <div>
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{modeLabels[p.mode]} · {p.interval}sn</p>
                    </div>
                  </div>
                  <Badge variant={p.isActive ? "default" : "secondary"}>
                    {p.isActive ? "Aktif" : "Pasif"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><ImageIcon className="h-3.5 w-3.5" /> {p.slideCount} resim</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openDetail(p)}
                  >
                    <Upload className="h-3.5 w-3.5 mr-1" /> Resimler
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Link href={`/sunum-ekran/${p.id}`} target="_blank">
                    <Button variant="outline" size="sm" title="Tam Ekran Sunum">
                      <Play className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Oluştur Dialog ── */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Yeni Sunum Oluştur</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Sunum Adı *</Label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="ör: Merkez Konut Renderleri"
              />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Input
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Kısa açıklama (opsiyonel)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Görüntüleme Modu</Label>
                <Select value={createForm.mode} onValueChange={(v) => setCreateForm({ ...createForm, mode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(modeLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Geçiş Süresi (sn)</Label>
                <Input
                  type="number"
                  value={createForm.interval}
                  onChange={(e) => setCreateForm({ ...createForm, interval: e.target.value })}
                  min="1" max="60"
                />
              </div>
            </div>
            <div>
              <Label>Geçiş Efekti</Label>
              <Select value={createForm.transition} onValueChange={(v) => setCreateForm({ ...createForm, transition: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(transitionLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>İptal</Button>
            <Button onClick={handleCreate}>Oluştur</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Düzenle Dialog ── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Sunumu Düzenle</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Sunum Adı *</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Görüntüleme Modu</Label>
                <Select value={editForm.mode} onValueChange={(v) => setEditForm({ ...editForm, mode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(modeLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Geçiş Süresi (sn)</Label>
                <Input type="number" value={editForm.interval} onChange={(e) => setEditForm({ ...editForm, interval: e.target.value })} min="1" max="60" />
              </div>
            </div>
            <div>
              <Label>Geçiş Efekti</Label>
              <Select value={editForm.transition} onValueChange={(v) => setEditForm({ ...editForm, transition: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(transitionLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ── Overlay Ayarları ── */}
            <div className="border-t pt-4 space-y-4">
              <p className="text-sm font-semibold text-muted-foreground">Ekran Katmanları</p>

              {/* Logo */}
              <div>
                <Label className="text-sm">Firma Logosu (Sol Üst)</Label>
                <div className="flex items-center gap-3 mt-1">
                  {editForm.logoUrl ? (
                    <div className="relative h-10 w-24 border rounded bg-muted flex items-center justify-center overflow-hidden">
                      <img src={editForm.logoUrl} alt="Logo" className="h-full object-contain" />
                      <button
                        onClick={() => setEditForm({ ...editForm, logoUrl: "" })}
                        className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-white flex items-center justify-center text-[10px]"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (!file) return;
                          const compressed = await compressImage(file, 400, 0.9);
                          setEditForm({ ...editForm, logoUrl: compressed });
                        };
                        input.click();
                      }}
                    >
                      <Upload className="h-3.5 w-3.5 mr-1" /> Logo Yükle
                    </Button>
                  )}
                </div>
              </div>

              {/* Saat */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Canlı Saat (Sağ Üst)</p>
                  <p className="text-xs text-muted-foreground">Tarih ve saat göster</p>
                </div>
                <button
                  role="switch"
                  aria-checked={editForm.showClock}
                  onClick={() => setEditForm({ ...editForm, showClock: !editForm.showClock })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${editForm.showClock ? "bg-primary" : "bg-muted"}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg transition-transform ${editForm.showClock ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              {/* Kayan Yazı */}
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5 mb-1"><Type className="h-3.5 w-3.5" /> Kayan Yazı (Alt)</p>
                <Input
                  value={editForm.tickerText}
                  onChange={(e) => setEditForm({ ...editForm, tickerText: e.target.value })}
                  placeholder="ör: Şantiye360 — Merkez Konut — 248 Daire — Teslim 2027"
                  className="text-sm"
                />
                {editForm.tickerText && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Hız (px/sn)</Label>
                      <Input
                        type="number"
                        value={editForm.tickerSpeed}
                        onChange={(e) => setEditForm({ ...editForm, tickerSpeed: e.target.value })}
                        min="10" max="200"
                        className="text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* İlerleme Çubuğu */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> İlerleme Çubuğu</p>
                  <p className="text-xs text-muted-foreground">Alt kısımda ince ilerleme barı</p>
                </div>
                <button
                  role="switch"
                  aria-checked={editForm.showProgress}
                  onClick={() => setEditForm({ ...editForm, showProgress: !editForm.showProgress })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${editForm.showProgress ? "bg-primary" : "bg-muted"}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg transition-transform ${editForm.showProgress ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              {/* Geri Sayım Sayacı */}
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5 mb-1"><Timer className="h-3.5 w-3.5" /> Geri Sayım Sayacı</p>
                <p className="text-xs text-muted-foreground mb-2">Ekranda geri sayım sayacı göster</p>
                <Select
                  value={editForm.countdownTimerId || "none"}
                  onValueChange={(v) => setEditForm({ ...editForm, countdownTimerId: v === "none" ? "" : v })}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Sayaç seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sayaç Yok</SelectItem>
                    {countdownTimers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.emoji} {t.title} — {new Date(t.targetDate).toLocaleDateString("tr-TR")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>İptal</Button>
            <Button onClick={handleUpdate}>Kaydet</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Resim Yönetim Dialog ── */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{activePresentation?.name} — Resimler</span>
              {activePresentation && (
                <Link href={`/sunum-ekran/${activePresentation.id}`} target="_blank">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-3.5 w-3.5 mr-1" /> Tam Ekran
                  </Button>
                </Link>
              )}
            </DialogTitle>
          </DialogHeader>

          {activePresentation && (
            <div className="space-y-4 py-2">
              {/* Upload Area */}
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">
                  {uploading ? "Yükleniyor..." : "Resim Yükle"}
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  PNG, JPG, WEBP — Çoklu seçim desteklenir
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-3.5 w-3.5 mr-1" /> Dosya Seç
                </Button>
              </div>

              {/* Slides Grid */}
              {activePresentation.slides.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Henüz resim yüklenmemiş</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {activePresentation.slides.map((slide, idx) => (
                    <div key={slide.id} className="relative group rounded-lg overflow-hidden border bg-muted aspect-video">
                      <img
                        src={slide.imageUrl}
                        alt={slide.fileName || `Slayt ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDeleteSlide(slide.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1 text-white text-[10px] flex items-center gap-1">
                        <GripVertical className="h-3 w-3 opacity-50" />
                        <span>{idx + 1}</span>
                        {slide.fileName && <span className="truncate ml-1 opacity-70">{slide.fileName}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-xs text-muted-foreground pt-2 border-t">
                Toplam: {activePresentation.slides.length} resim · Mod: {modeLabels[activePresentation.mode]} · Süre: {activePresentation.interval}sn
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
