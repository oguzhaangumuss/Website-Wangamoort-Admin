'use client'

type QuickStatsProps = {
  stats: {
    quotes: {
      total: number
      // ... diğer quote istatistikleri
    }
    products: {
      total: number
      inStock: number
      outOfStock: number
    }
    customers: number
    suppliers: number
  }
}

export function QuickStats({ stats }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-gray-500 text-sm font-medium">Total Orders</h3>
        <div className="mt-2 flex items-baseline">
          <p className="text-2xl font-semibold text-gray-900">{stats.quotes.total}</p>
          <p className="ml-2 text-sm font-medium text-gray-500">orders</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-gray-500 text-sm font-medium">Products</h3>
        <div className="mt-2 flex items-baseline">
          <p className="text-2xl font-semibold text-gray-900">{stats.products.total}</p>
          <p className="ml-2 text-sm font-medium text-gray-500">total</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-gray-500 text-sm font-medium">Customers</h3>
        <div className="mt-2 flex items-baseline">
          <p className="text-2xl font-semibold text-gray-900">{stats.customers}</p>
          <p className="ml-2 text-sm font-medium text-gray-500">registered</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-gray-500 text-sm font-medium">Suppliers</h3>
        <div className="mt-2 flex items-baseline">
          <p className="text-2xl font-semibold text-gray-900">{stats.suppliers}</p>
          <p className="ml-2 text-sm font-medium text-gray-500">active</p>
        </div>
      </div>
    </div>
  )
} 