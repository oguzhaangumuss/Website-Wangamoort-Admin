'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import ProductTable from '../../components/products/ProductTable'
import { PlusIcon, CubeIcon, FolderIcon, FolderOpenIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { Database, ExtendedProduct } from '../../types/database.types'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default function ProductsPage() {
  const [products, setProducts] = useState<ExtendedProduct[]>([])
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalSubcategories: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient<Database>()

  const loadData = useCallback(async () => {
    try {
      console.group('Products Data Loading')
      console.time('Products Query')

      const { data: productsData, error } = await supabase
        .from('products')
        .select(`
          *,
          subcategory:subcategories!subcategory_id (
            *,
            category:categories!category_id (
              id,
              name
            )
          ),
          variants:product_variants!product_id (
            id,
            variant_name,
            size,
            color,
            price,
            stock_status,
            images:product_images!variant_id (
              id,
              url,
              is_default
            )
          )
        `)

      console.log('Raw Products Data:', productsData)
      console.log('Query Error:', error)

      if (error) throw error

      if (productsData) {
        // Tip dönüşümünü açıkça belirtelim
        const extendedProducts = productsData.map(product => ({
          ...product,
          stock_status: product.variants?.[0]?.stock_status ?? 'out_of_stock',
          updated_at: product.created_at ?? new Date().toISOString(),
          description: product.description ?? '',  // null değerleri boş string'e çevir
          variants: product.variants ?? [],        // undefined yerine boş array
          subcategory: product.subcategory ?? undefined
        })) satisfies ExtendedProduct[]

        setProducts(extendedProducts)
        
        // İstatistikleri güncelle
        const categories = new Set(productsData.map(p => p.subcategory?.category?.name).filter(Boolean))
        const subcategories = new Set(productsData.map(p => p.subcategory?.name).filter(Boolean))
        
        setStats({
          totalProducts: productsData.length,
          totalCategories: categories.size,
          totalSubcategories: subcategories.size
        })

        console.log('Stats:', {
          products: productsData.length,
          categories: categories.size,
          subcategories: subcategories.size
        })
      }

      console.timeEnd('Products Query')
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
      console.groupEnd()
    }
  }, [supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return <div>Loading...</div>
  }

  const statCards = [
    {
      name: 'Categories',
      value: stats.totalCategories ?? 0,
      href: '/categories',
      icon: FolderIcon,
    },
    {
      name: 'Subcategories',
      value: stats.totalSubcategories ?? 0,
      href: '/subcategories',
      icon: FolderOpenIcon,
    },
    {
      name: 'Products',
      value: stats.totalProducts ?? 0,
      href: '/products',
      icon: CubeIcon,
    }
  ]

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="md:flex md:items-center md:justify-between bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-[var(--text-dark)] sm:truncate sm:text-3xl sm:tracking-tight">
            Products
          </h2>
          <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            <p className="mt-2 text-sm text-gray-600">
              Manage your products, variants, and categories
            </p>
          </div>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <Link
            href="/products/new"
            className="inline-flex items-center gap-x-2 rounded-md bg-[var(--primary-color)] 
              px-3.5 py-2.5 text-sm font-semibold text-[var(--text-dark)] shadow-sm 
              hover:bg-[#e6bd2b] transition-colors duration-200"
          >
            <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="group overflow-hidden rounded-lg bg-white px-4 py-5 shadow-sm 
              border border-gray-100 hover:shadow-md transition-all duration-200 
              hover:-translate-y-0.5"
          >
            <dt className="truncate text-sm font-medium text-gray-600 flex items-center gap-2">
              <stat.icon className="h-5 w-5 text-gray-400 group-hover:text-[var(--primary-color)]" />
              {stat.name}
            </dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-[var(--secondary-color)]">
              {stat.value}
            </dd>
          </Link>
        ))}
      </div>

      {/* Table Section */}
      <div className="mt-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <ProductTable initialProducts={products} />
        </div>
      </div>
    </div>
  )
}