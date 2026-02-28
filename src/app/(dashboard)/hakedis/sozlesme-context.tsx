"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { toast } from "sonner";

/* ─── TYPES ─── */
export interface SozlesmeContract {
  id: string;
  projectId: string;
  companyId: string | null;
  type: "ISVEREN" | "TASERON";
  name: string;
  currency: string;
  pricingModel: "AYRINTILI" | "TEKFIYAT";
  contractNo: string | null;
  contractDate: string | null;
  totalAmount: number;
  advanceRate: number;
  retentionRate: number;
  description: string | null;
  project: { id: string; name: string };
  company: { id: string; name: string } | null;
  _count?: { items: number };
  createdAt: string;
}

interface SozlesmeContextValue {
  contracts: SozlesmeContract[];
  selectedContractId: string;
  setSelectedContractId: (id: string) => void;
  selectedContract: SozlesmeContract | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const SozlesmeContext = createContext<SozlesmeContextValue | null>(null);

/* ─── HOOK ─── */
export function useSozlesme() {
  const ctx = useContext(SozlesmeContext);
  if (!ctx) throw new Error("useSozlesme must be used within SozlesmeProvider");
  return ctx;
}

/* ─── PROVIDER ─── */
export function SozlesmeProvider({ children }: { children: ReactNode }) {
  const [contracts, setContracts] = useState<SozlesmeContract[]>([]);
  const [selectedContractId, setSelectedContractId] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchContracts = useCallback(async () => {
    try {
      const res = await fetch("/api/hakedis/sozlesmeler");
      if (res.ok) {
        const data = await res.json();
        setContracts(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error("Sözleşmeler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const selectedContract =
    contracts.find((c) => c.id === selectedContractId) ?? null;

  return (
    <SozlesmeContext.Provider
      value={{
        contracts,
        selectedContractId,
        setSelectedContractId,
        selectedContract,
        loading,
        refetch: fetchContracts,
      }}
    >
      {children}
    </SozlesmeContext.Provider>
  );
}
