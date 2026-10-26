import { AdminShell } from "@/components/admin-shell";
import { PageTransition } from "@/components/motion";

export const metadata = { title: "پنل مدیریت", robots: { index: false, follow: false } };

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell>
      <PageTransition>{children}</PageTransition>
    </AdminShell>
  );
}
