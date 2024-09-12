import {
  Bookmark,
  LayoutGrid,
  Settings,
  SquarePen,
  Tag,
  Users,
} from "lucide-react";

export type Submenu<T> = {
  href: string;
  label: string;
  active: boolean;
  extra?: T;
};

export type Menu<T> = {
  href: string;
  label: string;
  active: boolean;
  icon: any;
  submenus: Submenu<T>[];
  extra?: T;
};

export type Group<T> = {
  groupLabel: string;
  menus: Menu<T>[];
};

export function getMenuList<T>(pathname: string): Group<T>[] {
  return [
    {
      groupLabel: "",
      menus: [
        {
          href: "/dashboard",
          label: "Dashboard",
          active: pathname.includes("/dashboard"),
          icon: LayoutGrid,
          submenus: [],
        },
      ],
    },
    {
      groupLabel: "Contents",
      menus: [
        {
          href: "",
          label: "Posts",
          active: pathname.includes("/posts"),
          icon: SquarePen,
          submenus: [
            {
              href: "/posts",
              label: "All Posts",
              active: pathname === "/posts",
            },
            {
              href: "/posts/new",
              label: "New Post",
              active: pathname === "/posts/new",
            },
          ],
        },
        {
          href: "/categories",
          label: "Categories",
          active: pathname.includes("/categories"),
          icon: Bookmark,
          submenus: [],
        },
        {
          href: "/tags",
          label: "Tags",
          active: pathname.includes("/tags"),
          icon: Tag,
          submenus: [],
        },
      ],
    },
    {
      groupLabel: "Settings",
      menus: [
        {
          href: "/users",
          label: "Users",
          active: pathname.includes("/users"),
          icon: Users,
          submenus: [],
        },
        {
          href: "/account",
          label: "Account",
          active: pathname.includes("/account"),
          icon: Settings,
          submenus: [],
        },
      ],
    },
  ];
}
