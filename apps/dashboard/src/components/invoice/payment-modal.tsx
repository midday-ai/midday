"use client";

import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { Spinner } from "@midday/ui/spinner";
import { SubmitButton } from "@midday/ui/submit-button";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceToken: string;
  amount: number;
  currency: string;
  invoiceNumber: string;
  onSuccess?: () => void;
}

interface PaymentFormProps {
  onSuccess?: () => void;
  onCancel: () => void;
  amount: number;
  currency: string;
}

function PaymentForm({
  onSuccess,
  onCancel,
  amount,
  currency,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message || "Payment failed");
      setIsProcessing(false);
    } else {
      // Payment succeeded
      onSuccess?.();
    }
  };

  const formatAmount = (amountInCents: number, curr: string) => {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: curr.toUpperCase(),
    }).format(amountInCents / 100);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-muted/50 rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground mb-1">Amount due</p>
        <p className="text-2xl font-semibold">
          {formatAmount(amount, currency)}
        </p>
      </div>

      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <SubmitButton
          isSubmitting={isProcessing}
          disabled={!stripe || !elements || isProcessing}
        >
          {isProcessing ? "Processing..." : "Pay now"}
        </SubmitButton>
      </div>
    </form>
  );
}

export function PaymentModal({
  open,
  onOpenChange,
  invoiceToken,
  amount,
  currency,
  invoiceNumber,
  onSuccess,
}: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<{
    clientSecret: string;
    stripeAccountId: string;
    amount: number;
    currency: string;
  } | null>(null);

  const initializePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.midday.ai";
      const response = await fetch(
        `${apiUrl}/invoice-payments/payment-intent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: invoiceToken }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to initialize payment");
      }

      const data = await response.json();
      setPaymentData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to initialize payment",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize payment when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !paymentData && !isLoading) {
      initializePayment();
    }
    if (!newOpen) {
      setPaymentData(null);
      setError(null);
    }
    onOpenChange(newOpen);
  };

  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  const stripePromise = paymentData
    ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!, {
        stripeAccount: paymentData.stripeAccountId,
      })
    : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pay Invoice {invoiceNumber}</DialogTitle>
          <DialogDescription>
            Complete your payment securely with Stripe.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Spinner size={24} />
            </div>
          )}

          {error && !isLoading && (
            <div className="text-center py-8">
              <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-md mb-4">
                {error}
              </div>
              <Button variant="outline" onClick={initializePayment}>
                Try again
              </Button>
            </div>
          )}

          {paymentData && stripePromise && !isLoading && !error && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: paymentData.clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: {
                    borderRadius: "8px",
                  },
                },
              }}
            >
              <PaymentForm
                onSuccess={handleSuccess}
                onCancel={() => onOpenChange(false)}
                amount={paymentData.amount}
                currency={paymentData.currency}
              />
            </Elements>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
