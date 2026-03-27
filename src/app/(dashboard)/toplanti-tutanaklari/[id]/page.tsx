"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  CheckCircle2,
  Circle,
  MessageSquare,
  Send,
  Columns3,
  Users,
  Pencil,
  X,
  GripVertical,
  ClipboardCheck,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";

/* ─────── Types ─────── */
interface MeetingColumn {
  id: string;
  name: string;
  type: string;
  sortOrder: number;
  width: number | null;
  options: string | null;
  isRequired: boolean;
}

interface MeetingItemValue {
  id: string;
  itemId: string;
  columnId: string;
  value: string;
}

interface MeetingComment {
  id: string;
  itemId: string;
  author: string;
  content: string;
  createdAt: string;
}

interface MeetingItem {
  id: string;
  rowNumber: number;
  isCompleted: boolean;
  completedAt: string | null;
  sortOrder: number;
  values: MeetingItemValue[];
  comments: MeetingComment[];
}

interface Participant {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  isPresent: boolean;
}

interface Meeting {
  id: string;
  title: string;
  meetingNo: number;
  type: string;
  status: string;
  date: string;
  location: string | null;
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
  project: { id: string; name: string } | null;
  participants: Participant[];
  columns: MeetingColumn[];
  items: MeetingItem[];
}

const MEETING_TYPES = [
  { value: "ISVEREN", label: "İşveren Toplantısı" },
  { value: "TASERON", label: "Taşeron Toplantısı" },
  { value: "KOORDINASYON", label: "Koordinasyon Toplantısı" },
  { value: "ISG", label: "İSG Toplantısı" },
  { value: "TEKNIK", label: "Teknik Toplantı" },
  { value: "HAFTALIK", label: "Haftalık Toplantı" },
  { value: "DIGER", label: "Diğer" },
];

const MEETING_STATUSES = [
  { value: "PLANNED", label: "Planlandı", color: "bg-blue-100 text-blue-700" },
  { value: "IN_PROGRESS", label: "Devam Ediyor", color: "bg-yellow-100 text-yellow-700" },
  { value: "COMPLETED", label: "Tamamlandı", color: "bg-green-100 text-green-700" },
  { value: "CANCELLED", label: "İptal", color: "bg-red-100 text-red-700" },
];

const COLUMN_TYPES = [
  { value: "text", label: "Metin" },
  { value: "checkbox", label: "Onay Kutusu" },
  { value: "date", label: "Tarih" },
  { value: "select", label: "Seçenekli" },
];

function getStatusBadge(status: string) {
  const s = MEETING_STATUSES.find((st) => st.value === status);
  if (!s) return <Badge variant="outline">{status}</Badge>;
  return <Badge className={s.color}>{s.label}</Badge>;
}

function getTypeLabel(type: string) {
  return MEETING_TYPES.find((t) => t.value === type)?.label ?? type;
}

export default function ToplantiDetayPage() {
  const router = useRouter();
  const params = useParams();
  const meetingId = params.id as string;

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  // Edit header
  const [editHeader, setEditHeader] = useState(false);
  const [headerForm, setHeaderForm] = useState({
    projectId: "",
    title: "",
    type: "",
    status: "",
    date: "",
    location: "",
    startTime: "",
    endTime: "",
    notes: "",
  });

  // Add column dialog
  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [newColumn, setNewColumn] = useState({
    name: "",
    type: "text",
    width: 200,
    options: "",
  });

  // Comment
  const [commentOpen, setCommentOpen] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  // Participants dialog
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [editParticipants, setEditParticipants] = useState<
    { name: string; company: string; role: string; isPresent: boolean }[]
  >([]);

  // Cell editing state
  const [editingCell, setEditingCell] = useState<{
    itemId: string;
    columnId: string;
  } | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  /* ─────── Fetch ─────── */
  const fetchMeeting = useCallback(async () => {
    try {
      const res = await fetch(`/api/toplanti-tutanaklari/${meetingId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMeeting(data);
    } catch {
      toast.error("Toplantı yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    fetchMeeting();
    fetch("/api/projeler").then(r => r.json()).then(d => setProjects(Array.isArray(d) ? d : d.projects || [])).catch(() => {});
  }, [fetchMeeting]);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  /* ─────── Header Update ─────── */
  const openEditHeader = () => {
    if (!meeting) return;
    setHeaderForm({
      projectId: meeting.project?.id || "",
      title: meeting.title,
      type: meeting.type,
      status: meeting.status,
      date: meeting.date ? new Date(meeting.date).toISOString().split("T")[0] : "",
      location: meeting.location || "",
      startTime: meeting.startTime || "",
      endTime: meeting.endTime || "",
      notes: meeting.notes || "",
    });
    setEditHeader(true);
  };

  const saveHeader = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/toplanti-tutanaklari/${meetingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...headerForm,
          projectId: headerForm.projectId || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Toplantı bilgileri güncellendi");
      setEditHeader(false);
      fetchMeeting();
    } catch {
      toast.error("Güncellenemedi");
    } finally {
      setSaving(false);
    }
  };

  /* ─────── Rows (Items) ─────── */
  const addRow = async () => {
    if (!meeting) return;
    try {
      const defaultValues: Record<string, string> = {};
      meeting.columns.forEach((col) => {
        defaultValues[col.id] = "";
      });

      const res = await fetch(`/api/toplanti-tutanaklari/${meetingId}/kalemler`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: defaultValues }),
      });
      if (!res.ok) throw new Error();
      fetchMeeting();
    } catch {
      toast.error("Satır eklenemedi");
    }
  };

  const deleteRow = async (itemId: string) => {
    try {
      const res = await fetch(
        `/api/toplanti-tutanaklari/${meetingId}/kalemler?itemId=${itemId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      fetchMeeting();
    } catch {
      toast.error("Satır silinemedi");
    }
  };

  const toggleComplete = async (item: MeetingItem) => {
    try {
      const res = await fetch(`/api/toplanti-tutanaklari/${meetingId}/kalemler`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          isCompleted: !item.isCompleted,
        }),
      });
      if (!res.ok) throw new Error();
      fetchMeeting();
    } catch {
      toast.error("Durum güncellenemedi");
    }
  };

  /* ─────── Cell Edit ─────── */
  const startEdit = (itemId: string, columnId: string, currentValue: string) => {
    setEditingCell({ itemId, columnId });
    setEditingValue(currentValue);
  };

  const saveCell = async () => {
    if (!editingCell) return;
    try {
      const res = await fetch(`/api/toplanti-tutanaklari/${meetingId}/kalemler`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: editingCell.itemId,
          values: { [editingCell.columnId]: editingValue },
        }),
      });
      if (!res.ok) throw new Error();
      // Update local state immediately
      setMeeting((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((item) => {
            if (item.id !== editingCell.itemId) return item;
            const existingVal = item.values.find(
              (v) => v.columnId === editingCell.columnId
            );
            if (existingVal) {
              return {
                ...item,
                values: item.values.map((v) =>
                  v.columnId === editingCell.columnId
                    ? { ...v, value: editingValue }
                    : v
                ),
              };
            }
            return {
              ...item,
              values: [
                ...item.values,
                {
                  id: "temp-" + Date.now(),
                  itemId: editingCell.itemId,
                  columnId: editingCell.columnId,
                  value: editingValue,
                },
              ],
            };
          }),
        };
      });
      setEditingCell(null);
    } catch {
      toast.error("Değer kaydedilemedi");
    }
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditingValue("");
  };

  /* ─────── Columns ─────── */
  const addColumn = async () => {
    if (!newColumn.name.trim()) {
      toast.error("Sütun adı zorunludur");
      return;
    }
    try {
      const payload: Record<string, unknown> = {
        name: newColumn.name,
        type: newColumn.type,
        width: newColumn.width,
      };
      if (newColumn.type === "select" && newColumn.options) {
        payload.options = newColumn.options.split(",").map((o) => o.trim());
      }
      const res = await fetch(`/api/toplanti-tutanaklari/${meetingId}/sutunlar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success("Sütun eklendi");
      setAddColumnOpen(false);
      setNewColumn({ name: "", type: "text", width: 200, options: "" });
      fetchMeeting();
    } catch {
      toast.error("Sütun eklenemedi");
    }
  };

  const deleteColumn = async (columnId: string) => {
    if (!confirm("Bu sütunu silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(
        `/api/toplanti-tutanaklari/${meetingId}/sutunlar?columnId=${columnId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      toast.success("Sütun silindi");
      fetchMeeting();
    } catch {
      toast.error("Sütun silinemedi");
    }
  };

  /* ─────── Comments ─────── */
  const addComment = async (itemId: string) => {
    if (!commentText.trim()) return;
    try {
      const res = await fetch(`/api/toplanti-tutanaklari/${meetingId}/yorumlar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          content: commentText,
        }),
      });
      if (!res.ok) throw new Error();
      setCommentText("");
      fetchMeeting();
    } catch {
      toast.error("Yorum eklenemedi");
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const res = await fetch(
        `/api/toplanti-tutanaklari/${meetingId}/yorumlar?commentId=${commentId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      fetchMeeting();
    } catch {
      toast.error("Yorum silinemedi");
    }
  };

  /* ─────── Participants ─────── */
  const openParticipants = () => {
    if (!meeting) return;
    setEditParticipants(
      meeting.participants.map((p) => ({
        name: p.name,
        company: p.company || "",
        role: p.role || "",
        isPresent: p.isPresent,
      }))
    );
    setParticipantsOpen(true);
  };

  const saveParticipants = async () => {
    try {
      const res = await fetch(
        `/api/toplanti-tutanaklari/${meetingId}/katilimcilar`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participants: editParticipants.filter((p) => p.name.trim()),
          }),
        }
      );
      if (!res.ok) throw new Error();
      toast.success("Katılımcılar güncellendi");
      setParticipantsOpen(false);
      fetchMeeting();
    } catch {
      toast.error("Katılımcılar güncellenemedi");
    }
  };

  /* ─────── Helpers ─────── */
  const getCellValue = (item: MeetingItem, columnId: string): string => {
    return item.values.find((v) => v.columnId === columnId)?.value || "";
  };

  const completedCount = meeting?.items.filter((i) => i.isCompleted).length ?? 0;
  const totalCount = meeting?.items.length ?? 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  /* ─────── PDF Export ─────── */
  const exportPDF = () => {
    if (!meeting) return;

    const dateStr = new Date(meeting.date).toLocaleDateString("tr-TR");
    const typeLabel = getTypeLabel(meeting.type);
    const statusLabel = MEETING_STATUSES.find(s => s.value === meeting.status)?.label || meeting.status;

    // Build participants HTML
    const participantsHtml = meeting.participants.length > 0
      ? `<table class="info-table">
          <thead><tr><th>Ad Soyad</th><th>Firma</th><th>G\u00f6rev</th><th>Kat\u0131l\u0131m</th></tr></thead>
          <tbody>${meeting.participants.map(p => `
            <tr>
              <td>${p.name}</td>
              <td>${p.company || "-"}</td>
              <td>${p.role || "-"}</td>
              <td>${p.isPresent ? "\u2714 Kat\u0131ld\u0131" : "\u2718 Kat\u0131lmad\u0131"}</td>
            </tr>`).join("")}
          </tbody>
        </table>`
      : "<p><em>Kat\u0131l\u0131mc\u0131 bilgisi yok</em></p>";

    // Build main table HTML
    const colHeaders = meeting.columns.map(col => `<th>${col.name}</th>`).join("");
    const rows = meeting.items.map(item => {
      const cells = meeting.columns.map(col => {
        const val = getCellValue(item, col.id);
        if (col.type === "checkbox") return `<td>${val === "true" ? "\u2714" : "\u2718"}</td>`;
        if (col.type === "date" && val) return `<td>${new Date(val).toLocaleDateString("tr-TR")}</td>`;
        return `<td>${val || "-"}</td>`;
      }).join("");
      
      const commentsHtml = item.comments.length > 0
        ? `<div class="comments">${item.comments.map(c => 
            `<div class="comment"><strong>${c.author}:</strong> ${c.content}</div>`
          ).join("")}</div>`
        : "";

      return `<tr class="${item.isCompleted ? 'completed' : ''}">
        <td class="row-num">${item.rowNumber}</td>
        <td class="check">${item.isCompleted ? "\u2714" : "\u25cb"}</td>
        ${cells}
      </tr>${commentsHtml ? `<tr><td colspan="${meeting.columns.length + 2}" class="comment-cell">${commentsHtml}</td></tr>` : ""}`;
    }).join("");

    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${meeting.title} - Toplant\u0131 Tutana\u011f\u0131</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1a1a1a; font-size: 12px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #16a34a; padding-bottom: 20px; }
    .header h1 { font-size: 22px; color: #16a34a; margin-bottom: 4px; }
    .header .subtitle { font-size: 14px; color: #666; }
    .header .meeting-no { display: inline-block; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; padding: 2px 10px; font-weight: bold; color: #16a34a; margin-top: 8px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 24px; background: #f9fafb; border-radius: 8px; padding: 16px; border: 1px solid #e5e7eb; }
    .meta-item { display: flex; gap: 8px; }
    .meta-item .label { font-weight: 600; color: #374151; min-width: 100px; }
    .meta-item .value { color: #6b7280; }
    .section { margin-bottom: 24px; }
    .section h2 { font-size: 14px; font-weight: 700; color: #374151; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 2px solid #e5e7eb; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #f3f4f6; font-weight: 600; text-align: left; padding: 8px 10px; border: 1px solid #d1d5db; color: #374151; }
    td { padding: 6px 10px; border: 1px solid #e5e7eb; vertical-align: top; }
    tr:nth-child(even) { background: #f9fafb; }
    .completed td { text-decoration: line-through; color: #9ca3af; background: #f0fdf4; }
    .row-num { text-align: center; font-weight: 600; color: #6b7280; width: 35px; }
    .check { text-align: center; width: 30px; font-size: 14px; }
    .comment-cell { background: #fffbeb !important; padding: 6px 10px 6px 50px; border-top: none; }
    .comments { font-size: 10px; }
    .comment { margin-bottom: 3px; color: #92400e; }
    .info-table td, .info-table th { font-size: 11px; }
    .progress-bar { height: 16px; background: #e5e7eb; border-radius: 8px; overflow: hidden; margin-top: 6px; }
    .progress-fill { height: 100%; background: #16a34a; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold; }
    .notes { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; white-space: pre-wrap; font-size: 11px; color: #4b5563; }
    .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 12px; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:center;margin-bottom:20px;">
    <button onclick="window.print()" style="padding:10px 24px;background:#16a34a;color:white;border:none;border-radius:6px;font-size:14px;cursor:pointer;font-weight:600;">\ud83d\udda8\ufe0f Yazd\u0131r / PDF Kaydet</button>
  </div>

  <div class="header">
    <h1>${meeting.title}</h1>
    <div class="subtitle">${meeting.project?.name || "Proje atanmam\u0131\u015f"} \u2022 ${typeLabel}</div>
    <div class="meeting-no">Toplant\u0131 No: #${meeting.meetingNo}</div>
  </div>

  <div class="meta-grid">
    <div class="meta-item"><span class="label">Tarih:</span><span class="value">${dateStr}</span></div>
    <div class="meta-item"><span class="label">Durum:</span><span class="value">${statusLabel}</span></div>
    <div class="meta-item"><span class="label">Saat:</span><span class="value">${meeting.startTime || "-"}${meeting.endTime ? " - " + meeting.endTime : ""}</span></div>
    <div class="meta-item"><span class="label">Yer:</span><span class="value">${meeting.location || "-"}</span></div>
    <div class="meta-item"><span class="label">Kat\u0131l\u0131mc\u0131:</span><span class="value">${meeting.participants.length} ki\u015fi</span></div>
    <div class="meta-item"><span class="label">\u0130lerleme:</span><span class="value">${completedCount}/${totalCount} (%${progressPercent})</span></div>
  </div>

  ${totalCount > 0 ? `<div class="section">
    <div class="progress-bar"><div class="progress-fill" style="width:${progressPercent}%">${progressPercent > 10 ? "%" + progressPercent : ""}</div></div>
  </div>` : ""}

  <div class="section">
    <h2>Kat\u0131l\u0131mc\u0131lar</h2>
    ${participantsHtml}
  </div>

  <div class="section">
    <h2>Toplant\u0131 Maddeleri</h2>
    ${meeting.items.length > 0 ? `<table>
      <thead><tr><th class="row-num">#</th><th class="check">\u2714</th>${colHeaders}</tr></thead>
      <tbody>${rows}</tbody>
    </table>` : "<p><em>Hen\u00fcz madde eklenmemi\u015f</em></p>"}
  </div>

  ${meeting.notes ? `<div class="section">
    <h2>Toplant\u0131 Notlar\u0131</h2>
    <div class="notes">${meeting.notes}</div>
  </div>` : ""}

  <div class="footer">
    \u015eantiye360 \u2014 Toplant\u0131 Tutana\u011f\u0131 \u2022 Olu\u015fturulma: ${new Date().toLocaleString("tr-TR")}
  </div>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

  /* ─────── Render ─────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        Yükleniyor...
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <p>Toplantı bulunamadı</p>
        <Button variant="link" onClick={() => router.push("/toplanti-tutanaklari")}>
          Listeye Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/toplanti-tutanaklari")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{meeting.title}</h1>
              <Badge variant="outline" className="font-mono">
                #{meeting.meetingNo}
              </Badge>
              {getStatusBadge(meeting.status)}
            </div>
            <p className="text-sm text-muted-foreground">
              {meeting.project?.name || "Proje atanmamış"} • {getTypeLabel(meeting.type)} •{" "}
              {new Date(meeting.date).toLocaleDateString("tr-TR")}
              {meeting.startTime && ` ${meeting.startTime}`}
              {meeting.endTime && ` - ${meeting.endTime}`}
              {meeting.location && ` • ${meeting.location}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <FileDown className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={openParticipants}>
            <Users className="mr-2 h-4 w-4" />
            Katılımcılar ({meeting.participants.length})
          </Button>
          <Button variant="outline" size="sm" onClick={openEditHeader}>
            <Pencil className="mr-2 h-4 w-4" />
            Düzenle
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                İlerleme: {completedCount}/{totalCount} madde tamamlandı
              </span>
              <span className="text-sm font-bold text-lime-600">%{progressPercent}</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-lime-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="tutanak" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tutanak">
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Tutanak Tablosu
          </TabsTrigger>
          <TabsTrigger value="katilimcilar">
            <Users className="mr-2 h-4 w-4" />
            Katılımcılar
          </TabsTrigger>
          {meeting.notes && (
            <TabsTrigger value="notlar">Notlar</TabsTrigger>
          )}
        </TabsList>

        {/* ─────── Tutanak Tablosu ─────── */}
        <TabsContent value="tutanak" className="space-y-4">
          {/* Toolbar */}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={addRow} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Satır Ekle
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddColumnOpen(true)}
            >
              <Columns3 className="mr-2 h-4 w-4" />
              Sütun Ekle
            </Button>
          </div>

          {/* Dynamic Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-3 py-3 text-left font-semibold w-10">#</th>
                      <th className="px-3 py-3 text-left font-semibold w-12">
                        <CheckCircle2 className="h-4 w-4" />
                      </th>
                      {meeting.columns.map((col) => (
                        <th
                          key={col.id}
                          className="px-3 py-3 text-left font-semibold group"
                          style={{ minWidth: col.width || 150 }}
                        >
                          <div className="flex items-center gap-1">
                            <span>{col.name}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => deleteColumn(col.id)}
                              title="Sütunu sil"
                            >
                              <X className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </th>
                      ))}
                      <th className="px-3 py-3 text-left font-semibold w-20">Yorum</th>
                      <th className="px-3 py-3 text-right font-semibold w-12">Sil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meeting.items.length === 0 ? (
                      <tr>
                        <td
                          colSpan={meeting.columns.length + 4}
                          className="text-center py-12 text-muted-foreground"
                        >
                          Henüz madde eklenmemiş. &quot;Satır Ekle&quot; butonunu kullanın.
                        </td>
                      </tr>
                    ) : (
                      meeting.items.map((item) => (
                        <tr
                          key={item.id}
                          className={`border-b hover:bg-muted/30 transition-colors ${
                            item.isCompleted ? "bg-green-50/50 opacity-75" : ""
                          }`}
                        >
                          {/* Row Number */}
                          <td className="px-3 py-2 text-muted-foreground font-mono text-xs">
                            <div className="flex items-center gap-1">
                              <GripVertical className="h-3 w-3 text-muted-foreground/40" />
                              {item.rowNumber}
                            </div>
                          </td>

                          {/* Checkbox */}
                          <td className="px-3 py-2">
                            <button
                              onClick={() => toggleComplete(item)}
                              className="transition-colors"
                              title={
                                item.isCompleted ? "Tamamlanmadı olarak işaretle" : "Tamamlandı olarak işaretle"
                              }
                            >
                              {item.isCompleted ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground hover:text-green-600" />
                              )}
                            </button>
                          </td>

                          {/* Dynamic Column Values */}
                          {meeting.columns.map((col) => {
                            const cellVal = getCellValue(item, col.id);
                            const isEditing =
                              editingCell?.itemId === item.id &&
                              editingCell?.columnId === col.id;

                            return (
                              <td key={col.id} className="px-3 py-2">
                                {isEditing ? (
                                  <div className="flex gap-1">
                                    {col.type === "select" ? (
                                      <Select
                                        value={editingValue}
                                        onValueChange={(v) => {
                                          setEditingValue(v);
                                          // Auto-save for select
                                          setEditingCell(null);
                                          fetch(
                                            `/api/toplanti-tutanaklari/${meetingId}/kalemler`,
                                            {
                                              method: "PUT",
                                              headers: {
                                                "Content-Type": "application/json",
                                              },
                                              body: JSON.stringify({
                                                itemId: item.id,
                                                values: { [col.id]: v },
                                              }),
                                            }
                                          ).then(() => fetchMeeting());
                                        }}
                                      >
                                        <SelectTrigger className="h-8 text-xs">
                                          <SelectValue placeholder="Seçin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {(() => {
                                            try {
                                              const opts = JSON.parse(col.options || "[]");
                                              return (Array.isArray(opts) ? opts : []).map(
                                                (opt: string) => (
                                                  <SelectItem key={opt} value={opt}>
                                                    {opt}
                                                  </SelectItem>
                                                )
                                              );
                                            } catch {
                                              return null;
                                            }
                                          })()}
                                        </SelectContent>
                                      </Select>
                                    ) : col.type === "date" ? (
                                      <Input
                                        ref={inputRef}
                                        type="date"
                                        value={editingValue}
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        onBlur={saveCell}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") saveCell();
                                          if (e.key === "Escape") cancelEdit();
                                        }}
                                        className="h-8 text-xs"
                                      />
                                    ) : col.type === "checkbox" ? (
                                      <input
                                        type="checkbox"
                                        checked={editingValue === "true"}
                                        onChange={(e) => {
                                          const val = e.target.checked ? "true" : "false";
                                          setEditingValue(val);
                                          setEditingCell(null);
                                          fetch(
                                            `/api/toplanti-tutanaklari/${meetingId}/kalemler`,
                                            {
                                              method: "PUT",
                                              headers: {
                                                "Content-Type": "application/json",
                                              },
                                              body: JSON.stringify({
                                                itemId: item.id,
                                                values: { [col.id]: val },
                                              }),
                                            }
                                          ).then(() => fetchMeeting());
                                        }}
                                        className="h-4 w-4"
                                      />
                                    ) : (
                                      <Input
                                        ref={inputRef}
                                        value={editingValue}
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        onBlur={saveCell}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") saveCell();
                                          if (e.key === "Escape") cancelEdit();
                                        }}
                                        className="h-8 text-xs"
                                      />
                                    )}
                                  </div>
                                ) : (
                                  <div
                                    className="min-h-[32px] flex items-center cursor-text rounded px-1 hover:bg-muted/40 transition-colors"
                                    onClick={() => startEdit(item.id, col.id, cellVal)}
                                  >
                                    {col.type === "checkbox" ? (
                                      <input
                                        type="checkbox"
                                        checked={cellVal === "true"}
                                        readOnly
                                        className="h-4 w-4 pointer-events-none"
                                      />
                                    ) : col.type === "date" && cellVal ? (
                                      <span className="text-xs">
                                        {new Date(cellVal).toLocaleDateString("tr-TR")}
                                      </span>
                                    ) : col.type === "select" && cellVal ? (
                                      <Badge variant="outline" className="text-xs">
                                        {cellVal}
                                      </Badge>
                                    ) : (
                                      <span
                                        className={`text-xs ${
                                          item.isCompleted ? "line-through" : ""
                                        } ${!cellVal ? "text-muted-foreground italic" : ""}`}
                                      >
                                        {cellVal || "Düzenlemek için tıklayın"}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>
                            );
                          })}

                          {/* Comments */}
                          <td className="px-3 py-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setCommentOpen(
                                  commentOpen === item.id ? null : item.id
                                )
                              }
                              className="h-7 px-2 text-xs"
                            >
                              <MessageSquare className="h-3.5 w-3.5 mr-1" />
                              {item.comments.length > 0 && (
                                <span className="bg-primary text-primary-foreground rounded-full text-[10px] px-1.5 py-0.5">
                                  {item.comments.length}
                                </span>
                              )}
                            </Button>
                          </td>

                          {/* Delete */}
                          <td className="px-3 py-2 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => deleteRow(item.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Expanded Comments Section */}
          {commentOpen && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Madde #{meeting.items.find((i) => i.id === commentOpen)?.rowNumber} - Yorumlar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {meeting.items
                  .find((i) => i.id === commentOpen)
                  ?.comments.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-start gap-3 bg-muted/50 rounded-lg p-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{c.author}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(c.createdAt).toLocaleString("tr-TR")}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{c.content}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive shrink-0"
                        onClick={() => deleteComment(c.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}

                {/* Add comment */}
                <div className="flex gap-2">
                  <Input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Yorum yazın..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && commentOpen) addComment(commentOpen);
                    }}
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    onClick={() => commentOpen && addComment(commentOpen)}
                    disabled={!commentText.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─────── Katılımcılar Tab ─────── */}
        <TabsContent value="katilimcilar">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Katılımcılar</CardTitle>
              <Button variant="outline" size="sm" onClick={openParticipants}>
                <Pencil className="mr-2 h-4 w-4" />
                Düzenle
              </Button>
            </CardHeader>
            <CardContent>
              {meeting.participants.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">
                  Katılımcı bulunmamaktadır
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {meeting.participants.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 bg-muted/50 rounded-lg p-3"
                    >
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${
                          p.isPresent ? "bg-green-500" : "bg-red-400"
                        }`}
                      />
                      <div>
                        <p className="font-medium text-sm">{p.name}</p>
                        {(p.company || p.role) && (
                          <p className="text-xs text-muted-foreground">
                            {[p.company, p.role].filter(Boolean).join(" • ")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─────── Notlar Tab ─────── */}
        {meeting.notes && (
          <TabsContent value="notlar">
            <Card>
              <CardHeader>
                <CardTitle>Toplantı Notları</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{meeting.notes}</p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* ─────── Edit Header Dialog ─────── */}
      <Dialog open={editHeader} onOpenChange={setEditHeader}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Toplantı Bilgilerini Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Proje</Label>
              <Select
                value={headerForm.projectId || "none"}
                onValueChange={(v) =>
                  setHeaderForm((f) => ({ ...f, projectId: v === "none" ? "" : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Proje seçin (opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Proje Atanmasın</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Başlık</Label>
              <Input
                value={headerForm.title}
                onChange={(e) =>
                  setHeaderForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tür</Label>
                <Select
                  value={headerForm.type}
                  onValueChange={(v) =>
                    setHeaderForm((f) => ({ ...f, type: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEETING_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Durum</Label>
                <Select
                  value={headerForm.status}
                  onValueChange={(v) =>
                    setHeaderForm((f) => ({ ...f, status: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEETING_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tarih</Label>
                <Input
                  type="date"
                  value={headerForm.date}
                  onChange={(e) =>
                    setHeaderForm((f) => ({ ...f, date: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Başlangıç</Label>
                <Input
                  type="time"
                  value={headerForm.startTime}
                  onChange={(e) =>
                    setHeaderForm((f) => ({ ...f, startTime: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Bitiş</Label>
                <Input
                  type="time"
                  value={headerForm.endTime}
                  onChange={(e) =>
                    setHeaderForm((f) => ({ ...f, endTime: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Yer</Label>
              <Input
                value={headerForm.location}
                onChange={(e) =>
                  setHeaderForm((f) => ({ ...f, location: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Notlar</Label>
              <Textarea
                value={headerForm.notes}
                onChange={(e) =>
                  setHeaderForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditHeader(false)}>
              İptal
            </Button>
            <Button onClick={saveHeader} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────── Add Column Dialog ─────── */}
      <Dialog open={addColumnOpen} onOpenChange={setAddColumnOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Sütun Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sütun Adı *</Label>
              <Input
                value={newColumn.name}
                onChange={(e) =>
                  setNewColumn((c) => ({ ...c, name: e.target.value }))
                }
                placeholder="Örn: Notlar, Termin, Öncelik"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tür</Label>
                <Select
                  value={newColumn.type}
                  onValueChange={(v) =>
                    setNewColumn((c) => ({ ...c, type: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLUMN_TYPES.map((ct) => (
                      <SelectItem key={ct.value} value={ct.value}>
                        {ct.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Genişlik (px)</Label>
                <Input
                  type="number"
                  value={newColumn.width}
                  onChange={(e) =>
                    setNewColumn((c) => ({ ...c, width: parseInt(e.target.value) || 200 }))
                  }
                />
              </div>
            </div>
            {newColumn.type === "select" && (
              <div className="space-y-2">
                <Label>Seçenekler (virgülle ayırın)</Label>
                <Input
                  value={newColumn.options}
                  onChange={(e) =>
                    setNewColumn((c) => ({ ...c, options: e.target.value }))
                  }
                  placeholder="Yüksek, Orta, Düşük"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddColumnOpen(false)}>
              İptal
            </Button>
            <Button onClick={addColumn}>
              <Plus className="mr-2 h-4 w-4" />
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────── Participants Dialog ─────── */}
      <Dialog open={participantsOpen} onOpenChange={setParticipantsOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Katılımcıları Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {editParticipants.map((p, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  placeholder="Ad Soyad"
                  value={p.name}
                  onChange={(e) =>
                    setEditParticipants((prev) =>
                      prev.map((pp, idx) =>
                        idx === i ? { ...pp, name: e.target.value } : pp
                      )
                    )
                  }
                  className="flex-1"
                />
                <Input
                  placeholder="Firma"
                  value={p.company}
                  onChange={(e) =>
                    setEditParticipants((prev) =>
                      prev.map((pp, idx) =>
                        idx === i ? { ...pp, company: e.target.value } : pp
                      )
                    )
                  }
                  className="w-28"
                />
                <Input
                  placeholder="Görev"
                  value={p.role}
                  onChange={(e) =>
                    setEditParticipants((prev) =>
                      prev.map((pp, idx) =>
                        idx === i ? { ...pp, role: e.target.value } : pp
                      )
                    )
                  }
                  className="w-24"
                />
                <label className="flex items-center gap-1 text-xs shrink-0">
                  <input
                    type="checkbox"
                    checked={p.isPresent}
                    onChange={(e) =>
                      setEditParticipants((prev) =>
                        prev.map((pp, idx) =>
                          idx === i ? { ...pp, isPresent: e.target.checked } : pp
                        )
                      )
                    }
                  />
                  Katıldı
                </label>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setEditParticipants((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  className="text-destructive shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setEditParticipants((prev) => [
                  ...prev,
                  { name: "", company: "", role: "", isPresent: true },
                ])
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Katılımcı Ekle
            </Button>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setParticipantsOpen(false)}
            >
              İptal
            </Button>
            <Button onClick={saveParticipants}>
              <Save className="mr-2 h-4 w-4" />
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
