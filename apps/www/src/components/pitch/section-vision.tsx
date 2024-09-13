import Link from "next/link";

export function SectionVision() {
  return (
    <div className="relative min-h-screen w-screen">
      <div className="absolute left-8 right-8 top-4 flex justify-between text-lg">
        <span>Our vision</span>
        <span className="text-[#878787]">
          <Link href="/">Solomon AI </Link>
        </span>
      </div>
      <div className="container flex min-h-screen flex-col justify-center p-[5%]">
        <h1 className="px-4 text-center text-[45px] font-medium leading-none md:px-0 md:text-[122px]">
          Our mission is to build the financial operating system for medical
          practices.
        </h1>
      </div>
    </div>
  );
}
