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
import { toast } from "sonner";
import {
  Plus,
  Gavel,
  TrendingUp,
  FileText,
  Archive,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Pencil,
  Trash2,
  Eye,
  CalendarDays,
  Building2,
  MapPin,
  DollarSign,
} from "lucide-react";
import Link from "next/link";

interface TenderItem {
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
  CANCELLED: "bg-gray-100 text-gray-400",
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

export default function TeklifPage() {
  const [tenders, setTenders] = useState<TenderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", employer: "", location: "", dueDate: "", type: "CLOSED", currency: "TRY", notes: "" });

  const fetchTenders = useCallback(() => {
    fetch("/api/teklif/ihaleler")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTenders(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchTenders(); }, [fetchTenders]);

  async function handleCreate() {
    if (!form.name.trim()) { toast.error("İhale adı zorunlu"); return; }
    const res = await fetch("/api/teklif/ihaleler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("İhale oluşturuldu");
      setCreateOpen(false);
      setForm({ name: "", employer: "", location: "", dueDate: "", type: "CLOSED", currency: "TRY", notes: "" });
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

  async function handleStatusChange(id: string, status: string) {
    const res = await fetch(`/api/teklif/ihaleler/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) { toast.success("Durum güncellendi"); fetchTenders(); }
  }

  // İstatistikler
  const stats = {
    total: tenders.length,
    preparing: tenders.filter((t) => ["DRAFT", "PREPARING"].includes(t.status)).length,
    submitted: tenders.filter((t) => t.status === "SUBMITTED").length,
    won: tenders.filter((t) => t.status === "WON").length,
    totalValue: tenders.reduce((sum, t) => sum + (t.versions[0]?.totalPrice || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teklif & İhale Yönetimi</h1>
          <p className="text-muted-foreground text-sm">Teklif hazırlama, metraj, karlılık analizi ve ihale takibi</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Yeni İhale
        </Button>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Gavel className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Toplam İhale</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.preparing + stats.submitted}</p>
                <p className="text-xs text-muted-foreground">Aktif Teklif</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.won}</p>
                <p className="text-xs text-muted-foreground">Kazanılan</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-rose-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
                <p className="text-xs text-muted-foreground">Toplam Değer</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* İhale Listesi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" /> İhaleler
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
          ) : tenders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Gavel className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Henüz ihale yok</p>
              <p className="text-sm">Yeni bir ihale oluşturarak başlayın</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tenders.map((tender) => {
                const StatusIcon = statusIcons[tender.status] || FileText;
                const activeVersion = tender.versions[0];
                return (
                  <div
                    key={tender.id}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link href={`/teklif/ihaleler/${tender.id}`} className="font-semibold hover:underline truncate">
                            {tender.name}
                          </Link>
                          <Badge className={statusColors[tender.status]} variant="secondary">
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusLabels[tender.status]}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">{typeLabels[tender.type]}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {tender.employer && (
                            <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{tender.employer}</span>
                          )}
                          {tender.location && (
                            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{tender.location}</span>
                          )}
                          {tender.dueDate && (
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {new Date(tender.dueDate).toLocaleDateString("tr-TR")}
                            </span>
                          )}
                          <span>{tender._count.versions} versiyon</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {activeVersion && (
                          <div className="text-right mr-3">
                            <p className="font-bold text-lg">{formatCurrency(activeVersion.totalPrice || activeVersion.totalCost, tender.currency)}</p>
                            {activeVersion.markup > 0 && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                                <TrendingUp className="h-3 w-3" /> %{activeVersion.markup} kar
                              </p>
                            )}
                          </div>
                        )}
                        <Select value={tender.status} onValueChange={(v) => handleStatusChange(tender.id, v)}>
                          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusLabels).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Link href={`/teklif/ihaleler/${tender.id}`}>
                          <Button variant="outline" size="icon" className="h-8 w-8"><Eye className="h-3.5 w-3.5" /></Button>
                        </Link>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleDelete(tender.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Yeni İhale Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Yeni İhale Oluştur</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>İhale Adı *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ör: Merkez Konut Projesi İnşaat İşleri" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>İşveren / Firma</Label>
                <Input value={form.employer} onChange={(e) => setForm({ ...form, employer: e.target.value })} placeholder="ör: ABC İnşaat A.Ş." />
              </div>
              <div>
                <Label>Lokasyon</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="ör: İstanbul, Ataşehir" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>İptal</Button>
            <Button onClick={handleCreate}>Oluştur</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
