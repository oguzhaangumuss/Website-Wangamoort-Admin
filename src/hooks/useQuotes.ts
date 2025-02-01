import { useState, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'sonner'
import { Database } from '../types/database.types'
import { Quote } from '../types/database.types'
import { QuoteStatus } from '../types/quoteStatus'
import * as XLSX from 'xlsx'

type FetchQuotesOptions = {
  page: number
  status?: QuoteStatus | 'all'
  search?: string
  dateStart?: Date
  dateEnd?: Date
}

export function useQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState({
    initial: true,
    search: false,
    status: false,
    export: false
  })
  const [totalCount, setTotalCount] = useState(0)
  const supabase = createClientComponentClient<Database>()

  const fetchQuotes = useCallback(async (options: FetchQuotesOptions) => {
    try {
      if (!loading.initial) {
        setLoading(prev => ({ ...prev, search: true }))
      }

      let query = supabase
        .from('quotes')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((options.page - 1) * 10, options.page * 10 - 1)

      if (options.status && options.status !== 'all') {
        query = query.eq('status', options.status)
      }

      if (options.search) {
        const searchTerm = `%${options.search}%`
        query = query.or(
          `customer_first_name.ilike.${searchTerm},` +
          `customer_last_name.ilike.${searchTerm},` +
          `customer_email.ilike.${searchTerm},` +
          `customer_phone.ilike.${searchTerm}`
        )
      }

      const { data, error, count } = await query

      if (error) throw error

      setQuotes(data || [])
      if (count !== null) setTotalCount(count)

    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to fetch quotes')
    } finally {
      setLoading(prev => ({ 
        ...prev, 
        initial: false,
        search: false 
      }))
    }
  }, [supabase, loading.initial])

  const updateQuoteStatus = async (id: string, status: QuoteStatus) => {
    try {
      // Optimistik güncelleme
      setQuotes(prevQuotes => 
        prevQuotes.map(quote => 
          quote.id === id ? { ...quote, status } : quote
        )
      )

      const { error } = await supabase
        .from('quotes')
        .update({ 
          status,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)

      if (error) {
        throw error
      }

      toast.success('Quote status updated')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Error updating quote status')
      
      // Hata durumunda orijinal duruma geri dön
      await fetchQuotes({
        page: 1,
        status: 'all'
      })
    }
  }

  const exportToExcel = async (quotes: Quote[]) => {
    try {
      const data = quotes.map(quote => ({
        'Date': new Date(quote.created_at).toLocaleDateString(),
        'Customer': `${quote.customer_first_name} ${quote.customer_last_name}`,
        'Email': quote.customer_email,
        'Phone': quote.customer_phone,
        'Status': quote.status,
        'Total Amount': quote.basket.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        'Products': quote.basket.map(item => item.product_name).join(', ')
      }))

      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Quotes')
      XLSX.writeFile(workbook, 'quotes.xlsx')
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      toast.error('Failed to export quotes')
    }
  }

  return {
    quotes,
    loading,
    totalCount,
    fetchQuotes,
    updateQuoteStatus,
    exportToExcel
  }
} 