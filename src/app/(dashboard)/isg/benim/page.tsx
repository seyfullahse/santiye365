"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield, GraduationCap, HardHat, CheckCircle2, Clock, XCircle,
  AlertTriangle, Loader2, User, Briefcase, Building2,
} from "lucide-react";
import { toast } from "sonner";

interface ISGData {
  linked: boolean;
  message?: string;
  employee: {
    firstName: string;
    lastName: string;
    collarType: string | null;
    department: string | null;
    position: string | null;
  };
  complianceScore: number;
  trainings: {
    completedCount: number;
    plannedCount: number;
    expiredCount: number;
    missingMandatoryCount: number;
    mandatoryTotal: number;
    missingMandatory: { id: string; name: string; category: string }[];
    expiring: { name: string; expiryDate: string }[];
  };
  ppe: {
    activeCount: number;
    expiredCount: number;
    expiringCount: number;
    items: { name: string; category: string | null; expiryDate: string | null; isExpired: boolean }[];
  };
}

const categoryMap: Record<string, string> = {
  ISG: "İSG Genel",
  TECHNICAL: "Teknik",
  PROFESSIONAL: "Mesleki",
  ORIENTATION: "Oryantasyon",
};

export default function BenimISGPage() {
  const [data, setData] = useState<ISGData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/isg/benim")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => toast.error("Veri alınamadı"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Yükleniyor...</span>
      </div>
    );
  }

  if (!data?.linked) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" /> İSG Bilgilerim
        </h1>
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Hesabınıza bağlı çalışan kaydı bulunamadı</p>
            <p className="text-sm text-muted-foreground mt-1">İSG bilgilerinizi görmek için hesabınızın bir çalışan kaydına bağlanması gerekmektedir.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const score = data.complianceScore;
  const scoreColor = score === 100 ? "text-green-600" : score >= 50 ? "text-amber-600" : "text-red-600";
  const progressColor = score === 100 ? "[&>div]:bg-green-500" : score >= 50 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500";
  const emp = data.employee;

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" /> İSG Bilgilerim
        </h1>
        <p className="text-muted-foreground">Kişisel iş sağlığı ve güvenliği durumunuz</p>
      </div>

      {/* Profil + Uyum Kartı */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Profil bilgileri */}
            <div className="flex items-center gap-4 flex-1">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl">
                {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-bold">{emp.firstName} {emp.lastName}</h2>
                <div className="flex flex-wrap gap-2 mt-1">
                  {emp.department && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" />{emp.department}
                    </span>
                  )}
                  {emp.position && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Briefcase className="h-3 w-3" />{emp.position}
                    </span>
                  )}
                  {emp.collarType && (
                    <Badge variant="outline" className={
                      emp.collarType === "BLUE"
                        ? "text-[10px] px-1.5 py-0 border-blue-300 text-blue-700 bg-blue-50"
                        : "text-[10px] px-1.5 py-0 border-gray-300 text-gray-600 bg-gray-50"
                    }>
                      {emp.collarType === "BLUE" ? "Mavi Yaka" : "Beyaz Yaka"}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Uyum Skoru */}
            <div className="flex flex-col items-center gap-2 min-w-[140px]">
              <span className="text-xs font-medium text-muted-foreground">İSG Uyum Skoru</span>
              <span className={`text-4xl font-bold ${scoreColor}`}>%{score}</span>
              <Progress value={score} className={`h-2 w-32 ${progressColor}`} />
              <span className="text-[11px] text-muted-foreground">
                {data.trainings.mandatoryTotal - data.trainings.missingMandatoryCount} / {data.trainings.mandatoryTotal} zorunlu eğitim
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-green-100 dark:bg-green-950/40">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.trainings.completedCount}</p>
              <p className="text-xs text-muted-foreground">Tamamlanan Eğitim</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-950/40">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.trainings.plannedCount}</p>
              <p className="text-xs text-muted-foreground">Planlanan Eğitim</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-100 dark:bg-red-950/40">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.trainings.missingMandatoryCount}</p>
              <p className="text-xs text-muted-foreground">Eksik Zorunlu</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/40">
              <HardHat className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.ppe.activeCount}</p>
              <p className="text-xs text-muted-foreground">Aktif KKD Zimmet</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Eksik Zorunlu Eğitimler */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <XCircle className="h-4 w-4 text-red-500" />
              Eksik Zorunlu Eğitimler
              {data.trainings.missingMandatoryCount > 0 && (
                <Badge variant="destructive" className="ml-auto">{data.trainings.missingMandatoryCount}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.trainings.missingMandatory.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="h-10 w-10 mx-auto text-green-500 mb-2" />
                <p className="text-sm font-medium text-green-700">Tüm zorunlu eğitimleriniz tamamlanmış!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.trainings.missingMandatory.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-lg border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20 px-3 py-2.5">
                    <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <p className="text-[11px] text-muted-foreground">{categoryMap[m.category] || m.category}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-red-200 text-red-700 flex-shrink-0">Eksik</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* KKD Zimmetleri */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <HardHat className="h-4 w-4 text-indigo-500" />
              KKD Zimmetlerim
              {data.ppe.activeCount > 0 && (
                <Badge variant="secondary" className="ml-auto">{data.ppe.activeCount}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.ppe.items.length === 0 ? (
              <div className="text-center py-6">
                <HardHat className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Henüz KKD zimmet kaydı bulunmuyor</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.ppe.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.isExpired ? "bg-red-500" : "bg-green-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      {item.category && <p className="text-[11px] text-muted-foreground">{item.category}</p>}
                    </div>
                    {item.expiryDate ? (
                      <span className={`text-[11px] flex-shrink-0 ${item.isExpired ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                        {item.isExpired ? "Süresi Dolmuş" : `Son: ${new Date(item.expiryDate).toLocaleDateString("tr-TR")}`}
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">Süresiz</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {data.ppe.expiredCount > 0 && (
              <div className="mt-3 p-2 rounded bg-red-50 dark:bg-red-950/30 text-center">
                <span className="text-xs text-red-600 font-medium">
                  ⚠ {data.ppe.expiredCount} adet KKD&apos;nin süresi dolmuş
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Süresi Yaklaşan Eğitimler */}
      {data.trainings.expiring.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Süresi Yaklaşan Eğitimler
              <Badge variant="outline" className="ml-auto border-amber-200 text-amber-700">{data.trainings.expiring.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.trainings.expiring.map((t, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/20 px-3 py-2.5">
                  <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <p className="text-sm font-medium flex-1 truncate">{t.name}</p>
                  <span className="text-xs text-amber-700 font-medium flex-shrink-0">
                    {new Date(t.expiryDate).toLocaleDateString("tr-TR")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
