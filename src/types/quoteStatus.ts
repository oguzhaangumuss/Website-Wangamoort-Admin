export type QuoteStatus = 
  | 'pending'     // Beklemede
  | 'approved'    // Onaylandı
  | 'completed'   // Tamamlandı
  | 'cancelled'   // İptal Edildi

  | 'in_progress' // İşlemde
  | 'on_hold'     // Bekliyor
  | 'on_delivery' // Teslim Ediliyor
  | 'delivered'   // Teslim Edildi

// Database'deki quotes tablosunun status alanı için type guard
export function isValidQuoteStatus(status: string): status is QuoteStatus {
  return [
    'pending',
    'approved',
    'completed',
    'cancelled',
    'in_progress',
    'on_hold',
    'on_delivery',
    'delivered'
  ].includes(status)
}

