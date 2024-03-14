import { CardStack } from "./card-stack";
import { Dock } from "./dock";

export function Screens() {
  return (
    <div className="flex items-center justify-center mt-24 flex-col">
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

      <div className="mt-8">
        <Dock />
      </div>
    </div>
  );
}
