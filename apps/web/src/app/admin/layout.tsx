import "./admin.css";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata = {
  title: { default: "Admin — Kron", template: "%s | Kron Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
