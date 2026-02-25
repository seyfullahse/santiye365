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
import { Plus, Check, X } from "lucide-react";

interface LeaveRequest {
  id: string; employeeId: string; type: string; startDate: string; endDate: string;
  totalDays: number; reason: string | null; status: string;
  employee: { id: string; firstName: string; lastName: string; employeeNo: string | null; department: { name: string } | null };
}
interface Employee { id: string; firstName: string; lastName: string }

const leaveTypeMap: Record<string, string> = {
  ANNUAL: "Yıllık İzin", SICK: "Hastalık", MATERNITY: "Doğum", PATERNITY: "Babalık",
  MARRIAGE: "Evlilik", BEREAVEMENT: "Ölüm", UNPAID: "Ücretsiz", COMPENSATION: "Telafi", OTHER_LEAVE: "Diğer",
};
const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Bekliyor", variant: "secondary" },
  APPROVED: { label: "Onaylandı", variant: "default" },
  REJECTED: { label: "Reddedildi", variant: "destructive" },
  CANCELLED: { label: "İptal", variant: "outline" },
};

export default function IzinlerPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState({ employeeId: "", type: "ANNUAL", startDate: "", endDate: "", totalDays: "1", reason: "" });

  const fetchData = async () => {
    setLoading(true);
    const params = statusFilter ? `?status=${statusFilter}` : "";
    const [reqRes, empRes] = await Promise.all([fetch(`/api/ik/izinler${params}`), fetch("/api/ik/personel?limit=500")]);
    const [reqData, empData] = await Promise.all([reqRes.json(), empRes.json()]);
    setRequests(Array.isArray(reqData) ? reqData : []);
    setEmployees(empData.employees || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const handleSave = async () => {
    await fetch("/api/ik/izinler", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setDialogOpen(false);
    fetchData();
  };

  const handleAction = async (id: string, status: string) => {
    await fetch(`/api/ik/izinler/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchData();
  };

  const setField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold">İzin Yönetimi</h1><p className="text-muted-foreground">İzin talepleri ve onay süreci</p></div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Durum Filtresi" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              {Object.entries(statusMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Yeni İzin Talebi</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Yeni İzin Talebi</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div><Label>Personel *</Label>
                  <Select value={form.employeeId} onValueChange={(v) => setField("employeeId", v)}>
                    <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                    <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>İzin Türü</Label>
                  <Select value={form.type} onValueChange={(v) => setField("type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(leaveTypeMap).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Başlangıç *</Label><Input type="date" value={form.startDate} onChange={(e) => setField("startDate", e.target.value)} /></div>
                  <div><Label>Bitiş *</Label><Input type="date" value={form.endDate} onChange={(e) => setField("endDate", e.target.value)} /></div>
                </div>
                <div><Label>Gün Sayısı</Label><Input type="number" value={form.totalDays} onChange={(e) => setField("totalDays", e.target.value)} /></div>
                <div><Label>Açıklama</Label><Input value={form.reason} onChange={(e) => setField("reason", e.target.value)} /></div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                  <Button onClick={handleSave} disabled={!form.employeeId || !form.startDate || !form.endDate}>Kaydet</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>İzin Talepleri</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div> : requests.length === 0 ? <div className="text-center py-8 text-muted-foreground">İzin talebi yok</div> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Personel</TableHead>
                    <TableHead>Departman</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead>Başlangıç</TableHead>
                    <TableHead>Bitiş</TableHead>
                    <TableHead className="text-center">Gün</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.employee.firstName} {r.employee.lastName}</TableCell>
                      <TableCell>{r.employee.department?.name || "-"}</TableCell>
                      <TableCell>{leaveTypeMap[r.type] || r.type}</TableCell>
                      <TableCell>{new Date(r.startDate).toLocaleDateString("tr-TR")}</TableCell>
                      <TableCell>{new Date(r.endDate).toLocaleDateString("tr-TR")}</TableCell>
                      <TableCell className="text-center">{r.totalDays}</TableCell>
                      <TableCell><Badge variant={statusMap[r.status]?.variant || "secondary"}>{statusMap[r.status]?.label || r.status}</Badge></TableCell>
                      <TableCell>
                        {r.status === "PENDING" && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleAction(r.id, "APPROVED")} title="Onayla"><Check className="h-4 w-4 text-green-600" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleAction(r.id, "REJECTED")} title="Reddet"><X className="h-4 w-4 text-red-600" /></Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
