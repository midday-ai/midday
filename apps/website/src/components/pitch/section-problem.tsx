import Image from "next/image";
import Link from "next/link";
import reciept from "./reciept.png";
import { Card } from "./ui";

export function SectionProblem() {
  return (
    <div className="min-h-screen relative w-screen">
      <div className="absolute left-4 right-4 md:left-8 md:right-8 top-4 flex justify-between text-lg">
        <span>Current problem</span>
        <span className="text-[#878787]">
          <Link href="/">midday.ai</Link>
        </span>
      </div>
      <div className="flex flex-col min-h-screen justify-center container">
        <div className="grid md:grid-cols-3 gap-8 px-4 md:px-0 md:pt-0 h-[580px] md:h-auto overflow-auto pb-[100px] md:pb-0">
          <div className="space-y-8">
            <Card>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={60}
                height={68}
                fill="none"
              >
                <path
                  fill="#F5F5F3"
                  d="M0 67.333V.667l5 5 5-5 5 5 5-5 5 5 5-5 5 5 5-5 5 5 5-5 5 5 5-5v66.666l-5-5-5 5-5-5-5 5-5-5-5 5-5-5-5 5-5-5-5 5-5-5-5 5Zm10-16.666h40V44H10v6.667Zm0-13.334h40v-6.666H10v6.666ZM10 24h40v-6.667H10V24ZM6.667 57.667h46.666V10.333H6.667v47.334Z"
                />
              </svg>
              <h2 className="text-2xl">Disorganization</h2>

              <p className="text-[#878787] text-sm text-center">
                Running a business is tough, and one of the biggest challenges
                is disorganization. From scattered files to misplaced documents,
                this lack of structure hampers productivity and wastes time.
                Moreover, this disorganization often creates problems for your
                accountant, leading to delays and errors in financial reporting.
              </p>
            </Card>
            <div className="px-8">
              <h2 className="text-6xl text-center leading-tight">
                The current market for SMB financial tools is a mess.
              </h2>
            </div>
          </div>
          <div>
            <Image
              src={reciept}
              alt="Reciept"
              width={650}
              height={875}
              quality={100}
            />
          </div>
          <div className="ml-auto w-full space-y-8">
            <Card className="min-h-[315px]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={80}
                height={80}
                fill="none"
              >
                <mask
                  id="a"
                  width={80}
                  height={80}
                  x={0}
                  y={0}
                  maskUnits="userSpaceOnUse"
                  style={{
                    maskType: "alpha",
                  }}
                >
                  <path fill="#D9D9D9" d="M0 0h80v80H0z" />
                </mask>
                <g mask="url(#a)">
                  <path
                    fill="#F5F5F3"
                    d="M56.667 70C53 70 49.86 68.695 47.25 66.083c-2.611-2.61-3.917-5.75-3.917-9.416 0-3.667 1.306-6.806 3.917-9.417 2.611-2.611 5.75-3.917 9.417-3.917 3.666 0 6.805 1.306 9.416 3.917C68.694 49.861 70 53 70 56.667c0 3.666-1.306 6.805-3.917 9.416-2.61 2.612-5.75 3.917-9.416 3.917Zm0-6.667c1.833 0 3.402-.652 4.708-1.958s1.958-2.875 1.958-4.708c0-1.834-.652-3.403-1.958-4.709C60.069 50.653 58.5 50 56.667 50c-1.834 0-3.403.653-4.709 1.958C50.653 53.264 50 54.833 50 56.667c0 1.833.653 3.402 1.958 4.708 1.306 1.306 2.875 1.958 4.709 1.958ZM23.333 60c-3.666 0-6.805-1.306-9.416-3.917-2.611-2.61-3.917-5.75-3.917-9.416 0-3.667 1.306-6.806 3.917-9.417 2.61-2.611 5.75-3.917 9.416-3.917 3.667 0 6.806 1.306 9.417 3.917 2.611 2.611 3.917 5.75 3.917 9.417 0 3.666-1.306 6.805-3.917 9.416C30.139 58.694 27 60 23.333 60Zm0-6.667c1.834 0 3.403-.652 4.709-1.958C29.347 50.069 30 48.5 30 46.667c0-1.834-.653-3.403-1.958-4.709C26.736 40.653 25.167 40 23.333 40c-1.833 0-3.402.653-4.708 1.958-1.306 1.306-1.958 2.875-1.958 4.709 0 1.833.652 3.402 1.958 4.708s2.875 1.958 4.708 1.958Zm13.334-20c-3.667 0-6.806-1.305-9.417-3.916-2.611-2.611-3.917-5.75-3.917-9.417s1.306-6.806 3.917-9.417c2.611-2.61 5.75-3.916 9.417-3.916 3.666 0 6.805 1.305 9.416 3.916C48.694 13.194 50 16.333 50 20s-1.306 6.806-3.917 9.417c-2.61 2.61-5.75 3.916-9.416 3.916Zm0-6.666c1.833 0 3.402-.653 4.708-1.959 1.306-1.305 1.958-2.875 1.958-4.708 0-1.833-.652-3.403-1.958-4.708-1.306-1.306-2.875-1.959-4.708-1.959-1.834 0-3.403.653-4.709 1.959C30.653 16.597 30 18.167 30 20c0 1.833.653 3.403 1.958 4.708 1.306 1.306 2.875 1.959 4.709 1.959Z"
                  />
                </g>
              </svg>

              <h2 className="text-2xl">Scattered workflow</h2>

              <p className="text-[#878787] text-sm text-center">
                Existing services often compound the problem by residing on
                various platforms, resulting in a fragmented workflow. From
                tracking time to managing finances and storing documents,
                entrepreneurs navigate multiple interfaces and systems. This
                scattered approach wastes time and money, increases the risk of
                errors, and disrupts productivity.
              </p>
            </Card>
            <Card className="min-h-[315px]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={80}
                height={80}
                fill="none"
              >
                <mask
                  id="a"
                  width={80}
                  height={80}
                  x={0}
                  y={0}
                  maskUnits="userSpaceOnUse"
                  style={{
                    maskType: "alpha",
                  }}
                >
                  <path fill="#D9D9D9" d="M0 0h80v80H0z" />
                </mask>
                <g mask="url(#a)">
                  <path
                    fill="#F5F5F3"
                    d="M13.333 66.667c-1.833 0-3.402-.653-4.708-1.959C7.319 63.403 6.667 61.833 6.667 60V20c0-1.833.652-3.403 1.958-4.708 1.306-1.306 2.875-1.959 4.708-1.959h53.334c1.833 0 3.402.653 4.708 1.959 1.305 1.305 1.958 2.875 1.958 4.708v40c0 1.833-.653 3.403-1.958 4.708-1.306 1.306-2.875 1.959-4.708 1.959H13.333Zm0-6.667h53.334V26.667H13.333V60ZM25 56.667 20.333 52l8.584-8.667-8.667-8.666L25 30l13.333 13.333L25 56.667Zm15 0V50h20v6.667H40Z"
                  />
                </g>
              </svg>

              <h2 className="text-2xl">Old tech</h2>

              <p className="text-[#878787] text-sm text-center">
                Services are outdated and prioritize features tailored to
                accountants rather than offering a user-friendly interface for
                business owners. This approach often results in cumbersome
                navigation and a disconnect between the software and the needs
                of users.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
