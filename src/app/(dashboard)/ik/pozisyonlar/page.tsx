"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Upload, Download } from "lucide-react";
import { toast } from "sonner";
import { utils, read, writeFileXLSX } from "xlsx";

interface Position { id: string; name: string; sortOrder: number; department: { id: string; name: string }; _count: { employees: number } }
interface Department { id: string; name: string }

export default function PozisyonlarPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    const [posRes, deptRes] = await Promise.all([fetch("/api/ik/pozisyonlar"), fetch("/api/ik/departmanlar")]);
    const [posData, deptData] = await Promise.all([posRes.json(), deptRes.json()]);
    setPositions(Array.isArray(posData) ? posData : []);
    setDepartments(Array.isArray(deptData) ? deptData : []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditing(null); setName(""); setDepartmentId(""); setSortOrder("0"); setDialogOpen(true); };
  const openEdit = (p: Position) => { setEditing(p); setName(p.name); setDepartmentId(p.department.id); setSortOrder(p.sortOrder.toString()); setDialogOpen(true); };

  const handleSave = async () => {
    const url = editing ? `/api/ik/pozisyonlar/${editing.id}` : "/api/ik/pozisyonlar";
    const method = editing ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, departmentId, sortOrder: parseInt(sortOrder) }) });
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu pozisyonu silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/ik/pozisyonlar/${id}`, { method: "DELETE" });
    fetchData();
  };

  // ─── Excel Export ───────────────────────────────────
  const handleExport = () => {
    const rows = positions.map((p, i) => ({
      "Sıra No": p.sortOrder || i + 1,
      "Pozisyon Adı": p.name,
      "Departman": p.department.name,
      "Personel Sayısı": p._count.employees,
    }));
    const ws = utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 8 }, { wch: 35 }, { wch: 30 }, { wch: 15 }];
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Pozisyonlar");
    writeFileXLSX(wb, "pozisyonlar.xlsx");
    toast.success(`${rows.length} pozisyon dışa aktarıldı`);
  };

  // ─── Boş Şablon İndir ──────────────────────────────
  const handleDownloadTemplate = () => {
    // Şablona departman listesini de ekleyelim (2. sayfa)
    const templateRows = [
      { "Pozisyon Adı": "Genel Müdür", "Departman": "Üst Yönetim", "Sıra No": 1 },
      { "Pozisyon Adı": "Proje Müdürü", "Departman": "Proje Yönetimi", "Sıra No": 2 },
      { "Pozisyon Adı": "Şantiye Şefi", "Departman": "Şantiye / Saha Operasyonları", "Sıra No": 3 },
    ];
    const ws = utils.json_to_sheet(templateRows);
    ws["!cols"] = [{ wch: 35 }, { wch: 35 }, { wch: 10 }];
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Pozisyonlar");

    // 2. sayfa: Mevcut departman listesi (referans)
    if (departments.length > 0) {
      const deptRows = departments.map((d) => ({ "Departman Adı": d.name }));
      const ws2 = utils.json_to_sheet(deptRows);
      ws2["!cols"] = [{ wch: 35 }];
      utils.book_append_sheet(wb, ws2, "Departman Listesi");
    }

    writeFileXLSX(wb, "pozisyon-sablonu.xlsx");
    toast.success("Şablon dosyası indirildi");
  };

  // ─── Excel Import ──────────────────────────────────
  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = utils.sheet_to_json(ws) as Record<string, unknown>[];

      // Güncel departman listesini al
      const deptRes = await fetch("/api/ik/departmanlar");
      const depts: Department[] = await deptRes.json();

      let success = 0;
      let fail = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;
        const posName = String(row["Pozisyon Adı"] || row["PozisyonAdi"] || row["pozisyon_adi"] || row["name"] || row["Name"] || row["Ad"] || "").trim();
        const deptName = String(row["Departman"] || row["DepartmanAdi"] || row["departman"] || row["department"] || "").trim();
        const siraNo = Number(row["Sıra No"] || row["SiraNo"] || row["sira_no"] || row["sortOrder"] || i + 1);

        if (!posName) {
          errors.push(`Satır ${rowNum}: Pozisyon adı boş`);
          fail++;
          continue;
        }

        if (!deptName) {
          errors.push(`Satır ${rowNum}: Departman adı boş`);
          fail++;
          continue;
        }

        // Departman eşleştirme (case-insensitive)
        const dept = depts.find((d) => d.name.toLowerCase() === deptName.toLowerCase());
        if (!dept) {
          errors.push(`Satır ${rowNum}: "${deptName}" departmanı bulunamadı`);
          fail++;
          continue;
        }

        // Aynı departmanda aynı isimde pozisyon varsa atla
        const existing = positions.find(
          (p) => p.name.toLowerCase() === posName.toLowerCase() && p.department.id === dept.id
        );
        if (existing) {
          errors.push(`Satır ${rowNum}: "${posName}" (${deptName}) zaten mevcut, atlandı`);
          fail++;
          continue;
        }

        try {
          const res = await fetch("/api/ik/pozisyonlar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: posName, departmentId: dept.id, sortOrder: siraNo }),
          });
          if (!res.ok) throw new Error();
          success++;
        } catch {
          errors.push(`Satır ${rowNum} (${posName}): API hatası`);
          fail++;
        }
      }

      if (success > 0) toast.success(`${success} pozisyon başarıyla içe aktarıldı`);
      if (fail > 0) {
        toast.warning(`${fail} kayıt atlandı`);
        errors.slice(0, 5).forEach((err) => toast.error(err));
      }
      if (success === 0 && fail === 0) toast.warning("Excel dosyasında geçerli veri bulunamadı");
      fetchData();
    } catch {
      toast.error("Excel içe aktarma başarısız");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div><h1 className="text-2xl font-bold">Pozisyonlar</h1><p className="text-muted-foreground">İş pozisyonu tanımları</p></div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4 mr-1" /> Şablon İndir
          </Button>
          <Button variant="outline" size="sm" onClick={handleImportClick} disabled={importing}>
            <Upload className="h-4 w-4 mr-1" /> {importing ? "İçe Aktarılıyor..." : "Excel İçe Aktar"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={positions.length === 0}>
            <Download className="h-4 w-4 mr-1" /> Excel Dışa Aktar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Yeni Pozisyon</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Pozisyon Düzenle" : "Yeni Pozisyon"}</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div><Label>Pozisyon Adı *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div><Label>Departman *</Label>
                  <Select value={departmentId} onValueChange={setDepartmentId}>
                    <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                    <SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Sıra No</Label><Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} /></div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                  <Button onClick={handleSave} disabled={!name || !departmentId}>Kaydet</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Gizli dosya input */}
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportFile} />

      <Card>
        <CardHeader><CardTitle>Pozisyon Listesi ({positions.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div> : positions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground space-y-3">
              <p>Henüz pozisyon yok</p>
              <p className="text-sm">Önce departmanları oluşturun, sonra &quot;Şablon İndir&quot; ile Excel dosyasını doldurup &quot;Excel İçe Aktar&quot; ile yükleyin.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Sıra</TableHead>
                  <TableHead>Pozisyon Adı</TableHead>
                  <TableHead>Departman</TableHead>
                  <TableHead className="text-center">Personel</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-center">{p.sortOrder}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.department.name}</TableCell>
                    <TableCell className="text-center">{p._count.employees}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
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
