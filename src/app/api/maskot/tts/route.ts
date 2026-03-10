import { NextRequest, NextResponse } from "next/server";

// ElevenLabs TTS API
// Cinsiyete göre ses seçimi:
// KADIN → Ayşe (güzel Türkçe kadın sesi)
// ERKEK → Kaan (güzel Türkçe erkek sesi)

// ElevenLabs Türkçe sesler (multilingual v2 model)
const VOICE_MAP: Record<string, string> = {
  // Kadın sesleri
  KADIN_MIMAR: "EXAVITQu4vr4xnSDxMaL",       // Bella - warm, expressive
  KADIN_MUHENDIS: "21m00Tcm4TlvDq8ikWAM",     // Rachel - calm, professional
  KADIN_KOORDINATOR: "pFZP5JQG7iQjIQuC4Bku",   // Lily - friendly, energetic
  // Erkek sesleri
  ERKEK_MIMAR: "VR6AewLTigWG4xSOukaG",         // Arnold - authoritative
  ERKEK_MUHENDIS: "ErXwobaYiN019PkySvjV",      // Antoni - warm, confident
  ERKEK_KOORDINATOR: "TxGEqnHWrfWFTfGW9XjX",   // Josh - deep, friendly
};

// Fallback varsayılan sesler
const DEFAULT_VOICES: Record<string, string> = {
  KADIN: "EXAVITQu4vr4xnSDxMaL",   // Bella
  ERKEK: "ErXwobaYiN019PkySvjV",    // Antoni
};

// Emoji regex - tüm Unicode emoji'lerini yakalar
function stripEmojis(text: string): string {
  return text
    .replace(/[\u{1F600}-\u{1F64F}]/gu, "") // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, "") // Misc Symbols and Pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, "") // Transport and Map
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "") // Flags
    .replace(/[\u{2600}-\u{26FF}]/gu, "")   // Misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, "")   // Dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, "")   // Variation Selectors
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, "") // Supplemental Symbols
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, "") // Chess Symbols
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, "") // Symbols and Pictographs Extended-A
    .replace(/[\u{200D}]/gu, "")             // Zero Width Joiner
    .replace(/[\u{20E3}]/gu, "")             // Combining Enclosing Keycap
    .replace(/[\u{FE0F}]/gu, "")             // Variation Selector-16
    .replace(/\s{2,}/g, " ")                 // Çoklu boşlukları temizle
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, gender, role, voiceId: directVoiceId } = body;

    if (!text) {
      return NextResponse.json({ error: "Metin zorunludur" }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ElevenLabs API anahtarı yapılandırılmamış" },
        { status: 500 }
      );
    }

    // Emoji'leri temizle
    const cleanText = stripEmojis(text);
    if (!cleanText) {
      return NextResponse.json(
        { error: "Temizlenen metin boş" },
        { status: 400 }
      );
    }

    // Öncelik: doğrudan voiceId > cinsiyet+rol haritası > varsayılan
    let voiceId = directVoiceId;
    if (!voiceId) {
      const voiceKey = `${gender || "ERKEK"}_${role || "MUHENDIS"}`;
      voiceId =
        VOICE_MAP[voiceKey] ||
        DEFAULT_VOICES[gender || "ERKEK"] ||
        DEFAULT_VOICES.ERKEK;
    }

    // ElevenLabs TTS API çağrısı
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.4,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API hatası:", response.status, errorText);
      return NextResponse.json(
        { error: "Ses oluşturulamadı", details: errorText },
        { status: response.status }
      );
    }

    // Audio binary'yi döndür
    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("TTS hatası:", error);
    return NextResponse.json({ error: "Ses oluşturulamadı" }, { status: 500 });
  }
}
