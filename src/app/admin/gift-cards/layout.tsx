import { AdminSectionGuard } from "@/components/admin/section-guard";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminSectionGuard permission="gift-cards">{children}</AdminSectionGuard>;
}
