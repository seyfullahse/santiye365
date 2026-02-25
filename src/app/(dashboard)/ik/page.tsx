"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, UserCheck, UserX, Clock, Building2, CalendarDays, Scale, TrendingUp,
  UserPlus, Briefcase, FolderOpen, ChevronRight, BarChart3,
} from "lucide-react";

interface Stats {
  totalEmployees: number;
  activeEmployees: number;
  passiveEmployees: number;
  onLeaveEmployees: number;
  departmentCount: number;
  pendingLeaves: number;
  totalLeaveRequests: number;
  disciplineCount: number;
  performanceCount: number;
  departmentDistribution: { name: string; count: number }[];
  recentHires: { id: string; firstName: string; lastName: string; hireDate: string; department: { name: string } | null; position: { name: string } | null }[];
}

/* ── Alt Modül Tanımları ── */
const subModules = [
  {
    name: "Personel Yönetimi",
    icon: UserPlus,
    href: "/ik/personel",
    color: "bg-blue-600",
    description: "Tüm personel kayıtlarını görüntüle ve yönet",
    features: ["Personel listesi", "Kişisel bilgiler", "Organizasyon", "İş bilgileri", "Acil durum", "CSV dışa aktarım"],
  },
  {
    name: "Departmanlar",
    icon: Building2,
    href: "/ik/departmanlar",
    color: "bg-purple-600",
    description: "Departman yapısı ve organizasyon şeması",
    features: ["Departman tanımlama", "Personel dağılımı", "Pozisyon sayıları"],
  },
  {
    name: "Pozisyonlar",
    icon: Briefcase,
    href: "/ik/pozisyonlar",
    color: "bg-indigo-600",
    description: "Pozisyon tanımları ve kadro yönetimi",
    features: ["Pozisyon tanımlama", "Departman bazlı", "Min/Max maaş"],
  },
  {
    name: "İzin Yönetimi",
    icon: CalendarDays,
    href: "/ik/izinler",
    color: "bg-teal-600",
    description: "İzin talepleri ve onay süreçleri",
    features: ["İzin talebi", "Onay/Red", "Bakiye takibi", "Raporlama"],
  },
  {
    name: "Özlük Dosyası",
    icon: FolderOpen,
    href: "/ik/ozluk",
    color: "bg-amber-600",
    description: "Evrak ve belge yönetimi",
    features: ["Evrak yükleme", "Süre takibi", "Belge türleri"],
  },
  {
    name: "Disiplin",
    icon: Scale,
    href: "/ik/disiplin",
    color: "bg-rose-600",
    description: "Uyarı ve disiplin kayıtları",
    features: ["Sözlü uyarı", "Yazılı uyarı", "Uzaklaştırma", "Tutanak"],
  },
  {
    name: "Performans",
    icon: TrendingUp,
    href: "/ik/performans",
    color: "bg-emerald-600",
    description: "Dönemsel performans değerlendirmeleri",
    features: ["Değerlendirme", "Puan sistemi", "Dönem takibi"],
  },
];

export default function IKDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ik/istatistikler")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const kpiCards = [
    { title: "Toplam Personel", value: stats?.totalEmployees ?? 0, icon: Users, color: "bg-blue-500" },
    { title: "Aktif", value: stats?.activeEmployees ?? 0, icon: UserCheck, color: "bg-green-500" },
    { title: "Pasif", value: stats?.passiveEmployees ?? 0, icon: UserX, color: "bg-red-500" },
    { title: "İzinli", value: stats?.onLeaveEmployees ?? 0, icon: Clock, color: "bg-orange-500" },
    { title: "Departman", value: stats?.departmentCount ?? 0, icon: Building2, color: "bg-purple-500" },
    { title: "Bekleyen İzin", value: stats?.pendingLeaves ?? 0, icon: CalendarDays, color: "bg-yellow-500" },
    { title: "Disiplin", value: stats?.disciplineCount ?? 0, icon: Scale, color: "bg-rose-500" },
    { title: "Performans", value: stats?.performanceCount ?? 0, icon: TrendingUp, color: "bg-teal-500" },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Başlık */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-sm">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">İnsan Kaynakları</h1>
            <p className="text-muted-foreground text-sm">Personel ve özlük yönetimi modülü</p>
          </div>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Alt Modüller */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">İK Modülleri</h2>
          <span className="text-xs text-muted-foreground ml-auto">{subModules.length} modül</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

      {/* Alt bilgi kartları */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Departman Dağılımı */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Departman Dağılımı</CardTitle></CardHeader>
          <CardContent>
            {!loading && stats?.departmentDistribution && stats.departmentDistribution.length > 0 ? (
              <div className="space-y-3">
                {stats.departmentDistribution.map((dept) => (
                  <div key={dept.name} className="flex items-center justify-between">
                    <span className="text-sm">{dept.name}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${stats.totalEmployees > 0 ? (dept.count / stats.totalEmployees) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{dept.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{loading ? "Yükleniyor..." : "Henüz departman tanımlanmadı"}</p>
            )}
          </CardContent>
        </Card>

        {/* Son İşe Alımlar */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Son İşe Alımlar</CardTitle></CardHeader>
          <CardContent>
            {!loading && stats?.recentHires && stats.recentHires.length > 0 ? (
              <div className="space-y-3">
                {stats.recentHires.map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{emp.firstName} {emp.lastName}</p>
                      <p className="text-xs text-muted-foreground">
                        {emp.department?.name} {emp.position?.name ? `• ${emp.position.name}` : ""}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {emp.hireDate ? new Date(emp.hireDate).toLocaleDateString("tr-TR") : "-"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{loading ? "Yükleniyor..." : "Henüz personel kaydı yok"}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
