"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

/* ─── Firma Tipi Segment Filtresi ──────────────────────── */
const SEGMENTS = [
  { value: "all", label: "Tümü" },
  { value: "MAIN", label: "🏢 Ana Yüklenici" },
  { value: "SUBCONTRACTOR", label: "🛠️ Taşeron" },
] as const;

interface CompanyTypeSegmentProps {
  value: string;
  onChange: (value: string) => void;
}

export function CompanyTypeSegment({ value, onChange }: CompanyTypeSegmentProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border p-1 bg-muted/30">
      {SEGMENTS.map((seg) => (
        <Button
          key={seg.value}
          variant={value === seg.value ? "default" : "ghost"}
          size="sm"
          className={`text-xs ${value === seg.value ? "" : "text-muted-foreground"}`}
          onClick={() => onChange(seg.value)}
        >
          {seg.label}
        </Button>
      ))}
    </div>
  );
}

/* ─── Sayfalama Bileşeni ───────────────────────────────── */
interface PuantajPaginationProps {
  totalItems: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

export function PuantajPagination({
  totalItems,
  pageSize,
  currentPage,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100],
}: PuantajPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          Toplam <strong className="text-foreground">{totalItems}</strong> çalışan
        </span>
        <span>·</span>
        <span>Sayfa başına:</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => {
            onPageSizeChange(Number(v));
            onPageChange(1);
          }}
        >
          <SelectTrigger className="h-8 w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((s) => (
              <SelectItem key={s} value={String(s)}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => onPageChange(1)}>
          «
        </Button>
        <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm px-3">
          <strong>{currentPage}</strong> / {totalPages}
        </span>
        <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => onPageChange(totalPages)}>
          »
        </Button>
      </div>
    </div>
  );
}
