"use client";

import { useI18n } from "@/locales/client";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";

type Theme = "dark" | "system" | "light";

type Props = {
  currentTheme?: Theme;
};

const ThemeIcon = ({ currentTheme }: Props) => {
  switch (currentTheme) {
    case "dark":
      return <Moon size={12} />;
    case "system":
      return <Monitor size={12} />;
    default:
      return <Sun size={12} />;
  }
};

export const ThemeSwitch = () => {
  const t = useI18n();
  const { theme, setTheme, themes, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mounting, we have access to the theme
  useEffect(() => setMounted(true), []);

  const getThemeLabel = (themeValue: string) => {
    switch (themeValue) {
      case "dark":
        return t("theme.dark");
      case "light":
        return t("theme.light");
      case "system":
        return t("theme.system");
      default:
        return themeValue;
    }
  };

  if (!mounted) {
    return <div className="h-[32px]" />;
  }

  return (
    <div className="flex items-center relative">
      <Select value={theme} onValueChange={(value: Theme) => setTheme(value)}>
        <SelectTrigger className="w-full pl-6 pr-3 py-1.5 bg-transparent outline-none h-[32px] text-xs">
          <SelectValue>
            {theme ? getThemeLabel(theme) : t("theme.select_theme")}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {themes.map((themeItem) => (
              <SelectItem
                key={themeItem}
                value={themeItem}
                className="text-xs"
              >
                {getThemeLabel(themeItem)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <div className="absolute left-2 pointer-events-none">
        <ThemeIcon currentTheme={resolvedTheme as Theme} />
      </div>
    </div>
  );
};
