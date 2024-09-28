import { Card } from "@midday/ui/card";
import { cn } from "@midday/ui/cn";
import { EmptyState } from "../charts/empty-state";

interface PortalViewWrapperProps {
  title: string;
  description: string;
  subtitle?: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const PortalViewWrapper: React.FC<PortalViewWrapperProps> = ({
  title,
  description,
  subtitle,
  children,
  disabled,
  className,
}) => {
  return (
    <Card className={cn("my-4 p-[2%]", className)}>
      <div className="mt-8">
        {disabled && <EmptyState />}

        <div className={cn(disabled && "blur-[8px] opacity-20")}>
          <div className="flex flex-row justify-between">
            <p className="text-base font-semibold leading-7 text-blue-600 md:pt-[1.5%]">
              Solomon AI
            </p>
          </div>
          <h2 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            {title}
          </h2>
          <p className="mt-6 text-lg leading-8 text-foreground/3">
            {description}
          </p>
          {subtitle && (
            <div>
              <h2 className="py-5 text-2xl font-bold tracking-tight">
                {subtitle}
              </h2>
            </div>
          )}
          <div className="md:pt-5">{children}</div>
        </div>
      </div>
    </Card>
  );
};
