"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  BarChart3,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface DashboardData {
  summary: {
    totalProjects: number;
    activeProjects: number;
    totalBudget: number;
    totalRevenue: number;
    totalUnits: number;
    soldUnits: number;
    totalSaleAmount: number;
    totalCollected: number;
    totalPending: number;
    overduePayments: number;
    recentSales: number;
    occupancyRate: number;
  };
  projects: {
    id: string;
    name: string;
    type: string;
    status: string;
    city: string | null;
    totalUnits: number;
    soldUnits: number;
    completionPct: number;
    totalBudget: number;
    saleAmount: number;
    collected: number;
  }[];
}

const typeLabels: Record<string, string> = {
  KONUT: "Konut",
  AVM: "AVM",
  OTEL: "Otel",
  OFIS: "Ofis",
  ARSA: "Arsa",
  KARMA: "Karma",
};

const statusLabels: Record<string, string> = {
  FIZIBILITE: "Fizibilite",
  INSAAT: "İnşaat",
  SATISTA: "Satışta",
  TAMAMLANDI: "Tamamlandı",
  IPTAL: "İptal",
};

function formatCurrency(val: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(val);
}

export default function ROIRaporlarPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/yatirim/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">ROI & Raporlar</h1>
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!data) return <div className="p-6">Veri yüklenemedi.</div>;

  const { summary, projects } = data;

  const globalROI = summary.totalBudget > 0
    ? ((summary.totalRevenue - summary.totalBudget) / summary.totalBudget) * 100
    : 0;

  const collectionRate = summary.totalSaleAmount > 0
    ? (summary.totalCollected / summary.totalSaleAmount) * 100
    : 0;

  const avgUnitPrice = summary.soldUnits > 0
    ? summary.totalSaleAmount / summary.soldUnits
    : 0;

  const budgetEfficiency = summary.totalBudget > 0
    ? (summary.totalSaleAmount / summary.totalBudget) * 100
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ROI & Raporlar</h1>
        <p className="text-muted-foreground">Yatırım getiri analizi ve performans raporları</p>
      </div>

      {/* Genel Performans KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Genel ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${globalROI >= 0 ? "text-green-600" : "text-red-600"}`}>
              %{globalROI.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {globalROI >= 0 ? (
                <span className="flex items-center gap-1 text-green-600"><ArrowUpRight className="h-3 w-3" /> Kârlı</span>
              ) : (
                <span className="flex items-center gap-1 text-red-600"><ArrowDownRight className="h-3 w-3" /> Zararlı</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" /> Tahsilat Oranı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">%{collectionRate.toFixed(1)}</div>
            <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(collectionRate, 100)}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Ort. Birim Fiyatı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgUnitPrice)}</div>
            <p className="text-xs text-muted-foreground">{summary.soldUnits} satış üzerinden</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Bütçe Verimliliği</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${budgetEfficiency >= 100 ? "text-green-600" : "text-yellow-600"}`}>
              %{budgetEfficiency.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">Satış / Bütçe oranı</p>
          </CardContent>
        </Card>
      </div>

      {/* Genel Özet Tablo */}
      <Card>
        <CardHeader>
          <CardTitle>Finansal Özet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Toplam Yatırım</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.totalBudget)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Hedef Gelir</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Gerçekleşen Satış</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalSaleAmount)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Tahsil Edilen</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalCollected)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Bekleyen Tahsilat</p>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(summary.totalPending)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Brüt Kâr/Zarar</p>
              <p className={`text-2xl font-bold ${(summary.totalRevenue - summary.totalBudget) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(summary.totalRevenue - summary.totalBudget)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Satış Oranı</p>
              <p className="text-2xl font-bold">%{summary.occupancyRate}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Geciken Ödeme</p>
              <p className="text-2xl font-bold text-red-600">{summary.overduePayments} adet</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proje Bazlı ROI */}
      <Card>
        <CardHeader>
          <CardTitle>Proje Bazlı Performans</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">Henüz yatırım projesi bulunmuyor</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proje</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">Bütçe</TableHead>
                    <TableHead className="text-right">Satış</TableHead>
                    <TableHead className="text-right">Tahsilat</TableHead>
                    <TableHead className="text-right">ROI</TableHead>
                    <TableHead className="text-right">Satış %</TableHead>
                    <TableHead className="text-right">İnşaat %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((p) => {
                    const projectROI = p.totalBudget > 0
                      ? ((p.saleAmount - p.totalBudget) / p.totalBudget) * 100
                      : 0;
                    const salesPct = p.totalUnits > 0
                      ? (p.soldUnits / p.totalUnits) * 100
                      : 0;

                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{typeLabels[p.type]}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{statusLabels[p.status]}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(p.totalBudget)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(p.saleAmount)}</TableCell>
                        <TableCell className="text-right text-green-600">{formatCurrency(p.collected)}</TableCell>
                        <TableCell className="text-right">
                          <span className={`font-bold ${projectROI >= 0 ? "text-green-600" : "text-red-600"}`}>
                            %{projectROI.toFixed(1)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full" style={{ width: `${salesPct}%` }} />
                            </div>
                            <span className="text-sm">%{salesPct.toFixed(0)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.completionPct}%` }} />
                            </div>
                            <span className="text-sm">%{p.completionPct}</span>
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

      {/* Performans Gösterge Barı */}
      <Card>
        <CardHeader>
          <CardTitle>Yatırım vs Getiri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Yatırım Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Toplam Yatırım (Bütçe)</span>
                <span>{formatCurrency(summary.totalBudget)}</span>
              </div>
              <div className="w-full h-6 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: "100%" }}>
                  %100
                </div>
              </div>
            </div>

            {/* Hedef Gelir Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Hedef Gelir</span>
                <span>{formatCurrency(summary.totalRevenue)}</span>
              </div>
              <div className="w-full h-6 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-400 rounded-full flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${summary.totalBudget > 0 ? Math.min((summary.totalRevenue / summary.totalBudget) * 100, 200) / 2 : 0}%` }}>
                  {summary.totalBudget > 0 ? `%${((summary.totalRevenue / summary.totalBudget) * 100).toFixed(0)}` : "—"}
                </div>
              </div>
            </div>

            {/* Gerçekleşen Satış Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Gerçekleşen Satış</span>
                <span>{formatCurrency(summary.totalSaleAmount)}</span>
              </div>
              <div className="w-full h-6 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${summary.totalBudget > 0 ? Math.min((summary.totalSaleAmount / summary.totalBudget) * 100, 200) / 2 : 0}%` }}>
                  {summary.totalBudget > 0 ? `%${((summary.totalSaleAmount / summary.totalBudget) * 100).toFixed(0)}` : "—"}
                </div>
              </div>
            </div>

            {/* Tahsilat Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Tahsil Edilen</span>
                <span>{formatCurrency(summary.totalCollected)}</span>
              </div>
              <div className="w-full h-6 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${summary.totalBudget > 0 ? Math.min((summary.totalCollected / summary.totalBudget) * 100, 200) / 2 : 0}%` }}>
                  {summary.totalBudget > 0 ? `%${((summary.totalCollected / summary.totalBudget) * 100).toFixed(0)}` : "—"}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
