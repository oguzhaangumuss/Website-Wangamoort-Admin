'use client'

import { Fragment, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PencilIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon, ExclamationTriangleIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast, Toaster } from 'sonner'
import type { Product, ProductVariant, ProductImage, Subcategory } from '@/types/database.types'
import { Database } from '@/types/database.types'

interface ExtendedProduct extends Product {
  subcategory?: Subcategory & {
    category?: {
      name: string
      slug: string
    }
  }
  variants?: (ProductVariant & {
    images?: ProductImage[]
  })[]
  default_supplier?: {
    company_name: string
    supplier_code: string
  }
}

interface ProductTableProps {
  initialProducts: ExtendedProduct[]
}

export default function ProductTable({ initialProducts }: ProductTableProps) {
  const [products, setProducts] = useState<ExtendedProduct[]>(initialProducts)
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())
  const supabase = createClientComponentClient<Database>()
  const [deleteModalData, setDeleteModalData] = useState<{
    isOpen: boolean;
    productId: string;
    productName: string;
  }>({
    isOpen: false,
    productId: '',
    productName: ''
  })
  const [filters, setFilters] = useState({
    category: '',
    subcategory: '',
    stockStatus: ''
  })

  // Benzersiz kategori ve subkategorileri çıkar
  const categories = [...new Set(products.map(p => p.subcategory?.category?.name))]
  const subcategories = [...new Set(products.map(p => p.subcategory?.name))]
  const stockStatuses = [...new Set(products.flatMap(p => p.variants?.map(v => v.stock_status) || []))]

  // Filtreleme fonksiyonu
  const filteredProducts = products.filter(product => {
    const categoryMatch = !filters.category || product.subcategory?.category?.name === filters.category
    const subcategoryMatch = !filters.subcategory || product.subcategory?.name === filters.subcategory
    const stockMatch = !filters.stockStatus || product.variants?.some(v => v.stock_status === filters.stockStatus)
    
    return categoryMatch && subcategoryMatch && stockMatch
  })

  const getDefaultImage = (variants?: ExtendedProduct['variants']) => {
    const defaultImage = variants
      ?.flatMap(v => v.images || [])
      .find(img => img.url.includes('default'))?.url

    return defaultImage || variants?.[0]?.images?.[0]?.url || '/images/placeholder.jpg'
  }

  const toggleProduct = (productId: string) => {
    const newExpanded = new Set(expandedProducts)
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId)
    } else {
      newExpanded.add(productId)
    }
    setExpandedProducts(newExpanded)
  }

  const handleDelete = async (id: string) => {
    try {
      // Önce product_variants tablosundan ilgili kayıtları siliyoruz
      const { error: variantsError } = await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', id)

      if (variantsError) throw variantsError

      // Sonra products tablosundan ürünü siliyoruz
      const { error: productError } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (productError) throw productError

      // UI'dan silinen ürünü kaldır
      setProducts(products.filter(p => p.id !== id))

      toast.success('Product deleted successfully', {
        description: 'The product and its variants have been permanently removed.',
        duration: 2000,
        className: 'bg-white dark:bg-gray-800',
        descriptionClassName: 'text-gray-500 dark:text-gray-400',
        style: {
          border: '1px solid #E5E7EB',
          borderRadius: '0.5rem',
          padding: '1rem',
        }
      })
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete product', {
        description: 'Please try again later.',
        duration: 2000,
        className: 'bg-white dark:bg-gray-800',
        descriptionClassName: 'text-gray-500 dark:text-gray-400',
        style: {
          border: '1px solid #E5E7EB',
          borderRadius: '0.5rem',
          padding: '1rem',
        }
      })
    } finally {
      setDeleteModalData({ isOpen: false, productId: '', productName: '' })
    }
  }

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'white',
            color: '#1F2937',
            border: '1px solid #E5E7EB',
            borderRadius: '0.5rem',
            padding: '1rem',
          }
        }}
      />

      {/* Delete Modal */}
      {deleteModalData.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Product
                </h3>
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete {deleteModalData.productName}? This action cannot be undone and will also delete all variants of this product.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalData({ isOpen: false, productId: '', productName: '' })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteModalData.productId)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FunnelIcon className="h-5 w-5" />
            <span>Filters:</span>
          </div>
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="rounded-md border-gray-200 text-sm"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            value={filters.subcategory}
            onChange={(e) => setFilters(prev => ({ ...prev, subcategory: e.target.value }))}
            className="rounded-md border-gray-200 text-sm"
          >
            <option value="">All Subcategories</option>
            {subcategories.map(subcategory => (
              <option key={subcategory} value={subcategory}>{subcategory}</option>
            ))}
          </select>
          <select
            value={filters.stockStatus}
            onChange={(e) => setFilters(prev => ({ ...prev, stockStatus: e.target.value }))}
            className="rounded-md border-gray-200 text-sm"
          >
            <option value="">All Stock Status</option>
            {stockStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    Supplier
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Category
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Subcategory
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Product
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Variant Name
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Size
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredProducts.map((product) => (
                  <Fragment key={product.id}>
                    <tr className="bg-white">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">
                        {product.default_supplier?.supplier_code || '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {product.subcategory?.category?.name || 'Uncategorized'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {product.subcategory?.name || 'None'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <Image
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded-lg object-cover"
                              src={getDefaultImage(product.variants)}
                              alt={product.name}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">{product.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {product.variants?.[0]?.variant_name || '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {product.variants && product.variants.length > 1 ? (
                          <button
                            onClick={() => toggleProduct(product.id)}
                            className="inline-flex items-center gap-x-1 rounded-full px-2 py-1 text-xs font-semibold 
                              bg-green-100 text-green-800 hover:bg-green-200 transition-colors duration-200"
                          >
                            {product.variants.length} sizes
                            {expandedProducts.has(product.id) ? (
                              <ChevronUpIcon className="h-4 w-4" />
                            ) : (
                              <ChevronDownIcon className="h-4 w-4" />
                            )}
                          </button>
                        ) : (
                          <span className="text-gray-500">Standard</span>
                        )}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/products/${product.id}`}
                            className="text-[var(--secondary-color)] hover:text-[#1f4429]"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => setDeleteModalData({
                              isOpen: true,
                              productId: product.id,
                              productName: product.name
                            })}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedProducts.has(product.id) && product.variants?.map((variant) => (
                      <tr key={variant.id} className="bg-gray-50">
                        <td className="pl-4 pr-3 py-2 text-sm text-gray-400 sm:pl-6" colSpan={4} />
                        <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                          {variant.variant_name || '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                          {variant.size}
                        </td>
                        <td className="relative whitespace-nowrap py-2 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link
                            href={`/products/${product.id}/variants/${variant.id}`}
                            className="text-[var(--secondary-color)] hover:text-[#1f4429]"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}