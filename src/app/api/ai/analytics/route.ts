// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import OpenAI from "openai";
import {
  AI_TOOL_DEFINITIONS,
  executeToolCall,
} from "@/lib/ai-analytics";

const SYSTEM_PROMPT = `Sen Şantiye360 AI Analitik Asistanısın. İnşaat projelerinin verilerini analiz ederek yöneticilere aksiyon alınabilir içgörüler sunarsın.

GÖREV:
- Proje gecikme risklerini analiz et
- Maliyet sapmalarını tespit et
- Bileşik risk skorlarını değerlendir
- İş gücü trendlerini izle
- Taşeron performansı karşılaştır

KURALLAR:
- Her zaman Türkçe yanıt ver
- Verilere dayalı konuş, tahmin yapma
- Sayısal değerleri belirt (%, TL, gün vb.)
- Kritik durumları ⚠️ ile işaretle
- Önerilerini maddeler halinde sun
- Yanıtların kısa ama anlaşılır olsun (maks 5-6 cümle)
- Karşılaştırmalarda tablo formatı kullan
- Risk seviyeleri: DÜŞÜK 🟢, ORTA 🟡, YÜKSEK 🟠, KRİTİK 🔴

ÖNEMLİ:
Kullanıcının sorusuna cevap verebilmek için mevcut araçları kullan. Gerçek veritabanı verileriyle çalışıyorsun.
Eğer veri yoksa veya sonuç boş gelirse, bunu dürüstçe belirt. Uydurma yapma.
Eğer kullanıcı genel bir soru sorarsa (örn: "Proje durumu ne?") proje özeti aracını kullan.
`;

// POST — AI analitik sohbet endpoint'i (function calling ile)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
    }

    const body = await request.json();
    const { message, history } = body;

    if (!message) {
      return NextResponse.json({ error: "Mesaj zorunludur" }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Geçmiş mesajları dönüştür
    const historyMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = (
      history || []
    )
      .slice(-6) // Son 6 mesaj (3 tur)
      .map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    // İlk çağrı
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...historyMessages,
      { role: "user", content: message },
    ];

    let response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      tools: AI_TOOL_DEFINITIONS,
      tool_choice: "auto",
      temperature: 0.3,
      max_tokens: 1000,
    });

    let assistantMessage = response.choices[0]?.message;

    // Function calling döngüsü — max 5 tur
    let iterations = 0;
    const toolResults: { name: string; data: unknown }[] = [];

    while (assistantMessage?.tool_calls && iterations < 5) {
      iterations++;

      // Tüm tool call'ları paralel çalıştır
      const toolCallResults = await Promise.all(
        assistantMessage.tool_calls.map(async (tc) => {
          const args = JSON.parse(tc.function.arguments || "{}");
          const result = await executeToolCall(tc.function.name, args);
          toolResults.push({ name: tc.function.name, data: result });
          return {
            role: "tool" as const,
            tool_call_id: tc.id,
            content: JSON.stringify(result),
          };
        })
      );

      // Sonuçlarla tekrar çağır
      messages.push(assistantMessage as OpenAI.Chat.Completions.ChatCompletionMessageParam);
      messages.push(...toolCallResults);

      response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        tools: AI_TOOL_DEFINITIONS,
        tool_choice: "auto",
        temperature: 0.3,
        max_tokens: 1000,
      });

      assistantMessage = response.choices[0]?.message;
    }

    const finalText = assistantMessage?.content || "Analiz tamamlanamadı, lütfen tekrar deneyin.";

    return NextResponse.json({
      response: finalText,
      toolsUsed: toolResults.map((t) => t.name),
      usage: {
        promptTokens: response.usage?.prompt_tokens,
        completionTokens: response.usage?.completion_tokens,
        totalTokens: response.usage?.total_tokens,
      },
    });
  } catch (error) {
    console.error("AI Analytics hatası:", error);
    return NextResponse.json({ error: "Analiz işlenemedi" }, { status: 500 });
  }
}
