"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Building2, ChevronDown, ChevronRight, Mail, Phone, UserCircle } from "lucide-react";

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

// Color palette per department
const deptColors = [
  "bg-blue-100 border-blue-300 text-blue-800",
  "bg-green-100 border-green-300 text-green-800",
  "bg-purple-100 border-purple-300 text-purple-800",
  "bg-amber-100 border-amber-300 text-amber-800",
  "bg-rose-100 border-rose-300 text-rose-800",
  "bg-cyan-100 border-cyan-300 text-cyan-800",
  "bg-indigo-100 border-indigo-300 text-indigo-800",
  "bg-teal-100 border-teal-300 text-teal-800",
  "bg-orange-100 border-orange-300 text-orange-800",
  "bg-pink-100 border-pink-300 text-pink-800",
];



function OrgNode({
  node,
  level,
  deptColorMap,
  onSelect,
}: {
  node: TreeNode;
  level: number;
  deptColorMap: Map<string, string>;
  onSelect: (e: OrgEmployee) => void;
}) {
  const [expanded, setExpanded] = useState(level < 2);
  const color = deptColorMap.get(node.departmentId || "") || "bg-gray-100 border-gray-300 text-gray-800";
  const hasChildren = node.children.length > 0;

  return (
    <div className={level > 0 ? "ml-6 lg:ml-10 border-l-2 border-dashed border-muted pl-4" : ""}>
      <div
        className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 cursor-pointer transition-all hover:shadow-md ${color}`}
        onClick={() => onSelect(node)}
      >
        {hasChildren && (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="p-0.5 rounded hover:bg-black/10"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        )}
        <UserCircle className="h-8 w-8 opacity-60" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{node.firstName} {node.lastName}</p>
          <p className="text-xs opacity-75 truncate">{node.position?.name || "Pozisyon belirtilmemiş"}</p>
        </div>
        {node.department && (
          <Badge variant="outline" className="text-xs hidden sm:inline-flex">
            {node.department.name}
          </Badge>
        )}
        {hasChildren && (
          <span className="text-xs font-medium opacity-60">{node.children.length}</span>
        )}
      </div>
      {expanded && hasChildren && (
        <div className="mt-2 space-y-2">
          {node.children.map((child) => (
            <OrgNode key={child.id} node={child} level={level + 1} deptColorMap={deptColorMap} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChainView({ employee, allEmployees }: { employee: OrgEmployee; allEmployees: OrgEmployee[] }) {
  // Build upward chain
  const chain: OrgEmployee[] = [];
  let current: OrgEmployee | undefined = employee;
  const visited = new Set<string>();
  while (current) {
    if (visited.has(current.id)) break;
    visited.add(current.id);
    chain.unshift(current);
    current = current.managerId ? allEmployees.find((e) => e.id === current!.managerId) : undefined;
  }

  // Direct reports
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

export default function OrganizasyonPage() {
  const [employees, setEmployees] = useState<OrgEmployee[]>([]);
  const [departments, setDepartments] = useState<DeptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState("");
  const [selected, setSelected] = useState<OrgEmployee | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (deptFilter) params.set("departmentId", deptFilter);
    const res = await fetch(`/api/organizasyon/agac?${params}`);
    const data = await res.json();
    setEmployees(data.employees || []);
    setDepartments(data.departments || []);
    setLoading(false);
  }, [deptFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const tree = buildTree(employees);

  // Assign colors per department
  const deptColorMap = new Map<string, string>();
  departments.forEach((d, i) => deptColorMap.set(d.id, deptColors[i % deptColors.length]));



  const totalEmp = departments.reduce((s, d) => s + d._count.employees, 0);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Organizasyon Şeması</h1>
          <p className="text-muted-foreground">Toplam {totalEmp} aktif personel · {departments.length} departman</p>
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Tüm Departmanlar" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Departmanlar</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name} ({d._count.employees})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Departman İstatistikleri */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {departments.map((d, i) => (
          <Card key={d.id} className={`cursor-pointer transition-shadow hover:shadow-md ${deptFilter === d.id ? "ring-2 ring-primary" : ""}`}
            onClick={() => setDeptFilter(deptFilter === d.id ? "" : d.id)}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${deptColors[i % deptColors.length].split(" ")[0]}`}>
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground truncate">{d.name}</p>
                <p className="text-lg font-bold">{d._count.employees}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ağaç Görünümü */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Hiyerarşi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Yükleniyor...</div>
          ) : tree.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Personel bulunamadı. Önce İK → Personel bölümünden çalışan ekleyin.
            </div>
          ) : (
            <div className="space-y-3">
              {tree.map((node) => (
                <OrgNode key={node.id} node={node} level={0} deptColorMap={deptColorMap} onSelect={setSelected} />
              ))}
            </div>
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
                    <a href={`mailto:${selected.email}`}><Mail className="h-4 w-4 mr-2" />{selected.email}</a>
                  </Button>
                )}
                {selected.phone && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${selected.phone}`}><Phone className="h-4 w-4 mr-2" />{selected.phone}</a>
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
