"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Banknote,
  DollarSign,
  ClipboardList,
  Calculator,
  AlertTriangle,
} from "lucide-react";
import { useEffect } from "react";

const MUHASEBE_ROLES = ["SUPER_ADMIN", "ADMIN", "MUHASEBE"];

const muhasebeTabs = [
  { name: "Özet", href: "/muhasebe", icon: Banknote, exact: true },
  { name: "Çalışan Ücretleri", href: "/muhasebe/ucretler", icon: DollarSign },
  { name: "Puantaj Rapor", href: "/muhasebe/puantaj-rapor", icon: ClipboardList },
  { name: "Maaş Hesaplama", href: "/muhasebe/maas-hesaplama", icon: Calculator },
];

export default function MuhasebeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const router = useRouter();

  const hasAccess = session?.user?.role && MUHASEBE_ROLES.includes(session.user.role);

  useEffect(() => {
    if (status !== "loading" && !hasAccess) {
      router.push("/");
    }
  }, [status, hasAccess, router]);

  if (status === "loading") return null;

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-lg font-semibold">Erişim Yetkiniz Yok</h2>
        <p className="text-muted-foreground">Bu modül sadece muhasebe birimi tarafından kullanılabilir.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="flex gap-1 overflow-x-auto pb-px" aria-label="Muhasebe navigasyonu">
          {muhasebeTabs.map((tab) => {
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-md border-b-2 whitespace-nowrap transition-colors",
                  isActive
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}
