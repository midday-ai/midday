import { TimeTracking } from '@/components/time-tracking'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Time Tracker',
  description: 'Track your hours with ease and gain a clear monthly breakdown of billable amounts. Link tracked time to customers and generate invoices.',
}

export default function Page() {
  return <TimeTracking />
}

