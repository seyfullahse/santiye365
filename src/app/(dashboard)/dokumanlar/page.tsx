/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, FolderOpen, Plus, Search, Filter, MoreHorizontal,
  Upload, Download, Share2, Trash2, Edit, Eye, Clock, CheckCircle2,
  AlertTriangle, Archive, FileCheck, FilePlus, FolderPlus,
  LayoutGrid, List, Tag, Building2, Layers, PenTool, FileSpreadsheet,
  ChevronRight, ArrowLeft, X,
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

/* ─── Sabitler ─────────────────────────────────────────── */
const CATEGORY_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  GENEL:      { label: "Genel",        color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",   icon: FileText },
  SOZLESME:   { label: "Sözleşme",     color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",       icon: FileCheck },
  TEKNIK:     { label: "Teknik",       color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300", icon: Layers },
  IDARI:      { label: "İdari",        color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",   icon: Building2 },
  ISG:        { label: "İSG",          color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",           icon: AlertTriangle },
  KALITE:     { label: "Kalite",       color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300", icon: CheckCircle2 },
  HUKUK:      { label: "Hukuk",        color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300", icon: FileCheck },
  MALZEME:    { label: "Malzeme",      color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300", icon: Tag },
  HAKEDIS:    { label: "Hakediş",      color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",       icon: FileSpreadsheet },
  TASERON:    { label: "Taşeron",      color: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",       icon: Building2 },
  SUNUM:      { label: "Sunum",        color: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",       icon: FileText },
  SABLONLAR:  { label: "Şablonlar",    color: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300", icon: FilePlus },
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  TASLAK:         { label: "Taslak",         color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  AKTIF:          { label: "Aktif",          color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
  ONAY_BEKLIYOR:  { label: "Onay Bekliyor",  color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  ONAYLANDI:      { label: "Onaylandı",      color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  ARSIVLENDI:     { label: "Arşivlendi",     color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  IPTAL:          { label: "İptal",          color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ─── Ana Sayfa ────────────────────────────────────────── */
export default function DokumanlarPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Filtreler
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([]);

  // Dialog
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form
  const [docForm, setDocForm] = useState({
    title: "", description: "", category: "GENEL", status: "TASLAK",
    projectId: "", isTemplate: false, requiresSign: false, tags: "",
    fileName: "", fileUrl: "", fileSize: 0, mimeType: "",
  });
  const [folderForm, setFolderForm] = useState({ name: "", description: "", color: "#6366f1", projectId: "" });
  const [shareForm, setShareForm] = useState({ sharedWithId: "", permission: "VIEW" });

  // Veri çekme
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const folderParam = currentFolderId || "root";
      const params = new URLSearchParams();
      params.set("folderId", folderParam);
      if (search) params.set("search", search);
      if (catFilter !== "ALL") params.set("category", catFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const [docsRes, foldersRes, statsRes] = await Promise.all([
        fetch(`/api/dokumanlar?${params}`),
        fetch(`/api/dokumanlar/klasorler?parentId=${folderParam}`),
        fetch("/api/dokumanlar/istatistikler"),
      ]);

      const [docsData, foldersData, statsData] = await Promise.all([
        docsRes.json(),
        foldersRes.json(),
        statsRes.json(),
      ]);

      setDocuments(Array.isArray(docsData) ? docsData : []);
      setFolders(Array.isArray(foldersData) ? foldersData : []);
      setStats(statsData);
    } catch {
      toast.error("Veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [currentFolderId, search, catFilter, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Proje ve kullanıcı listesi (dialog için)
  useEffect(() => {
    fetch("/api/projeler").then(r => r.json()).then(d => setProjects(Array.isArray(d) ? d : d.projects || [])).catch(() => {});
    fetch("/api/kullanicilar").then(r => r.json()).then(d => setUsers(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  // Klasöre gir
  const enterFolder = (folder: any) => {
    setFolderPath(prev => [...prev, { id: folder.id, name: folder.name }]);
    setCurrentFolderId(folder.id);
  };

  // Breadcrumb ile geri dön
  const goToFolder = (index: number) => {
    if (index < 0) {
      setFolderPath([]);
      setCurrentFolderId(null);
    } else {
      const newPath = folderPath.slice(0, index + 1);
      setFolderPath(newPath);
      setCurrentFolderId(newPath[newPath.length - 1].id);
    }
  };

  // Doküman oluştur
  const handleCreateDoc = async () => {
    if (!docForm.title.trim()) { toast.error("Başlık gerekli"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/dokumanlar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...docForm, folderId: currentFolderId }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Hata"); return; }
      toast.success("Doküman oluşturuldu");
      setDocDialogOpen(false);
      setDocForm({ title: "", description: "", category: "GENEL", status: "TASLAK", projectId: "", isTemplate: false, requiresSign: false, tags: "", fileName: "", fileUrl: "", fileSize: 0, mimeType: "" });
      fetchData();
    } catch { toast.error("Bir hata oluştu"); } finally { setSaving(false); }
  };

  // Klasör oluştur
  const handleCreateFolder = async () => {
    if (!folderForm.name.trim()) { toast.error("Klasör adı gerekli"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/dokumanlar/klasorler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...folderForm, parentId: currentFolderId }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Hata"); return; }
      toast.success("Klasör oluşturuldu");
      setFolderDialogOpen(false);
      setFolderForm({ name: "", description: "", color: "#6366f1", projectId: "" });
      fetchData();
    } catch { toast.error("Bir hata oluştu"); } finally { setSaving(false); }
  };

  // Doküman sil
  const handleDeleteDoc = async (id: string) => {
    if (!confirm("Bu dokümanı silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/dokumanlar/${id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Silinemedi"); return; }
      toast.success("Doküman silindi");
      fetchData();
    } catch { toast.error("Hata"); }
  };

  // Klasör sil
  const handleDeleteFolder = async (id: string) => {
    if (!confirm("Bu klasörü silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/dokumanlar/klasorler/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Silinemedi"); return; }
      toast.success("Klasör silindi");
      fetchData();
    } catch { toast.error("Hata"); }
  };

  // Paylaş
  const handleShare = async () => {
    if (!shareForm.sharedWithId || !selectedDoc) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/dokumanlar/${selectedDoc.id}/paylasimlar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shareForm),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Hata"); return; }
      toast.success("Doküman paylaşıldı");
      setShareDialogOpen(false);
      setShareForm({ sharedWithId: "", permission: "VIEW" });
    } catch { toast.error("Hata"); } finally { setSaving(false); }
  };

  // İmzala
  const handleSign = async (id: string) => {
    try {
      const res = await fetch(`/api/dokumanlar/${id}/imzala`, { method: "PUT" });
      if (!res.ok) { const d = await res.json(); toast.error(d.error || "Hata"); return; }
      toast.success("Doküman imzalandı");
      fetchData();
    } catch { toast.error("Hata"); }
  };

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Doküman Yönetimi</h1>
          <p className="text-sm text-muted-foreground">Dosya ve belge arşivleme sistemi</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setFolderDialogOpen(true)}>
            <FolderPlus className="h-4 w-4 mr-1.5" /> Yeni Klasör
          </Button>
          <Button size="sm" onClick={() => setDocDialogOpen(true)}>
            <FilePlus className="h-4 w-4 mr-1.5" /> Yeni Doküman
          </Button>
        </div>
      </div>

      {/* İstatistik Kartları */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalDocuments}</p>
                  <p className="text-[11px] text-muted-foreground">Toplam Doküman</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950">
                  <FolderOpen className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalFolders}</p>
                  <p className="text-[11px] text-muted-foreground">Klasör</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950">
                  <Layers className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalVersions}</p>
                  <p className="text-[11px] text-muted-foreground">Versiyon</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950">
                  <PenTool className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingSign}</p>
                  <p className="text-[11px] text-muted-foreground">İmza Bekleyen</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100 dark:bg-pink-950">
                  <FilePlus className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.templateCount}</p>
                  <p className="text-[11px] text-muted-foreground">Şablon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Breadcrumb + Filtreler */}
      <div className="flex flex-col gap-3">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm">
          <button onClick={() => goToFolder(-1)} className="text-primary hover:underline font-medium flex items-center gap-1">
            <FolderOpen className="h-3.5 w-3.5" /> Ana Dizin
          </button>
          {folderPath.map((fp, i) => (
            <span key={fp.id} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <button onClick={() => goToFolder(i)} className="text-primary hover:underline font-medium">
                {fp.name}
              </button>
            </span>
          ))}
        </div>

        {/* Filtre Bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Doküman ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tüm Kategoriler</SelectItem>
              {Object.entries(CATEGORY_MAP).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tüm Durumlar</SelectItem>
              {Object.entries(STATUS_MAP).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-1">
            <Button variant={viewMode === "list" ? "default" : "outline"} size="icon" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "grid" ? "default" : "outline"} size="icon" onClick={() => setViewMode("grid")}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Geri Dön */}
      {currentFolderId && (
        <Button variant="ghost" size="sm" onClick={() => goToFolder(folderPath.length - 2)} className="text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Üst Klasöre Dön
        </Button>
      )}

      {/* Klasörler */}
      {folders.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
            <FolderOpen className="h-4 w-4" /> Klasörler
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {folders.map((folder: any) => (
              <div
                key={folder.id}
                className="group relative flex flex-col items-center gap-1.5 p-3 rounded-xl border hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => enterFolder(folder)}
              >
                <FolderOpen className="h-10 w-10" style={{ color: folder.color || "#6366f1" }} />
                <span className="text-sm font-medium text-center truncate w-full">{folder.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {folder._count.documents} dosya • {folder._count.children} alt klasör
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={e => { e.stopPropagation(); handleDeleteFolder(folder.id); }} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" /> Sil
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
        </div>
      )}

      {/* Dokümanlar */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Yükleniyor...</div>
      ) : documents.length === 0 && folders.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-lg font-medium text-muted-foreground">Henüz doküman yok</p>
            <p className="text-sm text-muted-foreground mt-1">Yeni doküman veya klasör oluşturarak başlayın</p>
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setFolderDialogOpen(true)}>
                <FolderPlus className="h-4 w-4 mr-1.5" /> Klasör Oluştur
              </Button>
              <Button size="sm" onClick={() => setDocDialogOpen(true)}>
                <FilePlus className="h-4 w-4 mr-1.5" /> Doküman Oluştur
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === "list" ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doküman</TableHead>
                <TableHead className="hidden md:table-cell">Kategori</TableHead>
                <TableHead className="hidden sm:table-cell">Durum</TableHead>
                <TableHead className="hidden lg:table-cell">Versiyon</TableHead>
                <TableHead className="hidden lg:table-cell">Boyut</TableHead>
                <TableHead className="hidden md:table-cell">Oluşturan</TableHead>
                <TableHead className="hidden sm:table-cell">Tarih</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc: any) => {
                const cat = CATEGORY_MAP[doc.category] || CATEGORY_MAP.GENEL;
                const st = STATUS_MAP[doc.status] || STATUS_MAP.TASLAK;
                const lastVer = doc.versions?.[0];
                return (
                  <TableRow key={doc.id} className="cursor-pointer hover:bg-accent/50" onClick={() => router.push(`/dokumanlar/${doc.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <cat.icon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{doc.title}</p>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            {doc.isTemplate && <Badge variant="outline" className="text-[9px] px-1 py-0">Şablon</Badge>}
                            {doc.requiresSign && !doc.signedAt && <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-300 text-amber-600">İmza Bekliyor</Badge>}
                            {doc.signedAt && <Badge variant="outline" className="text-[9px] px-1 py-0 border-emerald-300 text-emerald-600">İmzalı</Badge>}
                            {doc._count.shares > 0 && <span className="flex items-center gap-0.5"><Share2 className="h-3 w-3" />{doc._count.shares}</span>}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary" className={`text-[10px] ${cat.color}`}>{cat.label}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary" className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      v{doc._count.versions}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {lastVer ? formatFileSize(lastVer.fileSize) : "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {doc.createdBy?.name}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {formatDate(doc.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={e => { e.stopPropagation(); router.push(`/dokumanlar/${doc.id}`); }}>
                            <Eye className="h-4 w-4 mr-2" /> Detay
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={e => { e.stopPropagation(); setSelectedDoc(doc); setShareDialogOpen(true); }}>
                            <Share2 className="h-4 w-4 mr-2" /> Paylaş
                          </DropdownMenuItem>
                          {doc.requiresSign && !doc.signedAt && (
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); handleSign(doc.id); }}>
                              <PenTool className="h-4 w-4 mr-2" /> İmzala
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={e => { e.stopPropagation(); handleDeleteDoc(doc.id); }} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" /> Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {documents.map((doc: any) => {
            const cat = CATEGORY_MAP[doc.category] || CATEGORY_MAP.GENEL;
            const st = STATUS_MAP[doc.status] || STATUS_MAP.TASLAK;
            return (
              <Card key={doc.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => router.push(`/dokumanlar/${doc.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${cat.color}`}>
                      <cat.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{doc.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{doc.createdBy?.name} • {formatDate(doc.updatedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3">
                    <Badge variant="secondary" className={`text-[10px] ${cat.color}`}>{cat.label}</Badge>
                    <Badge variant="secondary" className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                    {doc.requiresSign && !doc.signedAt && <PenTool className="h-3 w-3 text-amber-500 ml-auto" />}
                    {doc.signedAt && <CheckCircle2 className="h-3 w-3 text-emerald-500 ml-auto" />}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Doküman Oluştur Dialog */}
      <Dialog open={docDialogOpen} onOpenChange={setDocDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Doküman</DialogTitle>
            <DialogDescription>Yeni bir doküman kaydı oluşturun</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Başlık *</Label>
              <Input value={docForm.title} onChange={e => setDocForm(p => ({ ...p, title: e.target.value }))} placeholder="Doküman başlığı" />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Textarea value={docForm.description} onChange={e => setDocForm(p => ({ ...p, description: e.target.value }))} placeholder="Kısa açıklama" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kategori</Label>
                <Select value={docForm.category} onValueChange={v => setDocForm(p => ({ ...p, category: v }))}>
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
                <Select value={docForm.status} onValueChange={v => setDocForm(p => ({ ...p, status: v }))}>
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
              <Label>Proje</Label>
              <Select value={docForm.projectId || "none"} onValueChange={v => setDocForm(p => ({ ...p, projectId: v === "none" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Proje seçin (opsiyonel)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Proje seçilmedi</SelectItem>
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Etiketler</Label>
              <Input value={docForm.tags} onChange={e => setDocForm(p => ({ ...p, tags: e.target.value }))} placeholder="virgülle ayırın: güvenlik, kalite, rapor" />
            </div>
            <div>
              <Label>Dosya URL</Label>
              <Input value={docForm.fileUrl} onChange={e => setDocForm(p => ({ ...p, fileUrl: e.target.value }))} placeholder="https://... veya /uploads/..." />
            </div>
            {docForm.fileUrl && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Dosya Adı</Label>
                  <Input value={docForm.fileName} onChange={e => setDocForm(p => ({ ...p, fileName: e.target.value }))} placeholder="rapor.pdf" />
                </div>
                <div>
                  <Label>MIME Tipi</Label>
                  <Input value={docForm.mimeType} onChange={e => setDocForm(p => ({ ...p, mimeType: e.target.value }))} placeholder="application/pdf" />
                </div>
              </div>
            )}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={docForm.isTemplate} onChange={e => setDocForm(p => ({ ...p, isTemplate: e.target.checked }))} className="rounded border-gray-300" />
                Şablon olarak kaydet
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={docForm.requiresSign} onChange={e => setDocForm(p => ({ ...p, requiresSign: e.target.checked }))} className="rounded border-gray-300" />
                İmza gerektirir
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocDialogOpen(false)}>İptal</Button>
            <Button onClick={handleCreateDoc} disabled={saving}>{saving ? "Kaydediliyor..." : "Oluştur"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Klasör Oluştur Dialog */}
      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Klasör</DialogTitle>
            <DialogDescription>Yeni bir klasör oluşturun</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Klasör Adı *</Label>
              <Input value={folderForm.name} onChange={e => setFolderForm(p => ({ ...p, name: e.target.value }))} placeholder="Klasör adı" />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Textarea value={folderForm.description} onChange={e => setFolderForm(p => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Renk</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={folderForm.color} onChange={e => setFolderForm(p => ({ ...p, color: e.target.value }))} className="h-9 w-9 rounded border cursor-pointer" />
                  <Input value={folderForm.color} onChange={e => setFolderForm(p => ({ ...p, color: e.target.value }))} className="flex-1" />
                </div>
              </div>
              <div>
                <Label>Proje</Label>
                <Select value={folderForm.projectId || "none"} onValueChange={v => setFolderForm(p => ({ ...p, projectId: v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Opsiyonel" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Proje yok</SelectItem>
                    {projects.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderDialogOpen(false)}>İptal</Button>
            <Button onClick={handleCreateFolder} disabled={saving}>{saving ? "Kaydediliyor..." : "Oluştur"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Paylaş Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Doküman Paylaş</DialogTitle>
            <DialogDescription>{selectedDoc?.title} dokümanını paylaşın</DialogDescription>
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
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>İptal</Button>
            <Button onClick={handleShare} disabled={saving || !shareForm.sharedWithId}>{saving ? "Paylaşılıyor..." : "Paylaş"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
