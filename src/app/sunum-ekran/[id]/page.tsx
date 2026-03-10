"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";

interface Slide {
  id: number;
  imageUrl: string;
  fileName: string | null;
  caption: string | null;
  sortOrder: number;
}

interface Presentation {
  id: number;
  name: string;
  mode: string;
  interval: number;
  transition: string;
  isActive: boolean;
  logoUrl: string | null;
  showClock: boolean;
  tickerText: string | null;
  tickerSpeed: number;
  showProgress: boolean;
  countdownTimer: {
    id: string;
    title: string;
    targetDate: string;
    emoji: string;
    isActive: boolean;
  } | null;
  slides: Slide[];
}

/* ─── Ken Burns: rastgele pan & zoom ─── */
function randomKenBurns(): React.CSSProperties {
  const scale = 1.1 + Math.random() * 0.15;
  const tx = (Math.random() - 0.5) * 6;
  const ty = (Math.random() - 0.5) * 4;
  return { transform: `scale(${scale}) translate(${tx}%, ${ty}%)` };
}

/* ─── Hava durumu kodu → efekt tipi ─── */
type WeatherEffect = "sun" | "rain" | "snow" | "cloud" | "none";
interface WeatherInfo {
  temp: string;
  desc: string;
  emoji: string;
  effect: WeatherEffect;
}

function weatherCodeToEffect(code: number): { effect: WeatherEffect; emoji: string } {
  if ([113].includes(code)) return { effect: "sun", emoji: "☀️" };
  if ([116].includes(code)) return { effect: "sun", emoji: "⛅" };
  if ([119, 122].includes(code)) return { effect: "cloud", emoji: "☁️" };
  if ([248, 260].includes(code)) return { effect: "cloud", emoji: "🌫️" };
  if ([176, 263, 266, 281, 284, 293, 296, 299, 302, 305, 308, 311, 314, 317, 320, 353, 356, 359, 362, 365, 386, 389, 200].includes(code))
    return { effect: "rain", emoji: "🌧️" };
  if ([179, 182, 185, 227, 230, 323, 326, 329, 332, 335, 338, 368, 371, 374, 377, 392, 395].includes(code))
    return { effect: "snow", emoji: "❄️" };
  return { effect: "none", emoji: "🌤️" };
}

export default function SunumEkranPage() {
  const params = useParams();
  const id = params?.id as string;

  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clock, setClock] = useState("");
  const [kbStyle, setKbStyle] = useState<React.CSSProperties>({});
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number; expired: boolean } | null>(null);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch presentation data
  useEffect(() => {
    if (!id) return;
    fetch(`/api/sunum/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Sunum bulunamadı");
        return r.json();
      })
      .then(setPresentation)
      .catch((e) => setError(e.message));
  }, [id]);

  // Live clock
  useEffect(() => {
    if (!presentation?.showClock) return;
    function tick() {
      const now = new Date();
      setClock(
        now.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" }) +
        " · " +
        now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
      );
    }
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [presentation?.showClock]);

  // Countdown timer
  useEffect(() => {
    if (!presentation?.countdownTimer) { setCountdown(null); return; }
    const target = new Date(presentation.countdownTimer.targetDate).getTime();
    function calc() {
      const diff = target - Date.now();
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        expired: false,
      });
    }
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [presentation?.countdownTimer]);

  // Hava durumu (wttr.in — ücretsiz, API key gereksiz)
  useEffect(() => {
    let cancelled = false;
    async function fetchWeather() {
      try {
        const res = await fetch("https://wttr.in/Istanbul?format=j1", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const cur = data?.current_condition?.[0];
        if (!cur || cancelled) return;
        const code = parseInt(cur.weatherCode) || 0;
        const { effect, emoji } = weatherCodeToEffect(code);
        setWeather({
          temp: cur.temp_C + "°C",
          desc: cur.lang_tr?.[0]?.value || cur.weatherDesc?.[0]?.value || "",
          emoji,
          effect,
        });
      } catch {
        // Sessizce geç — hava durumu opsiyonel
      }
    }
    fetchWeather();
    const t = setInterval(fetchWeather, 15 * 60 * 1000); // 15 dk'da bir güncelle
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  // Auto advance for SLIDE mode
  useEffect(() => {
    if (!presentation || presentation.mode !== "SLIDE" || presentation.slides.length <= 1) return;

    const intervalMs = (presentation.interval || 5) * 1000;
    const transition = presentation.transition;

    if (transition === "kenburns") setKbStyle(randomKenBurns());

    timerRef.current = setInterval(() => {
      if (["fade", "kenburns", "blur", "flip", "wipe"].includes(transition)) {
        setIsVisible(false);
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % presentation.slides.length);
          setIsVisible(true);
          setProgress(0);
          if (transition === "kenburns") setKbStyle(randomKenBurns());
        }, 600);
      } else {
        setCurrentIndex((prev) => (prev + 1) % presentation.slides.length);
        setProgress(0);
      }
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [presentation]);

  // Progress bar
  useEffect(() => {
    if (!presentation?.showProgress || presentation.mode !== "SLIDE" || presentation.slides.length <= 1) return;
    const intervalMs = (presentation.interval || 5) * 1000;
    const step = 100 / (intervalMs / 50);

    progressRef.current = setInterval(() => {
      setProgress((prev) => Math.min(prev + step, 100));
    }, 50);

    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [presentation, currentIndex]);

  // Keyboard controls
  useEffect(() => {
    if (!presentation) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (presentation!.mode !== "SLIDE") return;
      const total = presentation!.slides.length;
      if (total === 0) return;
      switch (e.key) {
        case "ArrowRight":
        case " ":
          e.preventDefault();
          setCurrentIndex((prev) => (prev + 1) % total);
          setIsVisible(true);
          setProgress(0);
          if (presentation!.transition === "kenburns") setKbStyle(randomKenBurns());
          break;
        case "ArrowLeft":
          e.preventDefault();
          setCurrentIndex((prev) => (prev - 1 + total) % total);
          setIsVisible(true);
          setProgress(0);
          if (presentation!.transition === "kenburns") setKbStyle(randomKenBurns());
          break;
        case "Escape":
          if (document.fullscreenElement) document.exitFullscreen?.();
          break;
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [presentation]);

  // Auto-hide cursor
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    function handleMouseMove() {
      if (containerRef.current) containerRef.current.style.cursor = "default";
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (containerRef.current) containerRef.current.style.cursor = "none";
      }, 2000);
    }
    window.addEventListener("mousemove", handleMouseMove);
    timeout = setTimeout(() => {
      if (containerRef.current) containerRef.current.style.cursor = "none";
    }, 3000);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  /* ─── Error / Loading / Empty ─── */
  if (error) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-2">{error}</p>
          <p className="text-sm text-gray-400">Bu sunum mevcut değil veya silinmiş olabilir.</p>
        </div>
      </div>
    );
  }

  if (!presentation) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (presentation.slides.length === 0) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-2">{presentation.name}</p>
          <p className="text-sm text-gray-400">Bu sunumda henüz resim bulunmuyor.</p>
        </div>
      </div>
    );
  }

  /* ─── Overlays ─── */
  const hasTicker = !!presentation.tickerText;
  const tickerDuration = Math.max(8, 3000 / (presentation.tickerSpeed || 30));

  // Ticker'ı sabit key ile render et — slayt değişiminde yeniden mount olmasın
  const tickerElement = hasTicker ? (
    <div key="ticker-persistent" className="fixed bottom-0 left-0 right-0 z-20 pointer-events-none overflow-hidden bg-black/60 backdrop-blur-sm">
      <div
        className="whitespace-nowrap py-2.5 text-white text-sm sm:text-base font-medium tracking-wide"
        style={{ animation: `ticker ${tickerDuration}s linear infinite` }}
      >
        <span className="mx-12">{presentation.tickerText}</span>
        <span className="mx-4 opacity-50">◆</span>
        <span className="mx-12">{presentation.tickerText}</span>
        <span className="mx-4 opacity-50">◆</span>
        <span className="mx-12">{presentation.tickerText}</span>
      </div>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-200%); }
        }
      `}</style>
    </div>
  ) : null;

  const overlayElements = (
    <>
      {/* Sol Üst — Logo */}
      {presentation.logoUrl && (
        <div className="fixed top-6 left-6 z-20 pointer-events-none">
          <img src={presentation.logoUrl} alt="" className="h-12 sm:h-16 object-contain drop-shadow-lg opacity-90" />
        </div>
      )}

      {/* Sağ Üst — Saat */}
      {presentation.showClock && clock && (
        <div className="fixed top-6 right-6 z-20 pointer-events-none">
          <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg">
            <p className="text-white text-sm sm:text-base font-medium tracking-wide">{clock}</p>
          </div>
        </div>
      )}

      {/* Sağ Alt — Geri Sayım Sayacı */}
      {countdown && presentation.countdownTimer && (
        <div
          className="fixed right-6 z-20 pointer-events-none"
          style={{ bottom: hasTicker ? "3.5rem" : "1.5rem" }}
        >
          <div className={`backdrop-blur-sm px-4 py-3 rounded-xl ${countdown.expired ? "bg-emerald-900/70" : "bg-black/60"}`}>
            <p className="text-white/80 text-[10px] sm:text-xs font-medium text-center mb-1.5 tracking-wide">
              {presentation.countdownTimer.emoji} {presentation.countdownTimer.title}
            </p>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {[
                { val: countdown.days, label: "Gün" },
                { val: countdown.hours, label: "Saat" },
                { val: countdown.minutes, label: "Dk" },
                { val: countdown.seconds, label: "Sn" },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg sm:text-xl ${
                    countdown.expired ? "bg-emerald-500/40" : countdown.days === 0 && countdown.hours < 6 ? "bg-red-500/40 animate-pulse" : countdown.days === 0 ? "bg-amber-500/30" : "bg-white/10"
                  }`}>
                    {String(item.val).padStart(2, "0")}
                  </div>
                  <span className="text-white/60 text-[8px] sm:text-[10px] mt-0.5">{item.label}</span>
                </div>
              ))}
            </div>
            {countdown.expired && (
              <p className="text-emerald-300 text-[10px] sm:text-xs text-center mt-1.5 font-medium">✓ Süre Doldu</p>
            )}
          </div>
        </div>
      )}

      {/* Slayt Caption */}
      {presentation.mode === "SLIDE" && presentation.slides[currentIndex]?.caption && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          style={{ bottom: hasTicker ? "3.5rem" : "2.5rem" }}
        >
          <div className="bg-black/60 backdrop-blur-sm px-6 py-2 rounded-lg">
            <p className="text-white text-sm sm:text-lg font-medium">{presentation.slides[currentIndex].caption}</p>
          </div>
        </div>
      )}

      {/* İlerleme Çubuğu */}
      {presentation.showProgress && presentation.mode === "SLIDE" && presentation.slides.length > 1 && (
        <div className="fixed left-0 right-0 z-30 pointer-events-none" style={{ bottom: hasTicker ? "2.25rem" : 0 }}>
          <div className="h-1 bg-white/10">
            <div className="h-full bg-white/70 transition-[width] duration-100 ease-linear" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Hava Durumu Badge */}
      {weather && (
        <div
          className="fixed left-6 z-20 pointer-events-none"
          style={{ top: presentation.logoUrl ? "5.5rem" : "1.5rem" }}
        >
          <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="text-lg">{weather.emoji}</span>
            <div>
              <p className="text-white text-sm font-bold leading-tight">{weather.temp}</p>
              <p className="text-white/70 text-[10px] leading-tight">{weather.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* Hava Durumu Efekti */}
      {weather?.effect === "rain" && (
        <div key="weather-rain" className="fixed inset-0 z-10 pointer-events-none overflow-hidden">
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-[2px] bg-gradient-to-b from-transparent via-blue-300/40 to-blue-400/60 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                height: `${12 + Math.random() * 18}px`,
                animationName: "rainDrop",
                animationDuration: `${0.5 + Math.random() * 0.4}s`,
                animationDelay: `${Math.random() * 2}s`,
                animationIterationCount: "infinite",
                animationTimingFunction: "linear",
              }}
            />
          ))}
          <style>{`
            @keyframes rainDrop {
              0% { transform: translateY(-20px); opacity: 0; }
              10% { opacity: 1; }
              100% { transform: translateY(100vh); opacity: 0.3; }
            }
          `}</style>
        </div>
      )}

      {weather?.effect === "snow" && (
        <div key="weather-snow" className="fixed inset-0 z-10 pointer-events-none overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                left: `${Math.random() * 100}%`,
                width: `${3 + Math.random() * 5}px`,
                height: `${3 + Math.random() * 5}px`,
                opacity: 0.3 + Math.random() * 0.4,
                animationName: "snowFall",
                animationDuration: `${3 + Math.random() * 4}s`,
                animationDelay: `${Math.random() * 5}s`,
                animationIterationCount: "infinite",
                animationTimingFunction: "ease-in-out",
              }}
            />
          ))}
          <style>{`
            @keyframes snowFall {
              0% { transform: translateY(-10px) translateX(0px) rotate(0deg); opacity: 0; }
              10% { opacity: 0.7; }
              50% { transform: translateY(50vh) translateX(30px) rotate(180deg); }
              100% { transform: translateY(100vh) translateX(-20px) rotate(360deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {weather?.effect === "sun" && (
        <div key="weather-sun" className="fixed inset-0 z-10 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(255,200,50,0.12) 0%, rgba(255,180,0,0.05) 40%, transparent 70%)",
              animation: "sunPulse 4s ease-in-out infinite",
            }}
          />
          <style>{`
            @keyframes sunPulse {
              0%, 100% { transform: scale(1); opacity: 0.8; }
              50% { transform: scale(1.15); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </>
  );

  /* ─── Transition classes ─── */
  function getSlideClasses(): string {
    const t = presentation!.transition;
    if (t === "fade") return `transition-opacity duration-700 ease-in-out ${isVisible ? "opacity-100" : "opacity-0"}`;
    if (t === "zoom") return `transition-all duration-700 ease-in-out ${isVisible ? "scale-100 opacity-100" : "scale-110 opacity-0"}`;
    if (t === "kenburns") return `transition-all duration-[2s] ease-in-out ${isVisible ? "opacity-100" : "opacity-0"}`;
    if (t === "blur") return `transition-all duration-700 ease-in-out ${isVisible ? "opacity-100 blur-0" : "opacity-0 blur-lg"}`;
    if (t === "flip") return `transition-all duration-700 ease-in-out [transform-style:preserve-3d] ${isVisible ? "opacity-100 [transform:rotateY(0deg)]" : "opacity-0 [transform:rotateY(90deg)]"}`;
    if (t === "wipe") return `transition-all duration-700 ease-in-out ${isVisible ? "[clip-path:inset(0_0_0_0)]" : "[clip-path:inset(0_100%_0_0)]"}`;
    if (t === "slide") return `transition-all duration-700 ease-in-out ${isVisible ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"}`;
    return "";
  }

  // ── SLIDE MODE ──
  if (presentation.mode === "SLIDE") {
    const slide = presentation.slides[currentIndex];
    return (
      <div
        ref={containerRef}
        className="h-screen w-screen bg-black overflow-hidden select-none"
        onClick={toggleFullscreen}
      >
        <div className="relative h-full w-full overflow-hidden" style={{ perspective: "1200px" }}>
          <img
            key={slide.id}
            src={slide.imageUrl}
            alt=""
            className={`h-full w-full object-contain ${getSlideClasses()}`}
            style={presentation.transition === "kenburns" ? kbStyle : undefined}
          />
        </div>

        {/* Dots (if no progress bar) */}
        {presentation.slides.length > 1 && !presentation.showProgress && (
          <div
            className="fixed left-1/2 -translate-x-1/2 flex gap-1.5 z-10"
            style={{ bottom: hasTicker ? "3.5rem" : "1rem" }}
          >
            {presentation.slides.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex ? "w-6 bg-white/80" : "w-1.5 bg-white/30"
                }`}
              />
            ))}
          </div>
        )}

        {tickerElement}
        {overlayElements}
      </div>
    );
  }

  // ── GRID MODES ──
  const gridCols: Record<string, string> = {
    GRID_2: "grid-cols-2",
    GRID_3: "grid-cols-3",
    GRID_4: "grid-cols-2 grid-rows-2",
    GRID_6: "grid-cols-3 grid-rows-2",
  };
  const gridCount: Record<string, number> = { GRID_2: 2, GRID_3: 3, GRID_4: 4, GRID_6: 6 };
  const count = gridCount[presentation.mode] || 4;
  const visibleSlides = presentation.slides.slice(0, count);

  return (
    <div
      ref={containerRef}
      className="h-screen w-screen bg-black overflow-hidden select-none"
      onClick={toggleFullscreen}
    >
      <div className={`grid ${gridCols[presentation.mode]} h-full w-full gap-1`}>
        {visibleSlides.map((slide) => (
          <div key={slide.id} className="overflow-hidden relative">
            <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" />
            {slide.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 text-white text-xs sm:text-sm text-center">
                {slide.caption}
              </div>
            )}
          </div>
        ))}
      </div>
      {tickerElement}
      {overlayElements}
    </div>
  );
}
