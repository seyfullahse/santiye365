"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Calculator,
  Settings2,
  ArrowRight,
  Banknote,
  Building2,
  User,
  TrendingUp,
  Bus,
  UtensilsCrossed,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

// ─── VARSAYILAN ORANLAR ─────────────────────────────
const DEFAULT_TAX_BRACKETS = [
  { limit: 158_000, rate: 15, label: "1. Dilim" },
  { limit: 330_000, rate: 20, label: "2. Dilim" },
  { limit: 800_000, rate: 27, label: "3. Dilim" },
  { limit: 4_300_000, rate: 35, label: "4. Dilim" },
  { limit: Infinity, rate: 40, label: "5. Dilim" },
];

const DEFAULT_RATES = {
  sgkWorker: 14,
  unemploymentWorker: 1,
  stampTax: 0.759,
  sgkEmployer: 15.5,      // %20.5 - %5 hazine teşviki
  unemploymentEmployer: 2,
  sgkCeiling: 0,           // SGK tavan (0 = yok/sınırsız)
};

// ─── YARDIMCI FONKSİYONLAR ──────────────────────────
function fmt(v: number): string {
  return v.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtInt(v: number): string {
  return v.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ─── HESAPLAMA FONKSİYONU ───────────────────────────
interface CalcResult {
  mode: "net" | "gross";
  gross: number;
  netSalary: number;
  sgkWorker: number;
  unemploymentWorker: number;
  incomeTax: number;
  stampTax: number;
  totalWorkerDeductions: number;
  sgkEmployer: number;
  unemploymentEmployer: number;
  employerTotalCost: number;
  // Yan haklar
  yolHakki: number;
  yemekHakki: number;
  totalFringe: number;
  netWithFringe: number;
  employerCostWithFringe: number;
  // Aylık gelir vergisi dilim detayı
  taxBracketDetails: { label: string; base: number; rate: number; tax: number }[];
  // Yıllık
  annualGross: number;
  annualNet: number;
  annualEmployerCost: number;
}

function calculateSalary(
  inputAmount: number,
  mode: "net" | "gross",
  rates: typeof DEFAULT_RATES,
  taxBrackets: typeof DEFAULT_TAX_BRACKETS,
  yolHakki: number,
  yemekHakki: number,
  month: number, // 1-12, kümülatif dilim hesabı için
): CalcResult {
  // Net modda iteratif olarak brüt bul
  let gross = mode === "gross" ? inputAmount : inputAmount * 1.42;
  if (mode === "net") {
    for (let i = 0; i < 80; i++) {
      const r = _calcFromGross(gross, rates, taxBrackets, month);
      const diff = inputAmount - r.netSalary;
      if (Math.abs(diff) < 0.01) break;
      gross += diff * 0.85;
    }
  }
  const result = _calcFromGross(gross, rates, taxBrackets, month);
  const totalFringe = yolHakki + yemekHakki;
  return {
    ...result,
    mode,
    yolHakki,
    yemekHakki,
    totalFringe,
    netWithFringe: result.netSalary + totalFringe,
    employerCostWithFringe: result.employerTotalCost + totalFringe,
    annualGross: result.gross * 12,
    annualNet: result.netSalary * 12 + totalFringe * 12,
    annualEmployerCost: result.employerTotalCost * 12 + totalFringe * 12,
  };
}

function _calcFromGross(
  monthlyGross: number,
  rates: typeof DEFAULT_RATES,
  taxBrackets: typeof DEFAULT_TAX_BRACKETS,
  month: number,
): Omit<CalcResult, "mode" | "yolHakki" | "yemekHakki" | "totalFringe" | "netWithFringe" | "employerCostWithFringe" | "annualGross" | "annualNet" | "annualEmployerCost"> {
  const sgkWorker = monthlyGross * (rates.sgkWorker / 100);
  const unemploymentWorker = monthlyGross * (rates.unemploymentWorker / 100);
  const stampTax = monthlyGross * (rates.stampTax / 100);

  // Gelir vergisi — kümülatif dilim
  const monthlyTaxBase = monthlyGross - sgkWorker - unemploymentWorker;
  const cumulativePast = monthlyTaxBase * (month - 1);
  const cumulativeNow = cumulativePast + monthlyTaxBase;

  let annualTaxNow = 0, annualTaxPast = 0;
  const taxBracketDetails: { label: string; base: number; rate: number; tax: number }[] = [];

  // Kümülatif vergi — şu ana kadar
  let prev = 0;
  for (const b of taxBrackets) {
    const upper = b.limit === Infinity ? 999_999_999 : b.limit;
    const tNow = Math.max(0, Math.min(cumulativeNow, upper) - prev);
    const tPast = Math.max(0, Math.min(cumulativePast, upper) - prev);
    if (tNow > 0) {
      annualTaxNow += tNow * (b.rate / 100);
    }
    if (tPast > 0) {
      annualTaxPast += tPast * (b.rate / 100);
    }
    // Bu aydaki dilim katkısı
    const monthBase = tNow - tPast;
    if (monthBase > 0) {
      taxBracketDetails.push({ label: b.label, base: monthBase, rate: b.rate, tax: monthBase * (b.rate / 100) });
    }
    prev = upper;
    if (cumulativeNow <= upper) break;
  }
  const incomeTax = annualTaxNow - annualTaxPast;

  const totalWorkerDeductions = sgkWorker + unemploymentWorker + incomeTax + stampTax;
  const netSalary = monthlyGross - totalWorkerDeductions;

  const sgkEmployer = monthlyGross * (rates.sgkEmployer / 100);
  const unemploymentEmployer = monthlyGross * (rates.unemploymentEmployer / 100);
  const employerTotalCost = monthlyGross + sgkEmployer + unemploymentEmployer;

  return {
    gross: r2(monthlyGross),
    netSalary: r2(netSalary),
    sgkWorker: r2(sgkWorker),
    unemploymentWorker: r2(unemploymentWorker),
    incomeTax: r2(incomeTax),
    stampTax: r2(stampTax),
    totalWorkerDeductions: r2(totalWorkerDeductions),
    sgkEmployer: r2(sgkEmployer),
    unemploymentEmployer: r2(unemploymentEmployer),
    employerTotalCost: r2(employerTotalCost),
    taxBracketDetails,
  };
}

function r2(v: number) { return Math.round(v * 100) / 100; }

// ─── AY İSİMLERİ ────────────────────────────────────
const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

export default function MaasHesaplamaPage() {
  const [mode, setMode] = useState<"net" | "gross">("net");
  const [inputAmount, setInputAmount] = useState("50000");
  const [selectedMonth, setSelectedMonth] = useState("1");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setSelectedMonth(String(new Date().getMonth() + 1));
    setMounted(true);
  }, []);
  const [yolHakki, setYolHakki] = useState("1500");
  const [yemekHakki, setYemekHakki] = useState("2000");
  const [showSettings, setShowSettings] = useState(false);

  // Ayarlanabilir oranlar
  const [rates, setRates] = useState({ ...DEFAULT_RATES });
  const [taxBrackets, setTaxBrackets] = useState(DEFAULT_TAX_BRACKETS.map(b => ({ ...b })));

  const result = useMemo(() => {
    const amt = Number(inputAmount) || 0;
    if (amt <= 0) return null;
    return calculateSalary(amt, mode, rates, taxBrackets, Number(yolHakki) || 0, Number(yemekHakki) || 0, Number(selectedMonth));
  }, [inputAmount, mode, rates, taxBrackets, yolHakki, yemekHakki, selectedMonth]);

  // 12 aylık tablo
  const yearlyTable = useMemo(() => {
    const amt = Number(inputAmount) || 0;
    if (amt <= 0) return [];
    return Array.from({ length: 12 }, (_, i) =>
      calculateSalary(amt, mode, rates, taxBrackets, Number(yolHakki) || 0, Number(yemekHakki) || 0, i + 1)
    );
  }, [inputAmount, mode, rates, taxBrackets, yolHakki, yemekHakki]);

  const updateRate = (key: keyof typeof DEFAULT_RATES, val: string) => {
    setRates(prev => ({ ...prev, [key]: Number(val) || 0 }));
  };

  const updateBracket = (idx: number, field: "limit" | "rate", val: string) => {
    setTaxBrackets(prev => {
      const next = prev.map(b => ({ ...b }));
      if (field === "limit") next[idx].limit = Number(val) || 0;
      if (field === "rate") next[idx].rate = Number(val) || 0;
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Calculator className="h-5 w-5 text-blue-600" />
          Brüt / Net Maaş Hesaplama
        </h2>
        <p className="text-sm text-muted-foreground">
          Net maaş veya brüt maaş girerek detaylı kesinti ve işveren maliyeti hesaplayın
        </p>
      </div>

      {/* Giriş Kartı */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Hesaplama Tipi</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as "net" | "gross")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="net">Net Maaş → Brüt</SelectItem>
                  <SelectItem value="gross">Brüt Maaş → Net</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{mode === "net" ? "Net Maaş (₺)" : "Brüt Maaş (₺)"}</Label>
              <Input
                type="number"
                step="100"
                min="0"
                placeholder="0"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                className="text-right font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1"><Bus className="h-3 w-3" /> Yol Hakkı (₺)</Label>
              <Input type="number" step="100" min="0" value={yolHakki} onChange={(e) => setYolHakki(e.target.value)} className="text-right font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1"><UtensilsCrossed className="h-3 w-3" /> Yemek Hakkı (₺)</Label>
              <Input type="number" step="100" min="0" value={yemekHakki} onChange={(e) => setYemekHakki(e.target.value)} className="text-right font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Ay</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="mt-4 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <Settings2 className="h-3.5 w-3.5" />
            {showSettings ? "Ayarları Gizle" : "Kesinti Oranlarını Ayarla"}
          </button>

          {/* Ayarlanabilir Oranlar */}
          {showSettings && (
            <div className="mt-4 border-t pt-4 space-y-4">
              <p className="text-xs font-semibold text-muted-foreground">Kesinti & Prim Oranları (%)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <RateInput label="SGK İşçi" value={rates.sgkWorker} onChange={(v) => updateRate("sgkWorker", v)} />
                <RateInput label="İşsizlik İşçi" value={rates.unemploymentWorker} onChange={(v) => updateRate("unemploymentWorker", v)} />
                <RateInput label="Damga Vergisi" value={rates.stampTax} onChange={(v) => updateRate("stampTax", v)} />
                <RateInput label="SGK İşveren" value={rates.sgkEmployer} onChange={(v) => updateRate("sgkEmployer", v)} />
                <RateInput label="İşsizlik İşveren" value={rates.unemploymentEmployer} onChange={(v) => updateRate("unemploymentEmployer", v)} />
              </div>

              <p className="text-xs font-semibold text-muted-foreground mt-3">Gelir Vergisi Dilimleri (Yıllık)</p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[11px] w-24">Dilim</TableHead>
                      <TableHead className="text-[11px]">Üst Sınır (₺)</TableHead>
                      <TableHead className="text-[11px] w-24">Oran (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxBrackets.map((b, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-[11px] py-1">{b.label}</TableCell>
                        <TableCell className="py-1">
                          {b.limit === Infinity ? (
                            <span className="text-xs text-muted-foreground">Sınırsız</span>
                          ) : (
                            <Input
                              type="number"
                              step="1000"
                              value={b.limit}
                              onChange={(e) => updateBracket(i, "limit", e.target.value)}
                              className="h-7 text-xs text-right font-mono"
                            />
                          )}
                        </TableCell>
                        <TableCell className="py-1">
                          <Input
                            type="number"
                            step="1"
                            value={b.rate}
                            onChange={(e) => updateBracket(i, "rate", e.target.value)}
                            className="h-7 text-xs text-right font-mono w-20"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <button
                onClick={() => { setRates({ ...DEFAULT_RATES }); setTaxBrackets(DEFAULT_TAX_BRACKETS.map(b => ({ ...b }))); }}
                className="text-[10px] text-blue-600 hover:underline"
              >
                Varsayılanlara Sıfırla
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sonuç */}
      {result && (
        <>
          {/* Özet Kartlar */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <SummaryCard
              icon={<User className="h-4 w-4 text-emerald-600" />}
              label="Net Maaş"
              value={`${fmt(result.netSalary)} ₺`}
              sub="Çalışana ödenen"
              color="text-emerald-600"
            />
            <SummaryCard
              icon={<Banknote className="h-4 w-4 text-blue-600" />}
              label="Brüt Maaş"
              value={`${fmt(result.gross)} ₺`}
              sub="Resmi brüt"
              color="text-blue-600"
            />
            <SummaryCard
              icon={<Building2 className="h-4 w-4 text-red-600" />}
              label="İşveren Maliyeti"
              value={`${fmt(result.employerTotalCost)} ₺`}
              sub="SGK + İşsizlik dahil"
              color="text-red-600"
            />
            <SummaryCard
              icon={<TrendingUp className="h-4 w-4 text-purple-600" />}
              label="Yan Haklar"
              value={`${fmt(result.totalFringe)} ₺`}
              sub={`Yol: ${fmt(result.yolHakki)} + Yemek: ${fmt(result.yemekHakki)}`}
              color="text-purple-600"
            />
            <SummaryCard
              icon={<Building2 className="h-4 w-4 text-red-700" />}
              label="Toplam Maliyet"
              value={`${fmt(result.employerCostWithFringe)} ₺`}
              sub="İşveren maliyeti + yan haklar"
              color="text-red-700"
            />
          </div>

          {/* Detay — Çalışan Kesintileri */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" /> Çalışan Kesintileri
                  <Badge variant="secondary" className="text-[10px] ml-auto">
                    {MONTHS[Number(selectedMonth) - 1]}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <DeductionRow label="Brüt Maaş" value={result.gross} bold />
                    <DeductionRow label={`SGK İşçi Payı (%${rates.sgkWorker})`} value={-result.sgkWorker} />
                    <DeductionRow label={`İşsizlik Sigortası (%${rates.unemploymentWorker})`} value={-result.unemploymentWorker} />
                    <DeductionRow label="Gelir Vergisi Matrahı" value={result.gross - result.sgkWorker - result.unemploymentWorker} muted />
                    {result.taxBracketDetails.map((d, i) => (
                      <DeductionRow key={i} label={`  └ ${d.label} (%${d.rate}) — ${fmt(d.base)} ₺ üzerinden`} value={-d.tax} small />
                    ))}
                    <DeductionRow label={`Gelir Vergisi (toplam)`} value={-result.incomeTax} />
                    <DeductionRow label={`Damga Vergisi (%${rates.stampTax})`} value={-result.stampTax} />
                    <TableRow className="border-t-2">
                      <TableCell className="font-bold text-sm py-2">Toplam Kesinti</TableCell>
                      <TableCell className="text-right font-bold font-mono text-sm py-2 text-red-600">
                        -{fmt(result.totalWorkerDeductions)} ₺
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-emerald-50/50 dark:bg-emerald-950/10">
                      <TableCell className="font-bold text-sm py-2">Net Maaş (eline geçen)</TableCell>
                      <TableCell className="text-right font-bold font-mono text-sm py-2 text-emerald-600">
                        {fmt(result.netSalary)} ₺
                      </TableCell>
                    </TableRow>
                    {result.totalFringe > 0 && (
                      <>
                        <DeductionRow label="+ Yol Hakkı" value={result.yolHakki} color="text-purple-600" />
                        <DeductionRow label="+ Yemek Hakkı" value={result.yemekHakki} color="text-purple-600" />
                        <TableRow className="bg-purple-50/50 dark:bg-purple-950/10">
                          <TableCell className="font-bold text-sm py-2">Toplam Ele Geçen</TableCell>
                          <TableCell className="text-right font-bold font-mono text-sm py-2 text-purple-600">
                            {fmt(result.netWithFringe)} ₺
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> İşveren Maliyeti
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <DeductionRow label="Brüt Maaş" value={result.gross} bold />
                    <DeductionRow label={`SGK İşveren Payı (%${rates.sgkEmployer})`} value={result.sgkEmployer} color="text-red-500" />
                    <DeductionRow label={`İşsizlik İşveren (%${rates.unemploymentEmployer})`} value={result.unemploymentEmployer} color="text-red-500" />
                    <TableRow className="border-t-2 bg-red-50/50 dark:bg-red-950/10">
                      <TableCell className="font-bold text-sm py-2">İşveren Toplam Maliyet</TableCell>
                      <TableCell className="text-right font-bold font-mono text-sm py-2 text-red-600">
                        {fmt(result.employerTotalCost)} ₺
                      </TableCell>
                    </TableRow>
                    {result.totalFringe > 0 && (
                      <>
                        <DeductionRow label="+ Yol Hakkı" value={result.yolHakki} color="text-purple-600" />
                        <DeductionRow label="+ Yemek Hakkı" value={result.yemekHakki} color="text-purple-600" />
                        <TableRow className="bg-red-100/50 dark:bg-red-950/20">
                          <TableCell className="font-bold text-sm py-2">Toplam İşveren Maliyeti</TableCell>
                          <TableCell className="text-right font-bold font-mono text-sm py-2 text-red-700">
                            {fmt(result.employerCostWithFringe)} ₺
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>

                {/* Özet Dağılım */}
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Dağılım Özeti</p>
                  <DistributionBar
                    netRatio={result.netSalary / result.employerCostWithFringe * 100}
                    taxRatio={result.totalWorkerDeductions / result.employerCostWithFringe * 100}
                    employerRatio={(result.sgkEmployer + result.unemploymentEmployer) / result.employerCostWithFringe * 100}
                    fringeRatio={result.totalFringe / result.employerCostWithFringe * 100}
                  />
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Çalışan eline geçen: %{(result.netSalary / result.employerCostWithFringe * 100).toFixed(1)}</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Devlete giden: %{(result.totalWorkerDeductions / result.employerCostWithFringe * 100).toFixed(1)}</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> İşveren SGK: %{((result.sgkEmployer + result.unemploymentEmployer) / result.employerCostWithFringe * 100).toFixed(1)}</div>
                    {result.totalFringe > 0 && <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Yan haklar: %{(result.totalFringe / result.employerCostWithFringe * 100).toFixed(1)}</div>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Yıllık 12 Ay Tablosu */}
          {yearlyTable.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> 12 Aylık Gelir Vergisi Dilim Etkisi
                  <Badge variant="outline" className="text-[10px] ml-auto">
                    Vergi dilimi yılın ilerleyen aylarında değişir
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[11px]">Ay</TableHead>
                        <TableHead className="text-[11px] text-right">Brüt</TableHead>
                        <TableHead className="text-[11px] text-right">SGK+İşsizlik</TableHead>
                        <TableHead className="text-[11px] text-right">Gelir V.</TableHead>
                        <TableHead className="text-[11px] text-right">Damga V.</TableHead>
                        <TableHead className="text-[11px] text-right">Kesinti Top.</TableHead>
                        <TableHead className="text-[11px] text-right">Net Maaş</TableHead>
                        <TableHead className="text-[11px] text-right">İşveren Mal.</TableHead>
                        <TableHead className="text-[11px] text-center">Dilim</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {yearlyTable.map((r, i) => {
                        const lastBracket = r.taxBracketDetails[r.taxBracketDetails.length - 1];
                        return (
                          <TableRow key={i} className={i === Number(selectedMonth) - 1 ? "bg-blue-50/50 dark:bg-blue-950/10 font-medium" : ""}>
                            <TableCell className="text-[11px] py-1.5 font-medium">{MONTHS[i]}</TableCell>
                            <TableCell className="text-[11px] py-1.5 text-right font-mono">{fmtInt(r.gross)}</TableCell>
                            <TableCell className="text-[11px] py-1.5 text-right font-mono">{fmtInt(r.sgkWorker + r.unemploymentWorker)}</TableCell>
                            <TableCell className="text-[11px] py-1.5 text-right font-mono">{fmtInt(r.incomeTax)}</TableCell>
                            <TableCell className="text-[11px] py-1.5 text-right font-mono">{fmtInt(r.stampTax)}</TableCell>
                            <TableCell className="text-[11px] py-1.5 text-right font-mono text-red-600">{fmtInt(r.totalWorkerDeductions)}</TableCell>
                            <TableCell className="text-[11px] py-1.5 text-right font-mono text-emerald-600 font-medium">{fmtInt(r.netSalary)}</TableCell>
                            <TableCell className="text-[11px] py-1.5 text-right font-mono text-red-500">{fmtInt(r.employerTotalCost)}</TableCell>
                            <TableCell className="text-[11px] py-1.5 text-center">
                              <Badge variant="outline" className="text-[9px]">{lastBracket?.label} %{lastBracket?.rate}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {/* Yıllık toplam */}
                      <TableRow className="border-t-2 font-bold">
                        <TableCell className="text-[11px] py-1.5">YILLIK TOPLAM</TableCell>
                        <TableCell className="text-[11px] py-1.5 text-right font-mono">{fmtInt(yearlyTable.reduce((s, r) => s + r.gross, 0))}</TableCell>
                        <TableCell className="text-[11px] py-1.5 text-right font-mono">{fmtInt(yearlyTable.reduce((s, r) => s + r.sgkWorker + r.unemploymentWorker, 0))}</TableCell>
                        <TableCell className="text-[11px] py-1.5 text-right font-mono">{fmtInt(yearlyTable.reduce((s, r) => s + r.incomeTax, 0))}</TableCell>
                        <TableCell className="text-[11px] py-1.5 text-right font-mono">{fmtInt(yearlyTable.reduce((s, r) => s + r.stampTax, 0))}</TableCell>
                        <TableCell className="text-[11px] py-1.5 text-right font-mono text-red-600">{fmtInt(yearlyTable.reduce((s, r) => s + r.totalWorkerDeductions, 0))}</TableCell>
                        <TableCell className="text-[11px] py-1.5 text-right font-mono text-emerald-600">{fmtInt(yearlyTable.reduce((s, r) => s + r.netSalary, 0))}</TableCell>
                        <TableCell className="text-[11px] py-1.5 text-right font-mono text-red-500">{fmtInt(yearlyTable.reduce((s, r) => s + r.employerTotalCost, 0))}</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bilgi Notu */}
          <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold flex items-center gap-1"><Info className="h-3.5 w-3.5" /> Hesaplama Notları</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Gelir vergisi kümülatif (yıllık matrah) üzerinden hesaplanır — yılın ilerleyen aylarında üst dilime geçildiğinde net maaş düşer.</li>
              <li>SGK işveren payı: %20.5 temel oran - %5 hazine teşviki (5510 sk. 81/ı) = %15.5 olarak hesaplanmıştır.</li>
              <li>Yol ve yemek hakları maaş bordrosu dışı yan hak olarak hesaplanmıştır (SGK matrahına dahil değil).</li>
              <li>AGİ (Asgari Geçim İndirimi) 2024 itibariyle kaldırılmıştır.</li>
              <li>Oranları ve dilimleri yukarıdaki ayarlardan güncelleyebilirsiniz.</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

// ─── ALT BİLEŞENLER ─────────────────────────────────
function SummaryCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  return (
    <Card className="py-0">
      <CardContent className="px-3 py-3">
        <div className="flex items-center gap-1.5 text-muted-foreground mb-1">{icon}<span className="text-[10px]">{label}</span></div>
        <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
        <p className="text-[10px] text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

function DeductionRow({ label, value, bold, muted, small, color }: { label: string; value: number; bold?: boolean; muted?: boolean; small?: boolean; color?: string }) {
  const textColor = color || (value < 0 ? "text-red-500" : muted ? "text-muted-foreground" : "");
  return (
    <TableRow>
      <TableCell className={`${small ? "text-[11px] pl-6" : "text-xs"} ${bold ? "font-semibold" : ""} ${muted ? "text-muted-foreground" : ""} py-1.5`}>
        {label}
      </TableCell>
      <TableCell className={`text-right font-mono ${small ? "text-[11px]" : "text-xs"} ${bold ? "font-semibold" : ""} ${textColor} py-1.5`}>
        {value < 0 ? `-${fmt(Math.abs(value))}` : fmt(value)} ₺
      </TableCell>
    </TableRow>
  );
}

function RateInput({ label, value, onChange }: { label: string; value: number; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px]">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          step="0.1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 text-xs text-right font-mono pr-6"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
      </div>
    </div>
  );
}

function DistributionBar({ netRatio, taxRatio, employerRatio, fringeRatio }: { netRatio: number; taxRatio: number; employerRatio: number; fringeRatio: number }) {
  return (
    <div className="w-full h-4 rounded-full overflow-hidden flex">
      <div className="bg-emerald-500 h-full transition-all" style={{ width: `${netRatio}%` }} title={`Net: %${netRatio.toFixed(1)}`} />
      <div className="bg-amber-500 h-full transition-all" style={{ width: `${taxRatio}%` }} title={`Vergi: %${taxRatio.toFixed(1)}`} />
      <div className="bg-red-500 h-full transition-all" style={{ width: `${employerRatio}%` }} title={`İşveren SGK: %${employerRatio.toFixed(1)}`} />
      {fringeRatio > 0 && <div className="bg-purple-500 h-full transition-all" style={{ width: `${fringeRatio}%` }} title={`Yan hak: %${fringeRatio.toFixed(1)}`} />}
    </div>
  );
}
