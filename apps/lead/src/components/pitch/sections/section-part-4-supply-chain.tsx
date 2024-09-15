import Link from "next/link";

export function SectionPart4SupplyChain() {
  return (
    <div className="min-h-screen flex items-center justify-center transition-colors duration-300 overflow-hidden relative">
      <div className="absolute left-8 right-8 top-4 flex justify-between text-lg">
        <span>Supply Chain </span>
        <span className="text-[#878787]">
          <Link href="/">solomon-ai.app</Link>
        </span>
      </div>
      <h1>SectionPart4SupplyChain (Supply Chain) Problem & Solution</h1>
      <p> how does money flow through the business</p>
      <p>
        {" "}
        where are we leaking, where is money coming from, where is money going
        to
      </p>
      <p>
        - What vendors are we using and how much are we paying them - Re-assess
        all contracts with vendors and ammend inoptimal master service
        agreements - Renegotiate contracts and costs, seek price/charge waivers
        - Lower connection costs - Separate orders for contracting and
        credentialing - Switch to a more cost effective providers (EHR, Billing,
        EMR, etc)
      </p>
      <p>- How much are we paying for rent, utilities, etc</p>
    </div>
  );
}
