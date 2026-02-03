import Link from 'next/link'

interface PaginationProps {
  currentPage: number
  totalPages: number
  baseUrl: string
}

export function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  // Don't render if only 1 page
  if (totalPages <= 1) return null

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)
      
      // Calculate range around current page
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)
      
      // Add ellipsis if gap at start
      if (start > 2) pages.push('...')
      
      // Add pages around current
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      // Add ellipsis if gap at end
      if (end < totalPages - 1) pages.push('...')
      
      // Always show last page
      pages.push(totalPages)
    }
    
    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1 mt-8">
      {/* Previous Button */}
      <Link
        href={`${baseUrl}${currentPage > 1 ? `?page=${currentPage - 1}` : ''}`}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          currentPage === 1
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        aria-disabled={currentPage === 1}
        tabIndex={currentPage === 1 ? -1 : undefined}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </Link>

      {/* Page Numbers */}
      {pageNumbers.map((page, idx) => {
        if (page === '...') {
          return (
            <span key={`ellipsis-${idx}`} className="px-2 py-2 text-gray-400">
              ...
            </span>
          )
        }
        
        const isActive = page === currentPage
        
        return (
          <Link
            key={page}
            href={`${baseUrl}${page === 1 ? '' : `?page=${page}`}`}
            className={`min-w-[40px] h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            {page}
          </Link>
        )
      })}

      {/* Next Button */}
      <Link
        href={`${baseUrl}${currentPage < totalPages ? `?page=${currentPage + 1}` : ''}`}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          currentPage === totalPages
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        aria-disabled={currentPage === totalPages}
        tabIndex={currentPage === totalPages ? -1 : undefined}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </nav>
  )
}

// Simple info text: "Halaman 1 dari 10"
export function PaginationInfo({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  return (
    <div className="text-center text-sm text-gray-500 mt-4">
      Halaman {currentPage} dari {totalPages}
    </div>
  )
}
