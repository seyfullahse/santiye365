"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Activity {
  id: string;
  name: string;
  project: { name: string };
}

interface Onay {
  id: string;
  activityId: string;
  title: string;
  waitingOn: string;
  waitingDays: number;
  impactType: string;
  note: string | null;
  status: string;
  createdAt: string;
  activity: {
    name: string;
    project: { name: string };
  };
}

const IMPACT_TYPE_LABELS: Record<string, string> = {
  DURATION: "Süre",
  COST: "Maliyet",
  BOTH: "Her İkisi",
};

const STATUS_LABELS: Record<string, string> = {
  WAITING: "Bekliyor",
  RESOLVED: "Çözüldü",
};

const emptyForm = {
  activityId: "",
  title: "",
  waitingOn: "",
  waitingDays: 0,
  impactType: "",
  note: "",
  status: "WAITING",
};

export default function OnaylarPage() {
  const [onaylar, setOnaylar] = useState<Onay[]>([]);
  const [aktiviteler, setAktiviteler] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState("all");

  const fetchOnaylar = async (status?: string) => {
    try {
      const url = status ? `/api/onaylar?status=${status}` : "/api/onaylar";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Veri alınamadı");
      const data = await res.json();
      setOnaylar(data);
    } catch {
      toast.error("Onaylar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const fetchAktiviteler = async () => {
    try {
      const res = await fetch("/api/aktiviteler");
      if (!res.ok) throw new Error("Aktiviteler alınamadı");
      const data = await res.json();
      setAktiviteler(data);
    } catch {
      toast.error("Aktiviteler yüklenirken hata oluştu");
    }
  };

  useEffect(() => {
    fetchAktiviteler();
    fetchOnaylar();
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setLoading(true);
    if (value === "waiting") {
      fetchOnaylar("WAITING");
    } else if (value === "resolved") {
      fetchOnaylar("RESOLVED");
    } else {
      fetchOnaylar();
    }
  };

  const openCreateDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (onay: Onay) => {
    setEditingId(onay.id);
    setForm({
      activityId: onay.activityId,
      title: onay.title,
      waitingOn: onay.waitingOn,
      waitingDays: onay.waitingDays,
      impactType: onay.impactType,
      note: onay.note || "",
      status: onay.status,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.activityId || !form.title || !form.waitingOn || !form.impactType) {
      toast.error("Lütfen tüm zorunlu alanları doldurun");
      return;
    }

    try {
      const payload = {
        ...form,
        waitingDays: Number(form.waitingDays),
      };

      if (editingId) {
        const res = await fetch(`/api/onaylar/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Güncelleme başarısız");
        toast.success("Onay başarıyla güncellendi");
      } else {
        const { status: _status, ...createPayload } = payload;
        const res = await fetch("/api/onaylar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(createPayload),
        });
        if (!res.ok) throw new Error("Oluşturma başarısız");
        toast.success("Onay başarıyla oluşturuldu");
      }

      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      handleTabChange(activeTab);
    } catch {
      toast.error(editingId ? "Güncelleme sırasında hata oluştu" : "Oluşturma sırasında hata oluştu");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu onayı silmek istediğinize emin misiniz?")) return;

    try {
      const res = await fetch(`/api/onaylar/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silme başarısız");
      toast.success("Onay başarıyla silindi");
      handleTabChange(activeTab);
    } catch {
      toast.error("Silme sırasında hata oluştu");
    }
  };

  const handleMarkResolved = async (id: string) => {
    try {
      const res = await fetch(`/api/onaylar/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RESOLVED" }),
      });
      if (!res.ok) throw new Error("İşlem başarısız");
      toast.success("Onay çözüldü olarak işaretlendi");
      handleTabChange(activeTab);
    } catch {
      toast.error("İşlem sırasında hata oluştu");
    }
  };

  const renderTable = (data: Onay[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Başlık</TableHead>
          <TableHead>Aktivite</TableHead>
          <TableHead>Proje</TableHead>
          <TableHead>Kimde Bekliyor</TableHead>
          <TableHead>Bekleme Süresi (gün)</TableHead>
          <TableHead>Etki Tipi</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead>İşlemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
              Kayıt bulunamadı
            </TableCell>
          </TableRow>
        ) : (
          data.map((onay) => (
            <TableRow key={onay.id}>
              <TableCell className="font-medium">{onay.title}</TableCell>
              <TableCell>{onay.activity?.name}</TableCell>
              <TableCell>{onay.activity?.project?.name}</TableCell>
              <TableCell>{onay.waitingOn}</TableCell>
              <TableCell>{onay.waitingDays}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {IMPACT_TYPE_LABELS[onay.impactType] || onay.impactType}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={onay.status === "WAITING" ? "destructive" : "default"}
                >
                  {STATUS_LABELS[onay.status] || onay.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {onay.status === "WAITING" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Çözüldü olarak işaretle"
                      onClick={() => handleMarkResolved(onay.id)}
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Düzenle"
                    onClick={() => openEditDialog(onay)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Sil"
                    onClick={() => handleDelete(onay.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">Onaylar</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Onay
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Onay Düzenle" : "Yeni Onay Oluştur"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="activityId">Aktivite *</Label>
                <Select
                  value={form.activityId}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, activityId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Aktivite seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {aktiviteler.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Başlık *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Onay başlığı"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="waitingOn">Kimde Bekliyor *</Label>
                <Input
                  id="waitingOn"
                  value={form.waitingOn}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, waitingOn: e.target.value }))
                  }
                  placeholder="Onay bekleyen kişi/birim"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="waitingDays">Bekleme Süresi (gün)</Label>
                <Input
                  id="waitingDays"
                  type="number"
                  min={0}
                  value={form.waitingDays}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      waitingDays: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="impactType">Etki Tipi *</Label>
                <Select
                  value={form.impactType}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, impactType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Etki tipi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DURATION">Süre</SelectItem>
                    <SelectItem value="COST">Maliyet</SelectItem>
                    <SelectItem value="BOTH">Her İkisi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Not</Label>
                <Textarea
                  id="note"
                  value={form.note}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, note: e.target.value }))
                  }
                  placeholder="Ek notlar..."
                  rows={3}
                />
              </div>

              {editingId && (
                <div className="space-y-2">
                  <Label htmlFor="status">Durum</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WAITING">Bekliyor</SelectItem>
                      <SelectItem value="RESOLVED">Çözüldü</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button onClick={handleSubmit} className="w-full">
                {editingId ? "Güncelle" : "Oluştur"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Onay Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="all">Tümü</TabsTrigger>
              <TabsTrigger value="waiting">Bekleyen</TabsTrigger>
              <TabsTrigger value="resolved">Çözülen</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              {loading ? (
                <p className="text-center py-8 text-muted-foreground">Yükleniyor...</p>
              ) : (
                renderTable(onaylar)
              )}
            </TabsContent>
            <TabsContent value="waiting">
              {loading ? (
                <p className="text-center py-8 text-muted-foreground">Yükleniyor...</p>
              ) : (
                renderTable(onaylar)
              )}
            </TabsContent>
            <TabsContent value="resolved">
              {loading ? (
                <p className="text-center py-8 text-muted-foreground">Yükleniyor...</p>
              ) : (
                renderTable(onaylar)
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
