"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  TrendingUp,
  DollarSign,
  Home,
  AlertTriangle,
  ShoppingCart,
  PieChart,
  ArrowUpRight,
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

const statusLabels: Record<string, string> = {
  FIZIBILITE: "Fizibilite",
  INSAAT: "İnşaat",
  SATISTA: "Satışta",
  TAMAMLANDI: "Tamamlandı",
  IPTAL: "İptal",
};

const statusColors: Record<string, string> = {
  FIZIBILITE: "bg-blue-100 text-blue-800",
  INSAAT: "bg-yellow-100 text-yellow-800",
  SATISTA: "bg-green-100 text-green-800",
  TAMAMLANDI: "bg-gray-100 text-gray-800",
  IPTAL: "bg-red-100 text-red-800",
};

const typeLabels: Record<string, string> = {
  KONUT: "Konut",
  AVM: "AVM",
  OTEL: "Otel",
  OFIS: "Ofis",
  ARSA: "Arsa",
  KARMA: "Karma",
};

function formatCurrency(val: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(val);
}

export default function YatirimDashboardPage() {
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
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Yatırım & GYO Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}><CardContent className="p-6"><div className="h-20 bg-muted animate-pulse rounded" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-6">Veri yüklenemedi.</div>;

  const { summary, projects } = data;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Yatırım & GYO Dashboard</h1>
          <p className="text-muted-foreground">Yatırım projelerinizin genel görünümü</p>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Proje</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalProjects}</div>
            <p className="text-xs text-muted-foreground">{summary.activeProjects} aktif proje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Birim</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalUnits}</div>
            <p className="text-xs text-muted-foreground">{summary.soldUnits} satıldı ({summary.occupancyRate}%)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Satış</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalSaleAmount)}</div>
            <p className="text-xs text-muted-foreground">Son 30 gün: {summary.recentSales} satış</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tahsilat</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalCollected)}</div>
            <p className="text-xs text-muted-foreground">Bekleyen: {formatCurrency(summary.totalPending)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Bütçe</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalBudget)}</div>
            <p className="text-xs text-muted-foreground">Yatırım maliyeti</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hedef Gelir</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Tüm projeler toplam</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ROI</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.totalBudget > 0
                ? `%${Math.round(((summary.totalRevenue - summary.totalBudget) / summary.totalBudget) * 100)}`
                : "—"}
            </div>
            <p className="text-xs text-muted-foreground">Yatırım getirisi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Geciken Ödeme</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.overduePayments}</div>
            <p className="text-xs text-muted-foreground">Vadesi geçmiş taksit</p>
          </CardContent>
        </Card>
      </div>

      {/* Proje Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>Yatırım Projeleri</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Henüz yatırım projesi bulunmuyor. Portföy sayfasından yeni proje ekleyin.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium">Proje</th>
                    <th className="pb-2 font-medium">Tür</th>
                    <th className="pb-2 font-medium">Durum</th>
                    <th className="pb-2 font-medium">Şehir</th>
                    <th className="pb-2 font-medium text-right">Birimler</th>
                    <th className="pb-2 font-medium text-right">İnşaat %</th>
                    <th className="pb-2 font-medium text-right">Satış Tutarı</th>
                    <th className="pb-2 font-medium text-right">Tahsilat</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 font-medium">{p.name}</td>
                      <td className="py-3">{typeLabels[p.type] || p.type}</td>
                      <td className="py-3">
                        <Badge variant="outline" className={statusColors[p.status]}>
                          {statusLabels[p.status] || p.status}
                        </Badge>
                      </td>
                      <td className="py-3">{p.city || "—"}</td>
                      <td className="py-3 text-right">{p.soldUnits}/{p.totalUnits}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${Math.min(p.completionPct, 100)}%` }}
                            />
                          </div>
                          <span>%{p.completionPct}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right">{formatCurrency(p.saleAmount)}</td>
                      <td className="py-3 text-right">{formatCurrency(p.collected)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
