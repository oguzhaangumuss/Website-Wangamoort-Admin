import { Dialog } from '@headlessui/react'
import { Quote } from '../../types/database.types'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { exportQuoteToExcel } from '../../services/excelExport'

type QuoteDetailModalProps = {
  quote: Quote
  isOpen: boolean
  onClose: () => void
}

export function QuoteDetailModal({ quote, isOpen, onClose }: QuoteDetailModalProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-3xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <Dialog.Title className="text-2xl font-bold">
              Quote Details
            </Dialog.Title>
            <div className="flex gap-2">
              <button
                onClick={() => exportQuoteToExcel(quote)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium 
                  text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                Export to Excel
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Customer Info */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p>{quote.customer_first_name} {quote.customer_last_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p>{quote.customer_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p>{quote.customer_phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Company</p>
                  <p>{quote.company_name || '-'}</p>
                </div>
              </div>
            </div>

            {/* Products */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Products</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Product</th>
                      <th className="text-left py-2">Size</th>
                      <th className="text-left py-2">Color</th>
                      <th className="text-right py-2">Quantity</th>
                      <th className="text-right py-2">Price</th>
                      <th className="text-right py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.basket.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{item.product_name}</td>
                        <td className="py-2">{item.selected_size}</td>
                        <td className="py-2">{item.selected_color}</td>
                        <td className="py-2 text-right">{item.quantity}</td>
                        <td className="py-2 text-right">{formatPrice(item.price)}</td>
                        <td className="py-2 text-right">{formatPrice(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Additional Services */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Additional Services</h3>
              <div className="space-y-2">
                <p>Delivery: {quote.is_delivery ? 'Yes' : 'No'}</p>
                <p>Installation: {quote.is_installation ? 'Yes' : 'No'}</p>
                <p>Rubbish Removal: {quote.is_rubbish_removal ? 'Yes' : 'No'}</p>
              </div>
            </div>

            {/* Notes */}
            {quote.notes && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Notes</h3>
                <p className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">{quote.notes}</p>
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
} 