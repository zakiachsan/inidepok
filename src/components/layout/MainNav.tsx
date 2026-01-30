'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface NavItem {
  title: string
  url: string
  icon?: 'home'
}

interface Category {
  name: string
  slug: string
}

export default function MainNav() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [navItems, setNavItems] = useState<NavItem[]>([
    { title: 'Home', url: '/', icon: 'home' },
  ])

  // Fetch categories from API
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories')
        const data = await response.json()

        if (data.categories && data.categories.length > 0) {
          const categoryItems: NavItem[] = data.categories.map((cat: Category) => ({
            title: cat.name,
            url: `/category/${cat.slug}`,
          }))

          setNavItems([
            { title: 'Home', url: '/', icon: 'home' },
            ...categoryItems,
          ])
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }

    fetchCategories()
  }, [])

  // Detect scroll for glassmorphism effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Check initial state

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <nav
      className={cn(
        'transition-all duration-300 border-b',
        isScrolled
          ? 'glass shadow-lg border-gray-200'
          : 'bg-gray-50 shadow-sm border-gray-200'
      )}
    >
      <div className="container">
        <div className="flex items-center justify-between gap-4">
          {/* Navigation Items */}
          <ul className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1 min-w-0 py-1">
            {navItems.map((item) => {
              const isActive = pathname === item.url ||
                (item.url !== '/' && pathname.startsWith(item.url))

              return (
                <li key={item.url} className="flex-shrink-0">
                  <Link
                    href={item.url}
                    className={cn(
                      'group relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all duration-200 rounded-lg',
                      isActive
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-100'
                    )}
                  >
                    {item.icon === 'home' && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                    )}
                    {item.title}
                    {/* Active/Hover indicator line */}
                    <span
                      className={cn(
                        'absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-300',
                        isActive
                          ? 'w-8 bg-primary-500'
                          : 'w-0 group-hover:w-6 group-hover:bg-primary-400'
                      )}
                    />
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Search */}
          <div className="hidden md:flex items-center">
            <form action="/search" method="GET" className="relative flex">
              <div
                className={cn(
                  'flex items-center rounded-full overflow-hidden transition-all duration-300 bg-white border border-gray-200',
                  searchFocused && 'ring-2 ring-primary-500 shadow-lg'
                )}
              >
                <input
                  type="text"
                  name="q"
                  placeholder="Cari berita..."
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="w-36 focus:w-48 px-4 py-2 text-sm bg-transparent border-0 outline-none transition-all duration-300 text-gray-900 placeholder-gray-500"
                />
                <button
                  type="submit"
                  className="px-3 py-2 transition-colors duration-200 text-gray-500 hover:text-primary-600"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>
          </div>

          {/* Mobile Search Toggle */}
          <Link
            href="/search"
            className="md:hidden p-3 rounded-lg transition-colors text-gray-600 hover:text-primary-600 hover:bg-gray-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </Link>
        </div>
      </div>
    </nav>
  )
}
