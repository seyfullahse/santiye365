import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

// POST - Sohbet mesajı gönder, AI cevabı al
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mascotId, message, source } = body;

    if (!mascotId || !message) {
      return NextResponse.json({ error: "Maskot ID ve mesaj zorunludur" }, { status: 400 });
    }

    // Maskot bilgisini al
    const mascot = await prisma.mascot.findUnique({ where: { id: mascotId } });
    if (!mascot) {
      return NextResponse.json({ error: "Maskot bulunamadı" }, { status: 404 });
    }

    // Prompt context'leri al
    const contexts = await prisma.mascotPromptContext.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    // Son 3 sohbeti al (bağlam için — isim hatırlama vb. yeterli, maliyet düşük)
    const recentConversations = await prisma.mascotConversation.findMany({
      where: { mascotId },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    // Rol haritası
    const roleMap: Record<string, string> = {
      MIMAR: "mimar",
      MUHENDIS: "inşaat mühendisi",
      KOORDINATOR: "proje koordinatörü",
    };

    // System prompt oluştur
    const systemPrompt = buildSystemPrompt(mascot, contexts, roleMap);

    // Sohbet geçmişini mesaj formatına çevir
    const historyMessages = recentConversations
      .reverse()
      .flatMap((conv) => [
        { role: "user" as const, content: conv.userMessage },
        { role: "assistant" as const, content: conv.aiResponse },
      ]);

    // OpenAI çağrısı
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...historyMessages,
        { role: "user", content: message },
      ],
      max_tokens: 300,
      temperature: 0.9,
    });

    const aiResponse = completion.choices[0]?.message?.content || "Hmm, bir şey söyleyemedim...";

    // Sohbeti kaydet
    const conversation = await prisma.mascotConversation.create({
      data: {
        mascotId,
        userMessage: message,
        aiResponse,
        source: source || "web",
      },
    });

    return NextResponse.json({
      id: conversation.id,
      response: aiResponse,
      mascotName: mascot.name,
      mascotEmoji: mascot.emoji,
    });
  } catch (error) {
    console.error("Sohbet hatası:", error);
    return NextResponse.json({ error: "Sohbet işlenemedi" }, { status: 500 });
  }
}

// GET - Sohbet geçmişi
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mascotId = searchParams.get("mascotId");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where = mascotId ? { mascotId } : {};

    const conversations = await prisma.mascotConversation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        mascot: { select: { name: true, emoji: true, role: true } },
      },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Sohbet geçmişi hatası:", error);
    return NextResponse.json({ error: "Geçmiş yüklenemedi" }, { status: 500 });
  }
}

// ─── System prompt builder ───
function buildSystemPrompt(
  mascot: { name: string; role: string; gender: string; personality: string },
  contexts: { key: string; content: string }[],
  roleMap: Record<string, string>
): string {
  const roleName = roleMap[mascot.role] || "uzman";
  const genderText = mascot.gender === "KADIN" ? "kadın" : "erkek";

  let prompt = `Sen "${mascot.name}" adında bir ${genderText} ${roleName}. Bir inşaat şantiyesinde çalışıyorsun.

KİŞİLİĞİN:
${mascot.personality}

TEMEL KURALLAR:
- Türkçe konuş
- Kısa ve öz cevap ver (max 2-3 cümle)
- Şantiye jargonu kullan
- Eğlenceli, samimi ve motive edici ol
- Emoji kullan ama abartma (max 2 emoji)
- Küfürlü mesajlara esprili ama saygılı karşılık ver
- Teknik sorulara kısa ama doğru cevap ver
- Bazen şantiye esprileri yap
- İsmin sorulursa "${mascot.name}" de
- Önceki mesajlardaki bilgileri hatırla (isim, konu, bağlam). Kullanıcı adını söylediyse sonraki mesajlarda adıyla hitap et.
`;

  // Bağlam bilgilerini ekle
  for (const ctx of contexts) {
    prompt += `\n${ctx.key.toUpperCase()} BİLGİSİ:\n${ctx.content}\n`;
  }

  return prompt;
}
