"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Upload, Download } from "lucide-react";
import { toast } from "sonner";
import { utils, read, writeFileXLSX } from "xlsx";

interface Department { id: string; name: string; sortOrder: number; _count: { employees: number; positions: number } }

export default function DepartmanlarPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch("/api/ik/departmanlar");
    const data = await res.json();
    setDepartments(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditing(null); setName(""); setSortOrder("0"); setDialogOpen(true); };
  const openEdit = (d: Department) => { setEditing(d); setName(d.name); setSortOrder(d.sortOrder.toString()); setDialogOpen(true); };

  const handleSave = async () => {
    const url = editing ? `/api/ik/departmanlar/${editing.id}` : "/api/ik/departmanlar";
    const method = editing ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, sortOrder: parseInt(sortOrder) }) });
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu departmanı silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/ik/departmanlar/${id}`, { method: "DELETE" });
    fetchData();
  };

  // ─── Excel Export ───────────────────────────────────
  const handleExport = () => {
    const rows = departments.map((d, i) => ({
      "Sıra No": d.sortOrder || i + 1,
      "Departman Adı": d.name,
      "Personel Sayısı": d._count.employees,
      "Pozisyon Sayısı": d._count.positions,
    }));
    const ws = utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 8 }, { wch: 35 }, { wch: 15 }, { wch: 15 }];
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Departmanlar");
    writeFileXLSX(wb, "departmanlar.xlsx");
    toast.success(`${rows.length} departman dışa aktarıldı`);
  };

  // ─── Boş Şablon İndir ──────────────────────────────
  const handleDownloadTemplate = () => {
    const templateRows = [
      { "Departman Adı": "Üst Yönetim", "Sıra No": 1 },
      { "Departman Adı": "Proje Yönetimi", "Sıra No": 2 },
      { "Departman Adı": "Şantiye / Saha Operasyonları", "Sıra No": 3 },
    ];
    const ws = utils.json_to_sheet(templateRows);
    ws["!cols"] = [{ wch: 35 }, { wch: 10 }];
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Departmanlar");
    writeFileXLSX(wb, "departman-sablonu.xlsx");
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

      let success = 0;
      let fail = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;
        const deptName = String(row["Departman Adı"] || row["DepartmanAdi"] || row["departman_adi"] || row["name"] || row["Name"] || row["Ad"] || "").trim();
        const siraNo = Number(row["Sıra No"] || row["SiraNo"] || row["sira_no"] || row["sortOrder"] || i + 1);

        if (!deptName) {
          errors.push(`Satır ${rowNum}: Departman adı boş`);
          fail++;
          continue;
        }

        // Mevcut departman kontrolü
        const existing = departments.find((d) => d.name.toLowerCase() === deptName.toLowerCase());
        if (existing) {
          errors.push(`Satır ${rowNum}: "${deptName}" zaten mevcut, atlandı`);
          fail++;
          continue;
        }

        try {
          const res = await fetch("/api/ik/departmanlar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: deptName, sortOrder: siraNo }),
          });
          if (!res.ok) throw new Error();
          success++;
        } catch {
          errors.push(`Satır ${rowNum} (${deptName}): API hatası`);
          fail++;
        }
      }

      if (success > 0) toast.success(`${success} departman başarıyla içe aktarıldı`);
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
        <div><h1 className="text-2xl font-bold">Departmanlar</h1><p className="text-muted-foreground">Organizasyon yapısı</p></div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4 mr-1" /> Şablon İndir
          </Button>
          <Button variant="outline" size="sm" onClick={handleImportClick} disabled={importing}>
            <Upload className="h-4 w-4 mr-1" /> {importing ? "İçe Aktarılıyor..." : "Excel İçe Aktar"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={departments.length === 0}>
            <Download className="h-4 w-4 mr-1" /> Excel Dışa Aktar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Yeni Departman</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Departman Düzenle" : "Yeni Departman"}</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div><Label>Departman Adı *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div><Label>Sıra No</Label><Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} /></div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
                  <Button onClick={handleSave} disabled={!name}>Kaydet</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Gizli dosya input */}
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportFile} />

      <Card>
        <CardHeader><CardTitle>Departman Listesi ({departments.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div> : departments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground space-y-3">
              <p>Henüz departman yok</p>
              <p className="text-sm">&quot;Şablon İndir&quot; ile örnek Excel dosyasını indirip doldurun, sonra &quot;Excel İçe Aktar&quot; ile yükleyin.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Sıra</TableHead>
                  <TableHead>Departman Adı</TableHead>
                  <TableHead className="text-center">Personel</TableHead>
                  <TableHead className="text-center">Pozisyon</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="text-center">{d.sortOrder}</TableCell>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-center">{d._count.employees}</TableCell>
                    <TableCell className="text-center">{d._count.positions}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(d)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
