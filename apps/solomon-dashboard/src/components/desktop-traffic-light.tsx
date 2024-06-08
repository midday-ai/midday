import { DesktopUpdate } from "@/desktop/components/desktop-update";

export function DesktopTrafficLight() {
  return (
    <div className="fixed top-[9px] left-[9px] flex space-x-[8px] invisible todesktop:visible z-10">
      <div className="w-[11px] h-[11px] bg-border rounded-full" />
      <div className="w-[11px] h-[11px] bg-border rounded-full" />
      <div className="w-[11px] h-[11px] bg-border rounded-full" />
      <DesktopUpdate />
    </div>
  );
}
