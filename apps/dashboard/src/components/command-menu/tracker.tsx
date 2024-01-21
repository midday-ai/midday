import { BackButton } from "@/components/command-menu/back-button";
import { useCommandStore } from "@/store/command";
import { useTrackerStore } from "@/store/tracker";
import { Button } from "@midday/ui/button";
import { CommandGroup, CommandItem, CommandList } from "@midday/ui/command";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { cn } from "@midday/ui/utils";

const projects = [
  {
    id: "1",
    name: "Project X",
    time: 85,
  },
  {
    id: "2",
    name: "Project Y",
    time: 85,
  },
  {
    id: "3",
    name: "Project K",
    time: 85,
  },
  {
    id: "4",
    name: "Project G",
    time: 85,
  },
];

export function CommandTracker() {
  const { setTracking } = useTrackerStore();
  const { setOpen } = useCommandStore();

  return (
    <div className="h-full">
      <div className="p-5 flex items-center space-x-3">
        <BackButton />
        <h2>Time Tracker</h2>
      </div>
      <CommandList>
        <CommandGroup>
          {projects.map((project) => (
            <CommandItem
              key={project.id}
              className="my-1 w-full"
              onSelect={() => {
                setTracking();
                setOpen();
              }}
            >
              <div className="flex space-x-2 justify-between w-full">
                <span>{project.name}</span>
                <div className="flex space-x-3">
                  <span>10:19:21</span>
                  <button
                    type="button"
                    className={cn(
                      "w-[20px] h-[20px]"
                      // project.id !== "1" && "opacity-30"
                    )}
                  >
                    {/* {project.id === "1" ? (
                      <Icons.PauseCircle />
                    ) : (
                      <Icons.PlayCircle />
                    )} */}

                    <Icons.PlayCircle />
                  </button>
                </div>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>

      <div className="flex fixed w-full bottom-14">
        <div className="ml-4 mr-4 w-full">
          <Input placeholder="Add new project" className="h-[40px]" />
          <Button className="h-[24px] absolute right-6 top-2">Add</Button>
        </div>
      </div>
    </div>
  );
}
