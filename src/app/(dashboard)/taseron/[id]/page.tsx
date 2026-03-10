"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Truck,
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  FileText,
  Receipt,
  Star,
  ClipboardList,
  Lock,
  FileCheck,
  Edit,
  Save,
  X,
  Loader2,
  Users,
  TrendingUp,
  AlertTriangle,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  ChevronRight,
  CheckCircle2,
  Clock,
  Ban,
  Shield,
  Award,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

/* eslint-disable @typescript-eslint/no-explicit-any */

const formatCurrency = (amount: number, currency = "TRY") => {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: string | null) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("tr-TR");
};

const statusBadge = (status: string) => {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    DRAFT: { label: "Taslak", variant: "secondary" },
    SUBMITTED: { label: "Gönderildi", variant: "default" },
    APPROVED: { label: "Onaylandı", variant: "default" },
    PAID: { label: "Ödendi", variant: "outline" },
    BEKLEMEDE: { label: "Beklemede", variant: "secondary" },
    UYGULANDI: { label: "Uygulandı", variant: "default" },
    IPTAL: { label: "İptal", variant: "destructive" },
    AKTIF: { label: "Aktif", variant: "default" },
    IADE_EDILDI: { label: "İade Edildi", variant: "outline" },
    IRAD_KAYDEDILDI: { label: "İrad", variant: "destructive" },
    SURESI_DOLDU: { label: "Süresi Doldu", variant: "destructive" },
    GECERLI: { label: "Geçerli", variant: "default" },
    SURESI_YAKLASTI: { label: "Süresi Yaklaşıyor", variant: "secondary" },
  };
  const info = map[status] || { label: status, variant: "secondary" as const };
  return <Badge variant={info.variant}>{info.label}</Badge>;
};

const getRatingColor = (r: number) => {
  if (r >= 8) return "text-green-600";
  if (r >= 6) return "text-amber-600";
  return "text-red-600";
};

export default function TaseronDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [firma, setFirma] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [activeTab, setActiveTab] = useState("genel");

  // Performans dialog
  const [perfDialogOpen, setPerfDialogOpen] = useState(false);
  const [perfForm, setPerfForm] = useState({
    period: "",
    kalitePuani: 7,
    surePuani: 7,
    isgPuani: 7,
    iletisimPuani: 7,
    malzemePuani: 7,
    contractId: "",
    notes: "",
  });
  const [perfSaving, setPerfSaving] = useState(false);

  // Kesinti dialog
  const [kesintiDialogOpen, setKesintiDialogOpen] = useState(false);
  const [kesintiForm, setKesintiForm] = useState({
    type: "CEZAI",
    amount: 0,
    description: "",
    date: new Date().toISOString().split("T")[0],
    contractId: "",
  });
  const [kesintiSaving, setKesintiSaving] = useState(false);

  // Teminat dialog
  const [teminatDialogOpen, setTeminatDialogOpen] = useState(false);
  const [teminatForm, setTeminatForm] = useState({
    type: "KESIN_TEMINAT",
    amount: 0,
    currency: "TRY",
    bankName: "",
    letterNo: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    contractId: "",
    notes: "",
  });
  const [teminatSaving, setTeminatSaving] = useState(false);

  // Puantaj dialog
  const [puantajDialogOpen, setPuantajDialogOpen] = useState(false);
  const [puantajForm, setPuantajForm] = useState({
    date: new Date().toISOString().split("T")[0],
    contractId: "",
    notes: "",
    kalemler: [
      { pozisyon: "Usta", sayi: 0, mesaiSaat: 0, devamsiz: 0 },
      { pozisyon: "Kalfa", sayi: 0, mesaiSaat: 0, devamsiz: 0 },
      { pozisyon: "Düz İşçi", sayi: 0, mesaiSaat: 0, devamsiz: 0 },
      { pozisyon: "Operatör", sayi: 0, mesaiSaat: 0, devamsiz: 0 },
      { pozisyon: "Teknisyen", sayi: 0, mesaiSaat: 0, devamsiz: 0 },
    ],
  });
  const [puantajSaving, setPuantajSaving] = useState(false);
  const [puantajDetailOpen, setPuantajDetailOpen] = useState<string | null>(null);

  // Evrak dialog
  const [evrakDialogOpen, setEvrakDialogOpen] = useState(false);
  const [evrakForm, setEvrakForm] = useState({
    type: "SGK_BORCU_YOKTUR",
    title: "",
    description: "",
    issueDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    reminderDays: 30,
  });
  const [evrakSaving, setEvrakSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/taseron/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          toast.error("Firma bulunamadı");
          router.push("/taseron");
          return;
        }
        throw new Error("Veri yüklenemedi");
      }
      const data = await res.json();
      setFirma(data);
      setEditForm({
        name: data.name || "",
        phone: data.phone || "",
        email: data.email || "",
        website: data.website || "",
        address: data.address || "",
        city: data.city || "",
        district: data.district || "",
        taxOffice: data.taxOffice || "",
        taxNo: data.taxNo || "",
        contactPerson: data.contactPerson || "",
        contactPhone: data.contactPhone || "",
        specialization: data.specialization || "",
        notes: data.notes || "",
        isActive: data.isActive,
      });
    } catch {
      toast.error("Veriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/taseron/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Güncelleme başarısız");
      toast.success("Firma bilgileri güncellendi");
      setEditing(false);
      fetchData();
    } catch {
      toast.error("Güncelleme sırasında hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  // Performans kaydet
  const handleSavePerformans = async () => {
    if (!perfForm.period) {
      toast.error("Dönem zorunludur");
      return;
    }
    setPerfSaving(true);
    try {
      const genelPuan =
        (perfForm.kalitePuani + perfForm.surePuani + perfForm.isgPuani + perfForm.iletisimPuani + perfForm.malzemePuani) / 5;
      const res = await fetch(`/api/taseron/${id}/performans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...perfForm, genelPuan: Math.round(genelPuan * 10) / 10 }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Hata");
      }
      toast.success("Performans değerlendirmesi kaydedildi");
      setPerfDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPerfSaving(false);
    }
  };

  // Kesinti kaydet
  const handleSaveKesinti = async () => {
    if (!kesintiForm.amount || !kesintiForm.description) {
      toast.error("Tutar ve açıklama zorunludur");
      return;
    }
    setKesintiSaving(true);
    try {
      const res = await fetch(`/api/taseron/${id}/kesintiler`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kesintiForm),
      });
      if (!res.ok) throw new Error("Hata");
      toast.success("Kesinti kaydedildi");
      setKesintiDialogOpen(false);
      fetchData();
    } catch {
      toast.error("Kesinti kaydedilirken hata oluştu");
    } finally {
      setKesintiSaving(false);
    }
  };

  // Teminat kaydet
  const handleSaveTeminat = async () => {
    if (!teminatForm.amount) {
      toast.error("Tutar zorunludur");
      return;
    }
    setTeminatSaving(true);
    try {
      const res = await fetch(`/api/taseron/${id}/teminatlar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teminatForm),
      });
      if (!res.ok) throw new Error("Hata");
      toast.success("Teminat kaydedildi");
      setTeminatDialogOpen(false);
      fetchData();
    } catch {
      toast.error("Teminat kaydedilirken hata oluştu");
    } finally {
      setTeminatSaving(false);
    }
  };

  // Puantaj kaydet
  const handleSavePuantaj = async () => {
    if (!puantajForm.date) {
      toast.error("Tarih zorunludur");
      return;
    }
    const filledKalemler = puantajForm.kalemler.filter((k) => k.sayi > 0);
    if (filledKalemler.length === 0) {
      toast.error("En az bir pozisyonda işçi sayısı girin");
      return;
    }
    setPuantajSaving(true);
    try {
      const res = await fetch(`/api/taseron/${id}/puantaj`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: puantajForm.date,
          contractId: puantajForm.contractId || null,
          notes: puantajForm.notes,
          kalemler: filledKalemler,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Hata");
      }
      toast.success("Puantaj kaydedildi");
      setPuantajDialogOpen(false);
      setPuantajForm({
        date: new Date().toISOString().split("T")[0],
        contractId: "",
        notes: "",
        kalemler: [
          { pozisyon: "Usta", sayi: 0, mesaiSaat: 0, devamsiz: 0 },
          { pozisyon: "Kalfa", sayi: 0, mesaiSaat: 0, devamsiz: 0 },
          { pozisyon: "Düz İşçi", sayi: 0, mesaiSaat: 0, devamsiz: 0 },
          { pozisyon: "Operatör", sayi: 0, mesaiSaat: 0, devamsiz: 0 },
          { pozisyon: "Teknisyen", sayi: 0, mesaiSaat: 0, devamsiz: 0 },
        ],
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPuantajSaving(false);
    }
  };

  // Evrak kaydet
  const handleSaveEvrak = async () => {
    if (!evrakForm.title) {
      toast.error("Evrak başlığı zorunludur");
      return;
    }
    setEvrakSaving(true);
    try {
      const res = await fetch(`/api/taseron/${id}/evraklar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(evrakForm),
      });
      if (!res.ok) throw new Error("Hata");
      toast.success("Evrak kaydedildi");
      setEvrakDialogOpen(false);
      fetchData();
    } catch {
      toast.error("Evrak kaydedilirken hata oluştu");
    } finally {
      setEvrakSaving(false);
    }
  };

  // Silme işlemleri
  const handleDeleteItem = async (endpoint: string, label: string) => {
    if (!confirm(`${label} silinecek. Emin misiniz?`)) return;
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) throw new Error("Silinemedi");
      toast.success(`${label} silindi`);
      fetchData();
    } catch {
      toast.error(`${label} silinirken hata oluştu`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!firma) return null;

  const ozet = firma.ozet;
  const contracts = firma.hakedisContracts || [];

  return (
    <div className="space-y-6">
      {/* Üst Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link
          href="/taseron"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Taşeron Listesi
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
              <Truck className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{firma.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                {firma.specialization && (
                  <Badge variant="secondary">{firma.specialization}</Badge>
                )}
                <Badge variant={firma.isActive ? "default" : "destructive"}>
                  {firma.isActive ? "Aktif" : "Pasif"}
                </Badge>
                {firma.rating && (
                  <Badge variant="outline" className={getRatingColor(firma.rating)}>
                    <Star className="h-3 w-3 mr-0.5" />
                    {firma.rating}/10
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Özet KPI Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="pt-3 pb-2 px-3">
            <p className="text-xs text-muted-foreground">Sözleşme Toplamı</p>
            <p className="text-lg font-bold">{formatCurrency(ozet.toplamSozlesmeTutar)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2 px-3">
            <p className="text-xs text-muted-foreground">Toplam Hakediş</p>
            <p className="text-lg font-bold">{formatCurrency(ozet.toplamHakedis)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2 px-3">
            <p className="text-xs text-muted-foreground">Ödenen</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(ozet.toplamOdenen)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2 px-3">
            <p className="text-xs text-muted-foreground">Kalan Borç</p>
            <p className="text-lg font-bold text-amber-600">{formatCurrency(ozet.kalanBorc)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2 px-3">
            <p className="text-xs text-muted-foreground">Toplam Kesinti</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(ozet.toplamKesinti)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-2 px-3">
            <p className="text-xs text-muted-foreground">Aktif Teminat</p>
            <p className="text-lg font-bold">{formatCurrency(ozet.aktifTeminatTutar)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Sekmeler */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="genel" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            Genel Bilgi
          </TabsTrigger>
          <TabsTrigger value="sozlesmeler" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Sözleşmeler
            <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">
              {contracts.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="hakedis" className="gap-1.5">
            <Receipt className="h-3.5 w-3.5" />
            Hakediş
            <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">
              {firma.hakedisler?.length || 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="puantaj" className="gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" />
            Puantaj
          </TabsTrigger>
          <TabsTrigger value="performans" className="gap-1.5">
            <Star className="h-3.5 w-3.5" />
            Performans
          </TabsTrigger>
          <TabsTrigger value="kesinti-teminat" className="gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            Kesinti & Teminat
          </TabsTrigger>
          <TabsTrigger value="evraklar" className="gap-1.5">
            <FileCheck className="h-3.5 w-3.5" />
            Evraklar
            {(ozet.suresiDolmusEvrak > 0 || ozet.suresiYaklasanEvrak > 0) && (
              <Badge variant="destructive" className="ml-1 text-xs h-5 px-1.5">
                {ozet.suresiDolmusEvrak + ozet.suresiYaklasanEvrak}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ═══════ GENEL BİLGİ TAB ═══════ */}
        <TabsContent value="genel" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">Firma Bilgileri</CardTitle>
              {!editing ? (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Düzenle
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                    <X className="h-4 w-4 mr-1" />
                    İptal
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                    Kaydet
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!editing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase">İletişim</h4>
                    <InfoRow icon={Users} label="Yetkili" value={firma.contactPerson} />
                    <InfoRow icon={Phone} label="Yetkili Tel" value={firma.contactPhone} />
                    <InfoRow icon={Phone} label="Firma Tel" value={firma.phone} />
                    <InfoRow icon={Mail} label="E-posta" value={firma.email} />
                    <InfoRow icon={Globe} label="Web" value={firma.website} />
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase">Adres</h4>
                    <InfoRow icon={MapPin} label="İl / İlçe" value={[firma.city, firma.district].filter(Boolean).join(" / ") || null} />
                    <InfoRow icon={MapPin} label="Adres" value={firma.address} />
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase">Firma Bilgileri</h4>
                    <InfoRow icon={FileText} label="Vergi No" value={firma.taxNo} />
                    <InfoRow icon={FileText} label="Vergi Dairesi" value={firma.taxOffice} />
                    <InfoRow icon={Award} label="Uzmanlık" value={firma.specialization} />
                  </div>
                  {firma.notes && (
                    <div className="md:col-span-2 lg:col-span-3">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase mb-2">Notlar</h4>
                      <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-3">{firma.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Firma Adı</Label>
                    <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Uzmanlık Alanı</Label>
                    <Select value={editForm.specialization} onValueChange={(v) => setEditForm({ ...editForm, specialization: v })}>
                      <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                      <SelectContent>
                        {["Kaba İnşaat","İnce İnşaat","Elektrik","Mekanik","Sıhhi Tesisat","Çelik Konstrüksiyon","Peyzaj","Alçı & Boya","Seramik & Kaplama","İzolasyon","Doğrama","Asansör","Diğer"].map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Yetkili Kişi</Label>
                    <Input value={editForm.contactPerson} onChange={(e) => setEditForm({ ...editForm, contactPerson: e.target.value })} />
                  </div>
                  <div>
                    <Label>Yetkili Telefon</Label>
                    <Input value={editForm.contactPhone} onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })} />
                  </div>
                  <div>
                    <Label>Firma Telefon</Label>
                    <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                  </div>
                  <div>
                    <Label>E-posta</Label>
                    <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                  </div>
                  <div>
                    <Label>Web Sitesi</Label>
                    <Input value={editForm.website} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} />
                  </div>
                  <div>
                    <Label>Vergi No</Label>
                    <Input value={editForm.taxNo} onChange={(e) => setEditForm({ ...editForm, taxNo: e.target.value })} />
                  </div>
                  <div>
                    <Label>Vergi Dairesi</Label>
                    <Input value={editForm.taxOffice} onChange={(e) => setEditForm({ ...editForm, taxOffice: e.target.value })} />
                  </div>
                  <div>
                    <Label>İl</Label>
                    <Input value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
                  </div>
                  <div>
                    <Label>İlçe</Label>
                    <Input value={editForm.district} onChange={(e) => setEditForm({ ...editForm, district: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Adres</Label>
                    <Input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Notlar</Label>
                    <Textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={3} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label>Durum</Label>
                    <Select value={editForm.isActive ? "true" : "false"} onValueChange={(v) => setEditForm({ ...editForm, isActive: v === "true" })}>
                      <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Aktif</SelectItem>
                        <SelectItem value="false">Pasif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Çalışanlar */}
          {firma.employees?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Çalışanlar ({firma.employees.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {firma.employees.map((e: any) => (
                    <div key={e.id} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                      <div className={`h-2 w-2 rounded-full ${e.status === "ACTIVE" ? "bg-green-500" : "bg-gray-300"}`} />
                      <span className="text-sm truncate">{e.firstName} {e.lastName}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══════ SÖZLEŞMELER TAB ═══════ */}
        <TabsContent value="sozlesmeler" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Sözleşmeler</CardTitle>
                <CardDescription>Bu firmaya ait taşeron sözleşmeleri</CardDescription>
              </div>
              <Link href="/hakedis/sozlesmeler">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Sözleşme Ekle
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {contracts.length === 0 ? (
                <EmptyState icon={FileText} title="Sözleşme yok" description="Hakediş modülünden bu firma için sözleşme oluşturabilirsiniz" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sözleşme</TableHead>
                      <TableHead>Proje</TableHead>
                      <TableHead className="text-right">Tutar</TableHead>
                      <TableHead className="text-center">Hakediş</TableHead>
                      <TableHead className="text-center">Ataşman</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{c.name}</p>
                            {c.contractNo && <p className="text-xs text-muted-foreground">{c.contractNo}</p>}
                          </div>
                        </TableCell>
                        <TableCell>{c.project?.name || "—"}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(c.totalAmount, c.currency)}
                        </TableCell>
                        <TableCell className="text-center">{c._count?.hakedisler || 0}</TableCell>
                        <TableCell className="text-center">{c._count?.atasmanlar || 0}</TableCell>
                        <TableCell>
                          <Link href={`/hakedis/taseron`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ HAKEDİŞ TAB ═══════ */}
        <TabsContent value="hakedis" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Hakediş Kayıtları</CardTitle>
                <CardDescription>Bu firmaya yapılan hakediş ödemeleri</CardDescription>
              </div>
              <Link href="/hakedis/taseron">
                <Button variant="outline" size="sm">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Hakediş Modülü
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {firma.hakedisler?.length === 0 ? (
                <EmptyState icon={Receipt} title="Hakediş yok" description="Hakediş modülünden bu firma için hakediş oluşturabilirsiniz" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Dönem</TableHead>
                      <TableHead>Sözleşme</TableHead>
                      <TableHead className="text-right">Toplam</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {firma.hakedisler.map((h: any) => (
                      <TableRow key={h.id}>
                        <TableCell className="font-medium">#{h.no}</TableCell>
                        <TableCell>{h.period}</TableCell>
                        <TableCell className="text-sm">{h.contract?.name || "—"}</TableCell>
                        <TableCell className="text-right">{formatCurrency(h.totalAmount, h.contract?.currency)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(h.netAmount, h.contract?.currency)}</TableCell>
                        <TableCell>{statusBadge(h.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ PUANTAJ TAB ═══════ */}
        <TabsContent value="puantaj" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Puantaj Kayıtları</CardTitle>
                <CardDescription>Günlük işçi sayısı ve mesai takibi</CardDescription>
              </div>
              <Dialog open={puantajDialogOpen} onOpenChange={setPuantajDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Yeni Kayıt
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Yeni Puantaj Kaydı</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Tarih *</Label>
                        <Input
                          type="date"
                          value={puantajForm.date}
                          onChange={(e) => setPuantajForm({ ...puantajForm, date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Sözleşme</Label>
                        <Select
                          value={puantajForm.contractId}
                          onValueChange={(v) => setPuantajForm({ ...puantajForm, contractId: v })}
                        >
                          <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                          <SelectContent>
                            {firma.hakedisContracts?.map((c: any) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="font-semibold">Pozisyon Kalemleri</Label>
                      <p className="text-xs text-muted-foreground mb-2">Her pozisyon için işçi sayısı, fazla mesai ve devamsızlık girin</p>
                      <div className="space-y-2">
                        {puantajForm.kalemler.map((k, idx) => (
                          <div key={idx} className="grid grid-cols-4 gap-2 items-center">
                            <div className="text-sm font-medium">{k.pozisyon}</div>
                            <div>
                              <Input
                                type="number"
                                min={0}
                                placeholder="Kişi"
                                value={k.sayi || ""}
                                onChange={(e) => {
                                  const updated = [...puantajForm.kalemler];
                                  updated[idx] = { ...updated[idx], sayi: parseInt(e.target.value) || 0 };
                                  setPuantajForm({ ...puantajForm, kalemler: updated });
                                }}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Input
                                type="number"
                                min={0}
                                step={0.5}
                                placeholder="Mesai (saat)"
                                value={k.mesaiSaat || ""}
                                onChange={(e) => {
                                  const updated = [...puantajForm.kalemler];
                                  updated[idx] = { ...updated[idx], mesaiSaat: parseFloat(e.target.value) || 0 };
                                  setPuantajForm({ ...puantajForm, kalemler: updated });
                                }}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Input
                                type="number"
                                min={0}
                                placeholder="Devamsız"
                                value={k.devamsiz || ""}
                                onChange={(e) => {
                                  const updated = [...puantajForm.kalemler];
                                  updated[idx] = { ...updated[idx], devamsiz: parseInt(e.target.value) || 0 };
                                  setPuantajForm({ ...puantajForm, kalemler: updated });
                                }}
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                        ))}
                        <div className="grid grid-cols-4 gap-2 items-center pt-1 border-t text-xs font-bold text-muted-foreground">
                          <div>Toplam</div>
                          <div className="text-center">{puantajForm.kalemler.reduce((s, k) => s + (k.sayi || 0), 0)} kişi</div>
                          <div className="text-center">{puantajForm.kalemler.reduce((s, k) => s + (k.mesaiSaat || 0), 0)} saat</div>
                          <div className="text-center">{puantajForm.kalemler.reduce((s, k) => s + (k.devamsiz || 0), 0)} kişi</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Notlar</Label>
                      <Textarea
                        value={puantajForm.notes}
                        onChange={(e) => setPuantajForm({ ...puantajForm, notes: e.target.value })}
                        placeholder="Opsiyonel notlar..."
                        rows={2}
                      />
                    </div>

                    <Button onClick={handleSavePuantaj} disabled={puantajSaving} className="w-full">
                      {puantajSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Kaydediliyor...</> : "Kaydet"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {firma.taseronPuantajlar?.length === 0 ? (
                <EmptyState icon={ClipboardList} title="Puantaj kaydı yok" description="Günlük işçi ve mesai takibi için yeni kayıt ekleyin" />
              ) : (
                <div className="space-y-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Sözleşme</TableHead>
                        <TableHead className="text-center">Toplam İşçi</TableHead>
                        <TableHead className="text-center">Mesai (saat)</TableHead>
                        <TableHead className="text-center">Devamsız</TableHead>
                        <TableHead>Kaydeden</TableHead>
                        <TableHead className="text-right">İşlem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {firma.taseronPuantajlar.map((p: any) => (
                        <>
                          <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setPuantajDetailOpen(puantajDetailOpen === p.id ? null : p.id)}>
                            <TableCell className="font-medium">{formatDate(p.date)}</TableCell>
                            <TableCell>{p.contract?.name || "—"}</TableCell>
                            <TableCell className="text-center font-semibold">{p.toplamIsci}</TableCell>
                            <TableCell className="text-center">{p.toplamMesai > 0 ? <span className="text-amber-600">{p.toplamMesai}s</span> : "—"}</TableCell>
                            <TableCell className="text-center">{p.toplamDevamsiz > 0 ? <span className="text-red-600 font-medium">{p.toplamDevamsiz}</span> : "—"}</TableCell>
                            <TableCell className="text-sm">{p.createdBy?.name || "—"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setPuantajDetailOpen(puantajDetailOpen === p.id ? null : p.id); }}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={(e) => { e.stopPropagation(); handleDeleteItem(`/api/taseron/${id}/puantaj?puantajId=${p.id}`, "Puantaj kaydı"); }}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          {puantajDetailOpen === p.id && p.kalemler?.length > 0 && (
                            <TableRow key={`${p.id}-detail`}>
                              <TableCell colSpan={7} className="bg-muted/30 p-3">
                                <div className="text-xs font-semibold text-muted-foreground mb-2">Pozisyon Detayı:</div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                                  {p.kalemler.map((k: any) => (
                                    <div key={k.id} className="bg-background rounded-md p-2 border text-xs">
                                      <div className="font-semibold">{k.pozisyon}</div>
                                      <div className="mt-1 space-y-0.5 text-muted-foreground">
                                        <div>İşçi: <span className="font-medium text-foreground">{k.sayi}</span></div>
                                        {k.mesaiSaat > 0 && <div>Mesai: <span className="text-amber-600 font-medium">{k.mesaiSaat}s</span></div>}
                                        {k.devamsiz > 0 && <div>Devamsız: <span className="text-red-600 font-medium">{k.devamsiz}</span></div>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                {p.notes && <p className="mt-2 text-xs text-muted-foreground italic">{p.notes}</p>}
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ PERFORMANS TAB ═══════ */}
        <TabsContent value="performans" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Performans Değerlendirmeleri</CardTitle>
                <CardDescription>Dönemsel performans puanları</CardDescription>
              </div>
              <Dialog open={perfDialogOpen} onOpenChange={setPerfDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Değerlendir
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Performans Değerlendirmesi</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Dönem *</Label>
                        <Input
                          placeholder="2026-Q1"
                          value={perfForm.period}
                          onChange={(e) => setPerfForm({ ...perfForm, period: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Sözleşme</Label>
                        <Select value={perfForm.contractId} onValueChange={(v) => setPerfForm({ ...perfForm, contractId: v })}>
                          <SelectTrigger><SelectValue placeholder="Tümü" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Genel</SelectItem>
                            {contracts.map((c: any) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {[
                      { key: "kalitePuani", label: "Kalite", icon: Award },
                      { key: "surePuani", label: "Süre / Termin", icon: Clock },
                      { key: "isgPuani", label: "İş Güvenliği", icon: Shield },
                      { key: "iletisimPuani", label: "İletişim", icon: Users },
                      { key: "malzemePuani", label: "Malzeme Kalitesi", icon: CheckCircle2 },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Label className="w-32 shrink-0">{item.label}</Label>
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          value={(perfForm as any)[item.key]}
                          onChange={(e) => setPerfForm({ ...perfForm, [item.key]: parseFloat(e.target.value) || 0 })}
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">/10</span>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${(perfForm as any)[item.key] >= 8 ? "bg-green-500" : (perfForm as any)[item.key] >= 6 ? "bg-amber-500" : "bg-red-500"}`}
                            style={{ width: `${((perfForm as any)[item.key] / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="text-center py-2">
                      <p className="text-sm text-muted-foreground">Genel Puan</p>
                      <p className="text-3xl font-bold">
                        {(
                          (perfForm.kalitePuani + perfForm.surePuani + perfForm.isgPuani + perfForm.iletisimPuani + perfForm.malzemePuani) / 5
                        ).toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <Label>Notlar</Label>
                      <Textarea value={perfForm.notes} onChange={(e) => setPerfForm({ ...perfForm, notes: e.target.value })} rows={2} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setPerfDialogOpen(false)}>İptal</Button>
                      <Button onClick={handleSavePerformans} disabled={perfSaving}>
                        {perfSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                        Kaydet
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {firma.taseronPerformanslar?.length === 0 ? (
                <EmptyState icon={Star} title="Değerlendirme yok" description="İlk performans değerlendirmesini yapın" />
              ) : (
                <div className="space-y-3">
                  {firma.taseronPerformanslar.map((p: any) => (
                    <div key={p.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{p.period}</Badge>
                          {p.contract && <Badge variant="secondary">{p.contract.name}</Badge>}
                        </div>
                        <div className={`text-2xl font-bold ${getRatingColor(p.genelPuan)}`}>
                          {p.genelPuan}/10
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {[
                          { label: "Kalite", value: p.kalitePuani },
                          { label: "Süre", value: p.surePuani },
                          { label: "İSG", value: p.isgPuani },
                          { label: "İletişim", value: p.iletisimPuani },
                          { label: "Malzeme", value: p.malzemePuani },
                        ].map((item) => (
                          <div key={item.label} className="text-center">
                            <p className="text-xs text-muted-foreground">{item.label}</p>
                            <p className={`font-semibold ${getRatingColor(item.value)}`}>{item.value}</p>
                          </div>
                        ))}
                      </div>
                      {p.notes && <p className="text-sm text-muted-foreground">{p.notes}</p>}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Değerlendiren: {p.evaluatedBy?.name || "—"}</span>
                        <button
                          onClick={() => handleDeleteItem(`/api/taseron/${id}/performans?performansId=${p.id}`, "Değerlendirme")}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ KESİNTİ & TEMİNAT TAB ═══════ */}
        <TabsContent value="kesinti-teminat" className="space-y-4">
          {/* Kesintiler */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Kesintiler</CardTitle>
                <CardDescription>Cezai kesinti, SGK, vergi ve diğer kesintiler</CardDescription>
              </div>
              <Dialog open={kesintiDialogOpen} onOpenChange={setKesintiDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Kesinti Ekle
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Yeni Kesinti</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Kesinti Türü</Label>
                        <Select value={kesintiForm.type} onValueChange={(v) => setKesintiForm({ ...kesintiForm, type: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CEZAI">Cezai Kesinti</SelectItem>
                            <SelectItem value="SGK">SGK</SelectItem>
                            <SelectItem value="VERGI">Vergi</SelectItem>
                            <SelectItem value="GECIKME">Gecikme Cezası</SelectItem>
                            <SelectItem value="HASAR">Hasar Tazminatı</SelectItem>
                            <SelectItem value="DIGER">Diğer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Tutar (₺)</Label>
                        <Input type="number" value={kesintiForm.amount} onChange={(e) => setKesintiForm({ ...kesintiForm, amount: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <Label>Tarih</Label>
                        <Input type="date" value={kesintiForm.date} onChange={(e) => setKesintiForm({ ...kesintiForm, date: e.target.value })} />
                      </div>
                      <div>
                        <Label>Sözleşme</Label>
                        <Select value={kesintiForm.contractId} onValueChange={(v) => setKesintiForm({ ...kesintiForm, contractId: v })}>
                          <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Genel</SelectItem>
                            {contracts.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Açıklama</Label>
                      <Textarea value={kesintiForm.description} onChange={(e) => setKesintiForm({ ...kesintiForm, description: e.target.value })} rows={2} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setKesintiDialogOpen(false)}>İptal</Button>
                      <Button onClick={handleSaveKesinti} disabled={kesintiSaving}>
                        {kesintiSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                        Kaydet
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {firma.taseronKesintiler?.length === 0 ? (
                <EmptyState icon={Ban} title="Kesinti yok" description="Henüz kesinti kaydı bulunmuyor" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Tür</TableHead>
                      <TableHead>Açıklama</TableHead>
                      <TableHead>Sözleşme</TableHead>
                      <TableHead className="text-right">Tutar</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {firma.taseronKesintiler.map((k: any) => (
                      <TableRow key={k.id}>
                        <TableCell>{formatDate(k.date)}</TableCell>
                        <TableCell><Badge variant="outline">{kesintiTypeLabel(k.type)}</Badge></TableCell>
                        <TableCell className="max-w-[200px] truncate">{k.description}</TableCell>
                        <TableCell className="text-sm">{k.contract?.name || "—"}</TableCell>
                        <TableCell className="text-right font-medium text-red-600">{formatCurrency(k.amount)}</TableCell>
                        <TableCell>{statusBadge(k.status)}</TableCell>
                        <TableCell>
                          <button onClick={() => handleDeleteItem(`/api/taseron/${id}/kesintiler?kesintiId=${k.id}`, "Kesinti")} className="text-red-500 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Teminatlar */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Teminatlar</CardTitle>
                <CardDescription>Teminat mektubu ve nakit teminat takibi</CardDescription>
              </div>
              <Dialog open={teminatDialogOpen} onOpenChange={setTeminatDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Teminat Ekle
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Yeni Teminat</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Teminat Türü</Label>
                        <Select value={teminatForm.type} onValueChange={(v) => setTeminatForm({ ...teminatForm, type: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="KESIN_TEMINAT">Kesin Teminat</SelectItem>
                            <SelectItem value="AVANS_TEMINATI">Avans Teminatı</SelectItem>
                            <SelectItem value="EK_TEMINAT">Ek Teminat</SelectItem>
                            <SelectItem value="NAKIT_TEMINAT">Nakit Teminat</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Tutar</Label>
                        <Input type="number" value={teminatForm.amount} onChange={(e) => setTeminatForm({ ...teminatForm, amount: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <Label>Banka</Label>
                        <Input value={teminatForm.bankName} onChange={(e) => setTeminatForm({ ...teminatForm, bankName: e.target.value })} placeholder="Banka adı" />
                      </div>
                      <div>
                        <Label>Mektup No</Label>
                        <Input value={teminatForm.letterNo} onChange={(e) => setTeminatForm({ ...teminatForm, letterNo: e.target.value })} placeholder="Teminat mektubu no" />
                      </div>
                      <div>
                        <Label>Başlangıç</Label>
                        <Input type="date" value={teminatForm.startDate} onChange={(e) => setTeminatForm({ ...teminatForm, startDate: e.target.value })} />
                      </div>
                      <div>
                        <Label>Bitiş</Label>
                        <Input type="date" value={teminatForm.endDate} onChange={(e) => setTeminatForm({ ...teminatForm, endDate: e.target.value })} />
                      </div>
                      <div className="col-span-2">
                        <Label>Sözleşme</Label>
                        <Select value={teminatForm.contractId} onValueChange={(v) => setTeminatForm({ ...teminatForm, contractId: v })}>
                          <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Genel</SelectItem>
                            {contracts.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Notlar</Label>
                      <Textarea value={teminatForm.notes} onChange={(e) => setTeminatForm({ ...teminatForm, notes: e.target.value })} rows={2} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setTeminatDialogOpen(false)}>İptal</Button>
                      <Button onClick={handleSaveTeminat} disabled={teminatSaving}>
                        {teminatSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                        Kaydet
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {firma.taseronTeminatlar?.length === 0 ? (
                <EmptyState icon={Lock} title="Teminat yok" description="Henüz teminat kaydı bulunmuyor" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tür</TableHead>
                      <TableHead>Banka / No</TableHead>
                      <TableHead>Sözleşme</TableHead>
                      <TableHead className="text-right">Tutar</TableHead>
                      <TableHead>Başlangıç</TableHead>
                      <TableHead>Bitiş</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {firma.taseronTeminatlar.map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell><Badge variant="outline">{teminatTypeLabel(t.type)}</Badge></TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{t.bankName || "—"}</p>
                            {t.letterNo && <p className="text-xs text-muted-foreground">{t.letterNo}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{t.contract?.name || "—"}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(t.amount, t.currency)}</TableCell>
                        <TableCell>{formatDate(t.startDate)}</TableCell>
                        <TableCell>{formatDate(t.endDate)}</TableCell>
                        <TableCell>{statusBadge(t.status)}</TableCell>
                        <TableCell>
                          <button onClick={() => handleDeleteItem(`/api/taseron/${id}/teminatlar?teminatId=${t.id}`, "Teminat")} className="text-red-500 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ EVRAKLAR TAB ═══════ */}
        <TabsContent value="evraklar" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Evrak Takibi</CardTitle>
                <CardDescription>SGK, vergi, sigorta ve diğer belgeler</CardDescription>
              </div>
              <Dialog open={evrakDialogOpen} onOpenChange={setEvrakDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Evrak Ekle
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Yeni Evrak</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label>Evrak Başlığı *</Label>
                        <Input value={evrakForm.title} onChange={(e) => setEvrakForm({ ...evrakForm, title: e.target.value })} placeholder="Evrak adı" />
                      </div>
                      <div>
                        <Label>Evrak Türü</Label>
                        <Select value={evrakForm.type} onValueChange={(v) => setEvrakForm({ ...evrakForm, type: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SGK_BORCU_YOKTUR">SGK Borcu Yoktur</SelectItem>
                            <SelectItem value="VERGI_BORCU_YOKTUR">Vergi Borcu Yoktur</SelectItem>
                            <SelectItem value="ISG_BELGESI">İSG Belgesi</SelectItem>
                            <SelectItem value="SIGORTA_POLICESI">Sigorta Poliçesi</SelectItem>
                            <SelectItem value="IMZA_SIRKULERI">İmza Sirküleri</SelectItem>
                            <SelectItem value="TICARET_SICIL">Ticaret Sicil</SelectItem>
                            <SelectItem value="FAALIYET_BELGESI">Faaliyet Belgesi</SelectItem>
                            <SelectItem value="YETKI_BELGESI">Yetki Belgesi</SelectItem>
                            <SelectItem value="DIGER">Diğer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Uyarı (gün önce)</Label>
                        <Input type="number" value={evrakForm.reminderDays} onChange={(e) => setEvrakForm({ ...evrakForm, reminderDays: parseInt(e.target.value) || 30 })} />
                      </div>
                      <div>
                        <Label>Düzenlenme Tarihi</Label>
                        <Input type="date" value={evrakForm.issueDate} onChange={(e) => setEvrakForm({ ...evrakForm, issueDate: e.target.value })} />
                      </div>
                      <div>
                        <Label>Son Geçerlilik</Label>
                        <Input type="date" value={evrakForm.expiryDate} onChange={(e) => setEvrakForm({ ...evrakForm, expiryDate: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <Label>Açıklama</Label>
                      <Textarea value={evrakForm.description} onChange={(e) => setEvrakForm({ ...evrakForm, description: e.target.value })} rows={2} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setEvrakDialogOpen(false)}>İptal</Button>
                      <Button onClick={handleSaveEvrak} disabled={evrakSaving}>
                        {evrakSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                        Kaydet
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {firma.taseronEvraklar?.length === 0 ? (
                <EmptyState icon={FileCheck} title="Evrak yok" description="Henüz evrak kaydı bulunmuyor" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Evrak</TableHead>
                      <TableHead>Tür</TableHead>
                      <TableHead>Düzenlenme</TableHead>
                      <TableHead>Son Geçerlilik</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {firma.taseronEvraklar.map((e: any) => {
                      const now = new Date();
                      const expiry = e.expiryDate ? new Date(e.expiryDate) : null;
                      const isExpired = expiry && expiry < now;
                      const isNearExpiry = expiry && !isExpired && expiry <= new Date(now.getTime() + e.reminderDays * 24 * 60 * 60 * 1000);

                      return (
                        <TableRow key={e.id} className={isExpired ? "bg-red-50/50 dark:bg-red-950/20" : isNearExpiry ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{e.title}</p>
                              {e.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{e.description}</p>}
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline">{evrakTypeLabel(e.type)}</Badge></TableCell>
                          <TableCell>{formatDate(e.issueDate)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {isExpired && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                              {isNearExpiry && <Calendar className="h-3.5 w-3.5 text-amber-500" />}
                              <span className={isExpired ? "text-red-600 font-medium" : isNearExpiry ? "text-amber-600 font-medium" : ""}>
                                {formatDate(e.expiryDate)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {isExpired ? (
                              <Badge variant="destructive">Süresi Doldu</Badge>
                            ) : isNearExpiry ? (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-800">Süresi Yaklaşıyor</Badge>
                            ) : (
                              <Badge variant="default">Geçerli</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <button onClick={() => handleDeleteItem(`/api/taseron/${id}/evraklar?evrakId=${e.id}`, "Evrak")} className="text-red-500 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── Yardımcı Bileşenler ─── */

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string | null }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm">{value || "—"}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="text-center py-8">
      <Icon className="mx-auto h-10 w-10 text-muted-foreground/40" />
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function kesintiTypeLabel(type: string) {
  const map: Record<string, string> = {
    CEZAI: "Cezai",
    SGK: "SGK",
    VERGI: "Vergi",
    GECIKME: "Gecikme",
    HASAR: "Hasar",
    DIGER: "Diğer",
  };
  return map[type] || type;
}

function teminatTypeLabel(type: string) {
  const map: Record<string, string> = {
    KESIN_TEMINAT: "Kesin",
    AVANS_TEMINATI: "Avans",
    EK_TEMINAT: "Ek",
    NAKIT_TEMINAT: "Nakit",
  };
  return map[type] || type;
}

function evrakTypeLabel(type: string) {
  const map: Record<string, string> = {
    SGK_BORCU_YOKTUR: "SGK",
    VERGI_BORCU_YOKTUR: "Vergi",
    ISG_BELGESI: "İSG",
    SIGORTA_POLICESI: "Sigorta",
    IMZA_SIRKULERI: "İmza Sirküleri",
    TICARET_SICIL: "Ticaret Sicil",
    FAALIYET_BELGESI: "Faaliyet",
    YETKI_BELGESI: "Yetki",
    DIGER: "Diğer",
  };
  return map[type] || type;
}
