import { Download } from '@/components/download'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Download',
  description: 'Download Midday for Mac. Your finances, always one click away. Access your business data directly from your desktop.',
}

export default function Page() {
  return <Download />
}

