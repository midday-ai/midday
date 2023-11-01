import { Header } from "@/components/header";
import { SecondaryMenu } from "@/components/secondary-menu";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[800px]">
      <SecondaryMenu
        items={[
          { path: "/profile", label: "General" },
          { path: "/profile/teams", label: "Teams" },
        ]}
      />

      <main className="mt-8">{children}</main>
    </div>
  );
}
