"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppSidebar } from "./app-sidebar";
import { ImpersonationBanner } from "./impersonation-banner";

/**
 * Dashboard kabuk bileşeni — sidebar'ın gösterilip gösterilmeyeceğini
 * pathname'e göre karar verir.
 * /projeler sayfasında sidebar gizlenir (proje seçim ekranı).
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  // /projeler tam sayfa olacak, sidebar yok
  const hideSidebar = pathname === "/projeler";
  const isImpersonating = !!(session?.user as any)?.isImpersonating;

  return (
    <div className={`min-h-screen ${isImpersonating ? "pt-10" : ""}`}>
      {isImpersonating && <ImpersonationBanner />}
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
