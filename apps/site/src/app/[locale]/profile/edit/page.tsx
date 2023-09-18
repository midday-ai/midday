import { EditProfileForm } from "@/components/EditProfileForm";
import { createTRPCContext } from "@/utils/server";

import { appRouter } from "@midday/api";

export default async function EditProfile() {
  const server = appRouter.createCaller(await createTRPCContext());

  const me = await server.user.me();

  return (
    <div className="flex h-full items-center justify-center">
      <EditProfileForm defaultValues={me} />
    </div>
  );
}
