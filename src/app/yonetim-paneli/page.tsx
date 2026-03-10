import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import YonetimPaneliClient from "./yonetim-paneli-client";

export default async function YonetimPaneliPage() {
  const session = await auth();
  if (!session) redirect("/giris");

  const dateStr = new Date().toLocaleDateString("tr-TR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <YonetimPaneliClient
      userName={session.user?.name ?? "Kullanıcı"}
      userEmail={session.user?.email ?? ""}
      dateStr={dateStr}
    />
  );
}
