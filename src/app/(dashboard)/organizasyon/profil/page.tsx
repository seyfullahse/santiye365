"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Save, Globe, Phone, Mail, MapPin, FileText, Users, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

/* ───────── types ───────── */
interface CompanyProfile {
  id: string;
  name: string;
  taxNo: string | null;
  taxOffice: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  sector: string | null;
  foundedYear: number | null;
  logoUrl: string | null;
  description: string | null;
}

interface Team {
  id: string;
  name: string;
  sortOrder: number;
  companyId: string;
  disciplineId: string | null;
  company: { id: string; name: string; type: string };
  discipline: { name: string } | null;
  _count?: { workers: number };
}

interface Discipline { id: string; name: string }

/* ───────── constants ───────── */
const emptyForm = {
  name: "", taxNo: "", taxOffice: "", address: "", phone: "", email: "",
  website: "", sector: "", foundedYear: "", logoUrl: "", description: "",
};

const emptyTeamForm = { name: "", disciplineId: "", sortOrder: "0" };

export default function FirmaProfilPage() {
  /* ── profile state ── */
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  /* ── team state ── */
  const [teams, setTeams] = useState<Team[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [teamForm, setTeamForm] = useState(emptyTeamForm);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(false);

  /* ── fetch profile ── */
  useEffect(() => {
    fetch("/api/organizasyon/profil")
      .then((r) => r.json())
      .then((data: CompanyProfile) => {
        setCompanyId(data.id);
        setForm({
          name: data.name || "",
          taxNo: data.taxNo || "",
          taxOffice: data.taxOffice || "",
          address: data.address || "",
          phone: data.phone || "",
          email: data.email || "",
          website: data.website || "",
          sector: data.sector || "",
          foundedYear: data.foundedYear?.toString() || "",
          logoUrl: data.logoUrl || "",
          description: data.description || "",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  /* ── fetch teams for this company ── */
  const fetchTeams = useCallback(async () => {
    if (!companyId) return;
    setTeamsLoading(true);
    try {
      const res = await fetch(`/api/ekipler?companyId=${companyId}`);
      const data: Team[] = await res.json();
      setTeams(data);
    } catch { /* ignore */ }
    setTeamsLoading(false);
  }, [companyId]);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  /* ── fetch disciplines ── */
  useEffect(() => {
    fetch("/api/disiplinler").then((r) => r.json()).then(setDisciplines).catch(() => {});
  }, []);

  /* ── profile save ── */
  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Firma adı zorunludur"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/organizasyon/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) toast.success("Firma profili güncellendi");
      else toast.error("Kayıt başarısız");
    } catch { toast.error("Bağlantı hatası"); }
    finally { setSaving(false); }
  };

  /* ── team CRUD ── */
  const openCreateTeam = () => {
    setEditingTeam(null);
    setTeamForm(emptyTeamForm);
    setTeamDialogOpen(true);
  };

  const openEditTeam = (t: Team) => {
    setEditingTeam(t);
    setTeamForm({ name: t.name, disciplineId: t.disciplineId || "", sortOrder: t.sortOrder.toString() });
    setTeamDialogOpen(true);
  };

  const handleTeamSave = async () => {
    if (!teamForm.name.trim()) { toast.error("Ekip adı zorunludur"); return; }
    if (!companyId) return;
    try {
      const body = {
        name: teamForm.name,
        companyId,
        disciplineId: teamForm.disciplineId || null,
        sortOrder: parseInt(teamForm.sortOrder) || 0,
      };
      const res = editingTeam
        ? await fetch(`/api/ekipler/${editingTeam.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/ekipler", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) {
        toast.success(editingTeam ? "Ekip güncellendi" : "Ekip oluşturuldu");
        setTeamDialogOpen(false);
        fetchTeams();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "İşlem başarısız");
      }
    } catch { toast.error("Bağlantı hatası"); }
  };

  const handleTeamDelete = async (id: string) => {
    if (!confirm("Bu ekibi silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/ekipler/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Ekip silindi");
        fetchTeams();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Silme başarısız");
      }
    } catch { toast.error("Bağlantı hatası"); }
  };

  const setField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));
  const setTeamField = (field: string, value: string) => setTeamForm((prev) => ({ ...prev, [field]: value }));

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="text-center py-12 text-muted-foreground">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Firma Profili</h1>
        <p className="text-muted-foreground">Ana firma bilgilerinizi ve ekiplerinizi yönetin</p>
      </div>

      <Tabs defaultValue="bilgiler">
        <TabsList>
          <TabsTrigger value="bilgiler" className="gap-1.5"><Building2 className="h-4 w-4" /> Firma Bilgileri</TabsTrigger>
          <TabsTrigger value="ekipler" className="gap-1.5"><Users className="h-4 w-4" /> Ekipler</TabsTrigger>
        </TabsList>

        {/* ═══════ TAB: Firma Bilgileri ═══════ */}
        <TabsContent value="bilgiler" className="space-y-6 pt-4">
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />{saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>

          {/* Genel Bilgiler */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Genel Bilgiler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Firma Adı *</Label>
                  <Input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Örn: ABC İnşaat A.Ş." />
                </div>
                <div>
                  <Label>Sektör</Label>
                  <Input value={form.sector} onChange={(e) => setField("sector", e.target.value)} placeholder="Örn: İnşaat, Altyapı" />
                </div>
                <div>
                  <Label>Kuruluş Yılı</Label>
                  <Input type="number" value={form.foundedYear} onChange={(e) => setField("foundedYear", e.target.value)} placeholder="Örn: 2005" />
                </div>
                <div>
                  <Label>Logo URL</Label>
                  <Input value={form.logoUrl} onChange={(e) => setField("logoUrl", e.target.value)} placeholder="https://..." />
                </div>
              </div>
              <div>
                <Label>Hakkımızda</Label>
                <Textarea value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="Firma hakkında kısa açıklama..." rows={3} />
              </div>
            </CardContent>
          </Card>

          {/* Vergi Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Vergi Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Vergi No</Label>
                  <Input value={form.taxNo} onChange={(e) => setField("taxNo", e.target.value)} placeholder="1234567890" />
                </div>
                <div>
                  <Label>Vergi Dairesi</Label>
                  <Input value={form.taxOffice} onChange={(e) => setField("taxOffice", e.target.value)} placeholder="Örn: Kadıköy" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* İletişim */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                İletişim Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-1"><Phone className="h-3 w-3" /> Telefon</Label>
                  <Input value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="0212 XXX XX XX" />
                </div>
                <div>
                  <Label className="flex items-center gap-1"><Mail className="h-3 w-3" /> E-posta</Label>
                  <Input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="info@firma.com" />
                </div>
                <div>
                  <Label className="flex items-center gap-1"><Globe className="h-3 w-3" /> Web Sitesi</Label>
                  <Input value={form.website} onChange={(e) => setField("website", e.target.value)} placeholder="https://www.firma.com" />
                </div>
              </div>
              <div className="mt-4">
                <Label className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Adres</Label>
                <Textarea value={form.address} onChange={(e) => setField("address", e.target.value)} placeholder="Firma adresi..." rows={2} />
              </div>
            </CardContent>
          </Card>

          {/* Önizleme */}
          {form.name && (
            <Card>
              <CardHeader>
                <CardTitle>Firma Kartı Önizleme</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border-2 border-dashed p-6 flex flex-col sm:flex-row items-start gap-6">
                  <div className="h-20 w-20 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    {form.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.logoUrl} alt="Logo" className="h-16 w-16 object-contain rounded-lg" />
                    ) : (
                      <Building2 className="h-10 w-10 text-primary" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">{form.name}</h3>
                    {form.sector && <p className="text-sm text-muted-foreground">{form.sector} {form.foundedYear ? `· ${form.foundedYear}'den beri` : ""}</p>}
                    {form.description && <p className="text-sm mt-2">{form.description}</p>}
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                      {form.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{form.phone}</span>}
                      {form.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{form.email}</span>}
                      {form.website && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{form.website}</span>}
                    </div>
                    {form.address && <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1"><MapPin className="h-3 w-3 mt-0.5 shrink-0" />{form.address}</p>}
                    {form.taxNo && <p className="text-xs text-muted-foreground">VKN: {form.taxNo} {form.taxOffice ? `· ${form.taxOffice} VD` : ""}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══════ TAB: Ekipler ═══════ */}
        <TabsContent value="ekipler" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">Ana firmaya ait ekipleri yönetin</p>
            <Button onClick={openCreateTeam} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Yeni Ekip
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {teamsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
              ) : teams.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Henüz ekip eklenmemiş</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Sıra</TableHead>
                      <TableHead>Ekip Adı</TableHead>
                      <TableHead>Disiplin</TableHead>
                      <TableHead className="w-24 text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-muted-foreground">{t.sortOrder}</TableCell>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell>
                          {t.discipline ? <Badge variant="secondary">{t.discipline.name}</Badge> : <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditTeam(t)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleTeamDelete(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Ekip Dialog */}
          <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingTeam ? "Ekip Düzenle" : "Yeni Ekip Oluştur"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Ekip Adı *</Label>
                  <Input value={teamForm.name} onChange={(e) => setTeamField("name", e.target.value)} placeholder="Örn: Kaba İnşaat Ekibi" />
                </div>
                <div>
                  <Label>Disiplin</Label>
                  <Select value={teamForm.disciplineId} onValueChange={(v) => setTeamField("disciplineId", v)}>
                    <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                    <SelectContent>
                      {disciplines.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Sıra No</Label>
                  <Input type="number" value={teamForm.sortOrder} onChange={(e) => setTeamField("sortOrder", e.target.value)} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setTeamDialogOpen(false)}>İptal</Button>
                  <Button onClick={handleTeamSave} disabled={!teamForm.name.trim()}>Kaydet</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
