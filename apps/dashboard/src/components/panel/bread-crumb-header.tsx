"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@midday/ui/breadcrumb";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Capitalizes the first letter of a string and replaces hyphens with spaces.
 * @param s - The string to capitalize and format.
 * @returns The capitalized and formatted string.
 */
const capitalize = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ");

/**
 * Represents a breadcrumb item.
 */
interface BreadcrumbItemType {
  /** The display label for the breadcrumb item. */
  label: string;
  /** The URL for the breadcrumb item. */
  href: string;
}

/**
 * A component that renders a breadcrumb navigation based on the current path.
 * It includes a "Home" link and dynamically generates breadcrumb items for each path segment.
 */
function BreadcrumbNav(): JSX.Element {
  const pathname = usePathname();
  const pathnameParts = pathname.split("/").filter(Boolean);

  const breadcrumbItems: BreadcrumbItemType[] = pathnameParts.map(
    (part, index) => ({
      label: capitalize(part),
      href: `/${pathnameParts.slice(0, index + 1).join("/")}`,
    }),
  );

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Home</Link>
          </BreadcrumbLink>
          <BreadcrumbSeparator />
        </BreadcrumbItem>
        {breadcrumbItems.map((item, index) => (
          <BreadcrumbItem key={item.href}>
            {index === breadcrumbItems.length - 1 ? (
              <BreadcrumbPage>{item.label}</BreadcrumbPage>
            ) : (
              <>
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
                <BreadcrumbSeparator />
              </>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default BreadcrumbNav;
