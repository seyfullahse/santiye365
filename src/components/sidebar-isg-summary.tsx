"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Shield, GraduationCap, HardHat, AlertTriangle, CheckCircle2,
  XCircle, Clock, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ISGSummary {
  linked: boolean;
  complianceScore: number;
  employee: {
    firstName: string;
    lastName: string;
    collarType: string | null;
    department: string | null;
    position: string | null;
  };
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

export function SidebarISGSummary() {
  const { data: session } = useSession();
  const [data, setData] = useState<ISGSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/isg/benim")
      .then((r) => r.json())
      .then((d) => { if (d.linked) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  if (loading || !data) return null;

  const score = data.complianceScore;
  const scoreColor = score === 100 ? "text-green-600" : score >= 50 ? "text-amber-600" : "text-red-600";
  const scoreBg = score === 100 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
  const hasMissing = data.trainings.missingMandatoryCount > 0;
  const hasExpiring = data.trainings.expiring.length > 0 || data.ppe.expiringCount > 0;
  const hasExpired = data.trainings.expiredCount > 0 || data.ppe.expiredCount > 0;

  return (
    <div>
      {/* Kompakt Özet Bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-full rounded-lg border px-3 py-2 text-left transition-colors hover:bg-accent/50",
          hasMissing ? "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30"
            : hasExpired ? "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30"
            : "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className={cn("h-3.5 w-3.5", scoreColor)} />
            <span className="text-xs font-semibold">İSG Durumum</span>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Uyum skoru bar */}
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", scoreBg)} style={{ width: `${score}%` }} />
              </div>
              <span className={cn("text-[10px] font-bold", scoreColor)}>%{score}</span>
            </div>
            {/* İkon göstergeleri */}
            {hasMissing && (
              <span className="flex items-center gap-0.5 text-red-600">
                <XCircle className="h-3 w-3" />
                <span className="text-[10px] font-bold">{data.trainings.missingMandatoryCount}</span>
              </span>
            )}
            {hasExpiring && (
              <span className="flex items-center gap-0.5 text-amber-600">
                <Clock className="h-3 w-3" />
              </span>
            )}
            {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
          </div>
        </div>
      </button>

      {/* Genişletilmiş Detay */}
      {expanded && (
        <div className="mt-1 rounded-lg border bg-card p-3 space-y-3 text-xs">
          {/* Eğitim Durumu */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <GraduationCap className="h-3 w-3 text-blue-600" />
              <span className="font-semibold text-foreground">Eğitimlerim</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="flex items-center gap-1.5 rounded bg-green-50 dark:bg-green-950/30 px-2 py-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                <span className="text-muted-foreground">Tamamlanan</span>
                <span className="ml-auto font-bold text-green-700">{data.trainings.completedCount}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded bg-amber-50 dark:bg-amber-950/30 px-2 py-1">
                <Clock className="h-3 w-3 text-amber-600" />
                <span className="text-muted-foreground">Planlanan</span>
                <span className="ml-auto font-bold text-amber-700">{data.trainings.plannedCount}</span>
              </div>
            </div>

            {/* Eksik Zorunlu Eğitimler */}
            {hasMissing && (
              <div className="mt-1.5">
                <div className="flex items-center gap-1 text-red-600 mb-1">
                  <XCircle className="h-3 w-3" />
                  <span className="font-medium">Eksik Zorunlu ({data.trainings.missingMandatoryCount}/{data.trainings.mandatoryTotal})</span>
                </div>
                <div className="space-y-0.5 ml-4">
                  {data.trainings.missingMandatory.slice(0, 4).map((m) => (
                    <div key={m.id} className="text-[11px] text-muted-foreground truncate">• {m.name}</div>
                  ))}
                  {data.trainings.missingMandatory.length > 4 && (
                    <div className="text-[11px] text-muted-foreground">+{data.trainings.missingMandatory.length - 4} daha...</div>
                  )}
                </div>
              </div>
            )}

            {/* Süresi Yaklaşanlar */}
            {data.trainings.expiring.length > 0 && (
              <div className="mt-1.5">
                <div className="flex items-center gap-1 text-amber-600 mb-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span className="font-medium">Süresi Yaklaşan</span>
                </div>
                <div className="space-y-0.5 ml-4">
                  {data.trainings.expiring.slice(0, 3).map((t, i) => (
                    <div key={i} className="text-[11px] text-muted-foreground truncate">
                      • {t.name} — <span className="text-amber-700">{new Date(t.expiryDate).toLocaleDateString("tr-TR")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* KKD Durumu */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <HardHat className="h-3 w-3 text-indigo-600" />
              <span className="font-semibold text-foreground">KKD Zimmetlerim</span>
            </div>
            {data.ppe.activeCount > 0 ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Aktif: <span className="font-bold text-foreground">{data.ppe.activeCount}</span></span>
                  {data.ppe.expiredCount > 0 && (
                    <span className="text-red-600 font-medium">Süresi Dolmuş: {data.ppe.expiredCount}</span>
                  )}
                </div>
                <div className="space-y-0.5">
                  {data.ppe.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-1 text-[11px]">
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full flex-shrink-0",
                        item.isExpired ? "bg-red-500" : "bg-green-500"
                      )} />
                      <span className="text-muted-foreground truncate">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Zimmet kaydı bulunmuyor</p>
            )}
          </div>

          {/* Detay Linki */}
          <Link
            href="/isg/personel-durum"
            className="flex items-center justify-center gap-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-medium py-1.5 transition-colors"
          >
            <Shield className="h-3 w-3" />
            Detaylı İSG Bilgilerim
          </Link>
        </div>
      )}
    </div>
  );
}
