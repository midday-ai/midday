import { TabsList, TabsTrigger } from "@midday/ui/tabs";
import { parseAsString, useQueryStates } from "nuqs";
import { InboxOrdering } from "./inbox-ordering";
import { InboxSearch } from "./inbox-search";
import { InboxSettingsModal } from "./modals/inbox-settings-modal";

type Props = {
  forwardEmail: string;
  inboxId: string;
  inboxForwarding: boolean;
  handleOnPaginate?: (direction: "down" | "up") => void;
  onChange?: (value: string | null) => void;
  ascending: boolean;
};

export function InboxHeader({
  forwardEmail,
  inboxForwarding,
  inboxId,
  handleOnPaginate,
  onChange,
  ascending,
}: Props) {
  const [params, setParams] = useQueryStates({
    id: parseAsString,
    q: parseAsString.withDefault(""),
  });

  return (
    <div className="flex justify-center items-center space-x-4 mb-4">
      <TabsList>
        <TabsTrigger value="todo">Todo</TabsTrigger>
        <TabsTrigger value="done">Done</TabsTrigger>
      </TabsList>

      <InboxSearch
        onClear={() => setParams({ id: null, q: null }, { shallow: false })}
        onArrowDown={() => handleOnPaginate?.("down")}
        value={params.q}
        onChange={(value) => {
          setParams(
            { id: null, q: value },
            {
              shallow: false,
            }
          );
          onChange?.(value);
        }}
      />

      <div className="flex space-x-2">
        <InboxOrdering ascending={ascending} />
        <InboxSettingsModal
          forwardEmail={forwardEmail}
          inboxId={inboxId}
          inboxForwarding={inboxForwarding}
        />
      </div>
    </div>
  );
}
