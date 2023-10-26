import { useI18n } from "@/locales/client";
import { Icons } from "@midday/ui/icons";

export function CategoryIcon({ name, size = 18 }) {
  switch (name) {
    case "travel":
      return <Icons.FlightTakeoff className="text-[#ABDD1D]" size={size} />;
    case "office_supplies":
      return <Icons.Desk className="text-[#BB4647]" size={size} />;
    case "meals":
      return <Icons.FastFood className="text-[#1ADBDB]" size={size} />;
    case "software":
      return <Icons.Save className="text-[#0064D9]" size={size} />;
    case "rent":
      return <Icons.HomeWork className="text-[#A843CB]" size={size} />;
    case "income":
      return <Icons.Payments className="text-[#00D98B]" size={size} />;
    case "equipment":
      return <Icons.Devices className="text-[#E9BE26]" size={size} />;
    case "transfer":
      return <Icons.AccountBalance className="text-[#FF902B]" size={size} />;
    default:
      return null;
  }
}

export function Category({ name }) {
  const t = useI18n();

  return (
    <div className="flex space-x-2 items-center">
      <CategoryIcon name={name} />
      {name && <p>{t(`categories.${name}`)}</p>}
    </div>
  );
}
