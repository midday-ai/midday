import { SecondaryMenu } from "@/components/secondary-menu";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[800px]">
      <SecondaryMenu
        items={[
          { path: "/account", label: "General" },
          { path: "/account/date-and-locale", label: "Date & Locale" },
          { path: "/account/security", label: "Security" },
          { path: "/account/assistant", label: "Assistant" },
          { path: "/account/teams", label: "Teams" },
          { path: "/account/support", label: "Support" },
        ]}
      />

      <main className="mt-8">{children}</main>
    </div>
  );
}
