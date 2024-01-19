export function DesktopTrafficLight() {
  return (
    <div className="fixed top-[9px] left-[9px] flex space-x-[8px] hidden todesktop:flex">
      <div className="w-[11px] h-[11px] border rounded-full" />
      <div className="w-[11px] h-[11px] border rounded-full" />
      <div className="w-[11px] h-[11px] border rounded-full" />
    </div>
  );
}
