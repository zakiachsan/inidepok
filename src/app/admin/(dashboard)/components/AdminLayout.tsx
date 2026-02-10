'use client'

import { useState } from 'react'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'

interface AdminLayoutProps {
  user: {
    name: string
    email: string
    role: string
  }
  children: React.ReactNode
}

export default function AdminLayout({ user, children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar 
        user={user} 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      <div className="lg:pl-56">
        <AdminHeader 
          user={user} 
          onMenuToggle={() => setSidebarOpen(true)} 
        />
        <main className="p-4">{children}</main>
      </div>
    </div>
  )
}
