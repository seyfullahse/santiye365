"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Archive,
  Undo2,
  Trash2,
  Eye,
  Building2,
  MapPin,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Gavel,
} from "lucide-react";
import Link from "next/link";

interface ArchivedTender {
  id: string;
  name: string;
  employer: string | null;
  location: string | null;
  dueDate: string | null;
  status: string;
  type: string;
  currency: string;
  createdAt: string;
  versions: { totalCost: number; totalPrice: number; markup: number }[];
}

const statusLabels: Record<string, string> = {
  DRAFT: "Taslak", PREPARING: "Hazırlanıyor", SUBMITTED: "Teklif Verildi",
  WON: "Kazanıldı", LOST: "Kaybedildi", CANCELLED: "İptal",
};
const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700", PREPARING: "bg-blue-100 text-blue-700",
  SUBMITTED: "bg-amber-100 text-amber-700", WON: "bg-emerald-100 text-emerald-700",
  LOST: "bg-red-100 text-red-700", CANCELLED: "bg-gray-200 text-gray-400",
};

function fmt(val: number, currency = "TRY"): string {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency, maximumFractionDigits: 0 }).format(val);
}

export default function ArsivPage() {
  const [tenders, setTenders] = useState<ArchivedTender[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    fetch("/api/teklif/ihaleler?archived=true")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTenders(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleUnarchive(id: string) {
    const res = await fetch(`/api/teklif/ihaleler/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: false }),
    });
    if (res.ok) { toast.success("İhale arşivden çıkarıldı"); fetchData(); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu ihaleyi kalıcı olarak silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/teklif/ihaleler/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("İhale silindi"); fetchData(); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">İhale Arşivi</h1>
        <p className="text-muted-foreground text-sm">Arşivlenmiş ihaleler — referans ve raporlama için</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>İhale</TableHead>
                <TableHead className="w-[120px]">Durum</TableHead>
                <TableHead className="w-[120px]">Son Tarih</TableHead>
                <TableHead className="w-[120px] text-right">Teklif</TableHead>
                <TableHead className="w-[100px]">Sonuç</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Yükleniyor...</TableCell>
                </TableRow>
              ) : tenders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Archive className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="font-medium">Arşivde ihale yok</p>
                    <p className="text-sm">Tamamlanan veya iptal edilen ihaleler burada görünür</p>
                  </TableCell>
                </TableRow>
              ) : (
                tenders.map((t) => {
                  const v = t.versions[0];
                  return (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div>
                          <Link href={`/teklif/ihaleler/${t.id}`} className="font-medium hover:underline">{t.name}</Link>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            {t.employer && <span className="flex items-center gap-0.5"><Building2 className="h-3 w-3" />{t.employer}</span>}
                            {t.location && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{t.location}</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[t.status]} variant="secondary">{statusLabels[t.status]}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {t.dueDate ? new Date(t.dueDate).toLocaleDateString("tr-TR") : "—"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {v ? fmt(v.totalPrice || v.totalCost, t.currency) : "—"}
                      </TableCell>
                      <TableCell>
                        {t.status === "WON" && <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-3 w-3 mr-1" />Kazanıldı</Badge>}
                        {t.status === "LOST" && <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />Kaybedildi</Badge>}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Link href={`/teklif/ihaleler/${t.id}`}>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                          </Link>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleUnarchive(t.id)} title="Arşivden Çıkar">
                            <Undo2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(t.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
