'use client'

import { Fragment } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dialog, Transition } from '@headlessui/react'
import {
  HomeIcon,
  ShoppingBagIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline'
import Image from 'next/image'

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Products', href: '/products', icon: ShoppingBagIcon },
  { name: 'Quotes', href: '/quotes', icon: ChatBubbleLeftRightIcon },
]

export default function Sidebar({
  open,
  setOpen,
}: {
  open: boolean
  setOpen: (open: boolean) => void
}) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setOpen}>
          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-900/80" />
            </Transition.Child>

            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <div className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-[#152e1b] px-6 pb-4">
                  <div className="flex h-16 shrink-0 items-center">
                    <Image
                      src="/logo.png"
                      alt="Logo"
                      width={150}
                      height={40}
                      className="h-10"
                    />
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {navigation.map((item) => (
                            <li key={item.name}>
                              <Link
                                href={item.href}
                                className={`
                                  group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold
                                  ${pathname === item.href
                                    ? 'bg-white/10 text-white'
                                    : 'text-gray-200 hover:text-white hover:bg-white/10'
                                  }
                                `}
                              >
                                <item.icon
                                  className="h-6 w-6 shrink-0"
                                  aria-hidden="true"
                                />
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-[#152e1b] px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <Image
              src="/logo.png"
              alt="Logo"
              width={150}
              height={40}
              className="h-10"
            />
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`
                          group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold
                          ${pathname === item.href
                            ? 'bg-white/10 text-white'
                            : 'text-gray-200 hover:text-white hover:bg-white/10'
                          }
                        `}
                      >
                        <item.icon
                          className="h-6 w-6 shrink-0"
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  )
}