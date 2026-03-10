import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

// Excel'den gelen ihale giyat dosyasını parse edip TenderItem'lara dönüştürür
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const versionId = formData.get("versionId") as string | null;

    if (!file || !versionId) {
      return NextResponse.json(
        { error: "Dosya ve versiyon ID gerekli" },
        { status: 400 }
      );
    }

    // Versiyonun varlığını kontrol et
    const version = await prisma.tenderVersion.findUnique({
      where: { id: versionId },
      include: { tender: true },
    });

    if (!version) {
      return NextResponse.json(
        { error: "Versiyon bulunamadı" },
        { status: 404 }
      );
    }

    // Excel dosyasını oku
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    const sheetNames = workbook.SheetNames;
    if (sheetNames.length === 0) {
      return NextResponse.json(
        { error: "Excel dosyasında sayfa bulunamadı" },
        { status: 400 }
      );
    }

    // Mevcut kalemleri sil (yeniden yükleniyor)
    await prisma.tenderItem.deleteMany({
      where: { versionId },
    });

    const allItems: Array<{
      versionId: string;
      groupCode: string | null;
      groupName: string | null;
      subGroupName: string | null;
      itemNumber: string | null;
      level: number;
      pozCode: string | null;
      description: string;
      detail: string | null;
      contractorNote: string | null;
      unit: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      laborCost: number;
      materialCost: number;
      equipmentCost: number;
      importPercent: number;
      importAmount: number;
      localPercent: number;
      localAmount: number;
      sortOrder: number;
    }> = [];

    let globalSortOrder = 0;

    // İcmal sayfasını bul (ilk sayfa genellikle)
    const icmalSheet = findIcmalSheet(workbook, sheetNames);
    const groupMap = icmalSheet
      ? parseIcmalSheet(workbook.Sheets[icmalSheet])
      : new Map<string, string>();

    // Her sayfayı işle
    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      const data: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
        blankrows: false,
      });

      if (data.length < 2) continue;

      // Sütun başlıklarını bul
      const headerInfo = detectHeaders(data);
      if (!headerInfo) continue; // Tanınabilir başlık bulunamadı

      const { headerRow, columns } = headerInfo;

      // Grup kodu belirleme: sayfa adından çıkar
      const groupCode = extractGroupCode(sheetName);
      const groupNameFromIcmal = groupCode ? groupMap.get(groupCode) : null;

      // Grup başlık satırı ekle (her sayfa için)
      if (groupCode && sheetName !== icmalSheet) {
        const groupDesc =
          groupNameFromIcmal || sheetName.replace(/^[A-Z]\s*[-–]\s*/i, "").trim();
        allItems.push({
          versionId,
          groupCode,
          groupName: groupDesc,
          subGroupName: null,
          itemNumber: null,
          level: 0,
          pozCode: null,
          description: groupDesc,
          detail: null,
          contractorNote: null,
          unit: "",
          quantity: 0,
          unitPrice: 0,
          totalPrice: 0,
          laborCost: 0,
          materialCost: 0,
          equipmentCost: 0,
          importPercent: 0,
          importAmount: 0,
          localPercent: 0,
          localAmount: 0,
          sortOrder: globalSortOrder++,
        });
      }

      // Veri satırlarını işle
      let currentSection = "";
      for (let i = headerRow + 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;

        const siraNo = str(row[columns.siraNo]).trim();
        const pozNo = columns.pozNo >= 0 ? str(row[columns.pozNo]).trim() : "";
        const cinsi = columns.cinsi >= 0 ? str(row[columns.cinsi]).trim() : "";
        const detay = columns.detay >= 0 ? str(row[columns.detay]).trim() : "";
        const yukleniciNot =
          columns.yukleniciNot >= 0
            ? str(row[columns.yukleniciNot]).trim()
            : "";
        const birim = columns.birim >= 0 ? str(row[columns.birim]).trim() : "";
        const metraj = columns.metraj >= 0 ? num(row[columns.metraj]) : 0;
        const malzemeBF =
          columns.malzemeBF >= 0 ? num(row[columns.malzemeBF]) : 0;
        const iscilikBF =
          columns.iscilikBF >= 0 ? num(row[columns.iscilikBF]) : 0;
        const toplamBF =
          columns.toplamBF >= 0 ? num(row[columns.toplamBF]) : 0;
        const toplamTutar =
          columns.toplamTutar >= 0 ? num(row[columns.toplamTutar]) : 0;
        const ithalatPct =
          columns.ithalatPct >= 0 ? num(row[columns.ithalatPct]) : 0;
        const ithalatTutar =
          columns.ithalatTutar >= 0 ? num(row[columns.ithalatTutar]) : 0;
        const yerelPct =
          columns.yerelPct >= 0 ? num(row[columns.yerelPct]) : 0;
        const yerelTutar =
          columns.yerelTutar >= 0 ? num(row[columns.yerelTutar]) : 0;

        // Boş satırları atla
        if (!siraNo && !cinsi && !pozNo) continue;

        // Satır tipini belirle
        const rowType = classifyRow(siraNo, cinsi, birim, metraj, toplamTutar);

        if (rowType === "section") {
          currentSection = cinsi;
          allItems.push({
            versionId,
            groupCode: groupCode || null,
            groupName: null,
            subGroupName: null,
            itemNumber: siraNo,
            level: 1,
            pozCode: pozNo || null,
            description: cinsi,
            detail: detay || null,
            contractorNote: yukleniciNot || null,
            unit: "",
            quantity: 0,
            unitPrice: toplamTutar, // Bölüm toplamını burada saklayabiliriz
            totalPrice: toplamTutar,
            laborCost: 0,
            materialCost: 0,
            equipmentCost: 0,
            importPercent: 0,
            importAmount: 0,
            localPercent: 0,
            localAmount: 0,
            sortOrder: globalSortOrder++,
          });
        } else if (rowType === "item") {
          const calcTotal =
            toplamTutar || (toplamBF > 0 ? toplamBF * metraj : 0);
          const calcUnitPrice =
            toplamBF || (malzemeBF + iscilikBF) || (metraj > 0 ? calcTotal / metraj : 0);

          allItems.push({
            versionId,
            groupCode: groupCode || null,
            groupName: null,
            subGroupName: currentSection || null,
            itemNumber: siraNo,
            level: 2,
            pozCode: pozNo || null,
            description: cinsi,
            detail: detay || null,
            contractorNote: yukleniciNot || null,
            unit: birim,
            quantity: metraj,
            unitPrice: calcUnitPrice,
            totalPrice: calcTotal,
            laborCost: iscilikBF,
            materialCost: malzemeBF,
            equipmentCost: 0,
            importPercent: ithalatPct,
            importAmount: ithalatTutar,
            localPercent: yerelPct,
            localAmount: yerelTutar,
            sortOrder: globalSortOrder++,
          });
        } else if (rowType === "subtotal") {
          // Alt toplam satırını atla veya not olarak ekle
          continue;
        }
      }
    }

    // Toplu kayıt (500'lük chunk)
    const CHUNK = 500;
    let insertedCount = 0;
    for (let i = 0; i < allItems.length; i += CHUNK) {
      const chunk = allItems.slice(i, i + CHUNK);
      const result = await prisma.tenderItem.createMany({ data: chunk });
      insertedCount += result.count;
    }

    // Versiyon toplam maliyetini güncelle
    const agg = await prisma.tenderItem.aggregate({
      where: { versionId, level: 2 },
      _sum: { totalPrice: true },
    });

    await prisma.tenderVersion.update({
      where: { id: versionId },
      data: { totalCost: agg._sum.totalPrice || 0 },
    });

    // Grup özeti oluştur
    const groups = allItems.filter((it) => it.level === 0);
    const groupSummary = groups.map((g) => {
      const groupItems = allItems.filter(
        (it) => it.groupCode === g.groupCode && it.level === 2
      );
      const total = groupItems.reduce((s, it) => s + it.totalPrice, 0);
      return {
        code: g.groupCode,
        name: g.description,
        itemCount: groupItems.length,
        total,
      };
    });

    return NextResponse.json({
      success: true,
      inserted: insertedCount,
      totalCost: agg._sum.totalPrice || 0,
      sheets: sheetNames.length,
      groups: groupSummary,
    });
  } catch (error) {
    console.error("Excel yükleme hatası:", error);
    return NextResponse.json(
      {
        error: "Excel işlenirken hata oluştu",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// ─── Yardımcı Fonksiyonlar ─────────────────────────────────────────

function str(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val);
}

function num(val: unknown): number {
  if (val === null || val === undefined) return 0;
  const n = typeof val === "number" ? val : parseFloat(String(val).replace(/[,\s]/g, ""));
  return isNaN(n) ? 0 : n;
}

// İcmal sayfasını bul
function findIcmalSheet(
  workbook: XLSX.WorkBook,
  names: string[]
): string | null {
  const icmalKeywords = ["icmal", "İCMAL", "özet", "ÖZET", "summary", "genel"];
  for (const name of names) {
    if (icmalKeywords.some((k) => name.toLowerCase().includes(k.toLowerCase()))) {
      return name;
    }
  }
  // İlk sayfa genellikle icmaldir - kontrol et
  if (names.length > 1) {
    const sheet = workbook.Sheets[names[0]];
    const data: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
    });
    // İcmal sayfası genelde kısa ve grup kodları içerir
    if (data.length < 30) {
      const text = JSON.stringify(data).toUpperCase();
      if (
        (text.includes("GRUP") || text.includes("İCMAL")) &&
        /\b[A-F]\b/.test(text)
      ) {
        return names[0];
      }
    }
  }
  return null;
}

// İcmal sayfasını parse et: { "A" => "MİMARİ İŞLER", "B" => "CEPHE İŞLERİ", ... }
function parseIcmalSheet(sheet: XLSX.WorkSheet): Map<string, string> {
  const map = new Map<string, string>();
  const data: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
  });

  for (const row of data) {
    if (!row || row.length < 2) continue;
    for (let c = 0; c < row.length - 1; c++) {
      const cell = str(row[c]).trim().toUpperCase();
      // "A", "B", "C" gibi tek harf grup kodları
      if (/^[A-Z]$/.test(cell)) {
        const name = str(row[c + 1]).trim();
        if (name && name.length > 2) {
          map.set(cell, name);
        }
      }
    }
  }
  return map;
}

// Sayfa adından grup kodu çıkar: "A - MİMARİ İŞLER" → "A"
function extractGroupCode(sheetName: string): string | null {
  const match = sheetName.match(/^([A-Z])\s*[-–]/i);
  if (match) return match[1].toUpperCase();

  // Sadece tek harf
  const trimmed = sheetName.trim().toUpperCase();
  if (/^[A-Z]$/.test(trimmed)) return trimmed;

  // "GRUP A", "Grup B" gibi
  const grpMatch = sheetName.match(/GRUP\s+([A-Z])/i);
  if (grpMatch) return grpMatch[1].toUpperCase();

  return null;
}

interface ColumnMap {
  siraNo: number;
  pozNo: number;
  cinsi: number;
  detay: number;
  yukleniciNot: number;
  birim: number;
  metraj: number;
  malzemeBF: number;
  iscilikBF: number;
  toplamBF: number;
  toplamTutar: number;
  ithalatPct: number;
  ithalatTutar: number;
  yerelPct: number;
  yerelTutar: number;
}

// Başlık satırını ve sütun eşlemesini tespit et
function detectHeaders(
  data: unknown[][]
): { headerRow: number; columns: ColumnMap } | null {
  // Başlık anahtar kelimeleri
  const headerKeywords = [
    "sıra",
    "sira",
    "poz",
    "birim",
    "metraj",
    "miktar",
    "fiyat",
    "tutar",
    "cinsi",
    "açıklama",
    "aciklama",
    "tanım",
    "tanim",
    "no",
    "unit",
    "amount",
    "price",
    "quantity",
  ];

  for (let r = 0; r < Math.min(data.length, 15); r++) {
    const row = data[r];
    if (!row || row.length < 3) continue;

    const rowText = row.map((c) => str(c).toLowerCase()).join(" ");
    const matchCount = headerKeywords.filter((k) => rowText.includes(k)).length;

    if (matchCount >= 3) {
      const columns = mapColumns(row);
      if (columns) {
        return { headerRow: r, columns };
      }
    }
  }

  // İkinci geçiş: daha esnek arama
  for (let r = 0; r < Math.min(data.length, 15); r++) {
    const row = data[r];
    if (!row || row.length < 3) continue;

    const rowText = row.map((c) => str(c).toLowerCase()).join(" ");
    if (
      (rowText.includes("sıra") || rowText.includes("no")) &&
      (rowText.includes("birim") || rowText.includes("fiyat"))
    ) {
      const columns = mapColumns(row);
      if (columns) {
        return { headerRow: r, columns };
      }
    }
  }

  return null;
}

// Sütunları eşle
function mapColumns(headerRow: unknown[]): ColumnMap | null {
  const cols: ColumnMap = {
    siraNo: -1,
    pozNo: -1,
    cinsi: -1,
    detay: -1,
    yukleniciNot: -1,
    birim: -1,
    metraj: -1,
    malzemeBF: -1,
    iscilikBF: -1,
    toplamBF: -1,
    toplamTutar: -1,
    ithalatPct: -1,
    ithalatTutar: -1,
    yerelPct: -1,
    yerelTutar: -1,
  };

  for (let c = 0; c < headerRow.length; c++) {
    const h = str(headerRow[c]).toLowerCase().trim();

    // Sıra No
    if (
      (h.includes("sıra") || h.includes("sira")) &&
      (h.includes("no") || h === "sıra" || h === "sira")
    ) {
      cols.siraNo = c;
    } else if (h === "no" && cols.siraNo < 0) {
      cols.siraNo = c;
    }

    // Poz No
    if (h.includes("poz") && (h.includes("no") || h === "poz")) {
      cols.pozNo = c;
    }

    // İşin Cinsi / Açıklama
    if (
      h.includes("cinsi") ||
      h.includes("açıklama") ||
      h.includes("aciklama") ||
      h.includes("tanım") ||
      h.includes("tanim") ||
      h.includes("iş kalemi") ||
      h.includes("is kalemi") ||
      h === "işin cinsi"
    ) {
      cols.cinsi = c;
    }

    // İşin Detayı
    if (
      h.includes("detay") ||
      h.includes("işin detayı") ||
      h.includes("is detayi") ||
      h.includes("detail")
    ) {
      cols.detay = c;
    }

    // Yüklenici Açıklama
    if (
      h.includes("yüklenici") ||
      h.includes("yuklenici") ||
      h.includes("contractor")
    ) {
      cols.yukleniciNot = c;
    }

    // Birim
    if (h === "birim" || h === "unit" || h === "br") {
      cols.birim = c;
    }

    // Metraj / Miktar
    if (
      h.includes("metraj") ||
      h.includes("miktar") ||
      h === "quantity" ||
      h === "adet"
    ) {
      cols.metraj = c;
    }

    // Malzeme Birim Fiyat
    if (
      (h.includes("malzeme") && h.includes("fiyat")) ||
      (h.includes("malzeme") && h.includes("bf")) ||
      h === "malzeme b.f." ||
      h.includes("material")
    ) {
      cols.malzemeBF = c;
    }

    // İşçilik Birim Fiyat
    if (
      (h.includes("işçilik") || h.includes("iscilik") || h.includes("işcilik")) &&
      (h.includes("fiyat") || h.includes("bf"))
    ) {
      cols.iscilikBF = c;
    }

    // Toplam Birim Fiyat
    if (
      h.includes("toplam") &&
      h.includes("birim") &&
      h.includes("fiyat")
    ) {
      cols.toplamBF = c;
    } else if (
      (h === "birim fiyat" || h === "b.fiyat" || h === "b. fiyat" || h === "bf") &&
      cols.toplamBF < 0
    ) {
      cols.toplamBF = c;
    }

    // Toplam Tutar
    if (
      (h.includes("toplam") && h.includes("tutar")) ||
      h === "tutar" ||
      h === "toplam" ||
      h === "amount" ||
      h === "total"
    ) {
      if (cols.toplamTutar < 0 || (h.includes("toplam") && h.includes("tutar"))) {
        cols.toplamTutar = c;
      }
    }

    // İthalat %
    if (h.includes("ithalat") && h.includes("%")) {
      cols.ithalatPct = c;
    }

    // İthalat Tutarı
    if (
      h.includes("ithalat") &&
      (h.includes("tutar") || h.includes("$") || h.includes("amount"))
    ) {
      cols.ithalatTutar = c;
    }

    // Yerel %
    if (h.includes("yerel") && h.includes("%")) {
      cols.yerelPct = c;
    }

    // Yerel Tutar
    if (
      h.includes("yerel") &&
      (h.includes("tutar") || h.includes("$") || h.includes("amount"))
    ) {
      cols.yerelTutar = c;
    }
  }

  // Sıra No sütunu kesin lazım, yoksa ilk sütunu dene
  if (cols.siraNo < 0) {
    cols.siraNo = 0;
  }

  // Cinsi sütunu da kesin lazım
  if (cols.cinsi < 0) {
    // Sıra no'dan sonraki metin sütununu bul
    cols.cinsi = cols.siraNo + 1;
    if (cols.pozNo === cols.siraNo + 1) {
      cols.cinsi = cols.siraNo + 2;
    }
  }

  return cols;
}

// Satır tipini belirle: section (bölüm başlığı), item (kalem), subtotal, skip
function classifyRow(
  siraNo: string,
  cinsi: string,
  birim: string,
  metraj: number,
  toplamTutar: number
): "section" | "item" | "subtotal" | "skip" {
  if (!cinsi && !siraNo) return "skip";

  // "TOPLAM", "ARA TOPLAM", "GENEL TOPLAM" gibi satırlar
  const upperCinsi = cinsi.toUpperCase();
  if (
    upperCinsi.includes("TOPLAM") ||
    upperCinsi.includes("TOTAL") ||
    upperCinsi.startsWith("GRAND") ||
    upperCinsi === "TOPLAMI"
  ) {
    return "subtotal";
  }

  // Sıra no analizi
  if (siraNo) {
    // Tam sayı sıra no (1, 2, 3...) → muhtemelen bölüm başlığı
    // Ondalık sıra no (1.1, 1.2, 2.1...) → kalem
    const isInteger = /^\d+$/.test(siraNo);
    const isDecimal = /^\d+\.\d+/.test(siraNo);

    if (isDecimal) {
      return "item";
    }

    if (isInteger) {
      // Eğer birim ve metraj yoksa bölüm başlığı
      if (!birim && metraj === 0) {
        return "section";
      }
      // Birim ve metraj varsa kalem
      if (birim || metraj > 0) {
        return "item";
      }
      // Sadece tutar varsa da bölüm başlığı olabilir
      return "section";
    }

    // Harf ile başlayan (A, B, C...) → grup/bölüm
    if (/^[A-Z]$/i.test(siraNo)) {
      return "section";
    }
  }

  // Cinsi var ama sıra no yok - muhtemelen bölüm başlığı
  if (cinsi && !siraNo && !birim) {
    return "section";
  }

  // Varsayılan: birim varsa kalem, yoksa atla
  if (birim || metraj > 0) return "item";

  return "skip";
}
