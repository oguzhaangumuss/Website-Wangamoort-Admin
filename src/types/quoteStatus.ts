export type QuoteStatus = 
  | 'pending'     // Beklemede
  | 'approved'    // Onaylandı
  | 'completed'   // Tamamlandı
  | "cancelled"; // İptal Edildi

// Database'deki quotes tablosunun status alanı için type guard
export function isValidQuoteStatus(status: string): status is QuoteStatus {
  return [
    'pending',
    'approved',
    'completed',
    "cancelled",
  ].includes(status);
}

