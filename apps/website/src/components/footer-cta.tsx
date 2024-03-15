import { CTAButtons } from "@/components/cta-buttons";

export function FooterCTA() {
  return (
    <div className="border rounded-2xl container text-center px-24 py-12 mb-32 mt-24 flex items-center flex-col bg-[#121212]">
      <h3 className="text-8xl font-medium">Stress free by midday.</h3>
      <p className="text-[#878787] mt-6">
        Integer quis vestibulum lorem. Curabitur consectetur nulla nec justo
        congue
        <br />
        mattis. Nulla tincidunt ante eros, nec interdum dui varius quis.
      </p>

      <div className="mt-10 mb-8">
        <CTAButtons />
      </div>
    </div>
  );
}
