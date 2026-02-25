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
import { Plus, Award } from "lucide-react";

interface Certificate {
  id: string; name: string; issuedBy: string; issueDate: string; expiryDate: string | null; status: string;
  employee: { id: string; firstName: string; lastName: string };
}
interface Employee { id: string; firstName: string; lastName: string }

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  VALID: { label: "Geçerli", variant: "default" },
  EXPIRED_CERT: { label: "Süresi Doldu", variant: "destructive" },
  REVOKED: { label: "İptal Edildi", variant: "outline" },
};

export default function SertifikalarPage() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: "", name: "", issuedBy: "", issueDate: "", expiryDate: "", status: "VALID" });

  const fetchData = async () => {
    setLoading(true);
    const [cRes, eRes] = await Promise.all([fetch("/api/isg/sertifikalar"), fetch("/api/ik/personel?limit=500")]);
    const [cData, eData] = await Promise.all([cRes.json(), eRes.json()]);
    setCerts(Array.isArray(cData) ? cData : []);
    setEmployees(eData.employees || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    await fetch("/api/isg/sertifikalar", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, expiryDate: form.expiryDate || null }),
    });
    setDialogOpen(false);
    fetchData();
  };

  const setField = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  const daysUntilExpiry = (date: string | null): string => {
    if (!date) return "Süresiz";
    const days = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return `${Math.abs(days)} gün geçmiş`;
    if (days === 0) return "Bugün";
    return `${days} gün`;
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Award className="h-6 w-6" />Sertifikalar</h1>
          <p className="text-muted-foreground">Personel sertifika ve yetki belgeleri</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Yeni Sertifika</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Sertifika Ekle</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div><Label>Personel *</Label>
                <Select value={form.employeeId} onValueChange={(v) => setField("employeeId", v)}>
                  <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                  <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Sertifika Adı *</Label><Input value={form.name} onChange={(e) => setField("name", e.target.value)} /></div>
              <div><Label>Veren Kurum *</Label><Input value={form.issuedBy} onChange={(e) => setField("issuedBy", e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Veriliş Tarihi *</Label><Input type="date" value={form.issueDate} onChange={(e) => setField("issueDate", e.target.value)} /></div>
                <div><Label>Son Geçerlilik</Label><Input type="date" value={form.expiryDate} onChange={(e) => setField("expiryDate", e.target.value)} /></div>
              </div>
              <div><Label>Durum</Label>
                <Select value={form.status} onValueChange={(v) => setField("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(statusMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                <Button onClick={handleSave} disabled={!form.employeeId || !form.name || !form.issuedBy || !form.issueDate}>Kaydet</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader><CardTitle>Sertifika Listesi</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div> : certs.length === 0 ? <div className="text-center py-8 text-muted-foreground">Sertifika kaydı yok</div> : (
            <Table>
              <TableHeader><TableRow><TableHead>Personel</TableHead><TableHead>Sertifika</TableHead><TableHead>Veren Kurum</TableHead><TableHead>Durum</TableHead><TableHead>Son Geçerlilik</TableHead><TableHead>Kalan</TableHead></TableRow></TableHeader>
              <TableBody>
                {certs.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.employee.firstName} {c.employee.lastName}</TableCell>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.issuedBy}</TableCell>
                    <TableCell><Badge variant={statusMap[c.status]?.variant || "secondary"}>{statusMap[c.status]?.label || c.status}</Badge></TableCell>
                    <TableCell>{c.expiryDate ? new Date(c.expiryDate).toLocaleDateString("tr-TR") : "Süresiz"}</TableCell>
                    <TableCell>{daysUntilExpiry(c.expiryDate)}</TableCell>
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
