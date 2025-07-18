import { Icons } from "@midday/ui/icons";
import Link from "next/link";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen p-2">
      <header className="absolute top-0 left-0 z-30 w-full">
        <div className="p-6 md:p-8">
          <Link href="/">
            <Icons.LogoSmall className="h-8 w-auto" />
          </Link>
        </div>
      </header>

      {children}
    </div>
  );
}
