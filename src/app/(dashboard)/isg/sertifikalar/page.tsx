"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Award, Search } from "lucide-react";
import { TablePagination } from "@/components/ui/table-pagination";

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
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
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

  const filteredCerts = useMemo(() => {
    if (!search) return certs;
    const s = search.toLowerCase();
    return certs.filter((c) =>
      `${c.employee.firstName} ${c.employee.lastName} ${c.name} ${c.issuedBy}`.toLowerCase().includes(s)
    );
  }, [certs, search]);

  useEffect(() => { setCurrentPage(1); }, [search]);

  const paginatedCerts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCerts.slice(start, start + pageSize);
  }, [filteredCerts, currentPage, pageSize]);

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

      {/* Arama */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Personel veya sertifika ara..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardHeader><CardTitle>Sertifika Listesi</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div> : filteredCerts.length === 0 ? <div className="text-center py-8 text-muted-foreground">{certs.length === 0 ? "Sertifika kaydı yok" : "Aramanızla eşleşen sertifika bulunamadı"}</div> : (
            <>
            <Table>
              <TableHeader><TableRow><TableHead>Personel</TableHead><TableHead>Sertifika</TableHead><TableHead>Veren Kurum</TableHead><TableHead>Durum</TableHead><TableHead>Son Geçerlilik</TableHead><TableHead>Kalan</TableHead></TableRow></TableHeader>
              <TableBody>
                {paginatedCerts.map((c) => (
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
            <TablePagination
              totalItems={filteredCerts.length}
              pageSize={pageSize}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel="sertifika"
            />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
