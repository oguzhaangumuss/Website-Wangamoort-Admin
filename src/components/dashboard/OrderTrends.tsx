'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { formatCurrency } from '../../utils/formatters'

type OrderTrendsProps = {
  trends: Array<{
    date: string
    orders: number
    revenue: number
  }>
  dateRange: '7' | '30'
  onDateRangeChange: (range: '7' | '30') => void
}

export function OrderTrends({ trends, dateRange, onDateRangeChange }: OrderTrendsProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-500 text-sm font-medium">Order Trends</h3>
        <select
          value={dateRange}
          onChange={(e) => onDateRangeChange(e.target.value as '7' | '30')}
          className="border rounded-md px-2 py-1 text-sm"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
        </select>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={trends}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(date) => format(new Date(date), 'MMM dd')}
          />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip 
            formatter={(value: string | number | Array<string | number>) => {
              const numValue = Number(value)
              if (isNaN(numValue)) return value
              return formatCurrency(numValue)
            }}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="orders"
            stroke="#8884d8"
            name="Orders"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="revenue"
            stroke="#82ca9d"
            name="Revenue"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
} 