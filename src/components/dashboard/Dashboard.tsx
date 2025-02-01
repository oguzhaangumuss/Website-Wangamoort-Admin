'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database.types'
import { QuickStats } from './QuickStats'
import { OrderTrends } from './OrderTrends'
import { TopProducts } from './TopProducts'
import { CategoryDistribution } from './CategoryDistribution'
import { fetchDashboardStats, fetchOrderTrends, fetchTopProducts, fetchCategorySales, fetchRecentOrders } from './api'
import type { DashboardStats, OrderTrend, TopProduct, CategorySales, RecentOrder } from './types'
import { RecentOrders } from './RecentOrders'

export default function Dashboard() {
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    quotes: {
      total: 0,
      pending: 0,
      approved: 0,
      completed: 0,
      cancelled: 0,
      in_progress: 0,
      on_hold: 0,
      on_delivery: 0,
      delivered: 0
    },
    products: {
      total: 0,
      inStock: 0,
      outOfStock: 0
    },
    customers: 0,
    suppliers: 0
  })
  const [dateRange, setDateRange] = useState<'7' | '30'>('7')
  const [orderTrends, setOrderTrends] = useState<OrderTrend[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [topProductsLimit, setTopProductsLimit] = useState<5 | 10>(5)
  const [categorySales, setCategorySales] = useState<CategorySales[]>([])
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    async function fetchData() {
      try {
        const stats = await fetchDashboardStats(supabase)
        const trends = await fetchOrderTrends(supabase, parseInt(dateRange))
        const products = await fetchTopProducts(supabase, topProductsLimit)
        const categories = await fetchCategorySales(supabase)
        const orders = await fetchRecentOrders(supabase)

        console.group('Dashboard Data')
        console.log('Stats:', stats)
        console.log('Order Trends:', trends)
        console.log('Top Products:', products)
        console.log('Category Sales:', categories)
        console.log('Recent Orders:', orders)
        console.groupEnd()

        setStats(stats)
        setOrderTrends(trends)
        setTopProducts(products)
        setCategorySales(categories)
        setRecentOrders(orders)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      }
    }

    fetchData()
  }, [supabase, mounted, dateRange, topProductsLimit])

  if (!mounted) {
    return <div className="animate-spin">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <QuickStats stats={stats} />
      <RecentOrders orders={recentOrders} />
      <OrderTrends 
        trends={orderTrends} 
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <TopProducts 
          products={topProducts}
          limit={topProductsLimit}
          onLimitChange={setTopProductsLimit}
        />
        <CategoryDistribution categories={categorySales} />
      </div>
      
    </div>
  )
} 