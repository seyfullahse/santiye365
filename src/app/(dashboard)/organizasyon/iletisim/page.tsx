"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Mail, Phone, UserCircle, Users } from "lucide-react";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  employeeNo: string | null;
  department: { id: string; name: string } | null;
  position: { id: string; name: string } | null;
  company: { id: string; name: string } | null;
}

interface DeptOption { id: string; name: string }

export default function IletisimDiziniPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [departments, setDepartments] = useState<DeptOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (deptFilter) params.set("departmentId", deptFilter);
    const res = await fetch(`/api/organizasyon/iletisim?${params}`);
    const data = await res.json();
    setContacts(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [search, deptFilter]);

  useEffect(() => {
    fetch("/api/ik/departmanlar")
      .then((r) => r.json())
      .then((data) => setDepartments(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  // Group by department
  const grouped = new Map<string, Contact[]>();
  contacts.forEach((c) => {
    const key = c.department?.name || "Departman Belirtilmemiş";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(c);
  });

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">İletişim Dizini</h1>
        <p className="text-muted-foreground">{contacts.length} kişi listeleniyor</p>
      </div>

      {/* Filtreler */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ad, soyad, e-posta, telefon ile ara..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Departman" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Departmanlar</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Kişi Kartları */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Yükleniyor...</div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Kişi bulunamadı</div>
      ) : (
        Array.from(grouped.entries()).map(([dept, members]) => (
          <div key={dept}>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-muted-foreground">{dept}</h2>
              <span className="text-xs text-muted-foreground">({members.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
              {members.map((c) => (
                <Card key={c.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <UserCircle className="h-7 w-7 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">{c.firstName} {c.lastName}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.position?.name || "-"}</p>
                        {c.employeeNo && <p className="text-xs text-muted-foreground">#{c.employeeNo}</p>}
                      </div>
                    </div>
                    <div className="mt-3 space-y-1.5">
                      {c.email && (
                        <Button variant="ghost" size="sm" asChild className="w-full justify-start h-8 px-2 text-xs">
                          <a href={`mailto:${c.email}`}>
                            <Mail className="h-3.5 w-3.5 mr-2 text-blue-500" />
                            <span className="truncate">{c.email}</span>
                          </a>
                        </Button>
                      )}
                      {c.phone && (
                        <Button variant="ghost" size="sm" asChild className="w-full justify-start h-8 px-2 text-xs">
                          <a href={`tel:${c.phone}`}>
                            <Phone className="h-3.5 w-3.5 mr-2 text-green-500" />
                            <span className="truncate">{c.phone}</span>
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
