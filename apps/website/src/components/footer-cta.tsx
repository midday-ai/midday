import { CTAButtons } from "@/components/cta-buttons";

export function FooterCTA() {
  return (
    <div className="border border-border rounded-2xl md:container text-center px-14 py-14 mx-4 md:mx-auto md:px-24 md:py-20 mb-32 mt-24 flex items-center flex-col bg-[#121212]">
      <h3 className="text-6xl	md:text-8xl font-medium text-white">
        Stress free by midday.
      </h3>
      <p className="text-[#878787] mt-6">
        Integer quis vestibulum lorem. Curabitur consectetur nulla nec justo
        congue
        <br />
        mattis. Nulla tincidunt ante eros, nec interdum dui varius quis.
      </p>

      <div className="mt-10 mb-8">
        <CTAButtons dark />
      </div>
    </div>
  );
}
