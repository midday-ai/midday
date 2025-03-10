import { WhiteLabelPlans } from "@/components/white-label-plans";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "White Label",
  description: "",
};

export default function Page() {
  return (
    <div className="container mb-52">
      <div className="mb-40">
        <h1 className="mt-24 font-medium text-center text-[75px] md:text-[170px] mb-2 leading-none">
          white-label
        </h1>

        <h3 className="font-medium text-center text-stroke text-[75px] md:text-[170px] mb-2 leading-none">
          midday
        </h3>

        <div className="flex items-center flex-col text-center relative">
          <p className="text-lg mt-4 max-w-[600px]">
            No need to rebuild from scratch. Use Midday's solid foundation and
            build on it to launch and adapt to your specific needs.
          </p>
        </div>
      </div>

      <div className="flex items-center flex-col text-center relative mt-28 mb-24">
        <div className="max-w-[600px]">
          <h4 className="font-medium text-xl md:text-2xl mb-4">
            Fuel your own SaaS
          </h4>
          <p className="text-[#878787] text-sm">
            Unlock the power of Midday's proven functionality to fuel your SaaS
            business. With our commercial license, you gain access to our suite
            of features including invoicing, inbox management, and more. Ready
            to be integrated into your platform.
          </p>
        </div>
      </div>

      <WhiteLabelPlans />

      <div className="flex items-center flex-col text-center relative mt-32 mb-24">
        <div className="max-w-[750px]">
          <h4 className="font-medium text-xl md:text-4xl mb-4">Why?</h4>

          <div className="space-y-16 mt-12">
            <div>
              <h3 className="text-xl mb-4 text-left">Fast Implementation</h3>
              <p className="text-[#878787] text-sm text-left">
                Skip years of development and focus on growing your business.
                Midday provides a fully-integrated platform out of the box,
                eliminating the need for you to build complex core
                functionalities like invoicing, task management, and user
                inboxes from scratch. This allows you to accelerate your
                product's time to market, helping you stay competitive and
                provide value to your users much faster.
              </p>
            </div>

            <div>
              <h3 className="text-xl mb-4 text-left">Scalable Foundation</h3>
              <p className="text-[#878787] text-sm text-left">
                Midday's open-source repository acts as a powerful starting
                point for your SaaS. You get full access to our core
                functionality, which you can easily customize and expand as your
                business grows. Whether you need to add new features or
                integrate with third-party services, the flexibility of our
                codebase ensures your platform can evolve to meet your unique
                requirements without the need for a complete rebuild. This
                scalability allows you to seamlessly grow your SaaS as your user
                base and needs increase.
              </p>
            </div>

            <div>
              <h3 className="text-xl mb-4 text-left">Proven Reliability</h3>
              <p className="text-[#878787] text-sm text-left">
                Midday is already trusted by leading SaaS companies to handle
                critical business functions. Our platform is built to be robust,
                secure, and high-performing—ensuring that the key elements of
                your business, like invoicing and task management, are always
                reliable. By leveraging Midday, you're not only tapping into
                proven technology but also gaining peace of mind knowing that
                your core systems are backed by industry-leading reliability and
                ongoing updates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
