"use client";

import { ChevronsUpDownIcon, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

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
  const { theme, setTheme, themes } = useTheme();

  return (
    <div className="flex items-center relative">
      <select
        className="text-xs border rounded appearance-none pl-6 pr-6 py-1.5 bg-transparent outline-none capitalize w-full"
        defaultValue={theme}
        onChange={(event) => setTheme(event.target.value)}
      >
        {themes.map((theme) => (
          <option key={theme} value={theme}>
            {theme}
          </option>
        ))}
      </select>

      <div className="absolute left-2">
        <ThemeIcon currentTheme={theme as Theme} />
      </div>

      <div className="absolute right-2">
        <ChevronsUpDownIcon size={12} />
      </div>
    </div>
  );
};
