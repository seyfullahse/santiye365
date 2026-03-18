"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Pencil, Trash2, Download, Upload, FileDown, Users } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

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
  collarType: string | null;
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

interface SelectOption { id: string; name: string; type?: string }

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
const collarTypeMap: Record<string, string> = { BLUE: "Mavi Yaka", WHITE: "Beyaz Yaka" };

const emptyForm = {
  firstName: "", lastName: "", tcNo: "", phone: "", email: "", employeeNo: "",
  hireDate: "", status: "ACTIVE", salary: "", salaryType: "", gender: "", maritalStatus: "",
  bloodType: "", birthDate: "", birthPlace: "", address: "", sgkNo: "", sgkStartDate: "",
  emergencyName: "", emergencyPhone: "", emergencyRelation: "",
  collarType: "", companyId: "", departmentId: "", positionId: "", projectId: "", teamId: "",
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

  const [importing, setImporting] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [mainCompanyId, setMainCompanyId] = useState<string>("");

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
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    if (deptFilter && deptFilter !== "all") params.set("departmentId", deptFilter);
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
    const comps = Array.isArray(compData) ? compData : [];
    setCompanies(comps);
    // Ana firma (MAIN) varsayılan olarak seçilsin
    const mainComp = comps.find((c: SelectOption & { type?: string }) => c.type === "MAIN");
    if (mainComp) setMainCompanyId(mainComp.id);
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

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, companyId: mainCompanyId }); setDialogOpen(true); };
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
      collarType: emp.collarType || "", companyId: emp.companyId || "", departmentId: emp.departmentId || "",
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
    const headers = [
      "Ad", "Soyad", "TC Kimlik No", "Sicil No", "Telefon", "E-posta",
      "Yaka Tipi", "Departman", "Pozisyon", "Şirket", "Proje", "Ekip",
      "Cinsiyet", "Medeni Durum", "Kan Grubu", "Doğum Tarihi", "Doğum Yeri",
      "Adres", "SGK No", "SGK Giriş Tarihi", "İşe Giriş Tarihi",
      "Maaş", "Maaş Türü", "Durum",
      "Acil Durum Kişisi", "Acil Durum Telefonu", "Yakınlık Derecesi",
    ];
    const rows = employees.map((e) => [
      e.firstName, e.lastName, e.tcNo || "", e.employeeNo || "", e.phone || "", e.email || "",
      collarTypeMap[e.collarType || ""] || "", e.department?.name || "", e.position?.name || "", e.company?.name || "",
      e.project?.name || "", e.team?.name || "",
      genderMap[e.gender || ""] || "", maritalMap[e.maritalStatus || ""] || "",
      bloodMap[e.bloodType || ""] || "",
      e.birthDate ? new Date(e.birthDate).toLocaleDateString("tr-TR") : "",
      e.birthPlace || "", e.address || "", e.sgkNo || "",
      e.sgkStartDate ? new Date(e.sgkStartDate).toLocaleDateString("tr-TR") : "",
      e.hireDate ? new Date(e.hireDate).toLocaleDateString("tr-TR") : "",
      e.salary?.toString() || "", salaryTypeMap[e.salaryType || ""] || "",
      statusMap[e.status]?.label || e.status,
      e.emergencyName || "", e.emergencyPhone || "", e.emergencyRelation || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "personel.csv"; a.click();
  };

  const downloadCSVTemplate = () => {
    const headers = [
      "Ad", "Soyad", "TC Kimlik No", "Sicil No", "Telefon", "E-posta",
      "Yaka Tipi", "Departman", "Pozisyon", "Şirket", "Proje", "Ekip",
      "Cinsiyet", "Medeni Durum", "Kan Grubu", "Doğum Tarihi", "Doğum Yeri",
      "Adres", "SGK No", "SGK Giriş Tarihi", "İşe Giriş Tarihi",
      "Maaş", "Maaş Türü", "Durum",
      "Acil Durum Kişisi", "Acil Durum Telefonu", "Yakınlık Derecesi",
    ];
    const example = [
      "Ahmet", "Yılmaz", "12345678901", "S001", "05551234567", "ahmet@firma.com",
      "Mavi Yaka", "Şantiye/Saha", "Şantiye Şefi", "ABC İnşaat", "", "",
      "Erkek", "Evli", "A+", "15.03.1985", "İstanbul",
      "Kadıköy, İstanbul", "1234567890", "01.01.2024", "01.01.2024",
      "25000", "Aylık", "Aktif",
      "Ayşe Yılmaz", "05559876543", "Eş",
    ];
    const csv = [headers, example].map((r) => r.map((c) => `"${c}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "personel-sablonu.csv"; a.click();
  };

  const reverseCollarType: Record<string, string> = { "Mavi Yaka": "BLUE", "Beyaz Yaka": "WHITE" };
  const reverseGender: Record<string, string> = { "Erkek": "MALE", "Kadın": "FEMALE" };
  const reverseMarital: Record<string, string> = { "Bekar": "SINGLE", "Evli": "MARRIED", "Boşanmış": "DIVORCED", "Dul": "WIDOWED" };
  const reverseBlood: Record<string, string> = { "A+": "A_POS", "A-": "A_NEG", "B+": "B_POS", "B-": "B_NEG", "AB+": "AB_POS", "AB-": "AB_NEG", "0+": "O_POS", "0-": "O_NEG" };
  const reverseStatus: Record<string, string> = { "Aktif": "ACTIVE", "Pasif": "PASSIVE", "İzinli": "ON_LEAVE", "Uzaklaştırılmış": "SUSPENDED" };
  const reverseSalaryType: Record<string, string> = { "Aylık": "MONTHLY", "Günlük": "DAILY", "Saatlik": "HOURLY" };

  const parseTRDate = (val: string): string | null => {
    if (!val) return null;
    // dd.MM.yyyy or dd/MM/yyyy
    const m = val.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/);
    if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    // yyyy-MM-dd already
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    return null;
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImporting(true);

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) { toast.error("CSV dosyası boş veya yalnızca başlık satırı içeriyor"); setImporting(false); return; }

      // Parse header
      const headerLine = lines[0];
      const headers = headerLine.split(";").map((h) => h.replace(/^"|"$/g, "").trim());

      // Fetch fresh lookup data
      const [deptRes, compRes, projRes, teamRes, posRes] = await Promise.all([
        fetch("/api/ik/departmanlar"), fetch("/api/sirketler"),
        fetch("/api/projeler"), fetch("/api/ekipler"), fetch("/api/ik/pozisyonlar"),
      ]);
      const [deptList, compList, projList, teamList, posList] = await Promise.all([
        deptRes.json(), compRes.json(), projRes.json(), teamRes.json(), posRes.json(),
      ]);
      const depts: SelectOption[] = Array.isArray(deptList) ? deptList : [];
      const comps: SelectOption[] = Array.isArray(compList) ? compList : [];
      const projs: SelectOption[] = Array.isArray(projList) ? projList : [];
      const tms: SelectOption[] = Array.isArray(teamList) ? teamList : [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const poss: (SelectOption & { departmentId?: string })[] = Array.isArray(posList) ? posList : [];

      const findId = (list: SelectOption[], name: string) => {
        if (!name) return null;
        const n = name.toLowerCase().trim();
        return list.find((i) => i.name.toLowerCase().trim() === n)?.id || null;
      };

      const colIdx = (names: string[]) => {
        for (const n of names) {
          const idx = headers.findIndex((h) => h.toLowerCase() === n.toLowerCase());
          if (idx >= 0) return idx;
        }
        return -1;
      };

      // Column indexes
      const iAd = colIdx(["Ad", "ad", "firstName"]);
      const iSoyad = colIdx(["Soyad", "soyad", "lastName"]);
      const iTc = colIdx(["TC Kimlik No", "TC", "tcNo"]);
      const iSicil = colIdx(["Sicil No", "sicilNo", "employeeNo"]);
      const iTel = colIdx(["Telefon", "telefon", "phone"]);
      const iEmail = colIdx(["E-posta", "email", "Email"]);
      const iCollar = colIdx(["Yaka Tipi", "yakaTipi", "collarType", "Yaka"]);
      const iDept = colIdx(["Departman", "departman", "department"]);
      const iPos = colIdx(["Pozisyon", "pozisyon", "position"]);
      const iComp = colIdx(["Şirket", "şirket", "sirket", "company"]);
      const iProj = colIdx(["Proje", "proje", "project"]);
      const iTeam = colIdx(["Ekip", "ekip", "team"]);
      const iGender = colIdx(["Cinsiyet", "cinsiyet", "gender"]);
      const iMarital = colIdx(["Medeni Durum", "medeniDurum"]);
      const iBlood = colIdx(["Kan Grubu", "kanGrubu"]);
      const iBirth = colIdx(["Doğum Tarihi", "dogumTarihi"]);
      const iBirthPlace = colIdx(["Doğum Yeri", "dogumYeri"]);
      const iAddr = colIdx(["Adres", "adres", "address"]);
      const iSgk = colIdx(["SGK No", "sgkNo"]);
      const iSgkDate = colIdx(["SGK Giriş Tarihi", "sgkGirisTarihi"]);
      const iHire = colIdx(["İşe Giriş Tarihi", "İşe Giriş", "iseGirisTarihi"]);
      const iSalary = colIdx(["Maaş", "maas", "salary"]);
      const iSalaryType = colIdx(["Maaş Türü", "maasTuru", "salaryType"]);
      const iStatus = colIdx(["Durum", "durum", "status"]);
      const iEmName = colIdx(["Acil Durum Kişisi", "acilDurumKisisi"]);
      const iEmPhone = colIdx(["Acil Durum Telefonu", "acilDurumTelefonu"]);
      const iEmRel = colIdx(["Yakınlık Derecesi", "yakinlikDerecesi"]);

      if (iAd < 0 || iSoyad < 0) {
        toast.error("CSV'de 'Ad' ve 'Soyad' sütunları zorunludur");
        setImporting(false);
        return;
      }

      const parseCell = (row: string[], idx: number) => idx >= 0 && idx < row.length ? row[idx].replace(/^"|"$/g, "").trim() : "";

      let success = 0, failed = 0, skipped = 0;
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].split(";");
        const ad = parseCell(cells, iAd);
        const soyad = parseCell(cells, iSoyad);
        if (!ad || !soyad) { skipped++; continue; }

        const deptName = parseCell(cells, iDept);
        const posName = parseCell(cells, iPos);
        const compName = parseCell(cells, iComp);
        const projName = parseCell(cells, iProj);
        const teamName = parseCell(cells, iTeam);

        const departmentId = findId(depts, deptName);
        const companyId = findId(comps, compName);
        const projectId = findId(projs, projName);
        const teamId = findId(tms, teamName);

        // Match position by name + department
        let positionId: string | null = null;
        if (posName) {
          const pn = posName.toLowerCase().trim();
          const match = poss.find((p) => p.name.toLowerCase().trim() === pn && (!departmentId || p.departmentId === departmentId));
          positionId = match?.id || poss.find((p) => p.name.toLowerCase().trim() === pn)?.id || null;
        }

        const genderVal = parseCell(cells, iGender);
        const maritalVal = parseCell(cells, iMarital);
        const bloodVal = parseCell(cells, iBlood);
        const statusVal = parseCell(cells, iStatus);
        const salaryTypeVal = parseCell(cells, iSalaryType);
        const salaryVal = parseCell(cells, iSalary);

        const body = {
          firstName: ad,
          lastName: soyad,
          tcNo: parseCell(cells, iTc) || null,
          employeeNo: parseCell(cells, iSicil) || null,
          phone: parseCell(cells, iTel) || null,
          email: parseCell(cells, iEmail) || null,
          collarType: (() => { const cv = parseCell(cells, iCollar); return reverseCollarType[cv] || (cv.toUpperCase() === "BLUE" || cv.toUpperCase() === "WHITE" ? cv.toUpperCase() : null); })(),
          departmentId, positionId, companyId, projectId, teamId,
          gender: reverseGender[genderVal] || (genderVal.toUpperCase() === "MALE" || genderVal.toUpperCase() === "FEMALE" ? genderVal.toUpperCase() : null),
          maritalStatus: reverseMarital[maritalVal] || null,
          bloodType: reverseBlood[bloodVal] || null,
          birthDate: parseTRDate(parseCell(cells, iBirth)),
          birthPlace: parseCell(cells, iBirthPlace) || null,
          address: parseCell(cells, iAddr) || null,
          sgkNo: parseCell(cells, iSgk) || null,
          sgkStartDate: parseTRDate(parseCell(cells, iSgkDate)),
          hireDate: parseTRDate(parseCell(cells, iHire)),
          salary: salaryVal ? salaryVal.replace(/[^\d.,]/g, "").replace(",", ".") : null,
          salaryType: reverseSalaryType[salaryTypeVal] || (salaryTypeVal.toUpperCase() === "MONTHLY" || salaryTypeVal.toUpperCase() === "DAILY" || salaryTypeVal.toUpperCase() === "HOURLY" ? salaryTypeVal.toUpperCase() : null),
          status: reverseStatus[statusVal] || (["ACTIVE", "PASSIVE", "ON_LEAVE", "SUSPENDED"].includes(statusVal.toUpperCase()) ? statusVal.toUpperCase() : "ACTIVE"),
          emergencyName: parseCell(cells, iEmName) || null,
          emergencyPhone: parseCell(cells, iEmPhone) || null,
          emergencyRelation: parseCell(cells, iEmRel) || null,
        };

        try {
          const res = await fetch("/api/ik/personel", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
          });
          if (res.ok) { success++; } else { failed++; errors.push(`Satır ${i + 1}: ${ad} ${soyad} - API hatası`); }
        } catch {
          failed++;
          errors.push(`Satır ${i + 1}: ${ad} ${soyad} - Bağlantı hatası`);
        }
      }

      if (success > 0) toast.success(`${success} personel başarıyla eklendi`);
      if (skipped > 0) toast.warning(`${skipped} satır atlandı (ad/soyad boş)`);
      if (failed > 0) toast.error(`${failed} satır eklenemedi: ${errors.slice(0, 3).join(", ")}`);
      fetchEmployees();
    } catch (err) {
      console.error("CSV import error:", err);
      toast.error("CSV dosyası okunamadı");
    } finally {
      setImporting(false);
    }
  };

  const setField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Personel Yönetimi</h1>
          <p className="text-muted-foreground">{total} personel kayıtlı</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={downloadCSVTemplate}>
            <FileDown className="h-4 w-4 mr-2" />Şablon İndir
          </Button>
          <Button variant="outline" size="sm" onClick={() => csvInputRef.current?.click()} disabled={importing}>
            <Upload className="h-4 w-4 mr-2" />{importing ? "İçe aktarılıyor..." : "CSV İçe Aktar"}
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />CSV Dışa Aktar
          </Button>
          <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
          <Link href="/ik/hesap-olustur">
            <Button size="sm" variant="outline">
              <Users className="h-4 w-4 mr-2" />Hesap Oluştur
            </Button>
          </Link>
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
                    <div><Label>Yaka Tipi</Label>
                      <Select value={form.collarType} onValueChange={(v) => setField("collarType", v)}>
                        <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BLUE">Mavi Yaka</SelectItem>
                          <SelectItem value="WHITE">Beyaz Yaka</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
                    <TableHead>Yaka Tipi</TableHead>
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
                      <TableCell>
                        {emp.collarType ? (
                          <Badge variant={emp.collarType === "BLUE" ? "default" : "secondary"}>
                            {collarTypeMap[emp.collarType] || "-"}
                          </Badge>
                        ) : "-"}
                      </TableCell>
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
