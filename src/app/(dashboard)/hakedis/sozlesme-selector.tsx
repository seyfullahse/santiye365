"use client";

import { useSozlesme } from "./sozlesme-context";
import { FileText, ChevronDown, Building2, Landmark, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function formatCurrency(val: number, currency: string = "TRY") {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(val);
}

export function SozlesmeSelector() {
  const {
    contracts,
    selectedContractId,
    setSelectedContractId,
    selectedContract,
    loading,
  } = useSozlesme();

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2 max-w-[280px]">
        <FileText className="h-3.5 w-3.5" />
        <span className="text-xs">Yükleniyor…</span>
      </Button>
    );
  }

  const isverenContracts = contracts.filter((c) => c.type === "ISVEREN");
  const taseronContracts = contracts.filter((c) => c.type === "TASERON");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 max-w-[320px] font-normal",
            !selectedContractId && "text-muted-foreground"
          )}
        >
          {selectedContract ? (
            <>
              {selectedContract.type === "ISVEREN" ? (
                <Landmark className="h-3.5 w-3.5 text-green-600 shrink-0" />
              ) : (
                <Building2 className="h-3.5 w-3.5 text-orange-600 shrink-0" />
              )}
              <span className="truncate text-xs">{selectedContract.name}</span>
              <Badge
                variant="secondary"
                className="text-[10px] px-1 py-0 shrink-0"
              >
                {selectedContract.type === "ISVEREN" ? "İşveren" : "Taşeron"}
              </Badge>
            </>
          ) : (
            <>
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs">Tüm Sözleşmeler</span>
            </>
          )}
          <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[340px]">
        {/* Tüm sözleşmeler seçeneği */}
        <DropdownMenuItem
          onClick={() => setSelectedContractId("")}
          className="gap-2"
        >
          <FileText className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Tüm Sözleşmeler</p>
            <p className="text-xs text-muted-foreground">
              Filtre olmadan tüm verileri göster
            </p>
          </div>
          {!selectedContractId && (
            <Check className="h-4 w-4 text-primary shrink-0" />
          )}
        </DropdownMenuItem>

        {/* İşveren Sözleşmeleri */}
        {isverenContracts.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-2 text-xs">
              <Landmark className="h-3.5 w-3.5 text-green-600" />
              İşveren Sözleşmeleri
            </DropdownMenuLabel>
            {isverenContracts.map((c) => (
              <DropdownMenuItem
                key={c.id}
                onClick={() => setSelectedContractId(c.id)}
                className="gap-2"
              >
                <Landmark className="h-4 w-4 text-green-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {c.name}
                    {c.contractNo ? ` (${c.contractNo})` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.project.name}
                    {c.company ? ` — ${c.company.name}` : ""} ·{" "}
                    {formatCurrency(c.totalAmount, c.currency)}
                  </p>
                </div>
                {selectedContractId === c.id && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
          </>
        )}

        {/* Taşeron Sözleşmeleri */}
        {taseronContracts.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-2 text-xs">
              <Building2 className="h-3.5 w-3.5 text-orange-600" />
              Taşeron Sözleşmeleri
            </DropdownMenuLabel>
            {taseronContracts.map((c) => (
              <DropdownMenuItem
                key={c.id}
                onClick={() => setSelectedContractId(c.id)}
                className="gap-2"
              >
                <Building2 className="h-4 w-4 text-orange-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {c.name}
                    {c.contractNo ? ` (${c.contractNo})` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.project.name}
                    {c.company ? ` — ${c.company.name}` : ""} ·{" "}
                    {formatCurrency(c.totalAmount, c.currency)}
                  </p>
                </div>
                {selectedContractId === c.id && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
          </>
        )}

        {contracts.length === 0 && (
          <DropdownMenuItem disabled>
            <span className="text-sm text-muted-foreground">
              Henüz sözleşme yok
            </span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
