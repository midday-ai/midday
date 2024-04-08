import { SecondaryMenu } from "@/components/secondary-menu";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[800px]">
      <SecondaryMenu
        items={[
          { path: "/account", label: "General" },
          { path: "/account/language", label: "Language & region" },
          { path: "/account/security", label: "Security" },
          { path: "/account/teams", label: "Teams" },
        ]}
      />

      <main className="mt-8">{children}</main>
    </div>
  );
}
