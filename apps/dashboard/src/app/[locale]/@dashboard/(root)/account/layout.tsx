import { Header } from "@/components/header";
import { SecondaryMenu } from "@/components/secondary-menu";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[800px] mt-4">
      <SecondaryMenu
        items={[
          { path: "/account", label: "General" },
          { path: "/account/teams", label: "Teams" },
        ]}
      />

      <main className="mt-12">{children}</main>
    </div>
  );
}
