"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

// Eski puantaj route -> firma-puantaj yonlendir
export default function ProjectPuantajRedirect() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  useEffect(() => {
    router.replace("/projeler/" + projectId + "/firma-puantaj");
  }, [projectId, router]);

  return null;
}
