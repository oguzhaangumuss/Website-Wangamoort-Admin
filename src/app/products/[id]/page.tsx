'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { PencilIcon, PlusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import type { Category, Subcategory, ProductImage } from '@/types/database.types'
import VariantForm, { VariantFormData } from '../../../components/products/VariantForm'
import { toast } from 'sonner'
import Link from 'next/link'

interface EditProductPageProps {
  params: Promise<{
    id: string
  }>
}

const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default function EditProductPage({ params }: EditProductPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [variants, setVariants] = useState<VariantFormData[]>([])
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null)
  const [product, setProduct] = useState({
    name: '',
    subcategory_id: '',
    description: ''
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setIsLoading(true)
        // Ürün verilerini çek
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single()

        if (productError) throw productError

        setProduct({
          name: productData.name,
          subcategory_id: productData.subcategory_id,
          description: productData.description || ''
        })

        // Variant'ları çek
        const { data: variantData, error: variantError } = await supabase
          .from('product_variants')
          .select(`
            *,
            product_images (*)
          `)
          .eq('product_id', id)
          .order('created_at', { ascending: true })

        if (variantError) throw variantError

        // Variant verilerini formata uygun şekilde dönüştür
        const formattedVariants = variantData.map(variant => ({
          id: variant.id,
          variant_name: variant.variant_name || '',
          size: variant.size || '',
          color: variant.color || '',
          price: variant.price?.toString() || '',
          stock_status: variant.stock_status || 'in_stock',
          images: variant.product_images?.map((img: ProductImage) => ({
            id: img.id,
            url: img.url,
            alt: img.alt || '',
            is_default: img.is_default || false
          })) || []
        }))

        setVariants(formattedVariants)
      } catch (error) {
        console.error('Error loading product:', error)
        toast.error('Failed to load product')
      } finally {
        setIsLoading(false)
      }
    }

    loadProduct()
  }, [supabase, id])

  // Kategorileri ve alt kategorileri yükle
  useEffect(() => {
    const loadCategories = async () => {
      try {
        // Kategorileri çek
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name')

        if (categoriesError) throw categoriesError
        setCategories(categoriesData)

        // Alt kategorileri çek
        const { data: subcategoriesData, error: subcategoriesError } = await supabase
          .from('subcategories')
          .select(`
            *,
            category:categories (*)
          `)
          .order('name')

        if (subcategoriesError) throw subcategoriesError
        setSubcategories(subcategoriesData)

        // Ürünün subcategory'sine göre category'yi seç
        if (product.subcategory_id) {
          const subcategory = subcategoriesData.find(
            sub => sub.id === product.subcategory_id
          )
          if (subcategory) {
            setSelectedCategoryId(subcategory.category_id)
          }
        }
      } catch (error) {
        console.error('Error loading categories:', error)
        toast.error('Failed to load categories')
      }
    }

    loadCategories()
  }, [supabase, product.subcategory_id]) // product.subcategory_id değiştiğinde tekrar yükle

  // Seçili kategoriye göre alt kategorileri filtrele
  const filteredSubcategories = subcategories.filter(
    sub => sub.category_id === selectedCategoryId
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Yükleme toast'ı
    const loadingToast = toast.loading('Updating product...')

    try {
      // Önce ürün bilgilerini güncelle
      const { error: productError } = await supabase
        .from('products')
        .update({
          name: product.name,
          slug: createSlug(product.name),
          description: product.description,
          subcategory_id: product.subcategory_id
        })
        .eq('id', id)

      if (productError) throw productError

      // Varyantları güncelle
      for (const variant of variants) {
        if (variant.id) {
          // Mevcut varyantı güncelle
          const { error: variantError } = await supabase
            .from('product_variants')
            .update({
              variant_name: variant.variant_name,
              size: variant.size,
              color: variant.color,
              price: variant.price,
              stock_status: variant.stock_status
            })
            .eq('id', variant.id)

          if (variantError) throw variantError

          // Resimleri güncelle
          for (const image of variant.images || []) {
            if (image.id) {
              // Mevcut resmi güncelle
              const { error: imageError } = await supabase
                .from('product_images')
                .update({
                  url: image.url,
                  alt: image.alt || null,
                  is_default: image.is_default
                })
                .eq('id', image.id)

              if (imageError) throw imageError
            } else {
              // Yeni resim ekle
              const { error: newImageError } = await supabase
                .from('product_images')
                .insert({
                  variant_id: variant.id,
                  url: image.url,
                  alt: image.alt || null,
                  is_default: image.is_default
                })

              if (newImageError) throw newImageError
            }
          }
        } else {
          // Yeni varyant ekle
          const { data: newVariant, error: variantError } = await supabase
            .from('product_variants')
            .insert({
              product_id: id,
              variant_name: variant.variant_name,
              size: variant.size,
              color: variant.color,
              price: variant.price,
              stock_status: variant.stock_status
            })
            .select()
            .single()

          if (variantError) throw variantError

          // Yeni varyantın resimlerini ekle
          for (const image of variant.images || []) {
            const { error: imageError } = await supabase
              .from('product_images')
              .insert({
                variant_id: newVariant.id,
                url: image.url,
                alt: image.alt || null,
                is_default: image.is_default
              })

            if (imageError) throw imageError
          }
        }
      }

      // Başarılı olduğunda loading toast'ı kapat ve success toast'ı göster
      toast.dismiss(loadingToast)
      toast.success('Product updated successfully!')
      router.refresh()
    } catch (error) {
      // Hata durumunda loading toast'ı kapat ve error toast'ı göster
      toast.dismiss(loadingToast)
      console.error('Error updating product:', error)
      toast.error('Failed to update product')
    } finally {
      setLoading(false)
    }
  }

  // Variant silme işlemi için yeni fonksiyon
  const handleDeleteVariant = async (indexToDelete: number) => {
    try {
      const variantToDelete = variants[indexToDelete]
      
      // Eğer variant veritabanında kayıtlıysa (id varsa)
      if (variantToDelete.id) {
        // Önce variant'a ait resimleri sil
        if (variantToDelete.images && variantToDelete.images.length > 0) {
          const { error: imagesError } = await supabase
            .from('product_images')
            .delete()
            .eq('variant_id', variantToDelete.id)

          if (imagesError) throw imagesError
        }

        // Sonra variant'ı sil
        const { error: variantError } = await supabase
          .from('product_variants')
          .delete()
          .eq('id', variantToDelete.id)

        if (variantError) throw variantError
      }

      // UI'dan variant'ı kaldır
      if (selectedVariantIndex === indexToDelete) {
        setSelectedVariantIndex(null)
      }
      
      const newVariants = variants.filter((_, index) => index !== indexToDelete)
      setVariants(newVariants)

      toast.success('Variant deleted successfully')
    } catch (error) {
      console.error('Error deleting variant:', error)
      toast.error('Failed to delete variant')
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
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
              Edit Product: {product.name}
            </h2>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mt-8 grid grid-cols-1 gap-8">
          {/* Ürün Bilgileri Formu */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Product Details</h3>
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
                      setProduct({ ...product, subcategory_id: '' })
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
            </div>
          </div>

          {/* Varyant Listesi */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Product Variants</h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variant Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Images</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {variants.map((variant, index) => (
                      <tr key={index} className={selectedVariantIndex === index ? 'bg-yellow-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{variant.variant_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{variant.size}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{variant.color}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${variant.price}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${variant.stock_status === 'in_stock' ? 'bg-green-100 text-green-800' : 
                            variant.stock_status === 'out_of_stock' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}`}>
                            {variant.stock_status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {variant.images?.length || 0} images
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            type="button"
                            onClick={() => setSelectedVariantIndex(index)}
                            className="text-[var(--secondary-color)] hover:text-[#1f4429]"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Seçili Varyant Formu */}
              {selectedVariantIndex !== null && (
                <div className="mt-8 border-t pt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-6">
                    Edit Variant: {variants[selectedVariantIndex].variant_name}
                  </h4>
                  <VariantForm
                    variants={[variants[selectedVariantIndex]]}
                    onChange={(newVariants) => {
                      const updatedVariants = [...variants]
                      updatedVariants[selectedVariantIndex] = newVariants[0]
                      setVariants(updatedVariants)
                    }}
                    onDelete={async () => {
                      if (selectedVariantIndex !== null) {
                        await handleDeleteVariant(selectedVariantIndex)
                      }
                    }}
                  />
                </div>
              )}

              {/* Add New Variant Button */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => {
                    const newVariant: VariantFormData = {
                      variant_name: '',
                      size: '',
                      color: '',
                      price: 0,
                      stock_status: 'in_stock',
                      images: []
                    }
                    setVariants([...variants, newVariant])
                    setSelectedVariantIndex(variants.length)
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent 
                    text-sm font-medium rounded-md text-[var(--text-dark)] bg-[var(--primary-color)]
                    hover:bg-[#e6bd2b] focus:outline-none focus:ring-2 focus:ring-offset-2 
                    focus:ring-[var(--primary-color)]"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Add New Variant
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              onClick={() => console.log('Submit clicked', { product, variants })}
              className="inline-flex justify-center rounded-md bg-[var(--primary-color)] px-4 py-2
                text-sm font-semibold text-[var(--text-dark)] shadow-sm hover:bg-[#e6bd2b]
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
                focus-visible:outline-[var(--primary-color)] disabled:opacity-50
                disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
} 