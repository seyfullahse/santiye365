"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  FolderKanban,
  MapPin,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Users,
  Building2,
  HardHat,
  UserCheck,
  LogOut,
  Menu,
  Settings,
  Package,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const navigation = [
  { name: "Gösterge Paneli", href: "/dashboard", icon: LayoutDashboard },
  { name: "Projeler", href: "/projeler", icon: FolderKanban },
  { name: "Mahaller", href: "/mahaller", icon: MapPin },
  { name: "Katlar", href: "/katlar", icon: Layers },
  { name: "Aktiviteler", href: "/aktiviteler", icon: Activity },
  { name: "Malzemeler", href: "/malzemeler", icon: Package },
  { name: "Onaylar", href: "/onaylar", icon: CheckCircle2 },
  { name: "Riskler", href: "/riskler", icon: AlertTriangle },
  { name: "Şirketler", href: "/sirketler", icon: Building2 },
  { name: "Ekipler", href: "/ekipler", icon: Users },
  { name: "Çalışanlar", href: "/calisanlar", icon: UserCheck },
  { name: "Puantaj", href: "/puantaj", icon: ClipboardList },
  { name: "Personel", href: "/personel", icon: HardHat },
];

const adminNavigation = [
  { name: "Ayarlar", href: "/ayarlar", icon: Settings },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [brand, setBrand] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("theme-brand");
    if (saved) {
      applyBrand(saved);
      setBrand(saved);
    }
  }, []);

  const applyBrand = (value: string) => {
    const root = document.documentElement;
    root.style.setProperty("--brand", value);
  };

  const handleBrandChange = (value: string) => {
    applyBrand(value);
    setBrand(value);
    localStorage.setItem("theme-brand", value);
  };

  const brandOptions = [
    { label: "Siyah", value: "oklch(0.205 0 0)" },
    { label: "Mavi", value: "oklch(0.68 0.11 220)" },
    { label: "Yeşil", value: "oklch(0.72 0.12 160)" },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 lg:gap-3 px-4 lg:px-6 py-4 lg:py-6">
        <HardHat className="h-7 w-7 lg:h-10 lg:w-10 text-primary" />
        <span className="text-lg lg:text-2xl font-bold">Şantiye360</span>
      </div>
      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}

        {session?.user?.role === "ADMIN" && (
          <>
            <div className="my-2 mx-3 border-t" />
            {adminNavigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <Separator />

      {/* Theme + User */}
      <div className="p-4 space-y-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Tema Rengi</p>
          <div className="flex gap-2">
            {brandOptions.map((opt) => (
              <button
                key={opt.value}
                aria-label={opt.label}
                onClick={() => handleBrandChange(opt.value)}
                className={cn(
                  "h-8 w-8 rounded-full border shadow-sm transition",
                  brand === opt.value ? "ring-2 ring-ring ring-offset-2" : ""
                )}
                style={{ background: opt.value }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback>
              {session?.user?.name?.charAt(0) ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {session?.user?.name ?? "Kullanıcı"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {session?.user?.email ?? ""}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut({ redirectTo: "/giris" })}
            title="Çıkış yap"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile trigger */}
      <div className="fixed top-0 left-0 z-40 flex h-18 w-full items-center border-b bg-background px-4 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Menü</SheetTitle>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="ml-3 flex items-center gap-2">
          <HardHat className="h-6 w-6 text-primary" />
          <span className="text-base font-bold">Şantiye360</span>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-background lg:block">
        <SidebarContent />
      </aside>
    </>
  );
}
