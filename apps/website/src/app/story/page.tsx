import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "Why we built Abacus. Learn how we're leveling the playing field for funding operators, giving mom and pop shops the same tools as the big players.",
};

export default function StoryPage() {
  return (
    <div className="min-h-screen">
      <div className="pt-32 pb-16 sm:pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {/* Title */}
            <div className="space-y-4 text-center">
              <h1 className="font-serif text-3xl lg:text-3xl xl:text-3xl 2xl:text-3xl 3xl:text-4xl leading-tight lg:leading-tight xl:leading-[1.3] text-foreground">
                Why we started Abacus
              </h1>
            </div>

            {/* Content */}
            <div className="prose prose-sm sm:prose-base max-w-none space-y-8 font-sans text-foreground">
                {/* Where we started */}
                <section className="space-y-4">
                  <h2 className="font-sans text-base text-foreground">
                    Where we started
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We started with two small funding businesses. Two operators
                    juggling spreadsheets, chasing payments, and trying to stay
                    on top of their portfolios the same way everyone else
                    was — manually.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    What struck us wasn't just the inefficiency. It was the gap
                    between how small operators were forced to work and the
                    polished, professional experience that larger players could
                    offer their merchants. The big funds had custom software,
                    branded portals, and automated workflows. Everyone else had
                    Google Sheets and a lot of phone calls.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    That didn't seem right. The funding industry is built on
                    relationships and hustle, not who can afford a $50,000
                    software build. We believed the best operators should win on
                    their ability to serve merchants well — not on their IT
                    budget.
                  </p>
                </section>

                {/* Divider */}
                <div className="flex items-center justify-center py-8">
                  <div className="h-px w-full max-w-xs border-t border-border" />
                </div>

                {/* The idea */}
                <section className="space-y-4">
                  <h2 className="font-sans text-base text-foreground">
                    Leveling the playing field
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Abacus exists to give every funding operator — from a one-person
                    shop to a growing team — the same tools and experience that
                    the big players have. Better, actually.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    When a merchant logs into your branded portal to check their
                    balance and make a payment, they don't know if you're
                    funding $5 million a year or $500 million. They just see a
                    professional operation that has their information ready and
                    makes their life easier.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    That's the experience every funding operator should be able to
                    offer. Not because they have deep pockets for custom
                    development, but because Abacus gives it to them out of the
                    box.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    We're not just building portfolio software. We're building
                    the infrastructure that lets any funding operator run like a
                    $100 million fund — with the visibility, automation, and
                    professionalism that used to be reserved for the top tier.
                  </p>
                </section>

                {/* Divider */}
                <div className="flex items-center justify-center py-8">
                  <div className="h-px w-full max-w-xs border-t border-border" />
                </div>

                {/* A better ecosystem */}
                <section className="space-y-4">
                  <h2 className="font-sans text-base text-foreground">
                    A better ecosystem for everyone
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    When you can track your portfolio better, you give better
                    service to your merchants. When your merchants have a better
                    experience — clear information, easy payments, professional
                    interactions — everyone wins. The whole ecosystem gets
                    healthier.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    That's what we're focused on: automation, simplification,
                    and creating a genuinely good experience for operators and
                    merchants alike.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Less time chasing spreadsheets means more time building
                    relationships. Less friction for merchants means fewer
                    problems and faster payments. Better tools mean better
                    outcomes — for you and everyone you work with.
                  </p>
                </section>

                {/* Divider */}
                <div className="flex items-center justify-center py-8">
                  <div className="h-px w-full max-w-xs border-t border-border" />
                </div>

                {/* Where we are now */}
                <section className="space-y-4">
                  <h2 className="font-sans text-base text-foreground">
                    Where we are now
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    What started with two small businesses has slowly expanded
                    to hundreds of funding operators using Abacus to manage their
                    portfolios, serve their merchants, and grow their
                    businesses.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    We've watched operators go from drowning in spreadsheets to
                    knowing exactly where they stand at any moment. We've seen
                    them offer their merchants a professional experience that
                    builds trust and reduces friction. We've helped them catch
                    problems early, collect faster, and spend less time on admin
                    so they can focus on what they do best — funding deals and
                    building relationships.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Every feature we build comes from this mission: simplify the
                    funding experience, so any operator can compete with anyone.
                  </p>
                  <p className="text-muted-foreground leading-relaxed font-medium">
                    The best operators should win. We're here to make sure the
                    tools aren't what's holding you back.
                  </p>
                </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
