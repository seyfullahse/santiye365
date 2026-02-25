"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, GraduationCap } from "lucide-react";

interface Training {
  id: string; completionDate: string | null; score: number | null; status: string;
  employee: { id: string; firstName: string; lastName: string };
  definition: { id: string; name: string; category: string };
}
interface TrainingDef { id: string; name: string; category: string }
interface Employee { id: string; firstName: string; lastName: string }

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PLANNED: { label: "Planlandı", variant: "secondary" },
  COMPLETED_TRAINING: { label: "Tamamlandı", variant: "default" },
  FAILED: { label: "Başarısız", variant: "destructive" },
  EXPIRED_TRAINING: { label: "Süresi Doldu", variant: "outline" },
};

const categoryMap: Record<string, string> = {
  ORIENTATION: "Oryantasyon", SAFETY: "Güvenlik", FIRST_AID: "İlk Yardım",
  FIRE: "Yangın", HEIGHT_WORK: "Yüksekte Çalışma", ELECTRICAL: "Elektrik",
  CONFINED_SPACE: "Kapalı Alan", CHEMICAL: "Kimyasal", EQUIPMENT: "Ekipman", OTHER: "Diğer",
};

export default function EgitimlerPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [definitions, setDefinitions] = useState<TrainingDef[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: "", trainingDefinitionId: "", status: "PLANNED", completionDate: "", score: "" });

  const fetchData = async () => {
    setLoading(true);
    const [tRes, dRes, eRes] = await Promise.all([
      fetch("/api/isg/egitimler"), fetch("/api/isg/egitim-tanimlari"), fetch("/api/ik/personel?limit=500"),
    ]);
    const [tData, dData, eData] = await Promise.all([tRes.json(), dRes.json(), eRes.json()]);
    setTrainings(Array.isArray(tData) ? tData : []);
    setDefinitions(Array.isArray(dData) ? dData : []);
    setEmployees(eData.employees || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    await fetch("/api/isg/egitimler", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, score: form.score ? parseFloat(form.score) : null, completionDate: form.completionDate || null }),
    });
    setDialogOpen(false);
    fetchData();
  };

  const setField = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><GraduationCap className="h-6 w-6" />Eğitimler</h1>
          <p className="text-muted-foreground">Personel İSG eğitim kayıtları</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Eğitim Ata</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Eğitim Kaydı Ekle</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div><Label>Personel *</Label>
                <Select value={form.employeeId} onValueChange={(v) => setField("employeeId", v)}>
                  <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                  <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Eğitim Tanımı *</Label>
                <Select value={form.trainingDefinitionId} onValueChange={(v) => setField("trainingDefinitionId", v)}>
                  <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                  <SelectContent>{definitions.map((d) => <SelectItem key={d.id} value={d.id}>{d.name} ({categoryMap[d.category] || d.category})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Durum</Label>
                <Select value={form.status} onValueChange={(v) => setField("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(statusMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Tamamlanma Tarihi</Label><Input type="date" value={form.completionDate} onChange={(e) => setField("completionDate", e.target.value)} /></div>
              <div><Label>Puan</Label><Input type="number" min="0" max="100" value={form.score} onChange={(e) => setField("score", e.target.value)} /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                <Button onClick={handleSave} disabled={!form.employeeId || !form.trainingDefinitionId}>Kaydet</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader><CardTitle>Eğitim Kayıtları</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div> : trainings.length === 0 ? <div className="text-center py-8 text-muted-foreground">Eğitim kaydı yok</div> : (
            <Table>
              <TableHeader><TableRow><TableHead>Personel</TableHead><TableHead>Eğitim</TableHead><TableHead>Kategori</TableHead><TableHead>Durum</TableHead><TableHead>Tarih</TableHead><TableHead>Puan</TableHead></TableRow></TableHeader>
              <TableBody>
                {trainings.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.employee.firstName} {t.employee.lastName}</TableCell>
                    <TableCell>{t.definition.name}</TableCell>
                    <TableCell>{categoryMap[t.definition.category] || t.definition.category}</TableCell>
                    <TableCell><Badge variant={statusMap[t.status]?.variant || "secondary"}>{statusMap[t.status]?.label || t.status}</Badge></TableCell>
                    <TableCell>{t.completionDate ? new Date(t.completionDate).toLocaleDateString("tr-TR") : "-"}</TableCell>
                    <TableCell>{t.score ?? "-"}</TableCell>
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
