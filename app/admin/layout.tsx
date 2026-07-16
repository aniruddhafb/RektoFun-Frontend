import type { Metadata } from "next";
import AdminAuthGate from "./AdminAuthGate";

export const metadata: Metadata = {
  title: "Admin panel",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminAuthGate>{children}</AdminAuthGate>;
}
