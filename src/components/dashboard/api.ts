import { SupabaseClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database.types'
import { DashboardStats, OrderTrend, TopProduct, CategorySales, RecentOrder } from './types'
import { subDays, format } from 'date-fns'

// Tip tanımlamaları
type GenericData = {
  id: string;
  [key: string]: unknown;
}

type ErrorResponse = {
  message: string;
  status: number;
}

interface ApiResponse<T> {
  data: T | null;
  error: ErrorResponse | null;
}

interface QueryParams {
  [key: string]: string | number | boolean;
}

interface RequestOptions {
  method: string;
  headers?: { [key: string]: string };
  body?: string;
}

interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

interface ApiSuccess<T> {
  data: T;
  metadata?: {
    count?: number;
    page?: number;
    totalPages?: number;
  };
}

type ApiResult<T> = ApiSuccess<T> | ApiError;

// Basket item için interface ekleyelim
interface BasketItem {
  product_id: string;
  product_name: string;
  category?: string;
  price: number;
  quantity: number;
}

export async function fetchDashboardStats(supabase: SupabaseClient<Database>): Promise<DashboardStats> {
  const { data: quotes } = await supabase.from('quotes').select('status')
  const { data: products } = await supabase.from('products').select('variants:product_variants(stock_status)')
  const { count: customers } = await supabase.from('customers').select('id', { count: 'exact' })
  const { count: suppliers } = await supabase.from('suppliers').select('id', { count: 'exact' })

  return {
    quotes: quotes?.reduce((acc, quote) => {
      acc.total++
      acc[quote.status as keyof typeof acc]++
      return acc
    }, {
      total: 0,
      pending: 0,
      approved: 0,
      completed: 0,
      cancelled: 0,
      in_progress: 0,
      on_hold: 0,
      on_delivery: 0,
      delivered: 0
    }) || { total: 0, pending: 0, approved: 0, completed: 0, cancelled: 0, in_progress: 0, on_hold: 0, on_delivery: 0, delivered: 0 },
    products: {
      total: products?.length || 0,
      inStock: products?.filter(p => p.variants?.some(v => v.stock_status === 'in_stock')).length || 0,
      outOfStock: products?.filter(p => p.variants?.every(v => v.stock_status === 'out_of_stock')).length || 0
    },
    customers: customers || 0,
    suppliers: suppliers || 0
  }
}

export async function fetchOrderTrends(supabase: SupabaseClient<Database>, days: number): Promise<OrderTrend[]> {
  const startDate = subDays(new Date(), days)
  const { data: orders } = await supabase
    .from('quotes')
    .select('created_at, basket')
    .gte('created_at', startDate.toISOString())
    .order('created_at')

  if (!orders) return []

  // Önce tüm günleri 0 değerleriyle oluştur
  const trends: OrderTrend[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
    trends.push({ date, orders: 0, revenue: 0 })
  }

  // Var olan siparişleri ekle
  orders.forEach(order => {
    const date = format(new Date(order.created_at), 'yyyy-MM-dd')
    const trendIndex = trends.findIndex(t => t.date === date)
    if (trendIndex !== -1) {
      trends[trendIndex].orders++
      trends[trendIndex].revenue += order.basket.reduce(
        (sum: number, item: BasketItem) => sum + (item.price * item.quantity), 
        0
      )
    }
  })

  return trends
}

export async function fetchTopProducts(supabase: SupabaseClient<Database>, limit: number): Promise<TopProduct[]> {
  const { data: quotes } = await supabase.from('quotes').select('basket').not('status', 'eq', 'cancelled')
  if (!quotes) return []

  const productSales = quotes.reduce((acc: Record<string, TopProduct>, quote) => {
    quote.basket.forEach((item: BasketItem) => {
      if (!acc[item.product_id]) {
        acc[item.product_id] = {
          id: item.product_id,
          name: item.product_name,
          category: item.category || 'Uncategorized',
          total_sales: 0,
          total_revenue: 0,
          stock_status: 'unknown'
        }
      }
      acc[item.product_id].total_sales += item.quantity
      acc[item.product_id].total_revenue += item.price * item.quantity
    })
    return acc
  }, {})

  return Object.values(productSales)
    .sort((a, b) => b.total_sales - a.total_sales)
    .slice(0, limit)
}

export async function fetchCategorySales(supabase: SupabaseClient<Database>): Promise<CategorySales[]> {
  const { data: quotes } = await supabase.from('quotes').select('basket').not('status', 'eq', 'cancelled')
  if (!quotes) return []

  const salesByCategory = quotes.reduce((acc: Record<string, CategorySales>, quote) => {
    quote.basket.forEach((item: BasketItem) => {
      const category = item.category || 'Uncategorized'
      if (!acc[category]) {
        acc[category] = { category, sales: 0, revenue: 0 }
      }
      acc[category].sales += item.quantity
      acc[category].revenue += item.price * item.quantity
    })
    return acc
  }, {})

  return Object.values(salesByCategory).sort((a, b) => b.sales - a.sales)
}

export async function fetchRecentOrders(supabase: SupabaseClient<Database>): Promise<RecentOrder[]> {
  const { data: quotes } = await supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (!quotes) return []

  return quotes.map(quote => ({
    id: quote.id,
    customer_name: `${quote.customer_first_name} ${quote.customer_last_name}`,
    status: quote.status,
    total_amount: quote.basket.reduce((sum: number, item: BasketItem) => sum + (item.price * item.quantity), 0),
    created_at: quote.created_at,
    items_count: quote.basket.reduce((sum: number, item: BasketItem) => sum + item.quantity, 0)
  }))
}

export async function fetchData<T>(
  endpoint: string,
  params?: QueryParams,
  options?: RequestOptions
): Promise<ApiResponse<T>> {
  try {
    const queryString = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    const response = await fetch(url, options)
    const data = await response.json()
    return { data, error: null }
  } catch (error: unknown) {
    const errorResponse: ErrorResponse = {
      message: error instanceof Error ? error.message : 'An unknown error occurred',
      status: 500
    }
    return { data: null, error: errorResponse }
  }
}

export async function updateData<T extends GenericData>(
  endpoint: string, 
  data: Partial<T>
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const result = await response.json()
    return { data: result, error: null }
  } catch (error: unknown) {
    const errorResponse: ErrorResponse = {
      message: error instanceof Error ? error.message : 'An unknown error occurred',
      status: 500
    }
    return { data: null, error: errorResponse }
  }
}

export async function deleteData<T extends GenericData>(
  endpoint: string
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(endpoint, { method: 'DELETE' })
    const result = await response.json()
    return { data: result, error: null }
  } catch (error: unknown) {
    const errorResponse: ErrorResponse = {
      message: error instanceof Error ? error.message : 'An unknown error occurred',
      status: 500
    }
    return { data: null, error: errorResponse }
  }
}

export async function handleResponse<T>(response: Response): Promise<ApiResult<T>> {
  const data = await response.json();
  if (!response.ok) {
    return {
      message: data.message || 'An error occurred',
      code: data.code,
      details: data.details
    };
  }
  return data;
} 