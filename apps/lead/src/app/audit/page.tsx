/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
/**
 * v0 by Vercel.
 * @see https://v0.dev/t/qf0KaDMqntp
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import { ContactDoc } from "@/components/contact-doc"
import { InboxIcon, TrashIcon, UsersIcon } from "@heroicons/react/24/outline"
import Link from "next/link"

const features = [
    {
        name: 'Identify Growth Opportunities',
        description:
            ' Our audit will help you uncover untapped potential in your business, allowing you to capitalize on new opportunities for growth.',
        href: "https://cal.com/solomonai/15min",
        icon: InboxIcon,
    },
    {
        name: 'Optimize Operations',
        description:
            "We'll provide recommendations to streamline your operations, reduce costs, and improve efficiency.",
        href: "https://cal.com/solomonai/15min",
        icon: UsersIcon,
    },
    {
        name: 'Enhance Competitiveness',
        description:
            'Our audit will help you identify areas where you can improve your business operations, allowing you to stay ahead of the competition.',
        href: "https://cal.com/solomonai/15min",
        icon: TrashIcon,
    },
]

const features2 = [
    {
        name: 'Comprehensive Report',
        description:
            "You'll receive a detailed report outlining our findings, including an analysis of your strengths, weaknesses, and opportunities for growth.",
        href: "https://cal.com/solomonai/15min",
        icon: InboxIcon,
    },
    {
        name: 'Personalized Recommendations',
        description:
            "Our report will include practical strategies and recommendations to help you optimize your operations and improve your bottom line.",
        href: "https://cal.com/solomonai/15min",
        icon: UsersIcon,
    },
    {
        name: 'Free Consultation',
        description:
            "We'll schedule a free consultation to discuss our findings and answer any questions you may have.",
        href: "https://cal.com/solomonai/15min",
        icon: TrashIcon,
    },
]

export default function Component() {
    return (
        <div className="flex flex-col min-h-[100dvh] bg-background text-foreground">
            <main className="flex-1">
                <section className="w-full py-12 md:py-24 lg:py-32 overflow-hidden">
                    <div className="relative isolate px-4 md:px-6 overflow-hidden">
                        <svg
                            aria-hidden="true"
                            className="absolute inset-x-0 top-0 -z-10 h-[64rem] w-full stroke-gray-200 [mask-image:radial-gradient(32rem_32rem_at_center,white,transparent)]"
                        >
                            <defs>
                                <pattern
                                    x="50%"
                                    y={-1}
                                    id="1f932ae7-37de-4c0a-a8b0-a6e3b4d44b84"
                                    width={200}
                                    height={200}
                                    patternUnits="userSpaceOnUse"
                                >
                                    <path d="M.5 200V.5H200" fill="none" />
                                </pattern>
                            </defs>
                            <svg x="50%" y={-1} className="overflow-visible fill-gray-50">
                                <path
                                    d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
                                    strokeWidth={0}
                                />
                            </svg>
                            <rect fill="url(#1f932ae7-37de-4c0a-a8b0-a6e3b4d44b84)" width="100%" height="100%" strokeWidth={0} />
                        </svg>
                        <div
                            aria-hidden="true"
                            className="absolute left-1/2 right-0 top-0 -z-10 -ml-24 transform-gpu overflow-hidden blur-3xl lg:ml-24 xl:ml-48"
                        >
                            <div
                                style={{
                                    clipPath:
                                        'polygon(63.1% 29.5%, 100% 17.1%, 76.6% 3%, 48.4% 0%, 44.6% 4.7%, 54.5% 25.3%, 59.8% 49%, 55.2% 57.8%, 44.4% 57.2%, 27.8% 47.9%, 35.1% 81.5%, 0% 97.7%, 39.2% 100%, 35.2% 81.4%, 97.2% 52.8%, 63.1% 29.5%)',
                                }}
                                className="aspect-[801/1036] w-[50.0625rem] bg-gradient-to-tr from-white to-gray-400 opacity-30"
                            />
                        </div>
                        <div className="overflow-hidden">
                            <div className="mx-auto max-w-7xl px-6 pb-32 pt-36 sm:pt-60 lg:px-8 lg:pt-32">
                                <div className="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
                                    <div className="relative w-full max-w-xl lg:shrink-0 xl:max-w-2xl">
                                        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
                                            Unlock Your Business Potential
                                        </h1>
                                        <p className="mt-6 text-lg leading-8 text-foreground sm:max-w-md lg:max-w-none">
                                            Our comprehensive business health auditing services help you identify growth opportunities and
                                            optimize your operations.
                                        </p>
                                        <div className="mt-10 flex items-center gap-x-6">
                                            <Link
                                                href="https://cal.com/solomonai/15min"
                                                className="rounded-2xl inline-flex h-10 items-center justify-center bg-white px-8 text-sm font-medium text-black shadow transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                                                prefetch={false}
                                            >
                                                Get a Free Audit
                                            </Link>
                                            <Link href="https://cal.com/solomonai/15min" className="text-sm font-semibold leading-6 text-foreground">
                                                Contact Us <span aria-hidden="true">→</span>
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="mt-14 flex justify-end gap-8 sm:-mt-44 sm:justify-start sm:pl-20 lg:mt-0 lg:pl-0">
                                        <div className="ml-auto w-44 flex-none space-y-8 pt-32 sm:ml-0 sm:pt-80 lg:order-last lg:pt-36 xl:order-none xl:pt-80">
                                            <div className="relative">
                                                <img
                                                    alt=""
                                                    src="https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&h=528&q=80"
                                                    className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                                                />
                                                <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                                            </div>
                                        </div>
                                        <div className="mr-auto w-44 flex-none space-y-8 sm:mr-0 sm:pt-52 lg:pt-36">
                                            <div className="relative">
                                                <img
                                                    alt=""
                                                    src="https://images.unsplash.com/photo-1485217988980-11786ced9454?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&h=528&q=80"
                                                    className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                                                />
                                                <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                                            </div>
                                            <div className="relative">
                                                <img
                                                    alt=""
                                                    src="https://images.unsplash.com/photo-1559136555-9303baea8ebd?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&crop=focalpoint&fp-x=.4&w=396&h=528&q=80"
                                                    className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                                                />
                                                <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                                            </div>
                                        </div>
                                        <div className="w-44 flex-none space-y-8 pt-32 sm:pt-0">
                                            <div className="relative">
                                                <img
                                                    alt=""
                                                    src="https://images.unsplash.com/photo-1670272504528-790c24957dda?ixlib=rb-4.0.3&ixid=MnwxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&crop=left&w=400&h=528&q=80"
                                                    className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                                                />
                                                <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                                            </div>
                                            <div className="relative">
                                                <img
                                                    alt=""
                                                    src="https://images.unsplash.com/photo-1670272505284-8faba1c31f7d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&h=528&q=80"
                                                    className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                                                />
                                                <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className='flex justify-center md:pt-[2%]'>
                                    <ContactDoc />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="relative isolate overflow-hidden pt-14">
                    <div
                        aria-hidden="true"
                        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
                    >
                        <div
                            style={{
                                clipPath:
                                    'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                            }}
                            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-white to-gray-400 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
                        />
                    </div>
                    <div className="mx-auto max-w-5xl py-32 sm:py-48 lg:py-56">
                        <div className="hidden sm:mb-8 sm:flex sm:justify-center">
                            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-400 ring-1 ring-white/10 hover:ring-white/20">
                               See some of our previous work.{' '}
                                <Link href="/pitch" className="font-semibold text-white">
                                    <span aria-hidden="true" className="absolute inset-0" />
                                    Read more <span aria-hidden="true">&rarr;</span>
                                </Link>
                            </div>
                        </div>
                        <div className="text-center py-[5%]">
                            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                                Our Comprehensive Approach
                            </h1>
                            <div className="grid md:grid-cols-2 gap-4 md:justify-between">
                                <p className="mt-6 text-lg leading-8 text-gray-300">
                                    Our business health auditing process is designed to provide you with a thorough understanding of your
                                    company's strengths, weaknesses, and opportunities for growth. 
                                </p>
                                <div className="mt-10 flex items-center justify-center gap-x-6">
                                    We'll work closely with you to analyze
                                    your operations, finances, and market positioning, and provide actionable insights to help you
                                    optimize your business.
                                </div>
                            </div>
                        </div>
                    </div>
                    <div
                        aria-hidden="true"
                        className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
                    >
                        <div
                            style={{
                                clipPath:
                                    'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                            }}
                            className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-white to-gray-400 opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
                        />
                    </div>
                </section>
                <section className="relative text-foreground py-24 sm:py-30 isolate">
                    <div
                        aria-hidden="true"
                        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
                    >
                        <div
                            style={{
                                clipPath:
                                    'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                            }}
                            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-white to-gray-400 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
                        />
                    </div>
                    <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12 md:py-24 lg:py-32">
                        <div className="mx-auto max-w-2xl lg:mx-0">
                            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                                The Benefits of Our Audit                            
                            </h2>
                            <p className="mt-6 text-lg leading-8 text-background/20">
                                Our business health auditing services provide a range of benefits to help you take your company to the
                                next level.
                            </p>
                        </div>
                        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                                {features.map((feature) => (
                                    <div key={feature.name} className="flex flex-col">
                                        <dt className="text-base leading-7 text-foreground font-bold">
                                            <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-2xl bg-background border">
                                                <feature.icon aria-hidden="true" className="h-6 w-6 text-foreground" />
                                            </div>
                                            {feature.name}
                                        </dt>
                                        <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-background/20">
                                            <p className="flex-auto">{feature.description}</p>
                                            <p className="mt-6">
                                                <a href={feature.href} className="text-sm font-semibold leading-6 text-foreground">
                                                    Learn more <span aria-hidden="true">→</span>
                                                </a>
                                            </p>
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </div>
                    <div
                        aria-hidden="true"
                        className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
                    >
                        <div
                            style={{
                                clipPath:
                                    'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                            }}
                            className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-white to-gray-400 opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
                        />
                    </div>
                </section>
                <div className="overflow-hidden bg-background py-32 sm:py-40">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
                            <div className="lg:ml-auto lg:pl-4 lg:pt-4">
                                <div className="lg:max-w-lg">
                                   
                                    <dl className="mt-10 max-w-xl space-y-8 text-base leading-7 text- lg:max-w-none">
                                        {features2.map((feature) => (
                                            <div key={feature.name} className="relative pl-9">
                                                <dt className="inline font-semibold text-background">
                                                    <feature.icon aria-hidden="true" className="absolute left-1 top-1 h-6 w-6 text-gray-600" />
                                                    {feature.name}
                                                </dt>{' '}
                                                <dd className="inline">{feature.description}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                </div>
                            </div>
                            <div className="flex items-start justify-end lg:order-first">
                                <div
                                    className="w-[48rem] h-[40rem] flex justify-center items-center max-w-none mx-auto aspect-video overflow-hidden rounded-xl bg-gray-100 sm:w-full lg:order-last"
                                    // className="w-[48rem] max-w-none rounded-xl shadow-xl ring-1 ring-gray-400/10 sm:w-[57rem] bg-gray-200"
                                >
                                    <div className="flex flex-col justify-start items-start md:p-[4%] text-black">
                                        <h2 className="text-base font-semibold leading-7">Stay In Business Longer</h2>
                                        <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">What You Get</p>
                                        <p className="mt-6 text-lg leading-8 text-foreground/20">
                                            Our free business health audit provides you with a comprehensive breakdown of your business and strategies to optimize your bottom line. We'll focus on a struggling portion of your business and offer actionable insights to help you turn things around.
                                        </p>
                                    </div>
                                   
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
