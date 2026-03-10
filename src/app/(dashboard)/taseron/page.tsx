"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Truck,
  Search,
  Plus,
  Building2,
  FileText,
  Receipt,
  Star,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  Users,
  TrendingUp,
  Filter,
  ChevronRight,
  Loader2,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Firma {
  id: string;
  name: string;
  specialization: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  isActive: boolean;
  rating: number | null;
  sozlesmeCount: number;
  toplamSozlesmeTutar: number;
  toplamHakedis: number;
  bekleyenHakedis: number;
  sonPerformans: { genelPuan: number; period: string } | null;
  calisanSayisi: number;
  ekipSayisi: number;
  evrakUyari: number;
}

interface KPIlar {
  totalFirmalar: number;
  aktifFirmalar: number;
  toplamSozlesmeButcesi: number;
  toplamHakedis: number;
  ortalamaPerformans: number;
  suresiYaklasanEvrak: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getRatingColor = (rating: number | null) => {
  if (!rating) return "text-muted-foreground";
  if (rating >= 8) return "text-green-600";
  if (rating >= 6) return "text-amber-600";
  return "text-red-600";
};

const getRatingBg = (rating: number | null) => {
  if (!rating) return "bg-muted";
  if (rating >= 8) return "bg-green-50 dark:bg-green-950";
  if (rating >= 6) return "bg-amber-50 dark:bg-amber-950";
  return "bg-red-50 dark:bg-red-950";
};

export default function TaseronDashboard() {
  const [firmalar, setFirmalar] = useState<Firma[]>([]);
  const [kpilar, setKpilar] = useState<KPIlar | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Yeni firma formu
  const [formData, setFormData] = useState({
    name: "",
    specialization: "",
    contactPerson: "",
    contactPhone: "",
    phone: "",
    email: "",
    city: "",
    district: "",
    address: "",
    taxOffice: "",
    taxNo: "",
    notes: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("isActive", statusFilter);
      const res = await fetch(`/api/taseron?${params.toString()}`);
      if (!res.ok) throw new Error("Veri yüklenemedi");
      const data = await res.json();
      setFirmalar(data.firmalar);
      setKpilar(data.kpilar);
    } catch {
      toast.error("Taşeron verileri yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("Firma adı zorunludur");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/taseron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Hata oluştu");
      }
      toast.success("Taşeron firma oluşturuldu");
      setDialogOpen(false);
      setFormData({
        name: "",
        specialization: "",
        contactPerson: "",
        contactPhone: "",
        phone: "",
        email: "",
        city: "",
        district: "",
        address: "",
        taxOffice: "",
        taxNo: "",
        notes: "",
      });
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Truck className="h-7 w-7 text-orange-600" />
            Taşeron Yönetimi
          </h1>
          <p className="text-muted-foreground mt-1">
            Taşeron firma ve sözleşme takibi
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Taşeron
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Yeni Taşeron Firma Ekle</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Firma Bilgileri */}
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Firma Bilgileri
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="name">Firma Adı *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Taşeron firma adı"
                  />
                </div>
                <div>
                  <Label htmlFor="specialization">Uzmanlık Alanı</Label>
                  <Select
                    value={formData.specialization}
                    onValueChange={(v) =>
                      setFormData({ ...formData, specialization: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kaba İnşaat">Kaba İnşaat</SelectItem>
                      <SelectItem value="İnce İnşaat">İnce İnşaat</SelectItem>
                      <SelectItem value="Elektrik">Elektrik</SelectItem>
                      <SelectItem value="Mekanik">Mekanik</SelectItem>
                      <SelectItem value="Sıhhi Tesisat">Sıhhi Tesisat</SelectItem>
                      <SelectItem value="Çelik Konstrüksiyon">Çelik Konstrüksiyon</SelectItem>
                      <SelectItem value="Peyzaj">Peyzaj</SelectItem>
                      <SelectItem value="Alçı & Boya">Alçı & Boya</SelectItem>
                      <SelectItem value="Seramik & Kaplama">Seramik & Kaplama</SelectItem>
                      <SelectItem value="İzolasyon">İzolasyon</SelectItem>
                      <SelectItem value="Doğrama">Doğrama</SelectItem>
                      <SelectItem value="Asansör">Asansör</SelectItem>
                      <SelectItem value="Diğer">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="taxNo">Vergi No</Label>
                  <Input
                    id="taxNo"
                    value={formData.taxNo}
                    onChange={(e) =>
                      setFormData({ ...formData, taxNo: e.target.value })
                    }
                    placeholder="Vergi numarası"
                  />
                </div>
                <div>
                  <Label htmlFor="taxOffice">Vergi Dairesi</Label>
                  <Input
                    id="taxOffice"
                    value={formData.taxOffice}
                    onChange={(e) =>
                      setFormData({ ...formData, taxOffice: e.target.value })
                    }
                    placeholder="Vergi dairesi"
                  />
                </div>
              </div>

              <Separator />

              {/* İletişim */}
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                İletişim
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactPerson">Yetkili Kişi</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contactPerson: e.target.value,
                      })
                    }
                    placeholder="Ad Soyad"
                  />
                </div>
                <div>
                  <Label htmlFor="contactPhone">Yetkili Telefon</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contactPhone: e.target.value,
                      })
                    }
                    placeholder="05xx xxx xxxx"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Firma Telefon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Telefon"
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-posta</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="firma@ornek.com"
                  />
                </div>
              </div>

              <Separator />

              {/* Adres */}
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Adres
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">İl</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="İl"
                  />
                </div>
                <div>
                  <Label htmlFor="district">İlçe</Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) =>
                      setFormData({ ...formData, district: e.target.value })
                    }
                    placeholder="İlçe"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="address">Adres</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Açık adres"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  İptal
                </Button>
                <Button onClick={handleCreate} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Kaydet
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Kartları */}
      {kpilar && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-orange-600" />
                <p className="text-xs text-muted-foreground">Toplam Firma</p>
              </div>
              <p className="text-2xl font-bold mt-1">{kpilar.totalFirmalar}</p>
              <p className="text-xs text-muted-foreground">
                {kpilar.aktifFirmalar} aktif
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <p className="text-xs text-muted-foreground">Sözleşme Bütçe</p>
              </div>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(kpilar.toplamSozlesmeButcesi)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-green-600" />
                <p className="text-xs text-muted-foreground">Toplam Hakediş</p>
              </div>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(kpilar.toplamHakedis)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-600" />
                <p className="text-xs text-muted-foreground">Ort. Performans</p>
              </div>
              <p className="text-2xl font-bold mt-1">
                {kpilar.ortalamaPerformans > 0
                  ? `${kpilar.ortalamaPerformans}/10`
                  : "—"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-600" />
                <p className="text-xs text-muted-foreground">Aktif Firma</p>
              </div>
              <p className="text-2xl font-bold mt-1">
                {kpilar.aktifFirmalar}
              </p>
            </CardContent>
          </Card>

          <Card className={kpilar.suresiYaklasanEvrak > 0 ? "border-red-200 bg-red-50/50 dark:bg-red-950/20" : ""}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`h-4 w-4 ${kpilar.suresiYaklasanEvrak > 0 ? "text-red-600" : "text-muted-foreground"}`} />
                <p className="text-xs text-muted-foreground">Evrak Uyarı</p>
              </div>
              <p className={`text-2xl font-bold mt-1 ${kpilar.suresiYaklasanEvrak > 0 ? "text-red-600" : ""}`}>
                {kpilar.suresiYaklasanEvrak}
              </p>
              <p className="text-xs text-muted-foreground">süresi yaklaşan</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtre ve Arama */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Taşeron Firmalar
            </CardTitle>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Firma ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-[200px]"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="mr-1 h-3.5 w-3.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="true">Aktif</SelectItem>
                  <SelectItem value="false">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {firmalar.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">
                Henüz taşeron firma yok
              </h3>
              <p className="mt-2 text-muted-foreground">
                İlk taşeron firmanızı ekleyin
              </p>
              <Button
                className="mt-4"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Yeni Taşeron Ekle
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {firmalar.map((firma) => (
                <Link
                  key={firma.id}
                  href={`/taseron/${firma.id}`}
                  className="block group"
                >
                  <Card className="h-full transition-all hover:shadow-md hover:border-orange-300 group-hover:bg-accent/50">
                    <CardContent className="pt-4 pb-3 px-4 space-y-3">
                      {/* Üst: Firma adı + durum */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-base truncate group-hover:text-orange-700">
                            {firma.name}
                          </h3>
                          {firma.specialization && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {firma.specialization}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {!firma.isActive && (
                            <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                              Pasif
                            </Badge>
                          )}
                          {firma.evrakUyari > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-0.5" />
                              {firma.evrakUyari}
                            </Badge>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-orange-600" />
                        </div>
                      </div>

                      {/* İletişim */}
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {firma.contactPerson && (
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            <span className="truncate">{firma.contactPerson}</span>
                          </div>
                        )}
                        {(firma.contactPhone || firma.phone) && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{firma.contactPhone || firma.phone}</span>
                          </div>
                        )}
                        {firma.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="truncate">{firma.email}</span>
                          </div>
                        )}
                        {firma.city && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{firma.city}</span>
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* Alt: Sayılar */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Sözleşme</p>
                          <p className="font-semibold text-sm">
                            {firma.sozlesmeCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Hakediş</p>
                          <p className="font-semibold text-sm">
                            {firma.toplamHakedis > 0
                              ? formatCurrency(firma.toplamHakedis)
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Performans</p>
                          <div
                            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-sm font-semibold ${getRatingBg(
                              firma.sonPerformans?.genelPuan ?? null
                            )} ${getRatingColor(firma.sonPerformans?.genelPuan ?? null)}`}
                          >
                            {firma.sonPerformans ? (
                              <>
                                <TrendingUp className="h-3 w-3" />
                                {firma.sonPerformans.genelPuan}
                              </>
                            ) : (
                              "—"
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
