import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";

// import { Experimental } from "../experimental";

type Props = {
  isExpanded: boolean;
  toggleSidebar: () => void;
};

export function Header({ toggleSidebar, isExpanded }: Props) {
  return (
    <div className="flex items-center justify-between border-b-[1px] border-border px-4 py-3">
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          size="icon"
          className="z-50 size-8 p-0"
          onClick={toggleSidebar}
        >
          {isExpanded ? (
            <Icons.SidebarFilled width={18} />
          ) : (
            <Icons.Sidebar width={18} />
          )}
        </Button>

        <h2>Assistant</h2>
      </div>

      <div className="flex items-center space-x-2">
        {/* <Experimental className="border-border text-[#878787]" /> */}
      </div>
    </div>
  );
}
