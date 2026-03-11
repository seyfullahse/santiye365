"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, MapPin, Layers } from "lucide-react";
import { toast } from "sonner";

/* ─── Types ─── */
interface Mahal {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  project: { name: string };
  _count: { floors: number; activities: number };
}

interface Floor {
  id: string;
  projectId: string;
  zoneId: string;
  name: string;
  orderNo: number;
  project: { name: string };
  zone: { name: string };
  _count: { activities: number };
}

/* ═══════════════════════════════════════════════ */
export default function MahallerKatlarPage() {
  const params = useParams();
  const projectId = params.id as string;

  /* ── Mahaller state ── */
  const [mahaller, setMahaller] = useState<Mahal[]>([]);
  const [mahalLoading, setMahalLoading] = useState(true);
  const [mahalDialogOpen, setMahalDialogOpen] = useState(false);
  const [mahalDeleteDialogOpen, setMahalDeleteDialogOpen] = useState(false);
  const [selectedMahal, setSelectedMahal] = useState<Mahal | null>(null);
  const [mahalForm, setMahalForm] = useState({ name: "", description: "" });
  const [mahalSubmitting, setMahalSubmitting] = useState(false);

  /* ── Katlar state ── */
  const [floors, setFloors] = useState<Floor[]>([]);
  const [floorLoading, setFloorLoading] = useState(true);
  const [floorDialogOpen, setFloorDialogOpen] = useState(false);
  const [floorDeleteDialogOpen, setFloorDeleteDialogOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [deletingFloor, setDeletingFloor] = useState<Floor | null>(null);
  const [floorForm, setFloorForm] = useState({ zoneId: "", name: "", orderNo: 0 });
  const [floorSubmitting, setFloorSubmitting] = useState(false);

  /* ── Fetch ── */
  const fetchMahaller = useCallback(async () => {
    try {
      const res = await fetch(`/api/mahaller?projectId=${projectId}`);
      if (!res.ok) throw new Error();
      setMahaller(await res.json());
    } catch {
      toast.error("Mahaller yüklenemedi");
    } finally {
      setMahalLoading(false);
    }
  }, [projectId]);

  const fetchFloors = useCallback(async () => {
    try {
      const res = await fetch(`/api/katlar?projectId=${projectId}`);
      if (!res.ok) throw new Error();
      setFloors(await res.json());
    } catch {
      toast.error("Katlar yüklenemedi");
    } finally {
      setFloorLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMahaller();
    fetchFloors();
  }, [fetchMahaller, fetchFloors]);

  /* ═══════════ MAHAL İŞLEMLERİ ═══════════ */
  const handleMahalCreate = () => {
    setSelectedMahal(null);
    setMahalForm({ name: "", description: "" });
    setMahalDialogOpen(true);
  };

  const handleMahalEdit = (mahal: Mahal) => {
    setSelectedMahal(mahal);
    setMahalForm({ name: mahal.name, description: mahal.description ?? "" });
    setMahalDialogOpen(true);
  };

  const handleMahalSubmit = async () => {
    if (!mahalForm.name.trim()) {
      toast.error("Mahal adı zorunludur.");
      return;
    }
    setMahalSubmitting(true);
    try {
      const isEdit = !!selectedMahal;
      const url = isEdit ? `/api/mahaller/${selectedMahal.id}` : "/api/mahaller";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          name: mahalForm.name.trim(),
          description: mahalForm.description.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "İşlem başarısız");
      }
      toast.success(isEdit ? "Mahal güncellendi" : "Mahal oluşturuldu");
      setMahalDialogOpen(false);
      fetchMahaller();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setMahalSubmitting(false);
    }
  };

  const handleMahalDelete = async () => {
    if (!selectedMahal) return;
    setMahalSubmitting(true);
    try {
      const res = await fetch(`/api/mahaller/${selectedMahal.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Silme başarısız");
      }
      toast.success("Mahal silindi");
      setMahalDeleteDialogOpen(false);
      setSelectedMahal(null);
      fetchMahaller();
      fetchFloors();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setMahalSubmitting(false);
    }
  };

  /* ═══════════ KAT İŞLEMLERİ ═══════════ */
  const handleFloorCreate = () => {
    setEditingFloor(null);
    setFloorForm({ zoneId: "", name: "", orderNo: 0 });
    setFloorDialogOpen(true);
  };

  const handleFloorEdit = (floor: Floor) => {
    setEditingFloor(floor);
    setFloorForm({ zoneId: floor.zoneId, name: floor.name, orderNo: floor.orderNo });
    setFloorDialogOpen(true);
  };

  const handleFloorSubmit = async () => {
    if (!floorForm.zoneId || !floorForm.name.trim()) {
      toast.error("Mahal ve kat adı zorunludur.");
      return;
    }
    setFloorSubmitting(true);
    try {
      const isEdit = !!editingFloor;
      const url = isEdit ? `/api/katlar/${editingFloor.id}` : "/api/katlar";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          zoneId: floorForm.zoneId,
          name: floorForm.name.trim(),
          orderNo: floorForm.orderNo,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "İşlem başarısız");
      }
      toast.success(isEdit ? "Kat güncellendi" : "Kat eklendi");
      setFloorDialogOpen(false);
      fetchFloors();
      fetchMahaller();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setFloorSubmitting(false);
    }
  };

  const handleFloorDelete = async () => {
    if (!deletingFloor) return;
    setFloorSubmitting(true);
    try {
      const res = await fetch(`/api/katlar/${deletingFloor.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Silme başarısız");
      }
      toast.success("Kat silindi");
      setFloorDeleteDialogOpen(false);
      setDeletingFloor(null);
      fetchFloors();
      fetchMahaller();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setFloorSubmitting(false);
    }
  };

  /* ═══════════ RENDER ═══════════ */
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Başlık */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <MapPin className="h-6 w-6 text-emerald-600" />
          Mahaller & Katlar
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Projeye ait mahalleri ve katları tek ekranda yönetin
        </p>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Toplam Mahal</p>
            <p className="text-2xl font-bold">{mahaller.length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Toplam Kat</p>
            <p className="text-2xl font-bold">{floors.length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Toplam Aktivite</p>
            <p className="text-2xl font-bold">
              {mahaller.reduce((sum, m) => sum + m._count.activities, 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Ort. Kat/Mahal</p>
            <p className="text-2xl font-bold">
              {mahaller.length > 0 ? (floors.length / mahaller.length).toFixed(1) : "0"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="mahaller" className="space-y-4">
        <TabsList>
          <TabsTrigger value="mahaller" className="gap-2">
            <MapPin className="h-4 w-4" /> Mahaller
          </TabsTrigger>
          <TabsTrigger value="katlar" className="gap-2">
            <Layers className="h-4 w-4" /> Katlar
          </TabsTrigger>
        </TabsList>

        {/* ═══════ MAHALLER TAB ═══════ */}
        <TabsContent value="mahaller" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{mahaller.length} mahal kayıtlı</p>
            <Button onClick={handleMahalCreate} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Mahal
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {mahalLoading ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground">Yükleniyor...</div>
              ) : mahaller.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <MapPin className="h-10 w-10 mb-2 opacity-30" />
                  <p>Henüz mahal bulunmuyor</p>
                  <p className="text-xs mt-1">İlk mahali ekleyerek başlayın</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mahal Adı</TableHead>
                      <TableHead>Açıklama</TableHead>
                      <TableHead className="text-center">Kat</TableHead>
                      <TableHead className="text-center">Aktivite</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mahaller.map((mahal) => (
                      <TableRow key={mahal.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-emerald-500" />
                            {mahal.name}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-muted-foreground">{mahal.description || "—"}</TableCell>
                        <TableCell className="text-center"><Badge variant="outline">{mahal._count.floors}</Badge></TableCell>
                        <TableCell className="text-center"><Badge variant="secondary">{mahal._count.activities}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMahalEdit(mahal)} title="Düzenle"><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setSelectedMahal(mahal); setMahalDeleteDialogOpen(true); }} title="Sil"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ KATLAR TAB ═══════ */}
        <TabsContent value="katlar" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{floors.length} kat kayıtlı</p>
            <Button onClick={handleFloorCreate} size="sm" disabled={mahaller.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Kat
            </Button>
          </div>
          {mahaller.length === 0 && (
            <Card className="border-dashed border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="py-3 text-center text-sm text-amber-700 dark:text-amber-300">
                Kat eklemek için önce en az bir mahal oluşturmalısınız.
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="p-0">
              {floorLoading ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground">Yükleniyor...</div>
              ) : floors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Layers className="h-10 w-10 mb-2 opacity-30" />
                  <p>Henüz kat eklenmemiş</p>
                  <p className="text-xs mt-1">Mahallere kat ekleyerek başlayın</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kat Adı</TableHead>
                      <TableHead>Mahal</TableHead>
                      <TableHead className="text-center">Sıra No</TableHead>
                      <TableHead className="text-center">Aktivite</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {floors.map((floor) => (
                      <TableRow key={floor.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-purple-500" />
                            {floor.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {floor.zone?.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{floor.orderNo}</TableCell>
                        <TableCell className="text-center"><Badge variant="secondary">{floor._count?.activities ?? 0}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleFloorEdit(floor)} title="Düzenle"><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setDeletingFloor(floor); setFloorDeleteDialogOpen(true); }} title="Sil"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══════ MAHAL DIALOG ═══════ */}
      <Dialog open={mahalDialogOpen} onOpenChange={setMahalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedMahal ? "Mahal Düzenle" : "Yeni Mahal Oluştur"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="mahal-name">Mahal Adı *</Label>
              <Input id="mahal-name" placeholder="Örn: A Blok, Dış Cephe" value={mahalForm.name} onChange={(e) => setMahalForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="mahal-desc">Açıklama</Label>
              <Textarea id="mahal-desc" placeholder="İsteğe bağlı açıklama" value={mahalForm.description} onChange={(e) => setMahalForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setMahalDialogOpen(false)} disabled={mahalSubmitting}>İptal</Button>
              <Button onClick={handleMahalSubmit} disabled={mahalSubmitting}>{mahalSubmitting ? "Kaydediliyor..." : selectedMahal ? "Güncelle" : "Oluştur"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════ MAHAL SİLME DIALOG ═══════ */}
      <Dialog open={mahalDeleteDialogOpen} onOpenChange={setMahalDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mahal Sil</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">{selectedMahal?.name}</span> adlı mahali silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setMahalDeleteDialogOpen(false)} disabled={mahalSubmitting}>İptal</Button>
            <Button variant="destructive" onClick={handleMahalDelete} disabled={mahalSubmitting}>{mahalSubmitting ? "Siliniyor..." : "Sil"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════ KAT DIALOG ═══════ */}
      <Dialog open={floorDialogOpen} onOpenChange={(open) => { setFloorDialogOpen(open); if (!open) setEditingFloor(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingFloor ? "Kat Düzenle" : "Yeni Kat Ekle"}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="floor-zone">Mahal *</Label>
              <Select value={floorForm.zoneId} onValueChange={(v) => setFloorForm((prev) => ({ ...prev, zoneId: v }))}>
                <SelectTrigger id="floor-zone"><SelectValue placeholder="Mahal seçin" /></SelectTrigger>
                <SelectContent>
                  {mahaller.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="floor-name">Kat Adı *</Label>
              <Input id="floor-name" placeholder="Örn: Zemin Kat, 1. Kat" value={floorForm.name} onChange={(e) => setFloorForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="floor-order">Sıra No</Label>
              <Input id="floor-order" type="number" value={floorForm.orderNo} onChange={(e) => setFloorForm((prev) => ({ ...prev, orderNo: Number(e.target.value) }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setFloorDialogOpen(false); setEditingFloor(null); }} disabled={floorSubmitting}>İptal</Button>
              <Button onClick={handleFloorSubmit} disabled={floorSubmitting}>{floorSubmitting ? "Kaydediliyor..." : editingFloor ? "Güncelle" : "Ekle"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════ KAT SİLME DIALOG ═══════ */}
      <Dialog open={floorDeleteDialogOpen} onOpenChange={setFloorDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Katı Sil</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">{deletingFloor?.name}</span> katını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setFloorDeleteDialogOpen(false); setDeletingFloor(null); }} disabled={floorSubmitting}>İptal</Button>
            <Button variant="destructive" onClick={handleFloorDelete} disabled={floorSubmitting}>{floorSubmitting ? "Siliniyor..." : "Sil"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
