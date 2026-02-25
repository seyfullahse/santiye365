"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";

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

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Pozisyonlar</h1><p className="text-muted-foreground">İş pozisyonu tanımları</p></div>
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

      <Card>
        <CardHeader><CardTitle>Pozisyon Listesi</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div> : positions.length === 0 ? <div className="text-center py-8 text-muted-foreground">Henüz pozisyon yok</div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pozisyon Adı</TableHead>
                  <TableHead>Departman</TableHead>
                  <TableHead className="text-center">Personel</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((p) => (
                  <TableRow key={p.id}>
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
