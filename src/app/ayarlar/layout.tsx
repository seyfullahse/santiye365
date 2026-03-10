import { Providers } from "@/components/providers";

export default function AyarlarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto w-full">
          {children}
        </main>
      </div>
    </Providers>
  );
}
