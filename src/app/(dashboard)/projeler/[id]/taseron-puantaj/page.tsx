// @ts-nocheck
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Save,
  ChevronLeft,
  ChevronRight,
  Users,
  HardHat,
  CalendarDays,
  Plus,
  Trash2,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

// ─── Tipler ──────────────────────────────────────────────
interface TaseronCompany {
  id: string;
  name: string;
  specialization: string | null;
  contactPerson: string | null;
}

interface Kalem {
  id?: string;
  pozisyon: string;
  sayi: number;
  mesaiSaat: number;
  notes: string;
}

interface PuantajRecord {
  id?: string;
  companyId: string;
  companyName: string;
  toplamIsci: number;
  toplamMesai: number;
  notes: string;
  kalemler: Kalem[];
}

const POZISYONLAR = ["Usta", "Kalfa", "Düz İşçi", "Operatör", "Teknisyen"];

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const turkishDays = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

/* ═══════════════════════════════════════════════════════════ */
export default function TaseronPuantajPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [date, setDate] = useState(() => formatDate(new Date()));
  const [companies, setCompanies] = useState<TaseronCompany[]>([]);
  const [editMap, setEditMap] = useState<Record<string, PuantajRecord>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);

  const currentDate = useMemo(() => new Date(date + "T00:00:00"), [date]);
  const dayName = turkishDays[currentDate.getDay()];
  const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/projeler/${projectId}/taseron-puantaj?date=${date}`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();

      setCompanies(data.companies);

      // EditMap oluştur - her firma için
      const map: Record<string, PuantajRecord> = {};
      data.companies.forEach((c: TaseronCompany) => {
        const existing = data.puantajlar.find((p: any) => p.companyId === c.id);
        map[c.id] = {
          companyId: c.id,
          companyName: c.name,
          toplamIsci: existing?.toplamIsci ?? 0,
          toplamMesai: existing?.toplamMesai ?? 0,
          notes: existing?.notes ?? "",
          kalemler: existing?.kalemler?.length > 0
            ? existing.kalemler.map((k: any) => ({
                ...k,
                notes: k.notes || "",
              }))
            : [],
        };
      });
      setEditMap(map);
      setHasChanges(false);
    } catch {
      toast.error("Taşeron puantaj verileri yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [projectId, date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateCompany = (companyId: string, field: string, value: any) => {
    setEditMap((prev) => ({
      ...prev,
      [companyId]: { ...prev[companyId], [field]: value },
    }));
    setHasChanges(true);
  };

  const addKalem = (companyId: string) => {
    setEditMap((prev) => {
      const record = prev[companyId];
      const usedPositions = record.kalemler.map((k) => k.pozisyon);
      const nextPoz = POZISYONLAR.find((p) => !usedPositions.includes(p)) || POZISYONLAR[0];
      return {
        ...prev,
        [companyId]: {
          ...record,
          kalemler: [...record.kalemler, { pozisyon: nextPoz, sayi: 0, mesaiSaat: 0, notes: "" }],
        },
      };
    });
    setHasChanges(true);
  };

  const updateKalem = (companyId: string, index: number, field: string, value: any) => {
    setEditMap((prev) => {
      const record = prev[companyId];
      const kalemler = [...record.kalemler];
      kalemler[index] = { ...kalemler[index], [field]: value };

      // Toplam işçi sayısını kalemlerden otomatik hesapla
      const toplamIsci = kalemler.reduce((sum, k) => sum + (k.sayi || 0), 0);
      const toplamMesai = kalemler.reduce((sum, k) => sum + ((k.sayi || 0) * (k.mesaiSaat || 0)), 0);

      return {
        ...prev,
        [companyId]: { ...record, kalemler, toplamIsci, toplamMesai },
      };
    });
    setHasChanges(true);
  };

  const removeKalem = (companyId: string, index: number) => {
    setEditMap((prev) => {
      const record = prev[companyId];
      const kalemler = record.kalemler.filter((_, i) => i !== index);
      const toplamIsci = kalemler.reduce((sum, k) => sum + (k.sayi || 0), 0);
      const toplamMesai = kalemler.reduce((sum, k) => sum + ((k.sayi || 0) * (k.mesaiSaat || 0)), 0);
      return {
        ...prev,
        [companyId]: { ...record, kalemler, toplamIsci, toplamMesai },
      };
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Sadece işçi sayısı > 0 olanları kaydet
      const records = Object.values(editMap)
        .filter((r) => r.toplamIsci > 0 || r.kalemler.length > 0)
        .map((r) => ({
          companyId: r.companyId,
          toplamIsci: r.toplamIsci,
          toplamMesai: r.toplamMesai,
          notes: r.notes || null,
          kalemler: r.kalemler.filter((k) => k.sayi > 0),
        }));

      if (records.length === 0) {
        toast.info("Kaydedilecek veri yok");
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/projeler/${projectId}/taseron-puantaj`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, records }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(data.message);
      setHasChanges(false);
      fetchData();
    } catch {
      toast.error("Kayıt başarısız");
    } finally {
      setSaving(false);
    }
  };

  const goDate = (delta: number) => {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + delta);
    setDate(formatDate(d));
  };

  // Genel istatistikler
  const stats = useMemo(() => {
    const values = Object.values(editMap);
    const toplamFirma = values.filter((r) => r.toplamIsci > 0).length;
    const toplamIsci = values.reduce((sum, r) => sum + r.toplamIsci, 0);
    const toplamMesai = values.reduce((sum, r) => sum + r.toplamMesai, 0);
    return { toplamFirma, toplamIsci, toplamMesai };
  }, [editMap]);

  if (companies.length === 0 && !loading) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <HardHat className="h-6 w-6 text-violet-600" />
            Taşeron Puantaj
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Taşeron firmalarının günlük işçi takibi
          </p>
        </div>
        <Card className="border-dashed border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="py-10 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-3 text-amber-500 opacity-50" />
            <p className="font-medium text-amber-800 dark:text-amber-200">Kayıtlı taşeron firma bulunamadı</p>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              Şirketler sayfasından taşeron firma ekleyin
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Başlık */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <HardHat className="h-6 w-6 text-violet-600" />
          Taşeron Puantaj
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Taşeron firmalarının günlük işçi takibi
        </p>
      </div>

      {/* Tarih Navigasyonu */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 border rounded-lg p-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => goDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-8 w-36 border-0 text-center text-sm"
          />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => goDate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Badge variant={isWeekend ? "destructive" : "outline"} className="text-xs">
          {dayName}
        </Badge>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-l-4 border-l-violet-500">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Aktif Taşeron</p>
            <p className="text-xl font-bold text-violet-600">{stats.toplamFirma}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Toplam İşçi</p>
            <p className="text-xl font-bold text-green-600">{stats.toplamIsci}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Toplam Adam·Saat</p>
            <p className="text-xl font-bold text-blue-600">{stats.toplamMesai.toFixed(1)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Taşeron Firma Listesi */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {companies.map((company) => {
            const record = editMap[company.id];
            if (!record) return null;
            const isExpanded = expandedCompany === company.id;
            const hasData = record.toplamIsci > 0;

            return (
              <Card
                key={company.id}
                className={`transition-all ${hasData ? "border-l-4 border-l-violet-400" : ""}`}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Firma Başlığı */}
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-3 cursor-pointer flex-1"
                      onClick={() => setExpandedCompany(isExpanded ? null : company.id)}
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                        <HardHat className="h-5 w-5 text-violet-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{company.name}</p>
                        {company.specialization && (
                          <p className="text-xs text-muted-foreground">{company.specialization}</p>
                        )}
                      </div>
                    </div>

                    {/* Hızlı Giriş */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          value={record.toplamIsci || ""}
                          onChange={(e) => updateCompany(company.id, "toplamIsci", Number(e.target.value))}
                          className="h-8 w-16 text-center text-sm"
                          min={0}
                          placeholder="0"
                        />
                        <span className="text-xs text-muted-foreground">kişi</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          value={record.toplamMesai || ""}
                          onChange={(e) => updateCompany(company.id, "toplamMesai", Number(e.target.value))}
                          className="h-8 w-16 text-center text-sm"
                          min={0}
                          step={0.5}
                          placeholder="0"
                        />
                        <span className="text-xs text-muted-foreground">saat</span>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => setExpandedCompany(isExpanded ? null : company.id)}
                      >
                        {isExpanded ? "Kapat" : "Detay"}
                      </Button>
                    </div>
                  </div>

                  {/* Genişletilmiş: Pozisyon Bazlı Detay */}
                  {isExpanded && (
                    <div className="border-t pt-3 space-y-3">
                      {/* Not */}
                      <Input
                        value={record.notes}
                        onChange={(e) => updateCompany(company.id, "notes", e.target.value)}
                        className="text-sm"
                        placeholder="Günlük not..."
                      />

                      {/* Pozisyon Kalemleri */}
                      {record.kalemler.length > 0 && (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[160px]">Pozisyon</TableHead>
                              <TableHead className="w-[100px] text-center">Kişi Sayısı</TableHead>
                              <TableHead className="w-[120px] text-center">Mesai Saat/Kişi</TableHead>
                              <TableHead>Not</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {record.kalemler.map((kalem, idx) => (
                              <TableRow key={idx}>
                                <TableCell>
                                  <Select
                                    value={kalem.pozisyon}
                                    onValueChange={(v) => updateKalem(company.id, idx, "pozisyon", v)}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {POZISYONLAR.map((p) => (
                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={kalem.sayi || ""}
                                    onChange={(e) => updateKalem(company.id, idx, "sayi", Number(e.target.value))}
                                    className="h-8 w-16 text-center text-sm mx-auto"
                                    min={0}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={kalem.mesaiSaat || ""}
                                    onChange={(e) => updateKalem(company.id, idx, "mesaiSaat", Number(e.target.value))}
                                    className="h-8 w-16 text-center text-sm mx-auto"
                                    min={0}
                                    max={24}
                                    step={0.5}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={kalem.notes}
                                    onChange={(e) => updateKalem(company.id, idx, "notes", e.target.value)}
                                    className="h-8 text-sm"
                                    placeholder="Not..."
                                  />
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive"
                                    onClick={() => removeKalem(company.id, idx)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1"
                        onClick={() => addKalem(company.id)}
                      >
                        <Plus className="h-3 w-3" /> Pozisyon Ekle
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Kaydet */}
      {hasChanges && (
        <div className="sticky bottom-4 flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gap-2 shadow-lg">
            <Save className="h-4 w-4" />
            {saving ? "Kaydediliyor..." : "Taşeron Puantajı Kaydet"}
          </Button>
        </div>
      )}
    </div>
  );
}
