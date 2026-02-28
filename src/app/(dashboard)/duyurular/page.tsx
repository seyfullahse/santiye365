"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Megaphone,
  Plus,
  Pin,
  Eye,
  EyeOff,
  Search,
  AlertTriangle,
  AlertCircle,
  Bell,
  Tag,
  Calendar,
  User,
  Clock,
  Trash2,
  Edit,
  CheckCircle2,
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
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  category: Category;
  priority: "NORMAL" | "IMPORTANT" | "URGENT";
  isPinned: boolean;
  targetType: "EVERYONE" | "ROLE_BASED" | "SPECIFIC_USERS";
  targetRoles: string[];
  author: { id: string; name: string };
  publishDate: string;
  expiresAt: string | null;
  isActive: boolean;
  isRead: boolean;
  readCount: number;
  createdAt: string;
}

/* ═══════ YARDIMCI ═══════ */
const priorityConfig: Record<string, { label: string; color: string; icon: typeof Bell }> = {
  NORMAL: { label: "Normal", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Bell },
  IMPORTANT: { label: "Önemli", color: "bg-orange-100 text-orange-700 border-orange-200", icon: AlertCircle },
  URGENT: { label: "Acil", color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle },
};

const targetLabels: Record<string, string> = {
  EVERYONE: "Herkes",
  ROLE_BASED: "Rol Bazlı",
  SPECIFIC_USERS: "Belirli Kişiler",
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Az önce";
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün önce`;
  return date.toLocaleDateString("tr-TR");
}

/* ═══════ ANA SAYFA ═══════ */
export default function DuyurularPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filtreler
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  // Dialoglar
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Düzenleme form
  const [editForm, setEditForm] = useState({
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

  /* ─── FETCH ─── */
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/duyurular/kategoriler");
      if (res.ok) setCategories(await res.json());
    } catch (err) {
      console.error("Kategori yükleme hatası:", err);
    }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "15" });
      if (filterCategory !== "all") params.set("categoryId", filterCategory);
      if (filterPriority !== "all") params.set("priority", filterPriority);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/duyurular?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      }
    } catch (err) {
      console.error("Duyuru yükleme hatası:", err);
    } finally {
      setLoading(false);
    }
  }, [page, filterCategory, filterPriority, searchQuery]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  /* ─── HANDLERS ─── */
  const handleDelete = async (id: string) => {
    if (!confirm("Bu duyuruyu silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/duyurular/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Duyuru silindi");
        setShowDetailDialog(false);
        fetchAnnouncements();
      }
    } catch {
      toast.error("Silme işlemi başarısız");
    }
  };

  const handleMarkRead = async (ann: Announcement) => {
    if (ann.isRead) return;
    try {
      await fetch(`/api/duyurular/${ann.id}/oku`, { method: "POST" });
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === ann.id ? { ...a, isRead: true, readCount: a.readCount + 1 } : a))
      );
    } catch {
      console.error("Okundu işareti hatası");
    }
  };

  const openDetail = (ann: Announcement) => {
    setSelectedAnnouncement(ann);
    setShowDetailDialog(true);
    handleMarkRead(ann);
  };

  const openEdit = (ann: Announcement) => {
    setEditForm({
      title: ann.title,
      content: ann.content,
      categoryId: ann.categoryId,
      priority: ann.priority,
      isPinned: ann.isPinned,
      targetType: ann.targetType,
      targetRoles: ann.targetRoles,
      publishDate: ann.publishDate ? new Date(ann.publishDate).toISOString().slice(0, 16) : "",
      expiresAt: ann.expiresAt ? new Date(ann.expiresAt).toISOString().slice(0, 16) : "",
    });
    setSelectedAnnouncement(ann);
    setShowEditDialog(true);
    setShowDetailDialog(false);
  };

  const handleUpdate = async () => {
    if (!selectedAnnouncement) return;
    if (!editForm.title.trim() || !editForm.content.trim()) {
      toast.error("Başlık ve içerik zorunludur");
      return;
    }
    try {
      const res = await fetch(`/api/duyurular/${selectedAnnouncement.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          publishDate: editForm.publishDate || undefined,
          expiresAt: editForm.expiresAt || undefined,
        }),
      });
      if (res.ok) {
        toast.success("Duyuru güncellendi");
        setShowEditDialog(false);
        fetchAnnouncements();
      } else {
        const err = await res.json();
        toast.error(err.error || "Güncelleme başarısız");
      }
    } catch {
      toast.error("İşlem sırasında bir hata oluştu");
    }
  };

  const handleTogglePin = async (ann: Announcement) => {
    try {
      const res = await fetch(`/api/duyurular/${ann.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !ann.isPinned }),
      });
      if (res.ok) {
        toast.success(ann.isPinned ? "Sabitleme kaldırıldı" : "Duyuru sabitlendi");
        fetchAnnouncements();
      }
    } catch {
      toast.error("İşlem başarısız");
    }
  };

  /* ─── İSTATİSTİKLER ─── */
  const unreadCount = announcements.filter((a) => !a.isRead).length;
  const pinnedCount = announcements.filter((a) => a.isPinned).length;
  const urgentCount = announcements.filter((a) => a.priority === "URGENT").length;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-7 w-7 text-sky-600" />
            Duyurular
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Şirket genelinde duyuru ve bildirim yönetimi
          </p>
        </div>
        <Link href="/duyurular/yeni">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Yeni Duyuru
          </Button>
        </Link>
      </div>

      {/* İSTATİSTİK KARTLARI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Megaphone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{total}</p>
                <p className="text-xs text-muted-foreground">Toplam Duyuru</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <EyeOff className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unreadCount}</p>
                <p className="text-xs text-muted-foreground">Okunmamış</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Pin className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pinnedCount}</p>
                <p className="text-xs text-muted-foreground">Sabitlenmiş</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{urgentCount}</p>
                <p className="text-xs text-muted-foreground">Acil Duyuru</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FİLTRELER */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Duyuru ara..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {categories.filter((c) => c.isActive).map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={(v) => { setFilterPriority(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Öncelik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Öncelikler</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="IMPORTANT">Önemli</SelectItem>
                <SelectItem value="URGENT">Acil</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* DUYURU LİSTESİ */}
      <div className="space-y-3">
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Yükleniyor...
            </CardContent>
          </Card>
        ) : announcements.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">Henüz duyuru bulunmuyor</p>
              <p className="text-sm mt-1">İlk duyuruyu oluşturmak için &quot;Yeni Duyuru&quot; butonunu kullanın</p>
            </CardContent>
          </Card>
        ) : (
          announcements.map((ann) => {
            const pConfig = priorityConfig[ann.priority];
            return (
              <Card
                key={ann.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  ann.isPinned ? "border-l-4 border-l-purple-500" : ""
                } ${!ann.isRead ? "bg-blue-50/50 dark:bg-blue-950/10" : ""}`}
                onClick={() => openDetail(ann)}
              >
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {ann.isPinned && <Pin className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />}
                        <h3 className={`font-semibold text-sm truncate ${!ann.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                          {ann.title}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{ann.content}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0" style={{ borderColor: ann.category.color, color: ann.category.color }}>
                          {ann.category.name}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${pConfig.color}`}>
                          {pConfig.label}
                        </Badge>
                        {ann.targetType !== "EVERYONE" && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {targetLabels[ann.targetType]}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end gap-2 text-[11px] text-muted-foreground flex-shrink-0">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(ann.publishDate)}</span>
                      <span className="flex items-center gap-1"><User className="h-3 w-3" />{ann.author.name}</span>
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{ann.readCount} kişi okudu</span>
                      {!ann.isRead && <Badge className="bg-blue-500 text-white text-[10px]">Yeni</Badge>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* SAYFALAMA */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Önceki</Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Sonraki</Button>
        </div>
      )}

      {/* ═══════ DUYURU DETAY DİALOG ═══════ */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedAnnouncement && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedAnnouncement.isPinned && <Pin className="h-4 w-4 text-purple-500" />}
                  {selectedAnnouncement.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" style={{ borderColor: selectedAnnouncement.category.color, color: selectedAnnouncement.category.color }}>
                    <Tag className="h-3 w-3 mr-1" />{selectedAnnouncement.category.name}
                  </Badge>
                  <Badge variant="outline" className={priorityConfig[selectedAnnouncement.priority].color}>
                    {priorityConfig[selectedAnnouncement.priority].label}
                  </Badge>
                  <Badge variant="secondary">{targetLabels[selectedAnnouncement.targetType]}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{selectedAnnouncement.author.name}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(selectedAnnouncement.publishDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{selectedAnnouncement.readCount} kişi okudu</span>
                </div>
                {selectedAnnouncement.expiresAt && (
                  <div className="text-xs text-amber-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" />Son geçerlilik: {new Date(selectedAnnouncement.expiresAt).toLocaleDateString("tr-TR")}
                  </div>
                )}
                <div className="border rounded-lg p-4 bg-muted/30 whitespace-pre-wrap text-sm leading-relaxed">
                  {selectedAnnouncement.content}
                </div>
                <div className="flex items-center gap-2">
                  {selectedAnnouncement.isRead ? (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />Okundu olarak işaretlendi
                    </span>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => {
                      handleMarkRead(selectedAnnouncement);
                      setSelectedAnnouncement({ ...selectedAnnouncement, isRead: true });
                    }}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Okundu İşaretle
                    </Button>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button size="sm" variant="outline" onClick={() => handleTogglePin(selectedAnnouncement)}>
                    <Pin className="h-3.5 w-3.5 mr-1" />{selectedAnnouncement.isPinned ? "Sabitlemeyi Kaldır" : "Sabitle"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(selectedAnnouncement)}>
                    <Edit className="h-3.5 w-3.5 mr-1" />Düzenle
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(selectedAnnouncement.id)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" />Sil
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════ DÜZENLEME DİALOG ═══════ */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Duyuruyu Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Başlık *</Label>
              <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
            <div>
              <Label>İçerik *</Label>
              <Textarea rows={5} value={editForm.content} onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Kategori</Label>
                <Select value={editForm.categoryId} onValueChange={(v) => setEditForm({ ...editForm, categoryId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.filter((c) => c.isActive).map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />{cat.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Öncelik</Label>
                <Select value={editForm.priority} onValueChange={(v) => setEditForm({ ...editForm, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Select value={editForm.targetType} onValueChange={(v) => setEditForm({ ...editForm, targetType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EVERYONE">Herkes</SelectItem>
                    <SelectItem value="ROLE_BASED">Rol Bazlı</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editForm.targetType === "ROLE_BASED" && (
                <div>
                  <Label>Hedef Roller</Label>
                  <div className="flex gap-3 mt-2">
                    <label className="flex items-center gap-1.5 text-sm">
                      <input type="checkbox" checked={editForm.targetRoles.includes("ADMIN")} onChange={(e) => {
                        const roles = e.target.checked ? [...editForm.targetRoles, "ADMIN"] : editForm.targetRoles.filter((r) => r !== "ADMIN");
                        setEditForm({ ...editForm, targetRoles: roles });
                      }} />Admin
                    </label>
                    <label className="flex items-center gap-1.5 text-sm">
                      <input type="checkbox" checked={editForm.targetRoles.includes("USER")} onChange={(e) => {
                        const roles = e.target.checked ? [...editForm.targetRoles, "USER"] : editForm.targetRoles.filter((r) => r !== "USER");
                        setEditForm({ ...editForm, targetRoles: roles });
                      }} />Kullanıcı
                    </label>
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Yayın Tarihi</Label>
                <Input type="datetime-local" value={editForm.publishDate} onChange={(e) => setEditForm({ ...editForm, publishDate: e.target.value })} />
              </div>
              <div>
                <Label>Bitiş Tarihi</Label>
                <Input type="datetime-local" value={editForm.expiresAt} onChange={(e) => setEditForm({ ...editForm, expiresAt: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="editPinned" checked={editForm.isPinned} onChange={(e) => setEditForm({ ...editForm, isPinned: e.target.checked })} />
              <Label htmlFor="editPinned" className="cursor-pointer">📌 Sabitle</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>İptal</Button>
              <Button onClick={handleUpdate}>Güncelle</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
