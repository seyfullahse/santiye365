"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  Target,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Building2,
  DollarSign,
  LayoutGrid,
  List,
} from "lucide-react";
import { toast } from "sonner";

/* ═══════ TYPES ═══════ */
type Stage = "LEAD" | "NEEDS_ANALYSIS" | "PROPOSAL_SENT" | "NEGOTIATION" | "WON" | "LOST";

interface Opportunity {
  id: string;
  customerId: string;
  title: string;
  description: string | null;
  stage: Stage;
  estimatedValue: string | null;
  probability: number;
  expectedClose: string | null;
  source: string | null;
  assignedTo: string | null;
  lostReason: string | null;
  wonDate: string | null;
  lostDate: string | null;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; name: string };
  _count: { communications: number };
}

interface Customer {
  id: string;
  name: string;
}

/* ═══════ CONSTANTS ═══════ */
const stages: Stage[] = ["LEAD", "NEEDS_ANALYSIS", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST"];

const stageLabels: Record<Stage, string> = {
  LEAD: "İlk Temas",
  NEEDS_ANALYSIS: "İhtiyaç Analizi",
  PROPOSAL_SENT: "Teklif Gönderildi",
  NEGOTIATION: "Müzakere",
  WON: "Kazanıldı",
  LOST: "Kaybedildi",
};

const stageColors: Record<Stage, string> = {
  LEAD: "border-blue-500 bg-blue-50 dark:bg-blue-950/30",
  NEEDS_ANALYSIS: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30",
  PROPOSAL_SENT: "border-purple-500 bg-purple-50 dark:bg-purple-950/30",
  NEGOTIATION: "border-orange-500 bg-orange-50 dark:bg-orange-950/30",
  WON: "border-green-500 bg-green-50 dark:bg-green-950/30",
  LOST: "border-red-500 bg-red-50 dark:bg-red-950/30",
};

const stageDotColors: Record<Stage, string> = {
  LEAD: "bg-blue-500",
  NEEDS_ANALYSIS: "bg-yellow-500",
  PROPOSAL_SENT: "bg-purple-500",
  NEGOTIATION: "bg-orange-500",
  WON: "bg-green-500",
  LOST: "bg-red-500",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
  });
}

export default function FirsatlarPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  const [form, setForm] = useState({
    customerId: "",
    title: "",
    description: "",
    stage: "LEAD" as Stage,
    estimatedValue: "",
    probability: 0,
    expectedClose: "",
    source: "",
    assignedTo: "",
    lostReason: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const [oppRes, custRes] = await Promise.all([
        fetch("/api/crm/firsatlar"),
        fetch("/api/crm/musteriler"),
      ]);
      if (!oppRes.ok || !custRes.ok) throw new Error();
      setOpportunities(await oppRes.json());
      setCustomers(await custRes.json());
    } catch {
      toast.error("Veriler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () =>
    setForm({
      customerId: "",
      title: "",
      description: "",
      stage: "LEAD",
      estimatedValue: "",
      probability: 0,
      expectedClose: "",
      source: "",
      assignedTo: "",
      lostReason: "",
    });

  const openCreate = () => {
    resetForm();
    setSelected(null);
    setDialogOpen(true);
  };

  const openEdit = (o: Opportunity) => {
    setSelected(o);
    setForm({
      customerId: o.customerId,
      title: o.title,
      description: o.description || "",
      stage: o.stage,
      estimatedValue: o.estimatedValue ? String(o.estimatedValue) : "",
      probability: o.probability,
      expectedClose: o.expectedClose ? o.expectedClose.split("T")[0] : "",
      source: o.source || "",
      assignedTo: o.assignedTo || "",
      lostReason: o.lostReason || "",
    });
    setDialogOpen(true);
  };

  /* Move stage */
  const moveStage = async (opp: Opportunity, direction: "next" | "prev") => {
    const currentIndex = stages.indexOf(opp.stage);
    const newIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0 || newIndex >= stages.length) return;
    const newStage = stages[newIndex];
    try {
      const res = await fetch(`/api/crm/firsatlar/${opp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Aşama güncellendi: ${stageLabels[newStage]}`);
      fetchData();
    } catch {
      toast.error("Aşama güncellenemedi.");
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.customerId) {
      toast.error("Başlık ve müşteri zorunludur.");
      return;
    }
    setSubmitting(true);
    try {
      const isEdit = !!selected;
      const url = isEdit ? `/api/crm/firsatlar/${selected.id}` : "/api/crm/firsatlar";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          estimatedValue: form.estimatedValue ? parseFloat(form.estimatedValue) : null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(isEdit ? "Fırsat güncellendi." : "Fırsat oluşturuldu.");
      setDialogOpen(false);
      fetchData();
    } catch {
      toast.error("İşlem sırasında hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/crm/firsatlar/${selected.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Fırsat silindi.");
      setDeleteDialogOpen(false);
      setSelected(null);
      fetchData();
    } catch {
      toast.error("Fırsat silinemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  const groupedByStage = stages.reduce(
    (acc, stage) => {
      acc[stage] = opportunities.filter((o) => o.stage === stage);
      return acc;
    },
    {} as Record<Stage, Opportunity[]>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Fırsatlar</h1>
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-32 animate-pulse bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Fırsatlar</h1>
          <p className="text-muted-foreground">
            {opportunities.length} fırsat · Pipeline görünümü
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-0.5">
            <Button
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Fırsat
          </Button>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === "kanban" ? (
        <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {stages.map((stage) => (
            <div key={stage} className="space-y-3">
              <div className={`rounded-lg border-t-4 p-3 ${stageColors[stage]}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${stageDotColors[stage]}`} />
                    <h3 className="text-sm font-semibold">{stageLabels[stage]}</h3>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {groupedByStage[stage].length}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2 min-h-[100px]">
                {groupedByStage[stage].map((opp) => (
                  <Card
                    key={opp.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-medium leading-tight">
                          {opp.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        {opp.customer.name}
                      </div>
                      {opp.estimatedValue && (
                        <div className="flex items-center gap-1 text-xs font-medium">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(Number(opp.estimatedValue))}
                        </div>
                      )}
                      {opp.expectedClose && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(opp.expectedClose)}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs">
                        <div className="flex-1 bg-muted rounded-full h-1.5">
                          <div
                            className="bg-primary rounded-full h-1.5 transition-all"
                            style={{ width: `${opp.probability}%` }}
                          />
                        </div>
                        <span className="text-muted-foreground">%{opp.probability}</span>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center justify-between pt-1 border-t">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={stages.indexOf(opp.stage) === 0}
                          onClick={(e) => { e.stopPropagation(); moveStage(opp, "prev"); }}
                          title="Önceki aşamaya taşı"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <div className="flex gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => { e.stopPropagation(); openEdit(opp); }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(opp);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={stages.indexOf(opp.stage) === stages.length - 1}
                          onClick={(e) => { e.stopPropagation(); moveStage(opp, "next"); }}
                          title="Sonraki aşamaya taşı"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Fırsat</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Müşteri</th>
                  <th className="text-left p-3 font-medium">Aşama</th>
                  <th className="text-right p-3 font-medium hidden md:table-cell">Tahmini Tutar</th>
                  <th className="text-center p-3 font-medium hidden lg:table-cell">Olasılık</th>
                  <th className="text-right p-3 font-medium">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opp) => (
                  <tr key={opp.id} className="border-b hover:bg-accent/50">
                    <td className="p-3">
                      <div className="font-medium">{opp.title}</div>
                      {opp.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {opp.description}
                        </div>
                      )}
                    </td>
                    <td className="p-3 hidden md:table-cell">{opp.customer.name}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <div className={`h-2 w-2 rounded-full ${stageDotColors[opp.stage]}`} />
                        {stageLabels[opp.stage]}
                      </div>
                    </td>
                    <td className="p-3 text-right hidden md:table-cell">
                      {opp.estimatedValue
                        ? formatCurrency(Number(opp.estimatedValue))
                        : "—"}
                    </td>
                    <td className="p-3 text-center hidden lg:table-cell">
                      %{opp.probability}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(opp)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelected(opp);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {opportunities.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-muted-foreground">
                      Henüz fırsat kaydı yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* ═══ Create/Edit Dialog ═══ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selected ? "Fırsat Düzenle" : "Yeni Fırsat"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Müşteri *</Label>
              <Select
                value={form.customerId}
                onValueChange={(v) => setForm({ ...form, customerId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Müşteri seçin" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Başlık *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Fırsat başlığı"
              />
            </div>
            <div>
              <Label>Açıklama</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Aşama</Label>
                <Select
                  value={form.stage}
                  onValueChange={(v) => setForm({ ...form, stage: v as Stage })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((s) => (
                      <SelectItem key={s} value={s}>
                        {stageLabels[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tahmini Tutar (₺)</Label>
                <Input
                  type="number"
                  value={form.estimatedValue}
                  onChange={(e) =>
                    setForm({ ...form, estimatedValue: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kazanma Olasılığı (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={form.probability}
                  onChange={(e) =>
                    setForm({ ...form, probability: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <Label>Tahmini Kapanış</Label>
                <Input
                  type="date"
                  value={form.expectedClose}
                  onChange={(e) =>
                    setForm({ ...form, expectedClose: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kaynak</Label>
                <Input
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  placeholder="Referans, ihale, web, vb."
                />
              </div>
              <div>
                <Label>Sorumlu</Label>
                <Input
                  value={form.assignedTo}
                  onChange={(e) =>
                    setForm({ ...form, assignedTo: e.target.value })
                  }
                  placeholder="Ad Soyad"
                />
              </div>
            </div>
            {form.stage === "LOST" && (
              <div>
                <Label>Kaybetme Nedeni</Label>
                <Textarea
                  value={form.lostReason}
                  onChange={(e) =>
                    setForm({ ...form, lostReason: e.target.value })
                  }
                  rows={2}
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Kaydediliyor..." : selected ? "Güncelle" : "Kaydet"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ Delete Dialog ═══ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fırsat Sil</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <strong>{selected?.title}</strong> fırsatını silmek istediğinize emin
            misiniz?
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting ? "Siliniyor..." : "Sil"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
