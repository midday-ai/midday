import { getTeamBankAccounts } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { Avatar, AvatarImage } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { cn } from "@midday/ui/utils";
import { differenceInDays, formatDistanceToNow } from "date-fns";
import Link from "next/link";

const WARNING_DAYS = 14;
const ERROR_DAYS = 7;

export function ReconnectBankButton({ className }) {
  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-full w-8 h-8 flex items-center"
    >
      <Icons.Refresh size={16} className={className} />
    </Button>
  );
}

export async function ReconnectBank() {
  const supabase = createClient();
  const { data } = await getTeamBankAccounts(supabase);

  const hasWarningStatus = data.some(
    (account) =>
      differenceInDays(new Date(account.expires_at), new Date()) <=
      WARNING_DAYS,
  );

  const hasErrorStatus = data.some(
    (account) =>
      differenceInDays(new Date(account.expires_at), new Date()) <= ERROR_DAYS,
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <ReconnectBankButton
          className={cn(
            hasWarningStatus && "text-[#FFD02B]",
            hasErrorStatus && "text-[#FF3638]",
          )}
        />
      </PopoverTrigger>
      <PopoverContent className="rounded-xl w-[350px] mr-7" sideOffset={10}>
        <div>
          {data?.map((account) => {
            const expiresInDays = differenceInDays(
              new Date(account.expires_at),
              new Date(),
            );

            return (
              <div
                className="flex justify-between pt-2 pb-2 items-center"
                key={account.id}
              >
                <div className="flex items-center">
                  <Avatar className="flex h-8 w-8 items-center justify-center space-y-0 border">
                    <AvatarImage src={account.logo_url} alt={account.name} />
                  </Avatar>
                  <div className="ml-4 flex flex-col">
                    <p className="text-xs font-medium leading-none">
                      {account.name}
                    </p>

                    <span
                      className={cn(
                        "text-xs text-[#606060]",
                        expiresInDays <= WARNING_DAYS && "text-[#FFD02B]",
                        expiresInDays <= ERROR_DAYS && "text-[#FF3638]",
                      )}
                    >
                      Expires in{" "}
                      {formatDistanceToNow(new Date(account.expires_at))}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Link href="todo">
                    <Button variant="outline" size="icon">
                      <Icons.Refresh size={16} />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
