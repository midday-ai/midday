import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 ml-8 mr-8 mb-8">
        <Header />
        {children}
      </div>
    </div>
  );
}
