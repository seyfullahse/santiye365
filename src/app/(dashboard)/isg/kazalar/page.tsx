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
import { Plus, Siren } from "lucide-react";

interface Accident {
  id: string; date: string; location: string; description: string; severity: string; status: string;
  lostDays: number | null;
  involvedEmployees: Array<{ employee: { id: string; firstName: string; lastName: string }; injuryType: string | null }>;
  project: { id: string; name: string } | null;
}
interface Employee { id: string; firstName: string; lastName: string }
interface Project { id: string; name: string }

const severityMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  NEAR_MISS: { label: "Ramak Kala", variant: "outline" },
  MINOR: { label: "Hafif", variant: "secondary" },
  MODERATE: { label: "Orta", variant: "default" },
  SERIOUS: { label: "Ciddi", variant: "destructive" },
  FATAL: { label: "Ölümlü", variant: "destructive" },
};

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  OPEN_ACCIDENT: { label: "Açık", variant: "secondary" },
  INVESTIGATING: { label: "İnceleniyor", variant: "default" },
  CLOSED_ACCIDENT: { label: "Kapatıldı", variant: "outline" },
};

export default function KazalarPage() {
  const [accidents, setAccidents] = useState<Accident[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    date: "", location: "", description: "", severity: "MINOR", status: "OPEN_ACCIDENT",
    lostDays: "", projectId: "", involvedEmployeeIds: [] as string[],
  });

  const fetchData = async () => {
    setLoading(true);
    const [aRes, eRes, pRes] = await Promise.all([
      fetch("/api/isg/kazalar"), fetch("/api/ik/personel?limit=500"), fetch("/api/projeler"),
    ]);
    const [aData, eData, pData] = await Promise.all([aRes.json(), eRes.json(), pRes.json()]);
    setAccidents(Array.isArray(aData) ? aData : []);
    setEmployees(eData.employees || []);
    setProjects(Array.isArray(pData) ? pData : []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    await fetch("/api/isg/kazalar", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        lostDays: form.lostDays ? parseInt(form.lostDays) : null,
        projectId: form.projectId || null,
      }),
    });
    setDialogOpen(false);
    fetchData();
  };

  const setField = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  const toggleEmployee = (id: string) => {
    setForm((p) => ({
      ...p,
      involvedEmployeeIds: p.involvedEmployeeIds.includes(id)
        ? p.involvedEmployeeIds.filter((e) => e !== id)
        : [...p.involvedEmployeeIds, id],
    }));
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Siren className="h-6 w-6" />İş Kazaları</h1>
          <p className="text-muted-foreground">Kaza kayıtları ve analiz</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Kaza Bildir</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>İş Kazası Bildirimi</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Tarih *</Label><Input type="date" value={form.date} onChange={(e) => setField("date", e.target.value)} /></div>
                <div><Label>Ciddiyet</Label>
                  <Select value={form.severity} onValueChange={(v) => setField("severity", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(severityMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Konum *</Label><Input value={form.location} onChange={(e) => setField("location", e.target.value)} /></div>
              <div><Label>Proje</Label>
                <Select value={form.projectId} onValueChange={(v) => setField("projectId", v)}>
                  <SelectTrigger><SelectValue placeholder="Seçiniz (opsiyonel)" /></SelectTrigger>
                  <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Açıklama *</Label><Textarea value={form.description} onChange={(e) => setField("description", e.target.value)} rows={3} /></div>
              <div><Label>Kayıp Gün Sayısı</Label><Input type="number" min="0" value={form.lostDays} onChange={(e) => setField("lostDays", e.target.value)} /></div>
              <div>
                <Label>İlgili Personel</Label>
                <div className="border rounded-md p-2 max-h-32 overflow-y-auto mt-1 space-y-1">
                  {employees.map((e) => (
                    <label key={e.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted p-1 rounded">
                      <input type="checkbox" checked={form.involvedEmployeeIds.includes(e.id)} onChange={() => toggleEmployee(e.id)} />
                      {e.firstName} {e.lastName}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                <Button onClick={handleSave} disabled={!form.date || !form.location || !form.description}>Kaydet</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader><CardTitle>Kaza Kayıtları</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div> : accidents.length === 0 ? <div className="text-center py-8 text-muted-foreground">Kaza kaydı yok</div> : (
            <Table>
              <TableHeader><TableRow><TableHead>Tarih</TableHead><TableHead>Konum</TableHead><TableHead>Ciddiyet</TableHead><TableHead>Durum</TableHead><TableHead>İlgili Personel</TableHead><TableHead>Kayıp Gün</TableHead><TableHead>Proje</TableHead></TableRow></TableHeader>
              <TableBody>
                {accidents.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{new Date(a.date).toLocaleDateString("tr-TR")}</TableCell>
                    <TableCell>{a.location}</TableCell>
                    <TableCell><Badge variant={severityMap[a.severity]?.variant || "secondary"}>{severityMap[a.severity]?.label || a.severity}</Badge></TableCell>
                    <TableCell><Badge variant={statusMap[a.status]?.variant || "secondary"}>{statusMap[a.status]?.label || a.status}</Badge></TableCell>
                    <TableCell>
                      {a.involvedEmployees?.length > 0
                        ? a.involvedEmployees.map((ie) => `${ie.employee.firstName} ${ie.employee.lastName}`).join(", ")
                        : "-"}
                    </TableCell>
                    <TableCell>{a.lostDays ?? "-"}</TableCell>
                    <TableCell>{a.project?.name || "-"}</TableCell>
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
