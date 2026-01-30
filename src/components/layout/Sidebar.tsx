import { ReactNode } from 'react'

interface SidebarProps {
  children: ReactNode
}

export default function Sidebar({ children }: SidebarProps) {
  return (
    <aside className="w-full lg:w-80 flex-shrink-0">
      <div className="sidebar-sticky space-y-6">
        {children}
      </div>
    </aside>
  )
}

// Sidebar Widget Container
interface SidebarWidgetProps {
  title: string
  children: ReactNode
  className?: string
}

export function SidebarWidget({ title, children, className = '' }: SidebarWidgetProps) {
  return (
    <div className={`widget-card ${className}`}>
      <div className="widget-header">
        <h3>{title}</h3>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}

// Sidebar Ad Placeholder
interface SidebarAdProps {
  width?: number
  height?: number
}

export function SidebarAd({ width = 300, height = 250 }: SidebarAdProps) {
  return (
    <div
      className="bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-sm transition-all hover:border-gray-300"
      style={{ width: '100%', height }}
    >
      <div className="text-center">
        <svg
          className="w-10 h-10 mx-auto mb-2 opacity-40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-xs font-medium">Iklan {width}x{height}</p>
      </div>
    </div>
  )
}
