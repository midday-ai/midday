import { Transactions } from '@/components/transactions'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Transactions',
  description: 'All your business transactions in one place. Automatically sync and categorize payments from all your connected bank accounts.',
}

export default function Page() {
  return <Transactions />
}

