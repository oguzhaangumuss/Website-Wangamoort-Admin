export type DashboardStats = {
  quotes: {
    total: number
    pending: number
    approved: number
    completed: number
    cancelled: number
    in_progress: number
    on_hold: number
    on_delivery: number
    delivered: number
  }
  products: {
    total: number
    inStock: number
    outOfStock: number
  }
  customers: number
  suppliers: number
}

export type OrderTrend = {
  date: string
  orders: number
  revenue: number
}

export type TopProduct = {
  id: string
  name: string
  category: string
  total_sales: number
  total_revenue: number
  stock_status: string
}

export type CategorySales = {
  category: string
  sales: number
  revenue: number
}

export type RecentOrder = {
  id: string
  customer_name: string
  status: string
  total_amount: number
  created_at: string
  items_count: number
  case_id?: string
} 