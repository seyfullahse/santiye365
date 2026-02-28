"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Phone,
  Mail,
  Users,
  Building2,
  MessageSquare,
  MapPin,
  StickyNote,
  Calendar,
  Search,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

/* ═══════ TYPES ═══════ */
type CommType = "MEETING" | "PHONE" | "EMAIL" | "VISIT" | "NOTE";

interface CommunicationLog {
  id: string;
  customerId: string;
  opportunityId: string | null;
  type: CommType;
  subject: string;
  content: string | null;
  contactDate: string;
  nextFollowUp: string | null;
  createdBy: string | null;
  createdAt: string;
  customer: { id: string; name: string };
  opportunity: { id: string; title: string } | null;
}

interface Customer {
  id: string;
  name: string;
}

interface Opportunity {
  id: string;
  title: string;
  customerId: string;
}

/* ═══════ CONSTANTS ═══════ */
const typeConfig: Record<CommType, { label: string; icon: typeof Phone; color: string }> = {
  MEETING: { label: "Toplantı", icon: Users, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  PHONE: { label: "Telefon", icon: Phone, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  EMAIL: { label: "E-posta", icon: Mail, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  VISIT: { label: "Ziyaret", icon: MapPin, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  NOTE: { label: "Not", icon: StickyNote, color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400" },
};

function formatDateTime(date: string) {
  return new Date(date).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function IletisimPage() {
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selected, setSelected] = useState<CommunicationLog | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterCustomerId, setFilterCustomerId] = useState("");
  const [filterType, setFilterType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [form, setForm] = useState({
    customerId: "",
    opportunityId: "",
    type: "PHONE" as CommType,
    subject: "",
    content: "",
    contactDate: new Date().toISOString().split("T")[0],
    nextFollowUp: "",
    createdBy: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterCustomerId) params.set("customerId", filterCustomerId);
      const [logRes, custRes, oppRes] = await Promise.all([
        fetch(`/api/crm/iletisim?${params}`),
        fetch("/api/crm/musteriler"),
        fetch("/api/crm/firsatlar"),
      ]);
      if (!logRes.ok) throw new Error();
      setLogs(await logRes.json());
      if (custRes.ok) setCustomers(await custRes.json());
      if (oppRes.ok) setOpportunities(await oppRes.json());
    } catch {
      toast.error("İletişim verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [filterCustomerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredLogs = logs.filter((l) => {
    if (filterType && l.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        l.subject.toLowerCase().includes(q) ||
        l.customer.name.toLowerCase().includes(q) ||
        (l.content && l.content.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const resetForm = () =>
    setForm({
      customerId: "",
      opportunityId: "",
      type: "PHONE",
      subject: "",
      content: "",
      contactDate: new Date().toISOString().split("T")[0],
      nextFollowUp: "",
      createdBy: "",
    });

  const handleSubmit = async () => {
    if (!form.customerId || !form.subject.trim()) {
      toast.error("Müşteri ve konu zorunludur.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/crm/iletisim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          opportunityId: form.opportunityId || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("İletişim kaydı oluşturuldu.");
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch {
      toast.error("Kayıt oluşturulamadı.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/crm/iletisim/${selected.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("İletişim kaydı silindi.");
      setDeleteDialogOpen(false);
      setSelected(null);
      fetchData();
    } catch {
      toast.error("Kayıt silinemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  // Müşteri seçildiğinde ilgili fırsatları filtrele
  const filteredOpportunities = form.customerId
    ? opportunities.filter((o) => o.customerId === form.customerId)
    : opportunities;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">İletişim Geçmişi</h1>
          <p className="text-muted-foreground">
            {filteredLogs.length} kayıt
          </p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Kayıt
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Konu veya müşteri ara..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterCustomerId} onValueChange={setFilterCustomerId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Müşteri" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Müşteriler</SelectItem>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tip" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            {(Object.entries(typeConfig) as [CommType, typeof typeConfig.MEETING][]).map(
              ([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  {cfg.label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-16 animate-pulse bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p>Henüz iletişim kaydı yok.</p>
            <p className="text-sm mt-1">Yeni bir kayıt oluşturmak için butonu kullanın.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const cfg = typeConfig[log.type];
            const Icon = cfg.icon;
            return (
              <Card key={log.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`rounded-full p-2.5 shrink-0 ${cfg.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium text-sm">{log.subject}</h3>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {log.customer.name}
                            </span>
                            {log.opportunity && (
                              <span className="flex items-center gap-1">
                                <ArrowRight className="h-3 w-3" />
                                {log.opportunity.title}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-xs">
                            {cfg.label}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setSelected(log);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      {log.content && (
                        <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">
                          {log.content}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(log.contactDate)}
                        </span>
                        {log.nextFollowUp && (
                          <span className="flex items-center gap-1 text-orange-600">
                            <Calendar className="h-3 w-3" />
                            Takip: {formatDate(log.nextFollowUp)}
                          </span>
                        )}
                        {log.createdBy && (
                          <span>Kaydeden: {log.createdBy}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ═══ Create Dialog ═══ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni İletişim Kaydı</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Müşteri *</Label>
              <Select
                value={form.customerId}
                onValueChange={(v) =>
                  setForm({ ...form, customerId: v, opportunityId: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Müşteri seçin" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>İlgili Fırsat (opsiyonel)</Label>
              <Select
                value={form.opportunityId}
                onValueChange={(v) =>
                  setForm({ ...form, opportunityId: v === "none" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Fırsat seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Fırsatsız</SelectItem>
                  {filteredOpportunities.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tip</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm({ ...form, type: v as CommType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(typeConfig) as [
                        CommType,
                        typeof typeConfig.MEETING,
                      ][]
                    ).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        {cfg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tarih</Label>
                <Input
                  type="date"
                  value={form.contactDate}
                  onChange={(e) =>
                    setForm({ ...form, contactDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Konu *</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="İletişim konusu"
              />
            </div>
            <div>
              <Label>İçerik / Notlar</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={3}
                placeholder="Görüşme detayları, alınan kararlar..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Takip Tarihi</Label>
                <Input
                  type="date"
                  value={form.nextFollowUp}
                  onChange={(e) =>
                    setForm({ ...form, nextFollowUp: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Kaydeden</Label>
                <Input
                  value={form.createdBy}
                  onChange={(e) =>
                    setForm({ ...form, createdBy: e.target.value })
                  }
                  placeholder="Ad Soyad"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ Delete Dialog ═══ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kaydı Sil</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <strong>{selected?.subject}</strong> iletişim kaydını silmek
            istediğinize emin misiniz?
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
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
