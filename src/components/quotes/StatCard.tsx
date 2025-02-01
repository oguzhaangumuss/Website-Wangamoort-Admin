type StatCardProps = {
  title: string
  count: number
  className?: string
}

export function StatCard({ title, count, className = '' }: StatCardProps) {
  return (
    <div className={`p-4 rounded-lg ${className}`}>
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <p className="text-3xl font-bold mt-2">{count}</p>
    </div>
  )
} 