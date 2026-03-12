"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { utils, read, writeFileXLSX } from "xlsx";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, UserCheck, Download, Upload } from "lucide-react";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
  sortOrder: number;
  company: { id: string; name: string; sortOrder: number };
  discipline: { name: string };
}

interface Worker {
  id: string;
  teamId: string;
  firstName: string;
  lastName: string;
  role: string;
  sortOrder: number;
  team: {
    name: string;
    sortOrder: number;
    company: { id: string; name: string; sortOrder: number };
    discipline: { name: string };
  };
}

interface WorkerForm {
  teamId: string;
  firstName: string;
  lastName: string;
  role: string;
  sortOrder: number;
}

const EMPTY_FORM: WorkerForm = {
  teamId: "",
  firstName: "",
  lastName: "",
  role: "",
  sortOrder: 0,
};

// Rütbe hiyerarşisi (düşük numara = üst rütbe)
const ROLE_PRIORITY: Record<string, number> = {
  "proje müdürü": 1,
  "şantiye şefi": 2,
  "şef": 3,
  "mühendis": 4,
  "mimar": 5,
  "teknik şef": 6,
  "formen": 7,
  "başkalfa": 8,
  "usta": 9,
  "kalfa": 10,
  "teknisyen": 11,
  "operatör": 12,
  "sürücü": 13,
  "kalıpçı": 14,
  "demirci": 15,
  "elektrikçi": 16,
  "tesisatçı": 17,
  "boyacı": 18,
  "kaynakçı": 19,
  "izolasyoncu": 20,
  "alçıcı": 21,
  "duvarcı": 22,
  "seramikçi": 23,
  "işçi": 50,
  "düz işçi": 51,
};

function getRolePriority(role: string): number {
  const normalized = role.toLowerCase().trim();
  // Tam eşleşme
  if (ROLE_PRIORITY[normalized] !== undefined) return ROLE_PRIORITY[normalized];
  // Kısmi eşleşme
  for (const [key, val] of Object.entries(ROLE_PRIORITY)) {
    if (normalized.includes(key) || key.includes(normalized)) return val;
  }
  return 30; // Tanımlanmamış roller ortada
}

export default function CalisanlarPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [form, setForm] = useState<WorkerForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [filterCompany, setFilterCompany] = useState("ALL");
  const [filterTeam, setFilterTeam] = useState("ALL");
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchWorkers = async () => {
    try {
      const res = await fetch("/api/calisanlar");
      if (!res.ok) throw new Error("Çalışanlar yüklenemedi");
      const data = await res.json();
      setWorkers(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Çalışanlar yüklenirken bir hata oluştu.");
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/ekipler");
      if (!res.ok) throw new Error("Ekipler yüklenemedi");
      const data = await res.json();
      setTeams(data);
    } catch {
      toast.error("Ekipler yüklenirken bir hata oluştu.");
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/sirketler");
      if (!res.ok) throw new Error("Şirketler yüklenemedi");
      const data = await res.json();
      setCompanies(data);
    } catch {
      toast.error("Şirketler yüklenirken bir hata oluştu.");
    }
  };

  useEffect(() => {
    Promise.all([fetchWorkers(), fetchTeams(), fetchCompanies()]).finally(() =>
      setLoading(false)
    );
  }, []);

  // Filtre: şirkete göre ekipler
  const filteredTeamsForSelect = useMemo(() => {
    if (filterCompany === "ALL") return teams;
    return teams.filter((t) => t.company.id === filterCompany);
  }, [teams, filterCompany]);

  // Filtrelenmiş ve sıralanmış çalışanlar
  const filteredWorkers = useMemo(() => {
    let result = workers;
    if (filterCompany !== "ALL") {
      result = result.filter((w) => w.team.company.id === filterCompany);
    }
    if (filterTeam !== "ALL") {
      result = result.filter((w) => w.teamId === filterTeam);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (w) =>
          w.firstName.toLowerCase().includes(q) ||
          w.lastName.toLowerCase().includes(q) ||
          w.role.toLowerCase().includes(q) ||
          w.team.company.name.toLowerCase().includes(q)
      );
    }
    // Sırala: Şirket sortOrder → Ekip sortOrder → Kişi sortOrder → Rütbe önceliği
    return [...result].sort((a, b) => {
      const cmpCompany = a.team.company.sortOrder - b.team.company.sortOrder;
      if (cmpCompany !== 0) return cmpCompany;
      const cmpTeam = a.team.sortOrder - b.team.sortOrder;
      if (cmpTeam !== 0) return cmpTeam;
      const cmpWorker = (a.sortOrder || 0) - (b.sortOrder || 0);
      if (cmpWorker !== 0) return cmpWorker;
      const cmpRole = getRolePriority(a.role) - getRolePriority(b.role);
      if (cmpRole !== 0) return cmpRole;
      return a.lastName.localeCompare(b.lastName, "tr");
    });
  }, [workers, filterCompany, filterTeam, search]);

  // Ekip bazlı sıra numarası hesapla
  const rowNumbers = useMemo(() => {
    const map = new Map<string, number>();
    const teamCounter = new Map<string, number>();
    for (const w of filteredWorkers) {
      const key = w.teamId;
      const count = (teamCounter.get(key) || 0) + 1;
      teamCounter.set(key, count);
      map.set(w.id, count);
    }
    return map;
  }, [filteredWorkers]);

  // Ekip başına çalışan sayıları
  const teamCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const w of filteredWorkers) {
      map.set(w.teamId, (map.get(w.teamId) || 0) + 1);
    }
    return map;
  }, [filteredWorkers]);

  // Dialog form: şirket seçilince ekip listesini filtrele
  const [formCompanyId, setFormCompanyId] = useState("ALL");
  const formTeams = useMemo(() => {
    if (formCompanyId === "ALL") return teams;
    return teams.filter((t) => t.company.id === formCompanyId);
  }, [teams, formCompanyId]);

  // ── Excel Dışa Aktar ──────────────────────────────────
  const handleExport = () => {
    try {
      const rows = filteredWorkers.map((w) => ({
        "#": rowNumbers.get(w.id) || "",
        "Firma Adı": w.team.company.name,
        "Ekip": w.team.name,
        "Ad": w.firstName,
        "Soyad": w.lastName,
        "Görevi": w.role,
        "Sıra No": w.sortOrder || 0,
      }));
      const ws = utils.json_to_sheet(rows);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Çalışanlar");
      writeFileXLSX(wb, "calisanlar.xlsx");
      toast.success(`${rows.length} çalışan dışa aktarıldı`);
    } catch {
      toast.error("Dışa aktarma başarısız");
    }
  };

  // ── Excel İçe Aktar ──────────────────────────────────
  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const wb = read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = utils.sheet_to_json<Record<string, unknown>>(ws);

      let success = 0;
      let fail = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;

        const firstName = String(row["Ad"] || row.firstName || "").trim();
        const lastName = String(row["Soyad"] || row.lastName || "").trim();
        const role = String(row["Görevi"] || row.Gorevi || row.role || "").trim();
        const teamName = String(row["Ekip"] || row.Ekip || row.teamName || "").trim();
        const companyName = String(row["Firma Adı"] || row.Firma || row.companyName || "").trim();

        if (!firstName || !lastName) {
          errors.push(`Satır ${rowNum}: Ad/Soyad boş`);
          fail++;
          continue;
        }

        // Ekip eşleştirme: önce ekip+şirket, sonra sadece ekip adı
        let matchedTeam = teams.find(
          (t) =>
            t.name.toLowerCase() === teamName.toLowerCase() &&
            t.company.name.toLowerCase() === companyName.toLowerCase()
        );
        if (!matchedTeam && teamName) {
          matchedTeam = teams.find(
            (t) => t.name.toLowerCase() === teamName.toLowerCase()
          );
        }
        if (!matchedTeam && companyName) {
          matchedTeam = teams.find(
            (t) => t.company.name.toLowerCase() === companyName.toLowerCase()
          );
        }

        if (!matchedTeam) {
          errors.push(`Satır ${rowNum} (${firstName} ${lastName}): Ekip bulunamadı`);
          fail++;
          continue;
        }

        try {
          const res = await fetch("/api/calisanlar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              teamId: matchedTeam.id,
              firstName,
              lastName,
              role: role || "-",
            }),
          });
          if (!res.ok) throw new Error();
          success++;
        } catch {
          errors.push(`Satır ${rowNum} (${firstName} ${lastName}): API hatası`);
          fail++;
        }
      }

      toast.success(`İçeri aktarıldı: ${success} çalışan`);
      if (fail) {
        toast.warning(`${fail} kayıt atlandı`);
        errors.slice(0, 5).forEach((err) => toast.error(err));
      }
      fetchWorkers();
    } catch (err) {
      console.error(err);
      toast.error("Excel içe aktarma başarısız oldu");
    } finally {
      e.target.value = "";
    }
  };

  const openCreateDialog = () => {
    setSelectedWorker(null);
    setForm(EMPTY_FORM);
    setFormCompanyId("ALL");
    setDialogOpen(true);
  };

  const openEditDialog = (worker: Worker) => {
    setSelectedWorker(worker);
    setForm({
      teamId: worker.teamId,
      firstName: worker.firstName,
      lastName: worker.lastName,
      role: worker.role,
      sortOrder: worker.sortOrder || 0,
    });
    setFormCompanyId(worker.team.company.id);
    setDialogOpen(true);
  };

  const openDeleteDialog = (worker: Worker) => {
    setSelectedWorker(worker);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.teamId || !form.firstName.trim() || !form.lastName.trim() || !form.role.trim()) {
      toast.error("Tüm alanları doldurun.");
      return;
    }
    setSubmitting(true);
    try {
      const isEdit = !!selectedWorker;
      const url = isEdit
        ? `/api/calisanlar/${selectedWorker!.id}`
        : "/api/calisanlar";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success(isEdit ? "Çalışan güncellendi." : "Çalışan eklendi.");
      setDialogOpen(false);
      fetchWorkers();
    } catch {
      toast.error("İşlem başarısız.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedWorker) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/calisanlar/${selectedWorker.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Çalışan silindi.");
      setDeleteDialogOpen(false);
      fetchWorkers();
    } catch {
      toast.error("Silme işlemi başarısız.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Çalışanlar</h1>
          <p className="text-sm text-muted-foreground">
            Şirket ve ekiplere bağlı çalışan listesi
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={handleImportClick}>
            <Upload className="h-4 w-4 mr-1" /> Excel İçe Aktar
          </Button>
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Excel Dışa Aktar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-1" /> Çalışan Ekle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedWorker ? "Çalışan Düzenle" : "Yeni Çalışan"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Şirket seç (ekip filtreleme için) */}
                <div className="space-y-2">
                  <Label>Şirket</Label>
                  <Select
                    value={formCompanyId}
                    onValueChange={(val) => {
                      setFormCompanyId(val);
                      setForm((f) => ({ ...f, teamId: "" }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Şirket seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tümü</SelectItem>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Ekip seç */}
                <div className="space-y-2">
                  <Label>Ekip *</Label>
                  <Select
                    value={form.teamId}
                    onValueChange={(val) =>
                      setForm((f) => ({ ...f, teamId: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ekip seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {formTeams.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} — {t.company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ad *</Label>
                    <Input
                      value={form.firstName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, firstName: e.target.value }))
                      }
                      placeholder="Ad"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Soyad *</Label>
                    <Input
                      value={form.lastName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, lastName: e.target.value }))
                      }
                      placeholder="Soyad"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Görevi *</Label>
                  <Input
                    value={form.role}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, role: e.target.value }))
                    }
                    placeholder="Kalıpçı, Elektrikçi, Formen vb."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sıra No</Label>
                  <Input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))
                    }
                    placeholder="0"
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting
                    ? "Kaydediliyor..."
                    : selectedWorker
                    ? "Güncelle"
                    : "Kaydet"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleImportFile}
      />

      {/* Özet Kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Toplam Çalışan</span>
            <span className="text-lg font-bold">{workers.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Firma Sayısı</span>
            <span className="text-lg font-bold">{companies.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Ekip Sayısı</span>
            <span className="text-lg font-bold">{teamCounts.size}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Gösterilen</span>
            <span className="text-lg font-bold text-blue-600">{filteredWorkers.length}</span>
          </CardContent>
        </Card>
      </div>

      {/* Filtreler */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Select
          value={filterCompany}
          onValueChange={(val) => {
            setFilterCompany(val);
            setFilterTeam("ALL");
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Tüm Şirketler" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tüm Şirketler</SelectItem>
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterTeam} onValueChange={setFilterTeam}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Tüm Ekipler" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tüm Ekipler</SelectItem>
            {filteredTeamsForSelect.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          className="w-full sm:w-48"
          placeholder="Ara (ad, soyad, görev, firma)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tablo */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] text-center">#</TableHead>
                <TableHead>Firma Adı</TableHead>
                <TableHead>Ekip</TableHead>
                <TableHead>Ad Soyad</TableHead>
                <TableHead>Görevi</TableHead>
                <TableHead className="w-[100px]">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : filteredWorkers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Henüz çalışan kaydı bulunmuyor.
                  </TableCell>
                </TableRow>
              ) : (
                filteredWorkers.map((w, idx) => {
                  // Ekip değişim sınırı: önceki satırla farklı ekip ise border ekle
                  const prevWorker = idx > 0 ? filteredWorkers[idx - 1] : null;
                  const isNewTeam = prevWorker && prevWorker.teamId !== w.teamId;
                  return (
                    <TableRow
                      key={w.id}
                      className={isNewTeam ? "border-t-2 border-primary/20" : ""}
                    >
                      <TableCell className="text-center text-xs text-muted-foreground font-mono">
                        {rowNumbers.get(w.id)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {w.team.company.name}
                      </TableCell>
                      <TableCell>
                        {w.team.name}
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({teamCounts.get(w.teamId)} kişi)
                        </span>
                      </TableCell>
                      <TableCell>
                        {w.firstName} {w.lastName}
                      </TableCell>
                      <TableCell>{w.role}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(w)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(w)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Silme Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Çalışanı Sil</DialogTitle>
          </DialogHeader>
          <p>
            <strong>
              {selectedWorker?.firstName} {selectedWorker?.lastName}
            </strong>{" "}
            adlı çalışanı silmek istediğinize emin misiniz?
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? "Siliniyor..." : "Sil"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
