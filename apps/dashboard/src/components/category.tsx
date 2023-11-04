import { useI18n } from "@/locales/client";
import { Icons } from "@midday/ui/icons";
import { cn } from "@midday/ui/utils";

export const mapCategoryColor = (name: string) => {
  switch (name) {
    case "travel":
      return "#ABDD1D";
    case "office_supplies":
      return "#BB4647";
    case "meals":
      return "#1ADBDB";
    case "software":
      return "#0064D9";
    case "rent":
      return "#A843CB";
    case "income":
      return "#00C969";
    case "equipment":
      return "#E9BE26";
    case "transfer":
      return "#FF902B";
    case "other":
      return "#F5F5F3";
    case "activity":
      return "#E5E926";
    case "uncategorized":
      return "#606060";
    default:
      return;
  }
};

export function CategoryIcon({ name, size = 18 }) {
  const color = mapCategoryColor(name);

  switch (name) {
    case "travel":
      return <Icons.FlightTakeoff style={{ color }} size={size} />;
    case "office_supplies":
      return <Icons.Desk style={{ color }} size={size} />;
    case "meals":
      return <Icons.FastFood style={{ color }} size={size} />;
    case "software":
      return <Icons.Save style={{ color }} size={size} />;
    case "rent":
      return <Icons.HomeWork style={{ color }} size={size} />;
    case "income":
      return <Icons.Payments style={{ color }} size={size} />;
    case "equipment":
      return <Icons.Devices style={{ color }} size={size} />;
    case "transfer":
      return <Icons.AccountBalance style={{ color }} size={size} />;
    case "other": {
      return <Icons.Category style={{ color }} size={size} />;
    }
    case "activity":
      return <Icons.Celebration style={{ color }} size={size} />;
    case "uncategorized":
      return <Icons.Difference style={{ color }} size={size} />;
    default:
      return null;
  }
}

export function Category({ name, className }) {
  const t = useI18n();

  return (
    <div className={cn("flex space-x-2 items-center", className)}>
      <CategoryIcon name={name} />
      {name && <p>{t(`categories.${name}`)}</p>}
    </div>
  );
}
