import { Providers } from "@/components/providers";
import { AppSidebar } from "@/components/app-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="min-h-screen">
        <AppSidebar />
        <main className="lg:pl-64">
          <div className="pt-18 lg:pt-0 min-h-screen flex flex-col">
            <div className="p-3 sm:p-6 flex-1">{children}</div>
            <footer className="border-t py-4 px-3 sm:px-6 text-center text-xs text-muted-foreground">
              <p>© 2026 AIWorks Lab | Tüm hakları saklıdır. — Created by <span className="font-medium">Seyfullah SEPET</span></p>
            </footer>
          </div>
        </main>
      </div>
    </Providers>
  );
}
