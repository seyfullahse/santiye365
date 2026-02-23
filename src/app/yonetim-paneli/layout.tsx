import { Providers } from "@/components/providers";

export default function YonetimPaneliLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="min-h-screen flex flex-col">
        {children}
        <footer className="border-t py-3 px-6 text-center text-xs text-muted-foreground mt-auto">
          <p>© 2026 AIWorks Lab | Tüm hakları saklıdır. — Created by <span className="font-medium">Seyfullah SEPET</span></p>
        </footer>
      </div>
    </Providers>
  );
}
