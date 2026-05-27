export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-full max-w-lg mx-auto bg-surface">
      {children}
    </div>
  );
}
