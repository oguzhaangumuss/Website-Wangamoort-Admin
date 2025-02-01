'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <form onSubmit={handleSignIn} className="space-y-6 bg-white p-8 shadow-sm rounded-lg">
          <h2 className="text-2xl font-bold text-center text-gray-900">Admin Panel</h2>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--primary-color)] focus:outline-none focus:ring-[var(--primary-color)]"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[var(--primary-color)] focus:outline-none focus:ring-[var(--primary-color)]"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-[var(--primary-color)] px-4 py-2 text-sm font-semibold text-[var(--text-dark)] hover:bg-[#e6bd2b] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:ring-offset-2"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
} 