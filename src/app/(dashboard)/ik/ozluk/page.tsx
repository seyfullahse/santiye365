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
import { Plus } from "lucide-react";

interface Doc {
  id: string; type: string; name: string; fileUrl: string | null; expiryDate: string | null;
  employee: { id: string; firstName: string; lastName: string };
}
interface Employee { id: string; firstName: string; lastName: string }

const docTypeMap: Record<string, string> = {
  KIMLIK: "Kimlik", DIPLOMA: "Diploma", SAGLIK_RAPORU: "Sağlık Raporu", ADLI_SICIL: "Adli Sicil",
  IKAMETGAH: "İkametgah", SGK_BILDIRGE: "SGK Bildirgesi", SOZLESME: "Sözleşme", EHLIYET: "Ehliyet",
  SERTIFIKA: "Sertifika", DIGER: "Diğer",
};

export default function OzlukPage() {
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: "", type: "KIMLIK", name: "", expiryDate: "", notes: "" });

  const fetchData = async () => {
    setLoading(true);
    const [docRes, empRes] = await Promise.all([fetch("/api/ik/evraklar"), fetch("/api/ik/personel?limit=500")]);
    const [docData, empData] = await Promise.all([docRes.json(), empRes.json()]);
    setDocuments(Array.isArray(docData) ? docData : []);
    setEmployees(empData.employees || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    await fetch("/api/ik/evraklar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setDialogOpen(false);
    fetchData();
  };

  const setField = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));
  const isExpired = (d: string | null) => d && new Date(d) < new Date();

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Özlük Dosyası</h1><p className="text-muted-foreground">Personel evrak yönetimi</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Yeni Evrak</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Yeni Evrak Kaydı</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div><Label>Personel *</Label>
                <Select value={form.employeeId} onValueChange={(v) => setField("employeeId", v)}>
                  <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                  <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Evrak Türü</Label>
                <Select value={form.type} onValueChange={(v) => setField("type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(docTypeMap).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Evrak Adı *</Label><Input value={form.name} onChange={(e) => setField("name", e.target.value)} /></div>
              <div><Label>Geçerlilik Tarihi</Label><Input type="date" value={form.expiryDate} onChange={(e) => setField("expiryDate", e.target.value)} /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                <Button onClick={handleSave} disabled={!form.employeeId || !form.name}>Kaydet</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader><CardTitle>Evrak Listesi</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div> : documents.length === 0 ? <div className="text-center py-8 text-muted-foreground">Evrak kaydı yok</div> : (
            <Table>
              <TableHeader><TableRow><TableHead>Personel</TableHead><TableHead>Tür</TableHead><TableHead>Evrak Adı</TableHead><TableHead>Geçerlilik</TableHead><TableHead>Durum</TableHead></TableRow></TableHeader>
              <TableBody>
                {documents.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.employee.firstName} {d.employee.lastName}</TableCell>
                    <TableCell>{docTypeMap[d.type] || d.type}</TableCell>
                    <TableCell>{d.name}</TableCell>
                    <TableCell>{d.expiryDate ? new Date(d.expiryDate).toLocaleDateString("tr-TR") : "-"}</TableCell>
                    <TableCell>{isExpired(d.expiryDate) ? <Badge variant="destructive">Süresi Dolmuş</Badge> : <Badge variant="default">Geçerli</Badge>}</TableCell>
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
