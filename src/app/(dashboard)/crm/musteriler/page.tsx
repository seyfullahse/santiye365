"use client";

import { useEffect, useState, useCallback } from "react";
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
  Search,
  Building2,
  User,
  Landmark,
  Phone,
  Mail,
  MapPin,
  Eye,
  Users,
  Target,
  MessageSquare,
  FolderKanban,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

/* ═══════ TYPES ═══════ */
type CustomerType = "COMPANY" | "INDIVIDUAL" | "GOVERNMENT";
type CustomerSegment = "PRIVATE" | "PUBLIC" | "CORPORATE" | "SME";
type CustomerStatus = "ACTIVE" | "INACTIVE" | "BLACKLISTED";

interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  segment: CustomerSegment;
  taxNo: string | null;
  taxOffice: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  notes: string | null;
  status: CustomerStatus;
  createdAt: string;
  _count: {
    contacts: number;
    opportunities: number;
    projects: number;
    communications: number;
  };
}

interface CustomerContact {
  id: string;
  firstName: string;
  lastName: string;
  title: string | null;
  phone: string | null;
  email: string | null;
  isPrimary: boolean;
  notes: string | null;
}

interface CustomerDetail extends Customer {
  contacts: CustomerContact[];
}

/* ═══════ LABELS ═══════ */
const typeLabels: Record<CustomerType, string> = {
  COMPANY: "Firma",
  INDIVIDUAL: "Bireysel",
  GOVERNMENT: "Kamu",
};
const typeIcons: Record<CustomerType, typeof Building2> = {
  COMPANY: Building2,
  INDIVIDUAL: User,
  GOVERNMENT: Landmark,
};
const segmentLabels: Record<CustomerSegment, string> = {
  PRIVATE: "Özel Sektör",
  PUBLIC: "Kamu",
  CORPORATE: "Kurumsal",
  SME: "KOBİ",
};
const statusLabels: Record<CustomerStatus, string> = {
  ACTIVE: "Aktif",
  INACTIVE: "Pasif",
  BLACKLISTED: "Kara Liste",
};
const statusBadge: Record<CustomerStatus, "default" | "secondary" | "destructive"> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  BLACKLISTED: "destructive",
};

export default function MusterilerPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSegment, setFilterSegment] = useState("");

  /* ── Dialog states ── */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /* ── Form ── */
  const [form, setForm] = useState({
    name: "",
    type: "COMPANY" as CustomerType,
    segment: "PRIVATE" as CustomerSegment,
    status: "ACTIVE" as CustomerStatus,
    taxNo: "",
    taxOffice: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    website: "",
    notes: "",
  });

  /* ── Contact form ── */
  const [contactForm, setContactForm] = useState({
    firstName: "",
    lastName: "",
    title: "",
    phone: "",
    email: "",
    isPrimary: false,
    notes: "",
  });

  /* ── Fetch Customers ── */
  const fetchCustomers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (filterStatus) params.set("status", filterStatus);
      if (filterSegment) params.set("segment", filterSegment);
      const res = await fetch(`/api/crm/musteriler?${params}`);
      if (!res.ok) throw new Error();
      setCustomers(await res.json());
    } catch {
      toast.error("Müşteriler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterStatus, filterSegment]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  /* ── Helpers ── */
  const resetForm = () =>
    setForm({
      name: "",
      type: "COMPANY",
      segment: "PRIVATE",
      status: "ACTIVE",
      taxNo: "",
      taxOffice: "",
      address: "",
      city: "",
      phone: "",
      email: "",
      website: "",
      notes: "",
    });

  const openCreate = () => {
    resetForm();
    setSelected(null);
    setDialogOpen(true);
  };

  const openEdit = (c: Customer) => {
    setSelected(c);
    setForm({
      name: c.name,
      type: c.type,
      segment: c.segment,
      status: c.status,
      taxNo: c.taxNo || "",
      taxOffice: c.taxOffice || "",
      address: c.address || "",
      city: c.city || "",
      phone: c.phone || "",
      email: c.email || "",
      website: c.website || "",
      notes: c.notes || "",
    });
    setDialogOpen(true);
  };

  const openDetail = async (c: Customer) => {
    try {
      const res = await fetch(`/api/crm/musteriler/${c.id}`);
      if (!res.ok) throw new Error();
      setDetail(await res.json());
      setDetailDialogOpen(true);
    } catch {
      toast.error("Müşteri detayları alınamadı.");
    }
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Müşteri adı boş bırakılamaz.");
      return;
    }
    setSubmitting(true);
    try {
      const isEdit = !!selected;
      const url = isEdit ? `/api/crm/musteriler/${selected.id}` : "/api/crm/musteriler";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success(isEdit ? "Müşteri güncellendi." : "Müşteri oluşturuldu.");
      setDialogOpen(false);
      resetForm();
      fetchCustomers();
    } catch {
      toast.error("İşlem sırasında hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/crm/musteriler/${selected.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Müşteri silindi.");
      setDeleteDialogOpen(false);
      setSelected(null);
      fetchCustomers();
    } catch {
      toast.error("Silme sırasında hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Add Contact ── */
  const handleAddContact = async () => {
    if (!detail) return;
    if (!contactForm.firstName.trim() || !contactForm.lastName.trim()) {
      toast.error("Ad ve soyad zorunludur.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/crm/musteriler/${detail.id}/kisiler`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });
      if (!res.ok) throw new Error();
      toast.success("Kişi eklendi.");
      setContactDialogOpen(false);
      setContactForm({ firstName: "", lastName: "", title: "", phone: "", email: "", isPrimary: false, notes: "" });
      // Refresh detail
      const res2 = await fetch(`/api/crm/musteriler/${detail.id}`);
      if (res2.ok) setDetail(await res2.json());
      fetchCustomers();
    } catch {
      toast.error("Kişi eklenirken hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Delete Contact ── */
  const handleDeleteContact = async (contactId: string) => {
    if (!detail) return;
    try {
      const res = await fetch(`/api/crm/musteriler/${detail.id}/kisiler/${contactId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Kişi silindi.");
      const res2 = await fetch(`/api/crm/musteriler/${detail.id}`);
      if (res2.ok) setDetail(await res2.json());
      fetchCustomers();
    } catch {
      toast.error("Kişi silinemedi.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Müşteriler</h1>
          <p className="text-muted-foreground">
            {customers.length} müşteri kayıtlı
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Müşteri
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Müşteri ara..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="ACTIVE">Aktif</SelectItem>
            <SelectItem value="INACTIVE">Pasif</SelectItem>
            <SelectItem value="BLACKLISTED">Kara Liste</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSegment} onValueChange={setFilterSegment}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Segment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="PRIVATE">Özel Sektör</SelectItem>
            <SelectItem value="PUBLIC">Kamu</SelectItem>
            <SelectItem value="CORPORATE">Kurumsal</SelectItem>
            <SelectItem value="SME">KOBİ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Müşteri</TableHead>
                <TableHead className="hidden md:table-cell">Tip</TableHead>
                <TableHead className="hidden md:table-cell">Segment</TableHead>
                <TableHead className="hidden lg:table-cell">Şehir</TableHead>
                <TableHead className="hidden lg:table-cell">İletişim</TableHead>
                <TableHead className="text-center">Kişi</TableHead>
                <TableHead className="text-center">Fırsat</TableHead>
                <TableHead className="text-center">Proje</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                    Müşteri bulunamadı.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c) => {
                  const TypeIcon = typeIcons[c.type];
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium">{c.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {typeLabels[c.type]}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{segmentLabels[c.segment]}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {c.city || "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-col text-xs">
                          {c.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {c.phone}
                            </span>
                          )}
                          {c.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {c.email}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{c._count.contacts}</TableCell>
                      <TableCell className="text-center">{c._count.opportunities}</TableCell>
                      <TableCell className="text-center">{c._count.projects}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadge[c.status]}>
                          {statusLabels[c.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDetail(c)}
                            title="Detay"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(c)}
                            title="Düzenle"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelected(c);
                              setDeleteDialogOpen(true);
                            }}
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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

      {/* ═══ Create/Edit Dialog ═══ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selected ? "Müşteri Düzenle" : "Yeni Müşteri"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Müşteri Adı *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Firma veya kişi adı"
                />
              </div>
              <div>
                <Label>Tip</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v as CustomerType })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMPANY">Firma</SelectItem>
                    <SelectItem value="INDIVIDUAL">Bireysel</SelectItem>
                    <SelectItem value="GOVERNMENT">Kamu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Segment</Label>
                <Select
                  value={form.segment}
                  onValueChange={(v) => setForm({ ...form, segment: v as CustomerSegment })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRIVATE">Özel Sektör</SelectItem>
                    <SelectItem value="PUBLIC">Kamu</SelectItem>
                    <SelectItem value="CORPORATE">Kurumsal</SelectItem>
                    <SelectItem value="SME">KOBİ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="taxNo">Vergi No</Label>
                <Input
                  id="taxNo"
                  value={form.taxNo}
                  onChange={(e) => setForm({ ...form, taxNo: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="taxOffice">Vergi Dairesi</Label>
                <Input
                  id="taxOffice"
                  value={form.taxOffice}
                  onChange={(e) => setForm({ ...form, taxOffice: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="0(5XX) XXX XX XX"
                />
              </div>
              <div>
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="city">Şehir</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="website">Web Sitesi</Label>
                <Input
                  id="website"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="address">Adres</Label>
                <Textarea
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={2}
                />
              </div>
              <div>
                <Label>Durum</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as CustomerStatus })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Aktif</SelectItem>
                    <SelectItem value="INACTIVE">Pasif</SelectItem>
                    <SelectItem value="BLACKLISTED">Kara Liste</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="notes">Notlar</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
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
            <DialogTitle>Müşteri Sil</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <strong>{selected?.name}</strong> müşterisini ve tüm ilişkili verilerini
            silmek istediğinize emin misiniz?
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

      {/* ═══ Detail Dialog ═══ */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {detail && <>{(() => { const Icon = typeIcons[detail.type]; return <Icon className="h-5 w-5" />; })()}</>}
              {detail?.name}
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Tip:</span>{" "}
                  {typeLabels[detail.type]}
                </div>
                <div>
                  <span className="text-muted-foreground">Segment:</span>{" "}
                  {segmentLabels[detail.segment]}
                </div>
                {detail.taxNo && (
                  <div>
                    <span className="text-muted-foreground">Vergi No:</span>{" "}
                    {detail.taxNo}
                  </div>
                )}
                {detail.taxOffice && (
                  <div>
                    <span className="text-muted-foreground">Vergi Dairesi:</span>{" "}
                    {detail.taxOffice}
                  </div>
                )}
                {detail.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    {detail.phone}
                  </div>
                )}
                {detail.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {detail.email}
                  </div>
                )}
                {detail.city && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {detail.city}
                  </div>
                )}
                {detail.address && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Adres:</span>{" "}
                    {detail.address}
                  </div>
                )}
              </div>

              {/* Stat Badges */}
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="flex items-center gap-1 px-3 py-1.5">
                  <Users className="h-3.5 w-3.5" /> {detail._count.contacts} Kişi
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1 px-3 py-1.5">
                  <Target className="h-3.5 w-3.5" /> {detail._count.opportunities} Fırsat
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1 px-3 py-1.5">
                  <FolderKanban className="h-3.5 w-3.5" /> {detail._count.projects} Proje
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1 px-3 py-1.5">
                  <MessageSquare className="h-3.5 w-3.5" /> {detail._count.communications} İletişim
                </Badge>
              </div>

              {/* Contacts */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">İletişim Kişileri</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setContactDialogOpen(true)}
                  >
                    <UserPlus className="mr-1 h-3.5 w-3.5" /> Kişi Ekle
                  </Button>
                </div>
                {detail.contacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
                    Henüz kişi eklenmemiş.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {detail.contacts.map((ct) => (
                      <div
                        key={ct.id}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {ct.firstName} {ct.lastName}
                            </span>
                            {ct.isPrimary && (
                              <Badge variant="default" className="text-xs">
                                Birincil
                              </Badge>
                            )}
                            {ct.title && (
                              <span className="text-xs text-muted-foreground">
                                · {ct.title}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                            {ct.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {ct.phone}
                              </span>
                            )}
                            {ct.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {ct.email}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={() => handleDeleteContact(ct.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {detail.notes && (
                <div>
                  <h3 className="font-semibold text-sm mb-1">Notlar</h3>
                  <p className="text-sm text-muted-foreground">{detail.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Add Contact Dialog ═══ */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni İletişim Kişisi</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Adı *</Label>
                <Input
                  value={contactForm.firstName}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, firstName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Soyadı *</Label>
                <Input
                  value={contactForm.lastName}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, lastName: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Ünvan / Pozisyon</Label>
              <Input
                value={contactForm.title}
                onChange={(e) =>
                  setContactForm({ ...contactForm, title: e.target.value })
                }
                placeholder="Genel Müdür, Satın Alma Müdürü, vb."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telefon</Label>
                <Input
                  value={contactForm.phone}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>E-posta</Label>
                <Input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, email: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrimary"
                checked={contactForm.isPrimary}
                onChange={(e) =>
                  setContactForm({ ...contactForm, isPrimary: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="isPrimary" className="cursor-pointer">
                Birincil kişi
              </Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setContactDialogOpen(false)}
              >
                İptal
              </Button>
              <Button onClick={handleAddContact} disabled={submitting}>
                {submitting ? "Kaydediliyor..." : "Ekle"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
