import { BottomNav } from "@/components/layout/bottom-nav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-full max-w-lg mx-auto bg-surface">
      {/* Page content with bottom padding for nav */}
      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
