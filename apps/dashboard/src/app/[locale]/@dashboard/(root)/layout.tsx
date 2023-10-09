import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex space-x-8">
      <Sidebar />

      <div className="flex-1">
        <Header />
        {children}
      </div>
    </div>
  );
}
