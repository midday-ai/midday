import { ContentLayout } from "@/components/panel/content-layout";
import { VaultActivity } from "@/components/vault-activity";
import { Loading } from "@/components/vault-activity.loading";
import { type ReactNode, Suspense } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <ContentLayout title="Vault">
      <div>
        <Suspense fallback={<Loading />}>
          <VaultActivity />
        </Suspense>

        {children}
      </div>
    </ContentLayout>
  );
}
