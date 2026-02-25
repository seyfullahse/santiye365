"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Star } from "lucide-react";

interface Review { id: string; period: string; score: number | null; status: string; notes: string | null; employee: { id: string; firstName: string; lastName: string } }
interface Employee { id: string; firstName: string; lastName: string }

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Taslak", variant: "secondary" },
  SUBMITTED: { label: "Gönderildi", variant: "default" },
  COMPLETED: { label: "Tamamlandı", variant: "default" },
};

export default function PerformansPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: "", period: "", score: "", status: "DRAFT", notes: "" });

  const fetchData = async () => {
    setLoading(true);
    const [revRes, empRes] = await Promise.all([fetch("/api/ik/performans"), fetch("/api/ik/personel?limit=500")]);
    const [revData, empData] = await Promise.all([revRes.json(), empRes.json()]);
    setReviews(Array.isArray(revData) ? revData : []);
    setEmployees(empData.employees || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    await fetch("/api/ik/performans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, score: form.score ? parseFloat(form.score) : null }),
    });
    setDialogOpen(false);
    fetchData();
  };

  const setField = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  const renderStars = (score: number | null) => {
    if (score === null) return "-";
    const filled = Math.round(score);
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className={`h-4 w-4 ${i <= filled ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
        ))}
        <span className="ml-1 text-sm text-muted-foreground">({score})</span>
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Performans Değerlendirme</h1><p className="text-muted-foreground">Dönemsel performans kayıtları</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Yeni Değerlendirme</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Yeni Performans Değerlendirmesi</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div><Label>Personel *</Label>
                <Select value={form.employeeId} onValueChange={(v) => setField("employeeId", v)}>
                  <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                  <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Dönem *</Label><Input placeholder="2025-Q1" value={form.period} onChange={(e) => setField("period", e.target.value)} /></div>
              <div><Label>Puan (1-5)</Label><Input type="number" min="1" max="5" step="0.1" value={form.score} onChange={(e) => setField("score", e.target.value)} /></div>
              <div><Label>Durum</Label>
                <Select value={form.status} onValueChange={(v) => setField("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(statusMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Notlar</Label><Textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                <Button onClick={handleSave} disabled={!form.employeeId || !form.period}>Kaydet</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader><CardTitle>Değerlendirmeler</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div> : reviews.length === 0 ? <div className="text-center py-8 text-muted-foreground">Değerlendirme kaydı yok</div> : (
            <Table>
              <TableHeader><TableRow><TableHead>Personel</TableHead><TableHead>Dönem</TableHead><TableHead>Puan</TableHead><TableHead>Durum</TableHead><TableHead>Notlar</TableHead></TableRow></TableHeader>
              <TableBody>
                {reviews.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.employee.firstName} {r.employee.lastName}</TableCell>
                    <TableCell>{r.period}</TableCell>
                    <TableCell>{renderStars(r.score)}</TableCell>
                    <TableCell><Badge variant={statusMap[r.status]?.variant || "secondary"}>{statusMap[r.status]?.label || r.status}</Badge></TableCell>
                    <TableCell className="max-w-xs truncate">{r.notes || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
