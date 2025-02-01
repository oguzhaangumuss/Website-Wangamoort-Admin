'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

export interface CategoryImage {
  url: string
  alt?: string | null
}

interface ImageUploadProps {
  initialImage?: string
  onImageChange: (imageUrl: string) => void
}

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!
  }
})

export default function ImageUpload({ initialImage, onImageChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [currentImage, setCurrentImage] = useState<string | undefined>(initialImage)

  useEffect(() => {
    setCurrentImage(initialImage)
  }, [initialImage])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = event.target.files
      if (!files || files.length === 0) return

      setUploading(true)
      const file = files[0] // Sadece ilk dosyayı al

      const timestamp = new Date().getTime()
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]/g, '-')
      const filePath = `category-images/${timestamp}-${safeName}`

      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME!,
        Key: filePath,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: file.type,
        ACL: 'public-read'
      }))

      const imageUrl = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${filePath}`
      
      setCurrentImage(imageUrl)
      onImageChange(imageUrl)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert(error instanceof Error ? error.message : 'Error uploading image')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setCurrentImage(undefined)
    onImageChange('')
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    const fileList = new DataTransfer()
    fileList.items.add(files[0])
    
    const event = {
      target: { files: fileList.files }
    } as React.ChangeEvent<HTMLInputElement>
    
    await handleFileUpload(event)
  }

  return (
    <div className="space-y-4">
      {/* Image Preview */}
      {currentImage && (
        <div className="relative group">
          <div className="aspect-video relative">
            <Image
              src={currentImage}
              alt="Category image"
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full 
              opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Upload Area */}
      {!currentImage && (
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
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>
      )}
      
      {uploading && (
        <p className="mt-2 text-sm text-gray-500 text-center">
          Uploading...
        </p>
      )}
    </div>
  )
} 