"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  ClipboardList,
  Loader2,
  Download,
  Search,
  Building2,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MUHASEBE_ROLES = ["SUPER_ADMIN", "ADMIN", "MUHASEBE"];

interface WorkerRate {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  dailyRate: number | null;
  overtimeRate: number | null;
  team: {
    id: string;
    name: string;
    company: { id: string; name: string };
  };
}

interface AttendanceSummary {
  workerId: string;
  presentDays: number;
  totalHours: number;
  overtimeHours: number;
}

export default function PuantajRaporPage() {
  const { data: session, status } = useSession();
  const [workers, setWorkers] = useState<WorkerRate[]>([]);
  const [attendance, setAttendance] = useState<Map<string, AttendanceSummary>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const hasAccess = session?.user?.role && MUHASEBE_ROLES.includes(session.user.role);

  useEffect(() => {
    if (status === "loading" || !hasAccess) return;

    async function fetchData() {
      setLoading(true);
      try {
        // Ücret verileri
        const ratesRes = await fetch("/api/puantaj/ucretler");
        if (!ratesRes.ok) return;
        const ratesData = await ratesRes.json();
        setWorkers(ratesData);

        // Puantaj verilerini al
        const [yearStr, monthStr] = selectedMonth.split("-");
        const year = parseInt(yearStr);
        const month = parseInt(monthStr);
        const monthStart = `${yearStr}-${monthStr}-01`;
        const daysInMonth = new Date(year, month, 0).getDate();
        const monthEnd = `${yearStr}-${monthStr}-${String(daysInMonth).padStart(2, "0")}`;

        const attRes = await fetch(
          `/api/puantaj?date=${monthStart}&endDate=${monthEnd}`
        );
        if (attRes.ok) {
          const attData = await attRes.json();
          const summaryMap = new Map<string, AttendanceSummary>();

          // API, çalışan bazlı iç içe attendances dizisi döndürüyor
          if (Array.isArray(attData)) {
            for (const worker of attData) {
              const wid = worker.id;
              if (!worker.attendances || worker.attendances.length === 0) continue;
              if (!summaryMap.has(wid)) {
                summaryMap.set(wid, { workerId: wid, presentDays: 0, totalHours: 0, overtimeHours: 0 });
              }
              const s = summaryMap.get(wid)!;
              for (const att of worker.attendances) {
                if (att.status === "PRESENT" || att.status === "HALF_DAY") {
                  s.presentDays++;
                }
                s.totalHours += att.totalHours ?? 0;
                s.overtimeHours += att.overtime ?? 0;
              }
            }
          }

          setAttendance(summaryMap);
        }
      } catch (err) {
        console.error("Rapor verileri alınamadı:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [status, hasAccess, selectedMonth]);

  // Firma listesi
  const companies = Array.from(
    new Map(
      workers.map((w) => [w.team.company.id, w.team.company.name])
    ).entries()
  ).map(([id, name]) => ({ id, name }));

  // Filtreleme
  const filtered = workers.filter((w) => {
    const matchesSearch =
      !search ||
      `${w.firstName} ${w.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      w.role.toLowerCase().includes(search.toLowerCase()) ||
      w.team.name.toLowerCase().includes(search.toLowerCase()) ||
      w.team.company.name.toLowerCase().includes(search.toLowerCase());
    const matchesCompany =
      companyFilter === "all" || w.team.company.id === companyFilter;
    return matchesSearch && matchesCompany;
  });

  // Maliyet hesapla
  function calcCost(worker: WorkerRate): { dayCost: number; overtimeCost: number; totalCost: number } {
    const att = attendance.get(worker.id);
    if (!att) return { dayCost: 0, overtimeCost: 0, totalCost: 0 };
    const dayCost = (worker.dailyRate ?? 0) * att.presentDays;
    const overtimeCost = (worker.overtimeRate ?? 0) * att.overtimeHours;
    return { dayCost, overtimeCost, totalCost: dayCost + overtimeCost };
  }

  // Toplamlar
  const totals = filtered.reduce(
    (acc, w) => {
      const cost = calcCost(w);
      const att = attendance.get(w.id);
      acc.days += att?.presentDays ?? 0;
      acc.hours += att?.totalHours ?? 0;
      acc.overtime += att?.overtimeHours ?? 0;
      acc.dayCost += cost.dayCost;
      acc.overtimeCost += cost.overtimeCost;
      acc.totalCost += cost.totalCost;
      return acc;
    },
    { days: 0, hours: 0, overtime: 0, dayCost: 0, overtimeCost: 0, totalCost: 0 }
  );

  // Firma bazlı toplam
  const companyTotals = new Map<string, { name: string; workers: number; days: number; totalCost: number }>();
  for (const w of filtered) {
    const cid = w.team.company.id;
    if (!companyTotals.has(cid)) {
      companyTotals.set(cid, { name: w.team.company.name, workers: 0, days: 0, totalCost: 0 });
    }
    const ct = companyTotals.get(cid)!;
    ct.workers++;
    const att = attendance.get(w.id);
    ct.days += att?.presentDays ?? 0;
    ct.totalCost += calcCost(w).totalCost;
  }

  // Excel dışa aktarım
  const handleExport = async () => {
    const XLSX = await import("xlsx");
    const data = filtered.map((w) => {
      const att = attendance.get(w.id);
      const cost = calcCost(w);
      return {
        "Firma": w.team.company.name,
        "Ekip": w.team.name,
        "Ad Soyad": `${w.firstName} ${w.lastName}`,
        "Görevi": w.role,
        "Birim Fiyat (₺)": w.dailyRate ?? "",
        "Mesai Ücreti (₺)": w.overtimeRate ?? "",
        "Gelen Gün": att?.presentDays ?? 0,
        "Toplam Saat": Math.round((att?.totalHours ?? 0) * 10) / 10,
        "Mesai Saat": Math.round((att?.overtimeHours ?? 0) * 10) / 10,
        "Gün Maliyeti (₺)": Math.round(cost.dayCost * 100) / 100,
        "Mesai Maliyeti (₺)": Math.round(cost.overtimeCost * 100) / 100,
        "Toplam Maliyet (₺)": Math.round(cost.totalCost * 100) / 100,
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Maliyet Raporu");
    XLSX.writeFile(wb, `muhasebe-puantaj-rapor-${selectedMonth}.xlsx`);
  };

  const formatCurrency = (val: number) =>
    val.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-teal-600" />
            Puantaj Maliyet Raporu
          </h2>
          <p className="text-sm text-muted-foreground">
            Puantaj + ücret verilerinden aylık maliyet analizi
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" />
          Excel
        </Button>
      </div>

      {/* Özet Kartları */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Gün</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.days}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Saat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(totals.hours * 10) / 10}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mesai Saat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{Math.round(totals.overtime * 10) / 10}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Maliyet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₺{formatCurrency(totals.totalCost)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Firma Bazlı Özet */}
      {companyTotals.size > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              Firma Bazlı Maliyet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from(companyTotals.values()).map((ct) => (
                <div key={ct.name} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{ct.name}</p>
                    <p className="text-xs text-muted-foreground">{ct.workers} çalışan · {ct.days} gün</p>
                  </div>
                  <span className="text-sm font-bold text-green-600">₺{formatCurrency(ct.totalCost)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-[170px]"
          />
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Çalışan, ekip veya firma ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Firma filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Firmalar</SelectItem>
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Detay Tablosu */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">#</TableHead>
                  <TableHead>Firma</TableHead>
                  <TableHead>Ekip</TableHead>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>Görevi</TableHead>
                  <TableHead className="text-right">Birim Fiyat</TableHead>
                  <TableHead className="text-right">Mesai Ücr.</TableHead>
                  <TableHead className="text-center">Gün</TableHead>
                  <TableHead className="text-right">Saat</TableHead>
                  <TableHead className="text-right">Mesai</TableHead>
                  <TableHead className="text-right">Gün Mal.</TableHead>
                  <TableHead className="text-right">Mesai Mal.</TableHead>
                  <TableHead className="text-right font-bold">Toplam</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-10 text-muted-foreground">
                      Veri bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {filtered.map((w, idx) => {
                      const att = attendance.get(w.id);
                      const cost = calcCost(w);
                      return (
                        <TableRow key={w.id}>
                          <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                          <TableCell className="text-sm">{w.team.company.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">{w.team.name}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{w.firstName} {w.lastName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{w.role}</TableCell>
                          <TableCell className="text-right text-sm">
                            {w.dailyRate !== null ? `₺${formatCurrency(w.dailyRate)}` : <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {w.overtimeRate !== null ? `₺${formatCurrency(w.overtimeRate)}` : <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell className="text-center">{att?.presentDays ?? 0}</TableCell>
                          <TableCell className="text-right">{Math.round((att?.totalHours ?? 0) * 10) / 10}</TableCell>
                          <TableCell className="text-right">{Math.round((att?.overtimeHours ?? 0) * 10) / 10}</TableCell>
                          <TableCell className="text-right text-sm">₺{formatCurrency(cost.dayCost)}</TableCell>
                          <TableCell className="text-right text-sm">₺{formatCurrency(cost.overtimeCost)}</TableCell>
                          <TableCell className="text-right font-bold text-green-600">₺{formatCurrency(cost.totalCost)}</TableCell>
                        </TableRow>
                      );
                    })}
                    {/* Toplam satır */}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={7} className="text-right">TOPLAM</TableCell>
                      <TableCell className="text-center">{totals.days}</TableCell>
                      <TableCell className="text-right">{Math.round(totals.hours * 10) / 10}</TableCell>
                      <TableCell className="text-right">{Math.round(totals.overtime * 10) / 10}</TableCell>
                      <TableCell className="text-right">₺{formatCurrency(totals.dayCost)}</TableCell>
                      <TableCell className="text-right">₺{formatCurrency(totals.overtimeCost)}</TableCell>
                      <TableCell className="text-right text-green-600">₺{formatCurrency(totals.totalCost)}</TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Bu rapor sadece muhasebe yetkisine sahip kullanıcılar tarafından görüntülenebilir.
        Maliyet = (Birim Fiyat × Gelen Gün) + (Mesai Ücreti × Mesai Saat)
      </p>
    </div>
  );
}
