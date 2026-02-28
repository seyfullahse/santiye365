"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Receipt,
  Landmark,
  Building2,
  FileText,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  CircleDollarSign,
  Clock,
  CheckCircle2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useSozlesme } from "./sozlesme-context";

/* ─── TYPES ─── */
interface Hakedis {
  id: string;
  type: "ISVEREN" | "TASERON";
  no: number;
  period: string;
  currentAmount: number;
  netAmount: number;
  status: string;
  project: { id: string; name: string };
  company: { id: string; name: string } | null;
  createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  DRAFT: { label: "Taslak", variant: "secondary" },
  SUBMITTED: { label: "Gönderildi", variant: "default" },
  APPROVED: { label: "Onaylandı", variant: "outline" },
  PAID: { label: "Ödendi", variant: "default" },
};

function formatCurrency(val: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(val);
}

export default function HakedisOverviewPage() {
  const router = useRouter();
  const { selectedContractId, selectedContract } = useSozlesme();
  const [hakedisler, setHakedisler] = useState<Hakedis[]>([]);
  const [contractCount, setContractCount] = useState(0);
  const [contractTotal, setContractTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [hRes, cRes] = await Promise.all([
        fetch("/api/hakedis"),
        fetch("/api/hakedis/sozlesmeler").catch(() => null),
      ]);
      if (hRes.ok) setHakedisler(await hRes.json());
      if (cRes?.ok) {
        const cData = await cRes.json();
        setContractCount(Array.isArray(cData) ? cData.length : 0);
        setContractTotal(Array.isArray(cData) ? cData.reduce((s: number, c: { totalAmount: number }) => s + c.totalAmount, 0) : 0);
      }
    } catch {
      toast.error("Veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isverenHakedis = hakedisler.filter((h) => h.type === "ISVEREN");
  const taseronHakedis = hakedisler.filter((h) => h.type === "TASERON");

  // Sözleşme filtresi uygulandığında bilgi göster
  const filterActive = !!selectedContractId;
  const totalIsverenNet = isverenHakedis.reduce((s, h) => s + h.netAmount, 0);
  const totalTaseronNet = taseronHakedis.reduce((s, h) => s + h.netAmount, 0);
  const totalCurrent = hakedisler.reduce((s, h) => s + h.currentAmount, 0);
  const pendingCount = hakedisler.filter((h) => h.status === "DRAFT" || h.status === "SUBMITTED").length;
  const approvedCount = hakedisler.filter((h) => h.status === "APPROVED" || h.status === "PAID").length;

  const recentHakedis = [...hakedisler]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <Receipt className="h-7 w-7 sm:h-8 sm:w-8 text-amber-600" />
          Hakediş Yönetimi
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          İşveren ve taşeron hakedişlerini, sözleşmeleri ve keşifleri tek yerden yönetin
        </p>
        {filterActive && selectedContract && (
          <p className="text-sm mt-2 text-primary font-medium">
            📋 Filtre: {selectedContract.name} ({selectedContract.type === "ISVEREN" ? "İşveren" : "Taşeron"})
          </p>
        )}
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-amber-600" />
              <p className="text-xs sm:text-sm text-muted-foreground">Toplam Hakediş</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold">{hakedisler.length}</p>
            <p className="text-xs text-muted-foreground mt-1">{contractCount} sözleşme</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpRight className="h-4 w-4 text-green-600" />
              <p className="text-xs sm:text-sm text-muted-foreground">İşveren Net</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold font-mono">{formatCurrency(totalIsverenNet)}</p>
            <p className="text-xs text-muted-foreground mt-1">{isverenHakedis.length} adet</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownRight className="h-4 w-4 text-red-600" />
              <p className="text-xs sm:text-sm text-muted-foreground">Taşeron Net</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold font-mono">{formatCurrency(totalTaseronNet)}</p>
            <p className="text-xs text-muted-foreground mt-1">{taseronHakedis.length} adet</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <CircleDollarSign className="h-4 w-4 text-blue-600" />
              <p className="text-xs sm:text-sm text-muted-foreground">Fark (Kâr)</p>
            </div>
            <p className={`text-xl sm:text-2xl font-bold font-mono ${totalIsverenNet - totalTaseronNet >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(totalIsverenNet - totalTaseronNet)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hızlı Erişim Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className="group cursor-pointer hover:shadow-lg hover:border-green-300 transition-all"
          onClick={() => router.push("/hakedis/isveren")}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Landmark className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-sm group-hover:text-green-600 transition-colors">İşveren Hakedişi</CardTitle>
                <CardDescription className="text-xs">İşverene kesilen hakedişler</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{isverenHakedis.length} hakediş</span>
              <span className="font-mono font-semibold text-xs">{formatCurrency(totalIsverenNet)}</span>
            </div>
          </CardContent>
        </Card>

        <Card
          className="group cursor-pointer hover:shadow-lg hover:border-orange-300 transition-all"
          onClick={() => router.push("/hakedis/taseron")}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-sm group-hover:text-orange-600 transition-colors">Taşeron Hakedişi</CardTitle>
                <CardDescription className="text-xs">Taşeronlara ödenen hakedişler</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{taseronHakedis.length} hakediş</span>
              <span className="font-mono font-semibold text-xs">{formatCurrency(totalTaseronNet)}</span>
            </div>
          </CardContent>
        </Card>

        <Card
          className="group cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all"
          onClick={() => router.push("/hakedis/sozlesmeler")}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-sm group-hover:text-blue-600 transition-colors">Sözleşmeler</CardTitle>
                <CardDescription className="text-xs">Sözleşme ve keşif yönetimi</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{contractCount} sözleşme</span>
              <span className="font-mono font-semibold text-xs">{formatCurrency(contractTotal)}</span>
            </div>
          </CardContent>
        </Card>

        <Card
          className="group cursor-pointer hover:shadow-lg hover:border-purple-300 transition-all"
          onClick={() => router.push("/hakedis/kesif")}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Upload className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-sm group-hover:text-purple-600 transition-colors">Keşif Yükle</CardTitle>
                <CardDescription className="text-xs">Excel ile keşif aktarımı</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">Excel veya manuel poz girişi</p>
          </CardContent>
        </Card>
      </div>

      {/* Durum Özeti ve Son Hakedişler */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Durum Özeti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Bekleyen</span>
              </div>
              <Badge variant="secondary">{pendingCount}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">Onaylanan / Ödenen</span>
              </div>
              <Badge variant="default">{approvedCount}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Dönem Toplamı</span>
              </div>
              <span className="text-sm font-mono font-semibold">{formatCurrency(totalCurrent)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Son Hakedişler</CardTitle>
            <CardDescription>En son oluşturulan hakedişler</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-6">Yükleniyor...</p>
            ) : recentHakedis.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">Henüz hakediş kaydı bulunmuyor</p>
                <p className="text-xs text-muted-foreground mt-1">
                  İşveren veya taşeron hakedişi oluşturarak başlayın
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentHakedis.map((h) => {
                  const st = STATUS_LABELS[h.status];
                  return (
                    <div
                      key={h.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/hakedis/${h.type === "ISVEREN" ? "isveren" : "taseron"}`)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${h.type === "ISVEREN" ? "bg-green-100" : "bg-orange-100"}`}>
                          {h.type === "ISVEREN" ? (
                            <Landmark className="h-4 w-4 text-green-600" />
                          ) : (
                            <Building2 className="h-4 w-4 text-orange-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            #{h.no} — {h.project.name}
                            {h.company && <span className="text-muted-foreground"> / {h.company.name}</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">{h.period}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-mono font-semibold hidden sm:inline">{formatCurrency(h.netAmount)}</span>
                        <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
