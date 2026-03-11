"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FolderKanban,
  Building2,
  CalendarDays,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

/* ─── Proje Context ─── */
interface ProjectInfo {
  id: string;
  name: string;
  client: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  _count: { zones: number; activities: number; risks: number };
}

const ProjectContext = createContext<ProjectInfo | null>(null);
export function useProject() {
  return useContext(ProjectContext);
}

const statusLabels: Record<string, string> = {
  ACTIVE: "Aktif",
  COMPLETED: "Tamamlandı",
  ON_HOLD: "Beklemede",
  CANCELLED: "İptal",
};
const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  COMPLETED: "secondary",
  ON_HOLD: "outline",
  CANCELLED: "destructive",
};

/* ─── Breadcrumb Map ─── */
const pageNames: Record<string, string> = {
  dashboard: "Gösterge Paneli",
  mahaller: "Mahaller",
  katlar: "Katlar",
  aktiviteler: "Aktiviteler",
  malzemeler: "Malzeme Takip",
  sirketler: "Şirketler",
  ekipler: "Ekipler",
  calisanlar: "Çalışanlar",
  personel: "Günlük Personel",
  puantaj: "Puantaj",
  onaylar: "Onaylar",
  riskler: "Riskler",
};

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const projectId = params.id as string;
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/projeler/${projectId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setProject(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  // Pathname'den aktif alt sayfa adını bul
  const segments = pathname.split("/");
  const lastSegment = segments[segments.length - 1];
  const currentPage = lastSegment !== projectId ? pageNames[lastSegment] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <FolderKanban className="h-12 w-12 text-muted-foreground/50" />
        <p className="text-lg text-muted-foreground">Proje bulunamadı</p>
        <Link
          href="/projeler"
          className="text-primary hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Projelere Dön
        </Link>
      </div>
    );
  }

  return (
    <ProjectContext value={project}>
      <div className="space-y-4">
        {/* Proje Başlık Barı */}
        <div className="border-b pb-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Link href="/projeler" className="hover:text-foreground transition-colors flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              Projeler
            </Link>
            <span>/</span>
            <Link href={`/projeler/${project.id}`} className="hover:text-foreground transition-colors">
              {project.name}
            </Link>
            {currentPage && (
              <>
                <span>/</span>
                <span className="text-foreground font-medium">{currentPage}</span>
              </>
            )}
          </div>

          {/* Proje Bilgileri */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FolderKanban className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{project.name}</h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  {project.client && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {project.client}
                    </span>
                  )}
                  {project.startDate && (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {new Date(project.startDate).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Badge variant={statusColors[project.status]} className="w-fit">
              {statusLabels[project.status] ?? project.status}
            </Badge>
          </div>
        </div>

        {/* Alt Sayfa İçeriği */}
        {children}
      </div>
    </ProjectContext>
  );
}
