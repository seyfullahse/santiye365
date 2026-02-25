"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Pencil, Trash2, Download } from "lucide-react";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  tcNo: string | null;
  phone: string | null;
  email: string | null;
  employeeNo: string | null;
  hireDate: string | null;
  status: string;
  salary: number | null;
  salaryType: string | null;
  gender: string | null;
  maritalStatus: string | null;
  bloodType: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  address: string | null;
  sgkNo: string | null;
  sgkStartDate: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  emergencyRelation: string | null;
  companyId: string | null;
  departmentId: string | null;
  positionId: string | null;
  projectId: string | null;
  teamId: string | null;
  company: { id: string; name: string } | null;
  department: { id: string; name: string } | null;
  position: { id: string; name: string } | null;
  project: { id: string; name: string } | null;
  team: { id: string; name: string } | null;
}

interface SelectOption { id: string; name: string }

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ACTIVE: { label: "Aktif", variant: "default" },
  PASSIVE: { label: "Pasif", variant: "destructive" },
  ON_LEAVE: { label: "İzinli", variant: "secondary" },
  SUSPENDED: { label: "Uzaklaştırılmış", variant: "outline" },
};

const genderMap: Record<string, string> = { MALE: "Erkek", FEMALE: "Kadın" };
const maritalMap: Record<string, string> = { SINGLE: "Bekar", MARRIED: "Evli", DIVORCED: "Boşanmış", WIDOWED: "Dul" };
const bloodMap: Record<string, string> = { A_POS: "A+", A_NEG: "A-", B_POS: "B+", B_NEG: "B-", AB_POS: "AB+", AB_NEG: "AB-", O_POS: "0+", O_NEG: "0-" };
const salaryTypeMap: Record<string, string> = { MONTHLY: "Aylık", DAILY: "Günlük", HOURLY: "Saatlik" };

const emptyForm = {
  firstName: "", lastName: "", tcNo: "", phone: "", email: "", employeeNo: "",
  hireDate: "", status: "ACTIVE", salary: "", salaryType: "", gender: "", maritalStatus: "",
  bloodType: "", birthDate: "", birthPlace: "", address: "", sgkNo: "", sgkStartDate: "",
  emergencyName: "", emergencyPhone: "", emergencyRelation: "",
  companyId: "", departmentId: "", positionId: "", projectId: "", teamId: "",
};

export default function PersonelPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState(emptyForm);

  // Dropdown data
  const [departments, setDepartments] = useState<SelectOption[]>([]);
  const [positions, setPositions] = useState<SelectOption[]>([]);
  const [companies, setCompanies] = useState<SelectOption[]>([]);
  const [projects, setProjects] = useState<SelectOption[]>([]);
  const [teams, setTeams] = useState<SelectOption[]>([]);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (deptFilter) params.set("departmentId", deptFilter);
    const res = await fetch(`/api/ik/personel?${params}`);
    const data = await res.json();
    setEmployees(data.employees || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [search, statusFilter, deptFilter]);

  const fetchDropdowns = useCallback(async () => {
    const [deptRes, compRes, projRes, teamRes] = await Promise.all([
      fetch("/api/ik/departmanlar"),
      fetch("/api/sirketler"),
      fetch("/api/projeler"),
      fetch("/api/ekipler"),
    ]);
    const [deptData, compData, projData, teamData] = await Promise.all([
      deptRes.json(), compRes.json(), projRes.json(), teamRes.json(),
    ]);
    setDepartments(Array.isArray(deptData) ? deptData : []);
    setCompanies(Array.isArray(compData) ? compData : []);
    setProjects(Array.isArray(projData) ? projData : []);
    setTeams(Array.isArray(teamData) ? teamData : []);
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);
  useEffect(() => { fetchDropdowns(); }, [fetchDropdowns]);

  // Departman seçildiğinde pozisyonları getir
  useEffect(() => {
    if (form.departmentId) {
      fetch(`/api/ik/pozisyonlar?departmentId=${form.departmentId}`)
        .then((r) => r.json())
        .then((data) => setPositions(Array.isArray(data) ? data : []))
        .catch(() => setPositions([]));
    } else {
      setPositions([]);
    }
  }, [form.departmentId]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setForm({
      firstName: emp.firstName, lastName: emp.lastName, tcNo: emp.tcNo || "",
      phone: emp.phone || "", email: emp.email || "", employeeNo: emp.employeeNo || "",
      hireDate: emp.hireDate?.split("T")[0] || "", status: emp.status, salary: emp.salary?.toString() || "",
      salaryType: emp.salaryType || "", gender: emp.gender || "", maritalStatus: emp.maritalStatus || "",
      bloodType: emp.bloodType || "", birthDate: emp.birthDate?.split("T")[0] || "",
      birthPlace: emp.birthPlace || "", address: emp.address || "", sgkNo: emp.sgkNo || "",
      sgkStartDate: emp.sgkStartDate?.split("T")[0] || "",
      emergencyName: emp.emergencyName || "", emergencyPhone: emp.emergencyPhone || "",
      emergencyRelation: emp.emergencyRelation || "",
      companyId: emp.companyId || "", departmentId: emp.departmentId || "",
      positionId: emp.positionId || "", projectId: emp.projectId || "", teamId: emp.teamId || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const url = editing ? `/api/ik/personel/${editing.id}` : "/api/ik/personel";
    const method = editing ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setDialogOpen(false);
    fetchEmployees();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu personeli silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/ik/personel/${id}`, { method: "DELETE" });
    fetchEmployees();
  };

  const exportCSV = () => {
    const headers = ["Sicil No", "Ad", "Soyad", "TC", "Telefon", "E-posta", "Departman", "Pozisyon", "Durum", "İşe Giriş"];
    const rows = employees.map((e) => [
      e.employeeNo || "", e.firstName, e.lastName, e.tcNo || "", e.phone || "", e.email || "",
      e.department?.name || "", e.position?.name || "", statusMap[e.status]?.label || e.status,
      e.hireDate ? new Date(e.hireDate).toLocaleDateString("tr-TR") : "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "personel.csv"; a.click();
  };

  const setField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Personel Yönetimi</h1>
          <p className="text-muted-foreground">{total} personel kayıtlı</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />CSV
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Yeni Personel</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? "Personel Düzenle" : "Yeni Personel"}</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="kisisel" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="kisisel">Kişisel</TabsTrigger>
                  <TabsTrigger value="organizasyon">Organizasyon</TabsTrigger>
                  <TabsTrigger value="is">İş Bilgileri</TabsTrigger>
                  <TabsTrigger value="acil">Acil Durum</TabsTrigger>
                </TabsList>

                <TabsContent value="kisisel" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Ad *</Label><Input value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} /></div>
                    <div><Label>Soyad *</Label><Input value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} /></div>
                    <div><Label>TC Kimlik No</Label><Input value={form.tcNo} onChange={(e) => setField("tcNo", e.target.value)} maxLength={11} /></div>
                    <div><Label>Doğum Tarihi</Label><Input type="date" value={form.birthDate} onChange={(e) => setField("birthDate", e.target.value)} /></div>
                    <div><Label>Doğum Yeri</Label><Input value={form.birthPlace} onChange={(e) => setField("birthPlace", e.target.value)} /></div>
                    <div><Label>Cinsiyet</Label>
                      <Select value={form.gender} onValueChange={(v) => setField("gender", v)}>
                        <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">Erkek</SelectItem>
                          <SelectItem value="FEMALE">Kadın</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Medeni Durum</Label>
                      <Select value={form.maritalStatus} onValueChange={(v) => setField("maritalStatus", v)}>
                        <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(maritalMap).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Kan Grubu</Label>
                      <Select value={form.bloodType} onValueChange={(v) => setField("bloodType", v)}>
                        <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(bloodMap).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Telefon</Label><Input value={form.phone} onChange={(e) => setField("phone", e.target.value)} /></div>
                    <div><Label>E-posta</Label><Input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} /></div>
                  </div>
                  <div><Label>Adres</Label><Input value={form.address} onChange={(e) => setField("address", e.target.value)} /></div>
                </TabsContent>

                <TabsContent value="organizasyon" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Şirket</Label>
                      <Select value={form.companyId} onValueChange={(v) => setField("companyId", v)}>
                        <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                        <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Departman</Label>
                      <Select value={form.departmentId} onValueChange={(v) => setField("departmentId", v)}>
                        <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                        <SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Pozisyon</Label>
                      <Select value={form.positionId} onValueChange={(v) => setField("positionId", v)}>
                        <SelectTrigger><SelectValue placeholder={form.departmentId ? "Seçiniz" : "Önce departman seçin"} /></SelectTrigger>
                        <SelectContent>{positions.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Proje</Label>
                      <Select value={form.projectId} onValueChange={(v) => setField("projectId", v)}>
                        <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                        <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Ekip</Label>
                      <Select value={form.teamId} onValueChange={(v) => setField("teamId", v)}>
                        <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                        <SelectContent>{teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Durum</Label>
                      <Select value={form.status} onValueChange={(v) => setField("status", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="is" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Sicil No</Label><Input value={form.employeeNo} onChange={(e) => setField("employeeNo", e.target.value)} /></div>
                    <div><Label>İşe Giriş Tarihi</Label><Input type="date" value={form.hireDate} onChange={(e) => setField("hireDate", e.target.value)} /></div>
                    <div><Label>SGK No</Label><Input value={form.sgkNo} onChange={(e) => setField("sgkNo", e.target.value)} /></div>
                    <div><Label>SGK Giriş Tarihi</Label><Input type="date" value={form.sgkStartDate} onChange={(e) => setField("sgkStartDate", e.target.value)} /></div>
                    <div><Label>Maaş</Label><Input type="number" value={form.salary} onChange={(e) => setField("salary", e.target.value)} /></div>
                    <div><Label>Maaş Türü</Label>
                      <Select value={form.salaryType} onValueChange={(v) => setField("salaryType", v)}>
                        <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(salaryTypeMap).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="acil" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Acil Durum Kişisi</Label><Input value={form.emergencyName} onChange={(e) => setField("emergencyName", e.target.value)} /></div>
                    <div><Label>Acil Durum Telefonu</Label><Input value={form.emergencyPhone} onChange={(e) => setField("emergencyPhone", e.target.value)} /></div>
                    <div><Label>Yakınlık Derecesi</Label><Input value={form.emergencyRelation} onChange={(e) => setField("emergencyRelation", e.target.value)} placeholder="Eş, Anne, Baba..." /></div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                <Button onClick={handleSave} disabled={!form.firstName || !form.lastName}>Kaydet</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtreler */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Ad, soyad, TC, sicil no ile ara..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Durum" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                {Object.entries(statusMap).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Departman" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tablo */}
      <Card>
        <CardHeader>
          <CardTitle>Personel Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Personel bulunamadı</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sicil No</TableHead>
                    <TableHead>Ad Soyad</TableHead>
                    <TableHead>Departman</TableHead>
                    <TableHead>Pozisyon</TableHead>
                    <TableHead>Şirket</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>İşe Giriş</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-mono text-xs">{emp.employeeNo || "-"}</TableCell>
                      <TableCell className="font-medium">{emp.firstName} {emp.lastName}</TableCell>
                      <TableCell>{emp.department?.name || "-"}</TableCell>
                      <TableCell>{emp.position?.name || "-"}</TableCell>
                      <TableCell>{emp.company?.name || "-"}</TableCell>
                      <TableCell>{emp.phone || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={statusMap[emp.status]?.variant || "secondary"}>
                          {statusMap[emp.status]?.label || emp.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{emp.hireDate ? new Date(emp.hireDate).toLocaleDateString("tr-TR") : "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(emp)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(emp.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
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
