'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Subcategory, Category } from '@/types/database.types'
import VariantForm, { VariantFormData } from '../../../components/products/VariantForm'
import { toast } from 'sonner'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

interface SubcategoryWithCategory extends Subcategory {
  category?: Category
}

// Slug oluşturma fonksiyonu ekleyelim
function createSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function NewProductPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<SubcategoryWithCategory[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [variants, setVariants] = useState<VariantFormData[]>([])

  const [product, setProduct] = useState({
    name: '',
    subcategory_id: '',
    description: ''
  })

  // Kategorileri ve alt kategorileri yükle
  useEffect(() => {
    const loadData = async () => {
      // Kategorileri yükle
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (categoryError) {
        console.error('Error loading categories:', categoryError)
        return
      }

      setCategories(categoryData)

      // Alt kategorileri yükle
      const { data: subcategoryData, error: subcategoryError } = await supabase
        .from('subcategories')
        .select(`
          *,
          category:categories (*)
        `)
        .order('name')

      if (subcategoryError) {
        console.error('Error loading subcategories:', subcategoryError)
        return
      }

      setSubcategories(subcategoryData)
    }

    loadData()
  }, [supabase])

  // Seçili kategoriye göre alt kategorileri filtrele
  const filteredSubcategories = subcategories.filter(
    sub => sub.category_id === selectedCategoryId
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Yükleme bildirimi
    const loadingToast = toast.loading('Adding product...')

    try {
      // Slug oluştur
      const productWithSlug = {
        ...product,
        slug: createSlug(product.name)
      }

      // Ürünü oluştur
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert([productWithSlug])
        .select()

      if (productError) throw productError

      // Varyant kontrolü
      if (variants.length > 0) {
        for (const variant of variants) {
          // Önce varyantı ekle
          const { data: variantData, error: variantError } = await supabase
            .from('product_variants')
            .insert([{
              product_id: productData[0].id,
              variant_name: variant.variant_name || '',
              size: variant.size || '',
              color: variant.color || '',
              price: variant.price ?? 0,
              stock_status: variant.stock_status || 'in_stock'
            }])
            .select()

          if (variantError) throw variantError

          // Sonra resimleri ekle
          if (variant.images?.length) {
            const { error: imageError } = await supabase
              .from('product_images')
              .insert(
                variant.images.map(image => ({
                  variant_id: variantData[0].id,
                  url: image.url,
                  alt: `${product.name} - ${variant.variant_name || variant.size}`,
                  is_default: image.is_default
                }))
              )

            if (imageError) throw imageError
          }
        }
      } else {
        // Varsayılan varyant oluştur
        const { error: defaultVariantError } = await supabase
          .from('product_variants')
          .insert([{
            product_id: productData[0].id,
            variant_name: '',
            size: '',
            color: '',
            price: 0,
            stock_status: 'in_stock'
          }])
          .select()

        if (defaultVariantError) throw defaultVariantError
      }

      // Başarı bildirimi
      toast.success('Product added successfully!', {
        id: loadingToast
      })
      
      router.push(`/products/${productData[0].id}`)
    } catch (error) {
      console.error('Error:', error)
      // Hata bildirimi
      toast.error('Error creating product', {
        id: loadingToast
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-4">
            <Link
              href="/products"
              className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 
                text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 
                hover:bg-gray-50 transition-colors duration-200"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Back
            </Link>
            <h2 className="text-2xl font-bold leading-7 text-[var(--text-dark)] sm:truncate sm:text-3xl sm:tracking-tight">
              New Product
            </h2>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          <div className="space-y-6">
            {/* Product Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Product Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={product.name}
                onChange={(e) => setProduct({ ...product, name: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 
                  focus:border-[var(--primary-color)] focus:outline-none focus:ring-[var(--primary-color)]
                  sm:text-sm"
              />
            </div>

            {/* Category Select */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                name="category"
                required
                value={selectedCategoryId}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value)
                  setProduct({ ...product, subcategory_id: '' }) // Alt kategori seçimini sıfırla
                }}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900
                  focus:border-[var(--primary-color)] focus:outline-none focus:ring-[var(--primary-color)]
                  sm:text-sm"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory Select */}
            <div>
              <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700">
                Subcategory
              </label>
              <select
                id="subcategory"
                name="subcategory"
                required
                disabled={!selectedCategoryId}
                value={product.subcategory_id}
                onChange={(e) => setProduct({ ...product, subcategory_id: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900
                  focus:border-[var(--primary-color)] focus:outline-none focus:ring-[var(--primary-color)]
                  sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {selectedCategoryId ? 'Select a subcategory' : 'First select a category'}
                </option>
                {filteredSubcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={product.description}
                onChange={(e) => setProduct({ ...product, description: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900
                  focus:border-[var(--primary-color)] focus:outline-none focus:ring-[var(--primary-color)]
                  sm:text-sm"
              />
            </div>
          </div>

          {/* Variant Form */}
          <VariantForm 
            variants={variants} 
            onChange={setVariants} 
          />

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center rounded-md bg-[var(--primary-color)] px-4 py-2
                text-sm font-semibold text-[var(--text-dark)] shadow-sm hover:bg-[#e6bd2b]
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
                focus-visible:outline-[var(--primary-color)] disabled:opacity-50
                disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 