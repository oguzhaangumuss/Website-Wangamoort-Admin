"use client";

import { useEffect, useState } from "react";
import { useQuotes } from "../../hooks/useQuotes";
import { QuoteStatus } from "../../types/quoteStatus";
import { DatePicker } from "../../components/quotes/DatePicker";
import { StatCard } from "../../components/quotes/StatCard";
import { Pagination } from "../../components/quotes/Pagination";
import { QuoteRow } from "../../components/quotes/QuoteRow";
import { QuoteDetailModal } from "../../components/quotes/QuoteDetailModal";
import { Quote } from "@/types/database.types";
import { useDebounce } from "../../hooks/useDebounce";
import { toast } from "sonner";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function QuotesPage() {
  const { quotes, loading, totalCount, fetchQuotes, updateQuoteStatus } =
    useQuotes();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({
    start: null,
    end: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [totalStatusCounts, setTotalStatusCounts] = useState<
    Record<QuoteStatus, number>
  >({
    pending: 0,
    approved: 0,
    completed: 0,
    cancelled: 0,
  });
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchQuotes({
      page: currentPage,
      status: statusFilter,
      search: debouncedSearch,
      dateStart: dateRange.start || undefined,
      dateEnd: dateRange.end || undefined,
    });
  }, [currentPage, statusFilter, debouncedSearch, dateRange, fetchQuotes]);

  // Tüm quote'ların durumlarını sayan yeni bir useEffect ekleyelim
  useEffect(() => {
    const fetchTotalCounts = async () => {
      const { data, error } = await supabase.from("quotes").select("status");

      if (error) {
        console.error("Error fetching total status counts:", error);
        return;
      }

      const counts = data.reduce((acc, quote) => {
        const status = quote.status as QuoteStatus;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<QuoteStatus, number>);

      setTotalStatusCounts(counts);
    };

    fetchTotalCounts();
  }, [supabase]);

  const handleDelete = async (quoteId: string) => {
    toast.custom(
      (t) => (
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Delete Quote</h3>
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete this quote? This action cannot be
            undone.
          </p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => toast.dismiss(t)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t);
                setIsDeleting(quoteId);

                try {
                  const {
                    data: { session },
                  } = await supabase.auth.getSession();
                  if (!session) {
                    throw new Error("No active session. Please login again.");
                  }

                  const { data, error } = await supabase
                    .from("quotes")
                    .delete()
                    .eq("id", quoteId)
                    .select("*");

                  if (error) throw error;

                  // Silinen quote'un status'ünü kullanarak totalStatusCounts'u güncelle
                  if (data && data[0]) {
                    const deletedStatus = data[0].status as QuoteStatus;
                    setTotalStatusCounts((prev) => ({
                      ...prev,
                      [deletedStatus]: Math.max(
                        0,
                        (prev[deletedStatus] || 0) - 1
                      ),
                    }));
                  }

                  toast.success("Quote deleted successfully");

                  // Listeyi yenile
                  await fetchQuotes({
                    page: currentPage,
                    status: statusFilter,
                    search: debouncedSearch,
                    dateStart: dateRange.start || undefined,
                    dateEnd: dateRange.end || undefined,
                  });

                  // Tüm status sayılarını yeniden çek
                  const { data: newStatusData } = await supabase
                    .from("quotes")
                    .select("status");

                  if (newStatusData) {
                    const newCounts = newStatusData.reduce((acc, quote) => {
                      const status = quote.status as QuoteStatus;
                      acc[status] = (acc[status] || 0) + 1;
                      return acc;
                    }, {} as Record<QuoteStatus, number>);

                    setTotalStatusCounts(newCounts);
                  }
                } catch (error: unknown) {
                  console.error("Delete error:", error);
                  // Hata mesajını güvenli bir şekilde işle
                  const errorMessage =
                    error instanceof Error
                      ? error.message
                      : "An unexpected error occurred";
                  toast.error(errorMessage);
                } finally {
                  setIsDeleting(null);
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
      }
    );
  };

  // İlk yükleme için loading skeleton
  if (loading.initial) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 space-y-4">
          {/* Search ve Filter Skeletons */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 h-10 bg-gray-200 rounded-lg animate-pulse" />
            <div className="w-48 h-10 bg-gray-200 rounded-lg animate-pulse" />
            <div className="w-48 h-10 bg-gray-200 rounded-lg animate-pulse" />
          </div>

          {/* Stat Cards Skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-gray-200 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-gray-100 rounded mb-2 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Tablo içeriğini render eden fonksiyon
  const renderTableContent = () => {
    if (loading.search) {
      return (
        <tr>
          <td colSpan={6} className="p-4">
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          </td>
        </tr>
      );
    }

    if (quotes.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="p-8 text-center text-gray-500">
            No quotes found
          </td>
        </tr>
      );
    }

    return quotes.map((quote) => (
      <QuoteRow
        key={quote.id}
        quote={quote}
        onStatusChange={updateQuoteStatus}
        onViewDetails={() => {
          setSelectedQuote(quote);
          setIsDetailModalOpen(true);
        }}
        onDelete={() => handleDelete(quote.id)}
        isDeleting={isDeleting === quote.id}
      />
    ));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 space-y-4">
        {/* Search ve Filtreler */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <input
              type="text"
              placeholder="Search by customer name, email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
            {loading.search && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
              </div>
            )}
          </div>

          {/* Status Filtresi */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as QuoteStatus | "all")
            }
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Tarih Aralığı */}
          <div className="flex gap-2">
            <DatePicker
              selected={dateRange.start}
              onChange={(date: Date | null) =>
                setDateRange((prev) => ({ ...prev, start: date }))
              }
              placeholderText="Start Date"
              className="px-4 py-2 border rounded-lg"
            />
            <DatePicker
              selected={dateRange.end}
              onChange={(date: Date | null) =>
                setDateRange((prev) => ({ ...prev, end: date }))
              }
              placeholderText="End Date"
              className="px-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Pending"
            count={totalStatusCounts["pending"] || 0}
            className="bg-yellow-50"
          />
          <StatCard
            title="Approved"
            count={totalStatusCounts["approved"] || 0}
            className="bg-green-50"
          />
          <StatCard
            title="Completed"
            count={totalStatusCounts["completed"] || 0}
            className="bg-blue-50"
          />
          <StatCard
            title="Cancelled"
            count={totalStatusCounts["cancelled"] || 0}
            className="bg-red-50"
          />
        </div>
      </div>

      {/* Quotes Tablosu */}
      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-center">Case ID</th>
              <th className="p-4 text-left">Customer</th>
              <th className="p-4 text-left">Total</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>{renderTableContent()}</tbody>
        </table>

        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalCount / 10)}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Detail Modal */}
      {selectedQuote && (
        <QuoteDetailModal
          quote={selectedQuote}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedQuote(null);
          }}
        />
      )}
    </div>
  );
}
