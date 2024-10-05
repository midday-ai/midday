import { Group } from "@/types/index";
import {
  BriefcaseIcon,
  CubeTransparentIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import {
  Database,
  DollarSign,
  FileAxis3D,
  FileText,
  InboxIcon,
  LayoutGrid,
  PieChart,
  Settings,
  TableCellsMergeIcon,
  Timer,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

/**
 * Configuration object for the application's menu structure.
 * It defines the hierarchy of menu items, including groups, menus, and submenus.
 */
const menuConfig: Group[] = [
  {
    groupLabel: "Dashboard",
    menus: [
      {
        href: "/",
        label: "Overview",
        icon: LayoutGrid,
        submenus: [],
        active: false,
      },
    ],
  },
  {
    groupLabel: "Finances",
    menus: [
      {
        href: "/financial-accounts",
        label: "Financial Accounts",
        icon: DollarSign,
        submenus: [
          // {
          //   href: "/bank-accounts/deposit",
          //   label: "Deposit",
          //   active: false,
          //   icon: WalletIcon
          // },
          // {
          //   href: "/bank-accounts/credit",
          //   label: "Credit",
          //   active: false,
          //   icon: BriefcaseIcon
          // },
        ],
        active: false,
      },
      {
        href: "/transactions",
        label: "Transactions",
        icon: TableCellsMergeIcon,
        submenus: [],
        active: false,
      },
      {
        href: "/transactions-recurring",
        label: "Recurring Transactions",
        icon: FileAxis3D,
        submenus: [],
        active: false,
      },
    ],
  },
  {
    groupLabel: "Management",
    menus: [
      {
        href: "/inbox",
        label: "Inbox",
        icon: InboxIcon,
        submenus: [],
        active: false,
      },
      {
        href: "/vault",
        label: "Workspace",
        icon: Database,
        submenus: [],
        active: false,
      },
      {
        href: "/tracker",
        label: "Project Tracker",
        icon: CubeTransparentIcon,
        submenus: [],
        active: false,
      },
    ],
  },
  // {
  //   groupLabel: "Analytics",
  //   menus: [
  //     {
  //       href: "/analytics/income",
  //       label: "Income",
  //       icon: TrendingUp,
  //       submenus: [
  //         {
  //           href: "/analytics/income/overview",
  //           label: "Overview",
  //           active: false,
  //         },
  //         {
  //           href: "/analytics/income/details",
  //           label: "Details",
  //           active: false,
  //         },
  //         {
  //           href: "/analytics/income/categories",
  //           label: "Categories",
  //           active: false,
  //         },
  //         {
  //           href: "/analytics/income/sources",
  //           label: "Sources",
  //           active: false,
  //         },
  //       ],
  //       active: false,
  //     },
  //     {
  //       href: "/analytics/expense",
  //       label: "Expense",
  //       icon: TrendingDown,
  //       submenus: [
  //         {
  //           href: "/analytics/expense/overview",
  //           label: "Overview",
  //           active: false,
  //         },
  //         {
  //           href: "/analytics/expense/details",
  //           label: "Details",
  //           active: false,
  //         },
  //         {
  //           href: "/analytics/expense/categories",
  //           label: "Categories",
  //           active: false,
  //         },
  //       ],
  //       active: false,
  //     },
  //     {
  //       href: "/analytics/revenue",
  //       label: "Revenue",
  //       icon: DollarSign,
  //       submenus: [
  //         {
  //           href: "/analytics/revenue/overview",
  //           label: "Overview",
  //           active: false,
  //         },
  //         {
  //           href: "/analytics/revenue/details",
  //           label: "Details",
  //           active: false,
  //         },
  //         {
  //           href: "/analytics/revenue/categories",
  //           label: "Categories",
  //           active: false,
  //         },
  //       ],
  //       active: false,
  //     },
  //     {
  //       href: "/analytics/categories",
  //       label: "Categories",
  //       icon: PieChart,
  //       submenus: [],
  //       active: false,
  //     },
  //   ],
  // },
  {
    groupLabel: "Marketplace",
    menus: [
      {
        href: "/apps",
        label: "Market Place",
        icon: FileText,
        submenus: [],
        active: false,
      },
    ],
  },
  {
    groupLabel: "Settings",
    menus: [
      {
        href: "/settings",
        label: "Settings",
        icon: Settings,
        submenus: [
          // {
          //   href: "/settings/accounts",
          //   label: "Accounts",
          //   active: false,
          // },
          // {
          //   href: "/settings/members",
          //   label: "Team",
          //   active: false,
          // },
          // {
          //   href: "/settings/categories",
          //   label: "Categories",
          //   active: false,
          // },
          // {
          //   href: "/settings/notifications",
          //   label: "Notifications",
          //   active: false,
          // },
        ],
        active: false,
      },
    ],
  },
];

/**
 * Generates an updated menu list based on the current pathname.
 * This function sets the 'active' state for menus and submenus that match the current path.
 *
 * @param {string} pathname - The current pathname of the application.
 * @param {Group[]} [config=menuConfig] - The menu configuration to use. Defaults to the predefined menuConfig.
 * @returns {Group[]} An updated copy of the menu configuration with active states set.
 */
export function getMenuList(
  pathname: string,
  config: Group[] = menuConfig
): Group[] {
  return config.map((group) => ({
    ...group,
    menus: group.menus.map((menu) => ({
      ...menu,
      active: pathname.includes(menu.href),
      submenus: menu.submenus.map((submenu) => ({
        ...submenu,
        active: pathname === submenu.href,
      })),
    })),
  }));
}
