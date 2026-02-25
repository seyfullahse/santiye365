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
import { Plus, HardHat } from "lucide-react";

interface PPEAssignment {
  id: string; assignedDate: string; returnDate: string | null; status: string; notes: string | null;
  employee: { id: string; firstName: string; lastName: string };
  ppeType: { id: string; name: string; category: string };
}
interface PPEType { id: string; name: string; category: string }
interface Employee { id: string; firstName: string; lastName: string }

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ASSIGNED: { label: "Zimmetli", variant: "default" },
  RETURNED: { label: "İade Edildi", variant: "secondary" },
  DAMAGED: { label: "Hasarlı", variant: "destructive" },
  LOST: { label: "Kayıp", variant: "outline" },
  EXPIRED_PPE: { label: "Süresi Doldu", variant: "destructive" },
};

export default function KKDPage() {
  const [assignments, setAssignments] = useState<PPEAssignment[]>([]);
  const [ppeTypes, setPpeTypes] = useState<PPEType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: "", ppeTypeId: "", assignedDate: "", status: "ASSIGNED", notes: "" });

  const fetchData = async () => {
    setLoading(true);
    const [aRes, tRes, eRes] = await Promise.all([
      fetch("/api/isg/kkd"), fetch("/api/isg/kkd-turleri"), fetch("/api/ik/personel?limit=500"),
    ]);
    const [aData, tData, eData] = await Promise.all([aRes.json(), tRes.json(), eRes.json()]);
    setAssignments(Array.isArray(aData) ? aData : []);
    setPpeTypes(Array.isArray(tData) ? tData : []);
    setEmployees(eData.employees || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    await fetch("/api/isg/kkd", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, notes: form.notes || null }),
    });
    setDialogOpen(false);
    fetchData();
  };

  const setField = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><HardHat className="h-6 w-6" />KKD Yönetimi</h1>
          <p className="text-muted-foreground">Kişisel koruyucu donanım zimmet takibi</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />KKD Zimmetle</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>KKD Zimmetleme</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div><Label>Personel *</Label>
                <Select value={form.employeeId} onValueChange={(v) => setField("employeeId", v)}>
                  <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                  <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>KKD Türü *</Label>
                <Select value={form.ppeTypeId} onValueChange={(v) => setField("ppeTypeId", v)}>
                  <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                  <SelectContent>{ppeTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name} ({t.category})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Zimmet Tarihi *</Label><Input type="date" value={form.assignedDate} onChange={(e) => setField("assignedDate", e.target.value)} /></div>
              <div><Label>Durum</Label>
                <Select value={form.status} onValueChange={(v) => setField("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(statusMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Notlar</Label><Textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                <Button onClick={handleSave} disabled={!form.employeeId || !form.ppeTypeId || !form.assignedDate}>Kaydet</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader><CardTitle>KKD Zimmet Listesi</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div> : assignments.length === 0 ? <div className="text-center py-8 text-muted-foreground">KKD zimmet kaydı yok</div> : (
            <Table>
              <TableHeader><TableRow><TableHead>Personel</TableHead><TableHead>KKD</TableHead><TableHead>Zimmet Tarihi</TableHead><TableHead>Durum</TableHead><TableHead>İade Tarihi</TableHead><TableHead>Not</TableHead></TableRow></TableHeader>
              <TableBody>
                {assignments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.employee.firstName} {a.employee.lastName}</TableCell>
                    <TableCell>{a.ppeType.name}</TableCell>
                    <TableCell>{new Date(a.assignedDate).toLocaleDateString("tr-TR")}</TableCell>
                    <TableCell><Badge variant={statusMap[a.status]?.variant || "secondary"}>{statusMap[a.status]?.label || a.status}</Badge></TableCell>
                    <TableCell>{a.returnDate ? new Date(a.returnDate).toLocaleDateString("tr-TR") : "-"}</TableCell>
                    <TableCell className="max-w-xs truncate">{a.notes || "-"}</TableCell>
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
