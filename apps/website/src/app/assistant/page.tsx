import { Assistant } from '@/components/assistant'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Assistant',
  description: 'Your AI-powered financial assistant. Ask questions about your business and get clear, actionable answers based on your real financial data.',
}

export default function Page() {
  return <Assistant />
}

