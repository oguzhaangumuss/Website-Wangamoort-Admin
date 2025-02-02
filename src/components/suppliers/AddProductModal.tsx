'use client'

import { useState, useMemo } from 'react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { Product } from '@/types/database.types'

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (data: { product_id: string, supplier_product_code?: string, supplier_product_url?: string | null }) => void
  products: Product[]
}

export default function AddProductModal({ isOpen, onClose, onAdd, products }: AddProductModalProps) {
  const [selectedProduct, setSelectedProduct] = useState('')
  const [productCode, setProductCode] = useState('')
  const [productUrl, setProductUrl] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Ürünleri filtrele
  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [products, searchQuery])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd({
      product_id: selectedProduct,
      supplier_product_code: productCode || undefined,
      supplier_product_url: productUrl || null
    })
    handleClose()
  }

  const handleClose = () => {
    setSelectedProduct('')
    setProductCode('')
    setProductUrl('')
    setSearchQuery('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-xl w-full bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-4 border-b">
            <Dialog.Title className="text-lg font-medium">
              Add Product
            </Dialog.Title>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-500">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white 
                  placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 
                  focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search products..."
              />
            </div>

            {/* Product Select */}
            <div>
              <label htmlFor="product" className="block text-sm font-medium text-gray-700">
                Select Product
              </label>
              <select
                id="product"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 
                  focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a product</option>
                {filteredProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                {filteredProducts.length} products found
              </p>
            </div>

            {/* Product Code */}
            <div>
              <label htmlFor="productCode" className="block text-sm font-medium text-gray-700">
                Supplier Product Code
              </label>
              <input
                type="text"
                id="productCode"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 
                  focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional"
              />
            </div>

            {/* Product URL */}
            <div>
              <label htmlFor="productUrl" className="block text-sm font-medium text-gray-700">
                Product URL
              </label>
              <input
                type="url"
                id="productUrl"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 
                  focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Product
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
