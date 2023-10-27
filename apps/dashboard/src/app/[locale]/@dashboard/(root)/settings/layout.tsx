import { Header } from "@/components/header";
import { SecondaryMenu } from "@/components/secondary-menu";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[800px]">
      <SecondaryMenu
        items={[
          { path: "/settings", label: "Account" },
          { path: "/settings/team", label: "Team" },
        ]}
      />

      <main className="mt-8">{children}</main>
    </div>
  );
}
