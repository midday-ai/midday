import { Customers } from '@/components/customers'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Customers',
  description: 'Know your customers better. Track customer performance, payment history, and outstanding invoices all in one place.',
}

export default function Page() {
  return <Customers />
}

