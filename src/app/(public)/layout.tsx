import { Navigation } from "@/components/public/Navigation";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-16">{children}</main>
    </>
  );
}
