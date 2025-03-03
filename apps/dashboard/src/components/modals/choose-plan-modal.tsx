"use client";

import { UTCDate } from "@date-fns/utc";
import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";

export function ChoosePlanModal({
  isOpen,
  onOpenChange,
  daysLeft,
  hasDiscount,
  discountPrice,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  daysLeft?: number;
  hasDiscount?: boolean;
  discountPrice?: number;
}) {
  const getTitle = () => {
    if (daysLeft && daysLeft > 0) {
      return `Pro trial - ${daysLeft} days left`;
    }

    return hasDiscount ? "Special Discount Offer" : "Choose plan";
  };

  const getDescription = () => {
    if (daysLeft !== undefined) {
      if (daysLeft > 0) {
        return `Your trial will end in ${daysLeft} days.`;
      }
      return "Your trial period has ended. Please choose a plan to continue using all features.";
    }

    if (hasDiscount && discountPrice) {
      const saveAmount = 99 - discountPrice;
      const savePercentage = Math.round((saveAmount / 99) * 100);

      return `As a valued early customer, you qualify for our special discount pricing. Get the Pro plan for $${discountPrice}/month instead of the regular $99/month and save ${savePercentage}%.`;
    }

    return "Choose a plan to continue using Midday.";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[696px]">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>{getTitle()}</DialogTitle>
          </DialogHeader>
          <DialogDescription>{getDescription()}</DialogDescription>
          {hasDiscount && discountPrice && (
            <div className="mt-6 px-4 py-3 bg-muted rounded-lg border border-primary/20">
              <p className="text-sm font-medium text-primary">
                Loyalty Discount: Pro plan for ${discountPrice}/month
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Based on your team's registration date, you qualify for this
                special rate. This discount is locked in for the lifetime of
                your subscription.
              </p>
              <div className="mt-4 flex flex-col space-y-2">
                <div className="grid grid-cols-2 text-xs">
                  <div>Regular price:</div>
                  <div className="text-right line-through">$99/month</div>
                  <div>Your price:</div>
                  <div className="text-right font-medium text-primary">
                    ${discountPrice}/month
                  </div>
                  <div>You save:</div>
                  <div className="text-right text-green-600">
                    ${99 - discountPrice}/month
                  </div>
                </div>
                <Button
                  className="w-full mt-4"
                  onClick={() => onOpenChange(false)}
                >
                  Get Pro Plan (${discountPrice}/month)
                </Button>
              </div>
            </div>
          )}

          {(!hasDiscount || !discountPrice) &&
            daysLeft !== undefined &&
            daysLeft <= 0 && (
              <div className="mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Starter</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      For freelancers and solo users
                    </p>
                    <p className="text-xl font-medium mb-4">
                      $29<span className="text-sm font-normal">/month</span>
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => onOpenChange(false)}
                    >
                      Choose Starter
                    </Button>
                  </div>
                  <div className="p-4 border border-primary rounded-lg bg-primary/5">
                    <h3 className="font-medium mb-2">Pro</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      For teams and growing businesses
                    </p>
                    <p className="text-xl font-medium mb-4">
                      $99<span className="text-sm font-normal">/month</span>
                    </p>
                    <Button
                      className="w-full"
                      onClick={() => onOpenChange(false)}
                    >
                      Choose Pro
                    </Button>
                  </div>
                </div>
              </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
