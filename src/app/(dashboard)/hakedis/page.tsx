"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Trash2,
  Eye,
  Building2,
  Landmark,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  CircleDollarSign,
  X,
} from "lucide-react";

/* ─── TYPES ─── */
interface Project {
  id: string;
  name: string;
}
interface Company {
  id: string;
  name: string;
}
interface HakedisItem {
  id?: string;
  pozNo: string;
  description: string;
  unit: string;
  contractQty: number;
  unitPrice: number;
  previousQty: number;
  currentQty: number;
  cumulativeQty: number;
  amount: number;
}
interface Hakedis {
  id: string;
  projectId: string;
  companyId: string | null;
  type: "ISVEREN" | "TASERON";
  no: number;
  period: string;
  startDate: string | null;
  endDate: string | null;
  totalAmount: number;
  previousAmount: number;
  currentAmount: number;
  advanceDeduction: number;
  retentionRate: number;
  retentionAmount: number;
  stampTax: number;
  otherDeduction: number;
  netAmount: number;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "PAID";
  notes: string | null;
  project: { id: string; name: string };
  company: { id: string; name: string } | null;
  items: HakedisItem[];
  createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  DRAFT: { label: "Taslak", variant: "secondary" },
  SUBMITTED: { label: "Gönderildi", variant: "default" },
  APPROVED: { label: "Onaylandı", variant: "outline" },
  PAID: { label: "Ödendi", variant: "default" },
};

const EMPTY_ITEM: HakedisItem = {
  pozNo: "",
  description: "",
  unit: "",
  contractQty: 0,
  unitPrice: 0,
  previousQty: 0,
  currentQty: 0,
  cumulativeQty: 0,
  amount: 0,
};

function formatCurrency(val: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(val);
}

function formatNumber(val: number) {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(val);
}

/* ═══════════ MAIN PAGE ═══════════ */
export default function HakedisPage() {
  const [tab, setTab] = useState<"ISVEREN" | "TASERON">("ISVEREN");
  const [hakedisler, setHakedisler] = useState<Hakedis[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedHakedis, setSelectedHakedis] = useState<Hakedis | null>(null);

  // Form states
  const [formProjectId, setFormProjectId] = useState("");
  const [formCompanyId, setFormCompanyId] = useState("");
  const [formPeriod, setFormPeriod] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formItems, setFormItems] = useState<HakedisItem[]>([{ ...EMPTY_ITEM }]);
  const [formAdvance, setFormAdvance] = useState(0);
  const [formRetention, setFormRetention] = useState(0);
  const [formStamp, setFormStamp] = useState(0);
  const [formOther, setFormOther] = useState(0);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [hRes, pRes, cRes] = await Promise.all([
        fetch(`/api/hakedis?type=${tab}`),
        fetch("/api/projeler"),
        fetch("/api/sirketler"),
      ]);
      if (hRes.ok) setHakedisler(await hRes.json());
      if (pRes.ok) setProjects(await pRes.json());
      if (cRes.ok) setCompanies(await cRes.json());
    } catch {
      toast.error("Veriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ─── Form item hesapla ─── */
  const updateItem = (idx: number, field: keyof HakedisItem, value: string | number) => {
    const updated = [...formItems];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updated[idx] as any)[field] = value;
    // Auto calc
    const item = updated[idx];
    item.cumulativeQty = (item.previousQty || 0) + (item.currentQty || 0);
    item.amount = (item.currentQty || 0) * (item.unitPrice || 0);
    setFormItems(updated);
  };

  const addItem = () => setFormItems([...formItems, { ...EMPTY_ITEM }]);
  const removeItem = (idx: number) => {
    if (formItems.length <= 1) return;
    setFormItems(formItems.filter((_, i) => i !== idx));
  };

  /* ─── Toplam hesaplar ─── */
  const currentTotal = formItems.reduce((s, i) => s + (i.amount || 0), 0);
  const retentionAmount = currentTotal * (formRetention / 100);
  const netTotal = currentTotal - formAdvance - retentionAmount - formStamp - formOther;

  /* ─── Oluştur ─── */
  const handleCreate = async () => {
    if (!formProjectId || !formPeriod) {
      toast.error("Proje ve dönem zorunludur");
      return;
    }
    if (tab === "TASERON" && !formCompanyId) {
      toast.error("Taşeron firması seçiniz");
      return;
    }

    try {
      const res = await fetch("/api/hakedis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: formProjectId,
          companyId: tab === "TASERON" ? formCompanyId : null,
          type: tab,
          period: formPeriod,
          startDate: formStartDate || null,
          endDate: formEndDate || null,
          notes: formNotes || null,
          items: formItems.filter((i) => i.description),
          advanceDeduction: formAdvance,
          retentionRate: formRetention,
          stampTax: formStamp,
          otherDeduction: formOther,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Hakediş başarıyla oluşturuldu");
      setCreateOpen(false);
      resetForm();
      fetchAll();
    } catch {
      toast.error("Hakediş oluşturulamadı");
    }
  };

  /* ─── Durum güncelle ─── */
  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/hakedis/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success("Durum güncellendi");
      fetchAll();
      if (selectedHakedis?.id === id) {
        const updated = await res.json();
        setSelectedHakedis(updated);
      }
    } catch {
      toast.error("Durum güncellenemedi");
    }
  };

  /* ─── Sil ─── */
  const handleDelete = async (id: string) => {
    if (!confirm("Bu hakedişi silmek istediğinize emin misiniz?")) return;
    try {
      await fetch(`/api/hakedis/${id}`, { method: "DELETE" });
      toast.success("Hakediş silindi");
      fetchAll();
      if (selectedHakedis?.id === id) setDetailOpen(false);
    } catch {
      toast.error("Hakediş silinemedi");
    }
  };

  /* ─── Detay aç ─── */
  const openDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/hakedis/${id}`);
      if (!res.ok) throw new Error();
      setSelectedHakedis(await res.json());
      setDetailOpen(true);
    } catch {
      toast.error("Hakediş detayı yüklenemedi");
    }
  };

  const resetForm = () => {
    setFormProjectId("");
    setFormCompanyId("");
    setFormPeriod("");
    setFormStartDate("");
    setFormEndDate("");
    setFormNotes("");
    setFormItems([{ ...EMPTY_ITEM }]);
    setFormAdvance(0);
    setFormRetention(0);
    setFormStamp(0);
    setFormOther(0);
  };

  /* ─── Özet kartları ─── */
  const filtered = hakedisler.filter((h) => h.type === tab);
  const totalCurrent = filtered.reduce((s, h) => s + h.currentAmount, 0);
  const totalNet = filtered.reduce((s, h) => s + h.netAmount, 0);
  const totalDeductions = filtered.reduce(
    (s, h) => s + h.advanceDeduction + h.retentionAmount + h.stampTax + h.otherDeduction,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Hakediş Yönetimi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            İşveren ve taşeron hakedişlerini yönetin
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as "ISVEREN" | "TASERON")}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="ISVEREN" className="gap-2">
              <Landmark className="h-4 w-4" />
              İşveren Hakedişi
            </TabsTrigger>
            <TabsTrigger value="TASERON" className="gap-2">
              <Building2 className="h-4 w-4" />
              Taşeron Hakedişi
            </TabsTrigger>
          </TabsList>

          <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Yeni Hakediş
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {tab === "ISVEREN" ? "İşveren Hakedişi" : "Taşeron Hakedişi"} Oluştur
                </DialogTitle>
              </DialogHeader>

              {/* Form */}
              <div className="space-y-6 mt-4">
                {/* Üst bilgiler */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label>Proje *</Label>
                    <Select value={formProjectId} onValueChange={setFormProjectId}>
                      <SelectTrigger><SelectValue placeholder="Proje seçin" /></SelectTrigger>
                      <SelectContent>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {tab === "TASERON" && (
                    <div>
                      <Label>Taşeron Firma *</Label>
                      <Select value={formCompanyId} onValueChange={setFormCompanyId}>
                        <SelectTrigger><SelectValue placeholder="Firma seçin" /></SelectTrigger>
                        <SelectContent>
                          {companies.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label>Dönem *</Label>
                    <Input
                      placeholder="Örn: Ocak 2026"
                      value={formPeriod}
                      onChange={(e) => setFormPeriod(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Başlangıç Tarihi</Label>
                    <Input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Bitiş Tarihi</Label>
                    <Input
                      type="date"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                {/* İş Kalemleri */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">İş Kalemleri</h3>
                    <Button size="sm" variant="outline" onClick={addItem} className="gap-1">
                      <Plus className="h-3 w-3" /> Kalem Ekle
                    </Button>
                  </div>

                  <div className="overflow-x-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">Poz No</TableHead>
                          <TableHead className="min-w-[180px]">Tanım</TableHead>
                          <TableHead className="w-16">Birim</TableHead>
                          <TableHead className="w-24 text-right">Söz. Miktar</TableHead>
                          <TableHead className="w-24 text-right">Birim Fiyat</TableHead>
                          <TableHead className="w-24 text-right">Önceki Mik.</TableHead>
                          <TableHead className="w-24 text-right">Bu Dönem</TableHead>
                          <TableHead className="w-24 text-right">Toplam Mik.</TableHead>
                          <TableHead className="w-28 text-right">Tutar (₺)</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formItems.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <Input
                                className="h-8 text-xs"
                                value={item.pozNo}
                                onChange={(e) => updateItem(idx, "pozNo", e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                className="h-8 text-xs"
                                value={item.description}
                                onChange={(e) => updateItem(idx, "description", e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                className="h-8 text-xs"
                                value={item.unit}
                                onChange={(e) => updateItem(idx, "unit", e.target.value)}
                                placeholder="m²"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                className="h-8 text-xs text-right"
                                value={item.contractQty || ""}
                                onChange={(e) => updateItem(idx, "contractQty", parseFloat(e.target.value) || 0)}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                className="h-8 text-xs text-right"
                                value={item.unitPrice || ""}
                                onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                className="h-8 text-xs text-right"
                                value={item.previousQty || ""}
                                onChange={(e) => updateItem(idx, "previousQty", parseFloat(e.target.value) || 0)}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                className="h-8 text-xs text-right"
                                value={item.currentQty || ""}
                                onChange={(e) => updateItem(idx, "currentQty", parseFloat(e.target.value) || 0)}
                              />
                            </TableCell>
                            <TableCell className="text-right text-xs font-mono">
                              {formatNumber(item.cumulativeQty)}
                            </TableCell>
                            <TableCell className="text-right text-xs font-mono font-semibold">
                              {formatCurrency(item.amount)}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => removeItem(idx)}
                                disabled={formItems.length <= 1}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <Separator />

                {/* Kesintiler & Özet */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Kesintiler</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Avans Kesintisi (₺)</Label>
                        <Input
                          type="number"
                          value={formAdvance || ""}
                          onChange={(e) => setFormAdvance(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Teminat Oranı (%)</Label>
                        <Input
                          type="number"
                          value={formRetention || ""}
                          onChange={(e) => setFormRetention(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Damga Vergisi (₺)</Label>
                        <Input
                          type="number"
                          value={formStamp || ""}
                          onChange={(e) => setFormStamp(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Diğer Kesintiler (₺)</Label>
                        <Input
                          type="number"
                          value={formOther || ""}
                          onChange={(e) => setFormOther(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Notlar</Label>
                      <Textarea
                        rows={2}
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        placeholder="Ek açıklama..."
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Hakediş Özeti</h3>
                    <Card>
                      <CardContent className="pt-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bu Dönem Tutarı</span>
                          <span className="font-mono font-semibold">{formatCurrency(currentTotal)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-muted-foreground">
                          <span>Avans Kesintisi</span>
                          <span className="font-mono">- {formatCurrency(formAdvance)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Teminat (%{formRetention})</span>
                          <span className="font-mono">- {formatCurrency(retentionAmount)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Damga Vergisi</span>
                          <span className="font-mono">- {formatCurrency(formStamp)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Diğer Kesintiler</span>
                          <span className="font-mono">- {formatCurrency(formOther)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-base font-bold">
                          <span>Net Ödenecek</span>
                          <span className="font-mono text-primary">{formatCurrency(netTotal)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm(); }}>
                    İptal
                  </Button>
                  <Button onClick={handleCreate}>
                    <Calculator className="h-4 w-4 mr-1" />
                    Hakediş Oluştur
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* İçerik — her iki sekme aynı yapıda */}
        {(["ISVEREN", "TASERON"] as const).map((t) => (
          <TabsContent key={t} value={t} className="space-y-4">
            {/* KPI kartları */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Toplam Hakediş</p>
                      <p className="text-xl font-bold">{filtered.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-green-100 p-2">
                      <ArrowUpRight className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Bu Dönem Toplamı</p>
                      <p className="text-xl font-bold font-mono">{formatCurrency(totalCurrent)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-100 p-2">
                      <CircleDollarSign className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Net Ödenecek Toplam</p>
                      <p className="text-xl font-bold font-mono">{formatCurrency(totalNet)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Hakediş Tablosu */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {t === "ISVEREN" ? "İşveren Hakedişleri" : "Taşeron Hakedişleri"}
                </CardTitle>
                <CardDescription>
                  {t === "ISVEREN"
                    ? "İşverene kestiğiniz hakediş faturaları"
                    : "Taşerona ödenen hakediş faturaları"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-10 text-muted-foreground">Yükleniyor...</div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    Henüz hakediş kaydı bulunmamaktadır.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">No</TableHead>
                          <TableHead>Proje</TableHead>
                          {t === "TASERON" && <TableHead>Firma</TableHead>}
                          <TableHead>Dönem</TableHead>
                          <TableHead className="text-right">Bu Dönem</TableHead>
                          <TableHead className="text-right">Kesintiler</TableHead>
                          <TableHead className="text-right">Net Tutar</TableHead>
                          <TableHead className="text-center">Durum</TableHead>
                          <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((h) => {
                          const ded =
                            h.advanceDeduction + h.retentionAmount + h.stampTax + h.otherDeduction;
                          const st = STATUS_LABELS[h.status];
                          return (
                            <TableRow key={h.id}>
                              <TableCell className="font-mono font-semibold">#{h.no}</TableCell>
                              <TableCell className="font-medium">{h.project.name}</TableCell>
                              {t === "TASERON" && (
                                <TableCell>{h.company?.name ?? "-"}</TableCell>
                              )}
                              <TableCell>{h.period}</TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrency(h.currentAmount)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-red-600">
                                {ded > 0 ? `- ${formatCurrency(ded)}` : "-"}
                              </TableCell>
                              <TableCell className="text-right font-mono font-semibold">
                                {formatCurrency(h.netAmount)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={st.variant}>{st.label}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => openDetail(h.id)}
                                    title="Detay"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-red-500"
                                    onClick={() => handleDelete(h.id)}
                                    title="Sil"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* ─── Detay Dialog ─── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          {selectedHakedis && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  {selectedHakedis.type === "ISVEREN" ? "İşveren" : "Taşeron"} Hakediş #{selectedHakedis.no}
                  <Badge variant={STATUS_LABELS[selectedHakedis.status].variant}>
                    {STATUS_LABELS[selectedHakedis.status].label}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 mt-3">
                {/* Üst bilgiler */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Proje</span>
                    <p className="font-medium">{selectedHakedis.project.name}</p>
                  </div>
                  {selectedHakedis.company && (
                    <div>
                      <span className="text-muted-foreground text-xs">Firma</span>
                      <p className="font-medium">{selectedHakedis.company.name}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground text-xs">Dönem</span>
                    <p className="font-medium">{selectedHakedis.period}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Tarih</span>
                    <p className="font-medium">
                      {selectedHakedis.startDate
                        ? new Date(selectedHakedis.startDate).toLocaleDateString("tr-TR")
                        : "-"}
                      {" — "}
                      {selectedHakedis.endDate
                        ? new Date(selectedHakedis.endDate).toLocaleDateString("tr-TR")
                        : "-"}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Kalemler */}
                <div className="overflow-x-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Poz No</TableHead>
                        <TableHead>İş Tanımı</TableHead>
                        <TableHead className="w-16">Birim</TableHead>
                        <TableHead className="text-right w-24">Söz. Mik.</TableHead>
                        <TableHead className="text-right w-24">B. Fiyat</TableHead>
                        <TableHead className="text-right w-24">Önceki</TableHead>
                        <TableHead className="text-right w-24">Bu Dönem</TableHead>
                        <TableHead className="text-right w-24">Toplam</TableHead>
                        <TableHead className="text-right w-28">Tutar (₺)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedHakedis.items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-xs">{item.pozNo}</TableCell>
                          <TableCell className="text-xs">{item.description}</TableCell>
                          <TableCell className="text-xs">{item.unit}</TableCell>
                          <TableCell className="text-right text-xs font-mono">
                            {formatNumber(item.contractQty)}
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono">
                            {formatCurrency(item.unitPrice)}
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono">
                            {formatNumber(item.previousQty)}
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono font-semibold">
                            {formatNumber(item.currentQty)}
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono">
                            {formatNumber(item.cumulativeQty)}
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono font-bold">
                            {formatCurrency(item.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Özet */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2 text-sm">
                    <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                      Kesintiler
                    </h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Avans Kesintisi</span>
                        <span className="font-mono text-red-600">
                          {formatCurrency(selectedHakedis.advanceDeduction)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Teminat (%{selectedHakedis.retentionRate})</span>
                        <span className="font-mono text-red-600">
                          {formatCurrency(selectedHakedis.retentionAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Damga Vergisi</span>
                        <span className="font-mono text-red-600">
                          {formatCurrency(selectedHakedis.stampTax)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Diğer</span>
                        <span className="font-mono text-red-600">
                          {formatCurrency(selectedHakedis.otherDeduction)}
                        </span>
                      </div>
                    </div>
                    {selectedHakedis.notes && (
                      <div className="mt-3">
                        <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-1">
                          Notlar
                        </h4>
                        <p className="text-xs text-muted-foreground">{selectedHakedis.notes}</p>
                      </div>
                    )}
                  </div>

                  <Card className="border-primary/20">
                    <CardContent className="pt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Önceki Hakediş Toplamı</span>
                        <span className="font-mono">{formatCurrency(selectedHakedis.previousAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bu Dönem Tutarı</span>
                        <span className="font-mono font-semibold">
                          {formatCurrency(selectedHakedis.currentAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Genel Toplam</span>
                        <span className="font-mono">{formatCurrency(selectedHakedis.totalAmount)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Toplam Kesinti</span>
                        <span className="font-mono text-red-600">
                          - {formatCurrency(
                            selectedHakedis.advanceDeduction +
                            selectedHakedis.retentionAmount +
                            selectedHakedis.stampTax +
                            selectedHakedis.otherDeduction
                          )}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Net Ödenecek</span>
                        <span className="font-mono text-primary">
                          {formatCurrency(selectedHakedis.netAmount)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Durum güncelleme */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-sm font-medium mr-2">Durumu Güncelle:</span>
                  {(["DRAFT", "SUBMITTED", "APPROVED", "PAID"] as const).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={selectedHakedis.status === s ? "default" : "outline"}
                      onClick={() => handleStatusChange(selectedHakedis.id, s)}
                      className="text-xs"
                    >
                      {STATUS_LABELS[s].label}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
