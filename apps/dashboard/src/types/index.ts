import { LucideIcon } from "lucide-react";

/**
 * Represents a submenu item in the navigation structure.
 * @interface Submenu
 */
type Submenu = {
  /** The URL or path that this submenu item links to. */
  href: string;
  /** The display text for the submenu item. */
  label: string;
  /** Indicates whether this submenu item is currently active. */
  active: boolean;
  /** Optional icon for the submenu item. Can be any valid icon type. */
  icon?: any;
};

/**
 * Represents a main menu item in the navigation structure.
 * @interface Menu
 */
type Menu = {
  /** The URL or path that this menu item links to. */
  href: string;
  /** The display text for the menu item. */
  label: string;
  /** Indicates whether this menu item is currently active. */
  active: boolean;
  /** Icon for the menu item. Can be any valid icon type. */
  icon: any;
  /** An array of submenu items associated with this menu item. */
  submenus: Submenu[];
};

/**
 * Represents a group of menu items in the navigation structure.
 * @interface Group
 */
type Group = {
  /** The label or title for this group of menu items. */
  groupLabel: string;
  /** An array of menu items contained within this group. */
  menus: Menu[];
};

export type { Group, Menu, Submenu };
