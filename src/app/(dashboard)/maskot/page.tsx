"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Web Speech API type declarations for build compatibility
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  Mic,
  MicOff,
  Send,
  Settings,
  Volume2,
  VolumeX,
  Trash2,
  RotateCcw,
  MessageSquare,
  Bot,
  Sparkles,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";

// ─── Tipler ───
interface Mascot {
  id: string;
  name: string;
  role: "MIMAR" | "MUHENDIS" | "KOORDINATOR";
  gender: "KADIN" | "ERKEK";
  personality: string;
  emoji: string;
  primaryColor: string;
  voicePitch: number;
  voiceRate: number;
  elevenLabsVoiceId: string | null;
  isDefault: boolean;
  _count?: { conversations: number };
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

const roleLabels: Record<string, string> = {
  MIMAR: "Mimar",
  MUHENDIS: "Mühendis",
  KOORDINATOR: "Koordinatör",
};

const roleColors: Record<string, string> = {
  MIMAR: "from-violet-500 to-purple-600",
  MUHENDIS: "from-blue-500 to-cyan-600",
  KOORDINATOR: "from-amber-500 to-orange-600",
};

const roleBgColors: Record<string, string> = {
  MIMAR: "bg-violet-500/10 border-violet-500/30",
  MUHENDIS: "bg-blue-500/10 border-blue-500/30",
  KOORDINATOR: "bg-amber-500/10 border-amber-500/30",
};

// ─── Avatar SVG Bileşeni ───
function MascotAvatar({
  mascot,
  isTalking,
  isListening,
  size = 200,
}: {
  mascot: Mascot;
  isTalking: boolean;
  isListening: boolean;
  size?: number;
}) {
  const [blinkOpen, setBlinkOpen] = useState(true);
  const [mouthOpen, setMouthOpen] = useState(false);

  // Göz kırpma
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinkOpen(false);
      setTimeout(() => setBlinkOpen(true), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  // Konuşma animasyonu
  useEffect(() => {
    if (!isTalking) {
      setMouthOpen(false);
      return;
    }
    const talkInterval = setInterval(() => {
      setMouthOpen((prev) => !prev);
    }, 150);
    return () => clearInterval(talkInterval);
  }, [isTalking]);

  const isWoman = mascot.gender === "KADIN";
  const skinColor = "#F4C7A3";
  const hairColor = isWoman ? "#2C1810" : "#1A1A2E";
  const helmetColor = mascot.role === "MIMAR" ? "#8B5CF6" : mascot.role === "MUHENDIS" ? "#3B82F6" : "#F59E0B";
  const shirtColor = mascot.role === "KOORDINATOR" ? "#1E293B" : "#F8FAFC";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Dinleme halkası */}
      {isListening && (
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-20"
          style={{ backgroundColor: helmetColor }}
        />
      )}
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className={`transition-transform duration-300 ${isTalking ? "animate-bounce-subtle" : ""}`}
      >
        {/* Vücut / Gömlek */}
        <ellipse cx="100" cy="185" rx="55" ry="30" fill={shirtColor} />
        {mascot.role === "KOORDINATOR" && (
          <>
            <rect x="88" y="158" width="24" height="20" rx="2" fill={shirtColor} />
            <line x1="95" y1="162" x2="95" y2="175" stroke="#CBD5E1" strokeWidth="1.5" />
            <line x1="105" y1="162" x2="105" y2="175" stroke="#CBD5E1" strokeWidth="1.5" />
            {/* Kravat */}
            <polygon points="100,158 94,168 100,178 106,168" fill="#EF4444" />
          </>
        )}

        {/* Boyun */}
        <rect x="90" y="140" width="20" height="20" rx="5" fill={skinColor} />

        {/* Yüz */}
        <ellipse cx="100" cy="110" rx="45" ry="50" fill={skinColor} />

        {/* Saç */}
        {isWoman ? (
          <>
            <ellipse cx="100" cy="75" rx="46" ry="35" fill={hairColor} />
            {/* Uzun saç */}
            <path d="M55,85 Q50,130 60,155" stroke={hairColor} strokeWidth="12" fill="none" strokeLinecap="round" />
            <path d="M145,85 Q150,130 140,155" stroke={hairColor} strokeWidth="12" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="100" cy="78" rx="46" ry="32" fill={hairColor} />
          </>
        )}

        {/* Baret / Kask */}
        <ellipse cx="100" cy="68" rx="48" ry="20" fill={helmetColor} />
        <rect x="55" y="60" width="90" height="15" rx="5" fill={helmetColor} />
        <rect x="92" y="48" width="16" height="15" rx="4" fill={helmetColor} opacity="0.8" />

        {/* Gözler */}
        {blinkOpen ? (
          <>
            <ellipse cx="82" cy="105" rx="7" ry="8" fill="white" />
            <ellipse cx="118" cy="105" rx="7" ry="8" fill="white" />
            <circle cx="83" cy="105" r="4" fill="#1A1A2E" />
            <circle cx="119" cy="105" r="4" fill="#1A1A2E" />
            <circle cx="84.5" cy="103.5" r="1.5" fill="white" />
            <circle cx="120.5" cy="103.5" r="1.5" fill="white" />
          </>
        ) : (
          <>
            <line x1="75" y1="105" x2="89" y2="105" stroke="#1A1A2E" strokeWidth="2" strokeLinecap="round" />
            <line x1="111" y1="105" x2="125" y2="105" stroke="#1A1A2E" strokeWidth="2" strokeLinecap="round" />
          </>
        )}

        {/* Kaşlar */}
        <path d="M74,94 Q82,90 90,94" stroke={hairColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M110,94 Q118,90 126,94" stroke={hairColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* Burun */}
        <path d="M98,112 Q100,118 102,112" stroke="#D4A574" strokeWidth="1.5" fill="none" />

        {/* Ağız */}
        {mouthOpen ? (
          <ellipse cx="100" cy="128" rx="10" ry={isTalking ? 7 : 4} fill="#C0392B" />
        ) : (
          <path
            d="M90,126 Q100,134 110,126"
            stroke="#C0392B"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Gözlük (Mühendis için) */}
        {mascot.role === "MUHENDIS" && (
          <>
            <rect x="72" y="96" width="22" height="18" rx="4" stroke="#374151" strokeWidth="2" fill="none" />
            <rect x="106" y="96" width="22" height="18" rx="4" stroke="#374151" strokeWidth="2" fill="none" />
            <line x1="94" y1="105" x2="106" y2="105" stroke="#374151" strokeWidth="2" />
          </>
        )}

        {/* Küpe (Kadın Mimar için) */}
        {isWoman && mascot.role === "MIMAR" && (
          <>
            <circle cx="56" cy="115" r="3" fill="#F59E0B" />
            <circle cx="144" cy="115" r="3" fill="#F59E0B" />
          </>
        )}
      </svg>
    </div>
  );
}

// ─── Ana Sayfa ───
export default function MaskotPage() {
  const [mascots, setMascots] = useState<Mascot[]>([]);
  const [activeMascot, setActiveMascot] = useState<Mascot | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

  // Mobile mode detection (QR'dan gelen kullanıcılar)
  const isMobile = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).has("mobile");
  }, []);

  // Mobile modda sidebar'ı gizle
  useEffect(() => {
    if (!isMobile) return;
    document.body.classList.add("maskot-mobile-mode");
    return () => document.body.classList.remove("maskot-mobile-mode");
  }, [isMobile]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<any>(null);
  const lastSentRef = useRef<string>("");
  const lastSentTimeRef = useRef<number>(0);
  const isListeningRef = useRef(false);
  const ttsAbortRef = useRef<AbortController | null>(null);

  // Maskotları yükle
  const fetchMascots = useCallback(async () => {
    try {
      const res = await fetch("/api/maskot/karakterler");
      if (res.ok) {
        const data: Mascot[] = await res.json();
        setMascots(data);
        if (data.length > 0) {
          const defaultMascot = data.find((m) => m.isDefault) || data[0];
          setActiveMascot(defaultMascot);
        }
      }
    } catch {
      toast.error("Maskotlar yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMascots();
    synthRef.current = window.speechSynthesis;
  }, [fetchMascots]);

  // Chat scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Mesaj gönder ───
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !activeMascot || isSending) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        text: text.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInputText("");
      setIsSending(true);

      // Yeni mesaj göndermeden önce önceki sesi durdur
      stopAllAudio();

      try {
        const res = await fetch("/api/maskot/sohbet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mascotId: activeMascot.id,
            message: text.trim(),
            source: "tv",
          }),
        });

        if (!res.ok) throw new Error();
        const data = await res.json();

        const aiMsg: ChatMessage = {
          id: data.id || `ai-${Date.now()}`,
          role: "assistant",
          text: data.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);

        // TTS ile oku
        if (ttsEnabled) {
          speak(data.response, activeMascot);
        }
      } catch {
        toast.error("Cevap alınamadı");
      } finally {
        setIsSending(false);
      }
    },
    [activeMascot, isSending, ttsEnabled]
  );

  // ─── Emoji temizle ───
  const stripEmojis = (text: string): string => {
    return text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, "")
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, "")
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, "")
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "")
      .replace(/[\u{2600}-\u{26FF}]/gu, "")
      .replace(/[\u{2700}-\u{27BF}]/gu, "")
      .replace(/[\u{FE00}-\u{FE0F}]/gu, "")
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, "")
      .replace(/[\u{1FA00}-\u{1FA6F}]/gu, "")
      .replace(/[\u{1FA70}-\u{1FAFF}]/gu, "")
      .replace(/[\u{200D}]/gu, "")
      .replace(/[\u{20E3}]/gu, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  };

  // ─── Tüm sesleri durdur ───
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAllAudio = useCallback(() => {
    // Devam eden TTS fetch'i iptal et
    if (ttsAbortRef.current) {
      ttsAbortRef.current.abort();
      ttsAbortRef.current = null;
    }
    // HTML5 Audio durdur
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      if (audioRef.current.src) URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    // Web Speech durdur
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsTalking(false);
  }, []);

  // ─── TTS (ElevenLabs + fallback Web Speech) ───
  const speak = useCallback(
    async (text: string, mascot: Mascot) => {
      const cleanText = stripEmojis(text);
      if (!cleanText) return;

      // Önce tüm mevcut sesleri durdur
      stopAllAudio();

      // Yeni AbortController oluştur
      const abortController = new AbortController();
      ttsAbortRef.current = abortController;

      // ElevenLabs dene
      try {
        setIsTalking(true);
        const res = await fetch("/api/maskot/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: cleanText,
            gender: mascot.gender,
            role: mascot.role,
            voiceId: mascot.elevenLabsVoiceId || undefined,
          }),
          signal: abortController.signal,
        });

        if (res.ok) {
          // İptal edildiyse ses çalma
          if (abortController.signal.aborted) return;

          const audioBlob = await res.blob();
          const audioUrl = URL.createObjectURL(audioBlob);

          // İptal edildiyse URL'yi temizle
          if (abortController.signal.aborted) {
            URL.revokeObjectURL(audioUrl);
            return;
          }

          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          audio.onended = () => {
            setIsTalking(false);
            URL.revokeObjectURL(audioUrl);
            audioRef.current = null;
          };
          audio.onerror = () => {
            setIsTalking(false);
            URL.revokeObjectURL(audioUrl);
            audioRef.current = null;
          };
          await audio.play();
          return; // ElevenLabs başarılı, fallback'e geçme
        }
      } catch (e: any) {
        if (e?.name === "AbortError") { setIsTalking(false); return; }
        console.warn("ElevenLabs TTS başarısız, Web Speech fallback:", e);
      }

      // Fallback: Web Speech API (sadece ElevenLabs başarısız olursa)
      if (synthRef.current) {
        synthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = "tr-TR";
        utterance.pitch = mascot.voicePitch;
        utterance.rate = mascot.voiceRate;

        const voices = synthRef.current.getVoices();
        const trVoice = voices.find(
          (v: any) =>
            v.lang.startsWith("tr") &&
            (mascot.gender === "KADIN"
              ? v.name.toLowerCase().includes("female") || v.name.includes("Filiz")
              : true)
        );
        if (trVoice) utterance.voice = trVoice;

        utterance.onstart = () => setIsTalking(true);
        utterance.onend = () => setIsTalking(false);
        utterance.onerror = () => setIsTalking(false);

        synthRef.current.speak(utterance);
      } else {
        setIsTalking(false);
      }
    },
    [stopAllAudio]
  );

  // ─── Ses Tanıma (STT) ───
  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      recognitionRef.current?.stop();
      isListeningRef.current = false;
      setIsListening(false);
      return;
    }

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      toast.error("Bu tarayıcı ses tanımayı desteklemiyor");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "tr-TR";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let processedUpTo = 0;

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = processedUpTo; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
          processedUpTo = i + 1;
        }
      }
      const trimmed = finalTranscript.trim();
      if (!trimmed) return;

      // Duplicate kontrolü: aynı mesajı 3 saniye içinde tekrar gönderme
      const now = Date.now();
      if (trimmed === lastSentRef.current && now - lastSentTimeRef.current < 3000) {
        return;
      }
      lastSentRef.current = trimmed;
      lastSentTimeRef.current = now;
      sendMessage(trimmed);
    };

    recognition.onerror = (e: any) => {
      // no-speech gibi geçici hatalarda durma
      if (e.error === "no-speech" || e.error === "aborted") return;
      isListeningRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      // Continuous mode: ref üzerinden güncel değeri kontrol et
      if (isListeningRef.current) {
        try {
          processedUpTo = 0;
          recognition.start();
        } catch {
          isListeningRef.current = false;
          setIsListening(false);
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    isListeningRef.current = true;
    setIsListening(true);
    toast.success("🎤 Dinliyorum...");
  }, [sendMessage]);

  // ─── Maskot değiştir ───
  const switchMascot = (mascot: Mascot) => {
    if (synthRef.current) synthRef.current.cancel();
    setIsTalking(false);
    setActiveMascot(mascot);
    setMessages([]);
    toast.success(`${mascot.emoji} ${mascot.name} aktif!`);
  };

  // ─── Sohbeti temizle ───
  const clearChat = () => {
    setMessages([]);
    if (synthRef.current) synthRef.current.cancel();
    setIsTalking(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">🤖</div>
          <p className="text-lg text-muted-foreground">Maskotlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (mascots.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-6xl mb-4">🎭</div>
            <h2 className="text-2xl font-bold mb-2">Maskot Bulunamadı</h2>
            <p className="text-muted-foreground mb-6">
              Henüz bir maskot oluşturulmamış. Ayarlar sayfasından maskot ekleyebilirsiniz.
            </p>
            <Button asChild>
              <a href="/maskot/ayarlar">
                <Settings className="h-4 w-4 mr-2" /> Maskot Ayarları
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-gradient-to-b from-background to-muted/20 ${isMobile ? "fixed inset-0 z-50 h-[100dvh]" : "h-screen"}`}>
      {/* ─── Header: Maskot seçimi ─── */}
      <div className={`border-b bg-background/80 backdrop-blur-sm shrink-0 ${isMobile ? "px-2 py-1.5 safe-area-top" : "px-4 py-3"}`}>
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {mascots.map((m) => (
              <button
                key={m.id}
                onClick={() => switchMascot(m)}
                className={`flex items-center gap-1 ${isMobile ? "px-3 py-1.5" : "px-2.5 py-1"} rounded-full border transition-all whitespace-nowrap text-xs ${
                  activeMascot?.id === m.id
                    ? `bg-gradient-to-r ${roleColors[m.role]} text-white border-transparent shadow-md scale-105`
                    : "border-muted hover:border-foreground/20 hover:bg-muted/50"
                }`}
              >
                <span className={isMobile ? "text-xs" : "text-sm"}>{m.emoji}</span>
                <span className="font-medium">{m.name}</span>
                {!isMobile && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {roleLabels[m.role]}
                  </Badge>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-0.5 ml-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className={isMobile ? "h-8 w-8" : ""}
              onClick={() => setTtsEnabled(!ttsEnabled)}
              title={ttsEnabled ? "Sesi kapat" : "Sesi aç"}
            >
              {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            {!isMobile && (
              <>
                <Button variant="ghost" size="icon" onClick={() => setShowQR(true)} title="QR Kod">
                  <QrCode className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <a href="/maskot/ayarlar" title="Ayarlar">
                    <Settings className="h-4 w-4" />
                  </a>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Ana içerik ─── */}
      <div className={`flex-1 flex overflow-hidden w-full ${isMobile ? "flex-col" : "flex-col lg:flex-row max-w-6xl mx-auto"}`}>
        {/* Avatar alanı */}
        <div className={`flex items-center shrink-0 ${
          isMobile
            ? "flex-row gap-3 px-3 py-2 border-b bg-muted/20"
            : "flex-col justify-center p-6 lg:p-10 lg:w-2/5"
        }`}>
          {activeMascot && (
            <>
              <div className="relative shrink-0">
                <MascotAvatar
                  mascot={activeMascot}
                  isTalking={isTalking}
                  isListening={isListening}
                  size={isMobile ? 80 : 240}
                />
              </div>

              {isMobile ? (
                /* Mobile: yatay kompakt layout */
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold truncate">{activeMascot.emoji} {activeMascot.name}</h2>
                    <div className="mt-0.5">
                      {isTalking ? (
                        <Badge className="bg-emerald-500 animate-pulse gap-1 text-[10px] px-1.5 py-0">
                          <Volume2 className="h-2.5 w-2.5" /> Konuşuyor
                        </Badge>
                      ) : isListening ? (
                        <Badge className="bg-red-500 animate-pulse gap-1 text-[10px] px-1.5 py-0">
                          <Mic className="h-2.5 w-2.5" /> Dinliyor
                        </Badge>
                      ) : isSending ? (
                        <Badge className="bg-blue-500 animate-pulse gap-1 text-[10px] px-1.5 py-0">
                          <Sparkles className="h-2.5 w-2.5" /> Düşünüyor
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0">
                          <Bot className="h-2.5 w-2.5" /> Hazır
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={toggleListening}
                    className={`rounded-full w-11 h-11 shrink-0 ml-2 ${
                      isListening
                        ? "bg-red-500 hover:bg-red-600 animate-pulse"
                        : `bg-gradient-to-r ${roleColors[activeMascot.role]} hover:opacity-90`
                    }`}
                  >
                    {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                </div>
              ) : (
                /* Desktop: dikey layout */
                <>
                  {/* Durum göstergesi */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2" style={{position: 'relative', bottom: 'auto', left: 'auto', transform: 'none', marginTop: '-0.5rem'}}>
                  </div>
                  <div className="mt-2">
                    {isTalking ? (
                      <Badge className="bg-emerald-500 animate-pulse gap-1">
                        <Volume2 className="h-3 w-3" /> Konuşuyor...
                      </Badge>
                    ) : isListening ? (
                      <Badge className="bg-red-500 animate-pulse gap-1">
                        <Mic className="h-3 w-3" /> Dinliyor...
                      </Badge>
                    ) : isSending ? (
                      <Badge className="bg-blue-500 animate-pulse gap-1">
                        <Sparkles className="h-3 w-3" /> Düşünüyor...
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <Bot className="h-3 w-3" /> Hazır
                      </Badge>
                    )}
                  </div>

                  <h2 className="text-xl font-bold mt-6">{activeMascot.emoji} {activeMascot.name}</h2>
                  <p className="text-sm text-muted-foreground">{roleLabels[activeMascot.role]}</p>

                  {/* Mikrofon butonu */}
                  <Button
                    size="lg"
                    onClick={toggleListening}
                    className={`mt-6 rounded-full w-16 h-16 ${
                      isListening
                        ? "bg-red-500 hover:bg-red-600 animate-pulse"
                        : `bg-gradient-to-r ${roleColors[activeMascot.role]} hover:opacity-90`
                    }`}
                  >
                    {isListening ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    {isListening ? "Durdurmak için basın" : "Konuşmak için basın"}
                  </p>
                </>
              )}
            </>
          )}
        </div>

        {/* Chat alanı */}
        <div className={`flex-1 flex flex-col min-h-0 ${isMobile ? "" : "lg:w-3/5 border-l"}`}>
          {/* Chat header */}
          <div className={`flex items-center justify-between border-b bg-muted/30 shrink-0 ${isMobile ? "px-3 py-1.5" : "px-4 py-2"}`}>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Sohbet</span>
              {messages.length > 0 && (
                <Badge variant="secondary" className="text-xs">{messages.length}</Badge>
              )}
            </div>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" className={isMobile ? "h-7 text-xs" : ""} onClick={clearChat}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Temizle
              </Button>
            )}
          </div>

          {/* Mesajlar */}
          <div className={`flex-1 overflow-y-auto space-y-3 ${isMobile ? "p-3" : "p-4"}`}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Bot className={`${isMobile ? "h-8 w-8" : "h-12 w-12"} mb-3 opacity-30`} />
                <p className="text-sm">
                  {activeMascot?.name} ile konuşmaya başla!
                </p>
                <p className="text-xs mt-1">
                  Mikrofona bas veya yazarak mesaj gönder
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`${isMobile ? "max-w-[85%]" : "max-w-[80%]"} rounded-2xl px-3 py-2 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : `${roleBgColors[activeMascot?.role || "MIMAR"]} border rounded-bl-sm`
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">{activeMascot?.emoji}</span>
                      <span className="text-xs font-semibold">{activeMascot?.name}</span>
                    </div>
                  )}
                  <p className={`${isMobile ? "text-[13px]" : "text-sm"} whitespace-pre-wrap`}>{msg.text}</p>
                  <p className="text-[10px] opacity-50 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className={`rounded-2xl px-4 py-3 ${roleBgColors[activeMascot?.role || "MIMAR"]} border rounded-bl-sm`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">{activeMascot?.emoji}</span>
                    <span className="text-xs font-semibold">{activeMascot?.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-current rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className={`border-t bg-background shrink-0 ${isMobile ? "p-2 safe-area-bottom" : "p-3"}`}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(inputText);
              }}
              className="flex gap-2"
            >
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`${activeMascot?.name || "Maskot"}'a bir şey söyle...`}
                disabled={isSending}
                className={`flex-1 ${isMobile ? "h-10 text-[16px]" : ""}`}
              />
              <Button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className={`bg-gradient-to-r ${roleColors[activeMascot?.role || "MIMAR"]} ${isMobile ? "h-10 w-10 p-0" : ""}`}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* ─── QR Dialog ─── */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2">
              <QrCode className="h-5 w-5" /> Telefonla Bağlan
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <div className="mx-auto w-52 h-52 bg-white rounded-xl flex items-center justify-center p-3">
              <QRCodeSVG
                value={typeof window !== "undefined" ? `${window.location.origin}/maskot?mobile` : "https://santiye360.com/maskot?mobile"}
                size={190}
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Telefonunuzla QR kodu okutarak maskot sayfasını açabilirsiniz.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom animations */}
      <style jsx global>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 0.3s ease-in-out infinite;
        }
        /* Scrollbar gizle (mobil karakter listesi) */
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        /* Mobile safe area */
        .safe-area-top {
          padding-top: max(0.375rem, env(safe-area-inset-top));
        }
        .safe-area-bottom {
          padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
        }
        /* Mobile mode: sidebar ve layout padding gizle */
        .maskot-mobile-mode [data-sidebar],
        .maskot-mobile-mode .app-sidebar,
        .maskot-mobile-mode nav,
        .maskot-mobile-mode header {
          display: none !important;
        }
        .maskot-mobile-mode main {
          padding-left: 0 !important;
          margin-left: 0 !important;
        }
        .maskot-mobile-mode main > div {
          padding: 0 !important;
          padding-top: 0 !important;
        }
        .maskot-mobile-mode main > div > div.p-3,
        .maskot-mobile-mode main > div > div.sm\:p-6 {
          padding: 0 !important;
        }
        .maskot-mobile-mode footer {
          display: none !important;
        }
        /* iOS input zoom engelle */
        .maskot-mobile-mode input[type="text"] {
          font-size: 16px !important;
        }
      `}</style>
    </div>
  );
}
