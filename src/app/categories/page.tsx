'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast, Toaster } from 'sonner'
import { PencilIcon, TrashIcon, PlusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import type { Database } from '@/types/database.types'
import type { Category } from '@/types/database.types'
import Image from 'next/image'
import ImageUpload from '../../components/categories/ImageUpload'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    image: ''
  })
  const [deleteModalData, setDeleteModalData] = useState<{
    isOpen: boolean;
    categoryId: string;
    categoryName: string;
  }>({
    isOpen: false,
    categoryId: '',
    categoryName: ''
  })

  const supabase = createClientComponentClient<Database>()

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCategories(data)
    } catch (error: unknown) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to fetch categories')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'name' && !editingCategory ? { 
        slug: value.toLowerCase().replace(/\s+/g, '-') 
      } : {})
    }))
  }

  const handleImageChange = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      image: imageUrl
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        const { error: updateError } = await supabase
          .from('categories')
          .update({
            name: formData.name,
            slug: formData.slug,
            image: formData.image || null
          })
          .eq('id', editingCategory.id)

        if (updateError) throw updateError

        toast.success('Category Updated Successfully', {
          description: `${formData.name} has been updated.`,
          duration: 3000,
          className: 'bg-white dark:bg-gray-800',
          descriptionClassName: 'text-gray-500 dark:text-gray-400',
          style: {
            border: '1px solid #E5E7EB',
            borderRadius: '0.5rem',
            padding: '1rem',
          },
          action: {
            label: 'Dismiss',
            onClick: () => toast.dismiss(),
          },
        })
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([{
            name: formData.name,
            slug: formData.slug,
            image: formData.image
          }])

        if (error) throw error

        toast.success('Category Created Successfully', {
          description: `${formData.name} has been created.`,
          duration: 3000,
          className: 'bg-white dark:bg-gray-800',
          descriptionClassName: 'text-gray-500 dark:text-gray-400',
          style: {
            border: '1px solid #E5E7EB',
            borderRadius: '0.5rem',
            padding: '1rem',
          },
          action: {
            label: 'Dismiss',
            onClick: () => toast.dismiss(),
          },
        })
      }

      setIsModalOpen(false)
      await fetchCategories()
      setFormData({ name: '', slug: '', image: '' })
      setEditingCategory(null)
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Something went wrong', {
        description: 'Please try again later.',
        duration: 3000,
        className: 'bg-white dark:bg-gray-800',
        descriptionClassName: 'text-gray-500 dark:text-gray-400',
        style: {
          border: '1px solid #E5E7EB',
          borderRadius: '0.5rem',
          padding: '1rem',
        },
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      // Önce bu kategoriye bağlı subcategory'leri kontrol et
      const { data: subcategories } = await supabase
        .from('subcategories')
        .select('id')
        .eq('category_id', id)

      if (subcategories && subcategories.length > 0) {
        toast.error('Cannot delete category', {
          description: 'This category has subcategories. Please delete them first.',
        })
        return
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Category Deleted Successfully', {
        description: 'The category has been permanently removed.',
        duration: 3000,
        className: 'bg-white dark:bg-gray-800',
        descriptionClassName: 'text-gray-500 dark:text-gray-400',
        style: {
          border: '1px solid #E5E7EB',
          borderRadius: '0.5rem',
          padding: '1rem',
        },
        action: {
          label: 'Dismiss',
          onClick: () => toast.dismiss(),
        },
      })
      
      await fetchCategories()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to Delete Category', {
        description: 'Please try again later.',
        duration: 3000,
        className: 'bg-white dark:bg-gray-800',
        descriptionClassName: 'text-gray-500 dark:text-gray-400',
        style: {
          border: '1px solid #E5E7EB',
          borderRadius: '0.5rem',
          padding: '1rem',
        },
      })
    } finally {
      setDeleteModalData({ isOpen: false, categoryId: '', categoryName: '' })
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <div className="p-6">
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'white',
            color: '#1F2937',
            border: '1px solid #E5E7EB',
            borderRadius: '0.5rem',
            padding: '1rem',
          },
          className: 'bg-white dark:bg-gray-800',
          descriptionClassName: 'text-gray-500 dark:text-gray-400',
        }}
      />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Categories</h1>
        <button
          onClick={() => {
            setEditingCategory(null)
            setFormData({ name: '', slug: '', image: '' })
            setIsModalOpen(true)
          }}
          className="flex items-center px-4 py-2 bg-[#152e1b] text-white rounded-md hover:bg-[#1f432a]"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Category
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalData.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Category
                </h3>
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete {deleteModalData.categoryName}? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalData({ isOpen: false, categoryId: '', categoryName: '' })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteModalData.categoryId)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {category.image && (
              <div className="relative h-48">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{category.name}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingCategory(category)
                      setFormData({
                        name: category.name,
                        slug: category.slug,
                        image: category.image || ''
                      })
                      setIsModalOpen(true)
                    }}
                    className="p-2 text-gray-600 hover:text-[#152e1b]"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setDeleteModalData({
                      isOpen: true,
                      categoryId: category.id,
                      categoryName: category.name
                    })}
                    className="p-2 text-gray-600 hover:text-red-600"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p className="text-gray-500 text-sm mt-1">{category.slug}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image
                </label>
                <ImageUpload
                  initialImage={formData.image}
                  onImageChange={handleImageChange}
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#152e1b] text-white rounded-md hover:bg-[#1f432a]"
                >
                  {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 