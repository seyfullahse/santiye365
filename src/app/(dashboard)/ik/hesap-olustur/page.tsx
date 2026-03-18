"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  UserPlus,
  Users,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface AvailableEmployee {
  id: string;
  firstName: string;
  lastName: string;
  employeeNo: string | null;
  email: string | null;
  phone: string | null;
  department: { id: string; name: string } | null;
  position: { id: string; name: string } | null;
  company: { id: string; name: string } | null;
  project: { id: string; name: string } | null;
}

interface CreateResult {
  employeeId: string;
  employeeName: string;
  success: boolean;
  userId?: string;
  email?: string;
  error?: string;
}

type Step = "select" | "creating" | "results";

export default function HesapOlusturPage() {
  const [employees, setEmployees] = useState<AvailableEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Filtreler
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");

  // Ayarlar
  const [password, setPassword] = useState("santiye360");
  const [role, setRole] = useState("USER");
  const [emailDomain, setEmailDomain] = useState("santiye360.com");
  const [domainLoading, setDomainLoading] = useState(true);

  // Süreç
  const [step, setStep] = useState<Step>("select");
  const [creating, setCreating] = useState(false);
  const [results, setResults] = useState<CreateResult[]>([]);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/kullanicilar/available-employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      } else {
        toast.error("Personel listesi alınamadı");
      }
    } catch {
      toast.error("Bağlantı hatası");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
    // Firma profilinden e-posta domain'ini al
    fetch("/api/organizasyon/profil")
      .then((r) => r.json())
      .then((data) => {
        if (data.emailDomain) setEmailDomain(data.emailDomain);
      })
      .catch(() => {})
      .finally(() => setDomainLoading(false));
  }, [fetchEmployees]);

  // Benzersiz departman ve şirket listesi
  const departments = useMemo(() => {
    const depts = new Map<string, string>();
    employees.forEach((e) => {
      if (e.department) depts.set(e.department.id, e.department.name);
    });
    return Array.from(depts.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, [employees]);

  const companies = useMemo(() => {
    const comps = new Map<string, string>();
    employees.forEach((e) => {
      if (e.company) comps.set(e.company.id, e.company.name);
    });
    return Array.from(comps.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, [employees]);

  // Filtrelenmiş liste
  const filtered = useMemo(() => {
    return employees.filter((e) => {
      if (search) {
        const s = search.toLowerCase();
        const match =
          `${e.firstName} ${e.lastName}`.toLowerCase().includes(s) ||
          (e.employeeNo || "").toLowerCase().includes(s) ||
          (e.email || "").toLowerCase().includes(s) ||
          (e.phone || "").includes(s);
        if (!match) return false;
      }
      if (deptFilter !== "all" && e.department?.id !== deptFilter) return false;
      if (companyFilter !== "all" && e.company?.id !== companyFilter) return false;
      return true;
    });
  }, [employees, search, deptFilter, companyFilter]);

  // Seçim işlemleri
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const filteredIds = filtered.map((e) => e.id);
    const allSelected = filteredIds.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        filteredIds.forEach((id) => next.delete(id));
      } else {
        filteredIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  // Hesap oluştur
  const handleCreate = async () => {
    if (selected.size === 0) return toast.error("En az bir personel seçin");
    setCreating(true);
    setStep("creating");
    try {
      const res = await fetch("/api/kullanicilar/toplu-olustur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employees: Array.from(selected).map((id) => ({ employeeId: id })),
          defaultPassword: password || "santiye360",
          defaultRole: role,
          emailDomain: emailDomain || "santiye360.com",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResults(data.results);
        setStep("results");
        const s = data.summary;
        if (s.success > 0) toast.success(`${s.success} hesap oluşturuldu`);
        if (s.fail > 0) toast.error(`${s.fail} hesap oluşturulamadı`);
      } else {
        toast.error(data.error || "Hesap oluşturma başarısız");
        setStep("select");
      }
    } catch {
      toast.error("Bağlantı hatası");
      setStep("select");
    } finally {
      setCreating(false);
    }
  };

  const handleReset = () => {
    setStep("select");
    setResults([]);
    setSelected(new Set());
    fetchEmployees();
  };

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/ik/personel">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Kullanıcı Hesabı Oluştur</h1>
            <p className="text-muted-foreground">
              Henüz hesabı olmayan personel için toplu veya tekli kullanıcı hesabı oluşturun
            </p>
          </div>
        </div>
        {step === "select" && (
          <Button variant="outline" size="sm" onClick={fetchEmployees} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Yenile
          </Button>
        )}
      </div>

      {/* Sonuç ekranı */}
      {step === "results" && (
        <div className="space-y-6">
          {/* Özet kartları */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-3xl font-bold">{results.length}</p>
                <p className="text-sm text-muted-foreground">Toplam İşlem</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-3xl font-bold text-green-600">{successCount}</p>
                <p className="text-sm text-muted-foreground">Başarılı</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <XCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
                <p className="text-3xl font-bold text-red-600">{failCount}</p>
                <p className="text-sm text-muted-foreground">Başarısız</p>
              </CardContent>
            </Card>
          </div>

          {/* Sonuç tablosu */}
          <Card>
            <CardHeader>
              <CardTitle>Sonuçlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Personel</TableHead>
                      <TableHead>E-posta</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Detay</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((r) => (
                      <TableRow key={r.employeeId}>
                        <TableCell className="font-medium">{r.employeeName}</TableCell>
                        <TableCell className="font-mono text-sm">{r.email || "-"}</TableCell>
                        <TableCell>
                          {r.success ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Başarılı
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Başarısız
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {r.success ? "Hesap oluşturuldu" : r.error}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Yeni İşlem Başlat
            </Button>
            <Link href="/ik/personel">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Personel Listesine Dön
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Oluşturma ekranı */}
      {step === "creating" && (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
            <h2 className="text-xl font-semibold mb-2">Hesaplar Oluşturuluyor...</h2>
            <p className="text-muted-foreground">
              {selected.size} personel için kullanıcı hesabı oluşturuluyor. Lütfen bekleyin.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Seçim ekranı */}
      {step === "select" && (
        <>
          {/* İstatistik */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{employees.length}</p>
                  <p className="text-xs text-muted-foreground">Hesabı Olmayan Personel</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <UserPlus className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{selected.size}</p>
                  <p className="text-xs text-muted-foreground">Seçili Personel</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{filtered.length}</p>
                  <p className="text-xs text-muted-foreground">Filtrelenen</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtreler */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Ad, soyad, sicil no, e-posta, telefon ile ara..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Select value={deptFilter} onValueChange={setDeptFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Departman" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Departmanlar</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={companyFilter} onValueChange={setCompanyFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Şirket" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Şirketler</SelectItem>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Ayarlar + Aksiyon */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-end gap-4">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Varsayılan Şifre</Label>
                    <Input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="santiye360"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Varsayılan Rol</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">Kullanıcı</SelectItem>
                        <SelectItem value="VIEWER">İzleyici</SelectItem>
                        <SelectItem value="MANAGER">Yönetici</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">E-posta Domain</Label>
                    <Input
                      value={emailDomain}
                      onChange={(e) => setEmailDomain(e.target.value)}
                      placeholder="santiye360.com"
                      className="mt-1"
                      disabled={domainLoading}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      <Link href="/organizasyon/profil" className="text-primary hover:underline">Firma Profili</Link>&apos;nden değiştirilebilir
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {selected.size > 0 && (
                    <Button variant="outline" onClick={clearSelection}>
                      Seçimi Temizle
                    </Button>
                  )}
                  <Button
                    onClick={handleCreate}
                    disabled={creating || selected.size === 0}
                    className="whitespace-nowrap"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {selected.size > 0
                      ? `${selected.size} Hesap Oluştur`
                      : "Personel Seçin"}
                  </Button>
                </div>
              </div>
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                E-posta adresleri otomatik oluşturulur: <strong>ad.soyad@{emailDomain}</strong> · Şifre tüm kullanıcılar için aynı olacaktır.
              </div>
            </CardContent>
          </Card>

          {/* Personel Tablosu */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Hesabı Olmayan Personel</CardTitle>
                {filtered.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {selected.size} / {filtered.length} seçili
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-3 text-muted-foreground">Yükleniyor...</span>
                </div>
              ) : employees.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <h3 className="text-lg font-semibold">Tüm Personelin Hesabı Mevcut</h3>
                  <p className="text-muted-foreground mt-1">
                    Aktif tüm personelin kullanıcı hesabı zaten oluşturulmuş.
                  </p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Filtrelere uygun personel bulunamadı.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              filtered.length > 0 &&
                              filtered.every((e) => selected.has(e.id))
                            }
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Ad Soyad</TableHead>
                        <TableHead>Sicil No</TableHead>
                        <TableHead>Departman</TableHead>
                        <TableHead>Pozisyon</TableHead>
                        <TableHead>Şirket</TableHead>
                        <TableHead>E-posta</TableHead>
                        <TableHead>Telefon</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((emp) => (
                        <TableRow
                          key={emp.id}
                          className={`cursor-pointer transition-colors ${
                            selected.has(emp.id) ? "bg-primary/5" : "hover:bg-muted/50"
                          }`}
                          onClick={() => toggleSelect(emp.id)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selected.has(emp.id)}
                              onCheckedChange={() => toggleSelect(emp.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {emp.firstName} {emp.lastName}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {emp.employeeNo || "-"}
                          </TableCell>
                          <TableCell>{emp.department?.name || "-"}</TableCell>
                          <TableCell>{emp.position?.name || "-"}</TableCell>
                          <TableCell>{emp.company?.name || "-"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {emp.email || "-"}
                          </TableCell>
                          <TableCell className="text-sm">{emp.phone || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
