import { BlurryCircle } from "./blurry-circle";
import { CardStack } from "./card-stack";
import { Dock } from "./dock";

export function Screens() {
  return (
    <div className="flex items-center justify-center mt-14 flex-col">
      <div className="relative">
        <BlurryCircle className="absolute -top-2 right-[320px] bg-[#FFECBB]/20" />
        <BlurryCircle className="absolute -bottom-6 left-6 bg-[#FFECBB]/5" />

        <CardStack
          items={[
            {
              id: 1,
              name: "123",
              content: "123123",
              designation: "123",
            },
            {
              id: 2,
              name: "123",
              content: "123123",
              designation: "123",
            },
            {
              id: 3,
              name: "123",
              content: "123123",
              designation: "123",
            },
          ]}
        />
      </div>

      <div className="mt-8">
        <Dock />
      </div>
    </div>
  );
}
