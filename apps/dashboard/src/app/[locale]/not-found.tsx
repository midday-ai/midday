import Image from "next/image";
import Link from "next/link";
import appIcon from "public/appicon.png";

export default function NotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center text-center text-sm text-[#606060]">
      <Image
        src={appIcon}
        width={80}
        height={80}
        alt="Midday"
        quality={100}
        className="mb-10"
      />
      <h2 className="text-xl font-semibold mb-2">Not Found</h2>
      <p className="mb-4">Could not find requested resource</p>
      <Link href="/" className="underline">
        Return Home
      </Link>
    </div>
  );
}
