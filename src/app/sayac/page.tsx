"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Timer,
  Plus,
  Trash2,
  Pencil,
  PartyPopper,
  Rocket,
  Flame,
  Trophy,
  Clock,
  CalendarDays,
  Zap,
  Target,
  X,
  Check,
  ArrowLeft,
  Home,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// ─── Motive edici ve eğlenceli yazılar ───
const motivationalMessages = [
  { text: "Her tuğla bir zafer, her kat bir efsane! 🧱", icon: Trophy },
  { text: "İşveren geldiğinde çenesi yere düşecek! 😎", icon: Rocket },
  { text: "Bu şantiyede imkansız diye bir şey yok! 💪", icon: Flame },
  { text: "Takım çalışması = Süper güç! 🦸‍♂️", icon: Zap },
  { text: "Hedefe kilitlen, gerisini bırak! 🎯", icon: Target },
  { text: "Molada çay içmeyi unutmayın! ☕", icon: Clock },
  { text: "Patron gülerse, herkes güler! 😄", icon: PartyPopper },
  { text: "Bugün de harikalar yaratıyoruz! ✨", icon: Flame },
  { text: "Şantiyenin yıldızları iş başında! ⭐", icon: Trophy },
  { text: "Hız kesmeyin, zirve yakın! 🏔️", icon: Rocket },
  { text: "Bu tempo ile erken bile bitiririz! 🚀", icon: Rocket },
  { text: "Kalite bizim işimiz, hız bizim tutkumuz! 🔥", icon: Flame },
  { text: "Her gün bir adım daha yakınız! 👣", icon: Target },
  { text: "Usta işi, göz nuru! 👁️", icon: Trophy },
  { text: "Demir gibi irade, çelik gibi takım! 🦾", icon: Zap },
  { text: "Salı günü geldiğinde gururla göstereceğiz! 🏆", icon: Trophy },
  { text: "Beton kurumadan biz bitiriyoruz! 💨", icon: Rocket },
  { text: "Şantiye360 ekibi durdurulamaz! 🔱", icon: Zap },
  { text: "Azim + Emek = Başarı 📐", icon: Target },
  { text: "Bir vinç kaldıramaz ama takım her şeyi kaldırır! 🏗️", icon: Flame },
];

const expiredMessages = [
  { text: "Süre doldu! Ama biz zaten bitirmiştik, değil mi? 😏", icon: Trophy },
  { text: "Zaman dolmuş ama kalite asla bitmez! 🏅", icon: PartyPopper },
  { text: "İşveren şimdi gelsin, hazırız! 🎉", icon: PartyPopper },
  { text: "Şantiyenin şampiyonları görev tamamladı! 🥇", icon: Trophy },
  { text: "Yeni hedef koymanın zamanı geldi! 🎯", icon: Rocket },
];

const emojiOptions = ["🏗️", "🚀", "🔥", "⭐", "🎯", "💪", "🏆", "⚡", "🏠", "🔨", "🧱", "🪜"];

interface CountdownTimer {
  id: string;
  title: string;
  description: string | null;
  targetDate: string;
  emoji: string;
  isActive: boolean;
  createdAt: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function getTimeLeft(targetDate: string): TimeLeft {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    total: diff,
  };
}

// ─── Geri sayım kartı ────
function CountdownCard({
  timer,
  onEdit,
  onDelete,
  isHighlighted,
}: {
  timer: CountdownTimer;
  onEdit: (t: CountdownTimer) => void;
  onDelete: (id: string) => void;
  isHighlighted: boolean;
}) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft(timer.targetDate));
  const [msgIndex, setMsgIndex] = useState(0);
  const [animateDigit, setAnimateDigit] = useState<string | null>(null);
  const prevSeconds = useRef(timeLeft.seconds);

  useEffect(() => {
    const interval = setInterval(() => {
      const tl = getTimeLeft(timer.targetDate);
      setTimeLeft(tl);
      if (tl.seconds !== prevSeconds.current) {
        setAnimateDigit("seconds");
        prevSeconds.current = tl.seconds;
        setTimeout(() => setAnimateDigit(null), 300);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timer.targetDate]);

  // Mesajları 8 saniyede bir değiştir
  useEffect(() => {
    const messages = timeLeft.total <= 0 ? expiredMessages : motivationalMessages;
    const msgInterval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 8000);
    return () => clearInterval(msgInterval);
  }, [timeLeft.total]);

  const isExpired = timeLeft.total <= 0;
  const isUrgent = !isExpired && timeLeft.days === 0 && timeLeft.hours < 6;
  const isToday = !isExpired && timeLeft.days === 0;
  const messages = isExpired ? expiredMessages : motivationalMessages;
  const currentMsg = messages[msgIndex % messages.length];
  const MsgIcon = currentMsg.icon;

  const targetDateFormatted = new Date(timer.targetDate).toLocaleDateString("tr-TR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const targetTimeFormatted = new Date(timer.targetDate).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Urgency-based gradient
  const gradientClass = isExpired
    ? "from-emerald-500/10 via-green-500/5 to-teal-500/10 border-emerald-500/30"
    : isUrgent
      ? "from-red-500/10 via-orange-500/5 to-yellow-500/10 border-red-500/30"
      : isToday
        ? "from-amber-500/10 via-yellow-500/5 to-orange-500/10 border-amber-500/30"
        : "from-blue-500/10 via-indigo-500/5 to-purple-500/10 border-blue-500/30";

  const digitBoxClass = isExpired
    ? "bg-emerald-600 text-white"
    : isUrgent
      ? "bg-red-600 text-white"
      : isToday
        ? "bg-amber-600 text-white"
        : "bg-gradient-to-b from-blue-600 to-indigo-700 text-white";

  return (
    <Card
      className={`relative overflow-hidden bg-gradient-to-br ${gradientClass} border-2 transition-all duration-500 ${
        isHighlighted ? "ring-4 ring-blue-400/50 scale-[1.01]" : ""
      } ${isUrgent ? "animate-pulse-subtle" : ""}`}
    >
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute -right-10 -top-10 text-[200px] rotate-12 select-none">
          {timer.emoji}
        </div>
      </div>

      <CardHeader className="relative pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{timer.emoji}</span>
            <div>
              <CardTitle className="text-xl font-bold">{timer.title}</CardTitle>
              {timer.description && (
                <p className="text-sm text-muted-foreground mt-0.5">{timer.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isExpired && (
              <Badge variant="default" className="bg-emerald-600 mr-2">
                <PartyPopper className="h-3 w-3 mr-1" /> Tamamlandı
              </Badge>
            )}
            {isUrgent && !isExpired && (
              <Badge variant="destructive" className="mr-2 animate-bounce">
                <Flame className="h-3 w-3 mr-1" /> Acil!
              </Badge>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(timer)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(timer.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>{targetDateFormatted}</span>
          <Clock className="h-3.5 w-3.5 ml-2" />
          <span>{targetTimeFormatted}</span>
        </div>
      </CardHeader>

      <CardContent className="relative pt-2">
        {/* Geri sayım rakamları */}
        <div className="grid grid-cols-4 gap-3 sm:gap-6 max-w-2xl mx-auto">
          {[
            { value: timeLeft.days, label: "Gün", key: "days" },
            { value: timeLeft.hours, label: "Saat", key: "hours" },
            { value: timeLeft.minutes, label: "Dakika", key: "minutes" },
            { value: timeLeft.seconds, label: "Saniye", key: "seconds" },
          ].map((unit) => (
            <div key={unit.key} className="flex flex-col items-center">
              <div
                className={`${digitBoxClass} rounded-2xl w-full aspect-square max-w-[120px] flex items-center justify-center shadow-lg transition-transform duration-300 ${
                  animateDigit === unit.key ? "scale-110" : "scale-100"
                }`}
              >
                <span className="text-3xl sm:text-5xl md:text-6xl font-mono font-black tabular-nums">
                  {String(unit.value).padStart(2, "0")}
                </span>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-muted-foreground mt-2 uppercase tracking-wider">
                {unit.label}
              </span>
            </div>
          ))}
        </div>

        {/* Progress bar (kalan zamana göre) */}
        {!isExpired && (
          <div className="mt-6 max-w-2xl mx-auto">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Başlangıç</span>
              <span>{timeLeft.days > 0 ? `${timeLeft.days} gün kaldı` : `${timeLeft.hours} saat kaldı`}</span>
              <span>Hedef</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  isUrgent
                    ? "bg-gradient-to-r from-red-500 to-orange-500"
                    : isToday
                      ? "bg-gradient-to-r from-amber-500 to-yellow-500"
                      : "bg-gradient-to-r from-blue-500 to-indigo-500"
                }`}
                style={{
                  width: `${Math.max(5, 100 - (timeLeft.total / (7 * 24 * 60 * 60 * 1000)) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Motive edici yazı */}
        <div
          className={`mt-6 text-center transition-all duration-700 ease-in-out`}
          key={msgIndex}
        >
          <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-background/80 backdrop-blur-sm border shadow-sm">
            <MsgIcon className={`h-5 w-5 ${isExpired ? "text-emerald-500" : isUrgent ? "text-red-500" : "text-blue-500"}`} />
            <span className="text-sm sm:text-base font-medium">{currentMsg.text}</span>
          </div>
        </div>
      </CardContent>

      {/* Bottom pulse line for urgent */}
      {isUrgent && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-pulse" />
      )}
    </Card>
  );
}

// ─── Ana Sayfa ─────────────────────────────────────────
export default function SayacPage() {
  const [timers, setTimers] = useState<CountdownTimer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTimer, setEditingTimer] = useState<CountdownTimer | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("Haftalık Hedef");
  const [formDescription, setFormDescription] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("09:00");
  const [formEmoji, setFormEmoji] = useState("🏗️");
  const [saving, setSaving] = useState(false);

  const fetchTimers = useCallback(async () => {
    try {
      const res = await fetch("/api/sayac");
      if (res.ok) {
        const data = await res.json();
        setTimers(data);
      }
    } catch {
      toast.error("Sayaçlar yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimers();
  }, [fetchTimers]);

  // Bir sonraki salıyı hesapla (varsayılan)
  const getNextTuesday = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilTuesday = (2 - dayOfWeek + 7) % 7 || 7;
    const nextTuesday = new Date(now);
    nextTuesday.setDate(now.getDate() + daysUntilTuesday);
    return nextTuesday.toISOString().split("T")[0];
  };

  const openCreateDialog = () => {
    setEditingTimer(null);
    setFormTitle("Haftalık Hedef");
    setFormDescription("");
    setFormDate(getNextTuesday());
    setFormTime("09:00");
    setFormEmoji("🏗️");
    setShowDialog(true);
  };

  const openEditDialog = (timer: CountdownTimer) => {
    setEditingTimer(timer);
    setFormTitle(timer.title);
    setFormDescription(timer.description || "");
    const d = new Date(timer.targetDate);
    setFormDate(d.toISOString().split("T")[0]);
    setFormTime(d.toTimeString().slice(0, 5));
    setFormEmoji(timer.emoji);
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formDate || !formTime) {
      toast.error("Tarih ve saat seçmelisiniz!");
      return;
    }

    setSaving(true);
    try {
      const targetDate = new Date(`${formDate}T${formTime}:00`).toISOString();

      if (editingTimer) {
        const res = await fetch(`/api/sayac/${editingTimer.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formTitle,
            description: formDescription || null,
            targetDate,
            emoji: formEmoji,
          }),
        });
        if (!res.ok) throw new Error();
        toast.success("Sayaç güncellendi! 🎯");
        setHighlightedId(editingTimer.id);
      } else {
        const res = await fetch("/api/sayac", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formTitle,
            description: formDescription || null,
            targetDate,
            emoji: formEmoji,
          }),
        });
        if (!res.ok) throw new Error();
        const created = await res.json();
        toast.success("Yeni sayaç oluşturuldu! 🚀");
        setHighlightedId(created.id);
      }

      setShowDialog(false);
      fetchTimers();
      setTimeout(() => setHighlightedId(null), 3000);
    } catch {
      toast.error("İşlem başarısız oldu");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu sayacı silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/sayac/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Sayaç silindi");
      fetchTimers();
    } catch {
      toast.error("Sayaç silinemedi");
    }
  };

  // Aktif sayaçlar (henüz bitmemiş) ve bitmiş sayaçlar
  const now = Date.now();
  const activeTimers = timers.filter((t) => t.isActive && new Date(t.targetDate).getTime() > now);
  const expiredTimers = timers.filter((t) => new Date(t.targetDate).getTime() <= now);
  const inactiveTimers = timers.filter((t) => !t.isActive && new Date(t.targetDate).getTime() > now);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Geri Dön */}
      <div className="flex items-center gap-2">
        <a href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <Home className="h-4 w-4" />
          Ana Sayfa
        </a>
      </div>

      {/* Üst Başlık */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Timer className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Geri Sayım Sayacı</h1>
            <p className="text-sm text-muted-foreground">
              Hedef tarihe kadar kalan süreyi takip edin • Ekibe motivasyon!
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
          <Plus className="h-4 w-4 mr-2" /> Yeni Sayaç
        </Button>
      </div>

      {/* Yükleniyor */}
      {loading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-48" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-6 max-w-2xl mx-auto">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-24 bg-muted rounded-2xl" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Hiç sayaç yok */}
      {!loading && timers.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-4">⏱️</div>
            <h3 className="text-xl font-semibold mb-2">Henüz sayaç yok</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              İşverene sunuma kadar kalan süreyi takip etmek için ilk sayacınızı oluşturun.
              Ekibiniz için motive edici bir geri sayım başlatsın! 🚀
            </p>
            <Button onClick={openCreateDialog} size="lg">
              <Plus className="h-5 w-5 mr-2" /> İlk Sayacı Oluştur
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Aktif Sayaçlar */}
      {activeTimers.length > 0 && (
        <div className="space-y-4">
          {activeTimers.length > 1 && (
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Rocket className="h-5 w-5 text-blue-500" /> Aktif Sayaçlar
            </h2>
          )}
          {activeTimers.map((timer) => (
            <CountdownCard
              key={timer.id}
              timer={timer}
              onEdit={openEditDialog}
              onDelete={handleDelete}
              isHighlighted={highlightedId === timer.id}
            />
          ))}
        </div>
      )}

      {/* Süresi Dolan Sayaçlar */}
      {expiredTimers.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-emerald-500" /> Tamamlanan Sayaçlar
          </h2>
          {expiredTimers.map((timer) => (
            <CountdownCard
              key={timer.id}
              timer={timer}
              onEdit={openEditDialog}
              onDelete={handleDelete}
              isHighlighted={highlightedId === timer.id}
            />
          ))}
        </div>
      )}

      {/* Pasif Sayaçlar */}
      {inactiveTimers.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">Pasif Sayaçlar</h2>
          {inactiveTimers.map((timer) => (
            <div key={timer.id} className="opacity-50">
              <CountdownCard
                timer={timer}
                onEdit={openEditDialog}
                onDelete={handleDelete}
                isHighlighted={false}
              />
            </div>
          ))}
        </div>
      )}

      {/* Oluştur / Düzenle Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingTimer ? (
                <>
                  <Pencil className="h-5 w-5" /> Sayacı Düzenle
                </>
              ) : (
                <>
                  <Timer className="h-5 w-5 text-blue-500" /> Yeni Sayaç Oluştur
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Emoji seçici */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Emoji</Label>
              <div className="flex flex-wrap gap-2">
                {emojiOptions.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setFormEmoji(e)}
                    className={`text-2xl p-2 rounded-xl border-2 transition-all hover:scale-110 ${
                      formEmoji === e
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950 scale-110"
                        : "border-transparent hover:border-muted"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Başlık */}
            <div>
              <Label htmlFor="timer-title">Başlık</Label>
              <Input
                id="timer-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Haftalık Hedef"
                className="mt-1.5"
              />
            </div>

            {/* Açıklama */}
            <div>
              <Label htmlFor="timer-desc">Açıklama (Opsiyonel)</Label>
              <Input
                id="timer-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Salı günü işverene sunulacak kısım..."
                className="mt-1.5"
              />
            </div>

            {/* Tarih ve Saat yan yana */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timer-date">Bitiş Tarihi</Label>
                <Input
                  id="timer-date"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="timer-time">Bitiş Saati</Label>
                <Input
                  id="timer-time"
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            {/* Hedef önizleme */}
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <span>
                  Hedef:{" "}
                  {formDate
                    ? new Date(`${formDate}T${formTime || "00:00"}`).toLocaleDateString("tr-TR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }) +
                      " • " +
                      (formTime || "00:00")
                    : "Tarih seçiniz"}
                </span>
              </div>
            </div>

            {/* Butonlar */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>
                <X className="h-4 w-4 mr-1" /> İptal
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !formDate}
                className="bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                {saving ? (
                  <span className="animate-spin mr-2">⏳</span>
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                {editingTimer ? "Güncelle" : "Oluştur"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom CSS for subtle pulse animation */}
      <style jsx global>{`
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.92; }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
