'use client'

import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import { Supplier, SupplierProduct, Product } from '@/types/database.types'
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { toast } from 'sonner'
import AddProductModal from '@/components/suppliers/AddProductModal'
import EditProductModal from '@/components/suppliers/EditProductModal'

export default function SupplierProducts({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<SupplierProduct | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    fetchSupplierAndProducts()
  }, [id])

  useEffect(() => {
    const loadAvailableProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name')
      
      if (error) {
        console.error('Error loading products:', error)
        return
      }
      
      setAvailableProducts(data || [])
    }

    if (showAddModal) {
      loadAvailableProducts()
    }
  }, [showAddModal, supabase])

  const fetchSupplierAndProducts = async () => {
    try {
      // Supplier bilgilerini al
      const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single()

      if (supplierError) throw supplierError
      setSupplier(supplierData)

      // Supplier'ın ürünlerini al (product detayları ile birlikte)
      const { data: productsData, error: productsError } = await supabase
        .from('supplier_products')
        .select(`
          *,
          product:products (
            id,
            name,
            description,
            product_variants (
              id,
              variant_name,
              size,
              color,
              price
            )
          )
        `)
        .eq('supplier_id', id)
        .order('created_at', { ascending: false })

      if (productsError) throw productsError
      setSupplierProducts(productsData)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load supplier products')
    } finally {
      setLoading(false)
    }
  }

  // Fiyat güncelleme fonksiyonu
  const handleUpdatePrice = async (productId: string, newPrice: number) => {
    try {
      const { error } = await supabase
        .from('supplier_products')
        .update({ 
          supplier_price: newPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)

      if (error) throw error
      
      toast.success('Price updated successfully')
      fetchSupplierAndProducts() // Listeyi yenile
    } catch (error) {
      console.error('Error updating price:', error)
      toast.error('Failed to update price')
    }
  }

  // Yeni ürün ekleme fonksiyonu
  const handleAddProduct = async (data: { 
    product_id: string, 
    supplier_product_code?: string, 
    supplier_product_url?: string | null 
  }) => {
    try {
      const { error } = await supabase
        .from('supplier_products')
        .insert({
          supplier_id: id,
          product_id: data.product_id,
          supplier_product_code: data.supplier_product_code || null,
          supplier_product_url: data.supplier_product_url || null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_checked: new Date().toISOString()
        })

      if (error) throw error

      toast.success('Product added successfully')
      fetchSupplierAndProducts()
    } catch (error) {
      console.error('Error adding product:', error)
      toast.error('Failed to add product')
    }
  }

  // Edit handler
  const handleEdit = async (data: {
    id: string
    supplier_product_code?: string
    supplier_product_url?: string | null
    is_active: boolean
  }) => {
    try {
      const { error } = await supabase
        .from('supplier_products')
        .update({
          supplier_product_code: data.supplier_product_code,
          supplier_product_url: data.supplier_product_url,
          is_active: data.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id)

      if (error) throw error

      toast.success('Product updated successfully')
      fetchSupplierAndProducts()
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error('Failed to update product')
    }
  }

  // Toggle status handler'ı ekleyelim
  const handleToggleStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('supplier_products')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)

      if (error) throw error
      
      toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
      fetchSupplierAndProducts() // Listeyi yenile
    } catch (error) {
      console.error('Error toggling status:', error)
      toast.error('Failed to update status')
    }
  }

  if (loading) {
    return <div className="p-4">Loading...</div>
  }

  if (!supplier) {
    return <div className="p-4">Supplier not found</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/suppliers" className="mr-4">
            <ArrowLeftIcon className="w-6 h-6 text-gray-500" />
          </Link>
          <h1 className="text-2xl font-bold">
            {supplier.company_name} - Products
          </h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Product
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Supplier Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Updated
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {supplierProducts.map((sp) => (
              <tr key={sp.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">
                    {sp.product?.name}
                  </div>
                  {sp.supplier_product_url && (
                    <a
                      href={sp.supplier_product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-900"
                    >
                      View on supplier site
                    </a>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">
                    {sp.supplier_product_code || ''}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <input
                    type="number"
                    value={sp.supplier_price || ''}
                    onChange={(e) => handleUpdatePrice(sp.id, parseFloat(e.target.value))}
                    className="w-24 px-2 py-1 text-sm border rounded"
                    step="0.01"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500">
                    {new Date(sp.updated_at).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    sp.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {sp.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                  <button
                    onClick={() => {
                      setSelectedProduct(sp)
                      setShowEditModal(true)
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleStatus(sp.id, sp.is_active)}
                    className={`${
                      sp.is_active 
                        ? 'text-red-600 hover:text-red-900' 
                        : 'text-green-600 hover:text-green-900'
                    }`}
                  >
                    {sp.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddProduct}
        products={availableProducts}
      />

      {/* Edit Modal */}
      <EditProductModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedProduct(null)
        }}
        onSave={handleEdit}
        product={selectedProduct}
      />
    </div>
  )
} 