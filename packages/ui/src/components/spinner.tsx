import { cn } from "../utils/cn";

const bars = Array(12).fill(0);

export const Spinner = ({
  size = 16,
  className,
}: { size?: number; className?: string }) => {
  return (
    <div className={cn("loading-parent", className)}>
      <div
        className="loading-wrapper"
        data-visible
        // @ts-ignore
        style={{ "--spinner-size": `${size}px` }}
      >
        <div className="spinner">
          {bars.map((_, i) => (
            <div className="loading-bar" key={`spinner-bar-${i.toString()}`} />
          ))}
        </div>
      </div>
    </div>
  );
};
