import * as React from "react";
import { Group } from "../../types/menu";
import { Navbar } from "./navbar";

interface ContentLayoutProps {
  title: string;
  children: React.ReactNode;
  menu: Group<string>[];
}

export function ContentLayout({ title, children, menu }: ContentLayoutProps) {
  return (
    <div>
      <Navbar title={title} menu={menu} />
      <div className="container px-4 pb-8 pt-8 sm:px-8">{children}</div>
    </div>
  );
}
