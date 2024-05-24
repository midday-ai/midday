"use client";

import { assistantSettingsAction } from "@/actions/ai/assistant-settings-action";
import { updateTeamAction } from "@/actions/update-team-action";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { useOptimisticAction } from "next-safe-action/hooks";

type Props = {
  provider: "openai" | "mistralai";
};

export function AssistantProvider({ provider }: Props) {
  const { execute, optimisticData } = useOptimisticAction(
    assistantSettingsAction,
    provider,
    (_, { provider }) => {
      return provider;
    }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Provider</CardTitle>
        <CardDescription>
          Choose the provider you want to use. Depending on your location, we
          may select a provider for you. Mistral AI is primarily used in the EU,
          while OpenAI is typically used in the US.{" "}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Select
          value={optimisticData}
          onValueChange={(provider) => execute({ provider })}
        >
          <SelectTrigger className="w-[260px]">
            <SelectValue placeholder="Select a provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="openai">
                <div className="flex items-center space-x-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={17}
                    height={17}
                    fill="none"
                  >
                    <path
                      fill="currentColor"
                      d="M15.543 6.9a4.201 4.201 0 0 0-.36-3.45 4.26 4.26 0 0 0-4.575-2.04A4.222 4.222 0 0 0 7.438 0a4.267 4.267 0 0 0-4.055 2.942A4.216 4.216 0 0 0 .573 4.98a4.25 4.25 0 0 0 .525 4.98 4.186 4.186 0 0 0 .36 3.445 4.26 4.26 0 0 0 4.58 2.044 4.206 4.206 0 0 0 3.165 1.417 4.267 4.267 0 0 0 4.056-2.942 4.193 4.193 0 0 0 2.804-2.039 4.24 4.24 0 0 0-.52-4.98V6.9ZM14.23 4.004c.365.64.502 1.388.377 2.113-.023-.017-.07-.04-.098-.057l-3.358-1.942a.563.563 0 0 0-.554 0L6.66 6.392V4.724l3.25-1.88a3.16 3.16 0 0 1 4.319 1.16ZM6.66 7.471l1.657-.96 1.656.96v1.914l-1.656.96-1.657-.96V7.47Zm.771-6.369c.743 0 1.457.257 2.028.732-.023.011-.068.04-.103.057L6 3.827a.547.547 0 0 0-.274.48v4.546L4.279 8.02V4.261a3.163 3.163 0 0 1 3.16-3.164l-.007.005Zm-5.9 4.433a3.168 3.168 0 0 1 1.645-1.388v3.992c0 .2.103.377.274.48l3.93 2.268-1.45.84-3.245-1.874a3.163 3.163 0 0 1-1.154-4.318Zm.885 7.328a3.135 3.135 0 0 1-.377-2.113c.023.017.069.04.098.057l3.358 1.942a.564.564 0 0 0 .554 0l3.93-2.273v1.667l-3.25 1.874a3.168 3.168 0 0 1-4.318-1.154h.005Zm6.792 2.902a3.151 3.151 0 0 1-2.022-.731 2.11 2.11 0 0 0 .103-.058l3.358-1.936a.536.536 0 0 0 .274-.48V8.02l1.445.833v3.753A3.163 3.163 0 0 1 9.21 15.77v-.005Zm5.906-4.433a3.154 3.154 0 0 1-1.645 1.383V8.722c0-.2-.103-.383-.274-.48L9.26 5.97l1.445-.834 3.25 1.873a3.158 3.158 0 0 1 1.154 4.319l.006.005Z"
                    />
                  </svg>
                  <span>OpenAI</span>
                </div>
              </SelectItem>
              <SelectItem value="mistralai">
                <div className="flex items-center space-x-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={17}
                    height={16}
                    fill="none"
                  >
                    <path fill="#000" d="M15.246 0h-2.91v3.2h2.91V0Z" />
                    <path fill="#F7D046" d="M16.7 0h-2.909v3.2h2.91V0Z" />
                    <path
                      fill="#000"
                      d="M3.61 0H.7v3.2h2.91V0ZM3.61 3.2H.7v3.2h2.91V3.2ZM3.61 6.4H.7v3.2h2.91V6.4Z"
                    />
                    <path
                      fill="#000"
                      d="M3.61 9.6H.7v3.2h2.91V9.6ZM3.61 12.8H.7V16h2.91v-3.2Z"
                    />
                    <path fill="#F7D046" d="M5.064 0h-2.91v3.2h2.91V0Z" />
                    <path
                      fill="#F2A73B"
                      d="M16.7 3.2h-2.909v3.2h2.91V3.2ZM5.064 3.2h-2.91v3.2h2.91V3.2Z"
                    />
                    <path fill="#000" d="M12.337 3.2h-2.91v3.2h2.91V3.2Z" />
                    <path
                      fill="#F2A73B"
                      d="M13.791 3.2h-2.909v3.2h2.91V3.2ZM7.973 3.2H5.064v3.2h2.909V3.2Z"
                    />
                    <path
                      fill="#EE792F"
                      d="M10.882 6.4h-2.91v3.2h2.91V6.4ZM13.791 6.4h-2.909v3.2h2.91V6.4Z"
                    />
                    <path fill="#EE792F" d="M7.973 6.4H5.064v3.2h2.909V6.4Z" />
                    <path fill="#000" d="M9.427 9.6H6.518v3.2h2.91V9.6Z" />
                    <path fill="#EB5829" d="M10.882 9.6h-2.91v3.2h2.91V9.6Z" />
                    <path
                      fill="#EE792F"
                      d="M16.7 6.4h-2.909v3.2h2.91V6.4ZM5.064 6.4h-2.91v3.2h2.91V6.4Z"
                    />
                    <path fill="#000" d="M15.246 9.6h-2.91v3.2h2.91V9.6Z" />
                    <path fill="#EB5829" d="M16.7 9.6h-2.909v3.2h2.91V9.6Z" />
                    <path fill="#000" d="M15.246 12.8h-2.91V16h2.91v-3.2Z" />
                    <path fill="#EB5829" d="M5.064 9.6h-2.91v3.2h2.91V9.6Z" />
                    <path
                      fill="#EA3326"
                      d="M16.7 12.8h-2.909V16h2.91v-3.2ZM5.064 12.8h-2.91V16h2.91v-3.2Z"
                    />
                  </svg>
                  <span>Mistral AI</span>
                </div>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
