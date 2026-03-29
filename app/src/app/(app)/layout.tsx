import { TabBar } from "@/components/layout/TabBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="page-content">{children}</main>
      <TabBar />
    </>
  );
}
