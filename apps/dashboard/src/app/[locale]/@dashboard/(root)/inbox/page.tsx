import { Icons } from "@midday/ui/icons";

export default function Inbox() {
  return (
    <div className="h-[calc(100vh-300px)] flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Icons.WorkInProgress className="mb-4 w-[35px] h-[35px]" />
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">Work in progress</h2>
          <p className="text-[#606060] text-sm">
            Nunc sit amet lectus quis mi vehicula lacinia nec
            <br /> non purus. Aliquam id rutrum magna. Duis
            <br /> convallis orci odio, sit amet vehicula tortor
            <br /> tincidunt quis.
          </p>
        </div>
      </div>
    </div>
  );
}
