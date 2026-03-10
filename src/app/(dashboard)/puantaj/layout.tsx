"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  Users,
  BarChart3,
} from "lucide-react";

const puantajTabs = [
  { name: "Genel Bakış", href: "/puantaj", icon: LayoutDashboard, exact: true },
  { name: "Günlük Puantaj", href: "/puantaj/gunluk", icon: CalendarDays },
  { name: "Aylık Puantaj", href: "/puantaj/aylik", icon: CalendarRange },
  { name: "Çalışanlar", href: "/puantaj/calisanlar", icon: Users },
  { name: "Raporlar", href: "/puantaj/raporlar", icon: BarChart3 },
];

export default function PuantajLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="flex gap-1 overflow-x-auto pb-px" aria-label="Puantaj navigasyonu">
          {puantajTabs.map((tab) => {
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
