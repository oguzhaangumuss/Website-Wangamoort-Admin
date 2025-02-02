import * as XLSX from 'xlsx'
import { Quote } from '../types/database.types'


const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const exportQuoteToExcel = (quote: Quote) => {
  const workbook = XLSX.utils.book_new()

  // Quote Overview Sayfası
  const quoteOverview = [
    ['Quote Overview'],
    ['Case ID', quote.case_id],
    ['Status', quote.status.toUpperCase()],
    ['Created At', formatDate(quote.created_at)],
    ['Updated At', formatDate(quote.updated_at)],
    [],
    ['Total Amount', formatPrice(quote.basket.reduce((sum, item) => sum + (item.price * item.quantity), 0))],
  ]
  const overviewSheet = XLSX.utils.aoa_to_sheet(quoteOverview)
  XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Quote Overview')

  // Müşteri Bilgileri Sayfası
  const customerInfo = [
    ['Customer Information'],
    ['Full Name', `${quote.customer_first_name} ${quote.customer_last_name}`],
    ['Email', quote.customer_email],
    ['Phone', quote.customer_phone],
    ['Company', quote.company_name || '-'],
    [],
    ['Delivery Address'],
    ['Street', quote.delivery_address?.street || '-'],
    ['City', quote.delivery_address?.city || '-'],
    ['State', quote.delivery_address?.state || '-'],
    ['Postal Code', quote.delivery_address?.postcode || '-'],
    [],
    ['Additional Services'],
    ['Delivery', quote.is_delivery ? 'Yes' : 'No'],
    ['Installation', quote.is_installation ? 'Yes' : 'No'],
    ['Rubbish Removal', quote.is_rubbish_removal ? 'Yes' : 'No'],
    [],
    ['Notes'],
    [quote.notes || '-']
  ]
  const customerSheet = XLSX.utils.aoa_to_sheet(customerInfo)
  XLSX.utils.book_append_sheet(workbook, customerSheet, 'Customer Info')

  // Ürünler Sayfası
  const products = [
    ['Product Details'],
    ['Product', 'Size', 'Color', 'Quantity', 'Unit Price', 'Total Price'],
    ...quote.basket.map(item => [
      item.product_name,
      item.selected_size,
      item.selected_color,
      item.quantity,
      formatPrice(item.price),
      formatPrice(item.price * item.quantity)
    ]),
    [],
    ['Subtotal', '', '', '', '', formatPrice(quote.basket.reduce((sum, item) => sum + (item.price * item.quantity), 0))]
  ]
  const productsSheet = XLSX.utils.aoa_to_sheet(products)
  XLSX.utils.book_append_sheet(workbook, productsSheet, 'Products')

  // Excel dosyasını indir
  XLSX.writeFile(workbook, `Quote_${quote.id}_${new Date().toISOString().split('T')[0]}.xlsx`)
} 