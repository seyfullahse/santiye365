/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { SessionProvider, signOut } from "next-auth/react";
import { useState, useMemo, useEffect } from "react";
import {
  HardHat, Bell, LogOut, User, Building2, Briefcase, MapPin, Phone, Mail,
  Clock, CheckCircle2, XCircle, AlertTriangle, Pin, Megaphone,
  Tag, Calendar, Send, Plus, CircleDot,
  Percent, Info, ClipboardList, Home, Pencil, Trash2, ChevronLeft,
  Menu, X, ShieldCheck, BookOpen, HardHat as HelmetIcon, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════ */
interface EmployeeInfo {
  id: string;
  firstName: string;
  lastName: string;
  employeeNo: string | null;
  phone: string | null;
  email: string | null;
  department: string | null;
  position: string | null;
  company: string | null;
  project: string | null;
}

interface AttendanceDay {
  date: string;
  status: string;
  totalHours: number;
  overtime: number;
  shift: string;
  note: string | null;
}

interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  status: string;
  createdAt: string;
}

interface DiscountItem {
  id: string;
  companyName: string;
  category: string;
  discountRate: number;
  description: string | null;
  logo: string | null;
  contactInfo: string | null;
  validUntil: string | null;
}

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  priority: string;
  isPinned: boolean;
  categoryName: string;
  categoryColor: string;
  authorName: string;
  publishDate: string;
  isRead: boolean;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  createdAt: string;
}

interface ISGData {
  linked: boolean;
  message?: string;
  employee?: { firstName: string; lastName: string; collarType: string | null; department: string | null; position: string | null };
  complianceScore?: number;
  trainings?: {
    completedCount: number;
    plannedCount: number;
    expiredCount: number;
    missingMandatoryCount: number;
    mandatoryTotal: number;
    missingMandatory: { id: string; name: string; category: string }[];
    expiring: { name: string; expiryDate: string }[];
  };
  ppe?: {
    activeCount: number;
    expiredCount: number;
    expiringCount: number;
    items: { name: string; category: string | null; expiryDate: string | null; isExpired: boolean }[];
  };
}

export interface PortalProps {
  userName: string;
  userEmail: string;
  userRole: string;
  employee: EmployeeInfo | null;
  employeeId: string | null;
  todayAttendance: AttendanceDay | null;
  monthlyAttendance: AttendanceDay[];
  leaveRequests: LeaveRequest[];
  discounts: DiscountItem[];
  announcements: AnnouncementItem[];
  notifications: NotificationItem[];
  projectInfo: { id: string; name: string; client: string | null; status: string } | null;
}

type PortalPage = "overview" | "attendance" | "leave" | "discounts" | "announcements" | "profile" | "isg";

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════ */
const ROLE_LABELS: Record<string, string> = {
  USER: "Çalışan", VIEWER: "İzleyici", MUHASEBE: "Muhasebe",
};

const ATT_STATUS: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  PRESENT:    { label: "Geldi",       color: "text-emerald-600", bg: "bg-emerald-500", icon: CheckCircle2 },
  HALF_DAY:   { label: "Yarım Gün",  color: "text-amber-600",   bg: "bg-amber-500",   icon: Clock },
  ABSENT:     { label: "Gelmedi",     color: "text-red-600",     bg: "bg-red-500",     icon: XCircle },
  PAID_LEAVE:      { label: "Ücretli İzin",  color: "text-blue-600",   bg: "bg-blue-500",   icon: Calendar },
  UNPAID_LEAVE:    { label: "Ücretsiz İzin", color: "text-slate-600",  bg: "bg-slate-500",  icon: Calendar },
  ANNUAL_LEAVE:    { label: "Yıllık İzin",   color: "text-cyan-600",   bg: "bg-cyan-500",   icon: Calendar },
  SICK_LEAVE:      { label: "Raporlu",        color: "text-purple-600", bg: "bg-purple-500", icon: Calendar },
  ADMINISTRATIVE_LEAVE: { label: "İdari İzin", color: "text-indigo-600", bg: "bg-indigo-500", icon: Calendar },
  DAY_OFF:         { label: "Hafta Tatili",   color: "text-gray-400",   bg: "bg-gray-400",   icon: Calendar },
  REST_DAY_WORK:   { label: "Tatil Mesaisi",  color: "text-orange-600", bg: "bg-orange-500", icon: Clock },
};

const LEAVE_TYPE: Record<string, string> = {
  ANNUAL: "Yıllık İzin", SICK: "Raporlu", MATERNITY: "Doğum İzni",
  PATERNITY: "Babalık İzni", MARRIAGE: "Evlilik İzni", BEREAVEMENT: "Ölüm İzni",
  UNPAID: "Ücretsiz İzin", COMPENSATION: "Telafi İzni", OTHER_LEAVE: "Diğer",
};

const LEAVE_STATUS: Record<string, { label: string; color: string }> = {
  PENDING:   { label: "Beklemede",  color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800" },
  APPROVED:  { label: "Onaylandı",  color: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800" },
  REJECTED:  { label: "Reddedildi", color: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800" },
  CANCELLED: { label: "İptal",      color: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700" },
};

const PRIORITY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  NORMAL:    { label: "Normal", icon: CircleDot,     color: "text-blue-500" },
  IMPORTANT: { label: "Önemli", icon: AlertTriangle,  color: "text-amber-500" },
  URGENT:    { label: "Acil",   icon: AlertTriangle,  color: "text-red-500" },
};

const NAV_ITEMS: { key: PortalPage; label: string; icon: React.ElementType }[] = [
  { key: "overview",      label: "Genel Bakış",    icon: Home },
  { key: "attendance",    label: "Puantajım",      icon: ClipboardList },
  { key: "leave",         label: "İzin Talepleri",  icon: Calendar },
  { key: "isg",           label: "İSG Bilgilerim", icon: ShieldCheck },
  { key: "discounts",     label: "İndirimler",     icon: Tag },
  { key: "announcements", label: "Duyurular",      icon: Megaphone },
  { key: "profile",       label: "Profilim",       icon: User },
];

function timeAgo(d: string) {
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60000); if (m < 1) return "Az önce"; if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60); if (h < 24) return `${h} saat önce`;
  const dy = Math.floor(h / 24); if (dy < 30) return `${dy} gün önce`;
  return new Date(d).toLocaleDateString("tr-TR");
}

function formatDate(d: string) { return new Date(d).toLocaleDateString("tr-TR"); }

/* ═══════════════════════════════════════════════════════════
   SAYFA: GENEL BAKIŞ
═══════════════════════════════════════════════════════════ */
function OverviewPage({ props, navigate }: { props: PortalProps; navigate: (p: PortalPage) => void }) {
  const { todayAttendance, announcements, notifications, projectInfo, monthlyAttendance, leaveRequests } = props;

  const att = todayAttendance ? ATT_STATUS[todayAttendance.status] ?? { label: todayAttendance.status, color: "text-muted-foreground", bg: "bg-muted", icon: Clock } : null;

  const monthSummary = useMemo(() => {
    const worked = monthlyAttendance.filter(a => ["PRESENT", "HALF_DAY", "REST_DAY_WORK"].includes(a.status)).length;
    const leave = monthlyAttendance.filter(a => a.status.includes("LEAVE") || a.status === "SICK_LEAVE").length;
    const absent = monthlyAttendance.filter(a => a.status === "ABSENT").length;
    const totalHours = monthlyAttendance.reduce((s, a) => s + a.totalHours, 0);
    const overtime = monthlyAttendance.reduce((s, a) => s + a.overtime, 0);
    return { worked, leave, absent, totalHours: Math.round(totalHours * 10) / 10, overtime: Math.round(overtime * 10) / 10 };
  }, [monthlyAttendance]);

  const pendingLeaves = leaveRequests.filter(l => l.status === "PENDING").length;

  // ISG verilerini çek
  const [isgData, setIsgData] = useState<ISGData | null>(null);
  useEffect(() => {
    fetch("/api/isg/benim").then(r => r.json()).then(d => setIsgData(d)).catch(() => {});
  }, []);

  return (
    <div className="space-y-5">
      {/* KPI Kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate("attendance")}>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{monthSummary.worked}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">Bu Ay Çalışılan Gün</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate("leave")}>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{monthSummary.leave}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">İzin Günü</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate("attendance")}>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{monthSummary.totalHours}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">Toplam Saat</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-950">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{monthSummary.overtime}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">Mesai Saati</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bugünkü durum */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Bugünkü Durum
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayAttendance && att ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-muted ${att.color}`}>
                    <att.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${att.color}`}>{att.label}</p>
                    <p className="text-xs text-muted-foreground">{todayAttendance.totalHours} saat • {todayAttendance.overtime > 0 ? `+${todayAttendance.overtime}s mesai` : "Mesai yok"}</p>
                  </div>
                </div>
                {todayAttendance.note && <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2.5">{todayAttendance.note}</p>}
              </div>
            ) : (
              <div className="py-6 text-center"><Clock className="h-9 w-9 mx-auto text-muted-foreground/30 mb-2" /><p className="text-sm text-muted-foreground">Bugün puantaj kaydı yok</p></div>
            )}

            {projectInfo && (
              <>
                <Separator className="my-3" />
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 text-violet-500" />
                  <div>
                    <p className="text-sm font-medium">{projectInfo.name}</p>
                    {projectInfo.client && <p className="text-xs text-muted-foreground">{projectInfo.client}</p>}
                  </div>
                  <Badge variant="outline" className="ml-auto text-[10px]">{projectInfo.status === "ACTIVE" ? "Aktif" : projectInfo.status}</Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* İzin talepleri özeti */}
        <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate("leave")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> İzin Talepleri
              {pendingLeaves > 0 && <Badge className="bg-amber-500 text-[10px] ml-auto">{pendingLeaves} beklemede</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaveRequests.length > 0 ? (
              <div className="space-y-2">
                {leaveRequests.slice(0, 3).map(l => {
                  const st = LEAVE_STATUS[l.status] ?? { label: l.status, color: "" };
                  return (
                    <div key={l.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium truncate">{LEAVE_TYPE[l.type] ?? l.type}</span>
                        <Badge variant="outline" className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{l.totalDays} gün</span>
                    </div>
                  );
                })}
                {leaveRequests.length > 3 && <p className="text-xs text-primary font-medium mt-1">+{leaveRequests.length - 3} daha fazla →</p>}
              </div>
            ) : (
              <div className="py-4 text-center"><Calendar className="h-8 w-8 mx-auto text-muted-foreground/30 mb-1.5" /><p className="text-xs text-muted-foreground">Henüz izin talebi yok</p></div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* İSG Uyum Özeti */}
      {isgData?.linked && (
        <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate("isg")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> İSG Durumum
              {(isgData.trainings?.missingMandatoryCount ?? 0) > 0 && (
                <Badge className="bg-red-500 text-[10px] ml-auto">{isgData.trainings?.missingMandatoryCount} eksik</Badge>
              )}
              {(isgData.trainings?.missingMandatoryCount ?? 0) === 0 && isgData.complianceScore === 100 && (
                <Badge className="bg-emerald-500 text-[10px] ml-auto">Tam Uyumlu</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Uyum skoru çubuğu */}
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  (isgData.complianceScore ?? 0) >= 80 ? "bg-emerald-100 dark:bg-emerald-950" : (isgData.complianceScore ?? 0) >= 50 ? "bg-amber-100 dark:bg-amber-950" : "bg-red-100 dark:bg-red-950"
                }`}>
                  <span className={`text-lg font-bold ${
                    (isgData.complianceScore ?? 0) >= 80 ? "text-emerald-600" : (isgData.complianceScore ?? 0) >= 50 ? "text-amber-600" : "text-red-600"
                  }`}>%{isgData.complianceScore ?? 0}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Uyum Skoru</span>
                    <span>{(isgData.trainings?.mandatoryTotal ?? 0) - (isgData.trainings?.missingMandatoryCount ?? 0)}/{isgData.trainings?.mandatoryTotal ?? 0}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${
                      (isgData.complianceScore ?? 0) >= 80 ? "bg-emerald-500" : (isgData.complianceScore ?? 0) >= 50 ? "bg-amber-500" : "bg-red-500"
                    }`} style={{ width: `${isgData.complianceScore ?? 0}%` }} />
                  </div>
                </div>
              </div>

              {/* Özet satırlar */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                  <p className="text-lg font-bold text-emerald-600">{isgData.trainings?.completedCount ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground">Eğitim</p>
                </div>
                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
                  <p className="text-lg font-bold text-red-600">{isgData.trainings?.missingMandatoryCount ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground">Eksik</p>
                </div>
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <p className="text-lg font-bold text-blue-600">{isgData.ppe?.activeCount ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground">KKD</p>
                </div>
              </div>

              {/* Eksik eğitimler (max 2 göster) */}
              {isgData.trainings && isgData.trainings.missingMandatory.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Eksik zorunlu eğitimler:
                  </p>
                  {isgData.trainings.missingMandatory.slice(0, 2).map(m => (
                    <div key={m.id} className="text-xs text-red-600/80 dark:text-red-400/80 pl-4 flex items-center gap-1.5">
                      <XCircle className="h-3 w-3 flex-shrink-0" /> {m.name}
                    </div>
                  ))}
                  {isgData.trainings.missingMandatory.length > 2 && (
                    <p className="text-xs text-primary font-medium pl-4">+{isgData.trainings.missingMandatory.length - 2} daha fazla →</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Son duyurular */}
      {announcements.length > 0 && (
        <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate("announcements")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-amber-500" /> Son Duyurular
              {announcements.filter(a => !a.isRead).length > 0 && <Badge variant="secondary" className="text-[10px] ml-auto">{announcements.filter(a => !a.isRead).length} yeni</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {announcements.slice(0, 3).map(ann => {
              const p = PRIORITY_CONFIG[ann.priority] ?? PRIORITY_CONFIG.NORMAL;
              return (
                <div key={ann.id} className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${!ann.isRead ? "bg-primary/[0.03] border-primary/20" : ""}`}>
                  {ann.isPinned ? <Pin className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" /> : <p.icon className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${p.color}`} />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{ann.title}</p>
                    <p className="text-xs text-muted-foreground">{ann.authorName} • {timeAgo(ann.publishDate)}</p>
                  </div>
                  {!ann.isRead && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Bildirimler */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /> Okunmamış Bildirimler <Badge variant="secondary" className="text-[10px]">{notifications.length}</Badge></CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {notifications.slice(0, 5).map(n => (
              <div key={n.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-accent/50 text-sm">
                <Bell className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                <div className="min-w-0"><p className="font-medium truncate">{n.title}</p><p className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</p></div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SAYFA: PUANTAJIM
═══════════════════════════════════════════════════════════ */
function AttendancePage({ attendance }: { attendance: AttendanceDay[] }) {
  const [viewMonth, setViewMonth] = useState(() => {
    const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
  });

  const calendarData = useMemo(() => {
    const [y, m] = viewMonth.split("-").map(Number);
    const firstDay = new Date(y, m - 1, 1);
    const daysInMonth = new Date(y, m, 0).getDate();
    const startDow = firstDay.getDay() || 7;

    const map = new Map<string, AttendanceDay>();
    attendance.forEach(a => { const d = a.date.split("T")[0]; map.set(d, a); });

    const weeks: (AttendanceDay | null | "empty")[][] = [];
    let week: (AttendanceDay | null | "empty")[] = Array(startDow - 1).fill("empty");

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      week.push(map.get(dateStr) ?? null);
      if (week.length === 7) { weeks.push(week); week = []; }
    }
    if (week.length > 0) { while (week.length < 7) week.push("empty"); weeks.push(week); }

    return { weeks, daysInMonth, monthLabel: firstDay.toLocaleDateString("tr-TR", { month: "long", year: "numeric" }) };
  }, [viewMonth, attendance]);

  const summary = useMemo(() => {
    const worked = attendance.filter(a => ["PRESENT", "HALF_DAY", "REST_DAY_WORK"].includes(a.status)).length;
    const leave = attendance.filter(a => a.status.includes("LEAVE") || a.status === "SICK_LEAVE").length;
    const absent = attendance.filter(a => a.status === "ABSENT").length;
    const totalH = Math.round(attendance.reduce((s, a) => s + a.totalHours, 0) * 10) / 10;
    const overtimeH = Math.round(attendance.reduce((s, a) => s + a.overtime, 0) * 10) / 10;
    return { worked, leave, absent, totalH, overtimeH };
  }, [attendance]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold capitalize">{calendarData.monthLabel}</h2>
        <Input type="month" value={viewMonth} onChange={e => setViewMonth(e.target.value)} className="w-44" />
      </div>

      {/* Özet */}
      <div className="flex flex-wrap gap-2.5 text-sm">
        <Badge variant="outline" className="gap-1.5 py-1 px-2.5 bg-emerald-50 dark:bg-emerald-950"><CheckCircle2 className="h-3 w-3 text-emerald-600" />{summary.worked} gün çalışıldı</Badge>
        <Badge variant="outline" className="gap-1.5 py-1 px-2.5 bg-blue-50 dark:bg-blue-950"><Calendar className="h-3 w-3 text-blue-600" />{summary.leave} gün izin</Badge>
        <Badge variant="outline" className="gap-1.5 py-1 px-2.5 bg-red-50 dark:bg-red-950"><XCircle className="h-3 w-3 text-red-600" />{summary.absent} gün devamsız</Badge>
        <Badge variant="outline" className="gap-1.5 py-1 px-2.5"><Clock className="h-3 w-3" />{summary.totalH}s toplam</Badge>
        {summary.overtimeH > 0 && <Badge variant="outline" className="gap-1.5 py-1 px-2.5 bg-orange-50 dark:bg-orange-950"><Clock className="h-3 w-3 text-orange-600" />{summary.overtimeH}s mesai</Badge>}
      </div>

      {/* Takvim */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-px text-center text-xs font-medium text-muted-foreground mb-1.5">
            {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map(d => <div key={d} className="py-1.5">{d}</div>)}
          </div>
          {calendarData.weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-px">
              {week.map((cell, ci) => {
                if (cell === "empty") return <div key={ci} className="h-14" />;
                if (cell === null) {
                  let count = 0;
                  for (let w2 = 0; w2 <= wi; w2++) for (let c2 = 0; c2 < (w2 === wi ? ci + 1 : 7); c2++) { if (calendarData.weeks[w2][c2] !== "empty") count++; }
                  return <div key={ci} className="h-14 rounded-lg border border-dashed border-muted-foreground/10 flex flex-col items-center justify-center"><span className="text-xs text-muted-foreground/40">{count}</span></div>;
                }
                const st = ATT_STATUS[cell.status] ?? { label: cell.status, color: "text-muted-foreground", bg: "bg-muted", icon: Clock };
                const dayNum = new Date(cell.date).getDate();
                return (
                  <div key={ci} className="h-14 rounded-lg border flex flex-col items-center justify-center gap-0.5 hover:bg-accent/30 cursor-default" title={`${st.label}${cell.totalHours > 0 ? " — " + cell.totalHours + "s" : ""}${cell.overtime > 0 ? " (+" + cell.overtime + "s mesai)" : ""}${cell.note ? "\n" + cell.note : ""}`}>
                    <span className="text-xs font-medium">{dayNum}</span>
                    <div className={`h-2.5 w-2.5 rounded-full ${st.bg}`} />
                  </div>
                );
              })}
            </div>
          ))}
          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />Geldi</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />Yarım Gün</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />Gelmedi</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" />İzin</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-500" />Raporlu</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-gray-400" />Tatil</span>
          </div>
        </CardContent>
      </Card>

      {/* Detay tablosu */}
      {attendance.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Günlük Detay</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-3">Tarih</th><th className="pb-2 pr-3">Durum</th><th className="pb-2 pr-3">Saat</th><th className="pb-2 pr-3">Mesai</th><th className="pb-2">Not</th>
                </tr></thead>
                <tbody>{attendance.map(a => {
                  const st = ATT_STATUS[a.status];
                  return (<tr key={a.date} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-medium">{formatDate(a.date)}</td>
                    <td className="py-2 pr-3"><Badge variant="outline" className={`text-[10px] ${st ? st.color : ""}`}>{st?.label ?? a.status}</Badge></td>
                    <td className="py-2 pr-3">{a.totalHours}s</td>
                    <td className="py-2 pr-3">{a.overtime > 0 ? `+${a.overtime}s` : "—"}</td>
                    <td className="py-2 text-muted-foreground text-xs">{a.note || "—"}</td>
                  </tr>);
                })}</tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SAYFA: İZİN TALEPLERİ
═══════════════════════════════════════════════════════════ */
function LeavePage({ leaves, employeeId }: { leaves: LeaveRequest[]; employeeId: string | null }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState<LeaveRequest | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState({ type: "ANNUAL", startDate: "", endDate: "", reason: "" });
  const [localLeaves, setLocalLeaves] = useState(leaves);

  const openNewDialog = () => {
    setEditingLeave(null);
    setForm({ type: "ANNUAL", startDate: "", endDate: "", reason: "" });
    setDialogOpen(true);
  };

  const openEditDialog = (l: LeaveRequest) => {
    setEditingLeave(l);
    setForm({ type: l.type, startDate: l.startDate.split("T")[0], endDate: l.endDate.split("T")[0], reason: l.reason ?? "" });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.startDate || !form.endDate) { toast.error("Başlangıç ve bitiş tarihi zorunludur"); return; }
    if (!employeeId) { toast.error("İK kaydınız bulunamadı. Yöneticinizle iletişime geçin."); return; }
    setSaving(true);
    try {
      const isEdit = !!editingLeave;
      const res = await fetch("/api/portal/izin-talebi", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { leaveId: editingLeave!.id, ...form } : { employeeId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "İşlem başarısız"); return; }
      if (isEdit) {
        toast.success("İzin talebi güncellendi");
        setLocalLeaves(prev => prev.map(l => l.id === editingLeave!.id ? data.leave : l));
      } else {
        toast.success("İzin talebi gönderildi");
        setLocalLeaves(prev => [data.leave, ...prev]);
      }
      setDialogOpen(false);
      setEditingLeave(null);
      setForm({ type: "ANNUAL", startDate: "", endDate: "", reason: "" });
    } catch { toast.error("Bir hata oluştu"); } finally { setSaving(false); }
  };

  const handleDelete = async (leaveId: string) => {
    if (!confirm("Bu izin talebini silmek istediğinize emin misiniz?")) return;
    setDeleting(leaveId);
    try {
      const res = await fetch(`/api/portal/izin-talebi?id=${leaveId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Silme işlemi başarısız"); return; }
      toast.success("İzin talebi silindi");
      setLocalLeaves(prev => prev.filter(l => l.id !== leaveId));
    } catch { toast.error("Bir hata oluştu"); } finally { setDeleting(null); }
  };

  const statusFilter = useMemo(() => {
    const pending = localLeaves.filter(l => l.status === "PENDING").length;
    return { pending, total: localLeaves.length };
  }, [localLeaves]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">İzin Taleplerim</h2>
          {statusFilter.pending > 0 && <Badge className="bg-amber-500">{statusFilter.pending} beklemede</Badge>}
        </div>
        <Button size="sm" onClick={openNewDialog} disabled={!employeeId} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Yeni Talep
        </Button>
      </div>

      {!employeeId && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
          <CardContent className="py-3 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
            <Info className="h-4 w-4 flex-shrink-0" />
            İzin talebi oluşturabilmek için İK kaydınızın sisteme bağlanması gerekiyor.
          </CardContent>
        </Card>
      )}

      {localLeaves.length > 0 ? (
        <div className="space-y-2.5">
          {localLeaves.map(l => {
            const st = LEAVE_STATUS[l.status] ?? { label: l.status, color: "" };
            const isPending = l.status === "PENDING";
            return (
              <Card key={l.id}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{LEAVE_TYPE[l.type] ?? l.type}</p>
                        <Badge variant="outline" className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(l.startDate)} — {formatDate(l.endDate)} • {l.totalDays} gün
                      </p>
                      {l.reason && <p className="text-xs text-muted-foreground mt-1">{l.reason}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isPending && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => openEditDialog(l)} title="Düzenle">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-600" onClick={() => handleDelete(l.id)} disabled={deleting === l.id} title="Sil">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      <span className="text-xs text-muted-foreground">{timeAgo(l.createdAt)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center">
          <Calendar className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">Henüz izin talebi yok</p>
        </div>
      )}

      {/* Yeni / Düzenle dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingLeave(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingLeave ? <Pencil className="h-5 w-5" /> : <Send className="h-5 w-5" />}
              {editingLeave ? "İzin Talebini Düzenle" : "Yeni İzin Talebi"}
            </DialogTitle>
            <DialogDescription>
              {editingLeave ? "Beklemedeki talebinizi güncelleyebilirsiniz." : "Talebiniz yöneticinize iletilecektir."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>İzin Türü</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(LEAVE_TYPE).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Başlangıç</Label>
                <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Bitiş</Label>
                <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Açıklama (opsiyonel)</Label>
              <Textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="İzin sebebinizi yazın..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditingLeave(null); }}>İptal</Button>
            <Button onClick={handleSubmit} disabled={saving}>{saving ? "Kaydediliyor..." : editingLeave ? "Güncelle" : "Talebi Gönder"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SAYFA: İNDİRİMLER
═══════════════════════════════════════════════════════════ */
function DiscountsPage({ discounts }: { discounts: DiscountItem[] }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");

  const categories = useMemo(() => [...new Set(discounts.map(d => d.category))].sort(), [discounts]);
  const filtered = discounts.filter(d => {
    const matchSearch = d.companyName.toLowerCase().includes(search.toLowerCase()) || (d.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "ALL" || d.category === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
        <Input placeholder="İndirim ara..." value={search} onChange={e => setSearch(e.target.value)} className="sm:w-64" />
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Kategori" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tüm Kategoriler</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} indirim</span>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(d => (
            <Card key={d.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="py-4 px-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-950 dark:to-blue-950 flex-shrink-0">
                    {d.logo ? <img src={d.logo} alt="" className="h-7 w-7 object-contain rounded" /> : <Percent className="h-5 w-5 text-violet-600" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{d.companyName}</p>
                      <Badge className="bg-emerald-500 text-white text-xs font-bold flex-shrink-0">%{d.discountRate}</Badge>
                    </div>
                    <Badge variant="outline" className="text-[10px] mt-1">{d.category}</Badge>
                    {d.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{d.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                      {d.validUntil && <span>Son: {formatDate(d.validUntil)}</span>}
                      {d.contactInfo && <span>{d.contactInfo}</span>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center"><Tag className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" /><p className="text-sm text-muted-foreground">İndirim bulunamadı</p></div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SAYFA: DUYURULAR
═══════════════════════════════════════════════════════════ */
function AnnouncementsPage({ announcements }: { announcements: AnnouncementItem[] }) {
  return (
    <div className="space-y-3">
      {announcements.length > 0 ? announcements.map(ann => {
        const p = PRIORITY_CONFIG[ann.priority] ?? PRIORITY_CONFIG.NORMAL;
        return (
          <Card key={ann.id} className={!ann.isRead ? "border-primary/20" : ""}>
            <CardContent className="py-3 px-4">
              <div className="flex items-start gap-3">
                {ann.isPinned ? <Pin className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" /> : <p.icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${p.color}`} />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{ann.title}</p>
                    {!ann.isRead && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{ann.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px]">{ann.categoryName}</Badge>
                    <span className="text-[10px] text-muted-foreground">{ann.authorName} • {timeAgo(ann.publishDate)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      }) : (
        <div className="py-12 text-center"><Megaphone className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" /><p className="text-sm text-muted-foreground">Henüz duyuru yok</p></div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SAYFA: PROFİLİM
═══════════════════════════════════════════════════════════ */
function ProfilePage({ employee, userName, userEmail, userRole, projectInfo }: { employee: EmployeeInfo | null; userName: string; userEmail: string; userRole: string; projectInfo: PortalProps["projectInfo"] }) {
  return (
    <div className="space-y-5">
      {/* Avatar kartı */}
      <Card>
        <CardContent className="pt-6 pb-5">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-20 w-20 mb-3">
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-blue-500 text-white text-2xl font-bold">
                {employee ? `${employee.firstName[0]}${employee.lastName[0]}` : userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-lg font-semibold">{employee ? `${employee.firstName} ${employee.lastName}` : userName}</h3>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
            <Badge variant="secondary" className="mt-2">{ROLE_LABELS[userRole] ?? userRole}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Çalışan bilgileri */}
      {employee ? (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Çalışan Bilgileri</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y">
              {employee.employeeNo && (
                <div className="flex items-center gap-3 py-3">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-muted-foreground w-28 flex-shrink-0">Sicil No</span>
                  <span className="text-sm font-medium">{employee.employeeNo}</span>
                </div>
              )}
              {employee.position && (
                <div className="flex items-center gap-3 py-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-muted-foreground w-28 flex-shrink-0">Pozisyon</span>
                  <span className="text-sm font-medium">{employee.position}</span>
                </div>
              )}
              {employee.department && (
                <div className="flex items-center gap-3 py-3">
                  <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-muted-foreground w-28 flex-shrink-0">Departman</span>
                  <span className="text-sm font-medium">{employee.department}</span>
                </div>
              )}
              {employee.company && (
                <div className="flex items-center gap-3 py-3">
                  <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-muted-foreground w-28 flex-shrink-0">Şirket</span>
                  <span className="text-sm font-medium">{employee.company}</span>
                </div>
              )}
              {employee.phone && (
                <div className="flex items-center gap-3 py-3">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-muted-foreground w-28 flex-shrink-0">Telefon</span>
                  <span className="text-sm font-medium">{employee.phone}</span>
                </div>
              )}
              {employee.email && (
                <div className="flex items-center gap-3 py-3">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-muted-foreground w-28 flex-shrink-0">E-posta</span>
                  <span className="text-sm font-medium">{employee.email}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
          <CardContent className="py-4 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
            <Info className="h-4 w-4 flex-shrink-0" />
            İK kaydınız henüz sisteme bağlanmamış. Yöneticinize başvurun.
          </CardContent>
        </Card>
      )}

      {/* Proje bilgisi */}
      {projectInfo && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Proje Bilgisi</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950">
                <MapPin className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-semibold">{projectInfo.name}</p>
                {projectInfo.client && <p className="text-xs text-muted-foreground">{projectInfo.client}</p>}
              </div>
              <Badge variant="outline" className="ml-auto">{projectInfo.status === "ACTIVE" ? "Aktif" : projectInfo.status}</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SAYFA: İSG BİLGİLERİM
═══════════════════════════════════════════════════════════ */
function ISGPage() {
  const [data, setData] = useState<ISGData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/isg/benim")
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || !data.linked) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
        <CardContent className="py-6 flex items-center gap-3 text-sm text-amber-700 dark:text-amber-400">
          <Info className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium">İSG bilgileriniz görüntülenemiyor</p>
            <p className="text-xs mt-0.5">Çalışan kaydınız henüz sisteme bağlanmamış. Yöneticinize başvurun.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { complianceScore = 0, trainings, ppe } = data;
  const scoreColor = complianceScore >= 80 ? "text-emerald-600" : complianceScore >= 50 ? "text-amber-600" : "text-red-600";
  const scoreBg = complianceScore >= 80 ? "bg-emerald-500" : complianceScore >= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="space-y-5">
      {/* KPI kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2.5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${complianceScore >= 80 ? "bg-emerald-100 dark:bg-emerald-950" : complianceScore >= 50 ? "bg-amber-100 dark:bg-amber-950" : "bg-red-100 dark:bg-red-950"}`}>
                <ShieldCheck className={`h-5 w-5 ${scoreColor}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${scoreColor}`}>%{complianceScore}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">Uyum Skoru</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950">
                <BookOpen className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{trainings?.completedCount ?? 0}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">Tamamlanan Eğitim</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{trainings?.missingMandatoryCount ?? 0}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">Eksik Eğitim</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950">
                <HelmetIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{ppe?.activeCount ?? 0}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">Aktif KKD</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Uyum skoru çubuğu */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> İSG Uyum Durumu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Zorunlu eğitim tamamlanma oranı</span>
              <span className={`font-bold ${scoreColor}`}>%{complianceScore}</span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${scoreBg}`} style={{ width: `${complianceScore}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">
              {trainings?.mandatoryTotal ?? 0} zorunlu eğitimden {(trainings?.mandatoryTotal ?? 0) - (trainings?.missingMandatoryCount ?? 0)} tanesi tamamlandı
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Eksik zorunlu eğitimler */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" /> Eksik Zorunlu Eğitimler
              {(trainings?.missingMandatoryCount ?? 0) > 0 && (
                <Badge className="bg-red-500 text-[10px] ml-auto">{trainings?.missingMandatoryCount}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trainings && trainings.missingMandatory.length > 0 ? (
              <div className="space-y-2">
                {trainings.missingMandatory.map(m => (
                  <div key={m.id} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800">
                    <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-red-700 dark:text-red-400 truncate">{m.name}</p>
                      <p className="text-[11px] text-red-600/70 dark:text-red-400/60">{m.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <CheckCircle2 className="h-9 w-9 mx-auto text-emerald-500/40 mb-2" />
                <p className="text-sm text-muted-foreground">Tüm zorunlu eğitimler tamamlandı</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* KKD Durumu */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <HelmetIcon className="h-4 w-4 text-blue-500" /> KKD Zimmetlerim
              {(ppe?.expiredCount ?? 0) > 0 && (
                <Badge className="bg-red-500 text-[10px] ml-auto">{ppe?.expiredCount} süresi dolmuş</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ppe && ppe.items.length > 0 ? (
              <div className="space-y-2">
                {ppe.items.map((item, i) => (
                  <div key={i} className={`flex items-center justify-between p-2.5 rounded-lg border ${item.isExpired ? "border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800" : "border-border"}`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <HelmetIcon className={`h-4 w-4 flex-shrink-0 ${item.isExpired ? "text-red-500" : "text-blue-500"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        {item.category && <p className="text-[11px] text-muted-foreground">{item.category}</p>}
                      </div>
                    </div>
                    {item.expiryDate && (
                      <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${item.isExpired ? "border-red-300 text-red-600 dark:text-red-400" : ""}`}>
                        {item.isExpired ? "Süresi dolmuş" : new Date(item.expiryDate).toLocaleDateString("tr-TR")}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <HelmetIcon className="h-9 w-9 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">KKD zimmet kaydı bulunamadı</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Yaklaşan süreler */}
      {trainings && trainings.expiring.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" /> Süresi Yaklaşan Eğitimler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {trainings.expiring.map((t, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">{t.name}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-600 dark:text-amber-400">
                    {new Date(t.expiryDate).toLocaleDateString("tr-TR")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Eğitim Özeti */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" /> Eğitim Özeti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
              <p className="text-xl font-bold text-emerald-600">{trainings?.completedCount ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">Tamamlandı</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <p className="text-xl font-bold text-blue-600">{trainings?.plannedCount ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">Planlandı</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
              <p className="text-xl font-bold text-red-600">{trainings?.expiredCount ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">Süresi Dolmuş</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PORTAL LAYOUT — Sidebar + Content
═══════════════════════════════════════════════════════════ */
function PortalContent(props: PortalProps) {
  const { userName, userRole, employee, notifications, leaveRequests, announcements } = props;
  const [currentPage, setCurrentPage] = useState<PortalPage>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sunucu ve istemci saatleri farklı olabileceğinden hydration uyuşmazlığını önlemek için
  // saate bağlı değerler yalnızca mount sonrası (istemci tarafında) hesaplanır.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
  }, []);
  const greeting = now
    ? (() => {
        const h = now.getHours();
        return h < 6 ? "İyi geceler" : h < 12 ? "Günaydın" : h < 18 ? "İyi günler" : "İyi akşamlar";
      })()
    : "";

  const employeeId = props.employeeId;

  const pendingLeaves = leaveRequests.filter(l => l.status === "PENDING").length;
  const unreadAnn = announcements.filter(a => !a.isRead).length;

  const navigate = (page: PortalPage) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const PAGE_TITLES: Record<PortalPage, string> = {
    overview: "Genel Bakış",
    attendance: "Puantajım",
    leave: "İzin Talepleri",
    isg: "İSG Bilgilerim",
    discounts: "İndirimler",
    announcements: "Duyurular",
    profile: "Profilim",
  };

  return (
    <div className="min-h-screen bg-background">
      <ImpersonationBanner />

      {/* ──── Desktop Sidebar ──── */}
      <aside className="fixed left-0 top-0 z-40 hidden md:flex h-screen w-56 flex-col border-r bg-background">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b px-4">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg logo-ai-gradient logo-glow-ring logo-shimmer overflow-hidden">
            <HardHat className="h-4 w-4 text-white logo-hat-float drop-shadow-sm" />
          </div>
          <div>
            <span className="text-sm font-bold bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">Şantiye360</span>
            <span className="text-[9px] text-muted-foreground ml-1 font-medium">PORTAL</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5">
          <div className="space-y-0.5">
            {NAV_ITEMS.map(item => {
              const isActive = currentPage === item.key;
              const badge = item.key === "leave" && pendingLeaves > 0 ? pendingLeaves
                : item.key === "announcements" && unreadAnn > 0 ? unreadAnn
                : item.key === "overview" && notifications.length > 0 ? notifications.length
                : 0;
              return (
                <button
                  key={item.key}
                  onClick={() => navigate(item.key)}
                  className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {badge > 0 && (
                    <span className={`ml-auto flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                      item.key === "leave" ? "bg-amber-500" : "bg-primary"
                    }`}>{badge > 9 ? "9+" : badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User footer */}
        <div className="border-t p-3">
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{userName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{userName}</p>
              <p className="text-[10px] text-muted-foreground">{ROLE_LABELS[userRole] ?? userRole}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => signOut({ redirectTo: "/giris" })} className="h-7 w-7 text-muted-foreground flex-shrink-0" title="Çıkış Yap">
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* ──── Mobile Header ──── */}
      <header className="sticky top-0 z-50 flex md:hidden h-14 items-center justify-between border-b bg-background/95 backdrop-blur-sm px-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="relative flex h-7 w-7 items-center justify-center rounded-lg logo-ai-gradient overflow-hidden">
            <HardHat className="h-3.5 w-3.5 text-white drop-shadow-sm" />
          </div>
          <span className="text-sm font-bold bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">Şantiye360</span>
        </div>
        <div className="flex items-center gap-1.5">
          {notifications.length > 0 && (
            <div className="relative mr-0.5">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-500 text-[8px] text-white flex items-center justify-center font-bold">{notifications.length > 9 ? "9+" : notifications.length}</span>
            </div>
          )}
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">{userName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* ──── Mobile Menu Overlay ──── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-background border-r shadow-xl">
            <div className="flex h-14 items-center justify-between border-b px-4">
              <div className="flex items-center gap-2">
                <div className="relative flex h-7 w-7 items-center justify-center rounded-lg logo-ai-gradient overflow-hidden">
                  <HardHat className="h-3.5 w-3.5 text-white drop-shadow-sm" />
                </div>
                <span className="text-sm font-bold bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">Şantiye360</span>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <nav className="py-3 px-2.5">
              <div className="space-y-0.5">
                {NAV_ITEMS.map(item => {
                  const isActive = currentPage === item.key;
                  const badge = item.key === "leave" && pendingLeaves > 0 ? pendingLeaves
                    : item.key === "announcements" && unreadAnn > 0 ? unreadAnn
                    : 0;
                  return (
                    <button
                      key={item.key}
                      onClick={() => navigate(item.key)}
                      className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span>{item.label}</span>
                      {badge > 0 && <span className={`ml-auto flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${item.key === "leave" ? "bg-amber-500" : "bg-primary"}`}>{badge}</span>}
                    </button>
                  );
                })}
              </div>
            </nav>
            <div className="absolute bottom-0 left-0 right-0 border-t p-3">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{userName.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1"><p className="text-xs font-medium truncate">{userName}</p><p className="text-[10px] text-muted-foreground">{ROLE_LABELS[userRole] ?? userRole}</p></div>
                <Button variant="ghost" size="icon" onClick={() => signOut({ redirectTo: "/giris" })} className="h-7 w-7 text-muted-foreground" title="Çıkış"><LogOut className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ──── Main Content ──── */}
      <main className="md:ml-56">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
          {/* Page Header */}
          {currentPage === "overview" ? (
            <div className="mb-5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{greeting}, {userName.split(" ")[0]} 👋</h1>
              <p className="text-sm text-muted-foreground">
                {now?.toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                {props.projectInfo && <> • <MapPin className="inline h-3 w-3 mb-0.5" /> {props.projectInfo.name}</>}
              </p>
            </div>
          ) : (
            <div className="mb-5 flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground md:hidden" onClick={() => navigate("overview")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight">{PAGE_TITLES[currentPage]}</h1>
            </div>
          )}

          {/* Page Content */}
          {currentPage === "overview" && <OverviewPage props={props} navigate={navigate} />}
          {currentPage === "attendance" && <AttendancePage attendance={props.monthlyAttendance} />}
          {currentPage === "leave" && <LeavePage leaves={props.leaveRequests} employeeId={employeeId} />}
          {currentPage === "isg" && <ISGPage />}
          {currentPage === "discounts" && <DiscountsPage discounts={props.discounts} />}
          {currentPage === "announcements" && <AnnouncementsPage announcements={props.announcements} />}
          {currentPage === "profile" && <ProfilePage employee={employee} userName={userName} userEmail={props.userEmail} userRole={userRole} projectInfo={props.projectInfo} />}
        </div>

        <footer className="border-t py-4 px-4 text-center text-xs text-muted-foreground mt-8">
          <p>© 2026 AIWorks Lab | Tüm hakları saklıdır. — Created by <span className="font-medium">Seyfullah SEPET</span></p>
        </footer>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   EXPORT
═══════════════════════════════════════════════════════════ */
export function PortalClient(props: PortalProps) {
  return (
    <SessionProvider>
      <PortalContent {...props} />
    </SessionProvider>
  );
}
