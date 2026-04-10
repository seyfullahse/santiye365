// @ts-nocheck
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Maximize,
  Play,
  Pause,
  Monitor,
} from "lucide-react";

/* ─── Tipler ─── */
interface Discipline {
  id: string;
  name: string;
}

interface ImalatKalemi {
  id: string;
  siraNo: number;
  imalatAciklama: string;
  yer: string;
  disciplineId: string | null;
  discipline: Discipline | null;
  projeDurumu: string;
  imalatDurumu: string;
  aksiyon: string | null;
  sorumlu: string | null;
  ilgiliTaseron: string | null;
  notlar: string | null;
}

interface ImalatMahal {
  id: string;
  name: string;
  sortOrder: number;
  floorId: string;
  floor: { id: string; name: string };
  kalemler: ImalatKalemi[];
  _count: { kalemler: number };
}

/* ─── Sabitler ─── */
const YER_LABELS: Record<string, string> = {
  DUVAR: "Duvar",
  TAVAN: "Tavan",
  DOSEME: "Döşeme",
  DUVAR_TAVAN: "Duvar + Tavan",
  ALIN_SAKAL: "Alın + Sakallalar",
  GENEL: "Genel",
  DIGER: "Diğer",
};

const PROJE_DURUMU_LABELS: Record<string, string> = {
  GECERLI: "Geçerli",
  IPTAL: "İptal",
  REVIZE: "Revize",
};

const IMALAT_DURUMU_LABELS: Record<string, string> = {
  YAPILMADI: "Yapılmadı",
  YAPILIYOR: "Yapılıyor",
  TAMAMLANDI: "Tamamlandı",
};

const AUTO_PLAY_INTERVAL = 8000; // 8 saniye

/* ─── Sunum Sayfası ─── */
export default function ImalatSunumPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [mahaller, setMahaller] = useState<ImalatMahal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMahalIndex, setActiveMahalIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ─── Veri Yükleme ─── */
  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/projeler/${projectId}/imalat-takip/mahaller`);
      if (res.ok) {
        const data = await res.json();
        setMahaller(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ─── Tam Ekran ─── */
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  /* ─── Otomatik Oynatma ─── */
  useEffect(() => {
    if (autoPlay && mahaller.length > 0) {
      autoPlayRef.current = setInterval(() => {
        setActiveMahalIndex((prev) => (prev + 1) % mahaller.length);
      }, AUTO_PLAY_INTERVAL);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [autoPlay, mahaller.length]);

  /* ─── Klavye Navigasyonu ─── */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          setActiveMahalIndex((prev) => Math.min(prev + 1, mahaller.length - 1));
          setAutoPlay(false);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          setActiveMahalIndex((prev) => Math.max(prev - 1, 0));
          setAutoPlay(false);
          break;
        case "Escape":
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            router.back();
          }
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
        case " ":
          e.preventDefault();
          setAutoPlay((p) => !p);
          break;
        case "s":
        case "S":
          setShowSidebar((p) => !p);
          break;
        case "Home":
          setActiveMahalIndex(0);
          break;
        case "End":
          setActiveMahalIndex(mahaller.length - 1);
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [mahaller.length, router]);

  /* ─── Hesaplamalar ─── */
  const activeMahal = mahaller[activeMahalIndex];
  const totalKalem = mahaller.reduce((sum, m) => sum + m.kalemler.length, 0);
  const totalTamamlanan = mahaller.reduce(
    (sum, m) => sum + m.kalemler.filter((k) => k.imalatDurumu === "TAMAMLANDI").length,
    0
  );
  const totalProgress = totalKalem > 0 ? Math.round((totalTamamlanan / totalKalem) * 100) : 0;

  const mahalStats = (mahal: ImalatMahal) => {
    const total = mahal.kalemler.length;
    const done = mahal.kalemler.filter((k) => k.imalatDurumu === "TAMAMLANDI").length;
    const inProgress = mahal.kalemler.filter((k) => k.imalatDurumu === "YAPILIYOR").length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, inProgress, pct };
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-[100]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-white/60 text-sm">Veriler yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (mahaller.length === 0) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-[100]">
        <div className="text-center text-white/60 space-y-4">
          <Monitor className="h-16 w-16 mx-auto opacity-30" />
          <p className="text-lg">Henüz imalat verisi yok</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/80 text-sm transition-colors"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  const activeStats = activeMahal ? mahalStats(activeMahal) : { total: 0, done: 0, inProgress: 0, pct: 0 };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-slate-950 flex flex-col z-[100] select-none"
    >
      {/* ═══ Üst Bar ═══ */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-white/10 shrink-0">
        {/* Sol: Bilgi */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            title="Kapat (ESC)"
          >
            <X className="h-5 w-5 text-white/60" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-sm">İMALAT TAKİP SUNUM</span>
            <span className="text-white/40 text-xs">|</span>
            <span className="text-white/50 text-xs">
              {activeMahalIndex + 1} / {mahaller.length} mahal
            </span>
          </div>
        </div>

        {/* Orta: Genel ilerleme */}
        <div className="flex items-center gap-3">
          <span className="text-white/50 text-xs">Genel İlerleme</span>
          <div className="w-48 h-2.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
          <span className="text-white font-bold text-sm">%{totalProgress}</span>
          <span className="text-white/40 text-xs">({totalTamamlanan}/{totalKalem})</span>
        </div>

        {/* Sağ: Kontroller */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSidebar((p) => !p)}
            className={`p-1.5 rounded-lg transition-colors text-xs px-2 ${showSidebar ? "bg-white/20 text-white" : "hover:bg-white/10 text-white/50"}`}
            title="Kenar Çubuğu (S)"
          >
            Panel
          </button>
          <button
            onClick={() => setAutoPlay((p) => !p)}
            className={`p-1.5 rounded-lg transition-colors ${autoPlay ? "bg-blue-500/30 text-blue-400" : "hover:bg-white/10 text-white/50"}`}
            title="Otomatik Oynat (Boşluk)"
          >
            {autoPlay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/50"
            title="Tam Ekran (F)"
          >
            <Maximize className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ═══ İçerik ═══ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ─── Sol Kenar: Mahal Listesi ─── */}
        {showSidebar && (
          <div className="w-64 bg-slate-900/50 border-r border-white/10 overflow-y-auto shrink-0">
            <div className="p-2 space-y-0.5">
              {mahaller.map((mahal, index) => {
                const stats = mahalStats(mahal);
                const isActive = index === activeMahalIndex;
                return (
                  <button
                    key={mahal.id}
                    onClick={() => { setActiveMahalIndex(index); setAutoPlay(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all text-sm ${
                      isActive
                        ? "bg-blue-500/20 border border-blue-500/40 text-white"
                        : "hover:bg-white/5 text-white/60 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate text-xs">{mahal.name}</span>
                      <span className={`text-[10px] font-bold shrink-0 ${
                        stats.pct === 100 ? "text-emerald-400" : stats.pct > 0 ? "text-yellow-400" : "text-white/30"
                      }`}>
                        %{stats.pct}
                      </span>
                    </div>
                    {/* Mini progress */}
                    <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          stats.pct === 100 ? "bg-emerald-500" : stats.pct > 0 ? "bg-yellow-500" : "bg-white/5"
                        }`}
                        style={{ width: `${stats.pct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Ana İçerik: Aktif Mahal ─── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeMahal && (
            <>
              {/* Mahal Başlık */}
              <div className="px-6 py-4 border-b border-white/10 bg-slate-900/30 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => { setActiveMahalIndex((p) => Math.max(p - 1, 0)); setAutoPlay(false); }}
                      disabled={activeMahalIndex === 0}
                      className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-20 transition-colors text-white/60"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div>
                      <h2 className="text-white font-bold text-xl tracking-wide">{activeMahal.name}</h2>
                      <p className="text-white/40 text-xs mt-0.5">
                        {activeMahal.floor.name} • {activeStats.total} kalem
                      </p>
                    </div>
                    <button
                      onClick={() => { setActiveMahalIndex((p) => Math.min(p + 1, mahaller.length - 1)); setAutoPlay(false); }}
                      disabled={activeMahalIndex === mahaller.length - 1}
                      className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-20 transition-colors text-white/60"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Mahal İstatistikleri */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-emerald-400 font-bold text-lg">{activeStats.done}</span>
                      <span className="text-white/40 text-xs">Tamamlandı</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="text-yellow-400 font-bold text-lg">{activeStats.inProgress}</span>
                      <span className="text-white/40 text-xs">Yapılıyor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/60" />
                      <span className="text-red-400 font-bold text-lg">{activeStats.total - activeStats.done - activeStats.inProgress}</span>
                      <span className="text-white/40 text-xs">Yapılmadı</span>
                    </div>
                    <div className="ml-2 flex items-center gap-2">
                      <div className="w-32 h-3 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-700"
                          style={{ width: `${activeStats.pct}%` }}
                        />
                      </div>
                      <span className="text-white font-bold text-lg">%{activeStats.pct}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kalemler Tablosu */}
              <div className="flex-1 overflow-auto">
                <table className="w-full">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-800/90 backdrop-blur-sm border-b border-white/10">
                      <th className="text-left px-4 py-3 text-white/50 text-xs font-medium w-12">#</th>
                      <th className="text-left px-4 py-3 text-white/50 text-xs font-medium w-24">Yer</th>
                      <th className="text-left px-4 py-3 text-white/50 text-xs font-medium w-28">Proje Durumu</th>
                      <th className="text-left px-4 py-3 text-white/50 text-xs font-medium">İmalat Açıklaması</th>
                      <th className="text-left px-4 py-3 text-white/50 text-xs font-medium w-28">Disiplin</th>
                      <th className="text-left px-4 py-3 text-white/50 text-xs font-medium w-32">İmalat Durumu</th>
                      <th className="text-left px-4 py-3 text-white/50 text-xs font-medium w-28">Aksiyon</th>
                      <th className="text-left px-4 py-3 text-white/50 text-xs font-medium w-28">Sorumlu</th>
                      <th className="text-left px-4 py-3 text-white/50 text-xs font-medium w-28">Taşeron</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeMahal.kalemler
                      .sort((a, b) => a.siraNo - b.siraNo)
                      .map((kalem) => {
                        const durumColor =
                          kalem.imalatDurumu === "TAMAMLANDI"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : kalem.imalatDurumu === "YAPILIYOR"
                            ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                            : "bg-red-500/10 text-red-400/60 border-red-500/20";

                        const rowBg =
                          kalem.imalatDurumu === "TAMAMLANDI"
                            ? "bg-emerald-500/[0.03]"
                            : kalem.imalatDurumu === "YAPILIYOR"
                            ? "bg-yellow-500/[0.03]"
                            : "";

                        return (
                          <tr
                            key={kalem.id}
                            className={`border-b border-white/5 hover:bg-white/5 transition-colors ${rowBg}`}
                          >
                            <td className="px-4 py-2.5 text-white/30 text-xs font-mono">
                              {kalem.siraNo}
                            </td>
                            <td className="px-4 py-2.5 text-white/60 text-xs">
                              {YER_LABELS[kalem.yer] || kalem.yer}
                            </td>
                            <td className="px-4 py-2.5 text-white/60 text-xs">
                              {PROJE_DURUMU_LABELS[kalem.projeDurumu] || kalem.projeDurumu}
                            </td>
                            <td className="px-4 py-2.5 text-white text-sm font-medium">
                              {kalem.imalatAciklama}
                            </td>
                            <td className="px-4 py-2.5 text-white/50 text-xs">
                              {kalem.discipline?.name || "—"}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold border ${durumColor}`}>
                                {IMALAT_DURUMU_LABELS[kalem.imalatDurumu] || kalem.imalatDurumu}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-white/50 text-xs">
                              {kalem.aksiyon || "—"}
                            </td>
                            <td className="px-4 py-2.5 text-white/50 text-xs">
                              {kalem.sorumlu || "—"}
                            </td>
                            <td className="px-4 py-2.5 text-white/50 text-xs">
                              {kalem.ilgiliTaseron || "—"}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ═══ Alt Bar: Kısayollar ═══ */}
      <div className="flex items-center justify-center gap-6 px-4 py-1.5 bg-slate-900/80 border-t border-white/10 shrink-0">
        <span className="text-white/25 text-[10px]">← → Mahaller arası geçiş</span>
        <span className="text-white/25 text-[10px]">Boşluk: Otomatik oynat</span>
        <span className="text-white/25 text-[10px]">F: Tam ekran</span>
        <span className="text-white/25 text-[10px]">S: Kenar çubuğu</span>
        <span className="text-white/25 text-[10px]">ESC: Kapat</span>
      </div>
    </div>
  );
}
