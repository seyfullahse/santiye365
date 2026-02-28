"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ClipboardList,
  Package,
  BookOpen,
  Calculator,
  FileText,
  Building2,
  ChevronDown,
  ChevronRight,
  Download,
  Upload,
  Search,
  X,
} from "lucide-react";
import { utils, read, writeFileXLSX } from "xlsx";

/* ─── TYPES ─── */
interface KesifKalemi {
  id: string;
  pozNo: string;
  description: string;
  unit: string;
  quantity: number;
  malzemeFiyati: number;
  iscilikFiyati: number;
  toplamBirimFiyat: number;
  toplamTutar: number;
  anaGrup: string | null;
  altGrup: string | null;
}

interface AtasmanKalemi {
  id: string;
  kesifKalemiId: string;
  miktar: number;
  aciklama: string | null;
  kesifKalemi: KesifKalemi;
}

interface Atasman {
  id: string;
  atasmanNo: string;
  aciklama: string | null;
  katBolge: string | null;
  tarih: string | null;
  kalemler: AtasmanKalemi[];
}

interface IhzaratKalemi {
  id: string;
  kesifKalemiId: string;
  miktar: number;
  aciklama: string | null;
  kesifKalemi: KesifKalemi;
}

interface Ihzarat {
  id: string;
  ihzaratNo: string;
  aciklama: string | null;
  tarih: string | null;
  kalemler: IhzaratKalemi[];
}

interface HakedisDetay {
  id: string;
  no: number;
  period: string;
  startDate: string | null;
  endDate: string | null;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "PAID";
  notes: string | null;
  currentAmount: number;
  previousAmount: number;
  totalAmount: number;
  netAmount: number;
  advanceDeduction: number;
  retentionRate: number;
  retentionAmount: number;
  stampTax: number;
  otherDeduction: number;
  project: { id: string; name: string };
  company: { id: string; name: string } | null;
  contract: {
    id: string;
    name: string;
    contractNo: string | null;
    totalAmount: number;
    advanceRate: number;
    retentionRate: number;
  } | null;
  atasmanlar: Atasman[];
  ihzaratlar: Ihzarat[];
}

interface YesilDefterKalemi {
  kesifKalemiId: string;
  pozNo: string;
  description: string;
  unit: string;
  birimFiyat: number;
  malzemeFiyati: number;
  sozlesmeMiktar: number;
  oncekiMiktar: number;
  buDonemMiktar: number;
  kumulatifMiktar: number;
  oncekiTutar: number;
  buDonemTutar: number;
  kumulatifTutar: number;
}

interface IhzaratHesapKalemi {
  kesifKalemiId: string;
  pozNo: string;
  description: string;
  unit: string;
  malzemeFiyati: number;
  oncekiIhzarat: number;
  buDonemIhzarat: number;
  kumulatifIhzarat: number;
  oncekiIhzaratTutar: number;
  buDonemIhzaratTutar: number;
  kumulatifIhzaratTutar: number;
}

interface MahsupKalemi {
  kesifKalemiId: string;
  pozNo: string;
  description: string;
  unit: string;
  malzemeFiyati: number;
  kumulatifImalat: number;
  kumulatifIhzarat: number;
  mahsupMiktar: number;
  oncekiMahsupMiktar: number;
  buDonemMahsupMiktar: number;
  mahsupTutar: number;
  oncekiMahsupTutar: number;
  buDonemMahsupTutar: number;
}

interface Icmal {
  yesilDefterToplam: number;
  yesilDefterKumulatif: number;
  ihzaratToplam: number;
  ihzaratKumulatif: number;
  mahsupToplam: number;
  mahsupKumulatif: number;
  brutTutar: number;
  kesintiler: {
    avansKesintisi: number;
    teminatKesintisi: number;
    damgaVergisi: number;
    digerKesintiler: number;
    toplamKesinti: number;
  };
  netTutar: number;
}

interface ToplamlarResponse {
  hakedisNo: number;
  period: string;
  status: string;
  yesilDefter: YesilDefterKalemi[];
  ihzaratHesap: IhzaratHesapKalemi[];
  ihzaratMahsubu: MahsupKalemi[];
  icmal: Icmal;
}

const STATUS_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  DRAFT: { label: "Taslak", variant: "secondary" },
  SUBMITTED: { label: "Gönderildi", variant: "default" },
  APPROVED: { label: "Onaylandı", variant: "outline" },
  PAID: { label: "Ödendi", variant: "default" },
};

function fmt(val: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(val);
}

function fmtNum(val: number) {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 3 }).format(val);
}

export default function TaseronHakedisDetayPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [hakedis, setHakedis] = useState<HakedisDetay | null>(null);
  const [toplamlar, setToplamlar] = useState<ToplamlarResponse | null>(null);
  const [kesifKalemleri, setKesifKalemleri] = useState<KesifKalemi[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ozet");

  // Ataşman ekleme form
  const [atasmanOpen, setAtasmanOpen] = useState(false);
  const [atasmanAciklama, setAtasmanAciklama] = useState("");
  const [atasmanKatBolge, setAtasmanKatBolge] = useState("");
  const [atasmanKalemler, setAtasmanKalemler] = useState<
    { kesifKalemiId: string; miktar: number; aciklama: string }[]
  >([]);
  const [pozSearch, setPozSearch] = useState("");
  const [pozSearchFocused, setPozSearchFocused] = useState(false);
  const atasmanFileRef = useRef<HTMLInputElement>(null);

  // İhzarat ekleme form
  const [ihzaratOpen, setIhzaratOpen] = useState(false);
  const [ihzaratAciklama, setIhzaratAciklama] = useState("");
  const [ihzaratTarih, setIhzaratTarih] = useState("");
  const [ihzaratKalemler, setIhzaratKalemler] = useState<
    { kesifKalemiId: string; miktar: number }[]
  >([]);

  // İhzarat genişletme
  const [expandedIhzarat, setExpandedIhzarat] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [detayRes, toplamRes] = await Promise.all([
        fetch(`/api/hakedis/hakedisler/${id}`),
        fetch(`/api/hakedis/hakedisler/${id}/toplamlar`),
      ]);

      if (detayRes.ok) {
        const data = await detayRes.json();
        setHakedis(data);

        if (data.contract?.id) {
          const kesifRes = await fetch(
            `/api/hakedis/kesif?contractId=${data.contract.id}`
          );
          if (kesifRes.ok) {
            const kd = await kesifRes.json();
            setKesifKalemleri(Array.isArray(kd) ? kd : []);
          }
        }
      }

      if (toplamRes.ok) {
        setToplamlar(await toplamRes.json());
      }
    } catch {
      toast.error("Hakediş bilgileri yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleStatusChange = async (status: string) => {
    try {
      const res = await fetch(`/api/hakedis/hakedisler/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success("Durum güncellendi");
      fetchAll();
    } catch {
      toast.error("Durum güncellenemedi");
    }
  };

  const handleAddAtasman = async () => {
    const filteredKalemler = atasmanKalemler.filter((k) => k.miktar > 0);
    if (filteredKalemler.length === 0) {
      toast.error("En az bir kalem için miktar girin");
      return;
    }

    try {
      const res = await fetch(`/api/hakedis/hakedisler/${id}/atasmanlar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aciklama: atasmanAciklama || null,
          katBolge: atasmanKatBolge || null,
          kalemler: filteredKalemler.map((k) => ({
            kesifKalemiId: k.kesifKalemiId,
            miktar: k.miktar,
            aciklama: k.aciklama || null,
          })),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Ataşman eklendi");
      setAtasmanOpen(false);
      resetAtasmanForm();
      fetchAll();
    } catch {
      toast.error("Ataşman eklenemedi");
    }
  };

  const handleAddIhzarat = async () => {
    const filteredKalemler = ihzaratKalemler.filter((k) => k.miktar > 0);
    if (filteredKalemler.length === 0) {
      toast.error("En az bir kalem için miktar girin");
      return;
    }

    try {
      const res = await fetch(`/api/hakedis/hakedisler/${id}/ihzaratlar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aciklama: ihzaratAciklama || null,
          tarih: ihzaratTarih || null,
          kalemler: filteredKalemler,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("İhzarat eklendi");
      setIhzaratOpen(false);
      resetIhzaratForm();
      fetchAll();
    } catch {
      toast.error("İhzarat eklenemedi");
    }
  };

  const handleDeleteAtasman = async (atasmanId: string) => {
    if (!confirm("Bu ataşmanı silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/hakedis/atasmanlar?id=${atasmanId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Ataşman silindi");
      fetchAll();
    } catch {
      toast.error("Ataşman silinemedi");
    }
  };

  const handleDeleteIhzarat = async (ihzaratId: string) => {
    if (!confirm("Bu ihzaratı silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/hakedis/hakedisler/${id}/ihzaratlar?ihzaratId=${ihzaratId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("İhzarat silindi");
      fetchAll();
    } catch {
      toast.error("İhzarat silinemedi");
    }
  };

  const resetAtasmanForm = () => {
    setAtasmanAciklama("");
    setAtasmanKatBolge("");
    setAtasmanKalemler([]);
    setPozSearch("");
  };

  const resetIhzaratForm = () => {
    setIhzaratAciklama("");
    setIhzaratTarih("");
    setIhzaratKalemler([]);
  };

  const openAtasmanDialog = () => {
    setAtasmanKalemler([]);
    setPozSearch("");
    setAtasmanOpen(true);
  };

  const addPozToAtasman = (kesifId: string) => {
    if (atasmanKalemler.some((k) => k.kesifKalemiId === kesifId)) {
      toast.info("Bu poz zaten ekli");
      return;
    }
    setAtasmanKalemler((prev) => [
      ...prev,
      { kesifKalemiId: kesifId, miktar: 0, aciklama: "" },
    ]);
    setPozSearch("");
  };

  const removePozFromAtasman = (kesifId: string) => {
    setAtasmanKalemler((prev) => prev.filter((k) => k.kesifKalemiId !== kesifId));
  };

  const pozSearchResults = pozSearch.trim().length >= 1
    ? kesifKalemleri
        .filter((k) => !atasmanKalemler.some((ak) => ak.kesifKalemiId === k.id))
        .filter((k) => {
          const s = pozSearch.toLowerCase();
          return (
            k.pozNo.toLowerCase().includes(s) ||
            k.description.toLowerCase().includes(s) ||
            (k.anaGrup && k.anaGrup.toLowerCase().includes(s)) ||
            (k.altGrup && k.altGrup.toLowerCase().includes(s))
          );
        })
        .slice(0, 12)
    : [];

  const openIhzaratDialog = () => {
    setIhzaratKalemler(
      kesifKalemleri.map((k) => ({ kesifKalemiId: k.id, miktar: 0 }))
    );
    setIhzaratOpen(true);
  };

  // ─── Excel EXPORT ataşmanlar ───
  const handleExportAtasmanlar = () => {
    if (!hakedis || hakedis.atasmanlar.length === 0) {
      toast.error("Dışa aktarılacak ataşman yok");
      return;
    }
    const rows: Record<string, unknown>[] = [];
    for (const a of hakedis.atasmanlar) {
      for (const k of a.kalemler) {
        rows.push({
          "ATŞ No": a.atasmanNo,
          "Kat/Bölge": a.katBolge || "",
          "Poz No": k.kesifKalemi.pozNo,
          "İş Kalemi": k.kesifKalemi.description,
          Birim: k.kesifKalemi.unit,
          Miktar: k.miktar,
          Açıklama: k.aciklama || a.aciklama || "",
        });
      }
    }
    const ws = utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 35 },
      { wch: 8 }, { wch: 12 }, { wch: 30 },
    ];
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Ataşmanlar");
    writeFileXLSX(wb, `TASERON-HAK-${hakedis.no}-atasmanlar.xlsx`);
    toast.success(`${rows.length} satır dışa aktarıldı`);
  };

  // ─── Excel IMPORT ataşmanlar ───
  const handleImportAtasmanlar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const wb = read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = utils.sheet_to_json(ws) as Record<string, unknown>[];

      if (rows.length === 0) {
        toast.error("Excel dosyası boş");
        return;
      }

      const groups = new Map<string, {
        katBolge: string;
        aciklama: string;
        kalemler: { kesifKalemiId: string; miktar: number; aciklama: string }[];
      }>();

      let skipped = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const pozNo = String(row["Poz No"] || row.PozNo || row["POZ NO"] || "").trim();
        const miktar = Number(row.Miktar || row.miktar || row.MIKTAR || 0);
        const katBolge = String(row["Kat/Bölge"] || row.KatBolge || row["KAT/BÖLGE"] || "").trim();
        const aciklama = String(row["Açıklama"] || row.Aciklama || row.ACIKLAMA || "").trim();
        const groupKey = String(row["ATŞ No"] || row["Atş No"] || row.AtsNo || `IMPORT-${i}`).trim();

        if (!pozNo || miktar <= 0) {
          skipped++;
          continue;
        }

        const kesif = kesifKalemleri.find(
          (k) => k.pozNo.toLowerCase() === pozNo.toLowerCase()
        );
        if (!kesif) {
          toast.warning(`Satır ${i + 2}: "${pozNo}" poz numarası bulunamadı`);
          skipped++;
          continue;
        }

        if (!groups.has(groupKey)) {
          groups.set(groupKey, { katBolge, aciklama: "", kalemler: [] });
        }
        const grp = groups.get(groupKey)!;
        if (katBolge) grp.katBolge = katBolge;

        grp.kalemler.push({
          kesifKalemiId: kesif.id,
          miktar,
          aciklama,
        });
      }

      let success = 0;
      let fail = 0;

      for (const [, group] of groups) {
        try {
          const res = await fetch(`/api/hakedis/hakedisler/${id}/atasmanlar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              aciklama: group.aciklama || null,
              katBolge: group.katBolge || null,
              kalemler: group.kalemler,
            }),
          });
          if (!res.ok) throw new Error();
          success++;
        } catch {
          fail++;
        }
      }

      toast.success(`${success} ataşman oluşturuldu`);
      if (skipped > 0) toast.warning(`${skipped} satır atlandı`);
      if (fail > 0) toast.error(`${fail} ataşman oluşturulamadı`);
      fetchAll();
    } catch {
      toast.error("Excel içe aktarma başarısız");
    } finally {
      e.target.value = "";
    }
  };

  const handleDownloadTemplate = () => {
    const rows = kesifKalemleri.map((k) => ({
      "ATŞ No": "",
      "Kat/Bölge": "",
      "Poz No": k.pozNo,
      "İş Kalemi": k.description,
      Birim: k.unit,
      Miktar: 0,
      Açıklama: "",
    }));
    const ws = utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 35 },
      { wch: 8 }, { wch: 12 }, { wch: 30 },
    ];
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Ataşman Şablon");
    writeFileXLSX(wb, "taseron-atasman-sablon.xlsx");
    toast.success("Şablon indirildi — Poz No ve Miktar sütunlarını doldurun");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
        Yükleniyor…
      </div>
    );
  }

  if (!hakedis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Hakediş bulunamadı</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Geri
        </Button>
      </div>
    );
  }

  const st = STATUS_LABELS[hakedis.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-6 w-6 text-orange-600" />
              HAK-{hakedis.no}
              <Badge variant={st.variant} className="ml-2">
                {st.label}
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {hakedis.contract?.name} • {hakedis.period} •{" "}
              {hakedis.project.name}
              {hakedis.company && <span> • {hakedis.company.name}</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(["DRAFT", "SUBMITTED", "APPROVED", "PAID"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={hakedis.status === s ? "default" : "outline"}
              onClick={() => handleStatusChange(s)}
              className="text-xs"
            >
              {STATUS_LABELS[s].label}
            </Button>
          ))}
        </div>
      </div>

      {/* ─── TABS ─── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="ozet" className="text-xs sm:text-sm">Özet</TabsTrigger>
          <TabsTrigger value="atasmanlar" className="text-xs sm:text-sm">Ataşmanlar</TabsTrigger>
          <TabsTrigger value="ihzarat" className="text-xs sm:text-sm">İhzarat</TabsTrigger>
          <TabsTrigger value="yesil-defter" className="text-xs sm:text-sm">Yeşil Defter</TabsTrigger>
          <TabsTrigger value="mahsup" className="text-xs sm:text-sm">Mahsup</TabsTrigger>
          <TabsTrigger value="icmal" className="text-xs sm:text-sm">İcmal</TabsTrigger>
        </TabsList>

        {/* ═══ ÖZET TAB ═══ */}
        <TabsContent value="ozet" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Sözleşme Tutarı</p>
                <p className="text-lg font-bold font-mono">{fmt(hakedis.contract?.totalAmount ?? 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Önceki Toplam</p>
                <p className="text-lg font-bold font-mono">{fmt(hakedis.previousAmount)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Bu Dönem</p>
                <p className="text-lg font-bold font-mono text-orange-600">
                  {fmt(toplamlar?.icmal.yesilDefterToplam ?? hakedis.currentAmount)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Net Ödenecek</p>
                <p className="text-lg font-bold font-mono text-primary">
                  {fmt(toplamlar?.icmal.netTutar ?? hakedis.netAmount)}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Hakediş Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dönem</span>
                  <span className="font-medium">{hakedis.period}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tarih Aralığı</span>
                  <span>
                    {hakedis.startDate ? new Date(hakedis.startDate).toLocaleDateString("tr-TR") : "—"}{" "}–{" "}
                    {hakedis.endDate ? new Date(hakedis.endDate).toLocaleDateString("tr-TR") : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taşeron</span>
                  <span>{hakedis.company?.name ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ataşman Sayısı</span>
                  <span>{hakedis.atasmanlar.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">İhzarat Sayısı</span>
                  <span>{hakedis.ihzaratlar.length}</span>
                </div>
                {hakedis.notes && (
                  <>
                    <Separator />
                    <div>
                      <span className="text-muted-foreground text-xs">Notlar</span>
                      <p className="mt-1">{hakedis.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {toplamlar && (
              <Card className="border-orange-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">İcmal Özeti</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">İmalat (Yeşil Defter)</span>
                    <span className="font-mono">{fmt(toplamlar.icmal.yesilDefterToplam)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">İhzarat</span>
                    <span className="font-mono">{fmt(toplamlar.icmal.ihzaratToplam)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>İhzarat Mahsubu</span>
                    <span className="font-mono">- {fmt(toplamlar.icmal.mahsupToplam)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Brüt Tutar</span>
                    <span className="font-mono">{fmt(toplamlar.icmal.brutTutar)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Toplam Kesinti</span>
                    <span className="font-mono">- {fmt(toplamlar.icmal.kesintiler.toplamKesinti)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Net Ödenecek</span>
                    <span className="font-mono text-primary">{fmt(toplamlar.icmal.netTutar)}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ═══ ATAŞMANLAR TAB ═══ */}
        <TabsContent value="atasmanlar" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Ataşmanlar ({hakedis.atasmanlar.length})
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={handleDownloadTemplate}>
                <Download className="h-3.5 w-3.5" /> Şablon
              </Button>
              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => atasmanFileRef.current?.click()}>
                <Upload className="h-3.5 w-3.5" /> Excel İçe Aktar
              </Button>
              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={handleExportAtasmanlar}>
                <Download className="h-3.5 w-3.5" /> Excel Dışa Aktar
              </Button>
              <Button size="sm" className="gap-1" onClick={openAtasmanDialog}>
                <Plus className="h-4 w-4" /> Yeni Ataşman
              </Button>
            </div>
          </div>

          <input ref={atasmanFileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportAtasmanlar} />

          {hakedis.atasmanlar.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Henüz ataşman eklenmemiş. Saha ölçümlerini eklemek için &quot;Yeni Ataşman&quot; butonunu kullanın.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ATŞ No</TableHead>
                        <TableHead>Kat/Bölge</TableHead>
                        <TableHead>Poz No</TableHead>
                        <TableHead className="min-w-[180px]">İş Kalemi</TableHead>
                        <TableHead>Birim</TableHead>
                        <TableHead className="text-right">Miktar</TableHead>
                        <TableHead>Açıklama</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hakedis.atasmanlar.map((a, aIdx) => (
                        a.kalemler.map((k, kIdx) => (
                          <TableRow key={k.id} className={aIdx % 2 === 0 ? "" : "bg-muted/30"}>
                            {kIdx === 0 ? (
                              <TableCell rowSpan={a.kalemler.length} className="font-mono text-xs font-semibold align-top border-r">
                                {a.atasmanNo}
                              </TableCell>
                            ) : null}
                            {kIdx === 0 ? (
                              <TableCell rowSpan={a.kalemler.length} className="text-xs align-top border-r">
                                {a.katBolge || "—"}
                              </TableCell>
                            ) : null}
                            <TableCell className="font-mono text-xs font-medium">{k.kesifKalemi.pozNo}</TableCell>
                            <TableCell className="text-xs">{k.kesifKalemi.description}</TableCell>
                            <TableCell className="text-xs">{k.kesifKalemi.unit}</TableCell>
                            <TableCell className="text-right font-mono text-xs font-semibold text-orange-600">{fmtNum(k.miktar)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{k.aciklama || a.aciklama || "—"}</TableCell>
                            {kIdx === 0 ? (
                              <TableCell rowSpan={a.kalemler.length} className="align-top">
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => handleDeleteAtasman(a.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            ) : null}
                          </TableRow>
                        ))
                      ))}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={5} className="text-right">TOPLAM</TableCell>
                        <TableCell className="text-right font-mono">
                          {fmtNum(hakedis.atasmanlar.reduce((sum, a) => sum + a.kalemler.reduce((s, k) => s + k.miktar, 0), 0))}
                        </TableCell>
                        <TableCell colSpan={2}>
                          <span className="text-xs text-muted-foreground">
                            {hakedis.atasmanlar.length} ataşman, {hakedis.atasmanlar.reduce((s, a) => s + a.kalemler.length, 0)} kalem
                          </span>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ İHZARAT TAB ═══ */}
        <TabsContent value="ihzarat" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5" />
              İhzarat ({hakedis.ihzaratlar.length})
            </h2>
            <Button size="sm" className="gap-1" onClick={openIhzaratDialog}>
              <Plus className="h-4 w-4" /> Yeni İhzarat
            </Button>
          </div>

          {hakedis.ihzaratlar.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Henüz ihzarat eklenmemiş. Sahada stokta bulunan malzeme miktarlarını ekleyin.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {hakedis.ihzaratlar.map((ihz) => (
                <Card key={ihz.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => setExpandedIhzarat(expandedIhzarat === ihz.id ? null : ihz.id)}
                      >
                        {expandedIhzarat === ihz.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <CardTitle className="text-sm">{ihz.ihzaratNo}</CardTitle>
                        <span className="text-xs text-muted-foreground">({ihz.kalemler.length} kalem)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {ihz.tarih && (
                          <span className="text-xs text-muted-foreground">{new Date(ihz.tarih).toLocaleDateString("tr-TR")}</span>
                        )}
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => handleDeleteIhzarat(ihz.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {ihz.aciklama && <CardDescription className="ml-6">{ihz.aciklama}</CardDescription>}
                  </CardHeader>
                  {expandedIhzarat === ihz.id && (
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Poz No</TableHead>
                            <TableHead>Açıklama</TableHead>
                            <TableHead>Birim</TableHead>
                            <TableHead className="text-right">Miktar</TableHead>
                            <TableHead className="text-right">Malz. Fiyatı</TableHead>
                            <TableHead className="text-right">Tutar</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ihz.kalemler.map((k) => (
                            <TableRow key={k.id}>
                              <TableCell className="font-mono text-xs">{k.kesifKalemi.pozNo}</TableCell>
                              <TableCell className="text-xs">{k.kesifKalemi.description}</TableCell>
                              <TableCell className="text-xs">{k.kesifKalemi.unit}</TableCell>
                              <TableCell className="text-right font-mono font-semibold">{fmtNum(k.miktar)}</TableCell>
                              <TableCell className="text-right font-mono text-xs">{fmt(k.kesifKalemi.malzemeFiyati)}</TableCell>
                              <TableCell className="text-right font-mono text-xs font-semibold">{fmt(k.miktar * k.kesifKalemi.malzemeFiyati)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══ YEŞİL DEFTER TAB ═══ */}
        <TabsContent value="yesil-defter" className="space-y-4 mt-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold">Yeşil Defter (Kümülatif)</h2>
          </div>

          {!toplamlar ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">Hesaplama yapılamadı.</CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Poz No</TableHead>
                        <TableHead className="min-w-[180px]">Açıklama</TableHead>
                        <TableHead>Birim</TableHead>
                        <TableHead className="text-right">B. Fiyat</TableHead>
                        <TableHead className="text-right">Söz. Miktar</TableHead>
                        <TableHead className="text-right">Önceki</TableHead>
                        <TableHead className="text-right">Bu Dönem</TableHead>
                        <TableHead className="text-right">Kümülatif</TableHead>
                        <TableHead className="text-right">Bu Dönem (₺)</TableHead>
                        <TableHead className="text-right">Kümülatif (₺)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {toplamlar.yesilDefter
                        .filter((y) => y.kumulatifMiktar > 0 || y.buDonemMiktar > 0)
                        .map((y) => (
                          <TableRow key={y.kesifKalemiId}>
                            <TableCell className="font-mono text-xs">{y.pozNo}</TableCell>
                            <TableCell className="text-xs">{y.description}</TableCell>
                            <TableCell className="text-xs">{y.unit}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{fmt(y.birimFiyat)}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{fmtNum(y.sozlesmeMiktar)}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{fmtNum(y.oncekiMiktar)}</TableCell>
                            <TableCell className="text-right font-mono text-xs font-semibold text-orange-600">{fmtNum(y.buDonemMiktar)}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{fmtNum(y.kumulatifMiktar)}</TableCell>
                            <TableCell className="text-right font-mono text-xs font-semibold">{fmt(y.buDonemTutar)}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{fmt(y.kumulatifTutar)}</TableCell>
                          </TableRow>
                        ))}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={8} className="text-right">TOPLAM</TableCell>
                        <TableCell className="text-right font-mono">{fmt(toplamlar.icmal.yesilDefterToplam)}</TableCell>
                        <TableCell className="text-right font-mono">{fmt(toplamlar.icmal.yesilDefterKumulatif)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ İHZARAT MAHSUBU TAB ═══ */}
        <TabsContent value="mahsup" className="space-y-4 mt-4">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold">İhzarat Mahsubu</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            İmalat yapıldığında, daha önce ihzarat olarak ödenen malzeme bedelinin düşülmesi.
            Mahsup = min(Küm. İmalat, Küm. İhzarat) × Malzeme Fiyatı − Önceki Mahsup
          </p>

          {!toplamlar ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">Hesaplama yapılamadı.</CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Poz No</TableHead>
                        <TableHead className="min-w-[150px]">Açıklama</TableHead>
                        <TableHead className="text-right">Malz. Fiyat</TableHead>
                        <TableHead className="text-right">Küm. İmalat</TableHead>
                        <TableHead className="text-right">Küm. İhzarat</TableHead>
                        <TableHead className="text-right">Önceki Mahsup</TableHead>
                        <TableHead className="text-right">Bu Dönem Mah.</TableHead>
                        <TableHead className="text-right">Bu Dönem (₺)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {toplamlar.ihzaratMahsubu
                        .filter((m) => m.kumulatifIhzarat > 0 || m.kumulatifImalat > 0)
                        .map((m) => (
                          <TableRow key={m.kesifKalemiId}>
                            <TableCell className="font-mono text-xs">{m.pozNo}</TableCell>
                            <TableCell className="text-xs">{m.description}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{fmt(m.malzemeFiyati)}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{fmtNum(m.kumulatifImalat)}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{fmtNum(m.kumulatifIhzarat)}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{fmtNum(m.oncekiMahsupMiktar)}</TableCell>
                            <TableCell className="text-right font-mono text-xs font-semibold text-orange-600">{fmtNum(m.buDonemMahsupMiktar)}</TableCell>
                            <TableCell className="text-right font-mono text-xs font-semibold">{fmt(m.buDonemMahsupTutar)}</TableCell>
                          </TableRow>
                        ))}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={7} className="text-right">TOPLAM</TableCell>
                        <TableCell className="text-right font-mono">{fmt(toplamlar.icmal.mahsupToplam)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ İCMAL TAB ═══ */}
        <TabsContent value="icmal" className="space-y-4 mt-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold">İcmal — HAK-{hakedis.no}</h2>
          </div>

          {!toplamlar ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">Hesaplama yapılamadı.</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-orange-200">
                <CardHeader>
                  <CardTitle className="text-base">Bu Dönem İcmali</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">İmalat (Yeşil Defter)</span>
                    <span className="font-mono font-semibold">{fmt(toplamlar.icmal.yesilDefterToplam)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">İhzarat (Malzeme Ön Ödeme)</span>
                    <span className="font-mono font-semibold">{fmt(toplamlar.icmal.ihzaratToplam)}</span>
                  </div>
                  <div className="flex justify-between text-orange-600">
                    <span>İhzarat Mahsubu (−)</span>
                    <span className="font-mono font-semibold">− {fmt(toplamlar.icmal.mahsupToplam)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Brüt Tutar</span>
                    <span className="font-mono">{fmt(toplamlar.icmal.brutTutar)}</span>
                  </div>
                  <Separator />
                  <div className="space-y-1">
                    <div className="flex justify-between text-red-600">
                      <span>Avans Kesintisi</span>
                      <span className="font-mono">− {fmt(toplamlar.icmal.kesintiler.avansKesintisi)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Teminat Kesintisi</span>
                      <span className="font-mono">− {fmt(toplamlar.icmal.kesintiler.teminatKesintisi)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Damga Vergisi</span>
                      <span className="font-mono">− {fmt(toplamlar.icmal.kesintiler.damgaVergisi)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Diğer Kesintiler</span>
                      <span className="font-mono">− {fmt(toplamlar.icmal.kesintiler.digerKesintiler)}</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-xl font-bold">
                    <span>Net Ödenecek</span>
                    <span className="font-mono text-primary">{fmt(toplamlar.icmal.netTutar)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Kümülatif Toplam</CardTitle>
                  <CardDescription>HAK-1&apos;den HAK-{hakedis.no}&apos;e kadar toplam</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kümülatif İmalat</span>
                    <span className="font-mono">{fmt(toplamlar.icmal.yesilDefterKumulatif)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kümülatif İhzarat</span>
                    <span className="font-mono">{fmt(toplamlar.icmal.ihzaratKumulatif)}</span>
                  </div>
                  <div className="flex justify-between text-orange-600">
                    <span>Kümülatif Mahsup</span>
                    <span className="font-mono">− {fmt(toplamlar.icmal.mahsupKumulatif)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sözleşme Tutarı</span>
                    <span className="font-mono">{fmt(hakedis.contract?.totalAmount ?? 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gerçekleşme Oranı</span>
                    <span className="font-mono font-semibold">
                      %{hakedis.contract?.totalAmount
                        ? ((toplamlar.icmal.yesilDefterKumulatif / hakedis.contract.totalAmount) * 100).toFixed(1)
                        : "0"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══ ATAŞMAN EKLEME DIALOG ═══ */}
      <Dialog open={atasmanOpen} onOpenChange={(o) => { setAtasmanOpen(o); if (!o) resetAtasmanForm(); }}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Ataşman Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Kat / Bölge</Label>
                <Input placeholder="Örn: B1 Kat, Blok A" value={atasmanKatBolge} onChange={(e) => setAtasmanKatBolge(e.target.value)} />
              </div>
              <div>
                <Label>Genel Açıklama</Label>
                <Input placeholder="Ataşman genel açıklaması" value={atasmanAciklama} onChange={(e) => setAtasmanAciklama(e.target.value)} />
              </div>
            </div>

            <Separator />

            {/* Poz Arama */}
            <div>
              <Label className="text-sm font-semibold">Poz Ekle</Label>
              <p className="text-xs text-muted-foreground mb-2">Poz numarası veya iş kalemi adı ile arayın, sonuçlardan seçin</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Poz no veya iş kalemi ara..."
                  value={pozSearch}
                  onChange={(e) => setPozSearch(e.target.value)}
                  onFocus={() => setPozSearchFocused(true)}
                  onBlur={() => setTimeout(() => setPozSearchFocused(false), 200)}
                  className="pl-9"
                />
                {pozSearch && (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setPozSearch("")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {pozSearchFocused && pozSearchResults.length > 0 && (
                <div className="mt-1 border rounded-lg bg-popover shadow-md max-h-[240px] overflow-y-auto">
                  {pozSearchResults.map((k) => (
                    <button
                      key={k.id}
                      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-accent text-xs border-b last:border-b-0 transition-colors"
                      onMouseDown={(e) => { e.preventDefault(); addPozToAtasman(k.id); }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono font-semibold text-primary shrink-0">{k.pozNo}</span>
                        <span className="truncate text-muted-foreground">{k.description}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-muted-foreground">{k.unit}</span>
                        <Plus className="h-3.5 w-3.5 text-orange-600" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {pozSearchFocused && pozSearch.trim().length >= 1 && pozSearchResults.length === 0 && (
                <div className="mt-1 border rounded-lg bg-popover shadow-md px-3 py-4 text-center">
                  <p className="text-xs text-muted-foreground">&quot;{pozSearch}&quot; ile eşleşen poz bulunamadı</p>
                </div>
              )}
            </div>

            {/* Seçilen Kalemler */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Seçilen Kalemler ({atasmanKalemler.length})</h3>
                {kesifKalemleri.length <= 50 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7"
                    onClick={() => {
                      const allIds = new Set(atasmanKalemler.map((k) => k.kesifKalemiId));
                      const missing = kesifKalemleri.filter((k) => !allIds.has(k.id));
                      if (missing.length === 0) { toast.info("Tüm pozlar zaten ekli"); return; }
                      setAtasmanKalemler((prev) => [
                        ...prev,
                        ...missing.map((k) => ({ kesifKalemiId: k.id, miktar: 0, aciklama: "" })),
                      ]);
                    }}
                  >
                    Tümünü Ekle
                  </Button>
                )}
              </div>

              {atasmanKalemler.length === 0 ? (
                <div className="border rounded-lg py-8 text-center text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Henüz kalem eklenmedi</p>
                  <p className="text-xs mt-1">Yukarıdan poz numarası arayarak kalem ekleyin</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Poz No</TableHead>
                        <TableHead className="min-w-[150px]">İş Kalemi</TableHead>
                        <TableHead>Birim</TableHead>
                        <TableHead className="text-right">Söz. Mik.</TableHead>
                        <TableHead className="w-28 text-right">Miktar</TableHead>
                        <TableHead className="w-44">Açıklama</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {atasmanKalemler.map((kalem, idx) => {
                        const kesif = kesifKalemleri.find((k) => k.id === kalem.kesifKalemiId);
                        if (!kesif) return null;
                        return (
                          <TableRow key={kalem.kesifKalemiId} className={kalem.miktar > 0 ? "bg-orange-50 dark:bg-orange-950/20" : ""}>
                            <TableCell className="font-mono text-xs font-semibold">{kesif.pozNo}</TableCell>
                            <TableCell className="text-xs">{kesif.description}</TableCell>
                            <TableCell className="text-xs">{kesif.unit}</TableCell>
                            <TableCell className="text-right font-mono text-xs">{fmtNum(kesif.quantity)}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                className="h-8 text-right text-xs w-28"
                                placeholder="0"
                                autoFocus={idx === atasmanKalemler.length - 1}
                                value={kalem.miktar || ""}
                                onChange={(e) => {
                                  const upd = [...atasmanKalemler];
                                  upd[idx] = { ...upd[idx], miktar: parseFloat(e.target.value) || 0 };
                                  setAtasmanKalemler(upd);
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                className="h-8 text-xs w-44"
                                placeholder="Açıklama"
                                value={kalem.aciklama || ""}
                                onChange={(e) => {
                                  const upd = [...atasmanKalemler];
                                  upd[idx] = { ...upd[idx], aciklama: e.target.value };
                                  setAtasmanKalemler(upd);
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => removePozFromAtasman(kalem.kesifKalemiId)}>
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setAtasmanOpen(false); resetAtasmanForm(); }}>İptal</Button>
              <Button onClick={handleAddAtasman} disabled={atasmanKalemler.length === 0}>
                <Plus className="h-4 w-4 mr-1" /> Ataşman Ekle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ İHZARAT EKLEME DIALOG ═══ */}
      <Dialog open={ihzaratOpen} onOpenChange={(o) => { setIhzaratOpen(o); if (!o) resetIhzaratForm(); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni İhzarat Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <strong>İhzarat:</strong> Sahada stokta bulunan ancak henüz imalatı yapılmamış malzeme miktarlarını girin.
              Malzeme ön ödemesi olarak hesaba katılacaktır.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Tarih</Label>
                <Input type="date" value={ihzaratTarih} onChange={(e) => setIhzaratTarih(e.target.value)} />
              </div>
              <div>
                <Label>Açıklama</Label>
                <Input placeholder="İhzarat açıklaması" value={ihzaratAciklama} onChange={(e) => setIhzaratAciklama(e.target.value)} />
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-semibold mb-2">Keşif Kalemleri — Stok Miktarlarını Girin</h3>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Poz No</TableHead>
                      <TableHead className="min-w-[180px]">Açıklama</TableHead>
                      <TableHead>Birim</TableHead>
                      <TableHead className="text-right">Malz. Fiyat</TableHead>
                      <TableHead className="w-32 text-right">İhzarat Miktar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kesifKalemleri.map((kesif, idx) => (
                      <TableRow key={kesif.id}>
                        <TableCell className="font-mono text-xs">{kesif.pozNo}</TableCell>
                        <TableCell className="text-xs">{kesif.description}</TableCell>
                        <TableCell className="text-xs">{kesif.unit}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{fmt(kesif.malzemeFiyati)}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="h-8 text-right text-xs w-28"
                            placeholder="0"
                            value={ihzaratKalemler[idx]?.miktar || ""}
                            onChange={(e) => {
                              const upd = [...ihzaratKalemler];
                              upd[idx] = { ...upd[idx], miktar: parseFloat(e.target.value) || 0 };
                              setIhzaratKalemler(upd);
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setIhzaratOpen(false); resetIhzaratForm(); }}>İptal</Button>
              <Button onClick={handleAddIhzarat}>
                <Plus className="h-4 w-4 mr-1" /> İhzarat Ekle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
