import { Header } from "@/components/header";
import { SecondaryMenu } from "@/components/secondary-menu";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[800px]">
      <SecondaryMenu
        items={[
          { path: "/settings", label: "General" },
          { path: "/settings/portal", label: "Portal" },
          { path: "/settings/billing", label: "Billing" },
          { path: "/settings/accounts", label: "Bank Connections" },
          { path: "/settings/members", label: "Members" },
          { path: "/settings/underwriting", label: "Underwriting" },
          { path: "/settings/notifications", label: "Notifications" },
          { path: "/settings/risk", label: "Risk Scoring" },
          { path: "/settings/collections", label: "Collections" },
          { path: "/settings/developer", label: "Developer" },
        ]}
      />

      <main className="mt-8">{children}</main>
    </div>
  );
}
