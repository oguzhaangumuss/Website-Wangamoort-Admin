'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import { PencilIcon, TrashIcon, PlusIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { Database } from '@/types/database.types'
import type { Category, Subcategory } from '@/types/database.types'
import Image from 'next/image'
import ImageUpload from '../../components/categories/ImageUpload'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default function SubcategoriesPage() {
  const [subcategories, setSubcategories] = useState<Array<Subcategory & { category: Category }>>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSubcategory, setEditingSubcategory] = useState<(Subcategory & { category: Category }) | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category_id: '',
    image: ''
  })
  const [deleteModalData, setDeleteModalData] = useState({
    isOpen: false,
    subcategoryId: '',
    subcategoryName: ''
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
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to fetch categories')
    }
  }, [supabase])

  const fetchSubcategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select(`
          *,
          category:categories (*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSubcategories(data)
    } catch (error) {
      console.error('Error fetching subcategories:', error)
      toast.error('Failed to fetch subcategories')
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchCategories()
    fetchSubcategories()
  }, [fetchCategories, fetchSubcategories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingSubcategory) {
        const { error: updateError } = await supabase
          .from('subcategories')
          .update({
            name: formData.name,
            slug: formData.slug,
            category_id: formData.category_id,
            image: formData.image
          })
          .eq('id', editingSubcategory.id)

        if (updateError) {
          console.error('Update error:', updateError)
          throw updateError
        }

        console.log('Image value being sent:', formData.image)

        const { data: updatedData, error: fetchError } = await supabase
          .from('subcategories')
          .select(`
            *,
            category:categories(*)
          `)
          .eq('id', editingSubcategory.id)
          .single()

        if (fetchError) throw fetchError

        console.log('Updated subcategory:', updatedData)

        toast.success('Subcategory updated successfully')
      } else {
        const { error } = await supabase
          .from('subcategories')
          .insert([{
            name: formData.name,
            slug: formData.slug,
            category_id: formData.category_id,
            image: formData.image
          }])

        if (error) throw error

        toast.success('Subcategory created successfully')
      }

      setIsModalOpen(false)
      await fetchSubcategories()
      setFormData({ name: '', slug: '', category_id: '', image: '' })
      setEditingSubcategory(null)
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Failed to update subcategory')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Subcategory deleted successfully', {
        description: 'The subcategory has been permanently removed.',
        duration: 2000,
      })
      
      fetchSubcategories()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete subcategory')
    } finally {
      setDeleteModalData({ isOpen: false, subcategoryId: '', subcategoryName: '' })
    }
  }

  const handleImageChange = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      image: imageUrl
    }))
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Subcategories
          </h2>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <button
            onClick={() => {
              setEditingSubcategory(null)
              setFormData({ name: '', slug: '', category_id: '', image: '' })
              setIsModalOpen(true)
            }}
            className="inline-flex items-center gap-x-2 rounded-md bg-[var(--primary-color)] px-3.5 py-2.5 text-sm font-semibold shadow-sm hover:bg-[#e6bd2b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            Add Subcategory
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {subcategories.map((subcategory) => (
          <div
            key={subcategory.id}
            className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400"
          >
            <div className="flex-shrink-0">
              <div className="w-16 h-16 relative">
                <Image
                  src={subcategory.image || '/placeholder.png'}
                  alt={subcategory.name}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">{subcategory.name}</p>
              <p className="truncate text-sm text-gray-500">
                Category: {subcategory.category?.name}
              </p>
            </div>
            <div className="flex-shrink-0 self-center z-10">
              <button
                type="button"
                onClick={() => {
                  setEditingSubcategory(subcategory)
                  setFormData({
                    name: subcategory.name,
                    slug: subcategory.slug,
                    category_id: subcategory.category_id,
                    image: subcategory.image || ''
                  })
                  setIsModalOpen(true)
                }}
                className="p-2 text-gray-600 hover:text-[var(--primary-color)] transition-colors"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setDeleteModalData({
                  isOpen: true,
                  subcategoryId: subcategory.id,
                  subcategoryName: subcategory.name
                })}
                className="p-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {deleteModalData.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Subcategory
                </h3>
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete {deleteModalData.subcategoryName}? This action cannot be undone and will also delete all products in this subcategory.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalData({ isOpen: false, subcategoryId: '', subcategoryName: '' })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteModalData.subcategoryId)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingSubcategory ? 'Edit Subcategory' : 'Add New Subcategory'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setFormData({ name: '', slug: '', category_id: '', image: '' })
                  setEditingSubcategory(null)
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--primary-color)] focus:ring-[var(--primary-color)] sm:text-sm"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                    })
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--primary-color)] focus:ring-[var(--primary-color)] sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                  Slug
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--primary-color)] focus:ring-[var(--primary-color)] sm:text-sm"
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

              <div className="mt-5 sm:mt-6">
                <button
                  type="submit"
                  className="inline-flex w-full justify-center rounded-md bg-[var(--primary-color)] px-3 py-2 text-sm font-semibold shadow-sm hover:bg-[#e6bd2b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {editingSubcategory ? 'Update Subcategory' : 'Create Subcategory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 