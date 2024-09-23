import { Button } from "@midday/ui/button";

interface UpgradeTierProps {
  message?: string;
}

export const UpgradeTier: React.FC<UpgradeTierProps> = ({
  message = "Please upgrade your tier to access detailed financial insights and analytics.",
}) => {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <h3 className="text-xl font-semibold mb-4">Upgrade Your Account</h3>
      <p className="text-center mb-6">{message}</p>
      <Button variant="default">Upgrade Now</Button>
    </div>
  );
};