"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Shield,
  ShieldCheck,
  ShieldX,
  Save,
  Loader2,
  Search,
  ChevronDown,
  ChevronRight,
  History,
  Filter,
  RefreshCw,
  Check,
  X,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  FileDown,
  Globe,
  Building2,
  FolderKanban,
  User,
  Lock,
  RotateCcw,
  Copy,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ─── Types ─── */
interface Permission {
  id: string;
  module: string;
  action: string;
  description: string | null;
}

interface AuditLog {
  id: string;
  action: string;
  module: string | null;
  entityType: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string; role: string };
}

type PermissionScope = "NONE" | "SELF" | "PROJECT" | "COMPANY" | "GLOBAL";

/* ─── Constants ─── */
const ROLES = [
  { key: "SUPER_ADMIN", label: "Süper Admin", shortLabel: "S.Admin", color: "bg-red-500", textColor: "text-red-700", bgLight: "bg-red-50", borderColor: "border-red-200" },
  { key: "ADMIN", label: "Admin", shortLabel: "Admin", color: "bg-orange-500", textColor: "text-orange-700", bgLight: "bg-orange-50", borderColor: "border-orange-200" },
  { key: "PROJECT_ADMIN", label: "Proje Admin", shortLabel: "P.Admin", color: "bg-amber-500", textColor: "text-amber-700", bgLight: "bg-amber-50", borderColor: "border-amber-200" },
  { key: "MANAGER", label: "Yönetici", shortLabel: "Yönetici", color: "bg-blue-500", textColor: "text-blue-700", bgLight: "bg-blue-50", borderColor: "border-blue-200" },
  { key: "MUHASEBE", label: "Muhasebe", shortLabel: "Muhase.", color: "bg-emerald-500", textColor: "text-emerald-700", bgLight: "bg-emerald-50", borderColor: "border-emerald-200" },
  { key: "USER", label: "Kullanıcı", shortLabel: "Kullan.", color: "bg-slate-500", textColor: "text-slate-700", bgLight: "bg-slate-50", borderColor: "border-slate-200" },
  { key: "VIEWER", label: "İzleyici", shortLabel: "İzleyici", color: "bg-gray-400", textColor: "text-gray-600", bgLight: "bg-gray-50", borderColor: "border-gray-200" },
];

const SCOPES: { value: PermissionScope; label: string; icon: typeof Globe; color: string; bg: string; description: string }[] = [
  { value: "NONE", label: "Yok", icon: X, color: "text-gray-400", bg: "bg-gray-50", description: "Erişim yok" },
  { value: "SELF", label: "Kendi", icon: User, color: "text-amber-600", bg: "bg-amber-50", description: "Sadece kendi verileri" },
  { value: "PROJECT", label: "Proje", icon: FolderKanban, color: "text-blue-600", bg: "bg-blue-50", description: "Atanan proje verileri" },
  { value: "COMPANY", label: "Şirket", icon: Building2, color: "text-purple-600", bg: "bg-purple-50", description: "Şirket geneli" },
  { value: "GLOBAL", label: "Global", icon: Globe, color: "text-green-600", bg: "bg-green-50", description: "Tüm sistem" },
];

const MODULE_CONFIG: Record<string, { label: string; icon: string; group: string }> = {
  projeler: { label: "Projeler", icon: "📁", group: "Proje Yönetimi" },
  mahaller: { label: "Mahaller", icon: "📍", group: "Proje Yönetimi" },
  katlar: { label: "Katlar", icon: "🏗️", group: "Proje Yönetimi" },
  aktiviteler: { label: "Aktiviteler", icon: "⚡", group: "Proje Yönetimi" },
  malzemeler: { label: "Malzemeler", icon: "📦", group: "Proje Yönetimi" },
  onaylar: { label: "Onaylar", icon: "✅", group: "Proje Yönetimi" },
  riskler: { label: "Riskler", icon: "⚠️", group: "Proje Yönetimi" },
  ekipler: { label: "Ekipler", icon: "👥", group: "Proje Yönetimi" },
  calisanlar: { label: "Çalışanlar", icon: "👷", group: "Proje Yönetimi" },
  personel: { label: "Personel", icon: "🧑‍💼", group: "İK & Personel" },
  ik: { label: "İnsan Kaynakları", icon: "🏢", group: "İK & Personel" },
  izin: { label: "İzin Yönetimi", icon: "🗓️", group: "İK & Personel" },
  isg: { label: "İş Sağlığı & Güvenliği", icon: "🛡️", group: "İK & Personel" },
  puantaj: { label: "Puantaj", icon: "📋", group: "Finans & Muhasebe" },
  hakedis: { label: "Hakediş", icon: "🧾", group: "Finans & Muhasebe" },
  muhasebe: { label: "Muhasebe", icon: "💰", group: "Finans & Muhasebe" },
  taseron: { label: "Taşeron", icon: "🚚", group: "Finans & Muhasebe" },
  sirketler: { label: "Şirketler", icon: "🏛️", group: "Organizasyon" },
  organizasyon: { label: "Organizasyon", icon: "🔗", group: "Organizasyon" },
  kullanicilar: { label: "Kullanıcı Yönetimi", icon: "👤", group: "Sistem" },
  crm: { label: "CRM", icon: "🤝", group: "İş Geliştirme" },
  teklif: { label: "Teklif & İhale", icon: "📝", group: "İş Geliştirme" },
  yatirim: { label: "Yatırım & GYO", icon: "📈", group: "İş Geliştirme" },
  duyurular: { label: "Duyurular", icon: "📢", group: "İletişim" },
  indirimler: { label: "İndirimler", icon: "🏷️", group: "İletişim" },
  toplanti: { label: "Toplantı Tutanakları", icon: "📄", group: "İletişim" },
  sunum: { label: "Sunum", icon: "🖥️", group: "Araçlar" },
  maskot: { label: "Maskot AI", icon: "🤖", group: "Araçlar" },
  ayarlar: { label: "Ayarlar", icon: "⚙️", group: "Sistem" },
  "yonetim-paneli": { label: "Yönetim Paneli", icon: "📊", group: "Sistem" },
};

const ACTION_CONFIG: Record<string, { label: string; icon: typeof Eye; color: string }> = {
  read: { label: "Görüntüle", icon: Eye, color: "text-blue-600" },
  create: { label: "Oluştur", icon: CheckCircle2, color: "text-green-600" },
  write: { label: "Düzenle", icon: Pencil, color: "text-amber-600" },
  update: { label: "Güncelle", icon: Pencil, color: "text-amber-600" },
  delete: { label: "Sil", icon: Trash2, color: "text-red-600" },
  approve: { label: "Onayla", icon: CheckCircle2, color: "text-purple-600" },
  request: { label: "Talep", icon: FileDown, color: "text-cyan-600" },
  export: { label: "Dışa Aktar", icon: FileDown, color: "text-teal-600" },
};

const GROUP_ORDER = ["Proje Yönetimi", "İK & Personel", "Finans & Muhasebe", "İş Geliştirme", "Organizasyon", "İletişim", "Araçlar", "Sistem"];

/* ─── Scope Selector (Popover Dropdown) ─── */
function ScopeSelector({
  scope,
  onChange,
  disabled,
}: {
  scope: PermissionScope;
  onChange: (s: PermissionScope) => void;
  disabled?: boolean;
}) {
  const current = SCOPES.find((s) => s.value === scope) || SCOPES[0];
  const Icon = current.icon;

  if (disabled) {
    return (
      <div className="flex items-center justify-center">
        <div className={cn("flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium", current.bg, current.color)}>
          <Icon className="h-3 w-3" />
          <span>{current.label}</span>
        </div>
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all",
            "hover:ring-2 hover:ring-primary/30 cursor-pointer",
            current.bg, current.color,
            scope === "NONE" && "opacity-60"
          )}
        >
          <Icon className="h-3 w-3" />
          <span>{current.label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="center">
        <div className="space-y-0.5">
          {SCOPES.map((s) => {
            const SIcon = s.icon;
            const isActive = s.value === scope;
            return (
              <button
                key={s.value}
                onClick={() => onChange(s.value)}
                className={cn(
                  "flex items-center gap-2 w-full rounded-md px-2.5 py-2 text-xs transition-colors text-left",
                  isActive ? cn(s.bg, s.color, "font-semibold") : "hover:bg-accent text-muted-foreground hover:text-foreground"
                )}
              >
                <SIcon className={cn("h-3.5 w-3.5", isActive ? s.color : "text-muted-foreground")} />
                <div className="flex-1">
                  <div className="font-medium">{s.label}</div>
                  <div className="text-[10px] text-muted-foreground">{s.description}</div>
                </div>
                {isActive && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ─── Compact Scope Dot (for overview table) ─── */
function ScopeDot({ scope }: { scope: PermissionScope }) {
  const s = SCOPES.find((x) => x.value === scope) || SCOPES[0];
  const Icon = s.icon;
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("inline-flex items-center justify-center h-6 w-6 rounded-full", s.bg)}>
            <Icon className={cn("h-3 w-3", s.color)} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <span className="font-medium">{s.label}</span> — {s.description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/* ════════════════════════════════════════════════════════════ */
export default function RollerPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const userRole = (session?.user as any)?.role;

  // Data
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [matrix, setMatrix] = useState<Record<string, Record<string, PermissionScope>>>({});
  const [originalMatrix, setOriginalMatrix] = useState<Record<string, Record<string, PermissionScope>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // UI
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("ADMIN");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(GROUP_ORDER));
  const [auditFilter, setAuditFilter] = useState({ module: "", action: "" });
  const [view, setView] = useState<"overview" | "detail">("overview");
  const [activeTab, setActiveTab] = useState("matrix");
  const tableRef = useRef<HTMLDivElement>(null);

  // Change tracking
  const changedKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const role of Object.keys(matrix)) {
      for (const perm of Object.keys(matrix[role] || {})) {
        if (matrix[role]?.[perm] !== originalMatrix[role]?.[perm]) {
          keys.add(`${role}:${perm}`);
        }
      }
    }
    return keys;
  }, [matrix, originalMatrix]);

  const hasChanges = changedKeys.size > 0;

  // Auth
  useEffect(() => {
    if (session && !["SUPER_ADMIN", "ADMIN"].includes(userRole)) {
      router.push("/");
    }
  }, [session, userRole, router]);

  // Fetch
  const fetchMatrix = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/yetkiler/roller");
      if (!res.ok) throw new Error("Yüklenemedi");
      const data = await res.json();
      setPermissions(data.permissions || []);
      const m = data.matrix || {};
      setMatrix(m);
      setOriginalMatrix(JSON.parse(JSON.stringify(m)));
    } catch {
      toast.error("İzin matrisi yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (auditFilter.module) params.set("module", auditFilter.module);
      if (auditFilter.action) params.set("action", auditFilter.action);
      const res = await fetch(`/api/denetim?${params}`);
      if (!res.ok) throw new Error("Yüklenemedi");
      const data = await res.json();
      setAuditLogs(data.logs || []);
    } catch {
      toast.error("Denetim kayıtları yüklenirken hata oluştu");
    } finally {
      setAuditLoading(false);
    }
  }, [auditFilter]);

  useEffect(() => { fetchMatrix(); }, [fetchMatrix]);

  // Grouped permissions
  const grouped = useMemo(() => {
    const byModule: Record<string, Permission[]> = {};
    permissions.forEach((p) => {
      if (!byModule[p.module]) byModule[p.module] = [];
      byModule[p.module].push(p);
    });
    const byGroup: Record<string, { module: string; perms: Permission[] }[]> = {};
    Object.entries(byModule).forEach(([mod, perms]) => {
      const group = MODULE_CONFIG[mod]?.group || "Diğer";
      if (!byGroup[group]) byGroup[group] = [];
      byGroup[group].push({ module: mod, perms });
    });
    return byGroup;
  }, [permissions]);

  // Filter
  const filteredGroups = useMemo(() => {
    if (!search) return grouped;
    const s = search.toLowerCase();
    const result: typeof grouped = {};
    Object.entries(grouped).forEach(([group, modules]) => {
      const filtered = modules.filter(
        (m) =>
          (MODULE_CONFIG[m.module]?.label || m.module).toLowerCase().includes(s) ||
          m.module.toLowerCase().includes(s) ||
          m.perms.some((p) => (p.description || "").toLowerCase().includes(s))
      );
      if (filtered.length > 0) result[group] = filtered;
    });
    return result;
  }, [grouped, search]);

  // Helpers
  const getScope = useCallback((role: string, key: string): PermissionScope =>
    (matrix[role]?.[key] as PermissionScope) || "NONE", [matrix]);

  const updateScope = (role: string, key: string, scope: PermissionScope) => {
    if (role === "SUPER_ADMIN") return;
    setMatrix((prev) => ({
      ...prev,
      [role]: { ...(prev[role] || {}), [key]: scope },
    }));
  };

  const setModuleScope = (role: string, module: string, scope: PermissionScope) => {
    if (role === "SUPER_ADMIN") return;
    const modulePerms = permissions.filter((p) => p.module === module);
    setMatrix((prev) => {
      const next = { ...prev, [role]: { ...(prev[role] || {}) } };
      modulePerms.forEach((p) => {
        next[role][`${p.module}:${p.action}`] = scope;
      });
      return next;
    });
  };

  const copyFromRole = (fromRole: string, toRole: string) => {
    if (toRole === "SUPER_ADMIN") return;
    setMatrix((prev) => ({
      ...prev,
      [toRole]: { ...(prev[fromRole] || {}) },
    }));
    toast.success(`${ROLES.find(r => r.key === fromRole)?.label} izinleri kopyalandı`);
  };

  const revertChanges = () => {
    setMatrix(JSON.parse(JSON.stringify(originalMatrix)));
    toast.info("Değişiklikler geri alındı");
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const changedRoles = new Set<string>();
      changedKeys.forEach((k) => changedRoles.add(k.split(":")[0]));

      for (const role of changedRoles) {
        if (role === "SUPER_ADMIN") continue;
        const permList = permissions
          .map((p) => ({
            permissionId: p.id,
            scope: getScope(role, `${p.module}:${p.action}`),
          }))
          .filter((p) => p.scope !== "NONE");

        const res = await fetch("/api/yetkiler/roller", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role, permissions: permList }),
        });
        if (!res.ok) throw new Error(`${role} kaydedilemedi`);
      }

      setOriginalMatrix(JSON.parse(JSON.stringify(matrix)));
      toast.success(`${changedRoles.size} rol güncellendi`);
    } catch {
      toast.error("Kaydetme sırasında hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const totalPerms = permissions.length;
    const roleStats = ROLES.map((r) => {
      const granted = permissions.filter((p) => {
        const scope = getScope(r.key, `${p.module}:${p.action}`);
        return scope !== "NONE";
      }).length;
      return { ...r, granted, total: totalPerms, pct: totalPerms > 0 ? Math.round((granted / totalPerms) * 100) : 0 };
    });
    return { totalPerms, moduleCount: Object.keys(MODULE_CONFIG).length, roleStats };
  }, [permissions, getScope]);

  const getModuleSummary = useCallback((role: string, modulePerms: Permission[]): PermissionScope => {
    const scopes = modulePerms.map((p) => getScope(role, `${p.module}:${p.action}`));
    if (scopes.every((s) => s === "NONE")) return "NONE";
    if (scopes.every((s) => s === "GLOBAL")) return "GLOBAL";
    if (scopes.every((s) => s === "COMPANY" || s === "GLOBAL")) return "COMPANY";
    if (scopes.every((s) => s === "PROJECT" || s === "COMPANY" || s === "GLOBAL")) return "PROJECT";
    return "SELF";
  }, [getScope]);

  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(userRole)) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        {/* ─── Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-violet-600" />
              Rol & Yetki Yönetimi
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {stats.totalPerms} izin · {Object.keys(grouped).reduce((n, g) => n + (grouped[g]?.length || 0), 0)} modül · {ROLES.length} rol
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <>
                <Button variant="outline" size="sm" onClick={revertChanges} className="gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Geri Al
                </Button>
                <Button size="sm" onClick={saveAll} disabled={saving} className="gap-1.5">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {changedKeys.size} Değişikliği Kaydet
                </Button>
              </>
            )}
          </div>
        </div>

        {/* ─── Role Summary Cards ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {stats.roleStats.map((r) => (
            <button
              key={r.key}
              onClick={() => { setSelectedRole(r.key); setView("detail"); setActiveTab("matrix"); }}
              className={cn(
                "relative rounded-lg border p-2.5 text-left transition-all hover:shadow-md",
                selectedRole === r.key && view === "detail"
                  ? cn(r.bgLight, r.borderColor, "ring-2 ring-offset-1 ring-primary/40")
                  : "hover:border-muted-foreground/30"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn("text-xs font-semibold", r.textColor)}>{r.shortLabel}</span>
                <span className={cn("h-2 w-2 rounded-full", r.color)} />
              </div>
              <div className="text-lg font-bold">{r.pct}%</div>
              <div className="text-[10px] text-muted-foreground">{r.granted}/{r.total} izin</div>
              <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
                <div className={cn("h-full rounded-full transition-all duration-500", r.color)} style={{ width: `${r.pct}%` }} />
              </div>
            </button>
          ))}
        </div>

        {/* ─── Tabs ─── */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v === "audit") fetchAuditLogs(); }}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <TabsList>
              <TabsTrigger value="matrix" className="gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                İzin Matrisi
              </TabsTrigger>
              <TabsTrigger value="audit" className="gap-1.5">
                <History className="h-3.5 w-3.5" />
                Denetim Kayıtları
              </TabsTrigger>
            </TabsList>

            {activeTab === "matrix" && (
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Modül ara..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
                <div className="flex items-center bg-muted rounded-md p-0.5">
                  <button
                    onClick={() => setView("overview")}
                    className={cn("px-2.5 py-1 rounded text-xs font-medium transition-colors",
                      view === "overview" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
                  >
                    Özet
                  </button>
                  <button
                    onClick={() => setView("detail")}
                    className={cn("px-2.5 py-1 rounded text-xs font-medium transition-colors",
                      view === "detail" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
                  >
                    Düzenle
                  </button>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchMatrix}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* ═══ MATRIX TAB ═══ */}
          <TabsContent value="matrix" className="mt-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">İzinler yükleniyor...</span>
              </div>
            ) : view === "overview" ? (
              /* ── Overview: compact matrix ── */
              <Card>
                <div className="overflow-x-auto" ref={tableRef}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="sticky left-0 z-10 bg-muted/50 text-left py-2.5 px-3 font-medium text-xs text-muted-foreground w-56">
                          Modül
                        </th>
                        <th className="text-left py-2.5 px-2 font-medium text-xs text-muted-foreground w-24">
                          İşlemler
                        </th>
                        {ROLES.map((r) => (
                          <th key={r.key} className="text-center py-2.5 px-1 min-w-[72px]">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => { setSelectedRole(r.key); setView("detail"); }}
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition-colors hover:ring-1 hover:ring-primary/30",
                                    r.bgLight, r.textColor
                                  )}
                                >
                                  <span className={cn("h-1.5 w-1.5 rounded-full", r.color)} />
                                  {r.shortLabel}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>{r.label} — Detay için tıklayın</TooltipContent>
                            </Tooltip>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {GROUP_ORDER.filter((g) => filteredGroups[g]).map((group) => (
                        <GroupRows
                          key={group}
                          group={group}
                          modules={filteredGroups[group]}
                          expandedGroups={expandedGroups}
                          setExpandedGroups={setExpandedGroups}
                          getScope={getScope}
                          onRoleClick={(role) => { setSelectedRole(role); setView("detail"); }}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Legend */}
                <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 border-t bg-muted/20 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Kapsam:</span>
                  {SCOPES.map((s) => {
                    const Icon = s.icon;
                    return (
                      <span key={s.value} className="flex items-center gap-1">
                        <span className={cn("inline-flex items-center justify-center h-5 w-5 rounded-full", s.bg)}>
                          <Icon className={cn("h-2.5 w-2.5", s.color)} />
                        </span>
                        {s.label}
                      </span>
                    );
                  })}
                  <span className="ml-auto text-[10px] italic">Rol başlığına tıklayarak düzenleme moduna geçin</span>
                </div>
              </Card>
            ) : (
              /* ── Detail View: per-role editing ── */
              <div className="space-y-3">
                {/* Role selector bar */}
                <Card className="p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm font-medium text-muted-foreground">Rol:</span>
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger className="w-44 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r.key} value={r.key}>
                              <span className="flex items-center gap-2">
                                <span className={cn("h-2 w-2 rounded-full", r.color)} />
                                {r.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedRole === "SUPER_ADMIN" && (
                        <Badge variant="outline" className="text-xs gap-1 text-amber-600 border-amber-300 bg-amber-50">
                          <Lock className="h-3 w-3" />
                          Salt Okunur
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {selectedRole !== "SUPER_ADMIN" && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                              <Copy className="h-3 w-3" />
                              Kopyala
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-44 p-1.5" align="end">
                            <p className="text-xs font-medium text-muted-foreground px-2 py-1.5">Rolden Kopyala:</p>
                            {ROLES.filter((r) => r.key !== selectedRole).map((r) => (
                              <button
                                key={r.key}
                                className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-xs hover:bg-accent transition-colors"
                                onClick={() => copyFromRole(r.key, selectedRole)}
                              >
                                <span className={cn("h-2 w-2 rounded-full", r.color)} />
                                {r.label}
                              </button>
                            ))}
                          </PopoverContent>
                        </Popover>
                      )}
                      <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => setView("overview")}>
                        <ChevronLeft className="h-3 w-3" />
                        Özet
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Permission groups */}
                {GROUP_ORDER.filter((g) => filteredGroups[g]).map((group) => (
                  <Card key={group} className="overflow-hidden">
                    <button
                      onClick={() => setExpandedGroups((prev) => {
                        const next = new Set(prev);
                        if (next.has(group)) next.delete(group); else next.add(group);
                        return next;
                      })}
                      className="flex items-center justify-between w-full px-4 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {expandedGroups.has(group) ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        <span className="font-semibold text-xs uppercase tracking-wider">{group}</span>
                        <Badge variant="secondary" className="text-[10px] h-4">{filteredGroups[group].length} modül</Badge>
                      </div>
                    </button>

                    {expandedGroups.has(group) && (
                      <div className="divide-y divide-muted/50">
                        {filteredGroups[group].map(({ module, perms }) => {
                          const config = MODULE_CONFIG[module] || { label: module, icon: "📄" };
                          const isSuperAdmin = selectedRole === "SUPER_ADMIN";
                          const moduleSummary = getModuleSummary(selectedRole, perms);

                          return (
                            <div key={module} className="px-4 py-3">
                              <div className="flex items-center justify-between mb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">{config.icon}</span>
                                  <span className="font-semibold text-sm">{config.label}</span>
                                  <ScopeDot scope={moduleSummary} />
                                </div>
                                {!isSuperAdmin && (
                                  <div className="flex items-center gap-1">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          onClick={() => setModuleScope(selectedRole, module, "GLOBAL")}
                                          className="h-6 px-2 rounded text-[10px] font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors flex items-center gap-0.5"
                                        >
                                          <ShieldCheck className="h-3 w-3" />
                                          Tümü
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>Tüm izinleri Global yap</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          onClick={() => setModuleScope(selectedRole, module, "NONE")}
                                          className="h-6 px-2 rounded text-[10px] font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors flex items-center gap-0.5"
                                        >
                                          <ShieldX className="h-3 w-3" />
                                          Kaldır
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>Tüm izinleri kaldır</TooltipContent>
                                    </Tooltip>
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {perms.map((p) => {
                                  const ac = ACTION_CONFIG[p.action] || { label: p.action, icon: Eye, color: "text-gray-600" };
                                  const Icon = ac.icon;
                                  const key = `${p.module}:${p.action}`;
                                  const scope = getScope(selectedRole, key);
                                  const isChanged = changedKeys.has(`${selectedRole}:${key}`);

                                  return (
                                    <div
                                      key={p.id}
                                      className={cn(
                                        "flex items-center justify-between rounded-lg border px-3 py-2 transition-all",
                                        isChanged ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20" : "border-muted",
                                        scope !== "NONE" ? "bg-background" : "bg-muted/20"
                                      )}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <Icon className={cn("h-3.5 w-3.5 shrink-0", ac.color)} />
                                        <div className="min-w-0">
                                          <div className="text-xs font-medium truncate">{ac.label}</div>
                                          {p.description && (
                                            <div className="text-[10px] text-muted-foreground truncate">{p.description}</div>
                                          )}
                                        </div>
                                      </div>
                                      <ScopeSelector
                                        scope={scope}
                                        onChange={(s) => updateScope(selectedRole, key, s)}
                                        disabled={isSuperAdmin}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                ))}

                {Object.keys(filteredGroups).length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    {permissions.length === 0 ? "Henüz izin tanımı yok." : "Arama ile eşleşen izin bulunamadı."}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ═══ AUDIT TAB ═══ */}
          <TabsContent value="audit" className="mt-3">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Denetim Kayıtları
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Sistem genelindeki tüm önemli işlemlerin kaydı
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={auditFilter.action || "all"}
                      onValueChange={(v) => setAuditFilter((f) => ({ ...f, action: v === "all" ? "" : v }))}
                    >
                      <SelectTrigger className="w-36 h-8 text-xs">
                        <Filter className="h-3 w-3 mr-1" />
                        <SelectValue placeholder="İşlem" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm İşlemler</SelectItem>
                        <SelectItem value="CREATE">Oluşturma</SelectItem>
                        <SelectItem value="UPDATE">Güncelleme</SelectItem>
                        <SelectItem value="DELETE">Silme</SelectItem>
                        <SelectItem value="LOGIN">Giriş</SelectItem>
                        <SelectItem value="LOGOUT">Çıkış</SelectItem>
                        <SelectItem value="APPROVE">Onay</SelectItem>
                        <SelectItem value="REJECT">Ret</SelectItem>
                        <SelectItem value="PERMISSION_CHANGE">İzin Değişikliği</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Modül..."
                      value={auditFilter.module}
                      onChange={(e) => setAuditFilter((f) => ({ ...f, module: e.target.value }))}
                      className="w-28 h-8 text-xs"
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchAuditLogs}>
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {auditLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="text-center py-12 text-sm text-muted-foreground">
                    Henüz denetim kaydı bulunmuyor
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-t border-b bg-muted/30">
                          <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Tarih</th>
                          <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Kullanıcı</th>
                          <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">İşlem</th>
                          <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Modül</th>
                          <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Detay</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map((log) => {
                          const actionColors: Record<string, string> = {
                            CREATE: "bg-green-50 text-green-700 border-green-200",
                            UPDATE: "bg-blue-50 text-blue-700 border-blue-200",
                            DELETE: "bg-red-50 text-red-700 border-red-200",
                            LOGIN: "bg-cyan-50 text-cyan-700 border-cyan-200",
                            LOGOUT: "bg-gray-50 text-gray-700 border-gray-200",
                            APPROVE: "bg-green-50 text-green-700 border-green-200",
                            REJECT: "bg-red-50 text-red-700 border-red-200",
                            PERMISSION_CHANGE: "bg-purple-50 text-purple-700 border-purple-200",
                          };
                          return (
                            <tr key={log.id} className="border-b border-muted/30 hover:bg-accent/20 transition-colors">
                              <td className="py-2 px-4 text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(log.createdAt).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                              </td>
                              <td className="py-2 px-4">
                                <div className="text-xs font-medium">{log.user?.name || "—"}</div>
                                <div className="text-[10px] text-muted-foreground">{log.user?.email}</div>
                              </td>
                              <td className="py-2 px-4">
                                <span className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold", actionColors[log.action] || "bg-gray-50 text-gray-700 border-gray-200")}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="py-2 px-4 text-xs">
                                {MODULE_CONFIG[log.module || ""]?.label || log.module || "—"}
                              </td>
                              <td className="py-2 px-4 text-xs text-muted-foreground">
                                {log.entityType || "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

/* ─── GroupRows component for overview table ─── */
function GroupRows({
  group,
  modules,
  expandedGroups,
  setExpandedGroups,
  getScope,
  onRoleClick,
}: {
  group: string;
  modules: { module: string; perms: Permission[] }[];
  expandedGroups: Set<string>;
  setExpandedGroups: React.Dispatch<React.SetStateAction<Set<string>>>;
  getScope: (role: string, key: string) => PermissionScope;
  onRoleClick: (role: string) => void;
}) {
  const isExpanded = expandedGroups.has(group);

  return (
    <>
      <tr>
        <td colSpan={2 + ROLES.length} className="sticky left-0 bg-muted/30 z-10">
          <button
            onClick={() => setExpandedGroups((prev) => {
              const next = new Set(prev);
              if (next.has(group)) next.delete(group); else next.add(group);
              return next;
            })}
            className="flex items-center gap-1.5 py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-full hover:text-foreground transition-colors"
          >
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            {group}
            <Badge variant="secondary" className="text-[9px] h-4 px-1 ml-1">{modules.length}</Badge>
          </button>
        </td>
      </tr>
      {isExpanded && modules.map(({ module, perms }) => {
        const config = MODULE_CONFIG[module] || { label: module, icon: "📄" };
        return (
          <tr key={module} className="border-b border-muted/50 hover:bg-accent/30 transition-colors group/row">
            <td className="sticky left-0 z-10 bg-background group-hover/row:bg-accent/30 py-2 px-3 transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-sm">{config.icon}</span>
                <span className="font-medium text-sm">{config.label}</span>
              </div>
            </td>
            <td className="py-2 px-2">
              <div className="flex gap-0.5">
                {perms.map((p) => {
                  const ac = ACTION_CONFIG[p.action];
                  if (!ac) return null;
                  const Icon = ac.icon;
                  return (
                    <Tooltip key={p.id}>
                      <TooltipTrigger asChild>
                        <div className={cn("h-5 w-5 rounded flex items-center justify-center bg-muted/50", ac.color)}>
                          <Icon className="h-2.5 w-2.5" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">{ac.label}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </td>
            {ROLES.map((r) => (
              <td key={r.key} className="text-center py-2 px-1">
                <div className="flex items-center justify-center gap-0.5">
                  {perms.map((p) => {
                    const scope = getScope(r.key, `${p.module}:${p.action}`);
                    return <ScopeDot key={p.id} scope={scope} />;
                  })}
                </div>
              </td>
            ))}
          </tr>
        );
      })}
    </>
  );
}
