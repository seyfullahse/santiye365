"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Target,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  Phone,
  Mail,
  Calendar,
  Building2,
  UserPlus,
  Handshake,
  AlertCircle,
} from "lucide-react";

/* ═══════ TYPES ═══════ */
interface StageCount {
  stage: string;
  _count: { id: number };
  _sum: { estimatedValue: number | null };
}

interface RecentComm {
  id: string;
  type: string;
  subject: string;
  contactDate: string;
  customer: { name: string };
  opportunity: { title: string } | null;
}

interface TopCustomer {
  id: string;
  name: string;
  _count: { opportunities: number; projects: number };
}

interface FollowUp {
  id: string;
  subject: string;
  nextFollowUp: string;
  customer: { id: string; name: string };
}

interface DashboardData {
  totalCustomers: number;
  activeCustomers: number;
  totalOpportunities: number;
  opportunitiesByStage: StageCount[];
  recentCommunications: RecentComm[];
  topCustomers: TopCustomer[];
  pipelineValue: number;
  upcomingFollowUps: FollowUp[];
}

const stageLabels: Record<string, string> = {
  LEAD: "İlk Temas",
  NEEDS_ANALYSIS: "İhtiyaç Analizi",
  PROPOSAL_SENT: "Teklif Gönderildi",
  NEGOTIATION: "Müzakere",
  WON: "Kazanıldı",
  LOST: "Kaybedildi",
};

const stageColors: Record<string, string> = {
  LEAD: "bg-blue-500",
  NEEDS_ANALYSIS: "bg-yellow-500",
  PROPOSAL_SENT: "bg-purple-500",
  NEGOTIATION: "bg-orange-500",
  WON: "bg-green-500",
  LOST: "bg-red-500",
};

const commTypeIcons: Record<string, typeof Phone> = {
  PHONE: Phone,
  EMAIL: Mail,
  MEETING: Users,
  VISIT: Building2,
  NOTE: MessageSquare,
};

const commTypeLabels: Record<string, string> = {
  PHONE: "Telefon",
  EMAIL: "E-posta",
  MEETING: "Toplantı",
  VISIT: "Ziyaret",
  NOTE: "Not",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function CRMDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/crm/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">CRM & Müşteri Yönetimi</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 animate-pulse bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const stageData = data.opportunitiesByStage ?? [];
  const wonCount = stageData.find((s) => s.stage === "WON")?._count.id || 0;
  const lostCount = stageData.find((s) => s.stage === "LOST")?._count.id || 0;
  const activeOpps = (data.totalOpportunities || 0) - wonCount - lostCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CRM & Müşteri Yönetimi</h1>
          <p className="text-muted-foreground">
            Müşteri ilişkileri ve fırsat takibi
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Toplam Müşteri</p>
                <p className="text-3xl font-bold">{data.totalCustomers}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.activeCustomers} aktif
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aktif Fırsatlar</p>
                <p className="text-3xl font-bold">{activeOpps}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.totalOpportunities} toplam
                </p>
              </div>
              <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900/30">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pipeline Değeri</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(Number(data.pipelineValue))}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Kaybedilen hariç
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Kazanılan</p>
                <p className="text-3xl font-bold">{wonCount}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  fırsat
                </p>
              </div>
              <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/30">
                <Handshake className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Stages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fırsat Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          {stageData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Henüz fırsat kaydı bulunmuyor.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.keys(stageLabels).map((stage) => {
                const found = stageData.find((s) => s.stage === stage);
                const count = found?._count.id || 0;
                const value = found?._sum.estimatedValue || 0;
                return (
                  <div
                    key={stage}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div className={`h-3 w-3 rounded-full ${stageColors[stage]}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{stageLabels[stage]}</p>
                      <p className="text-xs text-muted-foreground">
                        {count} fırsat · {formatCurrency(Number(value))}
                      </p>
                    </div>
                    <span className="text-lg font-bold">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4 text-right">
            <Link
              href="/crm/firsatlar"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              Tüm Fırsatlar <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Communications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Son İletişimler</CardTitle>
          </CardHeader>
          <CardContent>
            {(data.recentCommunications ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Henüz iletişim kaydı yok.
              </p>
            ) : (
              <div className="space-y-3">
                {(data.recentCommunications ?? []).map((comm) => {
                  const Icon = commTypeIcons[comm.type] || MessageSquare;
                  return (
                    <div key={comm.id} className="flex items-start gap-3 rounded-lg border p-3">
                      <div className="rounded-full bg-muted p-2">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{comm.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {comm.customer.name}
                          {comm.opportunity && ` · ${comm.opportunity.title}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant="outline" className="text-xs">
                          {commTypeLabels[comm.type] || comm.type}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(comm.contactDate)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4 text-right">
              <Link
                href="/crm/iletisim"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                Tüm İletişimler <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Follow-ups + Top Customers */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                Yaklaşan Takipler
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(data.upcomingFollowUps ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Yaklaşan takip yok.
                </p>
              ) : (
                <div className="space-y-2">
                  {(data.upcomingFollowUps ?? []).map((f) => (
                    <div key={f.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{f.subject}</p>
                        <p className="text-xs text-muted-foreground">{f.customer.name}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {formatDate(f.nextFollowUp)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Son Eklenen Müşteriler</CardTitle>
            </CardHeader>
            <CardContent>
              {(data.topCustomers ?? []).length === 0 ? (
                <div className="text-center py-6">
                  <UserPlus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Henüz müşteri yok.</p>
                  <Link
                    href="/crm/musteriler"
                    className="text-sm text-primary hover:underline mt-2 inline-block"
                  >
                    İlk müşteriyi ekle
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {(data.topCustomers ?? []).map((c) => (
                    <Link
                      key={c.id}
                      href={`/crm/musteriler`}
                      className="flex items-center gap-3 rounded-lg border p-2.5 hover:bg-accent transition-colors"
                    >
                      <div className="rounded-full bg-primary/10 p-2">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {c._count.opportunities} fırsat · {c._count.projects} proje
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              <div className="mt-4 text-right">
                <Link
                  href="/crm/musteriler"
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  Tüm Müşteriler <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
