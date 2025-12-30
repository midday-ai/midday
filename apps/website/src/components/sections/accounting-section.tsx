'use client'

import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { MaterialIcon } from '../homepage/icon-mapping'

export function AccountingSection() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const isLightMode = mounted && resolvedTheme ? resolvedTheme !== 'dark' : true

  return (
    <section className="bg-background py-12 sm:py-16 lg:py-24">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-8">
        <div className="text-center space-y-4 mb-12">
          <div className="h-[100px] w-28 mx-auto mb-8">
            <Image
              src={
                isLightMode
                  ? '/images/accounting-light.png'
                  : '/images/accounting-dark.png'
              }
              alt="Accounting Icon"
              width={112}
              height={100}
              className="w-full h-full object-contain rounded-none"
            />
          </div>
          <h2 className="font-serif text-xl sm:text-2xl text-foreground">
            Ready for accounting, without extra work
          </h2>
          <p className="font-sans text-base text-muted-foreground max-w-2xl mx-auto">
            Receipts, invoices, and transactions stay organized automatically so your books are always ready when you need them.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-secondary border border-border p-6 relative">
            <div className="space-y-6">
              {/* Section 1 */}
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                  <MaterialIcon name="check" className="text-foreground" size={14} />
                </div>
                <span className="font-sans text-sm text-foreground">
                  Transactions from 25,000+ banks are categorized and reconciled automatically
                </span>
              </div>

              {/* Section 2 */}
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                  <MaterialIcon name="check" className="text-foreground" size={14} />
                </div>
                <span className="font-sans text-sm text-foreground">
                  Receipts and invoices are pulled from email and payments, then matched to transactions
                </span>
              </div>

              {/* Section 3 */}
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                  <MaterialIcon name="check" className="text-foreground" size={14} />
                </div>
                <span className="font-sans text-sm text-foreground">
                  Clean records across all connected accounts
                </span>
              </div>

              {/* Section 4 */}
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                  <MaterialIcon name="check" className="text-foreground" size={14} />
                </div>
                <span className="font-sans text-sm text-foreground">
                  Taxes are tracked per transaction
                </span>
              </div>

              {/* Section 5 */}
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                  <MaterialIcon name="check" className="text-foreground" size={14} />
                </div>
                <span className="font-sans text-sm text-foreground">
                  Export-ready for your accounting system
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

