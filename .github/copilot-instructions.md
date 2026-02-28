# Şantiye360 - Copilot Talimatları

## Proje Hakkında
Şantiye360, inşaat projelerini yönetmek için geliştirilmiş bir web tabanlı şantiye yönetim sistemidir.

## Teknoloji
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui
- PostgreSQL + Prisma ORM v7 (driver adapter: @prisma/adapter-pg)
- NextAuth.js v5 (Auth.js) ile kimlik doğrulama
- Recharts grafik kütüphanesi

## Veri Hiyerarşisi
```
Project → Zone (Mahal) → Floor (Kat) → Activity (Aktivite)
```

## İlerleme Hesaplaması
```
Genel İlerleme = SUM(weight × progress_percent) / 100
Risk Skoru = impact × probability
```

## Kodlama Kuralları
- Tüm UI metinleri Türkçe olmalıdır
- API route'ları `/api/` altında Türkçe isimlendirme kullanır (projeler, mahaller, katlar, vb.)
- Sayfa yolları Türkçe'dir (/projeler, /mahaller, /katlar, /aktiviteler, /onaylar, /riskler, /sirketler, /ekipler, /personel, /crm, /crm/musteriler, /crm/firsatlar, /crm/iletisim, /duyurular)
- shadcn/ui bileşenleri `@/components/ui/` altındadır
- Prisma istemcisi `@/lib/prisma` üzerinden import edilir
- Auth yapılandırması `@/lib/auth` üzerindedir
- Tüm form ve tablo bileşenleri client component olarak ("use client") yazılmıştır
- Dashboard server component olarak veri çeker, client component'e prop olarak geçirir

## Veritabanı
- Prisma schema: `prisma/schema.prisma`
- Seed dosyası: `prisma/seed.ts`
- Prisma config: `prisma.config.ts`
- Bağlantı: `.env` dosyasındaki `DATABASE_URL`

## Komutlar
- `npm run dev` — Geliştirme sunucusu
- `npm run db:push` — Schema'yı DB'ye uygula
- `npm run db:seed` — Demo veriler yükle
- `npm run db:studio` — Prisma Studio
