"use client";

import { useEffect, useState, useCallback, useRef, DragEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  GitBranch,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Pencil,
  GripVertical,
  UserCircle,
  Mail,
  Phone,
  ArrowUp,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";

/* ─────── Tipler ─────── */
interface OrgEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  managerId: string | null;
  departmentId: string | null;
  positionId: string | null;
  department: { id: string; name: string } | null;
  position: { id: string; name: string } | null;
  company: { id: string; name: string } | null;
}

interface DeptSummary {
  id: string;
  name: string;
  _count: { employees: number; positions: number };
}

interface TreeNode extends OrgEmployee {
  children: TreeNode[];
}

/* ─────── Yardımcılar ─────── */
function buildTree(employees: OrgEmployee[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  employees.forEach((e) => map.set(e.id, { ...e, children: [] }));

  const roots: TreeNode[] = [];
  map.forEach((node) => {
    if (node.managerId && map.has(node.managerId)) {
      map.get(node.managerId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

/** employeeId'nin alt dallarında targetId var mı? (döngü koruması) */
function isDescendant(employeeId: string, targetId: string, employees: OrgEmployee[]): boolean {
  const children = employees.filter((e) => e.managerId === employeeId);
  for (const child of children) {
    if (child.id === targetId) return true;
    if (isDescendant(child.id, targetId, employees)) return true;
  }
  return false;
}

const treeAccents = [
  { gradient: "from-blue-500 to-blue-600", bg: "bg-blue-500", ring: "ring-blue-200", dot: "bg-blue-500" },
  { gradient: "from-emerald-500 to-emerald-600", bg: "bg-emerald-500", ring: "ring-emerald-200", dot: "bg-emerald-500" },
  { gradient: "from-violet-500 to-violet-600", bg: "bg-violet-500", ring: "ring-violet-200", dot: "bg-violet-500" },
  { gradient: "from-amber-500 to-amber-600", bg: "bg-amber-500", ring: "ring-amber-200", dot: "bg-amber-500" },
  { gradient: "from-rose-500 to-rose-600", bg: "bg-rose-500", ring: "ring-rose-200", dot: "bg-rose-500" },
  { gradient: "from-cyan-500 to-cyan-600", bg: "bg-cyan-500", ring: "ring-cyan-200", dot: "bg-cyan-500" },
  { gradient: "from-indigo-500 to-indigo-600", bg: "bg-indigo-500", ring: "ring-indigo-200", dot: "bg-indigo-500" },
  { gradient: "from-teal-500 to-teal-600", bg: "bg-teal-500", ring: "ring-teal-200", dot: "bg-teal-500" },
  { gradient: "from-orange-500 to-orange-600", bg: "bg-orange-500", ring: "ring-orange-200", dot: "bg-orange-500" },
  { gradient: "from-pink-500 to-pink-600", bg: "bg-pink-500", ring: "ring-pink-200", dot: "bg-pink-500" },
];

/* ─────── Ağaç Düğümü — Sürükle-Bırak Destekli ─────── */
function DraggableTreeNode({
  node,
  accentMap,
  level,
  editMode,
  dragId,
  dropTargetId,
  allEmployees,
  onSelect,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onSetRoot,
  onManagerChange,
}: {
  node: TreeNode;
  accentMap: Map<string, { gradient: string; bg: string; ring: string; dot: string }>;
  level: number;
  editMode: boolean;
  dragId: string | null;
  dropTargetId: string | null;
  allEmployees: OrgEmployee[];
  onSelect: (e: OrgEmployee) => void;
  onDragStart: (id: string) => void;
  onDragOver: (e: DragEvent, id: string) => void;
  onDrop: (e: DragEvent, targetId: string) => void;
  onDragEnd: () => void;
  onSetRoot: (id: string) => void;
  onManagerChange: (employeeId: string, managerId: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(level < 2);
  const hasChildren = node.children.length > 0;
  const initials = `${(node.firstName || "?")[0]}${(node.lastName || "?")[0]}`.toUpperCase();
  const accent = accentMap.get(node.departmentId || "") || {
    gradient: "from-gray-400 to-gray-500",
    bg: "bg-gray-400",
    ring: "ring-gray-200",
    dot: "bg-gray-400",
  };

  const isDragging = dragId === node.id;
  const isDropTarget = dropTargetId === node.id && dragId !== node.id;

  return (
    <li>
      <div className="relative pb-2">
        {/* Kart */}
        <div
          draggable={editMode}
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", node.id);
            onDragStart(node.id);
          }}
          onDragOver={(e) => {
            if (editMode && dragId && dragId !== node.id) {
              onDragOver(e, node.id);
            }
          }}
          onDrop={(e) => {
            if (editMode) onDrop(e, node.id);
          }}
          onDragEnd={onDragEnd}
          className={`relative bg-white dark:bg-slate-900 rounded-xl shadow-md transition-all duration-200 overflow-hidden w-52 border-2 group
            ${isDropTarget ? "border-violet-500 shadow-violet-200 dark:shadow-violet-900 shadow-lg scale-105" : "border-slate-200/60 dark:border-slate-700/60"}
            ${isDragging ? "opacity-40 scale-95" : "hover:shadow-xl"}
            ${editMode ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}
          `}
          onClick={() => !editMode && onSelect(node)}
        >
          {/* Üst renk çizgisi */}
          <div className={`h-1.5 bg-gradient-to-r ${accent.gradient}`} />

          <div className="p-3 text-center relative">
            {/* Sürükleme tutacağı (edit modda) */}
            {editMode && (
              <div className="absolute top-1 left-1 text-slate-300 dark:text-slate-600">
                <GripVertical className="h-4 w-4" />
              </div>
            )}

            {/* Avatar */}
            <div
              className={`w-12 h-12 rounded-full ${accent.bg} text-white font-semibold text-sm flex items-center justify-center mx-auto mb-2 ring-3 ${accent.ring} shadow-sm ${!editMode ? "group-hover:scale-110" : ""} transition-transform duration-200`}
            >
              {initials}
            </div>

            <p className="font-semibold text-sm truncate leading-tight">
              {node.firstName} {node.lastName}
            </p>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {node.position?.name || "Pozisyon yok"}
            </p>
            {node.department && (
              <span className="inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 truncate max-w-full">
                {node.department.name}
              </span>
            )}

            {/* Edit modda yönetici selectbox + kök yap */}
            {editMode && (
              <div className="mt-2 space-y-1">
                <select
                  className="w-full text-[10px] rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-1 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-violet-400"
                  value={node.managerId || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    onManagerChange(node.id, val || null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="">— Yönetici Yok (Kök) —</option>
                  {allEmployees
                    .filter((emp) => emp.id !== node.id && !isDescendant(node.id, emp.id, allEmployees))
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} {emp.position?.name ? `(${emp.position.name})` : ""}
                      </option>
                    ))}
                </select>
                {node.managerId && (
                  <button
                    className="text-[10px] text-violet-600 hover:text-violet-800 flex items-center gap-0.5 mx-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetRoot(node.id);
                    }}
                  >
                    <ArrowUp className="h-3 w-3" /> Kök Yap
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Genişlet/Daralt butonu */}
        {hasChildren && (
          <button
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-10 min-w-6 h-6 px-1.5 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 shadow-sm flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:border-violet-400 hover:text-violet-600 dark:hover:border-violet-400 dark:hover:text-violet-400 transition-all cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? "−" : `+${node.children.length}`}
          </button>
        )}
      </div>

      {/* Alt dallar */}
      {hasChildren && expanded && (
        <ul>
          {node.children.map((child) => (
            <DraggableTreeNode
              key={child.id}
              node={child}
              accentMap={accentMap}
              level={level + 1}
              editMode={editMode}
              dragId={dragId}
              dropTargetId={dropTargetId}
              allEmployees={allEmployees}
              onSelect={onSelect}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
              onSetRoot={onSetRoot}
              onManagerChange={onManagerChange}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/* ─────── Zincir Görünümü (Dialog) ─────── */
function ChainView({ employee, allEmployees }: { employee: OrgEmployee; allEmployees: OrgEmployee[] }) {
  const chain: OrgEmployee[] = [];
  let current: OrgEmployee | undefined = employee;
  const visited = new Set<string>();
  while (current) {
    if (visited.has(current.id)) break;
    visited.add(current.id);
    chain.unshift(current);
    current = current.managerId ? allEmployees.find((e) => e.id === current!.managerId) : undefined;
  }

  const directReports = allEmployees.filter((e) => e.managerId === employee.id);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Yönetim Zinciri (Yukarı)</p>
        <div className="space-y-1">
          {chain.map((e, i) => (
            <div key={e.id} className="flex items-center gap-2" style={{ paddingLeft: `${i * 16}px` }}>
              {i > 0 && <span className="text-muted-foreground text-xs">↳</span>}
              <span className={`text-sm ${e.id === employee.id ? "font-bold text-primary" : ""}`}>
                {e.firstName} {e.lastName}
              </span>
              <span className="text-xs text-muted-foreground">— {e.position?.name || "?"}</span>
            </div>
          ))}
        </div>
      </div>
      {directReports.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            Doğrudan Bağlı Çalışanlar ({directReports.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {directReports.map((r) => (
              <div key={r.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                <UserCircle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{r.firstName} {r.lastName}</p>
                  <p className="text-xs text-muted-foreground">{r.position?.name || "?"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────── Ana Sayfa ─────── */
export default function AgacGorunumuPage() {
  const [employees, setEmployees] = useState<OrgEmployee[]>([]);
  const [departments, setDepartments] = useState<DeptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState(0.8);
  const [selected, setSelected] = useState<OrgEmployee | null>(null);
  const [deptFilter, setDeptFilter] = useState("");

  // Drag state
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  // Kök'e bırakma alanı
  const rootDropRef = useRef<HTMLDivElement>(null);
  const [rootDropHighlight, setRootDropHighlight] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (deptFilter && deptFilter !== "all") params.set("departmentId", deptFilter);
    const res = await fetch(`/api/organizasyon/agac?${params}`);
    const data = await res.json();
    setEmployees(data.employees || []);
    setDepartments(data.departments || []);
    setLoading(false);
  }, [deptFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tree = buildTree(employees);

  // Accent haritası
  const accentMap = new Map<string, { gradient: string; bg: string; ring: string; dot: string }>();
  departments.forEach((d, i) => accentMap.set(d.id, treeAccents[i % treeAccents.length]));

  const totalEmp = departments.reduce((s, d) => s + d._count.employees, 0);

  /* ─── API: Yönetici güncelle ─── */
  const updateManager = useCallback(
    async (employeeId: string, managerId: string | null) => {
      setSaving(true);
      try {
        const res = await fetch("/api/organizasyon/agac", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId, managerId }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Güncelleme başarısız");
          return;
        }

        // Lokal state güncelle (yeniden fetch yerine)
        setEmployees((prev) =>
          prev.map((e) => (e.id === employeeId ? { ...e, managerId } : e))
        );

        const emp = employees.find((e) => e.id === employeeId);
        const mgr = managerId ? employees.find((e) => e.id === managerId) : null;
        if (emp) {
          toast.success(
            managerId && mgr
              ? `${emp.firstName} ${emp.lastName} → ${mgr.firstName} ${mgr.lastName} altına taşındı`
              : `${emp.firstName} ${emp.lastName} kök düğüm yapıldı`
          );
        }
      } catch {
        toast.error("Bir hata oluştu");
      } finally {
        setSaving(false);
      }
    },
    [employees]
  );

  /* ─── Drag handlers ─── */
  const handleDragStart = (id: string) => setDragId(id);

  const handleDragOver = (e: DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTargetId(targetId);
  };

  const handleDrop = async (e: DragEvent, targetId: string) => {
    e.preventDefault();
    setDropTargetId(null);
    const sourceId = dragId || e.dataTransfer.getData("text/plain");
    if (!sourceId || sourceId === targetId) return;

    // Döngü kontrolü (client side)
    if (isDescendant(sourceId, targetId, employees)) {
      toast.error("Bu kişi hedefin alt dalında — döngüsel bağlantı oluşur");
      return;
    }

    await updateManager(sourceId, targetId);
    setDragId(null);
  };

  const handleDragEnd = () => {
    setDragId(null);
    setDropTargetId(null);
    setRootDropHighlight(false);
  };

  const handleSetRoot = (id: string) => updateManager(id, null);

  const handleManagerChange = (employeeId: string, managerId: string | null) => {
    updateManager(employeeId, managerId);
  };

  /* ─── Kök'e bırakma ─── */
  const handleRootDragOver = (e: DragEvent) => {
    if (editMode && dragId) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setRootDropHighlight(true);
    }
  };

  const handleRootDrop = async (e: DragEvent) => {
    e.preventDefault();
    setRootDropHighlight(false);
    const sourceId = dragId || e.dataTransfer.getData("text/plain");
    if (!sourceId) return;
    await updateManager(sourceId, null);
    setDragId(null);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-violet-600" />
            Ağaç Görünümü
          </h1>
          <p className="text-muted-foreground">
            {totalEmp} personel · {departments.length} departman
            {editMode && <span className="text-violet-600 font-medium ml-2">— Düzenleme Modu</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tüm Departmanlar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Departmanlar</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name} ({d._count.employees})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={editMode ? "default" : "outline"}
            size="sm"
            onClick={() => setEditMode(!editMode)}
            className={editMode ? "bg-violet-600 hover:bg-violet-700" : ""}
          >
            {editMode ? <Check className="h-4 w-4 mr-1" /> : <Pencil className="h-4 w-4 mr-1" />}
            {editMode ? "Tamamla" : "Düzenle"}
          </Button>
        </div>
      </div>

      {/* Düzenleme modu bilgi kartı */}
      {editMode && (
        <Card className="border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center flex-shrink-0 mt-0.5">
              <GripVertical className="h-4 w-4 text-violet-600" />
            </div>
            <div className="text-sm space-y-1">
              <p className="font-medium text-violet-900 dark:text-violet-100">Sürükle & Bırak ile Yönetici Atama</p>
              <p className="text-violet-700 dark:text-violet-300">
                Bir kartı tutup başka bir kartın üzerine bırakarak yönetici ataması yapabilirsiniz.
                Veya her karttaki dropdown menüden yönetici seçebilirsiniz.
                Kişiyi kök yapmak için &quot;boş alana&quot; bırakın veya &quot;Kök Yap&quot; butonuna tıklayın.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto flex-shrink-0 text-violet-600"
              onClick={() => setEditMode(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Ağaç */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <GitBranch className="h-5 w-5" />
              Organizasyon Ağacı
              {saving && <span className="text-xs text-muted-foreground animate-pulse ml-2">Kaydediliyor...</span>}
            </CardTitle>
            {/* Zoom kontrolleri */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg border shadow-sm p-1">
              <button
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-30 cursor-pointer"
                onClick={() => setZoom((z) => Math.max(0.3, +(z - 0.1).toFixed(1)))}
                disabled={zoom <= 0.3}
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-xs font-mono w-10 text-center select-none">
                {Math.round(zoom * 100)}%
              </span>
              <button
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-30 cursor-pointer"
                onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(1)))}
                disabled={zoom >= 1.5}
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
              <button
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                onClick={() => setZoom(0.8)}
                title="Sıfırla"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-4">
          {loading ? (
            <div className="text-center py-16 text-muted-foreground">Yükleniyor...</div>
          ) : tree.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              Personel bulunamadı. Önce İK → Personel bölümünden çalışan ekleyin.
            </div>
          ) : (
            <>
              {/* Kök'e bırakma alanı (edit modda) */}
              {editMode && (
                <div
                  ref={rootDropRef}
                  onDragOver={handleRootDragOver}
                  onDragLeave={() => setRootDropHighlight(false)}
                  onDrop={handleRootDrop}
                  className={`mb-4 border-2 border-dashed rounded-xl py-3 px-4 text-center text-sm transition-all
                    ${rootDropHighlight
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300"
                      : "border-slate-300 dark:border-slate-600 text-muted-foreground"
                    }`}
                >
                  <ArrowUp className="h-4 w-4 inline mr-1" />
                  Buraya bırakarak kök düğüm yapın (yöneticisi olmayan en üst kişi)
                </div>
              )}

              <div className="overflow-x-auto overflow-y-auto max-h-[72vh] pb-8">
                <div
                  className="org-tree-chart inline-flex justify-center min-w-full"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "top center",
                    transition: "transform 0.2s ease",
                  }}
                >
                  <ul>
                    {tree.map((node) => (
                      <DraggableTreeNode
                        key={node.id}
                        node={node}
                        accentMap={accentMap}
                        level={0}
                        editMode={editMode}
                        dragId={dragId}
                        dropTargetId={dropTargetId}
                        allEmployees={employees}
                        onSelect={setSelected}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onDragEnd={handleDragEnd}
                        onSetRoot={handleSetRoot}
                        onManagerChange={handleManagerChange}
                      />
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Kişi Detay Dialogu */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle className="h-6 w-6" />
              {selected?.firstName} {selected?.lastName}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Departman</p>
                  <p className="font-medium">{selected.department?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pozisyon</p>
                  <p className="font-medium">{selected.position?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Şirket</p>
                  <p className="font-medium">{selected.company?.name || "-"}</p>
                </div>
              </div>
              <div className="flex gap-3">
                {selected.email && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${selected.email}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      {selected.email}
                    </a>
                  </Button>
                )}
                {selected.phone && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${selected.phone}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      {selected.phone}
                    </a>
                  </Button>
                )}
              </div>
              <ChainView employee={selected} allEmployees={employees} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
