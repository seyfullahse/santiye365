"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Plus,
  Gavel,
  Eye,
  Pencil,
  Trash2,
  Archive,
  Building2,
  MapPin,
  CalendarDays,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface Tender {
  id: string;
  name: string;
  employer: string | null;
  location: string | null;
  dueDate: string | null;
  status: string;
  type: string;
  currency: string;
  isArchived: boolean;
  createdAt: string;
  project: { id: string; name: string } | null;
  _count: { versions: number; comparisons: number };
  versions: { id: string; versionNo: number; totalCost: number; totalPrice: number; markup: number }[];
}

const statusLabels: Record<string, string> = {
  DRAFT: "Taslak",
  PREPARING: "Hazırlanıyor",
  SUBMITTED: "Teklif Verildi",
  WON: "Kazanıldı",
  LOST: "Kaybedildi",
  CANCELLED: "İptal",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PREPARING: "bg-blue-100 text-blue-700",
  SUBMITTED: "bg-amber-100 text-amber-700",
  WON: "bg-emerald-100 text-emerald-700",
  LOST: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-200 text-gray-400",
};

const statusIcons: Record<string, typeof Gavel> = {
  DRAFT: FileText,
  PREPARING: Clock,
  SUBMITTED: AlertTriangle,
  WON: CheckCircle2,
  LOST: XCircle,
  CANCELLED: XCircle,
};

const typeLabels: Record<string, string> = {
  OPEN: "Açık İhale",
  CLOSED: "Kapalı Teklif",
  NEGOTIATED: "Pazarlık",
  DIRECT: "Doğrudan Temin",
};

function formatCurrency(val: number, currency = "TRY"): string {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency, maximumFractionDigits: 0 }).format(val);
}

function daysUntil(dateStr: string): string {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${Math.abs(diff)} gün geçti`;
  if (diff === 0) return "Bugün";
  return `${diff} gün kaldı`;
}

export default function IhalelerPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTender, setEditingTender] = useState<Tender | null>(null);
  const [form, setForm] = useState({
    name: "", employer: "", location: "", dueDate: "", type: "CLOSED", currency: "TRY", notes: "",
  });

  const fetchTenders = useCallback(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/teklif/ihaleler?${params}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTenders(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { fetchTenders(); }, [fetchTenders]);

  function openCreate() {
    setEditingTender(null);
    setForm({ name: "", employer: "", location: "", dueDate: "", type: "CLOSED", currency: "TRY", notes: "" });
    setDialogOpen(true);
  }

  function openEdit(t: Tender) {
    setEditingTender(t);
    setForm({
      name: t.name,
      employer: t.employer || "",
      location: t.location || "",
      dueDate: t.dueDate ? t.dueDate.split("T")[0] : "",
      type: t.type,
      currency: t.currency,
      notes: "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error("İhale adı zorunlu"); return; }
    const url = editingTender ? `/api/teklif/ihaleler/${editingTender.id}` : "/api/teklif/ihaleler";
    const method = editingTender ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      toast.success(editingTender ? "İhale güncellendi" : "İhale oluşturuldu");
      setDialogOpen(false);
      fetchTenders();
    } else {
      const err = await res.json().catch(() => null);
      toast.error(err?.error || "Hata oluştu");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu ihaleyi silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/teklif/ihaleler/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("İhale silindi"); fetchTenders(); }
  }

  async function handleArchive(id: string) {
    const res = await fetch(`/api/teklif/ihaleler/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: true }),
    });
    if (res.ok) { toast.success("İhale arşivlendi"); fetchTenders(); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">İhaleler</h1>
          <p className="text-muted-foreground text-sm">Tüm aktif ihaleleri görüntüleyin ve yönetin</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Yeni İhale</Button>
      </div>

      {/* Filtreler */}
      <div className="flex gap-2">
        {["", "DRAFT", "PREPARING", "SUBMITTED", "WON", "LOST"].map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(s)}
          >
            {s ? statusLabels[s] : "Tümü"}
            {s && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1">
                {tenders.filter((t) => !s || t.status === s).length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Tablo */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>İhale</TableHead>
                <TableHead className="w-[120px]">Durum</TableHead>
                <TableHead className="w-[100px]">Tip</TableHead>
                <TableHead className="w-[120px]">Son Tarih</TableHead>
                <TableHead className="w-[120px] text-right">Teklif</TableHead>
                <TableHead className="w-[80px] text-right">Kar</TableHead>
                <TableHead className="w-[70px]">Rev.</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Yükleniyor...</TableCell>
                </TableRow>
              ) : tenders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <Gavel className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>İhale bulunamadı</p>
                  </TableCell>
                </TableRow>
              ) : (
                tenders.map((t) => {
                  const SI = statusIcons[t.status] || FileText;
                  const activeVersion = t.versions[0];
                  return (
                    <TableRow key={t.id} className="hover:bg-accent/50">
                      <TableCell>
                        <div>
                          <Link href={`/teklif/ihaleler/${t.id}`} className="font-medium hover:underline">{t.name}</Link>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            {t.employer && <span className="flex items-center gap-0.5"><Building2 className="h-3 w-3" />{t.employer}</span>}
                            {t.location && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{t.location}</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[t.status]} variant="secondary">
                          <SI className="h-3 w-3 mr-1" />{statusLabels[t.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{typeLabels[t.type]}</TableCell>
                      <TableCell>
                        {t.dueDate && (
                          <div>
                            <p className="text-xs">{new Date(t.dueDate).toLocaleDateString("tr-TR")}</p>
                            <p className="text-[10px] text-muted-foreground">{daysUntil(t.dueDate)}</p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {activeVersion ? formatCurrency(activeVersion.totalPrice || activeVersion.totalCost, t.currency) : "—"}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {activeVersion?.markup ? `%${activeVersion.markup}` : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-center">{t._count.versions}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Link href={`/teklif/ihaleler/${t.id}`}>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                          </Link>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleArchive(t.id)}>
                            <Archive className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(t.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* İhale Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTender ? "İhale Düzenle" : "Yeni İhale"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>İhale Adı *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ör: Merkez Konut Projesi İnşaat İşleri" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>İşveren / Firma</Label>
                <Input value={form.employer} onChange={(e) => setForm({ ...form, employer: e.target.value })} />
              </div>
              <div>
                <Label>Lokasyon</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Son Teklif Tarihi</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div>
                <Label>İhale Tipi</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Para Birimi</Label>
                <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRY">₺ TRY</SelectItem>
                    <SelectItem value="USD">$ USD</SelectItem>
                    <SelectItem value="EUR">€ EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button onClick={handleSave}>{editingTender ? "Güncelle" : "Oluştur"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
