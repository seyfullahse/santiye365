"use client";

import { useSession } from "next-auth/react";
import { ArrowLeftRight, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="fixed top-0 inset-x-0 z-[100] bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white shadow-lg">
      <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <ShieldAlert className="h-4 w-4 flex-shrink-0 animate-pulse" />
          <p className="text-sm font-medium truncate">
            <span className="font-bold">{user.name}</span>
            <span className="hidden sm:inline"> ({user.email})</span>
            <span className="opacity-80"> olarak görüntülüyorsunuz</span>
          </p>
          <span className="hidden md:inline-flex items-center gap-1 text-xs bg-white/20 rounded-full px-2 py-0.5">
            <ArrowLeftRight className="h-3 w-3" />
            Taklit Oturumu
          </span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleStopImpersonation}
          disabled={loading}
          className="flex-shrink-0 bg-white text-orange-700 hover:bg-white/90 font-semibold gap-1.5 shadow-sm"
        >
          <X className="h-3.5 w-3.5" />
          {loading ? "Dönülüyor..." : "Kendi Hesabıma Dön"}
        </Button>
      </div>
    </div>
  );
}
