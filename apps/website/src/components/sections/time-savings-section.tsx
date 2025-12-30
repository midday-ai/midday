'use client'

import { useRouter } from 'next/navigation'
import { MaterialIcon } from '../homepage/icon-mapping'

export function TimeSavingsSection() {
  const router = useRouter()

  return (
    <section className="bg-background py-12 sm:py-16 lg:py-24">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-8">
        <div className="text-center space-y-4 mb-12">
          <h2 className="font-serif text-2xl sm:text-2xl text-foreground">
            Less admin. More focus.
          </h2>
          <p className="font-sans text-base text-muted-foreground leading-normal max-w-2xl mx-auto">
            Midday removes manual financial work so you can spend time on what actually matters.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            <article className="group relative overflow-hidden bg-background border border-border p-4 sm:p-5 hover-bg hover-border transition-all duration-200 cursor-pointer">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center bg-secondary border border-border">
                  <MaterialIcon name="receipt" className="text-muted-foreground" size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs  tracking-wide text-muted-foreground">
                    Chasing receipts
                  </p>
                  <h3 className="mt-1 text-base sm:text-lg text-foreground">
                    45 minutes per week
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Receipts arrive late, get lost, or need follow-ups.
                  </p>
                </div>
              </div>
            </article>

            <article className="group relative overflow-hidden bg-background border border-border p-4 sm:p-5 hover-bg hover-border transition-all duration-200 cursor-pointer">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center bg-secondary border border-border">
                  <MaterialIcon name="label" className="text-muted-foreground" size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs  tracking-wide text-muted-foreground">
                    Cleaning transactions
                  </p>
                  <h3 className="mt-1 text-base sm:text-lg text-foreground">
                    1 hour per week
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Categorizing, fixing duplicates, and making numbers line up.
                  </p>
                </div>
              </div>
            </article>

            <article className="group relative overflow-hidden bg-background border border-border p-4 sm:p-5 hover-bg hover-border transition-all duration-200 cursor-pointer hidden xl:block">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center bg-secondary border border-border">
                  <MaterialIcon name="request_quote" className="text-muted-foreground" size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs  tracking-wide text-muted-foreground">
                    Preparing invoices
                  </p>
                  <h3 className="mt-1 text-base sm:text-lg text-foreground">
                    1–2 hours per week
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Creating invoices, checking payments, and answering questions.
                  </p>
                </div>
              </div>
            </article>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-10 gap-3 sm:gap-4">
            <article
              onClick={() => router.push('/file-storage')}
              className="group relative overflow-hidden bg-background border border-border p-4 sm:p-5 hover-bg hover-border transition-all duration-200 cursor-pointer xl:col-span-3"
            >
              <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center bg-secondary border border-border">
                  <MaterialIcon name="folder" className="text-muted-foreground" size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs  tracking-wide text-muted-foreground">
                    Explaining the numbers
                  </p>
                  <h3 className="mt-1 text-base sm:text-lg text-foreground">
                    1 hour per week
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pulling data together and explaining what changed and why.
                  </p>
                </div>
              </div>
            </article>

            <article className="group relative overflow-hidden bg-background border border-border p-4 sm:p-5 hover-bg hover-border transition-all duration-200 cursor-pointer xl:hidden">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center bg-secondary border border-border">
                  <MaterialIcon name="request_quote" className="text-muted-foreground" size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs  tracking-wide text-muted-foreground">
                    Preparing invoices
                  </p>
                  <h3 className="mt-1 text-base sm:text-lg text-foreground">
                    1–2 hours per week
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Creating invoices, checking payments, and answering questions.
                  </p>
                </div>
              </div>
            </article>

            <article
              onClick={() => router.push('/login')}
              className="relative overflow-hidden bg-secondary border border-border p-4 sm:p-5 md:p-5 lg:p-6 transition-all duration-200 cursor-pointer group hidden xl:block xl:col-span-7 hover:border-muted-foreground"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs tracking-wide/loose text-muted-foreground transition-colors duration-200">
                    <span className="group-hover:hidden transition-opacity duration-200">
                      As things add up
                    </span>
                    <span className="hidden group-hover:inline transition-opacity duration-200">
                      What changes
                    </span>
                  </p>
                  <p className="mt-1 text-base sm:text-lg text-foreground transition-colors duration-200">
                    <span className="group-hover:hidden transition-opacity duration-200">
                      What disappears over time
                    </span>
                    <span className="hidden group-hover:inline transition-opacity duration-200">
                      Get your time back
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground transition-colors duration-200">
                    <span className="group-hover:hidden transition-opacity duration-200">
                      Manual financial work caused by disconnected tools.
                    </span>
                    <span className="hidden group-hover:inline transition-opacity duration-200">
                      Midday handles the financial busywork so you can focus on running the business.
                    </span>
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-4xl sm:text-5xl text-foreground transition-colors duration-200">
                    4–6 hours
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:hidden">
            <article
              onClick={() => router.push('/login')}
              className="relative overflow-hidden bg-secondary border border-border p-4 sm:p-5 md:p-5 lg:p-6 transition-all duration-200 cursor-pointer group hover:border-muted-foreground"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs tracking-wide/loose text-muted-foreground transition-colors duration-200">
                    <span className="group-hover:hidden transition-opacity duration-200">
                      As things add up
                    </span>
                    <span className="hidden group-hover:inline transition-opacity duration-200">
                      What changes
                    </span>
                  </p>
                  <p className="mt-1 text-base sm:text-lg text-foreground transition-colors duration-200">
                    <span className="group-hover:hidden transition-opacity duration-200">
                      What disappears over time
                    </span>
                    <span className="hidden group-hover:inline transition-opacity duration-200">
                      Get your time back
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground transition-colors duration-200">
                    <span className="group-hover:hidden transition-opacity duration-200">
                      Manual financial work caused by disconnected tools.
                    </span>
                    <span className="hidden group-hover:inline transition-opacity duration-200">
                      Midday handles the financial busywork so you can focus on running the business.
                    </span>
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-4xl sm:text-5xl text-foreground transition-colors duration-200">
                    4–6 hours
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}

