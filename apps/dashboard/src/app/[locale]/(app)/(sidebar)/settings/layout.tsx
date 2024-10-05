import { Header } from "@/components/header";
import { ContentLayout } from "@/components/panel/content-layout";
import { SecondaryMenu } from "@/components/secondary-menu";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ContentLayout title="Settings">
      <div className="max-w-[800px]">
        <SecondaryMenu
          items={[
            { path: "/settings", label: "General" },
            { path: "/settings/accounts", label: "Accounts" },
            { path: "/settings/members", label: "Members" },
            { path: "/settings/categories", label: "Categories" },
            { path: "/settings/notifications", label: "Notifications" },
          ]}
        />

        <main className="mt-8">{children}</main>
      </div>
    </ContentLayout>
  );
}
