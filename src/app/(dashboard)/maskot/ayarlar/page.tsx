"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Save,
  X,
  Check,
  Bot,
  ArrowLeft,
  MessageSquare,
  FileText,
  Sparkles,
  Star,
  Volume2,
  Loader2,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  isActive: boolean;
  isDefault: boolean;
  _count?: { conversations: number };
}

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  gender: string | null;
  age: string | null;
  accent: string | null;
  description: string | null;
  use_case: string | null;
  preview_url: string | null;
}

interface PromptContext {
  id: string;
  key: string;
  label: string;
  content: string;
  isActive: boolean;
}

const roleLabels: Record<string, string> = {
  MIMAR: "Mimar",
  MUHENDIS: "Mühendis",
  KOORDINATOR: "Koordinatör",
};

const roleEmojis: Record<string, Record<string, string>> = {
  MIMAR: { KADIN: "👩‍🎨", ERKEK: "👨‍🎨" },
  MUHENDIS: { KADIN: "👩‍🔧", ERKEK: "👨‍🔧" },
  KOORDINATOR: { KADIN: "👩‍💼", ERKEK: "👨‍💼" },
};

const defaultPersonalities: Record<string, string> = {
  MIMAR: `Zarif ve detaycı bir mimarsın. Estetik konularda hassassın. "Bu detay olmaz!" demeyi seversin. Tasarım ve güzellik senin işin. Şantiyede en düzenli, en titiz sensin. Bazen işçilere "Bu renk uyumu yanlış!" diye takılırsın.`,
  MUHENDIS: `Analitik ve teknik düşünen bir mühendissin. "Hesap yapmadan adım atmam" dersin. Statik, betonarme ve yapısal konularda uzmansın. Ama aynı zamanda esprili ve samimilerin. Bazen teknik terimlerle espri yaparsın.`,
  KOORDINATOR: `Enerjik ve organize bir koordinatörsün. "Hadi ekip, toplantı zamanı!" demeyi seversin. Süre yönetimi, ekip koordinasyonu ve planlama konusunda uzmansın. Herkesi motive edersin. Bazen saat başı "Neredeyiz?" diye sorar gibi yaparsın.`,
};

const defaultPromptContexts = [
  {
    key: "proje_bilgisi",
    label: "Proje Bilgisi",
    content: "Bu bir inşaat projesidir. Detayları ayarlardan güncelleyebilirsiniz.",
  },
  {
    key: "ekip_bilgisi",
    label: "Ekip Bilgisi",
    content: "Şantiyede mimar, mühendis, koordinatör ve işçiler birlikte çalışıyor.",
  },
  {
    key: "kurallar",
    label: "Özel Kurallar",
    content: "Motivasyonu yüksek tut. Eğlenceli ol. Şantiye jargonu kullan.",
  },
];

export default function MaskotAyarlarPage() {
  const [mascots, setMascots] = useState<Mascot[]>([]);
  const [promptContexts, setPromptContexts] = useState<PromptContext[]>([]);
  const [loading, setLoading] = useState(true);

  // Maskot form
  const [showMascotDialog, setShowMascotDialog] = useState(false);
  const [editingMascot, setEditingMascot] = useState<Mascot | null>(null);
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState<string>("MIMAR");
  const [formGender, setFormGender] = useState<string>("KADIN");
  const [formPersonality, setFormPersonality] = useState("");
  const [formPitch, setFormPitch] = useState(1.0);
  const [formRate, setFormRate] = useState(1.0);
  const [formVoiceId, setFormVoiceId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // ElevenLabs sesler
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);

  // Prompt form
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptContext | null>(null);
  const [promptKey, setPromptKey] = useState("");
  const [promptLabel, setPromptLabel] = useState("");
  const [promptContent, setPromptContent] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [mascotRes, promptRes] = await Promise.all([
        fetch("/api/maskot/karakterler"),
        fetch("/api/maskot/prompt"),
      ]);
      if (mascotRes.ok) setMascots(await mascotRes.json());
      if (promptRes.ok) setPromptContexts(await promptRes.json());
    } catch {
      toast.error("Veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Maskot CRUD ───
  const fetchVoices = useCallback(async () => {
    if (voices.length > 0) return; // zaten yüklendi
    setVoicesLoading(true);
    try {
      const res = await fetch("/api/maskot/voices");
      if (res.ok) {
        const data = await res.json();
        setVoices(data);
      }
    } catch {
      console.error("Sesler yüklenemedi");
    } finally {
      setVoicesLoading(false);
    }
  }, [voices.length]);

  const playPreview = (url: string) => {
    if (previewAudio) {
      previewAudio.pause();
      setPreviewAudio(null);
    }
    const audio = new Audio(url);
    setPreviewAudio(audio);
    audio.play();
    audio.onended = () => setPreviewAudio(null);
  };

  const openCreateMascot = () => {
    setEditingMascot(null);
    setFormName("");
    setFormRole("MIMAR");
    setFormGender("KADIN");
    setFormPersonality(defaultPersonalities.MIMAR);
    setFormPitch(1.0);
    setFormRate(1.0);
    setFormVoiceId("");
    fetchVoices();
    setShowMascotDialog(true);
  };

  const openEditMascot = (m: Mascot) => {
    setEditingMascot(m);
    setFormName(m.name);
    setFormRole(m.role);
    setFormGender(m.gender);
    setFormPersonality(m.personality);
    setFormPitch(m.voicePitch);
    setFormRate(m.voiceRate);
    setFormVoiceId(m.elevenLabsVoiceId || "");
    fetchVoices();
    setShowMascotDialog(true);
  };

  const saveMascot = async () => {
    if (!formName || !formPersonality) {
      toast.error("İsim ve kişilik zorunludur");
      return;
    }
    setSaving(true);
    try {
      const emoji = roleEmojis[formRole]?.[formGender] || "🤖";
      const body = {
        name: formName,
        role: formRole,
        gender: formGender,
        personality: formPersonality,
        emoji,
        voicePitch: formPitch,
        voiceRate: formRate,
        elevenLabsVoiceId: formVoiceId && formVoiceId !== "default" ? formVoiceId : null,
      };

      if (editingMascot) {
        const res = await fetch(`/api/maskot/karakterler/${editingMascot.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        toast.success("Maskot güncellendi ✅");
      } else {
        const res = await fetch("/api/maskot/karakterler", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, isDefault: mascots.length === 0 }),
        });
        if (!res.ok) throw new Error();
        toast.success("Maskot oluşturuldu! 🎭");
      }

      setShowMascotDialog(false);
      fetchData();
    } catch {
      toast.error("İşlem başarısız");
    } finally {
      setSaving(false);
    }
  };

  const deleteMascot = async (id: string) => {
    if (!confirm("Bu maskotu silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/maskot/karakterler/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Maskot silindi");
      fetchData();
    } catch {
      toast.error("Silinemedi");
    }
  };

  const setDefaultMascot = async (id: string) => {
    try {
      const res = await fetch(`/api/maskot/karakterler/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!res.ok) throw new Error();
      toast.success("Varsayılan maskot güncellendi ⭐");
      fetchData();
    } catch {
      toast.error("Güncellenemedi");
    }
  };

  // ─── Prompt CRUD ───
  const openCreatePrompt = () => {
    setEditingPrompt(null);
    setPromptKey("");
    setPromptLabel("");
    setPromptContent("");
    setShowPromptDialog(true);
  };

  const openEditPrompt = (p: PromptContext) => {
    setEditingPrompt(p);
    setPromptKey(p.key);
    setPromptLabel(p.label);
    setPromptContent(p.content);
    setShowPromptDialog(true);
  };

  const savePrompt = async () => {
    if (!promptKey || !promptLabel || !promptContent) {
      toast.error("Tüm alanlar zorunludur");
      return;
    }
    setSaving(true);
    try {
      if (editingPrompt) {
        const res = await fetch(`/api/maskot/prompt/${editingPrompt.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: promptLabel, content: promptContent }),
        });
        if (!res.ok) throw new Error();
        toast.success("Prompt güncellendi ✅");
      } else {
        const res = await fetch("/api/maskot/prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: promptKey, label: promptLabel, content: promptContent }),
        });
        if (!res.ok) throw new Error();
        toast.success("Prompt eklendi! 📝");
      }
      setShowPromptDialog(false);
      fetchData();
    } catch {
      toast.error("İşlem başarısız");
    } finally {
      setSaving(false);
    }
  };

  const deletePrompt = async (id: string) => {
    if (!confirm("Bu prompt bilgisini silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/maskot/prompt/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Silindi");
      fetchData();
    } catch {
      toast.error("Silinemedi");
    }
  };

  const loadDefaultPrompts = async () => {
    setSaving(true);
    try {
      for (const ctx of defaultPromptContexts) {
        await fetch("/api/maskot/prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ctx),
        });
      }
      toast.success("Varsayılan prompt'lar yüklendi! 🎉");
      fetchData();
    } catch {
      toast.error("Yüklenemedi");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader><div className="h-6 bg-muted rounded w-48" /></CardHeader>
            <CardContent><div className="h-20 bg-muted rounded" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Maskot Ayarları</h1>
            <p className="text-sm text-muted-foreground">
              Karakterleri yönet, kişilikleri düzenle, prompt bilgilerini ayarla
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <a href="/maskot">
            <ArrowLeft className="h-4 w-4 mr-2" /> Maskot Sayfası
          </a>
        </Button>
      </div>

      <Tabs defaultValue="karakterler">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="karakterler" className="gap-2">
            <Bot className="h-4 w-4" /> Karakterler ({mascots.length})
          </TabsTrigger>
          <TabsTrigger value="prompt" className="gap-2">
            <FileText className="h-4 w-4" /> Prompt Bilgileri ({promptContexts.length})
          </TabsTrigger>
        </TabsList>

        {/* ─── KARAKTERLER TAB ─── */}
        <TabsContent value="karakterler" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateMascot}>
              <Plus className="h-4 w-4 mr-2" /> Yeni Maskot
            </Button>
          </div>

          {mascots.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center py-12 text-center">
                <div className="text-5xl mb-3">🎭</div>
                <h3 className="font-semibold text-lg mb-1">Henüz maskot yok</h3>
                <p className="text-sm text-muted-foreground mb-4">İlk maskotunuzu oluşturun!</p>
                <Button onClick={openCreateMascot}>
                  <Plus className="h-4 w-4 mr-2" /> Maskot Oluştur
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mascots.map((m) => (
                <Card
                  key={m.id}
                  className={`relative overflow-hidden ${m.isDefault ? "ring-2 ring-amber-400" : ""}`}
                >
                  {m.isDefault && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-amber-500 gap-1">
                        <Star className="h-3 w-3" /> Varsayılan
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{m.emoji}</span>
                      <div>
                        <CardTitle className="text-lg">{m.name}</CardTitle>
                        <Badge variant="secondary">{roleLabels[m.role]}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground line-clamp-3">{m.personality}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      <span>{m._count?.conversations || 0} sohbet</span>
                      <span>•</span>
                      <span>Perde: {m.voicePitch}</span>
                      <span>•</span>
                      <span>Hız: {m.voiceRate}</span>
                    </div>
                    <div className="flex gap-1 pt-1">
                      {!m.isDefault && (
                        <Button variant="outline" size="sm" onClick={() => setDefaultMascot(m.id)}>
                          <Star className="h-3 w-3 mr-1" /> Varsayılan
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => openEditMascot(m)}>
                        <Pencil className="h-3 w-3 mr-1" /> Düzenle
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteMascot(m.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── PROMPT BİLGİLERİ TAB ─── */}
        <TabsContent value="prompt" className="space-y-4">
          <div className="flex justify-between">
            {promptContexts.length === 0 && (
              <Button variant="outline" onClick={loadDefaultPrompts} disabled={saving}>
                <Sparkles className="h-4 w-4 mr-2" /> Varsayılanları Yükle
              </Button>
            )}
            <div className="ml-auto">
              <Button onClick={openCreatePrompt}>
                <Plus className="h-4 w-4 mr-2" /> Yeni Prompt Bilgisi
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Buradaki bilgiler tüm maskotların AI cevaplarına bağlam olarak eklenir.
            Şantiye bilgileri, ekip detayları, özel kurallar ekleyebilirsiniz.
          </p>

          {promptContexts.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <h3 className="font-semibold mb-1">Prompt bilgisi yok</h3>
                <p className="text-sm text-muted-foreground">
                  Varsayılanları yükleyerek başlayabilirsiniz.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {promptContexts.map((ctx) => (
                <Card key={ctx.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs font-mono">{ctx.key}</Badge>
                          <span className="font-medium text-sm">{ctx.label}</span>
                          {!ctx.isActive && <Badge variant="secondary">Pasif</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ctx.content}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditPrompt(ctx)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => deletePrompt(ctx.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── Maskot Dialog ─── */}
      <Dialog open={showMascotDialog} onOpenChange={setShowMascotDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingMascot ? "Maskotu Düzenle" : "Yeni Maskot Oluştur"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>İsim</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ayşe Mimar"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Rol</Label>
                <Select
                  value={formRole}
                  onValueChange={(v) => {
                    setFormRole(v);
                    if (!editingMascot) setFormPersonality(defaultPersonalities[v] || "");
                  }}
                >
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MIMAR">👩‍🎨 Mimar</SelectItem>
                    <SelectItem value="MUHENDIS">👩‍🔧 Mühendis</SelectItem>
                    <SelectItem value="KOORDINATOR">👩‍💼 Koordinatör</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cinsiyet</Label>
                <Select value={formGender} onValueChange={setFormGender}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KADIN">👩 Kadın</SelectItem>
                    <SelectItem value="ERKEK">👨 Erkek</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Kişilik / Prompt</Label>
              <Textarea
                value={formPersonality}
                onChange={(e) => setFormPersonality(e.target.value)}
                placeholder="Bu karakterin kişiliğini tarif edin..."
                rows={5}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Bu metin AI'ın system prompt'una eklenir
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ses Perdesi ({formPitch})</Label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={formPitch}
                  onChange={(e) => setFormPitch(parseFloat(e.target.value))}
                  className="w-full mt-2"
                />
              </div>
              <div>
                <Label>Ses Hızı ({formRate})</Label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={formRate}
                  onChange={(e) => setFormRate(parseFloat(e.target.value))}
                  className="w-full mt-2"
                />
              </div>
            </div>

            {/* ElevenLabs Ses Seçimi */}
            <div>
              <Label className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" /> ElevenLabs Ses
              </Label>
              {voicesLoading ? (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Sesler yükleniyor...
                </div>
              ) : (
                <div className="mt-1 space-y-2">
                  <Select value={formVoiceId} onValueChange={setFormVoiceId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Varsayılan (cinsiyet/role göre)" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="default">🔄 Varsayılan (otomatik)</SelectItem>
                      {voices.map((v) => (
                        <SelectItem key={v.voice_id} value={v.voice_id}>
                          {v.name}
                          {v.gender ? ` • ${v.gender === "female" ? "👩" : v.gender === "male" ? "👨" : ""}` : ""}
                          {v.accent ? ` • ${v.accent}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formVoiceId && formVoiceId !== "default" && (() => {
                    const selectedVoice = voices.find(v => v.voice_id === formVoiceId);
                    return selectedVoice ? (
                      <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                        <div className="text-xs">
                          <span className="font-medium">{selectedVoice.name}</span>
                          {selectedVoice.description && (
                            <span className="text-muted-foreground ml-1">— {selectedVoice.description}</span>
                          )}
                        </div>
                        {selectedVoice.preview_url && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => playPreview(selectedVoice.preview_url!)}
                          >
                            <Volume2 className="h-3 w-3 mr-1" /> Dinle
                          </Button>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Boş bırakılırsa cinsiyet ve role göre otomatik ses atanır
              </p>
            </div>

            {/* Önizleme */}
            <div className="rounded-lg bg-muted/50 p-3 flex items-center gap-3">
              <span className="text-3xl">{roleEmojis[formRole]?.[formGender] || "🤖"}</span>
              <div>
                <p className="font-medium text-sm">{formName || "İsimsiz"}</p>
                <p className="text-xs text-muted-foreground">{roleLabels[formRole]} • {formGender === "KADIN" ? "Kadın" : "Erkek"}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowMascotDialog(false)}>
                <X className="h-4 w-4 mr-1" /> İptal
              </Button>
              <Button onClick={saveMascot} disabled={saving}>
                {saving ? "Kaydediliyor..." : (
                  <><Save className="h-4 w-4 mr-1" /> {editingMascot ? "Güncelle" : "Oluştur"}</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Prompt Dialog ─── */}
      <Dialog open={showPromptDialog} onOpenChange={setShowPromptDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPrompt ? "Prompt Bilgisini Düzenle" : "Yeni Prompt Bilgisi"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Key (benzersiz)</Label>
              <Input
                value={promptKey}
                onChange={(e) => setPromptKey(e.target.value.toLowerCase().replace(/\s/g, "_"))}
                placeholder="proje_bilgisi"
                className="mt-1 font-mono"
                disabled={!!editingPrompt}
              />
            </div>
            <div>
              <Label>Gösterim Adı</Label>
              <Input
                value={promptLabel}
                onChange={(e) => setPromptLabel(e.target.value)}
                placeholder="Proje Bilgisi"
                className="mt-1"
              />
            </div>
            <div>
              <Label>İçerik</Label>
              <Textarea
                value={promptContent}
                onChange={(e) => setPromptContent(e.target.value)}
                placeholder="Bu bilgi AI'ın bağlamına eklenir..."
                rows={6}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Şantiye adı, proje detayları, ekip bilgileri, özel talimatlar gibi bilgiler yazabilirsiniz
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPromptDialog(false)}>
                <X className="h-4 w-4 mr-1" /> İptal
              </Button>
              <Button onClick={savePrompt} disabled={saving}>
                {saving ? "Kaydediliyor..." : (
                  <><Check className="h-4 w-4 mr-1" /> {editingPrompt ? "Güncelle" : "Ekle"}</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
