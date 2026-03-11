"use client";

import { useParams, redirect } from "next/navigation";

export default function KatlarRedirect() {
  const params = useParams();
  redirect(`/projeler/${params.id}/mahaller`);
}
