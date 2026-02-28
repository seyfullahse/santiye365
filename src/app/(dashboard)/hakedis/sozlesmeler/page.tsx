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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Trash2,
  Eye,
  Building2,
  Landmark,
  ScrollText,
  FileSpreadsheet,
  Pencil,
  Save,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { useSozlesme } from "../sozlesme-context";

/* ─── TYPES ─── */
interface Project { id: string; name: string }
interface Company { id: string; name: string }
interface Contract {
  id: string;
  projectId: string;
  companyId: string | null;
  type: "ISVEREN" | "TASERON";
  name: string;
  currency: string;
  pricingModel: "AYRINTILI" | "TEKFIYAT";
  contractNo: string | null;
  contractDate: string | null;
  totalAmount: number;
  advanceRate: number;
  retentionRate: number;
  description: string | null;
  project: { id: string; name: string };
  company: { id: string; name: string } | null;
  _count?: { items: number };
  createdAt: string;
}

function formatCurrency(val: number, currency: string = "TRY") {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency, maximumFractionDigits: 2 }).format(val);
}
function formatNumber(val: number) {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(val);
}

export default function SozlesmelerPage() {
  const { refetch: refetchContext } = useSozlesme();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<"ISVEREN" | "TASERON">("ISVEREN");
  const [formProjectId, setFormProjectId] = useState("");
  const [formCompanyId, setFormCompanyId] = useState("");
  const [formContractNo, setFormContractNo] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formAdvanceRate, setFormAdvanceRate] = useState(0);
  const [formRetentionRate, setFormRetentionRate] = useState(0);
  const [formDescription, setFormDescription] = useState("");
  const [formCurrency, setFormCurrency] = useState("TRY");
  const [formPricingModel, setFormPricingModel] = useState<"AYRINTILI" | "TEKFIYAT">("AYRINTILI");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, pRes, coRes] = await Promise.all([
        fetch("/api/hakedis/sozlesmeler"),
        fetch("/api/projeler"),
        fetch("/api/sirketler"),
      ]);
      if (cRes.ok) setContracts(await cRes.json());
      if (pRes.ok) setProjects(await pRes.json());
      if (coRes.ok) setCompanies(await coRes.json());
    } catch {
      toast.error("Veriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async () => {
    if (!formName || !formProjectId) { toast.error("Sözleşme adı ve proje zorunludur"); return; }
    if (formType === "TASERON" && !formCompanyId) { toast.error("Taşeron sözleşmesi için firma seçiniz"); return; }
    try {
      const res = await fetch("/api/hakedis/sozlesmeler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName, type: formType, projectId: formProjectId,
          companyId: formType === "TASERON" ? formCompanyId : null,
          contractNo: formContractNo || null, contractDate: formDate || null,
          advanceRate: formAdvanceRate, retentionRate: formRetentionRate,
          description: formDescription || null,
          currency: formCurrency,
          pricingModel: formPricingModel,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Sözleşme oluşturuldu");
      setCreateOpen(false); resetForm(); fetchAll(); refetchContext();
    } catch { toast.error("Sözleşme oluşturulamadı"); }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    if (!formName || !formProjectId) { toast.error("Sözleşme adı ve proje zorunludur"); return; }
    if (formType === "TASERON" && !formCompanyId) { toast.error("Taşeron sözleşmesi için firma seçiniz"); return; }
    try {
      const res = await fetch(`/api/hakedis/sozlesmeler/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName, type: formType, projectId: formProjectId,
          companyId: formType === "TASERON" ? formCompanyId : null,
          contractNo: formContractNo || null, contractDate: formDate || null,
          advanceRate: Number(formAdvanceRate) || 0,
          retentionRate: Number(formRetentionRate) || 0,
          description: formDescription || null,
          currency: formCurrency,
          pricingModel: formPricingModel,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Güncelleme başarısız");
      }
      const updated = await res.json();
      toast.success("Sözleşme güncellendi");
      setCreateOpen(false); setEditingId(null); resetForm(); fetchAll(); refetchContext();
      if (selectedContract?.id === editingId) {
        setSelectedContract(updated);
      }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Sözleşme güncellenemedi"); }
  };

  const openEdit = (c: Contract) => {
    setEditingId(c.id);
    setFormName(c.name);
    setFormType(c.type);
    setFormProjectId(c.projectId);
    setFormCompanyId(c.companyId || "");
    setFormContractNo(c.contractNo || "");
    setFormDate(c.contractDate ? c.contractDate.slice(0, 10) : "");
    setFormAdvanceRate(c.advanceRate);
    setFormRetentionRate(c.retentionRate);
    setFormDescription(c.description || "");
    setFormCurrency(c.currency || "TRY");
    setFormPricingModel(c.pricingModel || "AYRINTILI");
    setCreateOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu sözleşmeyi silmek istediğinize emin misiniz?")) return;
    try {
      await fetch(`/api/hakedis/sozlesmeler/${id}`, { method: "DELETE" });
      toast.success("Sözleşme silindi"); fetchAll(); refetchContext();
      if (selectedContract?.id === id) setDetailOpen(false);
    } catch { toast.error("Sözleşme silinemedi"); }
  };

  const openDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/hakedis/sozlesmeler/${id}`);
      if (!res.ok) throw new Error();
      setSelectedContract(await res.json()); setDetailOpen(true);
    } catch { toast.error("Sözleşme detayı yüklenemedi"); }
  };

  const resetForm = () => {
    setFormName(""); setFormType("ISVEREN"); setFormProjectId(""); setFormCompanyId("");
    setFormContractNo(""); setFormDate(""); setFormAdvanceRate(0); setFormRetentionRate(0);
    setFormDescription(""); setFormCurrency("TRY"); setFormPricingModel("AYRINTILI");
  };

  const isverenContracts = contracts.filter((c) => c.type === "ISVEREN");
  const taseronContracts = contracts.filter((c) => c.type === "TASERON");
  const totalAmount = contracts.reduce((s, c) => s + c.totalAmount, 0);
  const isverenTotal = isverenContracts.reduce((s, c) => s + c.totalAmount, 0);
  const taseronTotal = taseronContracts.reduce((s, c) => s + c.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <ScrollText className="h-6 w-6 text-blue-600" />
            Sözleşmeler
          </h1>
          <p className="text-sm text-muted-foreground mt-1">İşveren ve taşeron sözleşmelerini yönetin, keşif bağlayın</p>
        </div>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) { resetForm(); setEditingId(null); } }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Yeni Sözleşme</Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingId ? "Sözleşme Düzenle" : "Yeni Sözleşme Oluştur"}</DialogTitle></DialogHeader>
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>Sözleşme Adı *</Label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Örn: Ana Yüklenici Sözleşmesi" />
                </div>
                <div>
                  <Label>Tip *</Label>
                  <Select value={formType} onValueChange={(v) => setFormType(v as "ISVEREN" | "TASERON")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ISVEREN">İşveren Sözleşmesi</SelectItem>
                      <SelectItem value="TASERON">Taşeron Sözleşmesi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Proje *</Label>
                  <Select value={formProjectId} onValueChange={setFormProjectId}>
                    <SelectTrigger><SelectValue placeholder="Proje seçin" /></SelectTrigger>
                    <SelectContent>{projects.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                {formType === "TASERON" && (
                  <div>
                    <Label>Taşeron Firma *</Label>
                    <Select value={formCompanyId} onValueChange={setFormCompanyId}>
                      <SelectTrigger><SelectValue placeholder="Firma seçin" /></SelectTrigger>
                      <SelectContent>{companies.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label>Sözleşme No</Label>
                  <Input value={formContractNo} onChange={(e) => setFormContractNo(e.target.value)} placeholder="Örn: SZL-2026-001" />
                </div>
                <div>
                  <Label>Sözleşme Tarihi</Label>
                  <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
                </div>
                <div>
                  <Label>Avans Oranı (%)</Label>
                  <Input type="number" value={formAdvanceRate || ""} onChange={(e) => setFormAdvanceRate(parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <Label>Teminat Oranı (%)</Label>
                  <Input type="number" value={formRetentionRate || ""} onChange={(e) => setFormRetentionRate(parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <Label>Para Birimi</Label>
                  <Select value={formCurrency} onValueChange={setFormCurrency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRY">₺ TRY — Türk Lirası</SelectItem>
                      <SelectItem value="USD">$ USD — Amerikan Doları</SelectItem>
                      <SelectItem value="EUR">€ EUR — Euro</SelectItem>
                      <SelectItem value="GBP">£ GBP — İngiliz Sterlini</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fiyatlandırma Modeli</Label>
                  <Select value={formPricingModel} onValueChange={(v) => setFormPricingModel(v as "AYRINTILI" | "TEKFIYAT")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AYRINTILI">Ayrıntılı (Malzeme + İşçilik + GGK)</SelectItem>
                      <SelectItem value="TEKFIYAT">Tek Fiyat (Birim Fiyat)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Açıklama</Label>
                <Textarea rows={2} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Sözleşme hakkında notlar..." />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm(); setEditingId(null); }}>İptal</Button>
                {editingId ? (
                  <Button onClick={handleUpdate}><Save className="h-4 w-4 mr-1" /> Güncelle</Button>
                ) : (
                  <Button onClick={handleCreate}><FileText className="h-4 w-4 mr-1" /> Sözleşme Oluştur</Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-blue-100 p-1.5"><FileText className="h-4 w-4 text-blue-600" /></div>
              <div>
                <p className="text-[11px] text-muted-foreground leading-none">Toplam Sözleşme</p>
                <p className="text-base font-bold leading-tight">{contracts.length} <span className="text-xs font-medium text-blue-600">{formatCurrency(totalAmount)}</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-green-100 p-1.5"><Landmark className="h-4 w-4 text-green-600" /></div>
              <div>
                <p className="text-[11px] text-muted-foreground leading-none">İşveren</p>
                <p className="text-base font-bold leading-tight">{isverenContracts.length} <span className="text-xs font-medium text-green-600">{formatCurrency(isverenTotal)}</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-orange-100 p-1.5"><Building2 className="h-4 w-4 text-orange-600" /></div>
              <div>
                <p className="text-[11px] text-muted-foreground leading-none">Taşeron</p>
                <p className="text-base font-bold leading-tight">{taseronContracts.length} <span className="text-xs font-medium text-orange-600">{formatCurrency(taseronTotal)}</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-purple-100 p-1.5"><ScrollText className="h-4 w-4 text-purple-600" /></div>
              <div>
                <p className="text-[11px] text-muted-foreground leading-none">Hakediş Tutarı</p>
                <p className="text-base font-bold leading-tight text-purple-700">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tablo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sözleşme Listesi</CardTitle>
          <CardDescription>Toplam tutar: {formatCurrency(totalAmount)} · {contracts.length} sözleşme</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Yükleniyor...</div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">Henüz sözleşme bulunmamaktadır.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Adı</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Proje</TableHead>
                    <TableHead>Firma</TableHead>
                    <TableHead>Söz. No</TableHead>
                    <TableHead className="text-center">Keşif</TableHead>
                    <TableHead>Para Birimi</TableHead>
                    <TableHead>Fiyat Modeli</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>
                        <Badge variant={c.type === "ISVEREN" ? "default" : "secondary"}>
                          {c.type === "ISVEREN" ? "İşveren" : "Taşeron"}
                        </Badge>
                      </TableCell>
                      <TableCell>{c.project.name}</TableCell>
                      <TableCell>{c.company?.name ?? "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{c.contractNo ?? "-"}</TableCell>
                      <TableCell className="text-center">
                        <Link href={`/hakedis/kesif?contract=${c.id}`}>
                          <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-muted">
                            <FileSpreadsheet className="h-3 w-3" />
                            {c._count?.items ?? 0} kalem
                          </Badge>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-mono">{c.currency}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.pricingModel === "AYRINTILI" ? "default" : "secondary"} className="text-xs">
                          {c.pricingModel === "AYRINTILI" ? "Ayrıntılı" : "Tek Fiyat"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">{formatCurrency(c.totalAmount, c.currency)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openDetail(c.id)} title="Detay"><Eye className="h-3.5 w-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-500" onClick={() => openEdit(c)} title="Düzenle"><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => handleDelete(c.id)} title="Sil"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detay Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          {selectedContract && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <ScrollText className="h-5 w-5 text-blue-600" />
                  {selectedContract.name}
                  <Badge variant={selectedContract.type === "ISVEREN" ? "default" : "secondary"}>
                    {selectedContract.type === "ISVEREN" ? "İşveren" : "Taşeron"}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 mt-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div><span className="text-muted-foreground text-xs">Proje</span><p className="font-medium">{selectedContract.project.name}</p></div>
                  {selectedContract.company && (
                    <div><span className="text-muted-foreground text-xs">Firma</span><p className="font-medium">{selectedContract.company.name}</p></div>
                  )}
                  <div><span className="text-muted-foreground text-xs">Sözleşme No</span><p className="font-medium">{selectedContract.contractNo || "-"}</p></div>
                  <div><span className="text-muted-foreground text-xs">Tarih</span><p className="font-medium">{selectedContract.contractDate ? new Date(selectedContract.contractDate).toLocaleDateString("tr-TR") : "-"}</p></div>
                  <div><span className="text-muted-foreground text-xs">Avans Oranı</span><p className="font-medium">%{selectedContract.advanceRate}</p></div>
                  <div><span className="text-muted-foreground text-xs">Teminat Oranı</span><p className="font-medium">%{selectedContract.retentionRate}</p></div>
                  <div><span className="text-muted-foreground text-xs">Toplam Tutar</span><p className="font-medium font-mono">{formatCurrency(selectedContract.totalAmount, selectedContract.currency)}</p></div>
                  <div><span className="text-muted-foreground text-xs">Para Birimi</span><p className="font-medium">{selectedContract.currency}</p></div>
                  <div><span className="text-muted-foreground text-xs">Fiyat Modeli</span><p className="font-medium">{selectedContract.pricingModel === "AYRINTILI" ? "Ayrıntılı (Malzeme+İşçilik+GGK)" : "Tek Fiyat"}</p></div>
                </div>
                {selectedContract.description && (
                  <div><span className="text-muted-foreground text-xs">Açıklama</span><p className="text-sm">{selectedContract.description}</p></div>
                )}
                <Separator />
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">İşlemler</h4>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => { setDetailOpen(false); openEdit(selectedContract); }}>
                      <Pencil className="h-4 w-4" /> Sözleşmeyi Düzenle
                    </Button>
                    <Link href={`/hakedis/kesif?contract=${selectedContract.id}`}>
                      <Button size="sm" variant="outline" className="gap-1">
                        <FileSpreadsheet className="h-4 w-4" /> Keşif Sayfasına Git
                      </Button>
                    </Link>
                    <Link href={`/hakedis/atasmanlar`}>
                      <Button size="sm" variant="outline" className="gap-1">
                        <ClipboardList className="h-4 w-4" /> Ataşmanlar
                      </Button>
                    </Link>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Keşif kalemleri ve ataşmanlar ayrı sayfalar üzerinden yönetilir.</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
