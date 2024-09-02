import { useI18n } from "@/locales/client";
import { ComboboxDropdown } from "@midday/ui/combobox-dropdown";
import { TAGS } from "./tables/vault/contants";

export function SelectTag({
  headless,
  onChange,
  selectedId,
}: {
  headless?: boolean;
  onChange: (selected: { id: string; label: string; slug: string }) => void;
  selectedId?: string;
}) {
  const t = useI18n();

  const data = TAGS.map((tag) => ({
    id: tag,
    label: t(`tags.${tag}`),
    slug: tag,
  }));

  return (
    <ComboboxDropdown
      headless={headless}
      placeholder="Select tags"
      selectedItem={data.find((tag) => tag.id === selectedId)}
      searchPlaceholder="Search tags"
      items={data}
      onSelect={(item) => {
        onChange(item);
      }}
    />
  );
}
