import type { Stripe } from 'stripe';
import type { StripeTransactionType } from './types';

/**
 * Maps a Stripe transaction type string to a StripeTransactionType.
 * @param type - The Stripe transaction type as a string.
 * @returns The corresponding StripeTransactionType or 'other' if not recognized.
 */
export function mapStripeTransactionType(type: string): StripeTransactionType {
  switch (type) {
    case 'charge':
    case 'refund':
    case 'adjustment':
    case 'application_fee':
    case 'application_fee_refund':
    case 'transfer':
    case 'payment':
    case 'payout':
      return type as StripeTransactionType;
    default:
      return 'other';
  }
}

/**
 * Determines the transaction method based on the Stripe balance transaction type.
 * @param transaction - The Stripe balance transaction object.
 * @returns A string representing the transaction method.
 */
export function getStripeTransactionMethod(transaction: Stripe.BalanceTransaction): string {
  if (transaction.type === 'charge' || transaction.type === 'payment') {
    return 'card_purchase';
  } else if (transaction.type === 'payout') {
    return 'transfer';
  } else if (transaction.type === 'refund') {
    return 'refund';
  } else {
    return 'other';
  }
}

/**
 * Formats a Stripe amount from cents to standard currency units.
 * @param amount - The amount in cents.
 * @returns The formatted amount in standard currency units.
 */
export function formatStripeAmount(amount: number): number {
  return amount / 100; // Stripe amounts are in cents
}

/**
 * Generates a human-readable name for a Stripe transaction.
 * @param transaction - The Stripe balance transaction object.
 * @returns A string representing the transaction name.
 */
export function getStripeTransactionName(transaction: Stripe.BalanceTransaction): string {
  if (transaction.description) {
    return transaction.description;
  } else if (transaction.type === 'charge') {
    return 'Card Charge';
  } else if (transaction.type === 'payout') {
    return 'Payout';
  } else if (transaction.type === 'refund') {
    return 'Refund';
  } else {
    return `Stripe ${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}`;
  }
}

/**
 * Determines the status of a Stripe transaction.
 * @param transaction - The Stripe balance transaction object.
 * @returns 'posted' if the transaction is available, 'pending' otherwise.
 */
export function getStripeTransactionStatus(transaction: Stripe.BalanceTransaction): 'posted' | 'pending' {
  return transaction.status === 'available' ? 'posted' : 'pending';
}
