"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Building2, MapPin } from "lucide-react";

interface InvestmentProject {
  id: string;
  name: string;
  type: string;
  status: string;
  city: string | null;
  district: string | null;
  address: string | null;
  landArea: number | null;
  constructionArea: number | null;
  totalUnits: number;
  totalBudget: number;
  totalRevenue: number;
  startDate: string | null;
  endDate: string | null;
  completionPct: number;
  description: string | null;
  imageUrl: string | null;
  soldUnits: number;
  totalSaleAmount: number;
  totalCollected: number;
  _count: { units: number; feasibilityItems: number; cashFlowEntries: number };
}

const typeOptions = [
  { value: "KONUT", label: "Konut" },
  { value: "AVM", label: "AVM" },
  { value: "OTEL", label: "Otel" },
  { value: "OFIS", label: "Ofis" },
  { value: "ARSA", label: "Arsa" },
  { value: "KARMA", label: "Karma" },
];

const statusOptions = [
  { value: "FIZIBILITE", label: "Fizibilite" },
  { value: "INSAAT", label: "İnşaat" },
  { value: "SATISTA", label: "Satışta" },
  { value: "TAMAMLANDI", label: "Tamamlandı" },
  { value: "IPTAL", label: "İptal" },
];

const statusColors: Record<string, string> = {
  FIZIBILITE: "bg-blue-100 text-blue-800",
  INSAAT: "bg-yellow-100 text-yellow-800",
  SATISTA: "bg-green-100 text-green-800",
  TAMAMLANDI: "bg-gray-100 text-gray-800",
  IPTAL: "bg-red-100 text-red-800",
};

function formatCurrency(val: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(val);
}

const emptyForm = {
  name: "",
  type: "KONUT",
  status: "FIZIBILITE",
  city: "",
  district: "",
  address: "",
  landArea: "",
  constructionArea: "",
  totalUnits: "",
  totalBudget: "",
  totalRevenue: "",
  startDate: "",
  endDate: "",
  completionPct: "",
  description: "",
};

export default function PortfoyPage() {
  const [projects, setProjects] = useState<InvestmentProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchData = useCallback(() => {
    fetch("/api/yatirim/projeler")
      .then((r) => r.json())
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openNew() {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEdit(p: InvestmentProject) {
    setForm({
      name: p.name,
      type: p.type,
      status: p.status,
      city: p.city || "",
      district: p.district || "",
      address: p.address || "",
      landArea: p.landArea?.toString() || "",
      constructionArea: p.constructionArea?.toString() || "",
      totalUnits: p.totalUnits.toString(),
      totalBudget: p.totalBudget.toString(),
      totalRevenue: p.totalRevenue.toString(),
      startDate: p.startDate ? p.startDate.split("T")[0] : "",
      endDate: p.endDate ? p.endDate.split("T")[0] : "",
      completionPct: p.completionPct.toString(),
      description: p.description || "",
    });
    setEditingId(p.id);
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Proje adı zorunludur");
      return;
    }

    const url = editingId
      ? `/api/yatirim/projeler/${editingId}`
      : "/api/yatirim/projeler";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      toast.success(editingId ? "Proje güncellendi" : "Proje oluşturuldu");
      setDialogOpen(false);
      fetchData();
    } else {
      toast.error("Bir hata oluştu");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu projeyi silmek istediğinize emin misiniz?")) return;

    const res = await fetch(`/api/yatirim/projeler/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Proje silindi");
      fetchData();
    } else {
      toast.error("Silme hatası");
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Portföy Yönetimi</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}><CardContent className="p-6"><div className="h-40 bg-muted animate-pulse rounded" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portföy Yönetimi</h1>
          <p className="text-muted-foreground">Yatırım projelerinizi yönetin</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" /> Yeni Proje
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Proje Düzenle" : "Yeni Yatırım Projesi"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2">
                <Label>Proje Adı *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Kuzey Park Konutları" />
              </div>
              <div>
                <Label>Proje Tipi</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Durum</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Şehir</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="İstanbul" />
              </div>
              <div>
                <Label>İlçe</Label>
                <Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} placeholder="Başakşehir" />
              </div>
              <div className="col-span-2">
                <Label>Adres</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div>
                <Label>Arsa Alanı (m²)</Label>
                <Input type="number" value={form.landArea} onChange={(e) => setForm({ ...form, landArea: e.target.value })} />
              </div>
              <div>
                <Label>İnşaat Alanı (m²)</Label>
                <Input type="number" value={form.constructionArea} onChange={(e) => setForm({ ...form, constructionArea: e.target.value })} />
              </div>
              <div>
                <Label>Toplam Birim Sayısı</Label>
                <Input type="number" value={form.totalUnits} onChange={(e) => setForm({ ...form, totalUnits: e.target.value })} />
              </div>
              <div>
                <Label>İnşaat İlerleme (%)</Label>
                <Input type="number" value={form.completionPct} onChange={(e) => setForm({ ...form, completionPct: e.target.value })} min="0" max="100" />
              </div>
              <div>
                <Label>Toplam Bütçe (₺)</Label>
                <Input type="number" value={form.totalBudget} onChange={(e) => setForm({ ...form, totalBudget: e.target.value })} />
              </div>
              <div>
                <Label>Hedef Gelir (₺)</Label>
                <Input type="number" value={form.totalRevenue} onChange={(e) => setForm({ ...form, totalRevenue: e.target.value })} />
              </div>
              <div>
                <Label>Başlangıç Tarihi</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <Label>Bitiş Tarihi</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Açıklama</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
              <Button onClick={handleSubmit}>{editingId ? "Güncelle" : "Oluştur"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Henüz proje yok</h3>
            <p className="text-muted-foreground mb-4">İlk yatırım projenizi oluşturun</p>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" /> Yeni Proje Ekle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{p.name}</CardTitle>
                    {p.city && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {p.city}{p.district ? `, ${p.district}` : ""}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Badge variant="outline">{typeOptions.find((o) => o.value === p.type)?.label || p.type}</Badge>
                  <Badge variant="outline" className={statusColors[p.status]}>
                    {statusOptions.find((o) => o.value === p.status)?.label || p.status}
                  </Badge>
                </div>

                {/* İnşaat ilerleme */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">İnşaat İlerleme</span>
                    <span className="font-medium">%{p.completionPct}</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min(p.completionPct, 100)}%` }} />
                  </div>
                </div>

                {/* Satış ilerleme */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Satış</span>
                    <span className="font-medium">{p.soldUnits}/{p.totalUnits} birim</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${p.totalUnits > 0 ? (p.soldUnits / p.totalUnits) * 100 : 0}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t text-sm">
                  <div>
                    <span className="text-muted-foreground">Bütçe</span>
                    <p className="font-medium">{formatCurrency(p.totalBudget)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Satış Tutarı</span>
                    <p className="font-medium">{formatCurrency(p.totalSaleAmount)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tahsilat</span>
                    <p className="font-medium text-green-600">{formatCurrency(p.totalCollected)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Alan</span>
                    <p className="font-medium">{p.landArea ? `${p.landArea.toLocaleString("tr-TR")} m²` : "—"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
