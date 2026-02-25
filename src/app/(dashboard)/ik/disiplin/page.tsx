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
import { Plus } from "lucide-react";

interface DisciplineRecord { id: string; type: string; date: string; description: string; action: string | null; employee: { id: string; firstName: string; lastName: string; employeeNo: string | null } }
interface Employee { id: string; firstName: string; lastName: string }

const typeMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  VERBAL_WARNING: { label: "Sözlü Uyarı", variant: "secondary" },
  WRITTEN_WARNING: { label: "Yazılı Uyarı", variant: "default" },
  SUSPENSION: { label: "Uzaklaştırma", variant: "destructive" },
  FINE: { label: "Para Cezası", variant: "outline" },
  TERMINATION_NOTICE: { label: "Fesih Bildirimi", variant: "destructive" },
};

export default function DisiplinPage() {
  const [records, setRecords] = useState<DisciplineRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: "", type: "VERBAL_WARNING", date: "", description: "", action: "", notes: "" });

  const fetchData = async () => {
    setLoading(true);
    const [recRes, empRes] = await Promise.all([fetch("/api/ik/disiplin"), fetch("/api/ik/personel?limit=500")]);
    const [recData, empData] = await Promise.all([recRes.json(), empRes.json()]);
    setRecords(Array.isArray(recData) ? recData : []);
    setEmployees(empData.employees || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    await fetch("/api/ik/disiplin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setDialogOpen(false);
    fetchData();
  };

  const setField = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Disiplin Kayıtları</h1><p className="text-muted-foreground">Uyarı ve tutanak yönetimi</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Yeni Kayıt</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Yeni Disiplin Kaydı</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div><Label>Personel *</Label>
                <Select value={form.employeeId} onValueChange={(v) => setField("employeeId", v)}>
                  <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                  <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Tür</Label>
                <Select value={form.type} onValueChange={(v) => setField("type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(typeMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Tarih *</Label><Input type="date" value={form.date} onChange={(e) => setField("date", e.target.value)} /></div>
              <div><Label>Açıklama *</Label><Textarea value={form.description} onChange={(e) => setField("description", e.target.value)} /></div>
              <div><Label>Alınan Karar</Label><Input value={form.action} onChange={(e) => setField("action", e.target.value)} /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                <Button onClick={handleSave} disabled={!form.employeeId || !form.date || !form.description}>Kaydet</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader><CardTitle>Disiplin Listesi</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div> : records.length === 0 ? <div className="text-center py-8 text-muted-foreground">Disiplin kaydı yok</div> : (
            <Table>
              <TableHeader><TableRow><TableHead>Personel</TableHead><TableHead>Tür</TableHead><TableHead>Tarih</TableHead><TableHead>Açıklama</TableHead><TableHead>Karar</TableHead></TableRow></TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.employee.firstName} {r.employee.lastName}</TableCell>
                    <TableCell><Badge variant={typeMap[r.type]?.variant || "secondary"}>{typeMap[r.type]?.label || r.type}</Badge></TableCell>
                    <TableCell>{new Date(r.date).toLocaleDateString("tr-TR")}</TableCell>
                    <TableCell className="max-w-xs truncate">{r.description}</TableCell>
                    <TableCell>{r.action || "-"}</TableCell>
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
