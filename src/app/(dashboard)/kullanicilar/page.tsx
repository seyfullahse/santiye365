/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Pencil,
  Trash2,
  Shield,
  ShieldCheck,
  User,
  Eye,
  EyeOff,
  Search,
  UserCheck,
  UserX,
  Link2,
  Link2Off,
  Crown,
  Briefcase,
  Building2,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  Clock,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

/* ─── Tipler ─── */
interface EmployeeInfo {
  id: string;
  firstName: string;
  lastName: string;
  employeeNo?: string;
  email?: string;
  phone?: string;
  department?: { id: string; name: string } | null;
  position?: { id: string; name: string } | null;
  company?: { id: string; name: string } | null;
  project?: { id: string; name: string } | null;
}

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  phone?: string;
  lastLoginAt?: string;
  createdAt: string;
  employeeId?: string;
  employee?: EmployeeInfo | null;
}

interface Stats {
  total: number;
  active: number;
  withEmployee: number;
  roleCounts: Record<string, number>;
}

/* ─── Yardımcılar ─── */
const roleConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  SUPER_ADMIN: { label: "Süper Admin", color: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800", icon: Crown },
  ADMIN: { label: "Yönetici", color: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800", icon: ShieldCheck },
  PROJECT_ADMIN: { label: "Proje Yöneticisi", color: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-400 dark:border-teal-800", icon: Shield },
  MANAGER: { label: "Müdür", color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800", icon: Shield },
  USER: { label: "Kullanıcı", color: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700", icon: User },
  VIEWER: { label: "İzleyici", color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800", icon: Eye },
};

function getRoleBadge(role: string) {
  const config = roleConfig[role] || roleConfig.USER;
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={`gap-1 ${config.color}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function timeAgo(dateStr?: string) {
  if (!dateStr) return "Hiç giriş yapmadı";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Az önce";
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} gün önce`;
  return new Date(dateStr).toLocaleDateString("tr-TR");
}

/* ─── Ana Bileşen ─── */
export default function KullanicilarPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("USER");
  const [formPhone, setFormPhone] = useState("");
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  // Available employees
  const [availableEmployees, setAvailableEmployees] = useState<EmployeeInfo[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<AppUser | null>(null);

  const isAuthorized = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN" && !(session?.user as any)?.isImpersonating;

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/kullanicilar?stats=true");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setStats(data.stats);
      }
    } catch {
      toast.error("Kullanıcılar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAvailableEmployees = async () => {
    try {
      const res = await fetch("/api/kullanicilar/available-employees");
      if (res.ok) {
        const data = await res.json();
        setAvailableEmployees(data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !isAuthorized) {
      router.replace("/dashboard");
      return;
    }
    fetchUsers();
  }, [session, status, router, isAuthorized, fetchUsers]);

  /* ─── Dialog handlers ─── */
  const openNew = () => {
    setEditingUser(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("USER");
    setFormPhone("");
    setFormEmployeeId("");
    setShowPassword(false);
    setEmployeeSearch("");
    setDialogOpen(true);
    fetchAvailableEmployees();
  };

  const openEdit = (user: AppUser) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword("");
    setFormRole(user.role);
    setFormPhone(user.phone || "");
    setFormEmployeeId(user.employeeId || "");
    setShowPassword(false);
    setEmployeeSearch("");
    setDialogOpen(true);
    fetchAvailableEmployees();
  };

  const handleSelectEmployee = (emp: EmployeeInfo) => {
    setFormEmployeeId(emp.id);
    setFormName(`${emp.firstName} ${emp.lastName}`);
    if (emp.email) setFormEmail(emp.email);
    if (emp.phone) setFormPhone(emp.phone);
    setEmployeeSearch(`${emp.firstName} ${emp.lastName}`);
    setShowEmployeeDropdown(false);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formEmail.trim()) {
      toast.error("Ad ve e-posta zorunludur");
      return;
    }
    if (!editingUser && !formPassword.trim()) {
      toast.error("Yeni kullanıcı için şifre zorunludur");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        name: formName.trim(),
        email: formEmail.trim(),
        role: formRole,
        phone: formPhone.trim() || null,
        employeeId: formEmployeeId || null,
      };
      if (formPassword.trim()) {
        payload.password = formPassword.trim();
      }

      const url = editingUser
        ? `/api/kullanicilar/${editingUser.id}`
        : "/api/kullanicilar";
      const method = editingUser ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errMsg = "İşlem başarısız";
        try {
          const err = await res.json();
          errMsg = err.error || errMsg;
        } catch {
          errMsg = `Sunucu hatası (${res.status})`;
        }
        toast.error(errMsg);
        return;
      }

      toast.success(
        editingUser ? "Kullanıcı güncellendi" : "Kullanıcı oluşturuldu"
      );
      setDialogOpen(false);
      fetchUsers();
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user: AppUser) => {
    try {
      const res = await fetch(`/api/kullanicilar/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (res.ok) {
        toast.success(user.isActive ? "Hesap pasif yapıldı" : "Hesap aktif yapıldı");
        fetchUsers();
      }
    } catch {
      toast.error("İşlem başarısız");
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    try {
      const res = await fetch(`/api/kullanicilar/${deletingUser.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Silme başarısız");
        return;
      }
      toast.success("Kullanıcı silindi");
      setDeleteDialogOpen(false);
      setDeletingUser(null);
      fetchUsers();
    } catch {
      toast.error("Bir hata oluştu");
    }
  };

  const handleImpersonate = async (user: AppUser) => {
    if (!confirm(`${user.name} (${user.email}) olarak giriş yapmak istediğinize emin misiniz?`)) return;
    try {
      const res = await fetch("/api/kullanicilar/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Giriş yapılamadı");
        return;
      }
      toast.success(data.message);
      // Sayfayı yenile — yeni session yüklenecek
      window.location.href = "/";
    } catch {
      toast.error("Bir hata oluştu");
    }
  };

  /* ─── Filtreleme ─── */
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.employee && `${u.employee.firstName} ${u.employee.lastName}`.toLowerCase().includes(search.toLowerCase()));
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && u.isActive) ||
      (statusFilter === "PASSIVE" && !u.isActive);
    return matchSearch && matchRole && matchStatus;
  });

  const filteredAvailableEmployees = availableEmployees.filter((e) =>
    `${e.firstName} ${e.lastName} ${e.employeeNo || ""}`
      .toLowerCase()
      .includes(employeeSearch.toLowerCase())
  );

  /* ─── Render ─── */
  if (status === "loading" || loading) {
    return (
      <div className="space-y-4 p-1">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 sm:h-7 sm:w-7 text-indigo-600" />
            Kullanıcı Yönetimi
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Sistem kullanıcılarını yönetin, İK çalışanlarına hesap oluşturun
          </p>
        </div>
        <Button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700">
          <UserPlus className="h-4 w-4 mr-2" />
          Yeni Kullanıcı
        </Button>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Toplam Kullanıcı</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">Aktif Hesap</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
                  <Link2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.withEmployee}</p>
                  <p className="text-xs text-muted-foreground">İK Bağlantılı</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(stats.roleCounts).map(([role, count]) => (
                      <span key={role} className="text-xs">
                        {roleConfig[role]?.label || role}: <strong>{count}</strong>
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Rol Dağılımı</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tablo */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Kullanıcılar</CardTitle>
              <CardDescription>
                {filteredUsers.length} kullanıcı listeleniyor
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-48"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tüm Roller</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Süper Admin</SelectItem>
                  <SelectItem value="ADMIN">Yönetici</SelectItem>
                  <SelectItem value="PROJECT_ADMIN">Proje Yöneticisi</SelectItem>
                  <SelectItem value="MANAGER">Müdür</SelectItem>
                  <SelectItem value="USER">Kullanıcı</SelectItem>
                  <SelectItem value="VIEWER">İzleyici</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tümü</SelectItem>
                  <SelectItem value="ACTIVE">Aktif</SelectItem>
                  <SelectItem value="PASSIVE">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="hidden md:table-cell">İK Bağlantısı</TableHead>
                  <TableHead className="hidden lg:table-cell">Son Giriş</TableHead>
                  <TableHead className="hidden sm:table-cell">Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className={!user.isActive ? "opacity-50" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 text-xs font-semibold">
                            {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          {user.phone && (
                            <p className="text-xs text-muted-foreground">{user.phone}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {user.employee ? (
                        <div className="flex items-center gap-1.5">
                          <Link2 className="h-3.5 w-3.5 text-sky-500" />
                          <div className="text-xs">
                            <p className="font-medium">{user.employee.firstName} {user.employee.lastName}</p>
                            {user.employee.department && (
                              <p className="text-muted-foreground">{user.employee.department.name}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Link2Off className="h-3.5 w-3.5" />
                          <span className="text-xs">Bağlantısız</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {timeAgo(user.lastLoginAt)}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant="outline"
                        className={user.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
                          : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800"
                        }
                      >
                        {user.isActive ? "Aktif" : "Pasif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {isSuperAdmin && user.id !== session?.user.id && user.isActive && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleImpersonate(user)}
                            title={`${user.name} olarak giriş yap`}
                            className="h-8 w-8 text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950"
                          >
                            <LogIn className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(user)}
                          title={user.isActive ? "Pasif Yap" : "Aktif Yap"}
                          className="h-8 w-8"
                        >
                          {user.isActive ? (
                            <ToggleRight className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(user)}
                          title="Düzenle"
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeletingUser(user);
                            setDeleteDialogOpen(true);
                          }}
                          disabled={user.id === session?.user.id}
                          title={
                            user.id === session?.user.id
                              ? "Kendi hesabınızı silemezsiniz"
                              : "Sil"
                          }
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <UserX className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                      <p className="text-muted-foreground">
                        {search || roleFilter !== "ALL" || statusFilter !== "ALL"
                          ? "Filtrelere uygun kullanıcı bulunamadı"
                          : "Henüz kullanıcı bulunmuyor"}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Kullanıcı Ekle/Düzenle Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingUser ? <Pencil className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
              {editingUser ? "Kullanıcı Düzenle" : "Yeni Kullanıcı"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Kullanıcı bilgilerini güncelleyin."
                : "Yeni bir kullanıcı oluşturun. İK çalışanına bağlayabilirsiniz."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 max-h-[65vh] overflow-y-auto pr-1">
            {/* İK Çalışan Bağlantısı */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" />
                İK Çalışanına Bağla (opsiyonel)
              </Label>
              <div className="relative">
                <Input
                  placeholder="Çalışan ara..."
                  value={employeeSearch || (formEmployeeId && editingUser?.employee ? `${editingUser.employee.firstName} ${editingUser.employee.lastName}` : "")}
                  onChange={(e) => {
                    setEmployeeSearch(e.target.value);
                    setShowEmployeeDropdown(true);
                    if (!e.target.value) {
                      setFormEmployeeId("");
                    }
                  }}
                  onFocus={() => setShowEmployeeDropdown(true)}
                />
                <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                {showEmployeeDropdown && filteredAvailableEmployees.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredAvailableEmployees.slice(0, 10).map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center justify-between"
                        onClick={() => handleSelectEmployee(emp)}
                      >
                        <div>
                          <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                          <p className="text-xs text-muted-foreground">
                            {[emp.department?.name, emp.position?.name].filter(Boolean).join(" · ") || "Departman belirtilmemiş"}
                          </p>
                        </div>
                        {emp.employeeNo && (
                          <span className="text-xs text-muted-foreground">#{emp.employeeNo}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {formEmployeeId && (
                <div className="flex items-center gap-2 text-xs">
                  <Link2 className="h-3.5 w-3.5 text-sky-500" />
                  <span className="text-sky-600">Çalışan bağlantısı seçildi</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1 text-xs text-muted-foreground"
                    onClick={() => {
                      setFormEmployeeId("");
                      setEmployeeSearch("");
                    }}
                  >
                    Kaldır
                  </Button>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Ad Soyad *</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Örn: Ahmet Yılmaz"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">E-posta *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="ornek@santiye360.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="05XX XXX XX XX"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">
                Şifre{editingUser ? " (boş bırakılırsa değişmez)" : " *"}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={editingUser ? "••••••••" : "Şifre girin"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Rol *</Label>
              <Select value={formRole} onValueChange={setFormRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {session?.user?.role === "SUPER_ADMIN" && (
                    <SelectItem value="SUPER_ADMIN">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-red-500" />
                        Süper Admin — Tam yetki
                      </div>
                    </SelectItem>
                  )}
                  <SelectItem value="ADMIN">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-purple-500" />
                      Yönetici — Sistem yönetimi
                    </div>
                  </SelectItem>
                  <SelectItem value="MANAGER">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      Müdür — Departman/alan yönetimi
                    </div>
                  </SelectItem>
                  <SelectItem value="PROJECT_ADMIN">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-teal-500" />
                      Proje Yöneticisi — Proje, İK, Puantaj
                    </div>
                  </SelectItem>
                  <SelectItem value="USER">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Kullanıcı — Standart erişim
                    </div>
                  </SelectItem>
                  <SelectItem value="VIEWER">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-amber-500" />
                      İzleyici — Sadece görüntüleme
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? "Kaydediliyor..." : editingUser ? "Güncelle" : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Silme Onay Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kullanıcıyı Sil</DialogTitle>
            <DialogDescription>
              <strong>{deletingUser?.name}</strong> ({deletingUser?.email})
              kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
