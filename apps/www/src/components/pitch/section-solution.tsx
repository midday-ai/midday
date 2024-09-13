import Image from "next/image";
import Link from "next/link";

import overview from "./overview.png";
import { Card } from "./ui";

export function SectionSolution() {
  return (
    <div className="relative min-h-screen w-screen">
      <div className="absolute left-4 right-4 top-4 flex justify-between text-lg md:left-8 md:right-8">
        <span>Our solution</span>
        <span className="text-[#878787]">
          <Link href="/">Solomon AI </Link>
        </span>
      </div>
      <div className="container flex min-h-screen flex-col justify-center p-[5%]">
        <div className="grid h-[580px] gap-8 overflow-auto px-4 pb-[100px] md:h-auto md:grid-cols-3 md:px-0 md:pb-0 md:pt-0">
          <div className="space-y-8">
            <Card>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={74}
                height={57}
                fill="none"
              >
                <path
                  fill="#F5F5F3"
                  d="M13.667 56.667v-30.5l-9.334 7.166-4-5.333L37 0l13.333 10.167V3.333h10v14.5L73.667 28l-4 5.333-9.334-7.166v30.5h-20v-20h-6.666v20h-20ZM20.333 50H27V30h20v20h6.667V21.083L37 8.417 20.333 21.083V50Zm10-26.583h13.334c0-1.778-.667-3.236-2-4.375-1.334-1.14-2.89-1.709-4.667-1.709-1.778 0-3.333.57-4.667 1.709-1.333 1.139-2 2.597-2 4.375Z"
                />
              </svg>

              <h2 className="text-2xl">Multi-Faceted OS</h2>

              <p className="text-center text-sm text-[#878787]">
                We set out to transform how medical practices manage their
                finances by creating a tailored operating system that leverages
                AI. Our vision is to provide healthcare providers with a
                powerful tool that simplifies daily tasks and empowers them with
                deeper financial insights. This system does more than streamline
                operations; it actively helps practices identify inefficiencies
                and optimize financial health through advanced AI-driven stress
                testing and analytics.
              </p>
            </Card>

            <Card>
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
                    d="M63.333 70c-2.166 0-4.11-.625-5.833-1.875-1.722-1.25-2.917-2.847-3.583-4.792h-17.25c-3.667 0-6.806-1.305-9.417-3.916-2.611-2.611-3.917-5.75-3.917-9.417s1.306-6.806 3.917-9.417c2.611-2.61 5.75-3.916 9.417-3.916h6.666c1.834 0 3.403-.653 4.709-1.959C49.347 33.403 50 31.833 50 30c0-1.833-.653-3.403-1.958-4.708-1.306-1.306-2.875-1.959-4.709-1.959h-17.25c-.722 1.945-1.93 3.542-3.625 4.792C20.764 29.375 18.833 30 16.667 30c-2.778 0-5.14-.972-7.084-2.917C7.64 25.14 6.667 22.778 6.667 20c0-2.778.972-5.139 2.916-7.083C11.528 10.972 13.89 10 16.667 10c2.166 0 4.097.625 5.791 1.875 1.695 1.25 2.903 2.847 3.625 4.792h17.25c3.667 0 6.806 1.305 9.417 3.916 2.611 2.611 3.917 5.75 3.917 9.417s-1.306 6.806-3.917 9.417c-2.611 2.61-5.75 3.916-9.417 3.916h-6.666c-1.834 0-3.403.653-4.709 1.959C30.653 46.597 30 48.167 30 50c0 1.833.653 3.403 1.958 4.708 1.306 1.306 2.875 1.959 4.709 1.959h17.25c.722-1.945 1.93-3.542 3.625-4.792C59.236 50.625 61.167 50 63.333 50c2.778 0 5.14.972 7.084 2.917 1.944 1.944 2.916 4.305 2.916 7.083 0 2.778-.972 5.139-2.916 7.083C68.472 69.028 66.11 70 63.333 70ZM16.667 23.333c.944 0 1.736-.32 2.375-.958.638-.639.958-1.43.958-2.375 0-.944-.32-1.736-.958-2.375-.64-.639-1.43-.958-2.375-.958-.945 0-1.737.32-2.375.958-.64.639-.959 1.43-.959 2.375 0 .944.32 1.736.959 2.375s1.43.958 2.375.958Z"
                  />
                </g>
              </svg>

              <h2 className="text-2xl">Intermediary</h2>

              <p className="text-center text-sm text-[#878787]">
                Our platform is tailored to detect and address financial
                inefficiencies, keeping it intuitive and directly aligned with
                the needs of healthcare professionals. With a focus on user
                experience, we enable medical practices to operate more
                efficiently and scale effectively without getting bogged down by
                complex financial procedures.
              </p>
            </Card>
          </div>
          <div className="space-y-8">
            <div className="px-8">
              <h2 className="text-center text-[42px] leading-[58px]">
                We provide valuable business insights, allowing medical
                professionals to focus on patient care.
              </h2>
            </div>

            <Card>
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
                    d="M34.333 66c2.5-5.056 5.834-8.43 10-10.125C48.5 54.181 52.056 53.333 55 53.333c1.278 0 2.528.111 3.75.334 1.222.222 2.417.5 3.583.833a29.472 29.472 0 0 0 3.167-6.833c.778-2.445 1.167-5 1.167-7.667 0-7.444-2.584-13.75-7.75-18.917-5.167-5.166-11.473-7.75-18.917-7.75-7.444 0-13.75 2.584-18.917 7.75-5.166 5.167-7.75 11.473-7.75 18.917 0 2.5.32 4.889.959 7.167a22.548 22.548 0 0 0 2.875 6.333 36.066 36.066 0 0 1 7.083-2.583A30.468 30.468 0 0 1 31.667 50c1.777 0 3.486.153 5.125.458 1.639.306 3.264.709 4.875 1.209A23.69 23.69 0 0 0 38.042 54a34.898 34.898 0 0 0-3.209 2.833 10.641 10.641 0 0 0-1.708-.166h-1.458c-1.778 0-3.542.194-5.292.583-1.75.389-3.43.972-5.042 1.75a25.89 25.89 0 0 0 5.959 4.458A24.821 24.821 0 0 0 34.333 66ZM40 73.333c-4.611 0-8.944-.875-13-2.625-4.055-1.75-7.583-4.125-10.583-7.125S11.042 57.056 9.292 53s-2.625-8.389-2.625-13c0-4.611.875-8.944 2.625-13 1.75-4.056 4.125-7.583 7.125-10.583S22.944 11.042 27 9.292s8.389-2.625 13-2.625c4.611 0 8.944.875 13 2.625 4.056 1.75 7.583 4.125 10.583 7.125S68.958 22.944 70.708 27s2.625 8.389 2.625 13c0 4.611-.875 8.944-2.625 13-1.75 4.056-4.125 7.583-7.125 10.583S57.056 68.958 53 70.708s-8.389 2.625-13 2.625ZM31.667 45c-3.223 0-5.973-1.139-8.25-3.417C21.139 39.306 20 36.556 20 33.333c0-3.222 1.139-5.972 3.417-8.25 2.277-2.277 5.027-3.416 8.25-3.416 3.222 0 5.972 1.139 8.25 3.416 2.277 2.278 3.416 5.028 3.416 8.25 0 3.223-1.139 5.973-3.416 8.25C37.639 43.861 34.889 45 31.667 45Zm0-6.667c1.389 0 2.57-.486 3.541-1.458.973-.972 1.459-2.153 1.459-3.542 0-1.389-.486-2.57-1.459-3.541-.972-.973-2.152-1.459-3.541-1.459-1.39 0-2.57.486-3.542 1.459-.972.972-1.458 2.152-1.458 3.541 0 1.39.486 2.57 1.458 3.542s2.153 1.458 3.542 1.458Zm23.333 10c-2.333 0-4.306-.805-5.917-2.416-1.61-1.611-2.416-3.584-2.416-5.917 0-2.333.805-4.306 2.416-5.917 1.611-1.61 3.584-2.416 5.917-2.416 2.333 0 4.306.805 5.917 2.416 1.61 1.611 2.416 3.584 2.416 5.917 0 2.333-.805 4.306-2.416 5.917-1.611 1.61-3.584 2.416-5.917 2.416Z"
                  />
                </g>
              </svg>

              <h2 className="text-2xl">User friendly & AI</h2>

              <p className="text-center text-sm text-[#878787]">
                We're dedicated to crafting our platform alongside our community
                of medical professionals to guarantee it's as intuitive as
                possible and encompasses all the necessary features to support
                healthcare providers. With the integration of AI, we've enhanced
                our system with functionalities like matching receipts to
                transactions and automating category classification. Through
                Solomon AI, users can interact directly with their financials,
                easily requesting any insights they need to manage and optimize
                their practice efficiently.
              </p>
            </Card>
          </div>

          <div className="ml-auto w-full">
            <Image
              src={overview}
              alt="Overview"
              width={650}
              height={875}
              quality={100}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
