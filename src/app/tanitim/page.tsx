"use client";

import Link from "next/link";
import {
  HardHat,
  FileText,
  BarChart3,
  Zap,
  Handshake,
  Wallet,
  Package,
  Users,
  Brain,
  TrendingUp,
  Leaf,
  Rocket,
  ChevronRight,
  ArrowRight,
  Shield,
  Clock,
  AlertTriangle,
  Target,
  Globe,
  Cpu,
  BarChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/* ── Uçtan Uca Yönetim maddeleri ── */
const managementItems = [
  { icon: FileText, text: "İhale ve teklif süreçlerinizi merkezi olarak yönetin", color: "text-blue-400", bg: "bg-blue-400/15" },
  { icon: BarChart3, text: "Proje bütçenizi ve maliyet sapmalarını anlık izleyin", color: "text-cyan-400", bg: "bg-cyan-400/15" },
  { icon: Zap, text: "Elektrik, mekanik ve inşaat disiplinlerini entegre yönetin", color: "text-amber-400", bg: "bg-amber-400/15" },
  { icon: Handshake, text: "Taşeron hakediş ve performans süreçlerini dijitalleştirin", color: "text-emerald-400", bg: "bg-emerald-400/15" },
  { icon: Wallet, text: "Nakit akışınızı ve kârlılığınızı kontrol altına alın", color: "text-purple-400", bg: "bg-purple-400/15" },
  { icon: Package, text: "Satınalma ve depo süreçlerinde kayıp ve israfı azaltın", color: "text-orange-400", bg: "bg-orange-400/15" },
  { icon: Users, text: "İnsan kaynakları ve saha personel yönetimini optimize edin", color: "text-rose-400", bg: "bg-rose-400/15" },
];

/* ── Verimlilik maddeleri ── */
const efficiencyItems = [
  { icon: Clock, text: "Zaman kaybını azaltır" },
  { icon: Shield, text: "Manuel hataları ortadan kaldırır" },
  { icon: BarChart, text: "Gerçek zamanlı raporlama sunar" },
  { icon: Target, text: "Yönetim kadrosuna net karar destek mekanizmaları sağlar" },
];

/* ── AI maddeleri ── */
const aiItems = [
  "Proje gecikmelerini önceden tahmin eder",
  "Maliyet sapmalarını analiz eder",
  "Nakit tükenme tarihini öngörür",
  "Taşeron risk skorlarını hesaplar",
  "Karlılık tahminleri üretir",
];

/* ── Vizyon maddeleri ── */
const visionItems = [
  "İnşaat firmalarını veri odaklı yapılara dönüştürmek",
  "Riskleri öngörülebilir hale getirmek",
  "Kârlılığı artıran akıllı karar sistemleri geliştirmek",
  "Ana yüklenici ve taşeron ekosistemini tek dijital merkezde birleştirmek",
];

export default function TanitimPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 text-white">
      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl flex h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/giris" className="flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg logo-ai-gradient logo-glow-ring logo-shimmer overflow-hidden">
              <HardHat className="h-5 w-5 text-white logo-hat-float drop-shadow-sm" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">Şantiye360</span>
          </Link>
          <Link href="/giris">
            <Button size="sm" className="gap-1.5 font-medium">
              Giriş Yap <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* ══════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════ */}
        <section className="pt-16 sm:pt-24 pb-16 sm:pb-20 text-center relative">
          {/* decorative glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <p className="text-blue-300 text-xs sm:text-sm font-semibold uppercase tracking-widest mb-4">
              Construction Operating System
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight max-w-3xl mx-auto">
              İnşaat Sektöründe
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Dijital Dönüşüm Platformu
              </span>
            </h1>

            <p className="mt-6 text-blue-200/70 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
              Şantiye360; ana yüklenici, alt yüklenici ve yatırımcı yapısına uygun
              olarak tasarlanmış, inşaat sektörüne özel uçtan uca bir Dijital
              Dönüşüm Platformudur.
            </p>

            <p className="mt-4 text-blue-200/50 text-[13px] sm:text-sm leading-relaxed max-w-2xl mx-auto">
              İhale süreçlerinden teklif hazırlamaya, keşif ve metrajdan sözleşme
              yönetimine; hakediş takibinden taşeron koordinasyonuna; teknik
              hesaplamalardan finans ve muhasebeye; insan kaynakları yönetiminden
              satınalma ve depo kontrolüne; sürdürülebilirlik ve ESG raporlamasına
              kadar tüm iş süreçlerinizi tek bir sistemde birleştirir.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/giris">
                <Button size="lg" className="gap-2 font-semibold text-sm h-12 px-6">
                  Hemen Başlayın <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            UÇTAN UCA YÖNETİM
        ══════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-400/10 border border-violet-400/20 text-violet-300 text-xs font-semibold px-4 py-1.5 mb-4">
              <HardHat className="h-3.5 w-3.5 logo-hat-float" />
              Uçtan Uca Yönetim
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              Şantiye360 ile
            </h2>
          </div>

          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            {managementItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <Card key={i} className="bg-white/[0.04] border-white/[0.08] hover:border-white/15 transition-colors">
                  <CardContent className="p-4 sm:p-5 flex items-start gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.bg}`}>
                      <Icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <p className="text-[13px] sm:text-sm text-blue-100/80 leading-relaxed pt-1.5">
                      {item.text}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <p className="text-center text-blue-200/40 text-xs sm:text-sm mt-8 max-w-lg mx-auto">
            Tüm veriler tek platformda toplanır, departmanlar arası kopukluk
            ortadan kalkar.
          </p>
        </section>

        {/* ══════════════════════════════════════════════
            VERİMLİLİK, KONTROL VE ŞEFFAFLIK
        ══════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 text-xs font-semibold px-4 py-1.5 mb-4">
                <Zap className="h-3.5 w-3.5" />
                Verimlilik, Kontrol ve Şeffaflık
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Kontrolü Elinizde Tutun
              </h2>
              <p className="text-blue-200/60 text-sm leading-relaxed mb-6">
                Projelerinizde gecikme riskini erken görür, maliyet artışlarını
                anında tespit eder, kontrolü elinizde tutarsınız.
              </p>
            </div>

            <div className="space-y-3">
              {efficiencyItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-4 rounded-xl bg-white/[0.04] border border-white/[0.08] p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15">
                      <Icon className="h-5 w-5 text-emerald-400" />
                    </div>
                    <p className="text-[13px] sm:text-sm text-blue-100/80">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            AI DESTEKLİ ÖNGÖRÜ
        ══════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20">
          <div className="rounded-2xl bg-gradient-to-br from-violet-500/10 via-blue-500/10 to-cyan-500/10 border border-white/[0.08] p-8 sm:p-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-400/10 border border-violet-400/20 text-violet-300 text-xs font-semibold px-4 py-1.5 mb-4">
                <Brain className="h-3.5 w-3.5" />
                AI Destekli Öngörülebilirlik
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                Sadece Takip Değil, Öngörü
              </h2>
              <p className="text-blue-200/60 text-sm max-w-lg mx-auto leading-relaxed">
                Şantiye360 yalnızca bir takip sistemi değildir. Gelişmiş yapay
                zekâ ve veri analitiği altyapısı sayesinde:
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl mx-auto">
              {aiItems.map((text, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl bg-white/[0.05] border border-white/[0.06] p-3.5"
                >
                  <ChevronRight className="h-4 w-4 text-violet-400 shrink-0" />
                  <span className="text-[12px] sm:text-[13px] text-blue-100/70">{text}</span>
                </div>
              ))}
            </div>

            <p className="text-center text-violet-300/50 text-xs sm:text-sm mt-8">
              Veriye dayalı karar alma kültürünü inşaat sektörüne taşır.
            </p>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SÜRDÜRÜLEBİLİR VE GELECEĞE HAZIR
        ══════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="order-2 lg:order-1 space-y-4">
              <div className="flex items-start gap-4 rounded-xl bg-white/[0.04] border border-white/[0.08] p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-400/15">
                  <Leaf className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">Sürdürülebilirlik & ESG</h4>
                  <p className="text-[12px] text-blue-200/50 leading-relaxed">
                    Karbon ayak izi takibi, enerji tüketim analizi ve ESG
                    raporlaması ile sürdürülebilir inşaat yönetimini destekler.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-xl bg-white/[0.04] border border-white/[0.08] p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/15">
                  <Cpu className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">BIM & IoT Entegrasyonu</h4>
                  <p className="text-[12px] text-blue-200/50 leading-relaxed">
                    BIM entegrasyonu, IoT veri akışı ve dijital saha yönetimi ile
                    bugünün değil, geleceğin inşaat ekosistemine hizmet eder.
                  </p>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-green-400/10 border border-green-400/20 text-green-300 text-xs font-semibold px-4 py-1.5 mb-4">
                <Globe className="h-3.5 w-3.5" />
                Geleceğe Hazır
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Sürdürülebilir ve Akıllı
              </h2>
              <p className="text-blue-200/60 text-sm leading-relaxed">
                Şantiye360; bugünün değil, geleceğin inşaat ekosistemine hizmet
                eder. Sürdürülebilirlik, dijital ikiz ve IoT entegrasyonları ile
                sektörün geleceğini şekillendirir.
              </p>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            VİZYON
        ══════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-semibold px-4 py-1.5 mb-4">
              <Rocket className="h-3.5 w-3.5" />
              Gelecek Vizyonu
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Şantiye360'ın Vizyonu
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {visionItems.map((text, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl bg-white/[0.04] border border-white/[0.08] p-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400/15 mt-0.5">
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                </div>
                <p className="text-[13px] text-blue-100/70 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-blue-200/40 text-sm mt-8 max-w-lg mx-auto">
            Şantiye360, yalnızca projelerinizi değil, şirketinizin geleceğini de
            yönetmenizi sağlar.
          </p>
        </section>

        {/* ══════════════════════════════════════════════
            CTA
        ══════════════════════════════════════════════ */}
        <section className="py-16 sm:py-20">
          <div className="rounded-2xl bg-gradient-to-r from-blue-500/20 to-cyan-500/10 border border-blue-400/20 p-8 sm:p-12 text-center">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">
              Şantiye360 ile
            </h2>
            <p className="text-blue-200/70 text-sm sm:text-base mb-6 max-w-lg mx-auto">
              Zaman kazanın. Maliyetleri kontrol edin. Riskleri öngörün.
              Geleceği inşa edin.
            </p>
            <Link href="/giris">
              <Button size="lg" className="gap-2 font-semibold text-sm h-12 px-8">
                Platforma Giriş Yapın <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 mt-8 py-8 text-center text-[11px] text-blue-300/40">
        <p>
          © 2026 AIWorks Lab | Tüm hakları saklıdır. — Created by{" "}
          <span className="font-medium text-blue-300/60">Seyfullah SEPET</span>
        </p>
      </footer>
    </div>
  );
}
