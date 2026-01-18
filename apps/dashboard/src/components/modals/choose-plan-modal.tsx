"use client";

import { useI18n } from "@/locales/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import Link from "next/link";
import { Plans } from "../plans";

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
  const t = useI18n();

  const handleClose = (value: boolean) => {
    onOpenChange(value);
  };

  const getTitle = () => {
    if (daysLeft && daysLeft > 0) {
      return t("modals.choose_plan.trial_days_left", { days: daysLeft });
    }

    return hasDiscount ? t("modals.choose_plan.special_offer") : t("modals.choose_plan.title");
  };

  const getDescription = () => {
    if (daysLeft !== undefined) {
      if (daysLeft > 0) {
        return t("modals.choose_plan.trial_ending", { days: daysLeft });
      }

      return t("modals.choose_plan.trial_ended");
    }

    if (hasDiscount && discountPrice) {
      return t("modals.choose_plan.early_customer_discount");
    }

    return t("modals.choose_plan.choose_plan_continue");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[696px]">
        <div className="p-8">
          <DialogHeader>
            <DialogTitle>{getTitle()}</DialogTitle>
          </DialogHeader>
          <DialogDescription className="mb-8">
            {getDescription()}
          </DialogDescription>

          <Plans />

          <p className="text-xs text-muted-foreground mt-4">
            {t("modals.choose_plan.read_only_after")}{" "}
            <Link href="/support">{t("navigation.support")}</Link>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
