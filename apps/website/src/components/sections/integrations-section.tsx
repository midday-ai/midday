'use client'

import Image from 'next/image'

export interface Integration {
  name: string
  icon: string
  alt: string
}

interface IntegrationsSectionProps {
  title?: string
  subtitle?: string
  integrations?: Integration[]
}

const defaultIntegrations: Integration[] = [
  { name: 'Gmail', icon: '/images/gmail.svg', alt: 'Gmail' },
  { name: 'Outlook', icon: '/images/outlook.svg', alt: 'Outlook' },
  { name: 'WhatsApp', icon: '/images/whatsapp.svg', alt: 'WhatsApp' },
  { name: 'Google Drive', icon: '/images/gdrive.svg', alt: 'Google Drive' },
  { name: 'Dropbox', icon: '/images/dropbox.svg', alt: 'Dropbox' },
  { name: 'Slack', icon: '/images/slack.svg', alt: 'Slack' },
  { name: 'Stripe', icon: '/images/stripe.svg', alt: 'Stripe' },
  { name: 'Xero', icon: '/images/xero.svg', alt: 'Xero' },
  { name: 'QuickBooks', icon: '/images/quickbooks.svg', alt: 'QuickBooks' },
  { name: 'Fortnox', icon: '/images/fortnox.svg', alt: 'Fortnox' },
]

export function IntegrationsSection({
  title = 'Works with the tools you already use',
  subtitle = 'Connect your banks, email, payments, and accounting software in minutes.',
  integrations = defaultIntegrations,
}: IntegrationsSectionProps) {
  return (
    <section className="bg-background py-12 sm:py-16 lg:py-24">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center space-y-4 mb-10">
          <h2 className="font-serif text-2xl sm:text-2xl text-foreground">
            {title}
          </h2>
          <p className="font-sans text-base text-muted-foreground leading-normal">
            {subtitle}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {integrations.map((integration) => (
            <div
              key={integration.name}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-background"
            >
              <Image
                src={integration.icon}
                alt={integration.alt}
                width={16}
                height={16}
                className="object-contain"
              />
              <span className="font-sans text-sm text-foreground">
                {integration.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

