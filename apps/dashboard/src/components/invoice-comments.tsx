"use client";

import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Textarea } from "@midday/ui/textarea";

const comments = [
  {
    id: "1",
    content:
      "Hi, I've sent the invoice for last month's services. Please let me know if everything looks good.",
    avatarUrl:
      "https://lh3.googleusercontent.com/a/ACg8ocLjCbXytBlvKPhIpNLGvaGkhdbtfumGo4tKpn72QUVT0hu4AVKB=s96-c",
    name: "John Doe",
    createdAt: new Date(),
    owner: "user",
  },
  {
    id: "2",
    content:
      "Thanks for sending the invoice. I noticed a discrepancy in the total amount. Could you verify the charges for the additional services?",
    avatarUrl: null,
    name: "Acme Inc",
    createdAt: new Date(),
    owner: "customer",
  },
  {
    id: "3",
    content:
      "Sure! The additional charge is for the extra support hours we provided on the 10th and 11th. Let me know if you need further details.",
    avatarUrl:
      "https://lh3.googleusercontent.com/a/ACg8ocLjCbXytBlvKPhIpNLGvaGkhdbtfumGo4tKpn72QUVT0hu4AVKB=s96-c",
    name: "John Doe",
    createdAt: new Date(),
    owner: "user",
  },
  {
    id: "4",
    content:
      "Got it! That makes sense now. Everything looks good—I'll process the payment by Friday.",
    avatarUrl: null,
    name: "Acme Inc",
    createdAt: new Date(),
    owner: "customer",
  },
  {
    id: "5",
    content: "Great, thanks for confirming!",
    avatarUrl:
      "https://lh3.googleusercontent.com/a/ACg8ocLjCbXytBlvKPhIpNLGvaGkhdbtfumGo4tKpn72QUVT0hu4AVKB=s96-c",
    name: "John Doe",
    createdAt: new Date(),
    owner: "user",
  },
];

export function InvoiceComments() {
  return (
    <div>
      <div className="flex flex-col space-y-8 mt-6">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className={cn("flex", {
              "justify-end": comment.owner === "user",
              "justify-start": comment.owner === "customer",
            })}
          >
            {comment.owner === "customer" && (
              <Avatar className="size-6 mr-2 mt-auto object-contain border border-border">
                <AvatarImageNext
                  src={comment.avatarUrl}
                  alt={comment.name ?? ""}
                  width={24}
                  height={24}
                />
                <AvatarFallback className="text-[10px] font-medium">
                  {comment.name[0]}
                </AvatarFallback>
              </Avatar>
            )}
            <div
              className={cn("max-w-[70%] py-3 px-6", {
                "rounded-tl-full rounded-tr-full rounded-bl-full ring-1 ring-inset ring-border text-primary":
                  comment.owner === "user",
                "bg-secondary rounded-tr-full rounded-tl-full rounded-br-full text-[#878787]":
                  comment.owner === "customer",
              })}
            >
              <p className="text-xs">{comment.content}</p>
            </div>

            {comment.owner === "user" && (
              <Avatar className="size-6 ml-2 mt-auto object-contain border border-border">
                <AvatarImageNext
                  src={comment.avatarUrl}
                  alt={comment.name ?? ""}
                  width={24}
                  height={24}
                />
                <AvatarFallback className="text-[10px] font-medium">
                  {comment.name[0]}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
      </div>

      <div className="absolute bottom-0 left-0 w-full">
        <Textarea
          placeholder="Add a comment"
          className="resize-none border-0 border-t border-border pt-3 h-12 min-h-12"
          autoFocus
        />

        <div className="hidden todesktop:flex md:flex px-3 h-[40px] w-full border-t-[1px] items-center bg-background backdrop-filter dark:border-[#2C2C2C] backdrop-blur-lg dark:bg-[#151515]/[99]">
          <div className="scale-50 opacity-50 -ml-2">
            <Icons.LogoSmall />
          </div>

          <div className="ml-auto flex space-x-4">
            <button
              className="flex space-x-2 items-center text-sm"
              type="button"
            >
              <kbd className="pointer-events-none size-6 select-none border bg-accent px-1.5 font-mono font-medium">
                <span>↵</span>
              </kbd>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
