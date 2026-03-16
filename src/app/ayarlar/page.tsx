"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Settings,
  Palette,
  User,
  Bell,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Monitor,
  Check,
  Save,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ─── Theme brand options ─── */
const brandOptions = [
  { label: "Siyah", value: "oklch(0.205 0 0)", color: "#1a1a1a" },
  { label: "Mavi", value: "oklch(0.68 0.11 220)", color: "#3b82f6" },
  { label: "Yeşil", value: "oklch(0.72 0.12 160)", color: "#22c55e" },
  { label: "Mor", value: "oklch(0.65 0.15 300)", color: "#a855f7" },
  { label: "Turuncu", value: "oklch(0.70 0.15 55)", color: "#f97316" },
  { label: "Kırmızı", value: "oklch(0.63 0.18 25)", color: "#ef4444" },
  { label: "Camgöbeği", value: "oklch(0.72 0.10 195)", color: "#06b6d4" },
  { label: "Pembe", value: "oklch(0.70 0.15 350)", color: "#ec4899" },
];

type ThemeMode = "light" | "dark" | "system";

export default function AyarlarPage() {
  const { data: session } = useSession();

  /* ─── Tema state ─── */
  const [brand, setBrand] = useState<string>("");
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");

  /* ─── Profil state ─── */
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  /* ─── Bildirim state ─── */
  const [emailNotif, setEmailNotif] = useState(true);
  const [duyuruNotif, setDuyuruNotif] = useState(true);
  const [riskNotif, setRiskNotif] = useState(true);
  const [onayNotif, setOnayNotif] = useState(true);

  /* ─── Load theme from localStorage ─── */
  useEffect(() => {
    const savedBrand = localStorage.getItem("theme-brand");
    if (savedBrand) setBrand(savedBrand);

    const savedMode = localStorage.getItem("theme-mode") as ThemeMode | null;
    if (savedMode) {
      setThemeMode(savedMode);
    } else {
      setThemeMode(document.documentElement.classList.contains("dark") ? "dark" : "light");
    }

    // Load notification prefs from DB
    async function loadNotifPrefs() {
      try {
        const res = await fetch("/api/bildirimler/tercihler");
        if (res.ok) {
          const prefs = await res.json();
          setEmailNotif(prefs.ANNOUNCEMENT?.email ?? true);
          setDuyuruNotif(prefs.ANNOUNCEMENT?.inApp ?? true);
          setRiskNotif(prefs.SLA_WARNING?.inApp ?? true);
          setOnayNotif(prefs.APPROVAL_PENDING?.inApp ?? true);
        }
      } catch { /* ignore */ }
    }
    loadNotifPrefs();
  }, []);

  /* ─── Load profile data ─── */
  useEffect(() => {
    async function loadProfile() {
      setProfileLoading(true);
      try {
        const res = await fetch("/api/kullanicilar/profil");
        if (res.ok) {
          const data = await res.json();
          setProfileName(data.name || "");
          setProfileEmail(data.email || "");
          setProfilePhone(data.phone || "");
        }
      } catch {
        /* API hatası – sessizce geç */
      } finally {
        setProfileLoading(false);
      }
    }
    loadProfile();
  }, []);

  /* ─── Theme handlers ─── */
  const applyBrand = (value: string) => {
    document.documentElement.style.setProperty("--brand", value);
    setBrand(value);
    localStorage.setItem("theme-brand", value);
    toast.success("Tema rengi güncellendi");
  };

  const applyThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    localStorage.setItem("theme-mode", mode);

    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else if (mode === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    toast.success("Tema modu güncellendi");
  };

  /* ─── Profile save ─── */
  const handleProfileSave = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("Yeni şifreler eşleşmiyor");
      return;
    }
    if (newPassword && !currentPassword) {
      toast.error("Mevcut şifrenizi girmelisiniz");
      return;
    }
    if (newPassword && newPassword.length < 6) {
      toast.error("Yeni şifre en az 6 karakter olmalı");
      return;
    }

    setProfileSaving(true);
    try {
      const body: Record<string, string> = {};
      if (profileName) body.name = profileName;
      if (profileEmail) body.email = profileEmail;
      body.phone = profilePhone;
      if (newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }

      const res = await fetch("/api/kullanicilar/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success("Profil güncellendi");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const err = await res.json();
        toast.error(err.error || "Profil güncellenirken hata oluştu");
      }
    } catch {
      toast.error("Profil güncellenirken hata oluştu");
    } finally {
      setProfileSaving(false);
    }
  };

  /* ─── Notification prefs save ─── */
  const [notifSaving, setNotifSaving] = useState(false);
  const handleNotifSave = async () => {
    setNotifSaving(true);
    try {
      const body: Record<string, { inApp: boolean; email: boolean }> = {
        ANNOUNCEMENT: { inApp: duyuruNotif, email: emailNotif },
        APPROVAL_PENDING: { inApp: onayNotif, email: emailNotif },
        APPROVAL_APPROVED: { inApp: onayNotif, email: emailNotif },
        APPROVAL_REJECTED: { inApp: onayNotif, email: emailNotif },
        SLA_WARNING: { inApp: riskNotif, email: emailNotif },
        SYSTEM: { inApp: true, email: emailNotif },
        REMINDER: { inApp: true, email: false },
        LEAVE_REQUEST: { inApp: true, email: false },
        PROJECT_ASSIGNMENT: { inApp: true, email: emailNotif },
      };
      const res = await fetch("/api/bildirimler/tercihler", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("Bildirim tercihleri kaydedildi");
      } else {
        toast.error("Tercihler kaydedilemedi");
      }
    } catch {
      toast.error("Tercihler kaydedilemedi");
    } finally {
      setNotifSaving(false);
    }
  };

  const roleBadge = (role: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      SUPER_ADMIN: { label: "Süper Admin", variant: "destructive" },
      ADMIN: { label: "Admin", variant: "default" },
      MANAGER: { label: "Yönetici", variant: "secondary" },
      USER: { label: "Kullanıcı", variant: "outline" },
      VIEWER: { label: "İzleyici", variant: "outline" },
    };
    const info = map[role] || { label: role, variant: "outline" as const };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  const themeModes: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Açık", icon: Sun },
    { value: "dark", label: "Koyu", icon: Moon },
    { value: "system", label: "Sistem", icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => window.history.back()}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted hover:bg-accent transition-colors"
          title="Geri"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <Settings className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Ayarlar</h1>
          <p className="text-sm text-muted-foreground">
            Tema, profil ve bildirim tercihlerinizi yönetin
          </p>
        </div>
      </div>

      {/* ─── TEMA & GÖRÜNÜM ─── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <CardTitle>Tema & Görünüm</CardTitle>
          </div>
          <CardDescription>
            Uygulama temasını ve renk şemasını özelleştirin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tema Rengi */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Tema Rengi</Label>
            <div className="flex flex-wrap gap-3">
              {brandOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => applyBrand(opt.value)}
                  className={cn(
                    "group relative flex flex-col items-center gap-1.5"
                  )}
                >
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full border-2 shadow-sm transition-all hover:scale-110",
                      brand === opt.value
                        ? "border-foreground ring-2 ring-ring ring-offset-2"
                        : "border-transparent"
                    )}
                    style={{ background: opt.color }}
                  >
                    {brand === opt.value && (
                      <Check className="h-5 w-5 text-white m-auto mt-2.5 drop-shadow" />
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Tema Modu */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Tema Modu</Label>
            <div className="flex gap-2">
              {themeModes.map((mode) => (
                <Button
                  key={mode.value}
                  variant={themeMode === mode.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyThemeMode(mode.value)}
                  className="gap-2"
                >
                  <mode.icon className="h-4 w-4" />
                  {mode.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── PROFİL ─── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Profil Bilgileri</CardTitle>
            </div>
            {session?.user?.role && roleBadge(session.user.role)}
          </div>
          <CardDescription>
            Ad, e-posta ve şifrenizi güncelleyin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {profileLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Ad Soyad</Label>
                  <Input
                    id="name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Adınız Soyadınız"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="ornek@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="05XX XXX XX XX"
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-3">Şifre Değiştir</h4>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="currentPw">Mevcut Şifre</Label>
                    <div className="relative">
                      <Input
                        id="currentPw"
                        type={showCurrentPw ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPw">Yeni Şifre</Label>
                    <div className="relative">
                      <Input
                        id="newPw"
                        type={showNewPw ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPw">Şifre Tekrar</Label>
                    <Input
                      id="confirmPw"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleProfileSave} disabled={profileSaving} className="gap-2">
                  {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Profili Kaydet
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ─── BİLDİRİM TERCİHLERİ ─── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>Bildirim Tercihleri</CardTitle>
          </div>
          <CardDescription>
            Hangi bildirimleri almak istediğinizi seçin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow
            label="E-posta Bildirimleri"
            description="Önemli güncellemeler için e-posta gönderilsin"
            checked={emailNotif}
            onChange={setEmailNotif}
          />
          <Separator />
          <ToggleRow
            label="Duyuru Bildirimleri"
            description="Yeni duyurular yayınlandığında bildir"
            checked={duyuruNotif}
            onChange={setDuyuruNotif}
          />
          <Separator />
          <ToggleRow
            label="Risk Uyarıları"
            description="Yüksek riskli aktivitelerde uyar"
            checked={riskNotif}
            onChange={setRiskNotif}
          />
          <Separator />
          <ToggleRow
            label="Onay Bildirimleri"
            description="Bekleyen onaylar hakkında bildir"
            checked={onayNotif}
            onChange={setOnayNotif}
          />

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-green-600">
              <Check className="h-3.5 w-3.5" />
              <span>Bildirim altyapısı aktif</span>
            </div>
            <Button onClick={handleNotifSave} variant="outline" className="gap-2" disabled={notifSaving}>
              {notifSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Tercihleri Kaydet
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Toggle Row Component ─── */
function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
          checked ? "bg-primary" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}
