import { type PropsWithChildren } from 'react'

type Props = {
  button?: {
    label: string
    onClick: () => void
  }
}

export default function Header({ children, button }: PropsWithChildren<Props>) {
  return (
    <main>
      <header className="flex items-center justify-between border-b border-white/5 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <h1 className="text-base/7 font-semibold text-white">{children}</h1>

        {button && (
          <button
            type="button"
            className="block rounded-md bg-indigo-500 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            onClick={button.onClick}
          >
            {button.label}
          </button>
        )}
      </header>
    </main>
  )
}