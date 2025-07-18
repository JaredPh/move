import { useState, type PropsWithChildren } from 'react'
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  TransitionChild,
} from '@headlessui/react'
import * as outline from '@heroicons/react/24/outline'
import config, { type RouteId } from '../config'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { classNames } from '../utils'

type Props = {
  routeId: RouteId
}

export default function Layout({ routeId, children }: PropsWithChildren<Props>) {
  const { user, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = Object.values(config.routes).filter((route) => route.type === 'page' && route.navigation)

  return (
    <>
      <div>
        <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50 xl:hidden">
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-[closed]:opacity-0"
          />

          <div className="fixed inset-0 flex">
            <DialogPanel
              transition
              className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-[closed]:-translate-x-full"
            >
              <TransitionChild>
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5 duration-300 ease-in-out data-[closed]:opacity-0">
                  <button type="button" onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5">
                    <span className="sr-only">Close sidebar</span>
                    <outline.XMarkIcon aria-hidden="true" className="size-6 text-white" />
                  </button>
                </div>
              </TransitionChild>

              {/* Sidebar component, swap this element with another sidebar if you like */}
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 ring-1 ring-white/10">
                <div className="flex h-16 shrink-0 items-center">
                  <img
                    alt="Your Company"
                    src="/move/logo.png"
                    className="h-8 w-auto"
                  />
                </div>
                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {navigation.map((item) => (
                          <li key={item.name}>
                            <Link
                              to={item.path}
                              className={classNames(
                                routeId === item.id
                                  ? 'bg-gray-800 text-white'
                                  : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                                'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                              )}
                            >
                              <item.icon aria-hidden="true" className="size-6 shrink-0" />
                              {item.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                    <li className="-mx-6 mt-auto">
                      <a
                        onClick={() => { signOut() }}
                        className="flex items-center gap-x-4 px-6 py-3 text-sm/6 font-semibold text-white hover:bg-gray-800"
                      >
                        <img
                          alt=""
                          src={user?.user_metadata.avatar_url || '/move/default-avatar.png'}
                          className="size-8 rounded-full bg-gray-800"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            if (!e.currentTarget.src.includes('default-avatar.png')) {
                              e.currentTarget.src = '/move/default-avatar.png'
                            }
                          }}
                        />
                        <span className="sr-only">Your profile</span>
                        <span aria-hidden="true">{user?.user_metadata.full_name}</span>
                      </a>
                    </li>
                  </ul>
                </nav>
              </div>
            </DialogPanel>
          </div>
        </Dialog>

        {/* Static sidebar for desktop */}
        <div className="hidden xl:fixed xl:inset-y-0 xl:z-50 xl:flex xl:w-72 xl:flex-col">
          {/* Sidebar component, swap this element with another sidebar if you like */}
          <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-black/10 px-6 ring-1 ring-white/5">
            <div className="flex h-16 shrink-0 items-center">
              <img
                alt="Your Company"
                src="/move/logo.png"
                className="h-8 w-auto"
              />
            </div>
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {navigation.map((item) => (
                      <li key={item.name}>
                        <Link
                          to={item.path}
                          className={classNames(
                            routeId === item.id
                              ? 'bg-gray-800 text-white'
                              : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                            'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                          )}
                        >
                          <item.icon aria-hidden="true" className="size-6 shrink-0" />
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
                <li className="-mx-6 mt-auto">
                  <a
                    onClick={() => { signOut() }}
                    className="flex items-center gap-x-4 px-6 py-3 text-sm/6 font-semibold text-white hover:bg-gray-800"
                  >
                    <img
                      alt=""
                      src={user?.user_metadata.avatar_url || '/move/default-avatar.png'}
                      className="size-8 rounded-full bg-gray-800"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        if (!e.currentTarget.src.includes('default-avatar.png')) {
                          e.currentTarget.src = '/move/default-avatar.png'
                        }
                      }}
                    />
                    <span className="sr-only">Your profile</span>
                    <span aria-hidden="true">{user?.user_metadata.full_name}</span>
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="xl:pl-72">
          {/* Mobile header */}
          <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-x-4 border-b border-gray-800 bg-gray-900 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 xl:hidden">
            {/* Logo for mobile header */}
            <div className="flex items-center">
              <img
                alt="Your Company"
                src="/move/logo.png"
                className="h-8 w-auto"
              />
            </div>
            
            <button type="button" onClick={() => setSidebarOpen(true)} className="-m-2.5 p-2.5 text-gray-300 hover:text-white lg:hidden">
              <span className="sr-only">Open sidebar</span>
              <outline.Bars3Icon aria-hidden="true" className="size-6" />
            </button>
          </div>

          {children}
        </div>
      </div>
    </>
  )
}