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
import { Plus, Stethoscope } from "lucide-react";

interface Exam {
  id: string; examType: string; examDate: string; result: string; nextExamDate: string | null; notes: string | null;
  employee: { id: string; firstName: string; lastName: string };
}
interface Employee { id: string; firstName: string; lastName: string }

const examTypeMap: Record<string, string> = {
  ENTRY: "İşe Giriş", PERIODIC: "Periyodik", EXIT_EXAM: "İşten Çıkış", RETURN: "İşe Dönüş",
};

const resultMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING_EXAM: { label: "Bekliyor", variant: "outline" },
  FIT: { label: "Uygun", variant: "default" },
  CONDITIONAL: { label: "Koşullu", variant: "secondary" },
  UNFIT: { label: "Uygun Değil", variant: "destructive" },
};

export default function MuayenelerPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: "", examType: "PERIODIC", examDate: "", result: "PENDING_EXAM", nextExamDate: "", notes: "" });

  const fetchData = async () => {
    setLoading(true);
    const [mRes, eRes] = await Promise.all([fetch("/api/isg/muayeneler"), fetch("/api/ik/personel?limit=500")]);
    const [mData, eData] = await Promise.all([mRes.json(), eRes.json()]);
    setExams(Array.isArray(mData) ? mData : []);
    setEmployees(eData.employees || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    await fetch("/api/isg/muayeneler", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, nextExamDate: form.nextExamDate || null, notes: form.notes || null }),
    });
    setDialogOpen(false);
    fetchData();
  };

  const setField = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Stethoscope className="h-6 w-6" />Sağlık Muayeneleri</h1>
          <p className="text-muted-foreground">Periyodik ve giriş muayene kayıtları</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Yeni Muayene</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Muayene Kaydı Ekle</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div><Label>Personel *</Label>
                <Select value={form.employeeId} onValueChange={(v) => setField("employeeId", v)}>
                  <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                  <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Muayene Türü</Label>
                <Select value={form.examType} onValueChange={(v) => setField("examType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(examTypeMap).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Muayene Tarihi *</Label><Input type="date" value={form.examDate} onChange={(e) => setField("examDate", e.target.value)} /></div>
                <div><Label>Sonraki Muayene</Label><Input type="date" value={form.nextExamDate} onChange={(e) => setField("nextExamDate", e.target.value)} /></div>
              </div>
              <div><Label>Sonuç</Label>
                <Select value={form.result} onValueChange={(v) => setField("result", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(resultMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Notlar</Label><Textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                <Button onClick={handleSave} disabled={!form.employeeId || !form.examDate}>Kaydet</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader><CardTitle>Muayene Kayıtları</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div> : exams.length === 0 ? <div className="text-center py-8 text-muted-foreground">Muayene kaydı yok</div> : (
            <Table>
              <TableHeader><TableRow><TableHead>Personel</TableHead><TableHead>Tür</TableHead><TableHead>Tarih</TableHead><TableHead>Sonuç</TableHead><TableHead>Sonraki Muayene</TableHead><TableHead>Not</TableHead></TableRow></TableHeader>
              <TableBody>
                {exams.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.employee.firstName} {e.employee.lastName}</TableCell>
                    <TableCell>{examTypeMap[e.examType] || e.examType}</TableCell>
                    <TableCell>{new Date(e.examDate).toLocaleDateString("tr-TR")}</TableCell>
                    <TableCell><Badge variant={resultMap[e.result]?.variant || "secondary"}>{resultMap[e.result]?.label || e.result}</Badge></TableCell>
                    <TableCell>{e.nextExamDate ? new Date(e.nextExamDate).toLocaleDateString("tr-TR") : "-"}</TableCell>
                    <TableCell className="max-w-xs truncate">{e.notes || "-"}</TableCell>
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
