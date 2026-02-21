"use client";

import {
  useCallback,
} from "react";

import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Users,
  Target,
  Clock,
  Activity,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { useRouter } from "next/navigation";

interface DashboardData {
  project: {
    id: string;
    name: string;
    client: string | null;
    startDate: string | null;
    endDate: string | null;
    status: string;
  };
  projects: { id: string; name: string; status: string }[];
  totalProgress: number;
  plannedProgress: number;
  deviation: number;
  criticalCount: number;
  pendingApprovals: number;
  todayWorkforce: number;
  topRisks: {
    id: string;
    title: string;
    impact: number;
    probability: number;
    score: number;
    responsible: string | null;
    activityName: string | null;
  }[];
  approvalList: {
    id: string;
    title: string;
    waitingOn: string | null;
    waitingDays: number;
    impactType: string;
    activityName: string;
  }[];
  disciplineData: { name: string; progress: number }[];
  lookahead: {
    id: string;
    name: string;
    discipline: string;
    zone: string;
    floor: string;
    plannedFinish: string | null;
    progressPercent: number;
    isCritical: boolean;
  }[];
  criticalActivities: {
    id: string;
    name: string;
    discipline: string;
    zone: string;
    floor: string;
    weight: number;
    progressPercent: number;
    plannedStart: string | null;
    plannedFinish: string | null;
    status: string;
  }[];
  workforceTrend: { date: string; count: number }[];
}

const disciplineChartConfig = {
  progress: {
    label: "İlerleme %",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const workforceChartConfig = {
  count: {
    label: "Personel",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function DashboardClient({ data }: { data: DashboardData }) {
  const router = useRouter();





  const handlePrint = useCallback(() => {
    if (typeof window === "undefined") return;
    window.print();
  }, []);

  const handleProjectChange = (projectId: string) => {
    router.push(`/dashboard?project=${projectId}`);
  };

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Başlık */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Gösterge Paneli</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {data.project.name}
            {data.project.client && ` — ${data.project.client}`}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            defaultValue={data.project.id}
            onValueChange={handleProjectChange}
          >
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Proje seçin" />
            </SelectTrigger>
            <SelectContent>
              {data.projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handlePrint} className="print-hidden">
            PDF Çıktısı
          </Button>
        </div>
      </div>

      {/* ÜST KARTLAR */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Genel İlerleme */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Genel İlerleme
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">%{data.totalProgress}</div>
            <div className="mt-2 h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(data.totalProgress, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Plan İlerleme */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Plan İlerleme
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">%{data.plannedProgress}</div>
            <div className="mt-2 h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-blue-500 transition-all"
                style={{ width: `${Math.min(data.plannedProgress, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sapma */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sapma</CardTitle>
            {data.deviation >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                data.deviation >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {data.deviation >= 0 ? "+" : ""}
              {data.deviation}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.deviation >= 0
                ? "Plana göre ilerde"
                : "Plana göre geride"}
            </p>
          </CardContent>
        </Card>

        {/* Kritik İş */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Kritik İş</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.criticalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Devam eden kritik aktivite
            </p>
          </CardContent>
        </Card>

        {/* Onay Bekleyen */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Onay Bekleyen
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Çözüm bekliyor
            </p>
          </CardContent>
        </Card>

        {/* Personel */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Personel</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.todayWorkforce}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Bugün sahada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* GRAFİKLER */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Disiplin Bazlı İlerleme */}
        <Card className="overflow-hidden">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Disiplin Bazlı İlerleme</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Disiplinlere göre ağırlıklı ilerleme oranları</CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            <ChartContainer config={disciplineChartConfig} className="h-[250px] sm:h-[300px] w-full">
              <BarChart data={data.disciplineData.map(d => ({ ...d, remaining: 100 - d.progress }))} layout="vertical" margin={{ left: -10, right: 40 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={65}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="progress"
                  stackId="a"
                  fill="var(--color-progress)"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="remaining"
                  stackId="a"
                  fill="transparent"
                  radius={[0, 0, 0, 0]}
                >
                  <LabelList
                    dataKey="progress"
                    position="right"
                    offset={8}
                    formatter={(value: number) => `%${value}`}
                    style={{ fill: "currentColor", fontSize: 12, fontWeight: 600 }}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Personel Trend */}
        <Card className="overflow-hidden">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Personel Trend</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Son 14 günlük saha personel sayısı</CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            <ChartContainer config={workforceChartConfig} className="h-[250px] sm:h-[300px] w-full">
              <LineChart data={data.workforceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => {
                    const d = new Date(v);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                />
                <YAxis />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        const d = new Date(String(value));
                        return d.toLocaleDateString("tr-TR");
                      }}
                    />
                  }
                />
                <Line
                  type="natural"
                  dataKey="count"
                  stroke="#111827"
                  strokeWidth={2.5}
                  connectNulls
                  dot={{
                    r: 5,
                    stroke: "#ffffff",
                    strokeWidth: 1.5,
                    fill: "#111827",
                  }}
                  activeDot={{
                    r: 7,
                    stroke: "#ffffff",
                    strokeWidth: 2,
                    fill: "#111827",
                  }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Kritik İşler - Disiplin grafiği altı */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Kritik İşler
            <Badge variant="destructive">{data.criticalActivities.length}</Badge>
          </CardTitle>
          <CardDescription>
            Tamamlanmamış kritik aktiviteler
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aktivite</TableHead>
                <TableHead>Disiplin</TableHead>
                <TableHead>Mahal</TableHead>
                <TableHead>Kat</TableHead>
                <TableHead className="text-center">Ağırlık</TableHead>
                <TableHead className="text-center">İlerleme</TableHead>
                <TableHead>Plan Bitiş</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.criticalActivities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Kritik aktivite bulunmuyor
                  </TableCell>
                </TableRow>
              ) : (
                data.criticalActivities.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">
                        {item.discipline}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.zone}</TableCell>
                    <TableCell>{item.floor}</TableCell>
                    <TableCell className="text-center">{item.weight}</TableCell>
                    <TableCell className="text-center">%{item.progressPercent}</TableCell>
                    <TableCell>
                      {item.plannedFinish
                        ? new Date(item.plannedFinish).toLocaleDateString("tr-TR")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.status === "DELAYED" ? "destructive" : "secondary"}>
                        {item.status === "NOT_STARTED" ? "Başlamadı" : item.status === "IN_PROGRESS" ? "Devam Ediyor" : item.status === "DELAYED" ? "Gecikmiş" : item.status === "ON_HOLD" ? "Beklemede" : item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* LİSTELER */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top 5 Risk */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Top 5 Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Risk</TableHead>
                  <TableHead className="text-center">Skor</TableHead>
                  <TableHead>Sorumlu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topRisks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Risk kaydı bulunmuyor
                    </TableCell>
                  </TableRow>
                ) : (
                  data.topRisks.map((risk) => (
                    <TableRow key={risk.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{risk.title}</p>
                          {risk.activityName && (
                            <p className="text-xs text-muted-foreground">
                              {risk.activityName}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            risk.score >= 15
                              ? "destructive"
                              : risk.score >= 8
                              ? "default"
                              : "secondary"
                          }
                        >
                          {risk.score}
                        </Badge>
                      </TableCell>
                      <TableCell>{risk.responsible ?? "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Onay Listesi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-yellow-500" />
              Onay Bekleyenler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Kimde</TableHead>
                  <TableHead className="text-center">Gün</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.approvalList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Bekleyen onay bulunmuyor
                    </TableCell>
                  </TableRow>
                ) : (
                  data.approvalList.map((approval) => (
                    <TableRow key={approval.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{approval.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {approval.activityName}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{approval.waitingOn ?? "-"}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            approval.waitingDays > 7
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {approval.waitingDays}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* 2 HAFTALIK LOOKAHEAD */}
      <Card>
        <CardHeader>
          <CardTitle>2 Haftalık Lookahead</CardTitle>
          <CardDescription>
            Önümüzdeki 14 gün içinde bitmesi planlanan aktiviteler
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aktivite</TableHead>
                <TableHead>Disiplin</TableHead>
                <TableHead>Mahal</TableHead>
                <TableHead>Kat</TableHead>
                <TableHead className="text-center">İlerleme</TableHead>
                <TableHead>Plan Bitiş</TableHead>
                <TableHead className="text-center">Kritik</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.lookahead.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Önümüzdeki 2 hafta içinde planlanan aktivite bulunmuyor
                  </TableCell>
                </TableRow>
              ) : (
                data.lookahead.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.discipline}</Badge>
                    </TableCell>
                    <TableCell>{item.zone}</TableCell>
                    <TableCell>{item.floor}</TableCell>
                    <TableCell className="text-center">
                      %{item.progressPercent}
                    </TableCell>
                    <TableCell>
                      {item.plannedFinish
                        ? new Date(item.plannedFinish).toLocaleDateString("tr-TR")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.isCritical && (
                        <Badge variant="destructive">Kritik</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
