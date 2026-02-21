import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const disciplines = await prisma.discipline.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(disciplines);
  } catch (error) {
    console.error("Disiplinler alınamadı:", error);
    return NextResponse.json({ error: "Disiplinler alınamadı" }, { status: 500 });
  }
}
