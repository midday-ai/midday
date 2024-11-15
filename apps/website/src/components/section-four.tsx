import Image from "next/image";
import inbox from "public/inbox.png";
import invoicing from "public/invoicing.png";
import { CtaLink } from "./cta-link";

export function SectionFour() {
  return (
    <section className="flex justify-between space-y-12 md:space-y-0 md:space-x-8 flex-col md:flex-row overflow-hidden mb-12 group relative">
      <div className="border border-border md:basis-2/3 bg-[#121212] p-10 flex justify-between md:space-x-8 md:flex-row flex-col">
        <div className="flex flex-col md:basis-1/2">
          <h4 className="font-medium text-xl md:text-2xl mb-4">Invoicing</h4>

          <p className="text-[#878787] mb-4 text-sm">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum
            eu porta neque. Duis sit amet erat nec ligula pretium ultricies in
            ac urna. Quisque id pharetra lorem, sit amet cursus enim. Mauris a
            dui volutpat, vehicula est pretium, lacinia felis. Sed nec ante
            efficitur nunc sagittis sollicitudin quis ac augue.
          </p>

          <div className="flex flex-col space-y-2">
            <div className="flex space-x-2 items-center mt-8 text-sm">
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
              <span className="text-[#878787]">Live time tracking</span>
            </div>
            <div className="flex space-x-2 items-center text-sm">
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
              <span className="text-[#878787]">Share with your clients</span>
            </div>

            <div className="absolute bottom-6">
              <CtaLink text="Send your first invoice in seconds" />
            </div>
          </div>
        </div>

        <div className="md:basis-1/2 mt-8 md:mt-0 -bottom-[8px] relative">
          <Image
            src={invoicing}
            width={299}
            height={423}
            quality={90}
            className="object-contain -bottom-[33px] relative ml-[20%]"
            alt="Invoicing"
          />
        </div>
      </div>

      <div className="border border-border basis-1/3 bg-[#121212] p-10 md:text-center flex flex-col">
        <span className="text-[#F5F5F3] border border-border rounded-full self-start font-medium font-mono px-3 text-xs py-1.5 mb-4 bg-[#1D1D1D]">
          Coming soon
        </span>
        <h4 className="font-medium text-xl md:text-2xl mb-4">Magic inbox</h4>
        <p className="text-[#878787] mb-[35px] text-sm">
          We’re working hard to give you the best invoice solution. It will
          feature web based invoices, live collaboration and project sync.
        </p>
      </div>
    </section>
  );
}
