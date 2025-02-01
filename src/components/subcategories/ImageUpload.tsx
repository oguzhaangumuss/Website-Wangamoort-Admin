'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import Image from 'next/image'

interface ImageUploadProps {
  initialImage: string
  onImageChange: (url: string) => void
}

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!
  }
})

export default function ImageUpload({ initialImage, onImageChange }: ImageUploadProps) {
  const [preview, setPreview] = useState(initialImage)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const loadingToast = toast.loading('Uploading image...')

      const timestamp = new Date().getTime()
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]/g, '-')
      const filePath = `subcategory-images/${timestamp}-${safeName}`

      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME!,
        Key: filePath,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: file.type,
        ACL: 'public-read'
      }))

      const imageUrl = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${filePath}`

      setPreview(imageUrl)
      onImageChange(imageUrl)
      toast.dismiss(loadingToast)
      toast.success('Image uploaded successfully')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {preview && (
        <div className="relative h-48 rounded-lg overflow-hidden">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover"
          />
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0
          file:text-sm file:font-semibold
          file:bg-[var(--primary-color)] file:text-[var(--text-dark)]
          hover:file:bg-[#e6bd2b]"
      />
      {uploading && (
        <p className="mt-2 text-sm text-gray-500 text-center">
          Uploading...
        </p>
      )}
    </div>
  )
} 