import { getUserDetails } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";

export async function ChangeAvatar() {
  const supabase = createClient();
  const { data: userData } = await getUserDetails(supabase);

  return (
    <Card>
      <div className="flex justify-between items-center pr-6">
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
          <CardDescription>
            This is your avatar. Click on the avatar to upload a custom one from
            your files.
          </CardDescription>
        </CardHeader>

        <Avatar className="rounded-full w-16 h-16">
          <AvatarImage src={userData.avatar_url} />
          <AvatarFallback>
            <span className="text-md">{userData.full_name?.charAt(0)}</span>
          </AvatarFallback>
        </Avatar>
      </div>
      <CardFooter>An avatar is optional but strongly recommended.</CardFooter>
    </Card>
  );
}
