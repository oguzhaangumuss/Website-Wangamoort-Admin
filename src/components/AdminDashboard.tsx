'use client'

import { useState } from 'react'
import Sidebar from './layout/Sidebar'
import Header from './layout/Header'

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div>
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="lg:pl-72">
        <Header setSidebarOpen={setSidebarOpen} />

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Dashboard içeriği buraya gelecek */}
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          </div>
        </main>
      </div>
    </div>
  )
}