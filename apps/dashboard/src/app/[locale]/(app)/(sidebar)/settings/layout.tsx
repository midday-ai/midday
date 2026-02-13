import { SecondaryMenu } from "@/components/secondary-menu";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[800px]">
      <SecondaryMenu
        items={[
          { path: "/settings", label: "General" },
          { path: "/settings/billing", label: "Billing" },
          { path: "/settings/accounts", label: "Bank Connections" },
          { path: "/settings/members", label: "Members" },
          { path: "/settings/notifications", label: "Notifications" },
          { path: "/settings/developer", label: "Developer" },
        ]}
      />

      <main className="mt-8">{children}</main>
    </div>
  );
}
