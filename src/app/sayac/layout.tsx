import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SayacLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/giris");

  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
