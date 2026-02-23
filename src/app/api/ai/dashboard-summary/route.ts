import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { userName } = await req.json();

    // ── Collect all real data from DB ──
    const [
      activeProjects,
      totalProjects,
      totalWorkers,
      pendingApprovals,
      totalApprovals,
      highRisks,
      totalRisks,
      totalActivities,
      completedActivities,
      inProgressActivities,
      totalZones,
      totalFloors,
      totalCompanies,
      totalTeams,
      totalMaterials,
      totalHakedis,
      projects,
      recentRisks,
    ] = await Promise.all([
      prisma.project.count({ where: { status: "ACTIVE" } }),
      prisma.project.count(),
      prisma.worker.count(),
      prisma.approval.count({ where: { status: "WAITING" } }),
      prisma.approval.count(),
      prisma.risk.count({ where: { impact: { gte: 4 } } }),
      prisma.risk.count(),
      prisma.activity.count(),
      prisma.activity.count({ where: { status: "COMPLETED" } }),
      prisma.activity.count({ where: { status: "IN_PROGRESS" } }),
      prisma.zone.count(),
      prisma.floor.count(),
      prisma.company.count(),
      prisma.team.count(),
      prisma.materialItem.count(),
      prisma.hakedis.count(),
      prisma.project.findMany({
        where: { status: "ACTIVE" },
        select: { name: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.risk.findMany({
        where: { impact: { gte: 4 } },
        select: { title: true, impact: true, probability: true },
        take: 3,
      }),
    ]);

    const projectSummary = projects
      .map((p) => p.name)
      .join(", ");

    const riskSummary = recentRisks
      .map((r) => `"${r.title}" (etki:${r.impact}, olasılık:${r.probability})`)
      .join("; ");

    // ── Build the prompt ──
    const systemPrompt = `Sen Şantiye360 yapay zeka asistanısın. İnşaat sektöründe dijital dönüşüm platformunun AI danışmanısın.
Kullanıcı yönetici seviyesinde biri. Ona günlük brifing veriyorsun.

Kurallar:
- Türkçe yaz, profesyonel ve etkileyici ol
- Kısa, öz ve veri odaklı konuş
- Her modül için TAM 1 cümle yaz (max 20 kelime)
- Cümleler gerçek verilere dayansın
- Teknolojik ve modern bir dil kullan
- Rakamları cümlelerde kullan

JSON döndür, başka bir şey yazma:
{
  "greeting": "2-3 cümlelik kişisel karşılama. Adıyla hitap et, günün özeti...",
  "modules": {
    "yonetim-paneli": "...",
    "proje-yonetimi": "...",
    "mahaller": "...",
    "katlar": "...",
    "aktiviteler": "...",
    "onaylar": "...",
    "riskler": "...",
    "hakedis": "...",
    "malzemeler": "...",
    "sirketler-ekipler": "...",
    "calisanlar": "...",
    "puantaj": "..."
  }
}`;

    const userPrompt = `Kullanıcı: ${userName}
Tarih: ${new Date().toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

Veriler:
- Aktif Proje: ${activeProjects} / ${totalProjects} toplam
- Proje İlerlemeleri: ${projectSummary || "Henüz ilerleme yok"}
- Toplam Çalışan: ${totalWorkers}
- Toplam Aktivite: ${totalActivities} (${completedActivities} tamamlandı, ${inProgressActivities} devam ediyor)
- Mahaller: ${totalZones}
- Katlar: ${totalFloors}
- Onaylar: ${pendingApprovals} bekliyor / ${totalApprovals} toplam
- Riskler: ${highRisks} yüksek / ${totalRisks} toplam — ${riskSummary || "Kritik risk yok"}
- Hakediş: ${totalHakedis} kayıt
- Malzemeler: ${totalMaterials} kalem
- Şirketler: ${totalCompanies}
- Ekipler: ${totalTeams}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("AI yanıt vermedi");

    const parsed = JSON.parse(content);

    return NextResponse.json({
      success: true,
      data: parsed,
      stats: {
        activeProjects,
        totalProjects,
        totalWorkers,
        pendingApprovals,
        highRisks,
        totalActivities,
        completedActivities,
        inProgressActivities,
        totalZones,
        totalFloors,
        totalCompanies,
        totalTeams,
        totalMaterials,
        totalHakedis,
      },
    });
  } catch (error) {
    console.error("AI Dashboard özeti hatası:", error);
    return NextResponse.json(
      { success: false, error: "AI özeti oluşturulamadı" },
      { status: 500 }
    );
  }
}
