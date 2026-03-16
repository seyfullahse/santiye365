"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  HardHat,
  Eye,
  EyeOff,
  FolderKanban,
  Activity,
  MapPin,
  Layers,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Package,
  Users,
  Building2,
  BarChart3,
  Gavel,
  Receipt,
  FileText,
  Wallet,
  ShoppingCart,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

/* ── Platform Yetenekleri (Gruplu) ── */
const featureGroups = [
  {
    title: "Proje Yönetimi",
    items: [
      { icon: FolderKanban, text: "Proje Takibi" },
      { icon: Activity, text: "Aktivite & İş Programı" },
      { icon: MapPin, text: "Mahal & Kat Yönetimi" },
      { icon: BarChart3, text: "Gösterge Paneli & Raporlar" },
    ],
  },
  {
    title: "Saha Operasyonları",
    items: [
      { icon: ClipboardList, text: "Puantaj & Yoklama" },
      { icon: Users, text: "Ekip & Çalışan Yönetimi" },
      { icon: AlertTriangle, text: "Risk Analizi & Takibi" },
      { icon: CheckCircle2, text: "Onay Süreç Yönetimi" },
    ],
  },
  {
    title: "Tedarik & Malzeme",
    items: [
      { icon: Package, text: "Malzeme Takip & Sipariş" },
      { icon: ShoppingCart, text: "Satınalma & Depo" },
      { icon: Building2, text: "Şirket & Taşeron Kayıtları" },
    ],
  },
  {
    title: "İhale & Finans",
    items: [
      { icon: Gavel, text: "İhale & Teklif Yönetimi" },
      { icon: Receipt, text: "Hakediş & Sözleşme" },
      { icon: Wallet, text: "Finans & Bütçe Takibi" },
    ],
  },
  {
    title: "Dijital Altyapı",
    items: [
      { icon: FileText, text: "Doküman Yönetimi" },
      { icon: TrendingUp, text: "Yatırım & GYO" },
      { icon: Sparkles, text: "AI Destekli Analitik" },
    ],
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Giriş başarısız. E-posta veya şifre hatalı.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel – Tanıtım (desktop, %50) ── */}
      <div className="hidden lg:flex lg:flex-1 relative flex-col overflow-hidden text-white bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        {/* Decorative */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-blue-500/10" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-blue-400/8" />
        <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-blue-500/5 to-transparent -translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10 flex-1 flex flex-col p-8 xl:p-10 2xl:p-12 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl logo-ai-gradient logo-glow-ring logo-shimmer overflow-hidden">
              <HardHat className="h-6 w-6 text-white logo-hat-float drop-shadow-sm" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">Şantiye360</span>
              <p className="text-blue-300 text-[11px] mt-0.5">Construction Operating System</p>
            </div>
          </div>

          {/* Hero */}
          <div className="mb-8">
            <h2 className="text-[22px] xl:text-[26px] font-bold leading-tight">
              İnşaat Sektöründe
              <br />
              Dijital Dönüşüm Platformu
            </h2>
            <p className="text-blue-200/70 text-[13px] mt-3 leading-relaxed max-w-lg">
              Şantiye360 ile ihale süreçlerinden teklif hazırlamaya, hakediş
              yönetiminden teknik hesaplamalara, finans ve muhasebeden insan
              kaynakları ve İK yönetimine, satınalma ve depo kontrolünden
              sürdürülebilirlik raporlamasına kadar tüm iş süreçlerinizi
              dijitalleştirin. İnşaat, elektrik ve mekanik projelerinizde zaman
              kazanın, maliyetleri kontrol edin, verimliliğinizi artırın.
            </p>
          </div>

          {/* Platform Özellikleri – Gruplu */}
          <div className="mb-8 space-y-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-300/60">
              Platform Özellikleri
            </p>
            {featureGroups.map((group, gi) => (
              <div key={gi}>
                <h4 className="text-[11px] font-semibold text-blue-300 mb-2.5 flex items-center gap-2">
                  <span className="h-px flex-1 bg-blue-400/20" />
                  <span>{group.title}</span>
                  <span className="h-px flex-1 bg-blue-400/20" />
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {group.items.map((f, i) => {
                    const Icon = f.icon;
                    return (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-400/15">
                          <Icon className="h-3.5 w-3.5 text-blue-300" />
                        </div>
                        <span className="text-[12px] leading-tight">{f.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Stats bar */}
          <div className="rounded-xl bg-white/[0.05] border border-white/10 backdrop-blur-sm p-4 mb-8">
            <div className="grid grid-cols-3 divide-x divide-white/10">
              <div className="text-center px-4">
                <p className="text-xl font-bold">10+</p>
                <p className="text-[10px] text-blue-300/60 mt-0.5">Aktif Modül</p>
              </div>
              <div className="text-center px-4">
                <p className="text-xl font-bold">360°</p>
                <p className="text-[10px] text-blue-300/60 mt-0.5">Tam Kapsam</p>
              </div>
              <div className="text-center px-4">
                <p className="text-xl font-bold">7/24</p>
                <p className="text-[10px] text-blue-300/60 mt-0.5">Bulut Erişim</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-4">
            <p className="text-[11px] text-blue-300/50">
              © 2026 AIWorks Lab — Created by Seyfullah SEPET
            </p>
          </div>
        </div>
      </div>

      {/* ── Right Panel – Login Form (%50) ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-background">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl logo-ai-gradient logo-glow-ring logo-shimmer overflow-hidden">
              <HardHat className="h-6 w-6 text-white logo-hat-float drop-shadow-sm" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">Şantiye360</span>
              <p className="text-[10px] text-muted-foreground leading-none">
                Construction OS
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Giriş Yap</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Şantiye yönetim sistemine erişmek için giriş yapın
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                E-posta
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="ornek@sirket.com"
                required
                className="h-11"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Şifre
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  className="h-11 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-medium"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Giriş yapılıyor...
                </span>
              ) : (
                "Giriş Yap"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/tanitim"
              className="text-sm text-primary hover:underline font-medium"
            >
              Platformu Keşfet &rarr;
            </Link>
          </div>

          <p className="mt-10 text-center text-[11px] text-muted-foreground lg:hidden">
            © 2026 AIWorks Lab — Created by Seyfullah SEPET
          </p>
        </div>
      </div>
    </div>
  );
}
