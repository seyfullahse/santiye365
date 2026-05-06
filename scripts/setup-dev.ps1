param(
    [switch]$SkipDocker,
    [switch]$SkipSeed,
    [switch]$NoRun
)

$ErrorActionPreference = "Stop"

function Write-Step($message) {
    Write-Host "`n==> $message" -ForegroundColor Cyan
}

function Require-Command($name, $installHint) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        Write-Host "[HATA] '$name' bulunamadi. $installHint" -ForegroundColor Red
        exit 1
    }
}

Write-Step "Gereksinimler kontrol ediliyor"
Require-Command "node" "Node.js 20+ yukleyin: https://nodejs.org"
Require-Command "npm" "Node.js ile birlikte npm gelir."

if (-not $SkipDocker) {
    Require-Command "docker" "Docker Desktop yukleyin: https://www.docker.com/products/docker-desktop"
}

Write-Step "Bagimliliklar yukleniyor"
npm install

if (-not (Test-Path ".env")) {
    Write-Step ".env olusturuluyor"
    Copy-Item ".env.example" ".env"

    # Local Docker compose ayari: host 55532, user/password postgres
    (Get-Content ".env") |
        ForEach-Object {
            if ($_ -match '^DATABASE_URL=') {
                'DATABASE_URL="postgresql://postgres:postgres@localhost:55532/santiye360?schema=public"'
            } elseif ($_ -match '^AUTH_SECRET=""$') {
                $secret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
                "AUTH_SECRET=\"$secret\""
            } else {
                $_
            }
        } | Set-Content ".env"

    Write-Host ".env olusturuldu ve yerel Docker veritabani icin guncellendi." -ForegroundColor Green
} else {
    Write-Step ".env zaten var, dokunulmadi"
}

if (-not $SkipDocker) {
    Write-Step "PostgreSQL container baslatiliyor"
    docker compose up -d db
}

Write-Step "Prisma client olusturuluyor"
npm run db:generate

Write-Step "Veritabani schema uygulanıyor"
npm run db:push

if (-not $SkipSeed) {
    Write-Step "Seed verisi yukleniyor"
    npm run db:seed
} else {
    Write-Step "Seed adimi atlandi"
}

if (-not $NoRun) {
    Write-Step "Uygulama baslatiliyor"
    npm run dev
} else {
    Write-Host "Kurulum tamamlandi. Calistirmak icin: npm run dev" -ForegroundColor Green
}
