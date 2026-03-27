/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, FileText, Clock, Share2, PenTool, Trash2, Edit,
  Download, Upload, Plus, Eye, User, Calendar, Tag, FolderOpen,
  Building2, CheckCircle2, AlertTriangle, Layers, MoreHorizontal, X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  GENEL: { label: "Genel", color: "bg-slate-100 text-slate-700" },
  SOZLESME: { label: "Sözleşme", color: "bg-blue-100 text-blue-700" },
  TEKNIK: { label: "Teknik", color: "bg-purple-100 text-purple-700" },
  IDARI: { label: "İdari", color: "bg-amber-100 text-amber-700" },
  ISG: { label: "İSG", color: "bg-red-100 text-red-700" },
  KALITE: { label: "Kalite", color: "bg-emerald-100 text-emerald-700" },
  HUKUK: { label: "Hukuk", color: "bg-indigo-100 text-indigo-700" },
  MALZEME: { label: "Malzeme", color: "bg-orange-100 text-orange-700" },
  HAKEDIS: { label: "Hakediş", color: "bg-cyan-100 text-cyan-700" },
  TASERON: { label: "Taşeron", color: "bg-pink-100 text-pink-700" },
  SUNUM: { label: "Sunum", color: "bg-teal-100 text-teal-700" },
  SABLONLAR: { label: "Şablonlar", color: "bg-violet-100 text-violet-700" },
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  TASLAK: { label: "Taslak", color: "bg-gray-100 text-gray-700" },
  AKTIF: { label: "Aktif", color: "bg-emerald-100 text-emerald-700" },
  ONAY_BEKLIYOR: { label: "Onay Bekliyor", color: "bg-amber-100 text-amber-700" },
  ONAYLANDI: { label: "Onaylandı", color: "bg-blue-100 text-blue-700" },
  ARSIVLENDI: { label: "Arşivlendi", color: "bg-slate-100 text-slate-600" },
  IPTAL: { label: "İptal", color: "bg-red-100 text-red-700" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DokumanDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);

  // Dialog
  const [editOpen, setEditOpen] = useState(false);
  const [versionOpen, setVersionOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form
  const [editForm, setEditForm] = useState<any>({});
  const [versionForm, setVersionForm] = useState({ fileName: "", fileUrl: "", fileSize: 0, mimeType: "", changeNote: "" });
  const [shareForm, setShareForm] = useState({ sharedWithId: "", permission: "VIEW" });

  const fetchDoc = useCallback(async () => {
    try {
      const res = await fetch(`/api/dokumanlar/${id}`);
      if (!res.ok) { toast.error("Doküman bulunamadı"); router.push("/dokumanlar"); return; }
      const data = await res.json();
      setDoc(data);
      setEditForm({
        title: data.title, description: data.description || "",
        category: data.category, status: data.status,
        projectId: data.projectId || "", isTemplate: data.isTemplate,
        requiresSign: data.requiresSign, tags: (data.tags || []).join(", "),
      });
    } catch {
      toast.error("Hata oluştu");
    } finally { setLoading(false); }
  }, [id, router]);

  useEffect(() => { fetchDoc(); }, [fetchDoc]);
  useEffect(() => {
    fetch("/api/kullanicilar").then(r => r.json()).then(d => setUsers(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  // Güncelle
  const handleUpdate = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/dokumanlar/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Hata"); return; }
      toast.success("Doküman güncellendi");
      setEditOpen(false);
      fetchDoc();
    } catch { toast.error("Hata"); } finally { setSaving(false); }
  };

  // Yeni Versiyon
  const handleNewVersion = async () => {
    if (!versionForm.fileName || !versionForm.fileUrl) { toast.error("Dosya adı ve URL gerekli"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/dokumanlar/${id}/versiyonlar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(versionForm),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Hata"); return; }
      toast.success("Yeni versiyon eklendi");
      setVersionOpen(false);
      setVersionForm({ fileName: "", fileUrl: "", fileSize: 0, mimeType: "", changeNote: "" });
      fetchDoc();
    } catch { toast.error("Hata"); } finally { setSaving(false); }
  };

  // Paylaş
  const handleShare = async () => {
    if (!shareForm.sharedWithId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/dokumanlar/${id}/paylasimlar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shareForm),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Hata"); return; }
      toast.success("Paylaşıldı");
      setShareOpen(false);
      setShareForm({ sharedWithId: "", permission: "VIEW" });
      fetchDoc();
    } catch { toast.error("Hata"); } finally { setSaving(false); }
  };

  // Paylaşımı kaldır
  const handleRemoveShare = async (shareId: string) => {
    try {
      const res = await fetch(`/api/dokumanlar/${id}/paylasimlar?shareId=${shareId}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Hata"); return; }
      toast.success("Paylaşım kaldırıldı");
      fetchDoc();
    } catch { toast.error("Hata"); }
  };

  // İmzala
  const handleSign = async () => {
    try {
      const res = await fetch(`/api/dokumanlar/${id}/imzala`, { method: "PUT" });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Hata"); return; }
      toast.success("Doküman imzalandı");
      fetchDoc();
    } catch { toast.error("Hata"); }
  };

  // Sil
  const handleDelete = async () => {
    if (!confirm("Bu dokümanı silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/dokumanlar/${id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Silinemedi"); return; }
      toast.success("Doküman silindi");
      router.push("/dokumanlar");
    } catch { toast.error("Hata"); }
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Yükleniyor...</div>;
  if (!doc) return null;

  const cat = CATEGORY_MAP[doc.category] || CATEGORY_MAP.GENEL;
  const st = STATUS_MAP[doc.status] || STATUS_MAP.TASLAK;

  return (
    <div className="space-y-6">
      {/* Üst Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dokumanlar")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{doc.title}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className={`text-[10px] ${cat.color}`}>{cat.label}</Badge>
              <Badge variant="secondary" className={`text-[10px] ${st.color}`}>{st.label}</Badge>
              {doc.isTemplate && <Badge variant="outline" className="text-[10px]">Şablon</Badge>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {doc.requiresSign && !doc.signedAt && (
            <Button size="sm" variant="outline" onClick={handleSign} className="text-amber-600 border-amber-300 hover:bg-amber-50">
              <PenTool className="h-4 w-4 mr-1.5" /> İmzala
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setShareOpen(true)}>
            <Share2 className="h-4 w-4 mr-1.5" /> Paylaş
          </Button>
          <Button size="sm" variant="outline" onClick={() => setVersionOpen(true)}>
            <Upload className="h-4 w-4 mr-1.5" /> Yeni Versiyon
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            <Edit className="h-4 w-4 mr-1.5" /> Düzenle
          </Button>
          <Button size="sm" variant="outline" onClick={handleDelete} className="text-red-600 border-red-200 hover:bg-red-50">
            <Trash2 className="h-4 w-4 mr-1.5" /> Sil
          </Button>
        </div>
      </div>

      {/* İmza Durumu Banner */}
      {doc.requiresSign && (
        <Card className={doc.signedAt ? "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-amber-200 bg-amber-50/50 dark:bg-amber-950/20"}>
          <CardContent className="py-3 px-4 flex items-center gap-3">
            {doc.signedAt ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">İmzalandı</p>
                  <p className="text-[11px] text-emerald-600">{doc.signedBy?.name} tarafından — {formatDate(doc.signedAt)}</p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">İmza Bekliyor</p>
                  <p className="text-[11px] text-amber-600">Bu doküman imza gerektirmektedir</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="bilgiler" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bilgiler">Bilgiler</TabsTrigger>
          <TabsTrigger value="versiyonlar">
            Versiyonlar <Badge variant="secondary" className="ml-1.5 text-[10px]">{doc.versions?.length || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="paylasimlar">
            Paylaşımlar <Badge variant="secondary" className="ml-1.5 text-[10px]">{doc.shares?.length || 0}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Bilgiler */}
        <TabsContent value="bilgiler">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Detaylar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {doc.description && (
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Açıklama</p>
                    <p className="text-sm mt-0.5">{doc.description}</p>
                  </div>
                )}
                <Separator />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[11px] text-muted-foreground">Kategori</p>
                    <Badge variant="secondary" className={`mt-1 text-[10px] ${cat.color}`}>{cat.label}</Badge>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Durum</p>
                    <Badge variant="secondary" className={`mt-1 text-[10px] ${st.color}`}>{st.label}</Badge>
                  </div>
                  {doc.folder && (
                    <div>
                      <p className="text-[11px] text-muted-foreground">Klasör</p>
                      <p className="flex items-center gap-1 mt-1"><FolderOpen className="h-3.5 w-3.5" /> {doc.folder.name}</p>
                    </div>
                  )}
                  {doc.project && (
                    <div>
                      <p className="text-[11px] text-muted-foreground">Proje</p>
                      <p className="flex items-center gap-1 mt-1"><Building2 className="h-3.5 w-3.5" /> {doc.project.name}</p>
                    </div>
                  )}
                </div>
                {doc.tags && doc.tags.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-[11px] text-muted-foreground mb-1.5">Etiketler</p>
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.map((t: string) => (
                          <Badge key={t} variant="outline" className="text-[10px]"><Tag className="h-2.5 w-2.5 mr-0.5" /> {t}</Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Geçmiş</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Oluşturan</p>
                    <p className="font-medium">{doc.createdBy?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Oluşturulma</p>
                    <p>{formatDate(doc.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Son Güncelleme</p>
                    <p>{formatDate(doc.updatedAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Versiyonlar</p>
                    <p>{doc.versions?.length || 0} versiyon</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Paylaşımlar</p>
                    <p>{doc.shares?.length || 0} kişi ile paylaşıldı</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Versiyonlar */}
        <TabsContent value="versiyonlar">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Versiyon Geçmişi</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setVersionOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Yeni Versiyon
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {doc.versions && doc.versions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Versiyon</TableHead>
                      <TableHead>Dosya</TableHead>
                      <TableHead className="hidden sm:table-cell">Boyut</TableHead>
                      <TableHead className="hidden md:table-cell">MIME</TableHead>
                      <TableHead className="hidden md:table-cell">Yükleyen</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead className="hidden lg:table-cell">Not</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doc.versions.map((v: any, i: number) => (
                      <TableRow key={v.id}>
                        <TableCell>
                          <Badge variant={i === 0 ? "default" : "outline"} className="text-[10px]">
                            v{v.versionNo}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium">{v.fileName}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{formatFileSize(v.fileSize)}</TableCell>
                        <TableCell className="hidden md:table-cell text-[11px] text-muted-foreground">{v.mimeType || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{v.uploadedBy?.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(v.createdAt)}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-[200px] truncate">{v.changeNote || "—"}</TableCell>
                        <TableCell>
                          {v.fileUrl && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                              <a href={v.fileUrl} target="_blank" rel="noreferrer"><Download className="h-3.5 w-3.5" /></a>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Layers className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Henüz versiyon yüklenmemiş</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Paylaşımlar */}
        <TabsContent value="paylasimlar">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Paylaşımlar</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShareOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Paylaş
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {doc.shares && doc.shares.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kullanıcı</TableHead>
                      <TableHead>Erişim</TableHead>
                      <TableHead className="hidden sm:table-cell">Paylaşan</TableHead>
                      <TableHead className="hidden sm:table-cell">Tarih</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doc.shares.map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                              {s.sharedWith?.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{s.sharedWith?.name}</p>
                              <p className="text-[11px] text-muted-foreground">{s.sharedWith?.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {s.permission === "VIEW" ? "Görüntüleme" : s.permission === "EDIT" ? "Düzenleme" : "Tam Yetki"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{s.sharedBy?.name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{formatDate(s.createdAt)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => handleRemoveShare(s.id)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Share2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Henüz kimseyle paylaşılmamış</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Düzenle Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Doküman Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Başlık *</Label>
              <Input value={editForm.title || ""} onChange={e => setEditForm((p: any) => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Textarea value={editForm.description || ""} onChange={e => setEditForm((p: any) => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kategori</Label>
                <Select value={editForm.category} onValueChange={v => setEditForm((p: any) => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_MAP).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Durum</Label>
                <Select value={editForm.status} onValueChange={v => setEditForm((p: any) => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_MAP).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Etiketler</Label>
              <Input value={editForm.tags || ""} onChange={e => setEditForm((p: any) => ({ ...p, tags: e.target.value }))} placeholder="virgülle ayırın" />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={editForm.isTemplate || false} onChange={e => setEditForm((p: any) => ({ ...p, isTemplate: e.target.checked }))} className="rounded" />
                Şablon
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={editForm.requiresSign || false} onChange={e => setEditForm((p: any) => ({ ...p, requiresSign: e.target.checked }))} className="rounded" />
                İmza Gerektirir
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>İptal</Button>
            <Button onClick={handleUpdate} disabled={saving}>{saving ? "Kaydediliyor..." : "Güncelle"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Yeni Versiyon Dialog */}
      <Dialog open={versionOpen} onOpenChange={setVersionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Versiyon Yükle</DialogTitle>
            <DialogDescription>Dokümanın yeni bir versiyonunu ekleyin</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Dosya Adı *</Label>
              <Input value={versionForm.fileName} onChange={e => setVersionForm(p => ({ ...p, fileName: e.target.value }))} placeholder="rapor-v2.pdf" />
            </div>
            <div>
              <Label>Dosya URL *</Label>
              <Input value={versionForm.fileUrl} onChange={e => setVersionForm(p => ({ ...p, fileUrl: e.target.value }))} placeholder="https://... veya /uploads/..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Boyut (byte)</Label>
                <Input type="number" value={versionForm.fileSize} onChange={e => setVersionForm(p => ({ ...p, fileSize: parseInt(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label>MIME Tipi</Label>
                <Input value={versionForm.mimeType} onChange={e => setVersionForm(p => ({ ...p, mimeType: e.target.value }))} placeholder="application/pdf" />
              </div>
            </div>
            <div>
              <Label>Değişiklik Notu</Label>
              <Textarea value={versionForm.changeNote} onChange={e => setVersionForm(p => ({ ...p, changeNote: e.target.value }))} placeholder="Bu versiyonda neler değişti?" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVersionOpen(false)}>İptal</Button>
            <Button onClick={handleNewVersion} disabled={saving}>{saving ? "Yükleniyor..." : "Versiyon Ekle"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Paylaş Dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Doküman Paylaş</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Kullanıcı</Label>
              <Select value={shareForm.sharedWithId || "none"} onValueChange={v => setShareForm(p => ({ ...p, sharedWithId: v === "none" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Kullanıcı seçin" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Seçiniz</SelectItem>
                  {users.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Erişim Seviyesi</Label>
              <Select value={shareForm.permission} onValueChange={v => setShareForm(p => ({ ...p, permission: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIEW">Görüntüleme</SelectItem>
                  <SelectItem value="EDIT">Düzenleme</SelectItem>
                  <SelectItem value="ADMIN">Tam Yetki</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareOpen(false)}>İptal</Button>
            <Button onClick={handleShare} disabled={saving || !shareForm.sharedWithId}>{saving ? "Paylaşılıyor..." : "Paylaş"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
