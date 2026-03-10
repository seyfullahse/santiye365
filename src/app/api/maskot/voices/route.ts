import { NextResponse } from "next/server";

// ElevenLabs'dan kullanılabilir sesleri listele
export async function GET() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ElevenLabs API anahtarı yapılandırılmamış" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "xi-api-key": apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs voices hatası:", response.status, errorText);
      return NextResponse.json(
        { error: "Sesler alınamadı" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Sadece ihtiyacımız olan bilgileri döndür
    const voices = (data.voices || []).map(
      (v: {
        voice_id: string;
        name: string;
        category: string;
        labels: Record<string, string>;
        preview_url: string;
      }) => ({
        voice_id: v.voice_id,
        name: v.name,
        category: v.category, // "premade", "cloned", "generated"
        gender: v.labels?.gender || null,
        age: v.labels?.age || null,
        accent: v.labels?.accent || null,
        description: v.labels?.description || null,
        use_case: v.labels?.use_case || null,
        preview_url: v.preview_url || null,
      })
    );

    return NextResponse.json(voices);
  } catch (error) {
    console.error("Voices API hatası:", error);
    return NextResponse.json(
      { error: "Sesler yüklenirken hata oluştu" },
      { status: 500 }
    );
  }
}
