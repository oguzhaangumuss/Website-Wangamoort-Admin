import { Quote } from "@/types/database.types";
import { QuoteStatus } from "../types/quoteStatus";
import { useState } from "react";
import { QuoteDetailModal } from "../components/quotes/QuoteDetailModal";

type QuoteRowProps = {
  quote: Quote;
  onStatusChange: (id: string, status: QuoteStatus) => void;
};

export function QuoteRow({ quote, onStatusChange }: QuoteRowProps) {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  // Toplam tutarı hesapla
  const total = quote.basket.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Tarih formatla
  const formattedDate = new Date(quote.created_at).toLocaleDateString("tr-TR");

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="p-4">{formattedDate}</td>
      <td className="p-4">
        <div>
          {quote.customer_first_name} {quote.customer_last_name}
        </div>
        <div className="text-sm text-gray-500">{quote.customer_email}</div>
      </td>
      <td className="p-4">₺{total.toLocaleString("tr-TR")}</td>
      <td className="p-4">
        <select
          value={quote.status}
          onChange={(e) =>
            onStatusChange(quote.id, e.target.value as QuoteStatus)
          }
          className="px-3 py-1 border rounded-lg"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </td>
      <td className="p-4">
        <button
          onClick={() => setIsDetailModalOpen(true)}
          className="text-blue-600 hover:text-blue-800"
        >
          Details
        </button>
      </td>

      <QuoteDetailModal
        quote={quote}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </tr>
  );
}
