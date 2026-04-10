// @ts-nocheck
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Save,
  ChevronDown,
  ChevronRight,
  GripVertical,
  FileSpreadsheet,
  Copy,
  Settings,
  Loader2,
  ArrowUp,
  ArrowDown,
  ListPlus,
  Download,
  Pencil,
  Check,
  X,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

/* ─── Tipler ─── */
interface Discipline {
  id: string;
  name: string;
}

interface Floor {
  id: string;
  name: string;
  orderNo: number;
  zone?: { id: string; name: string };
}

interface ImalatKalemi {
  id: string;
  siraNo: number;
  imalatAciklama: string;
  yer: string;
  disciplineId: string | null;
  discipline: Discipline | null;
  projeDurumu: string;
  imalatDurumu: string;
  aksiyon: string | null;
  sorumlu: string | null;
  ilgiliTaseron: string | null;
  notlar: string | null;
}

interface ImalatMahal {
  id: string;
  name: string;
  sortOrder: number;
  floorId: string;
  floor: { id: string; name: string };
  kalemler: ImalatKalemi[];
  _count: { kalemler: number };
}

interface ImalatSablon {
  id: string;
  aciklama: string;
  yer: string;
  disiplinAdi: string | null;
  varsayilanSira: number;
}

/* ─── Sabitler ─── */
const YER_LABELS: Record<string, string> = {
  DUVAR: "Duvar",
  TAVAN: "Tavan",
  DOSEME: "Döşeme",
  DUVAR_TAVAN: "Duvar + Tavan",
  ALIN_SAKAL: "Alın + Sakallalar",
  GENEL: "Genel",
  DIGER: "Diğer",
};

const PROJE_DURUMU_LABELS: Record<string, string> = {
  GECERLI: "Geçerli",
  IPTAL: "İptal",
  REVIZE: "Revize",
};

const IMALAT_DURUMU_LABELS: Record<string, string> = {
  YAPILMADI: "Yapılmadı",
  YAPILIYOR: "Yapılıyor",
  TAMAMLANDI: "Tamamlandı",
};

const IMALAT_DURUMU_COLORS: Record<string, string> = {
  YAPILMADI: "bg-red-100 text-red-800",
  YAPILIYOR: "bg-yellow-100 text-yellow-800",
  TAMAMLANDI: "bg-green-100 text-green-800",
};

/* ─── Sayfa ─── */
export default function ImalatTakipPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [mahaller, setMahaller] = useState<ImalatMahal[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [sablonlar, setSablonlar] = useState<ImalatSablon[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedFloorId, setSelectedFloorId] = useState<string>("");
  const [expandedMahals, setExpandedMahals] = useState<Set<string>>(new Set());

  // Dialog state
  const [showAddMahal, setShowAddMahal] = useState(false);
  const [showAddKalem, setShowAddKalem] = useState(false);
  const [showSablonlar, setShowSablonlar] = useState(false);
  const [activeMahalId, setActiveMahalId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Add mahal form
  const [newMahalName, setNewMahalName] = useState("");
  const [newMahalFloorId, setNewMahalFloorId] = useState("");
  const [selectedSablonIds, setSelectedSablonIds] = useState<string[]>([]);

  // Add kalem form
  const [newKalemAciklama, setNewKalemAciklama] = useState("");
  const [newKalemYer, setNewKalemYer] = useState("DIGER");
  const [newKalemDisciplineId, setNewKalemDisciplineId] = useState("");
  const [newKalemSorumlu, setNewKalemSorumlu] = useState("");
  const [newKalemTaseron, setNewKalemTaseron] = useState("");

  // Şablon form
  const [newSablonAciklama, setNewSablonAciklama] = useState("");
  const [newSablonYer, setNewSablonYer] = useState("DIGER");
  const [newSablonDisiplin, setNewSablonDisiplin] = useState("");

  // Seed import
  const [showSeedDialog, setShowSeedDialog] = useState(false);
  const [seedFloorId, setSeedFloorId] = useState("");
  const [seeding, setSeeding] = useState(false);

  // Edit mode - sadece aktif satır edit edilebilir
  const [editingKalemId, setEditingKalemId] = useState<string | null>(null);

  // Mahal yeniden adlandırma
  const [renamingMahalId, setRenamingMahalId] = useState<string | null>(null);
  const [renamingMahalName, setRenamingMahalName] = useState("");

  /* ─── Hazır Veri Yükleme (Seed) ─── */
  const handleSeedImport = async () => {
    if (!seedFloorId) {
      toast.error("Lütfen bir kat seçin");
      return;
    }
    setSeeding(true);
    try {
      const res = await fetch(`/api/projeler/${projectId}/imalat-takip/seed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ floorId: seedFloorId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Seed import başarısız");
      toast.success(`${data.mahalCount} mahal, ${data.kalemCount} kalem ve ${data.sablonCount} şablon yüklendi`);
      setShowSeedDialog(false);
      setSeedFloorId("");
      if (selectedFloorId && selectedFloorId !== "all" && selectedFloorId !== seedFloorId) {
        setSelectedFloorId(seedFloorId);
      }
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Seed import sırasında hata oluştu");
    } finally {
      setSeeding(false);
    }
  };

  /* ─── Veri Yükleme ─── */
  const loadData = useCallback(async () => {
    try {
      const floorParam = selectedFloorId && selectedFloorId !== "all" ? `?floorId=${selectedFloorId}` : "";
      const [mahRes, floorRes, discRes, sabRes] = await Promise.all([
        fetch(`/api/projeler/${projectId}/imalat-takip/mahaller${floorParam}`),
        fetch(`/api/katlar?projectId=${projectId}`),
        fetch(`/api/disiplinler`),
        fetch(`/api/projeler/${projectId}/imalat-takip/sablonlar`),
      ]);
      if (mahRes.ok) setMahaller(await mahRes.json());
      if (floorRes.ok) {
        const floorData = await floorRes.json();
        setFloors(Array.isArray(floorData) ? floorData : floorData.floors || []);
      }
      if (discRes.ok) {
        const discData = await discRes.json();
        setDisciplines(Array.isArray(discData) ? discData : []);
      }
      if (sabRes.ok) setSablonlar(await sabRes.json());
    } catch (err) {
      console.error(err);
      toast.error("Veriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedFloorId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ─── Toggle Mahal ─── */
  const toggleMahal = (id: string) => {
    setExpandedMahals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedMahals(new Set(mahaller.map((m) => m.id)));
  };

  const collapseAll = () => {
    setExpandedMahals(new Set());
  };

  /* ─── Mahal Adı Değiştir ─── */
  const handleRenameMahal = async (mahalId: string) => {
    const trimmed = renamingMahalName.trim();
    if (!trimmed) {
      toast.error("Mahal adı boş olamaz");
      return;
    }
    try {
      const res = await fetch(`/api/projeler/${projectId}/imalat-takip/mahaller/${mahalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error();
      toast.success("Mahal adı güncellendi");
      setRenamingMahalId(null);
      setRenamingMahalName("");
      loadData();
    } catch {
      toast.error("Mahal adı güncellenemedi");
    }
  };

  /* ─── Mahal Ekle ─── */
  const handleAddMahal = async () => {
    if (!newMahalName.trim() || !newMahalFloorId) {
      toast.error("Mahal adı ve kat seçimi zorunludur");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/projeler/${projectId}/imalat-takip/mahaller`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newMahalName.trim(),
          floorId: newMahalFloorId,
          sablonIds: selectedSablonIds.length > 0 ? selectedSablonIds : undefined,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Mahal eklendi");
      setShowAddMahal(false);
      setNewMahalName("");
      setNewMahalFloorId("");
      setSelectedSablonIds([]);
      loadData();
    } catch {
      toast.error("Mahal eklenemedi");
    } finally {
      setSaving(false);
    }
  };

  /* ─── Mahal Sil ─── */
  const handleDeleteMahal = async (mahalId: string) => {
    if (!confirm("Bu mahal ve tüm imalat kalemleri silinecek. Emin misiniz?")) return;
    try {
      const res = await fetch(`/api/projeler/${projectId}/imalat-takip/mahaller/${mahalId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Mahal silindi");
      loadData();
    } catch {
      toast.error("Mahal silinemedi");
    }
  };

  /* ─── Kalem Ekle ─── */
  const handleAddKalem = async () => {
    if (!newKalemAciklama.trim() || !activeMahalId) {
      toast.error("İmalat açıklaması zorunludur");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/projeler/${projectId}/imalat-takip/kalemler`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imalatMahalId: activeMahalId,
          imalatAciklama: newKalemAciklama.trim(),
          yer: newKalemYer,
          disciplineId: newKalemDisciplineId || null,
          sorumlu: newKalemSorumlu || null,
          ilgiliTaseron: newKalemTaseron || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("İmalat kalemi eklendi");
      setShowAddKalem(false);
      setNewKalemAciklama("");
      setNewKalemYer("DIGER");
      setNewKalemDisciplineId("");
      setNewKalemSorumlu("");
      setNewKalemTaseron("");
      loadData();
    } catch {
      toast.error("İmalat kalemi eklenemedi");
    } finally {
      setSaving(false);
    }
  };

  /* ─── Kalem Güncelle (inline) ─── */
  const handleUpdateKalem = async (kalemId: string, data: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/projeler/${projectId}/imalat-takip/kalemler`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: kalemId, ...data }),
      });
      if (!res.ok) throw new Error();
      loadData();
    } catch {
      toast.error("Güncelleme başarısız");
    }
  };

  /* ─── Kalem Sil ─── */
  const handleDeleteKalem = async (kalemId: string) => {
    try {
      const res = await fetch(`/api/projeler/${projectId}/imalat-takip/kalemler?kalemId=${kalemId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("İmalat kalemi silindi");
      loadData();
    } catch {
      toast.error("Silinemedi");
    }
  };

  /* ─── Sıra Değiştir ─── */
  const moveKalem = async (mahalId: string, kalemId: string, direction: "up" | "down") => {
    const mahal = mahaller.find((m) => m.id === mahalId);
    if (!mahal) return;
    const kalemler = [...mahal.kalemler].sort((a, b) => a.siraNo - b.siraNo);
    const idx = kalemler.findIndex((k) => k.id === kalemId);
    if ((direction === "up" && idx === 0) || (direction === "down" && idx === kalemler.length - 1)) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const reorder = kalemler.map((k, i) => {
      if (i === idx) return { id: k.id, siraNo: kalemler[swapIdx].siraNo };
      if (i === swapIdx) return { id: k.id, siraNo: kalemler[idx].siraNo };
      return { id: k.id, siraNo: k.siraNo };
    });

    try {
      await fetch(`/api/projeler/${projectId}/imalat-takip/kalemler`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reorder }),
      });
      loadData();
    } catch {
      toast.error("Sıralama değiştirilemedi");
    }
  };

  /* ─── Şablon Ekle ─── */
  const handleAddSablon = async () => {
    if (!newSablonAciklama.trim()) {
      toast.error("Açıklama zorunludur");
      return;
    }
    try {
      const res = await fetch(`/api/projeler/${projectId}/imalat-takip/sablonlar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aciklama: newSablonAciklama.trim(),
          yer: newSablonYer,
          disiplinAdi: newSablonDisiplin || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Şablon eklendi");
      setNewSablonAciklama("");
      setNewSablonYer("DIGER");
      setNewSablonDisiplin("");
      loadData();
    } catch {
      toast.error("Şablon eklenemedi");
    }
  };

  const handleDeleteSablon = async (sablonId: string) => {
    try {
      await fetch(`/api/projeler/${projectId}/imalat-takip/sablonlar?sablonId=${sablonId}`, {
        method: "DELETE",
      });
      toast.success("Şablon silindi");
      loadData();
    } catch {
      toast.error("Şablon silinemedi");
    }
  };

  /* ─── Mahal Kopyala ─── */
  const handleCopyMahal = async (mahal: ImalatMahal) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projeler/${projectId}/imalat-takip/mahaller`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${mahal.name} (Kopya)`,
          floorId: mahal.floorId,
        }),
      });
      if (!res.ok) throw new Error();
      const newMahal = await res.json();

      // Kalemleri kopyala
      for (const kalem of mahal.kalemler) {
        await fetch(`/api/projeler/${projectId}/imalat-takip/kalemler`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imalatMahalId: newMahal.id,
            imalatAciklama: kalem.imalatAciklama,
            yer: kalem.yer,
            disciplineId: kalem.disciplineId,
            siraNo: kalem.siraNo,
            sorumlu: kalem.sorumlu,
            ilgiliTaseron: kalem.ilgiliTaseron,
          }),
        });
      }

      toast.success("Mahal kopyalandı");
      loadData();
    } catch {
      toast.error("Mahal kopyalanamadı");
    } finally {
      setSaving(false);
    }
  };

  /* ─── İstatistikler ─── */
  const totalKalem = mahaller.reduce((sum, m) => sum + m.kalemler.length, 0);
  const tamamlanan = mahaller.reduce(
    (sum, m) => sum + m.kalemler.filter((k) => k.imalatDurumu === "TAMAMLANDI").length,
    0
  );
  const yapiliyor = mahaller.reduce(
    (sum, m) => sum + m.kalemler.filter((k) => k.imalatDurumu === "YAPILIYOR").length,
    0
  );
  const yapilmadi = mahaller.reduce(
    (sum, m) => sum + m.kalemler.filter((k) => k.imalatDurumu === "YAPILMADI").length,
    0
  );
  const progress = totalKalem > 0 ? Math.round((tamamlanan / totalKalem) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Başlık ─── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">İmalat Takip</h2>
          <p className="text-muted-foreground text-sm">Mahal bazlı imalat durumlarını takip edin</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/projeler/${projectId}/imalat-takip/sunum`}>
              <Monitor className="h-4 w-4 mr-1" /> Sunum Modu
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowSeedDialog(true)}>
            <Download className="h-4 w-4 mr-1" /> Hazır Verileri Yükle
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowSablonlar(true)}>
            <Settings className="h-4 w-4 mr-1" /> Şablonlar
          </Button>
          <Button size="sm" onClick={() => { setShowAddMahal(true); setNewMahalFloorId(selectedFloorId); }}>
            <Plus className="h-4 w-4 mr-1" /> Yeni Mahal
          </Button>
        </div>
      </div>

      {/* ─── İstatistik Kartları ─── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{mahaller.length}</div>
            <div className="text-xs text-muted-foreground">Mahal</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{totalKalem}</div>
            <div className="text-xs text-muted-foreground">Toplam İmalat</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{tamamlanan}</div>
            <div className="text-xs text-muted-foreground">Tamamlandı</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{yapiliyor}</div>
            <div className="text-xs text-muted-foreground">Yapılıyor</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">%{progress}</div>
            <div className="text-xs text-muted-foreground">İlerleme</div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Filtre ve Toolbar ─── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <Label className="text-sm whitespace-nowrap">Kat Filtresi:</Label>
          <Select value={selectedFloorId} onValueChange={setSelectedFloorId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tüm Katlar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Katlar</SelectItem>
              {floors.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 ml-auto">
          <Button variant="ghost" size="sm" onClick={expandAll}>
            Tümünü Aç
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll}>
            Tümünü Kapat
          </Button>
        </div>
      </div>

      {/* ─── Mahal Listesi ─── */}
      {mahaller.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground space-y-3">
            <p>Henüz imalat mahali eklenmemiş.</p>
            <p className="text-sm">Yukarıdaki &quot;Yeni Mahal&quot; butonunu kullanarak başlayın veya hazır verileri yükleyin.</p>
            <Button variant="outline" onClick={() => setShowSeedDialog(true)}>
              <Download className="h-4 w-4 mr-1" /> Hazır Verileri Yükle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {mahaller.map((mahal) => {
            const isExpanded = expandedMahals.has(mahal.id);
            const mahalTamamlanan = mahal.kalemler.filter((k) => k.imalatDurumu === "TAMAMLANDI").length;
            const mahalTotal = mahal.kalemler.length;
            const mahalProgress = mahalTotal > 0 ? Math.round((mahalTamamlanan / mahalTotal) * 100) : 0;

            return (
              <Card key={mahal.id}>
                {/* Mahal Başlık */}
                <div
                  className="group flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleMahal(mahal.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {renamingMahalId === mahal.id ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Input
                            className="h-8 text-base font-semibold w-[250px]"
                            value={renamingMahalName}
                            onChange={(e) => setRenamingMahalName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRenameMahal(mahal.id);
                              if (e.key === "Escape") { setRenamingMahalId(null); setRenamingMahalName(""); }
                            }}
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-green-600"
                            onClick={() => handleRenameMahal(mahal.id)}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground"
                            onClick={() => { setRenamingMahalId(null); setRenamingMahalName(""); }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="font-semibold text-base">{mahal.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Adı Düzenle"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenamingMahalId(mahal.id);
                              setRenamingMahalName(mahal.name);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {mahal.floor.name}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="text-green-600 font-medium">{mahalTamamlanan}</span>/
                      <span>{mahalTotal}</span>
                      <span>(%{mahalProgress})</span>
                    </div>
                    {/* Progress bar mini */}
                    <div className="hidden sm:block w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${mahalProgress}%` }}
                      />
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Mahal Kopyala"
                        onClick={() => handleCopyMahal(mahal)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Kalem Ekle"
                        onClick={() => {
                          setActiveMahalId(mahal.id);
                          setShowAddKalem(true);
                        }}
                      >
                        <ListPlus className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        title="Mahal Sil"
                        onClick={() => handleDeleteMahal(mahal.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Kalemler Tablosu */}
                {isExpanded && (
                  <div className="border-t overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="w-10 text-center">Sıra</TableHead>
                        <TableHead className="w-10"></TableHead>
                        <TableHead className="w-[100px]">Yer</TableHead>
                        <TableHead className="w-[100px]">Proje Durumu</TableHead>
                        <TableHead className="min-w-[250px]">İmalat Açıklaması</TableHead>
                        <TableHead className="w-[120px]">İlgili Disiplin</TableHead>
                        <TableHead className="w-[130px]">İmalat Durumu</TableHead>
                        <TableHead className="w-[120px]">Aksiyon</TableHead>
                        <TableHead className="w-[120px]">Sorumlu</TableHead>
                        <TableHead className="w-[120px]">İlgili Taşeron</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mahal.kalemler.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={11} className="text-center text-muted-foreground py-6">
                            Henüz imalat kalemi yok
                          </TableCell>
                        </TableRow>
                      ) : (
                        mahal.kalemler
                          .sort((a, b) => a.siraNo - b.siraNo)
                          .map((kalem, idx) => {
                            const isEditing = editingKalemId === kalem.id;
                            return (
                              <TableRow
                                key={kalem.id}
                                className={`group/row cursor-pointer ${isEditing ? "bg-blue-50/60 ring-1 ring-blue-200" : "hover:bg-muted/30"}`}
                                onClick={() => setEditingKalemId(isEditing ? null : kalem.id)}
                              >
                                <TableCell className="text-center font-mono text-xs">
                                  {kalem.siraNo}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-0.5">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); moveKalem(mahal.id, kalem.id, "up"); }}
                                      disabled={idx === 0}
                                      className="p-0.5 hover:bg-muted rounded disabled:opacity-30 opacity-0 group-hover/row:opacity-100 transition-opacity"
                                      title="Yukarı Taşı"
                                    >
                                      <ArrowUp className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); moveKalem(mahal.id, kalem.id, "down"); }}
                                      disabled={idx === mahal.kalemler.length - 1}
                                      className="p-0.5 hover:bg-muted rounded disabled:opacity-30 opacity-0 group-hover/row:opacity-100 transition-opacity"
                                      title="Aşağı Taşı"
                                    >
                                      <ArrowDown className="h-3 w-3" />
                                    </button>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {isEditing ? (
                                    <Select
                                      value={kalem.yer}
                                      onValueChange={(v) => handleUpdateKalem(kalem.id, { yer: v })}
                                    >
                                      <SelectTrigger className="h-8 text-xs w-[100px]" onClick={(e) => e.stopPropagation()}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Object.entries(YER_LABELS).map(([k, v]) => (
                                          <SelectItem key={k} value={k}>{v}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <span className="text-xs">{YER_LABELS[kalem.yer] || kalem.yer}</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isEditing ? (
                                    <Select
                                      value={kalem.projeDurumu}
                                      onValueChange={(v) => handleUpdateKalem(kalem.id, { projeDurumu: v })}
                                    >
                                      <SelectTrigger className="h-8 text-xs w-[100px]" onClick={(e) => e.stopPropagation()}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Object.entries(PROJE_DURUMU_LABELS).map(([k, v]) => (
                                          <SelectItem key={k} value={k}>{v}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <span className="text-xs">{PROJE_DURUMU_LABELS[kalem.projeDurumu] || kalem.projeDurumu}</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm">{kalem.imalatAciklama}</TableCell>
                                <TableCell>
                                  {isEditing ? (
                                    <Select
                                      value={kalem.disciplineId || "none"}
                                      onValueChange={(v) =>
                                        handleUpdateKalem(kalem.id, { disciplineId: v === "none" ? null : v })
                                      }
                                    >
                                      <SelectTrigger className="h-8 text-xs w-[110px]" onClick={(e) => e.stopPropagation()}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">—</SelectItem>
                                        {disciplines.map((d) => (
                                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <span className="text-xs">{kalem.discipline?.name || "—"}</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isEditing ? (
                                    <Select
                                      value={kalem.imalatDurumu}
                                      onValueChange={(v) => handleUpdateKalem(kalem.id, { imalatDurumu: v })}
                                    >
                                      <SelectTrigger className={`h-8 text-xs w-[120px] ${IMALAT_DURUMU_COLORS[kalem.imalatDurumu] || ""}`} onClick={(e) => e.stopPropagation()}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Object.entries(IMALAT_DURUMU_LABELS).map(([k, v]) => (
                                          <SelectItem key={k} value={k}>{v}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <Badge className={`text-[10px] px-1.5 py-0.5 ${IMALAT_DURUMU_COLORS[kalem.imalatDurumu] || ""}`}>
                                      {IMALAT_DURUMU_LABELS[kalem.imalatDurumu] || kalem.imalatDurumu}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isEditing ? (
                                    <Input
                                      className="h-8 text-xs w-[110px]"
                                      defaultValue={kalem.aksiyon || ""}
                                      onClick={(e) => e.stopPropagation()}
                                      onBlur={(e) => {
                                        if (e.target.value !== (kalem.aksiyon || ""))
                                          handleUpdateKalem(kalem.id, { aksiyon: e.target.value });
                                      }}
                                    />
                                  ) : (
                                    <span className="text-xs text-muted-foreground">{kalem.aksiyon || "—"}</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isEditing ? (
                                    <Input
                                      className="h-8 text-xs w-[110px]"
                                      defaultValue={kalem.sorumlu || ""}
                                      onClick={(e) => e.stopPropagation()}
                                      onBlur={(e) => {
                                        if (e.target.value !== (kalem.sorumlu || ""))
                                          handleUpdateKalem(kalem.id, { sorumlu: e.target.value });
                                      }}
                                    />
                                  ) : (
                                    <span className="text-xs text-muted-foreground">{kalem.sorumlu || "—"}</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isEditing ? (
                                    <Input
                                      className="h-8 text-xs w-[110px]"
                                      defaultValue={kalem.ilgiliTaseron || ""}
                                      onClick={(e) => e.stopPropagation()}
                                      onBlur={(e) => {
                                        if (e.target.value !== (kalem.ilgiliTaseron || ""))
                                          handleUpdateKalem(kalem.id, { ilgiliTaseron: e.target.value });
                                      }}
                                    />
                                  ) : (
                                    <span className="text-xs text-muted-foreground">{kalem.ilgiliTaseron || "—"}</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isEditing && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive"
                                      onClick={(e) => { e.stopPropagation(); handleDeleteKalem(kalem.id); }}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })
                      )}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* ═══ Yeni Mahal Dialog ═══ */}
      <Dialog open={showAddMahal} onOpenChange={setShowAddMahal}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni İmalat Mahali</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Mahal Adı *</Label>
              <Input
                value={newMahalName}
                onChange={(e) => setNewMahalName(e.target.value)}
                placeholder="örn: Giriş Koridoru"
              />
            </div>
            <div>
              <Label>Kat *</Label>
              <Select value={newMahalFloorId} onValueChange={setNewMahalFloorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Kat seçin" />
                </SelectTrigger>
                <SelectContent>
                  {floors.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Şablon Seçimi */}
            {sablonlar.length > 0 && (
              <div>
                <Label className="mb-2 block">İmalat Şablonları (İsteğe bağlı)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Seçilen şablonlar mahal oluşturulduğunda otomatik imalat kalemi olarak eklenir.
                </p>
                <div className="border rounded-md max-h-48 overflow-y-auto p-2 space-y-1.5">
                  {sablonlar.map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-2 text-sm hover:bg-muted/50 p-1.5 rounded cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedSablonIds.includes(s.id)}
                        onCheckedChange={(checked) => {
                          setSelectedSablonIds((prev) =>
                            checked ? [...prev, s.id] : prev.filter((id) => id !== s.id)
                          );
                        }}
                      />
                      <span className="flex-1">{s.aciklama}</span>
                      <span className="text-xs text-muted-foreground">
                        {YER_LABELS[s.yer] || s.yer}
                      </span>
                      {s.disiplinAdi && (
                        <Badge variant="outline" className="text-xs">
                          {s.disiplinAdi}
                        </Badge>
                      )}
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSablonIds(sablonlar.map((s) => s.id))}
                  >
                    Tümünü Seç
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSablonIds([])}
                  >
                    Temizle
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMahal(false)}>
              İptal
            </Button>
            <Button onClick={handleAddMahal} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Yeni Kalem Dialog ═══ */}
      <Dialog open={showAddKalem} onOpenChange={setShowAddKalem}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni İmalat Kalemi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>İmalat Açıklaması *</Label>
              <Input
                value={newKalemAciklama}
                onChange={(e) => setNewKalemAciklama(e.target.value)}
                placeholder="örn: Karkas + Tek yüz kapama"
              />
            </div>
            <div>
              <Label>Yer</Label>
              <Select value={newKalemYer} onValueChange={setNewKalemYer}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(YER_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>İlgili Disiplin</Label>
              <Select value={newKalemDisciplineId} onValueChange={setNewKalemDisciplineId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {disciplines.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sorumlu</Label>
              <Input
                value={newKalemSorumlu}
                onChange={(e) => setNewKalemSorumlu(e.target.value)}
                placeholder="Sorumlu kişi"
              />
            </div>
            <div>
              <Label>İlgili Taşeron</Label>
              <Input
                value={newKalemTaseron}
                onChange={(e) => setNewKalemTaseron(e.target.value)}
                placeholder="Taşeron firma"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddKalem(false)}>
              İptal
            </Button>
            <Button onClick={handleAddKalem} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Şablon Yönetimi Dialog ═══ */}
      <Dialog open={showSablonlar} onOpenChange={setShowSablonlar}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>İmalat Şablonları</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Şablonlar, yeni mahal eklerken otomatik olarak imalat kalemleri oluşturmak için kullanılır.
          </p>

          {/* Mevcut şablonlar */}
          {sablonlar.length > 0 && (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sıra</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>Yer</TableHead>
                    <TableHead>Disiplin</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sablonlar.map((s, i) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{i + 1}</TableCell>
                      <TableCell className="text-sm">{s.aciklama}</TableCell>
                      <TableCell className="text-xs">{YER_LABELS[s.yer] || s.yer}</TableCell>
                      <TableCell className="text-xs">{s.disiplinAdi || "—"}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDeleteSablon(s.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Yeni şablon formu */}
          <div className="border rounded-md p-4 space-y-3 bg-muted/30">
            <h4 className="text-sm font-medium">Yeni Şablon Ekle</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <Input
                  value={newSablonAciklama}
                  onChange={(e) => setNewSablonAciklama(e.target.value)}
                  placeholder="İmalat açıklaması"
                />
              </div>
              <Select value={newSablonYer} onValueChange={setNewSablonYer}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(YER_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={newSablonDisiplin} onValueChange={setNewSablonDisiplin}>
                <SelectTrigger>
                  <SelectValue placeholder="Disiplin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {disciplines.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddSablon}>
                <Plus className="h-4 w-4 mr-1" /> Ekle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Hazır Veri Yükleme Dialog ─── */}
      <Dialog open={showSeedDialog} onOpenChange={setShowSeedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hazır İmalat Verilerini Yükle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ofis renovasyon projesi için standart imalat verilerini (14 mahal, 504 kalem, 36 şablon) seçili kata yükler.
              İmalat durumları da dahil edilir.
            </p>
            <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
              <strong>Dikkat:</strong> Seçilen katta bu projeye ait mevcut imalat verileri silinip yerine hazır veriler yüklenecektir.
            </div>
            <div className="space-y-2">
              <Label>Kat Seçimi *</Label>
              <Select value={seedFloorId} onValueChange={setSeedFloorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Kat seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {floors.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSeedDialog(false)} disabled={seeding}>
              İptal
            </Button>
            <Button onClick={handleSeedImport} disabled={seeding || !seedFloorId}>
              {seeding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Yükleniyor...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-1" /> Yükle
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
