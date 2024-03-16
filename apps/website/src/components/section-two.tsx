import Image from "next/image";
import profitLoss from "public/profit-loss.png";

export function SectionTwo() {
  return (
    <section className="border rounded-2xl container bg-[#121212] p-10 pb-0">
      <div className="flex space-x-12">
        <Image
          src={profitLoss}
          height={400}
          className="-mb-[1px]"
          quality={100}
        />
        <div className="mt-6">
          <h3 className="font-medium text-2xl	mb-4">Financial overview</h3>

          <p className="text-[#878787] mb-4">
            Bring your own bank, we connect to over 4000 banks <br /> world
            wide.
          </p>

          <p className="text-[#878787]">
            Keep track of your expenses and income. Get a better <br />
            overview of your bussiness financial track record and
            <br /> situation. Share profit/loss reports
          </p>

          <div className="flex space-x-2 items-center mt-8">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={18}
              height={13}
              fill="none"
            >
              <path
                fill="currentColor"
                d="M6.55 13 .85 7.3l1.425-1.425L6.55 10.15 15.725.975 17.15 2.4 6.55 13Z"
              />
            </svg>
            <span className="text-[#878787]">Share profit/loss reports</span>
          </div>
        </div>
      </div>
    </section>
  );
}
