import { Inbox } from '@/components/inbox'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Inbox',
  description: 'Use your personalized email for invoices and receipts, with transaction suggestions from Midday. Easily search, reconcile and export documents.',
}

export default function Page() {
  return <Inbox />
}

