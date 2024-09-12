import Link from 'next/link'

import { Icons } from '@midday/ui/icons'
import { DiscordLogoIcon, TwitterLogoIcon } from '@radix-ui/react-icons'
import BeehiivEmbed from '../forms/beehive-form'

const footerNavs = [
    {
        label: 'Product',
        items: [
            {
                href: '/',
                name: 'Email Collection',
            },
            {
                href: '/pricing',
                name: 'Pricing',
            },
            {
                href: '/faq',
                name: 'FAQ',
            },
        ],
    },
    {
        label: 'Community',
        items: [
            {
                href: 'https://www.youtube.com/@solomonai',
                name: 'Youtube',
            },
            {
                href: 'https://x.com/solomonai',
                name: 'X',
            },
            {
                href: 'mailto:hello@chatcollect.com',
                name: 'Email',
            },
        ],
    },
    {
        label: 'Legal',
        items: [
            {
                href: 'https://solomon-ai.app/terms',
                name: 'Terms',
            },

            {
                href: 'https://solomon-ai.app/privacy',
                name: 'Privacy',
            },
        ],
    },
]

const footerSocials = [
    {
        href: '',
        name: 'Discord',
        icon: <DiscordLogoIcon className='h-4 w-4' />,
    },
    {
        href: '',
        name: 'Twitter',
        icon: <TwitterLogoIcon className='h-4 w-4' />,
    },
]

export function SiteFooter() {
    return (
        <footer>
            <div className='mx-auto w-full max-w-screen-xl xl:pb-2'>
                <div className='md:flex md:justify-between px-8 p-4 py-16 sm:pb-16 gap-4'>
                    <div className='mb-12 flex-col flex gap-4'>
                        <Link href='/' className='flex items-center gap-2'>
                            <Icons.Logo className='h-8 w-8 text-primary' />
                            <span className='self-center text-2xl font-semibold whitespace-nowrap dark:text-white'>
                                Solomon AI
                            </span>
                        </Link>
                        <p className='max-w-xs'>
                            Helping you scale your business
                        </p>
                        <BeehiivEmbed src="https://embeds.beehiiv.com/aa7a2a0b-4d44-4b4f-afd5-02af1399c5fd?slim=true"  />
                    </div>
                    <div className='grid grid-cols-1 gap-8 sm:gap-10 sm:grid-cols-3'>
                        {footerNavs.map((nav) => (
                            <div key={nav.label}>
                                <h2 className='mb-6 text-sm tracking-tighter font-medium text-gray-900 uppercase dark:text-white'>
                                    {nav.label}
                                </h2>
                                <ul className='gap-2 grid'>
                                    {nav.items.map((item) => (
                                        <li key={item.name}>
                                            <Link
                                                href={item.href}
                                                className='cursor-pointer text-gray-400 hover:text-gray-200 duration-200 font-[450] text-sm'
                                            >
                                                {item.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <div className='flex flex-col sm:flex-row sm:flex sm:items-center sm:justify-between rounded-md border-neutral-700/20 py-4 px-8 gap-2'>
                    <div className='flex space-x-5 sm:justify-center sm:mt-0'>
                        {footerSocials.map((social) => (
                            <Link
                                key={social.name}
                                href={social.href}
                                className='text-gray-500 hover:text-gray-900 dark:hover:text-gray-600 fill-gray-500 hover:fill-gray-900 dark:hover:fill-gray-600'
                            >
                                {social.icon}
                                <span className='sr-only'>{social.name}</span>
                            </Link>
                        ))}
                    </div>
                    <span className='text-sm text-gray-500 sm:text-center dark:text-gray-400'>
                        Copyright © {new Date().getFullYear()}{' '}
                        <Link href='/' className='cursor-pointer'>
                            Solomon AI
                        </Link>
                        . All Rights Reserved.
                    </span>
                </div>
            </div>
            {/*   <SiteBanner /> */}
        </footer>
    )
}
