import Image from "next/image";
import timetracker from "public/time-tracker.png";

export function SectionThree() {
  return (
    <section className="relative mb-12">
      <div className="container overflow-hidden border border-border bg-[#121212] p-8 md:p-10 md:pb-0">
        <div className="flex flex-col md:flex-row md:space-x-12">
          <div className="mt-6 md:mb-8 md:mr-8 md:max-w-[40%]">
            <h3 className="mb-4 text-xl font-medium md:text-2xl">
              Time track your projects
            </h3>

            <p className="mb-4 text-sm text-[#878787]">
              Effortlessly boost productivity and collaboration with our
              advanced <br />
              time tracking solution: gain insightful project overviews and
              foster seamless collaboration amongst your team for optimal
              efficiency and success.
            </p>

            <div className="mt-8 flex items-center space-x-2 text-sm">
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
            <div className="mt-1 flex items-center space-x-2 text-sm">
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
          </div>

          <Image
            src={timetracker}
            height={400}
            className="-mb-[32px] mt-8 object-contain md:-mb-[1px] md:mt-0"
            quality={100}
            alt="Tracker"
          />
        </div>
      </div>
    </section>
  );
}
