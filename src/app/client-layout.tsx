'use client'

import Navbar from "../components/layout/navbar";
import { Toaster } from 'sonner'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect } from 'react'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/login'
      }
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event) => {
      if (_event === 'SIGNED_OUT') {
        window.location.href = '/login'
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Toaster 
        position="top-right" 
        expand={false} 
        richColors 
        closeButton
        style={{
          zIndex: 9999,
        }}
        toastOptions={{
          style: {
            background: 'white',
            color: 'black',
          },
          className: 'my-toast-class',
        }}
      />
    </>
  )
} 