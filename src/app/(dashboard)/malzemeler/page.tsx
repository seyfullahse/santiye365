"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
import { Plus, Pencil, Trash2, Upload, Download, Package } from "lucide-react";
import { toast } from "sonner";
import { utils, read, writeFileXLSX } from "xlsx";

// ─── Types ──────────────────────────────────────────────
interface Project {
  id: string;
  name: string;
}
interface Zone {
  id: string;
  name: string;
  projectId: string;
}
interface Floor {
  id: string;
  name: string;
  zoneId: string;
}

interface MaterialItem {
  id: string;
  projectId: string;
  zoneId: string;
  floorId: string;
  pozNo: string;
  orderPriority: number;
  scope: string;
  unit: string;
  quantity: number;
  designApproval: string;
  ownerApproval: string;
  approvalNote: string | null;
  quotationFirms: string | null;
  orderDecision: string | null;
  supplierName: string | null;
  supplierContact: string | null;
  orderStatus: string;
  deliveryStatus: string;
  responsiblePerson: string | null;
  note: string | null;
  project: { name: string };
  zone: { name: string };
  floor: { name: string };
}

// ─── Enums / Labels ─────────────────────────────────────
type ApprovalStatus = "BEKLEMEDE" | "ONAYLANDI" | "REDDEDILDI" | "REVIZE";
type OrderStatus = "BEKLEMEDE" | "SIPARIS_VERILDI" | "URETIMDE" | "HAZIRLANDI" | "IPTAL";
type DeliveryStatus = "BEKLEMEDE" | "YOLDA" | "TESLIM_EDILDI" | "EKSIK_TESLIM" | "IPTAL";

const APPROVAL_LABELS: Record<ApprovalStatus, string> = {
  BEKLEMEDE: "Beklemede",
  ONAYLANDI: "Onaylandı",
  REDDEDILDI: "Reddedildi",
  REVIZE: "Revize",
};

const ORDER_LABELS: Record<OrderStatus, string> = {
  BEKLEMEDE: "Beklemede",
  SIPARIS_VERILDI: "Sipariş Verildi",
  URETIMDE: "Üretimde",
  HAZIRLANDI: "Hazırlandı",
  IPTAL: "İptal",
};

const DELIVERY_LABELS: Record<DeliveryStatus, string> = {
  BEKLEMEDE: "Beklemede",
  YOLDA: "Yolda",
  TESLIM_EDILDI: "Teslim Edildi",
  EKSIK_TESLIM: "Eksik Teslim",
  IPTAL: "İptal",
};

function getApprovalBadge(status: string) {
  switch (status) {
    case "ONAYLANDI":
      return <Badge variant="outline" className="border-green-500 text-green-600 whitespace-nowrap">Onaylandı</Badge>;
    case "REDDEDILDI":
      return <Badge variant="destructive" className="whitespace-nowrap">Reddedildi</Badge>;
    case "REVIZE":
      return <Badge variant="default" className="bg-yellow-500 whitespace-nowrap">Revize</Badge>;
    default:
      return <Badge variant="secondary" className="whitespace-nowrap">Beklemede</Badge>;
  }
}

function getOrderBadge(status: string) {
  switch (status) {
    case "SIPARIS_VERILDI":
      return <Badge variant="default" className="whitespace-nowrap">Sipariş Verildi</Badge>;
    case "URETIMDE":
      return <Badge variant="outline" className="border-blue-500 text-blue-600 whitespace-nowrap">Üretimde</Badge>;
    case "HAZIRLANDI":
      return <Badge variant="outline" className="border-green-500 text-green-600 whitespace-nowrap">Hazırlandı</Badge>;
    case "IPTAL":
      return <Badge variant="destructive" className="whitespace-nowrap">İptal</Badge>;
    default:
      return <Badge variant="secondary" className="whitespace-nowrap">Beklemede</Badge>;
  }
}

function getDeliveryBadge(status: string) {
  switch (status) {
    case "YOLDA":
      return <Badge variant="default" className="whitespace-nowrap">Yolda</Badge>;
    case "TESLIM_EDILDI":
      return <Badge variant="outline" className="border-green-500 text-green-600 whitespace-nowrap">Teslim Edildi</Badge>;
    case "EKSIK_TESLIM":
      return <Badge variant="default" className="bg-yellow-500 whitespace-nowrap">Eksik Teslim</Badge>;
    case "IPTAL":
      return <Badge variant="destructive" className="whitespace-nowrap">İptal</Badge>;
    default:
      return <Badge variant="secondary" className="whitespace-nowrap">Beklemede</Badge>;
  }
}

// ─── Empty form ─────────────────────────────────────────
const EMPTY_FORM = {
  projectId: "",
  zoneId: "",
  floorId: "",
  pozNo: "",
  orderPriority: 0,
  scope: "",
  unit: "",
  quantity: 0,
  designApproval: "BEKLEMEDE" as ApprovalStatus,
  ownerApproval: "BEKLEMEDE" as ApprovalStatus,
  approvalNote: "",
  quotationFirms: "",
  orderDecision: "",
  supplierName: "",
  supplierContact: "",
  orderStatus: "BEKLEMEDE" as OrderStatus,
  deliveryStatus: "BEKLEMEDE" as DeliveryStatus,
  responsiblePerson: "",
  note: "",
};

// ─── Main Page Component ────────────────────────────────
export default function MalzemelerPage() {
  const [items, setItems] = useState<MaterialItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [formZones, setFormZones] = useState<Zone[]>([]);
  const [formFloors, setFormFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterProjectId, setFilterProjectId] = useState("");
  const [filterZoneId, setFilterZoneId] = useState("");
  const [filterFloorId, setFilterFloorId] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ─── Data fetch ─────────────────────────────────────
  useEffect(() => {
    fetch("/api/projeler").then((r) => r.json()).then(setProjects);
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterProjectId) params.set("projectId", filterProjectId);
      if (filterZoneId) params.set("zoneId", filterZoneId);
      if (filterFloorId) params.set("floorId", filterFloorId);
      const qs = params.toString();
      const url = qs ? `/api/malzemeler?${qs}` : "/api/malzemeler";
      const res = await fetch(url);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
      setSelectedIds(new Set());
    } catch {
      toast.error("Malzemeler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [filterProjectId, filterZoneId, filterFloorId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Filter cascading
  useEffect(() => {
    if (filterProjectId) {
      fetch(`/api/mahaller?projectId=${filterProjectId}`)
        .then((r) => r.json())
        .then(setZones);
    } else {
      setZones([]);
      setFloors([]);
      setFilterZoneId("");
      setFilterFloorId("");
    }
  }, [filterProjectId]);

  useEffect(() => {
    if (filterZoneId) {
      fetch(`/api/katlar?zoneId=${filterZoneId}`)
        .then((r) => r.json())
        .then(setFloors);
    } else {
      setFloors([]);
      setFilterFloorId("");
    }
  }, [filterZoneId]);

  // Form cascading
  useEffect(() => {
    if (form.projectId) {
      fetch(`/api/mahaller?projectId=${form.projectId}`)
        .then((r) => r.json())
        .then(setFormZones);
    } else {
      setFormZones([]);
      setFormFloors([]);
    }
  }, [form.projectId]);

  useEffect(() => {
    if (form.zoneId) {
      fetch(`/api/katlar?zoneId=${form.zoneId}`)
        .then((r) => r.json())
        .then(setFormFloors);
    } else {
      setFormFloors([]);
    }
  }, [form.zoneId]);

  // ─── Summary calculations ──────────────────────────
  const safeItems = Array.isArray(items) ? items : [];
  const totalQuantity = safeItems.reduce((sum, i) => sum + (i.quantity || 0), 0);
  const deliveredCount = safeItems.filter((i) => i.deliveryStatus === "TESLIM_EDILDI").length;
  const waitingApproval = safeItems.filter(
    (i) => i.designApproval === "BEKLEMEDE" || i.ownerApproval === "BEKLEMEDE"
  ).length;

  // ─── CRUD ───────────────────────────────────────────
  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormZones([]);
    setFormFloors([]);
    setDialogOpen(true);
  }

  async function openEdit(item: MaterialItem) {
    setEditingId(item.id);
    setForm({
      projectId: item.projectId,
      zoneId: item.zoneId,
      floorId: item.floorId,
      pozNo: item.pozNo,
      orderPriority: item.orderPriority,
      scope: item.scope,
      unit: item.unit,
      quantity: item.quantity,
      designApproval: item.designApproval as ApprovalStatus,
      ownerApproval: item.ownerApproval as ApprovalStatus,
      approvalNote: item.approvalNote || "",
      quotationFirms: item.quotationFirms || "",
      orderDecision: item.orderDecision || "",
      supplierName: item.supplierName || "",
      supplierContact: item.supplierContact || "",
      orderStatus: item.orderStatus as OrderStatus,
      deliveryStatus: item.deliveryStatus as DeliveryStatus,
      responsiblePerson: item.responsiblePerson || "",
      note: item.note || "",
    });
    // Load zones and floors for editing
    const [z, f] = await Promise.all([
      fetch(`/api/mahaller?projectId=${item.projectId}`).then((r) => r.json()),
      fetch(`/api/katlar?zoneId=${item.zoneId}`).then((r) => r.json()),
    ]);
    setFormZones(z);
    setFormFloors(f);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.projectId || !form.zoneId || !form.floorId || !form.scope) {
      toast.error("Proje, Mahal, Kat ve İş Kapsamı zorunludur");
      return;
    }
    try {
      const url = editingId ? `/api/malzemeler/${editingId}` : "/api/malzemeler";
      const method = editingId ? "PUT" : "POST";
      const payload = {
        ...form,
        orderPriority: Number(form.orderPriority) || 0,
        quantity: Number(form.quantity) || 0,
        approvalNote: form.approvalNote || null,
        quotationFirms: form.quotationFirms || null,
        orderDecision: form.orderDecision || null,
        supplierName: form.supplierName || null,
        supplierContact: form.supplierContact || null,
        responsiblePerson: form.responsiblePerson || null,
        note: form.note || null,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.error || "Kayıt hatası");
      }
      toast.success(editingId ? "Malzeme güncellendi" : "Malzeme oluşturuldu");
      setDialogOpen(false);
      fetchItems();
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Malzeme kaydedilemedi");
    }
  }

  async function handleDelete() {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/malzemeler/${deletingId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Malzeme silindi");
      setDeleteDialogOpen(false);
      setDeletingId(null);
      fetchItems();
    } catch {
      toast.error("Malzeme silinemedi");
    }
  }

  async function handleBulkDelete() {
    if (!selectedIds.size) return;
    try {
      const res = await fetch("/api/malzemeler", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${selectedIds.size} kayıt silindi`);
      fetchItems();
    } catch {
      toast.error("Toplu silme başarısız");
    }
  }

  // ─── Excel Export ───────────────────────────────────
  const handleExport = () => {
    const rows = safeItems.map((m) => ({
      PozNo: m.pozNo,
      SiparisOnceligi: m.orderPriority,
      IsKapsami: m.scope,
      Birim: m.unit,
      SiparisMiktari: m.quantity,
      Proje: m.project?.name ?? "",
      Mahal: m.zone?.name ?? "",
      Kat: m.floor?.name ?? "",
      TasarimOnayi: APPROVAL_LABELS[m.designApproval as ApprovalStatus] || m.designApproval,
      IsverenOnayi: APPROVAL_LABELS[m.ownerApproval as ApprovalStatus] || m.ownerApproval,
      OnayNotu: m.approvalNote ?? "",
      TeklifFirmalari: m.quotationFirms ?? "",
      SiparisKarari: m.orderDecision ?? "",
      TedarikciFirma: m.supplierName ?? "",
      Tedarikciiletisim: m.supplierContact ?? "",
      SiparisDurumu: ORDER_LABELS[m.orderStatus as OrderStatus] || m.orderStatus,
      TeslimDurumu: DELIVERY_LABELS[m.deliveryStatus as DeliveryStatus] || m.deliveryStatus,
      IlgiliKisi: m.responsiblePerson ?? "",
      Not: m.note ?? "",
    }));
    const ws = utils.json_to_sheet(rows);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Malzemeler");
    writeFileXLSX(wb, "malzeme-takip.xlsx");
    toast.success(`${rows.length} kayıt dışa aktarıldı`);
  };

  // ─── Excel Import ───────────────────────────────────
  const handleImportClick = () => fileInputRef.current?.click();

  const findByName = <T extends { id: string; name: string }>(
    list: T[],
    name: unknown
  ): string | null => {
    if (!name) return null;
    const n = String(name).trim().toLowerCase();
    const match = list.find((item) => item.name.toLowerCase() === n);
    return match?.id ?? null;
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const wb = read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = utils.sheet_to_json(ws) as Record<string, unknown>[];

      // Fetch all zones & floors for name matching
      const [allZones, allFloors] = await Promise.all([
        fetch("/api/mahaller").then((r) => r.json()),
        fetch("/api/katlar").then((r) => r.json()),
      ]);

      let success = 0;
      let fail = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;
        const scope = String(row.IsKapsami || row["İş Kapsamı"] || row["İŞİN KAPSAMI"] || row.scope || "").trim();

        if (!scope) {
          errors.push(`Satır ${rowNum}: İş Kapsamı boş`);
          fail++;
          continue;
        }

        const projectId = findByName(projects, row.Proje || row.Project || row.projectId);
        const zoneId = findByName(allZones, row.Mahal || row.Zone || row.zoneId);
        const floorId = findByName(allFloors, row.Kat || row.Floor || row.floorId);

        const missing: string[] = [];
        if (!projectId) missing.push("Proje");
        if (!zoneId) missing.push("Mahal");
        if (!floorId) missing.push("Kat");

        if (missing.length > 0) {
          errors.push(`Satır ${rowNum} (${scope}): ${missing.join(", ")} bulunamadı`);
          fail++;
          continue;
        }

        const payload = {
          projectId,
          zoneId,
          floorId,
          pozNo: String(row.PozNo || row["POZ NO"] || row.pozNo || ""),
          orderPriority: Number(row.SiparisOnceligi || row["Sipariş Önceliği"] || 0),
          scope,
          unit: String(row.Birim || row.BİRİM || row.unit || ""),
          quantity: Number(row.SiparisMiktari || row["Sipariş Miktarı"] || row.quantity || 0),
          designApproval: "BEKLEMEDE",
          ownerApproval: "BEKLEMEDE",
          orderStatus: "BEKLEMEDE",
          deliveryStatus: "BEKLEMEDE",
          supplierName: String(row.TedarikciFirma || row["Tedarikçi Firma"] || ""),
          supplierContact: String(row.Tedarikciiletisim || row["Tedarikçi İletişim"] || ""),
          responsiblePerson: String(row.IlgiliKisi || row["İlgili Kişi"] || ""),
          note: String(row.Not || row.note || ""),
        };

        try {
          const res = await fetch("/api/malzemeler", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error();
          success++;
        } catch {
          errors.push(`Satır ${rowNum} (${scope}): API hatası`);
          fail++;
        }
      }

      toast.success(`${success} malzeme içe aktarıldı`);
      if (fail) {
        toast.warning(`${fail} kayıt atlandı`);
        errors.slice(0, 5).forEach((err) => toast.error(err));
      }
      fetchItems();
    } catch {
      toast.error("Excel içe aktarma başarısız");
    } finally {
      e.target.value = "";
    }
  };

  // ─── Select all toggle ─────────────────────────────
  const allSelected = safeItems.length > 0 && selectedIds.size === safeItems.length;
  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(safeItems.map((i) => i.id)));
    }
  }
  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ─── Render ─────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Malzeme Takip</h1>
          <p className="text-sm text-muted-foreground">
            Proje, mahal ve kata bağlı malzeme sipariş ve teslimat takibi
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={handleImportClick}>
            <Upload className="h-4 w-4 mr-1" /> Excel İçe Aktar
          </Button>
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Excel Dışa Aktar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-1" /> Yeni Malzeme
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Malzeme Düzenle" : "Yeni Malzeme"}</DialogTitle>
              </DialogHeader>
              {/* ── Form ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                {/* Proje / Mahal / Kat */}
                <div>
                  <Label>Proje *</Label>
                  <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v, zoneId: "", floorId: "" })}>
                    <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Mahal *</Label>
                  <Select value={form.zoneId} onValueChange={(v) => setForm({ ...form, zoneId: v, floorId: "" })}>
                    <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                    <SelectContent>
                      {formZones.map((z) => (
                        <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Kat *</Label>
                  <Select value={form.floorId} onValueChange={(v) => setForm({ ...form, floorId: v })}>
                    <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                    <SelectContent>
                      {formFloors.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Poz / Öncelik / Birim / Miktar */}
                <div>
                  <Label>Poz No</Label>
                  <Input value={form.pozNo} onChange={(e) => setForm({ ...form, pozNo: e.target.value })} />
                </div>
                <div>
                  <Label>Sipariş Önceliği</Label>
                  <Input type="number" value={form.orderPriority} onChange={(e) => setForm({ ...form, orderPriority: Number(e.target.value) })} />
                </div>
                <div className="sm:col-span-2">
                  <Label>İş Kapsamı *</Label>
                  <Input value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} />
                </div>
                <div>
                  <Label>Birim</Label>
                  <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="m², adet, kg..." />
                </div>
                <div>
                  <Label>Sipariş Miktarı</Label>
                  <Input type="number" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
                </div>

                {/* Onay Süreci */}
                <div className="sm:col-span-2 border-t pt-3 mt-2">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Tasarım ve Malzeme Onay Süreci</p>
                </div>
                <div>
                  <Label>Tasarım Onayı</Label>
                  <Select value={form.designApproval} onValueChange={(v) => setForm({ ...form, designApproval: v as ApprovalStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(APPROVAL_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>İşveren / PY Onayı</Label>
                  <Select value={form.ownerApproval} onValueChange={(v) => setForm({ ...form, ownerApproval: v as ApprovalStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(APPROVAL_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label>Onay Notu / Karar</Label>
                  <Input value={form.approvalNote} onChange={(e) => setForm({ ...form, approvalNote: e.target.value })} />
                </div>

                {/* Malzeme Sipariş Süreci */}
                <div className="sm:col-span-2 border-t pt-3 mt-2">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Malzeme Sipariş Süreci</p>
                </div>
                <div>
                  <Label>Teklif Firmaları</Label>
                  <Input value={form.quotationFirms} onChange={(e) => setForm({ ...form, quotationFirms: e.target.value })} />
                </div>
                <div>
                  <Label>Sipariş Kararı</Label>
                  <Input value={form.orderDecision} onChange={(e) => setForm({ ...form, orderDecision: e.target.value })} />
                </div>

                {/* Ürün Siparişi ve Teslimi */}
                <div className="sm:col-span-2 border-t pt-3 mt-2">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Ürün Siparişi ve Teslimi</p>
                </div>
                <div>
                  <Label>Tedarikçi Firma</Label>
                  <Input value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} />
                </div>
                <div>
                  <Label>Tedarikçi İletişim</Label>
                  <Input value={form.supplierContact} onChange={(e) => setForm({ ...form, supplierContact: e.target.value })} />
                </div>
                <div>
                  <Label>Sipariş Durumu</Label>
                  <Select value={form.orderStatus} onValueChange={(v) => setForm({ ...form, orderStatus: v as OrderStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(ORDER_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Teslim Durumu</Label>
                  <Select value={form.deliveryStatus} onValueChange={(v) => setForm({ ...form, deliveryStatus: v as DeliveryStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(DELIVERY_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>İlgili Kişi</Label>
                  <Input value={form.responsiblePerson} onChange={(e) => setForm({ ...form, responsiblePerson: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Not</Label>
                  <Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={2} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                <Button onClick={handleSave}>{editingId ? "Güncelle" : "Kaydet"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleImportFile}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Toplam Kalem</span>
            <span className="text-lg font-bold">{safeItems.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Toplam Miktar</span>
            <span className="text-lg font-bold">{totalQuantity.toLocaleString("tr-TR")}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Onay Bekleyen</span>
            <span className="text-lg font-bold text-yellow-600">{waitingApproval}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Teslim Edilen</span>
            <span className="text-lg font-bold text-green-600">{deliveredCount}</span>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Select value={filterProjectId} onValueChange={(v) => { setFilterProjectId(v === "ALL" ? "" : v); setFilterZoneId(""); setFilterFloorId(""); }}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Tüm Projeler" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tüm Projeler</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterZoneId} onValueChange={(v) => { setFilterZoneId(v === "ALL" ? "" : v); setFilterFloorId(""); }}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Tüm Mahaller" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tüm Mahaller</SelectItem>
            {zones.map((z) => (
              <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterFloorId} onValueChange={(v) => setFilterFloorId(v === "ALL" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Tüm Katlar" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tüm Katlar</SelectItem>
            {floors.map((f) => (
              <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedIds.size > 0 && (
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4 mr-1" /> {selectedIds.size} Seçili Sil
          </Button>
        )}
      </div>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Malzeme Silinsin Mi?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Bu işlem geri alınamaz.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>İptal</Button>
            <Button variant="destructive" onClick={handleDelete}>Sil</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              {/* Group headers */}
              <TableRow className="bg-muted/50">
                <TableHead rowSpan={2} className="border-r w-10 text-center align-middle">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded" />
                </TableHead>
                <TableHead colSpan={5} className="border-r text-center font-bold text-xs bg-muted/30">
                  Genel Bilgiler
                </TableHead>
                <TableHead colSpan={3} className="border-r text-center font-bold text-xs bg-green-50 dark:bg-green-950/30">
                  Tasarım ve Onay Süreci
                </TableHead>
                <TableHead colSpan={2} className="border-r text-center font-bold text-xs bg-yellow-50 dark:bg-yellow-950/30">
                  Malzeme Sipariş Süreci
                </TableHead>
                <TableHead colSpan={5} className="border-r text-center font-bold text-xs bg-blue-50 dark:bg-blue-950/30">
                  Ürün Siparişi ve Teslimi
                </TableHead>
                <TableHead colSpan={2} className="text-center font-bold text-xs">
                  Diğer
                </TableHead>
              </TableRow>
              {/* Column headers */}
              <TableRow>
                {/* Genel Bilgiler */}
                <TableHead className="border-r whitespace-nowrap text-xs">Poz No</TableHead>
                <TableHead className="border-r whitespace-nowrap text-xs">Öncelik</TableHead>
                <TableHead className="border-r whitespace-nowrap text-xs min-w-[200px]">İş Kapsamı</TableHead>
                <TableHead className="border-r whitespace-nowrap text-xs">Birim</TableHead>
                <TableHead className="border-r whitespace-nowrap text-xs">Sipariş Mik.</TableHead>
                {/* Tasarım ve Onay */}
                <TableHead className="border-r whitespace-nowrap text-xs">Tasarım Onayı</TableHead>
                <TableHead className="border-r whitespace-nowrap text-xs">İşveren Onayı</TableHead>
                <TableHead className="border-r whitespace-nowrap text-xs">Durum / Karar</TableHead>
                {/* Malzeme Sipariş Süreci */}
                <TableHead className="border-r whitespace-nowrap text-xs">Teklif Firmaları</TableHead>
                <TableHead className="border-r whitespace-nowrap text-xs">Durum / Karar</TableHead>
                {/* Ürün Siparişi ve Teslimi */}
                <TableHead className="border-r whitespace-nowrap text-xs">Tedarikçi</TableHead>
                <TableHead className="border-r whitespace-nowrap text-xs">İletişim</TableHead>
                <TableHead className="border-r whitespace-nowrap text-xs">Sipariş Durumu</TableHead>
                <TableHead className="border-r whitespace-nowrap text-xs">Teslim Durumu</TableHead>
                <TableHead className="border-r whitespace-nowrap text-xs">İlgili Kişi</TableHead>
                {/* Diğer */}
                <TableHead className="border-r whitespace-nowrap text-xs">Not</TableHead>
                <TableHead className="whitespace-nowrap text-xs w-20">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={18} className="text-center py-10 text-muted-foreground">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : safeItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={18} className="text-center py-10">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Package className="h-10 w-10" />
                      <p>Henüz malzeme kaydı yok</p>
                      <p className="text-xs">
                        &quot;Yeni Malzeme&quot; veya &quot;Excel İçe Aktar&quot; ile başlayın
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                safeItems.map((item) => (
                  <TableRow key={item.id} className="text-xs">
                    <TableCell className="border-r text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleOne(item.id)}
                        className="rounded"
                      />
                    </TableCell>
                    {/* Genel */}
                    <TableCell className="border-r whitespace-nowrap">{item.pozNo}</TableCell>
                    <TableCell className="border-r text-center">{item.orderPriority}</TableCell>
                    <TableCell className="border-r max-w-[250px]">
                      <div className="truncate" title={item.scope}>{item.scope}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {item.project.name} › {item.zone.name} › {item.floor.name}
                      </div>
                    </TableCell>
                    <TableCell className="border-r whitespace-nowrap">{item.unit}</TableCell>
                    <TableCell className="border-r text-right font-mono">{item.quantity.toLocaleString("tr-TR")}</TableCell>
                    {/* Onay */}
                    <TableCell className="border-r">{getApprovalBadge(item.designApproval)}</TableCell>
                    <TableCell className="border-r">{getApprovalBadge(item.ownerApproval)}</TableCell>
                    <TableCell className="border-r whitespace-nowrap text-xs">{item.approvalNote || "-"}</TableCell>
                    {/* Sipariş Süreci */}
                    <TableCell className="border-r whitespace-nowrap text-xs">{item.quotationFirms || "-"}</TableCell>
                    <TableCell className="border-r whitespace-nowrap text-xs">{item.orderDecision || "-"}</TableCell>
                    {/* Teslim */}
                    <TableCell className="border-r whitespace-nowrap text-xs">{item.supplierName || "-"}</TableCell>
                    <TableCell className="border-r whitespace-nowrap text-xs">{item.supplierContact || "-"}</TableCell>
                    <TableCell className="border-r">{getOrderBadge(item.orderStatus)}</TableCell>
                    <TableCell className="border-r">{getDeliveryBadge(item.deliveryStatus)}</TableCell>
                    <TableCell className="border-r whitespace-nowrap text-xs">{item.responsiblePerson || "-"}</TableCell>
                    {/* Diğer */}
                    <TableCell className="border-r max-w-[150px] truncate text-xs" title={item.note || ""}>{item.note || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => {
                            setDeletingId(item.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
