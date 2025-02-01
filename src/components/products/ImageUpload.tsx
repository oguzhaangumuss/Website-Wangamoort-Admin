'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { XMarkIcon, StarIcon as StarOutline, StarIcon as StarSolid } from '@heroicons/react/24/outline'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { toast } from 'sonner'

// Export edilmiş interface
export interface ProductImage {
  id?: string
  variant_id?: string
  url: string
  alt?: string | null
  is_default: boolean
}

interface UploadError {
  message: string;
  code: string;
}

interface ImageUploadProps {
  variantIndex: number
  initialImages?: ProductImage[]
  onImagesChange: (images: ProductImage[], variantIndex: number) => void
  onSetDefaultImage: (imageIndex: number) => void
}

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!
  }
})

interface FileUploadEvent {
  target: {
    files: FileList | null;
  }
}

export default function ImageUpload({ 
  variantIndex, 
  initialImages = [], 
  onImagesChange,
  onSetDefaultImage
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<ProductImage[]>(initialImages)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (JSON.stringify(images) !== JSON.stringify(initialImages)) {
      setImages(initialImages)
      onImagesChange(initialImages, variantIndex)
    }
  }, [initialImages, images, onImagesChange, variantIndex])

  const handleFileUpload = async (event: FileUploadEvent) => {
    try {
      const files = event.target.files
      if (!files || files.length === 0) return

      setUploading(true)
      const file = files[0]

      const timestamp = new Date().getTime()
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]/g, '-')
      const filePath = `product-images/${timestamp}-${safeName}`

      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME!,
        Key: filePath,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: file.type,
        ACL: 'public-read'
      }))

      const imageUrl = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${filePath}`
      // İlk resim ise veya hiç resim yoksa varsayılan olarak ayarla
      if (imageUrl) {
        const isDefault = images.length === 0
        const newImage: ProductImage = {
          url: imageUrl,
          is_default: isDefault,
          alt: file.name
        }
        const newImages = isDefault ? [newImage] : [...images, newImage]
        setImages(newImages)
        onImagesChange(newImages, variantIndex)
      }
    } catch (error: unknown) {
      const uploadError: UploadError = {
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        code: 'UPLOAD_ERROR'
      }
      console.error('Error uploading image:', uploadError)
      toast.error(uploadError.message)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    const removedImage = images[index]

    // Eğer silinen resim varsayılansa ve başka resim varsa
    if (removedImage.is_default && newImages.length > 0) {
      newImages[0].is_default = true // İlk resmi varsayılan yap
      onSetDefaultImage(0)
    }

    setImages(newImages)
    onImagesChange(newImages, variantIndex)
  }

  const handleSetDefaultImage = (index: number) => {
    const newImages = images.map((img, idx) => ({
      ...img,
      is_default: idx === index
    }))
    setImages(newImages)
    onImagesChange(newImages, variantIndex)
    onSetDefaultImage(index)
  }

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    const fileList = new DataTransfer()
    fileList.items.add(files[0])
    
    await handleFileUpload({ 
      target: { files: fileList.files }
    })
  }

  return (
    <div className="space-y-4">
      {/* Image Preview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
        {images.filter(image => image.url).map((image, index) => (
          <div key={index} className="relative group">
            <div className="aspect-square relative">
              <Image
                src={image.url || '/images/placeholder.jpg'}
                alt={image.alt || `Product image ${index + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                priority={index === 0}
                loading={index === 0 ? "eager" : "lazy"}
                className={`object-cover rounded-lg ${image.is_default ? 'ring-2 ring-[var(--primary-color)]' : ''}`}
              />
            </div>
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                type="button"
                onClick={() => handleSetDefaultImage(index)}
                className={`p-1 rounded-full transition-colors duration-200
                  ${image.is_default 
                    ? 'bg-[var(--primary-color)] text-[var(--text-dark)]' 
                    : 'bg-white/80 text-gray-500 opacity-0 group-hover:opacity-100'}`}
                title={image.is_default ? 'Default image' : 'Set as default image'}
              >
                {image.is_default ? (
                  <StarSolid className="h-4 w-4" />
                ) : (
                  <StarOutline className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="p-1 bg-red-500 text-white rounded-full 
                  opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Button */}
      <div
        className={`flex items-center justify-center w-full ${
          isDragging ? 'border-[var(--primary-color)]' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <label className={`flex flex-col items-center justify-center w-full h-64 
          border-2 border-dashed rounded-lg cursor-pointer 
          ${isDragging ? 'bg-[var(--primary-color)]/10' : 'bg-gray-50'} 
          hover:bg-gray-100 transition-colors duration-200`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
            </svg>
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">PNG, JPG or WEBP</p>
          </div>
          <input 
            type="file" 
            className="hidden" 
            multiple 
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </label>
      </div>
      {uploading && (
        <p className="mt-2 text-sm text-gray-500 text-center">
          Uploading...
        </p>
      )}
    </div>
  )
} 