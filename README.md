# Şantiye360 - Şantiye Yönetim Sistemi

Şantiye ve inşaat projelerini yönetmek için kapsamlı bir web tabanlı platform.

## Teknoloji Yığını

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript
- **UI:** Tailwind CSS v4, shadcn/ui
- **Backend:** Next.js API Routes
- **Veritabanı:** PostgreSQL + Prisma ORM v7
- **Kimlik Doğrulama:** NextAuth.js v5 (Auth.js)

## Sistem Hiyerarşisi

```
Proje → Mahal (Zone) → Kat (Floor) → Aktivite (Activity)
```

Her aktivite şunları içerir:
- Ağırlık (weight) — toplamı 100
- İlerleme yüzdesi (0-100)
- Planlı başlangıç/bitiş
- Tahmini bitiş
- Gerçekleşen bitiş
- Kritik iş durumu

**Genel İlerleme Hesaplaması:**
```
SUM(weight × progress_percent) / 100
```

## Modüller

| Modül | Açıklama |
|-------|----------|
| Projeler | Proje CRUD yönetimi |
| Mahaller | Proje alanları (Zone) |
| Katlar | Kat yönetimi |
| Aktiviteler | İş kalemleri ve ilerleme takibi |
| Onaylar | Onay bekleyen işler |
| Riskler | Risk değerlendirmesi (etki × olasılık) |
| Şirketler | Ana yüklenici, taşeron, yönetim |
| Ekipler | Disipline bağlı ekipler |
| Personel | Günlük saha personeli |
| Dashboard | Genel ilerleme, grafikler, listeler |

## Kurulum

### Windows Hızlı Kurulum (Tek Komut)

Docker Desktop açıkken aşağıdaki komut tüm adımları otomatik yapar:

```powershell
npm run setup:win
```

Scriptin yaptığı işlemler:
- `npm install`
- `.env` yoksa `.env.example` dosyasından oluşturma
- Docker ile `db` servisini ayağa kaldırma
- Prisma generate + db push
- Seed yükleme
- Uygulamayı `npm run dev` ile başlatma

Opsiyonel parametre örnekleri:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-dev.ps1 -NoRun
powershell -ExecutionPolicy Bypass -File .\scripts\setup-dev.ps1 -SkipSeed
```

### Gereksinimler

- Node.js 18+
- PostgreSQL veritabanı
- npm

### Adımlar

1. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

2. **Ortam değişkenlerini ayarlayın:**
   ```bash
   cp .env.example .env
   ```
   `.env` dosyasında `DATABASE_URL` ve `AUTH_SECRET` değerlerini güncelleyin.

3. **Veritabanını oluşturun:**
   ```bash
   npx prisma db push
   ```

4. **Demo verileri yükleyin:**
   ```bash
   npm run db:seed
   ```

5. **Geliştirme sunucusunu başlatın:**
   ```bash
   npm run dev
   ```

6. **Tarayıcıda açın:** [http://localhost:3000](http://localhost:3000)

### Demo Giriş Bilgileri

- **E-posta:** admin@santiye360.com
- **Şifre:** admin123

## NPM Komutları

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusu (Turbopack) |
| `npm run build` | Üretim derlemesi |
| `npm run start` | Üretim sunucusu |
| `npm run db:generate` | Prisma istemci oluştur |
| `npm run db:push` | Schema'yı veritabanına uygula |
| `npm run db:migrate` | Migration oluştur ve uygula |
| `npm run db:seed` | Veritabanını demo verilerle doldur |
| `npm run db:studio` | Prisma Studio'yu aç |

## Proje Yapısı

```
src/
├── app/
│   ├── (dashboard)/        # Dashboard layout grubu
│   │   ├── aktiviteler/    # Aktivite yönetimi
│   │   ├── dashboard/      # Gösterge paneli
│   │   ├── ekipler/        # Ekip yönetimi
│   │   ├── katlar/         # Kat yönetimi
│   │   ├── mahaller/       # Mahal yönetimi
│   │   ├── onaylar/        # Onay yönetimi
│   │   ├── personel/       # Personel takibi
│   │   ├── projeler/       # Proje yönetimi
│   │   ├── riskler/        # Risk yönetimi
│   │   └── sirketler/      # Şirket yönetimi
│   ├── api/                # API endpoint'leri
│   └── giris/              # Giriş sayfası
├── components/
│   ├── ui/                 # shadcn/ui bileşenleri
│   ├── app-sidebar.tsx     # Ana yan menü
│   └── providers.tsx       # Uygulama sağlayıcıları
├── lib/
│   ├── auth.ts             # NextAuth yapılandırması
│   ├── prisma.ts           # Prisma istemci
│   └── utils.ts            # Yardımcı fonksiyonlar
└── types/
    └── next-auth.d.ts      # NextAuth tip tanımları
```

## API Endpoint'leri

| Yol | Metod | Açıklama |
|-----|-------|----------|
| `/api/projeler` | GET, POST | Proje listele/oluştur |
| `/api/projeler/[id]` | GET, PUT, DELETE | Proje detay/güncelle/sil |
| `/api/mahaller` | GET, POST | Mahal listele/oluştur |
| `/api/mahaller/[id]` | PUT, DELETE | Mahal güncelle/sil |
| `/api/katlar` | GET, POST | Kat listele/oluştur |
| `/api/katlar/[id]` | PUT, DELETE | Kat güncelle/sil |
| `/api/aktiviteler` | GET, POST | Aktivite listele/oluştur |
| `/api/aktiviteler/[id]` | GET, PUT, DELETE | Aktivite detay/güncelle/sil |
| `/api/onaylar` | GET, POST | Onay listele/oluştur |
| `/api/onaylar/[id]` | PUT, DELETE | Onay güncelle/sil |
| `/api/riskler` | GET, POST | Risk listele/oluştur |
| `/api/riskler/[id]` | PUT, DELETE | Risk güncelle/sil |
| `/api/sirketler` | GET, POST | Şirket listele/oluştur |
| `/api/sirketler/[id]` | PUT, DELETE | Şirket güncelle/sil |
| `/api/ekipler` | GET, POST | Ekip listele/oluştur |
| `/api/ekipler/[id]` | PUT, DELETE | Ekip güncelle/sil |
| `/api/personel` | GET, POST | Personel listele/kaydet (upsert) |
| `/api/disiplinler` | GET | Disiplin listesi |
