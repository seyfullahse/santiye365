"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { DollarSign, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface Payment {
  id: string;
  saleId: string;
  type: string;
  installmentNo: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  paidDate: string | null;
  status: string;
  notes: string | null;
  sale: {
    buyerName: string;
    unit: {
      unitNo: string;
      project: { id: string; name: string };
    };
    customer: { name: string } | null;
  };
}

interface InvestmentProject {
  id: string;
  name: string;
}

const typeLabels: Record<string, string> = {
  PESINAT: "Peşinat",
  TAKSIT: "Taksit",
  ARA_ODEME: "Ara Ödeme",
  TESLIMDE: "Teslimde",
  DIGER: "Diğer",
};

const statusLabels: Record<string, string> = {
  BEKLENIYOR: "Bekliyor",
  ODENDI: "Ödendi",
  GECIKTI: "Gecikti",
  IPTAL: "İptal",
};

const statusColors: Record<string, string> = {
  BEKLENIYOR: "bg-yellow-100 text-yellow-800",
  ODENDI: "bg-green-100 text-green-800",
  GECIKTI: "bg-red-100 text-red-800",
  IPTAL: "bg-gray-100 text-gray-800",
};

function formatCurrency(val: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(val);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("tr-TR");
}

export default function TahsilatPage() {
  const [projects, setProjects] = useState<InvestmentProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [payAmount, setPayAmount] = useState("");

  useEffect(() => {
    fetch("/api/yatirim/projeler")
      .then((r) => r.json())
      .then(setProjects)
      .catch(console.error);
  }, []);

  const fetchPayments = useCallback(() => {
    const q = selectedProjectId !== "all" ? `?projectId=${selectedProjectId}` : "";
    fetch(`/api/yatirim/tahsilat${q}`)
      .then((r) => r.json())
      .then((data) => {
        // Gecikmiş olanları güncelle (client-side)
        const now = new Date();
        setPayments(
          data.map((p: Payment) => ({
            ...p,
            status: p.status === "BEKLENIYOR" && new Date(p.dueDate) < now ? "GECIKTI" : p.status,
          }))
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedProjectId]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  function openPayDialog(payment: Payment) {
    setSelectedPayment(payment);
    setPayAmount((payment.amount - payment.paidAmount).toString());
    setPayDialogOpen(true);
  }

  async function handlePay() {
    if (!selectedPayment || !payAmount) return;

    const newPaidAmount = selectedPayment.paidAmount + parseFloat(payAmount);
    const isFullyPaid = newPaidAmount >= selectedPayment.amount;

    const res = await fetch(`/api/yatirim/tahsilat/${selectedPayment.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paidAmount: newPaidAmount,
        paidDate: new Date().toISOString(),
        status: isFullyPaid ? "ODENDI" : "BEKLENIYOR",
      }),
    });

    if (res.ok) {
      toast.success("Tahsilat kaydedildi");
      setPayDialogOpen(false);
      fetchPayments();
    } else {
      toast.error("Hata oluştu");
    }
  }

  const totalAmount = payments.reduce((s, p) => s + p.amount, 0);
  const totalPaid = payments.reduce((s, p) => s + p.paidAmount, 0);
  const totalPending = totalAmount - totalPaid;
  const overdueCount = payments.filter((p) => p.status === "GECIKTI").length;
  const overdueAmount = payments.filter((p) => p.status === "GECIKTI").reduce((s, p) => s + (p.amount - p.paidAmount), 0);
  const paidCount = payments.filter((p) => p.status === "ODENDI").length;

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Tahsilat Planı</h1>
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tahsilat Planı</h1>
          <p className="text-muted-foreground">Taksit takibi ve tahsilat işlemleri</p>
        </div>
      </div>

      {/* Filtre */}
      <div className="flex items-center gap-4">
        <div className="w-80">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger><SelectValue placeholder="Proje seçin" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Projeler</SelectItem>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Toplam Tutar
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" /> Tahsil Edilen
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
          <p className="text-xs text-muted-foreground">{paidCount} ödeme</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" /> Bekleyen
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" /> Gecikmiş
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{formatCurrency(overdueAmount)}</div>
          <p className="text-xs text-muted-foreground">{overdueCount} taksit</p></CardContent>
        </Card>
      </div>

      {/* Tahsilat tablosu */}
      <Card>
        <CardHeader>
          <CardTitle>Ödeme Detayları</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">Henüz ödeme kaydı bulunmuyor</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proje</TableHead>
                    <TableHead>Birim</TableHead>
                    <TableHead>Alıcı</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead>Taksit</TableHead>
                    <TableHead>Vade</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                    <TableHead className="text-right">Ödenen</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id} className={p.status === "GECIKTI" ? "bg-red-50" : ""}>
                      <TableCell className="text-sm">{p.sale.unit.project.name}</TableCell>
                      <TableCell className="font-medium">{p.sale.unit.unitNo}</TableCell>
                      <TableCell>{p.sale.buyerName}</TableCell>
                      <TableCell>{typeLabels[p.type] || p.type}</TableCell>
                      <TableCell>#{p.installmentNo}</TableCell>
                      <TableCell>{formatDate(p.dueDate)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(p.amount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(p.paidAmount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[p.status]}>
                          {statusLabels[p.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {p.status !== "ODENDI" && p.status !== "IPTAL" && (
                          <Button variant="outline" size="sm" onClick={() => openPayDialog(p)}>
                            Tahsil Et
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tahsilat Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tahsilat Yap</DialogTitle></DialogHeader>
          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
                <p><span className="font-medium">Alıcı:</span> {selectedPayment.sale.buyerName}</p>
                <p><span className="font-medium">Birim:</span> {selectedPayment.sale.unit.unitNo}</p>
                <p><span className="font-medium">Taksit Tutarı:</span> {formatCurrency(selectedPayment.amount)}</p>
                <p><span className="font-medium">Ödenmiş:</span> {formatCurrency(selectedPayment.paidAmount)}</p>
                <p><span className="font-medium">Kalan:</span> {formatCurrency(selectedPayment.amount - selectedPayment.paidAmount)}</p>
              </div>
              <div>
                <Label>Tahsil Edilecek Tutar (₺)</Label>
                <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>İptal</Button>
            <Button onClick={handlePay}>Tahsil Et</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
