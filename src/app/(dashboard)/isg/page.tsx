"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap, Award, Stethoscope, HardHat, Siren, AlertTriangle,
  Shield, ChevronRight, BarChart3,
} from "lucide-react";

interface Stats {
  trainings: { total: number; completed: number; expired: number; planned: number };
  certificates: { total: number; valid: number; expired: number };
  exams: { total: number; pending: number };
  ppe: { total: number; assigned: number };
  accidents: { total: number; open: number };
  upcomingExams: Array<{ employee: { firstName: string; lastName: string }; nextExamDate: string }>;
  upcomingCertExpiry: Array<{ employee: { firstName: string; lastName: string }; expiryDate: string; name: string }>;
  recentAccidents: Array<{ date: string; location: string; severity: string }>;
}

/* ── Alt Modül Tanımları ── */
const subModules = [
  {
    name: "Eğitimler",
    icon: GraduationCap,
    href: "/isg/egitimler",
    color: "bg-blue-600",
    description: "İSG eğitim planlaması ve takibi",
    features: ["Oryantasyon", "Güvenlik", "İlk yardım", "Yangın", "Yüksekte çalışma", "Puan takibi"],
  },
  {
    name: "Sertifikalar",
    icon: Award,
    href: "/isg/sertifikalar",
    color: "bg-green-600",
    description: "Yetki belgeleri ve sertifika yönetimi",
    features: ["Sertifika kaydı", "Süre takibi", "Veren kurum", "Yenileme uyarısı"],
  },
  {
    name: "Periyodik Muayene",
    icon: Stethoscope,
    href: "/isg/muayeneler",
    color: "bg-purple-600",
    description: "Sağlık kontrolleri ve muayene takibi",
    features: ["İşe giriş", "Periyodik", "İşten çıkış", "Sonuç takibi", "Sonraki muayene"],
  },
  {
    name: "KKD Takibi",
    icon: HardHat,
    href: "/isg/kkd",
    color: "bg-orange-600",
    description: "Kişisel koruyucu donanım zimmet yönetimi",
    features: ["Zimmetleme", "İade takibi", "KKD türleri", "Durum kontrolü"],
  },
  {
    name: "İş Kazaları",
    icon: Siren,
    href: "/isg/kazalar",
    color: "bg-red-600",
    description: "Kaza bildirimi ve istatistikleri",
    features: ["Kaza bildirimi", "Ciddiyet seviyesi", "İlgili personel", "Kayıp gün", "Proje bazlı"],
  },
];

export default function ISGDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/isg/istatistikler").then((r) => r.json()).then(setStats).finally(() => setLoading(false));
  }, []);

  const kpiCards = [
    { title: "Toplam Eğitim", value: stats?.trainings?.total ?? 0, sub: `${stats?.trainings?.completed ?? 0} tamamlandı`, icon: GraduationCap, color: "bg-blue-500" },
    { title: "Sertifikalar", value: stats?.certificates?.total ?? 0, sub: `${stats?.certificates?.valid ?? 0} geçerli`, icon: Award, color: "bg-green-500" },
    { title: "Sağlık Muayeneleri", value: stats?.exams?.total ?? 0, sub: `${stats?.exams?.pending ?? 0} bekliyor`, icon: Stethoscope, color: "bg-purple-500" },
    { title: "KKD Zimmetleri", value: stats?.ppe?.total ?? 0, sub: `${stats?.ppe?.assigned ?? 0} aktif zimmet`, icon: HardHat, color: "bg-orange-500" },
    { title: "İş Kazaları", value: stats?.accidents?.total ?? 0, sub: `${stats?.accidents?.open ?? 0} açık`, icon: Siren, color: "bg-red-500" },
    { title: "Yaklaşan Uyarı", value: (stats?.upcomingExams?.length ?? 0) + (stats?.upcomingCertExpiry?.length ?? 0), sub: "Muayene + Sertifika", icon: AlertTriangle, color: "bg-yellow-500" },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Başlık */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">İş Sağlığı & Güvenliği</h1>
            <p className="text-muted-foreground text-sm">İSG eğitim, muayene ve güvenlik modülü</p>
          </div>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.color} text-white shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{loading ? "–" : card.value}</p>
                    <p className="text-xs text-muted-foreground">{card.title}</p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 ml-[52px]">{card.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Alt Modüller */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">İSG Modülleri</h2>
          <span className="text-xs text-muted-foreground ml-auto">{subModules.length} modül</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {subModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link key={mod.name} href={mod.href} className="block group">
                <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.01]">
                  <CardContent className="pt-5 pb-4 px-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${mod.color} text-white shadow-sm`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
                        AKTİF
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{mod.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">{mod.description}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {mod.features.map((f) => (
                        <span key={f} className="inline-block px-1.5 py-0.5 rounded text-[9px] bg-muted text-muted-foreground font-medium">{f}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground/60 group-hover:text-primary transition-colors pt-1 border-t">
                      Modüle Git <ChevronRight className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Yaklaşan Uyarılar */}
      {!loading && ((stats?.upcomingCertExpiry?.length ?? 0) > 0 || (stats?.upcomingExams?.length ?? 0) > 0) && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-yellow-600" />Yaklaşan Uyarılar</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.upcomingCertExpiry?.map((c, i) => (
                <div key={`cert-${i}`} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="default">Sertifika</Badge>
                    <span className="text-sm">{c.employee.firstName} {c.employee.lastName} — {c.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(c.expiryDate).toLocaleDateString("tr-TR")}</span>
                </div>
              ))}
              {stats?.upcomingExams?.map((e, i) => (
                <div key={`exam-${i}`} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">Muayene</Badge>
                    <span className="text-sm">{e.employee.firstName} {e.employee.lastName}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(e.nextExamDate).toLocaleDateString("tr-TR")}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* İstatistik kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Sertifika Durumu</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between"><span className="text-sm">Geçerli</span><Badge variant="default">{stats?.certificates?.valid ?? 0}</Badge></div>
            <div className="flex justify-between"><span className="text-sm">Süresi Dolan</span><Badge variant="destructive">{stats?.certificates?.expired ?? 0}</Badge></div>
            <div className="flex justify-between"><span className="text-sm">Toplam</span><Badge variant="secondary">{stats?.certificates?.total ?? 0}</Badge></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Kaza İstatistikleri</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between"><span className="text-sm">Toplam</span><Badge variant="secondary">{stats?.accidents?.total ?? 0}</Badge></div>
            <div className="flex justify-between"><span className="text-sm">Açık</span><Badge variant="default">{stats?.accidents?.open ?? 0}</Badge></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
