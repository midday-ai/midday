import computerLight from "public/computer-light.png";
import computerDark from "public/computer.png";
import { CtaLink } from "./cta-link";
import { DynamicImage } from "./dynamic-image";

export function SectionTwo() {
  return (
    <section className="border border-border container dark:bg-[#121212] lg:pb-0 overflow-hidden mb-12 group">
      <div className="flex flex-col lg:space-x-12 lg:flex-row">
        <DynamicImage
          lightSrc={computerLight}
          darkSrc={computerDark}
          height={446}
          width={836}
          className="-mb-[1px] object-contain lg:w-1/2"
          alt="Overview"
          quality={90}
        />

        <div className="xl:mt-6 lg:max-w-[40%] md:ml-8 md:mb-8 flex flex-col justify-center p-8 md:pl-0 relative">
          <h3 className="font-medium text-xl md:text-2xl mb-4">
            Financial overview
          </h3>

          <p className="text-[#878787] mb-8 lg:mb-4 text-sm">
            Bring your own bank. We connect to over 20 000+ banks in 33
            countries across US, Canada, UK and Europe. Keep tabs on your
            expenses and income, and gain a clearer picture of your business's
            financial track record and current situation.
          </p>

          <div className="flex flex-col space-y-2">
            <div className="flex space-x-2 items-center ">
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
              <span className="text-primary text-sm">Revenue</span>
            </div>

            <div className="flex space-x-2 items-center">
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
              <span className="text-primary text-sm">Profit & Loss</span>
            </div>

            <div className="flex space-x-2 items-center">
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
              <span className="text-primary text-sm">Burnrate</span>
            </div>

            <div className="flex space-x-2 items-center">
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
              <span className="text-primary text-sm">Expenses</span>
            </div>

            <div className="flex space-x-2 items-center">
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
              <span className="text-primary text-sm">
                Unified currency overview across all your accounts
              </span>
            </div>

            <div className="flex space-x-2 items-center">
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
              <span className="text-primary text-sm">Shareable reports</span>
            </div>
          </div>

          <div className="absolute bottom-0 right-0">
            <CtaLink text="Get on top of your finances" />
          </div>
        </div>
      </div>
    </section>
  );
}
