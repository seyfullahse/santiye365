"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  Layers,
  Activity,
  Package,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProject } from "./layout";

interface ProjectStats {
  zones: number;
  floors: number;
  activities: number;
  completedActivities: number;
  pendingApprovals: number;
  openRisks: number;
  totalProgress: number;
  materials: number;
}

const sections = [
  {
    key: "dashboard",
    name: "Gösterge Paneli",
    description: "Proje ilerleme grafikleri ve detaylı analiz",
    icon: LayoutDashboard,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  {
    key: "mahaller",
    name: "Mahaller",
    description: "Proje mahallerini görüntüle ve yönet",
    icon: MapPin,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
  },
  {
    key: "katlar",
    name: "Katlar",
    description: "Kat tanımları ve sıralama",
    icon: Layers,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  {
    key: "aktiviteler",
    name: "Aktiviteler",
    description: "İş kalemleri, ilerleme takibi ve planlar",
    icon: Activity,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-200 dark:border-orange-800",
  },
  {
    key: "malzemeler",
    name: "Malzeme Takip",
    description: "Malzeme sipariş ve teslimat durumları",
    icon: Package,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
    borderColor: "border-cyan-200 dark:border-cyan-800",
  },
  {
    key: "onaylar",
    name: "Onaylar",
    description: "Bekleyen onay süreçleri",
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
  },
  {
    key: "riskler",
    name: "Riskler",
    description: "Risk analizi ve takip",
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
  },
];

export default function ProjectOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const project = useProject();
  const projectId = params.id as string;
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch(`/api/projeler/${projectId}/ozet`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // Stats opsiyonel, hata sessizce yok sayılsın
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [projectId]);

  return (
    <div className="space-y-6">
      {/* Özet Kartları */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-4 w-20 bg-muted rounded animate-pulse mb-2" />
                <div className="h-8 w-12 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <p className="text-xs sm:text-sm text-muted-foreground">Genel İlerleme</p>
              </div>
              <p className="text-xl sm:text-2xl font-bold mt-1">%{stats.totalProgress}</p>
              <div className="h-1.5 w-full rounded-full bg-muted mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${Math.min(stats.totalProgress, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-500" />
                <p className="text-xs sm:text-sm text-muted-foreground">Mahaller</p>
              </div>
              <p className="text-xl sm:text-2xl font-bold mt-1">{stats.zones}</p>
              <p className="text-xs text-muted-foreground">{stats.floors} kat</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-500" />
                <p className="text-xs sm:text-sm text-muted-foreground">Aktiviteler</p>
              </div>
              <p className="text-xl sm:text-2xl font-bold mt-1">{stats.activities}</p>
              <p className="text-xs text-muted-foreground">{stats.completedActivities} tamamlandı</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <p className="text-xs sm:text-sm text-muted-foreground">Açık Riskler</p>
              </div>
              <p className="text-xl sm:text-2xl font-bold mt-1">{stats.openRisks}</p>
              <p className="text-xs text-muted-foreground">{stats.pendingApprovals} bekleyen onay</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Navigasyon Kartları */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Proje Modülleri</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sections.map((section) => (
            <Card
              key={section.key}
              className={`group cursor-pointer hover:shadow-md transition-all duration-200 border ${section.borderColor}`}
              onClick={() => router.push(`/projeler/${projectId}/${section.key}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className={`h-10 w-10 rounded-lg ${section.bgColor} flex items-center justify-center`}>
                    <section.icon className={`h-5 w-5 ${section.color}`} />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardTitle className="text-base mb-1">{section.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{section.description}</p>
                {/* Alt bilgi */}
                {stats && (
                  <div className="mt-3 pt-2 border-t text-xs text-muted-foreground">
                    {section.key === "mahaller" && `${stats.zones} mahal`}
                    {section.key === "katlar" && `${stats.floors} kat`}
                    {section.key === "aktiviteler" && `${stats.activities} aktivite`}
                    {section.key === "onaylar" && `${stats.pendingApprovals} bekleyen`}
                    {section.key === "riskler" && `${stats.openRisks} açık risk`}
                    {section.key === "malzemeler" && `${stats.materials} kayıt`}
                    {section.key === "dashboard" && `%${stats.totalProgress} ilerleme`}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
