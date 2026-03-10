"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Banknote,
  DollarSign,
  Users,
  Building2,
  ClipboardList,
  ArrowRight,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MUHASEBE_ROLES = ["SUPER_ADMIN", "ADMIN", "MUHASEBE"];

interface MuhasebeStats {
  totalWorkers: number;
  activeWorkers: number;
  ratesDefined: number;
  ratesUndefined: number;
  companyCount: number;
}

export default function MuhasebePage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<MuhasebeStats | null>(null);
  const [loading, setLoading] = useState(true);

  const hasAccess = session?.user?.role && MUHASEBE_ROLES.includes(session.user.role);

  useEffect(() => {
    if (status === "loading" || !hasAccess) return;

    async function fetchStats() {
      try {
        const res = await fetch("/api/puantaj/ucretler");
        if (!res.ok) return;
        const workers = await res.json();

        const companies = new Set(workers.map((w: any) => w.team?.company?.id)).size;
        setStats({
          totalWorkers: workers.length,
          activeWorkers: workers.length,
          ratesDefined: workers.filter((w: any) => w.dailyRate !== null).length,
          ratesUndefined: workers.filter((w: any) => w.dailyRate === null).length,
          companyCount: companies,
        });
      } catch (err) {
        console.error("Muhasebe verileri alınamadı:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [status, hasAccess]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Banknote className="h-6 w-6 text-green-600" />
          Muhasebe Modülü
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Çalışan ücret yönetimi ve maliyet raporları
        </p>
      </div>

      {/* Özet Kartları */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                Aktif Çalışan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeWorkers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                Firma Sayısı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.companyCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Ücreti Belirlenen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.ratesDefined}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Ücreti Belirlenmemiş
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{stats.ratesUndefined}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hızlı Erişim Kartları */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-5 w-5 text-green-600" />
              Çalışan Ücretleri
            </CardTitle>
            <CardDescription>
              Birim fiyat ve mesai ücreti tanımlama. Çalışan bazlı veya toplu güncelleme yapabilirsiniz.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/muhasebe/ucretler">
              <Button size="sm">
                Ücretlere Git
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-5 w-5 text-teal-600" />
              Puantaj Maliyet Raporu
            </CardTitle>
            <CardDescription>
              Puantaj verilerini ücretlerle birleştiren maliyet raporu. Firma ve çalışan bazlı maliyet analizi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/muhasebe/puantaj-rapor">
              <Button size="sm" variant="outline">
                Rapora Git
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
