"use client";

import { useSession } from "next-auth/react";
import { ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export function ImpersonationBanner() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);

  const user = session?.user as any;
  if (!user?.isImpersonating) return null;

  const handleStopImpersonation = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/kullanicilar/impersonate", {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Oturum geri yüklenemedi");
        return;
      }
      toast.success("Kendi hesabınıza geri döndünüz");
      window.location.href = "/kullanicilar";
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleStopImpersonation}
      disabled={loading}
      className="fixed bottom-4 right-4 z-[100] flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white px-4 py-2.5 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 text-sm font-semibold cursor-pointer disabled:opacity-70"
    >
      <ShieldAlert className="h-4 w-4 animate-pulse flex-shrink-0" />
      <span className="hidden sm:inline truncate max-w-48">
        <span className="font-bold">{user.name}</span>
        <span className="opacity-80 text-xs"> olarak</span>
      </span>
      <span className="border-l border-white/30 pl-2 flex items-center gap-1">
        <X className="h-3.5 w-3.5" />
        {loading ? "Dönülüyor..." : "Hesabıma Dön"}
      </span>
    </button>
  );
}
