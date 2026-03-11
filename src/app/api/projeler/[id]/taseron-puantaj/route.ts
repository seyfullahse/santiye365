import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET  /api/projeler/[id]/taseron-puantaj?date=2025-01-15
// POST /api/projeler/[id]/taseron-puantaj
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");

    // Projenin taşeron firmalarını getir (SUBCONTRACTOR tipinde, ekibi olan)
    const companies = await prisma.company.findMany({
      where: {
        type: "SUBCONTRACTOR",
        teams: {
          some: {
            workers: {
              some: {
                projectAssignments: {
                  some: { projectId }
                }
              }
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        specialization: true,
        contactPerson: true,
      },
      orderBy: { name: "asc" },
    });

    // O gün için puantaj kayıtları
    let puantajlar: any[] = [];
    if (dateStr) {
      puantajlar = await prisma.taseronPuantaj.findMany({
        where: {
          projectId,
          date: new Date(dateStr),
        },
        include: {
          company: { select: { id: true, name: true } },
          kalemler: true,
        },
      });
    }

    // Eğer taşeron firmaları bulunamadıysa, sadece projeye atanmış taşeronları getir
    // Alternatif: Tüm SUBCONTRACTOR firmaları listele
    let allSubcontractors = companies;
    if (allSubcontractors.length === 0) {
      allSubcontractors = await prisma.company.findMany({
        where: {
          type: "SUBCONTRACTOR",
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          specialization: true,
          contactPerson: true,
        },
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json({
      companies: allSubcontractors,
      puantajlar: puantajlar.map((p: any) => ({
        id: p.id,
        companyId: p.companyId,
        companyName: p.company.name,
        date: p.date,
        toplamIsci: p.toplamIsci,
        toplamMesai: p.toplamMesai,
        notes: p.notes,
        kalemler: p.kalemler.map((k: any) => ({
          id: k.id,
          pozisyon: k.pozisyon,
          sayi: k.sayi,
          mesaiSaat: k.mesaiSaat,
          notes: k.notes,
        })),
      })),
    });
  } catch (error) {
    console.error("Taşeron puantaj GET hatası:", error);
    return NextResponse.json(
      { error: "Taşeron puantaj verileri yüklenemedi" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { date, records } = body;

    // records: [{ companyId, toplamIsci, toplamMesai, notes, kalemler: [{ pozisyon, sayi, mesaiSaat, notes }] }]
    if (!date || !records || !Array.isArray(records)) {
      return NextResponse.json(
        { error: "Tarih ve kayıtlar gerekli" },
        { status: 400 }
      );
    }

    const dateObj = new Date(date);
    let savedCount = 0;

    for (const record of records) {
      const { companyId, toplamIsci, toplamMesai, notes, kalemler } = record;

      if (!companyId) continue;

      // Mevcut kaydı bul veya yeni oluştur (upsert)
      const existing = await prisma.taseronPuantaj.findUnique({
        where: {
          companyId_projectId_date: {
            companyId,
            projectId,
            date: dateObj,
          },
        },
      });

      if (existing) {
        // Güncelle - önce eski kalemleri sil
        await prisma.taseronPuantajKalemi.deleteMany({
          where: { puantajId: existing.id },
        });

        await prisma.taseronPuantaj.update({
          where: { id: existing.id },
          data: {
            toplamIsci: toplamIsci || 0,
            toplamMesai: toplamMesai || 0,
            notes: notes || null,
            kalemler: {
              create: (kalemler || []).map((k: any) => ({
                pozisyon: k.pozisyon,
                sayi: k.sayi || 0,
                mesaiSaat: k.mesaiSaat || 0,
                notes: k.notes || null,
              })),
            },
          },
        });
      } else {
        // Yeni oluştur
        await prisma.taseronPuantaj.create({
          data: {
            companyId,
            projectId,
            date: dateObj,
            toplamIsci: toplamIsci || 0,
            toplamMesai: toplamMesai || 0,
            notes: notes || null,
            kalemler: {
              create: (kalemler || []).map((k: any) => ({
                pozisyon: k.pozisyon,
                sayi: k.sayi || 0,
                mesaiSaat: k.mesaiSaat || 0,
                notes: k.notes || null,
              })),
            },
          },
        });
      }
      savedCount++;
    }

    return NextResponse.json({
      message: `${savedCount} taşeron puantaj kaydedildi`,
      count: savedCount,
    });
  } catch (error) {
    console.error("Taşeron puantaj POST hatası:", error);
    return NextResponse.json(
      { error: "Taşeron puantaj kaydedilemedi" },
      { status: 500 }
    );
  }
}
