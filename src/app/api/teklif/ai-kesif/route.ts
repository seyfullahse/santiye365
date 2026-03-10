import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // AI response can take time

interface KesifRequest {
  tenderId: string;
  versionId: string;
  // Proje tanımı
  buildingType: string;       // "Konut", "AVM", "Hastane", "Fabrika", "Okul", vb.
  totalArea: number;          // Toplam inşaat alanı (m²)
  floorCount: number;         // Kat sayısı
  basementCount: number;      // Bodrum kat sayısı
  location: string;           // İl / İlçe
  structureType: string;      // "Betonarme", "Çelik", "Prefabrik", "Karma"
  qualityLevel: string;       // "Ekonomik", "Orta", "Lüks", "Ultra Lüks"
  // Opsiyonel açıklama
  additionalNotes?: string;
  // Hangi disiplinler dahil
  selectedDisciplines?: string[]; // discipline code array: ["KABA", "INCE", ...]
}

// Türk yapı sektörü birim fiyat referansları (2025-2026 yaklaşık)
const UNIT_PRICE_CONTEXT = `
Türkiye inşaat sektörü 2026 yılı yaklaşık birim fiyat referansları (TL):
- Beton C30: 2.500-3.500 TL/m³
- Kalıp: 350-600 TL/m²
- Nervürlü çelik donatı: 28.000-35.000 TL/ton
- Tuğla duvar (19cm): 450-700 TL/m²
- Alçı sıva: 250-400 TL/m²
- Seramik kaplama: 600-1.200 TL/m²
- Granit kaplama: 1.500-3.000 TL/m²
- Boya (iç): 180-350 TL/m²
- Boya (dış cephe): 300-600 TL/m²
- Isı yalıtımı (mantolama): 800-1.500 TL/m²
- Su yalıtımı (membran): 200-450 TL/m²
- Asma tavan (alçıpan): 400-700 TL/m²
- Mekanik tesisat: 600-1.200 TL/m²
- Elektrik tesisatı: 400-800 TL/m²
- Yangın tesisatı: 150-350 TL/m²
- Asansör (kişilik 10): 800.000-1.500.000 TL/adet
- Alüminyum doğrama: 4.000-8.000 TL/m²
- Çelik çatı: 2.500-4.500 TL/m²
- Hafriyat: 80-150 TL/m³
- Peyzaj: 300-700 TL/m²
`;

export async function POST(request: NextRequest) {
  try {
    const body: KesifRequest = await request.json();
    const {
      tenderId,
      versionId,
      buildingType,
      totalArea,
      floorCount,
      basementCount,
      location,
      structureType,
      qualityLevel,
      additionalNotes,
      selectedDisciplines,
    } = body;

    // Validasyon
    if (!tenderId || !versionId || !buildingType || !totalArea || !floorCount) {
      return NextResponse.json(
        { error: "Zorunlu alanlar eksik: buildingType, totalArea, floorCount" },
        { status: 400 }
      );
    }

    // Mevcut disiplinleri DB'den çek
    const allDisciplines: Array<{ id: string; code: string; name: string; color: string }> = await prisma.teklifDiscipline.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, code: true, name: true, color: true },
    });

    // Seçilen disiplinleri filtrele
    const activeDisciplines = selectedDisciplines?.length
      ? allDisciplines.filter(d => selectedDisciplines.includes(d.code))
      : allDisciplines;

    const disciplineList = activeDisciplines
      .map(d => `${d.code}: ${d.name}`)
      .join("\n");

    // OpenAI ile keşif oluştur
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `Sen Türkiye'de deneyimli bir yapı maliyet mühendisisin. İnşaat projelerinin keşif (metraj ve maliyet) tablolarını hazırlıyorsun. 

GÖREV: Verilen proje bilgilerine göre kapsamlı bir keşif tablosu (iş kalemleri listesi) oluştur.

KURALLAR:
1. Her iş kalemi için gerçekçi Türkiye 2026 fiyatları kullan
2. Poz kodları Bayındırlık formatına uygun olsun (ör: 04.503/2A, 16.053, 21.011 vb.)
3. Miktarlar (metraj) proje alanına göre gerçekçi hesaplanmalı
4. Her kalemin işçilik, malzeme ve ekipman maliyet dağılımını belirt
5. Disiplin bazında grupla
6. Birimler Türkçe olsun (m², m³, kg, ton, adet, mt, takım, lt vb.)
7. Kalite seviyesine göre fiyatları ayarla
8. İş kalemlerini mantıklı sıralamayla ver (disiplin grupları altında)

${UNIT_PRICE_CONTEXT}

MEVCUT DİSİPLİNLER:
${disciplineList}

JSON formatında yanıt ver. Başka hiçbir metin ekleme, sadece JSON:
{
  "items": [
    {
      "disciplineCode": "KABA",
      "groupName": "Betonarme İşleri",
      "subGroupName": "Kalıp",
      "pozCode": "04.503/2A",
      "description": "Düz yüzeyli betonarme kalıbı yapılması",
      "unit": "m²",
      "quantity": 5000,
      "unitPrice": 480,
      "laborCost": 180,
      "materialCost": 250,
      "equipmentCost": 50,
      "notes": ""
    }
  ],
  "summary": {
    "totalItems": 85,
    "estimatedTotalCost": 45000000,
    "costPerM2": 9000,
    "notes": "Yaklaşık maliyet tahmini"
  }
}`;

    const userPrompt = `Aşağıdaki inşaat projesi için detaylı keşif tablosu oluştur:

📋 PROJE BİLGİLERİ:
- Bina Tipi: ${buildingType}
- Toplam İnşaat Alanı: ${totalArea.toLocaleString("tr-TR")} m²
- Kat Sayısı: ${floorCount} normal kat + ${basementCount || 0} bodrum kat
- Lokasyon: ${location || "İstanbul"}
- Taşıyıcı Sistem: ${structureType || "Betonarme"}
- Kalite Seviyesi: ${qualityLevel || "Orta"}
${additionalNotes ? `- Ek Notlar: ${additionalNotes}` : ""}

📐 KAPSAM (Dahil edilecek disiplinler):
${activeDisciplines.map((d) => `✅ ${d.name}`).join("\n")}

Tüm disiplinler için kapsamlı iş kalemleri üret. Her disiplin için en az 5-8 kalem olsun. Miktarları projenin alanına (${totalArea} m²) göre gerçekçi hesapla. Fiyatları ${qualityLevel || "Orta"} kalite seviyesine göre ayarla.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 16000,
      response_format: { type: "json_object" },
    });

    const aiContent = response.choices[0]?.message?.content;
    if (!aiContent) {
      return NextResponse.json({ error: "AI yanıt vermedi" }, { status: 500 });
    }

    let aiResult: any;
    try {
      aiResult = JSON.parse(aiContent);
    } catch {
      return NextResponse.json({ error: "AI yanıtı parse edilemedi" }, { status: 500 });
    }

    const aiItems = aiResult.items;
    if (!Array.isArray(aiItems) || aiItems.length === 0) {
      return NextResponse.json({ error: "AI boş keşif üretti" }, { status: 500 });
    }

    // Disiplin kodlarını ID'lere mapla
    const disciplineMap = new Map<string, string>();
    for (const d of allDisciplines) disciplineMap.set(d.code, d.id);

    // Keşif kalemlerini DB'ye ekle
    const maxSort = await prisma.tenderItem.aggregate({
      where: { versionId },
      _max: { sortOrder: true },
    });
    let nextSort = (maxSort._max.sortOrder ?? 0) + 1;

    const dbItems = aiItems.map((item: any, idx: number) => ({
      versionId,
      disciplineId: disciplineMap.get(item.disciplineCode) || null,
      pozItemId: null,
      groupName: item.groupName || null,
      subGroupName: item.subGroupName || null,
      pozCode: item.pozCode || null,
      description: item.description || "",
      unit: item.unit || "",
      quantity: parseFloat(item.quantity) || 0,
      unitPrice: parseFloat(item.unitPrice) || 0,
      totalPrice: (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0),
      laborCost: parseFloat(item.laborCost) || 0,
      materialCost: parseFloat(item.materialCost) || 0,
      equipmentCost: parseFloat(item.equipmentCost) || 0,
      sortOrder: nextSort + idx,
      notes: item.notes || `AI tarafından otomatik oluşturuldu`,
    }));

    // Batch insert (500'lük chunks)
    const chunkSize = 500;
    let inserted = 0;
    for (let i = 0; i < dbItems.length; i += chunkSize) {
      const chunk = dbItems.slice(i, i + chunkSize);
      await prisma.tenderItem.createMany({ data: chunk });
      inserted += chunk.length;
    }

    // Version toplam maliyet güncelle
    const totals = await prisma.tenderItem.aggregate({
      where: { versionId },
      _sum: { totalPrice: true },
    });
    await prisma.tenderVersion.update({
      where: { id: versionId },
      data: { totalCost: totals._sum.totalPrice || 0 },
    });

    return NextResponse.json({
      success: true,
      inserted,
      summary: aiResult.summary || null,
      totalCost: totals._sum.totalPrice || 0,
    });
  } catch (error: any) {
    console.error("AI Keşif hatası:", error?.message);
    return NextResponse.json(
      { error: error?.message || "AI keşif oluşturulamadı" },
      { status: 500 }
    );
  }
}
