"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Department { id: string; name: string; sortOrder: number; _count: { employees: number; positions: number } }

export default function DepartmanlarPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState("0");

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

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Departmanlar</h1><p className="text-muted-foreground">Organizasyon yapısı</p></div>
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

      <Card>
        <CardHeader><CardTitle>Departman Listesi</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div> : departments.length === 0 ? <div className="text-center py-8 text-muted-foreground">Henüz departman yok</div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Departman Adı</TableHead>
                  <TableHead className="text-center">Personel</TableHead>
                  <TableHead className="text-center">Pozisyon</TableHead>
                  <TableHead className="text-center">Sıra</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-center">{d._count.employees}</TableCell>
                    <TableCell className="text-center">{d._count.positions}</TableCell>
                    <TableCell className="text-center">{d.sortOrder}</TableCell>
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
