"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  CalendarRange,
  Users,
  BarChart3,
  HardHat,
  ArrowLeft,
} from "lucide-react";

function PuantajLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");

  // Proje seçim sayfası — tab gösterme
  if (pathname === "/puantaj" || !projectId) {
    return <>{children}</>;
  }

  const tabs = [
    { name: "Firma Puantaj", href: `/puantaj/gunluk?project=${projectId}`, icon: CalendarDays, match: "/puantaj/gunluk" },
    { name: "Taşeron Puantaj", href: `/puantaj/taseron?project=${projectId}`, icon: HardHat, match: "/puantaj/taseron" },
    { name: "Aylık Özet", href: `/puantaj/aylik?project=${projectId}`, icon: CalendarRange, match: "/puantaj/aylik" },
    { name: "Çalışanlar", href: `/puantaj/calisanlar?project=${projectId}`, icon: Users, match: "/puantaj/calisanlar" },
    { name: "Raporlar", href: `/puantaj/raporlar?project=${projectId}`, icon: BarChart3, match: "/puantaj/raporlar" },
  ];

  return (
    <div className="space-y-4">
      <div className="border-b">
        <nav className="flex gap-1 overflow-x-auto pb-px" aria-label="Puantaj">
          <Link
            href="/puantaj"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-md border-b-2 border-transparent text-muted-foreground hover:text-foreground whitespace-nowrap transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Projeler
          </Link>
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.match);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.match}
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
      {children}
    </div>
  );
}

export default function PuantajLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Yükleniyor...</div>}>
      <PuantajLayoutInner>{children}</PuantajLayoutInner>
    </Suspense>
  );
}
