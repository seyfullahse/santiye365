"use client";

import { SozlesmeProvider } from "./sozlesme-context";
import { SozlesmeSelector } from "./sozlesme-selector";

export default function HakedisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SozlesmeProvider>
      <div className="relative">
        {/* Global Sözleşme Seçici — Sağ üst */}
        <div className="flex justify-end mb-4">
          <SozlesmeSelector />
        </div>
        {children}
      </div>
    </SozlesmeProvider>
  );
}
