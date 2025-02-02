'use client'

import { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { SupplierProduct } from '@/types/database.types'

interface EditProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    id: string
    supplier_product_code?: string
    supplier_product_url?: string | null
    is_active: boolean
  }) => void
  product: SupplierProduct | null
}

export default function EditProductModal({ isOpen, onClose, onSave, product }: EditProductModalProps) {
  const [productCode, setProductCode] = useState('')
  const [productUrl, setProductUrl] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (product) {
      setProductCode(product.supplier_product_code || '')
      setProductUrl(product.supplier_product_url || '')
      setIsActive(product.is_active)
    }
  }, [product])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    onSave({
      id: product.id,
      supplier_product_code: productCode || undefined,
      supplier_product_url: productUrl || null,
      is_active: isActive
    })
    handleClose()
  }

  const handleClose = () => {
    setProductCode('')
    setProductUrl('')
    setIsActive(true)
    onClose()
  }

  if (!product) return null

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-xl w-full bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-4 border-b">
            <Dialog.Title className="text-lg font-medium">
              Edit Product: {product.product?.name}
            </Dialog.Title>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-500">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
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

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 
                  border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Active
              </label>
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
                Save Changes
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
} 