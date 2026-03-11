"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "./app-sidebar";

/**
 * Dashboard kabuk bileşeni — sidebar'ın gösterilip gösterilmeyeceğini
 * pathname'e göre karar verir.
 * /projeler sayfasında sidebar gizlenir (proje seçim ekranı).
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // /projeler tam sayfa olacak, sidebar yok
  const hideSidebar = pathname === "/projeler";

  return (
    <div className="min-h-screen">
      {!hideSidebar && <AppSidebar />}
      <main className={hideSidebar ? "" : "lg:pl-64"}>
        <div className={`${hideSidebar ? "" : "pt-18 lg:pt-0"} min-h-screen flex flex-col`}>
          <div className={`${hideSidebar ? "" : "p-3 sm:p-6"} flex-1`}>{children}</div>
          <footer className="border-t py-4 px-3 sm:px-6 text-center text-xs text-muted-foreground">
            <p>© 2026 AIWorks Lab | Tüm hakları saklıdır. — Created by <span className="font-medium">Seyfullah SEPET</span></p>
          </footer>
        </div>
      </main>
    </div>
  );
}
