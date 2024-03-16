import Image from "next/image";
import timetracker from "public/time-tracker.png";

export function SectionThree() {
  return (
    <section className="border rounded-2xl container bg-[#121212] p-10 pb-0">
      <div className="flex space-x-12">
        <div className="mt-6">
          <h3 className="font-medium text-2xl	mb-4">Time track your projects</h3>

          <p className="text-[#B6B6B5] mb-4">
            Effortlessly boost productivity and collaboration with our advanced{" "}
            <br />
            time tracking solution: gain insightful project overviews and foster
            <br />
            seamless collaboration amongst your team for optimal efficiency and
            <br />
            success.
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
            <span className="text-[#B6B6B5]">Live time tracking</span>
          </div>
          <div className="flex space-x-2 items-center mt-1">
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
            <span className="text-[#B6B6B5]">Share with your clients</span>
          </div>
        </div>
        <Image src={timetracker} height={400} className="-mb-[1px] !ml-auto" />
      </div>
    </section>
  );
}
