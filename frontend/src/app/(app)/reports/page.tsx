'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts'
import api from '@/lib/api'
import { fmt } from '@/lib/utils'
import type { ApiResponse, RangeReport, DailySalesReport } from '@/types'

const PRESETS = [
  { label: 'Today', from: () => format(new Date(), 'yyyy-MM-dd'), to: () => format(new Date(), 'yyyy-MM-dd') },
  { label: 'Last 7 days', from: () => format(subDays(new Date(), 6), 'yyyy-MM-dd'), to: () => format(new Date(), 'yyyy-MM-dd') },
  { label: 'This month', from: () => format(startOfMonth(new Date()), 'yyyy-MM-dd'), to: () => format(endOfMonth(new Date()), 'yyyy-MM-dd') },
  { label: 'Last 30 days', from: () => format(subDays(new Date(), 29), 'yyyy-MM-dd'), to: () => format(new Date(), 'yyyy-MM-dd') },
]

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent ?? 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function ReportsPage() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const [from, setFrom] = useState(monthStart)
  const [to, setTo] = useState(today)

  const { data: rangeReport, isFetching } = useQuery({
    queryKey: ['range-report', from, to],
    queryFn: () => api.get<ApiResponse<RangeReport>>(`/reports/range?from=${from}&to=${to}`).then(r => r.data.data),
  })

  const { data: breakdown } = useQuery({
    queryKey: ['report-breakdown', from, to],
    queryFn: () => api.get<ApiResponse<DailySalesReport[]>>(`/reports/breakdown?from=${from}&to=${to}`).then(r => r.data.data),
  })

  const chartData = (breakdown ?? []).map(d => ({
    date: format(new Date(d.date + 'T00:00:00'), 'dd/MM'),
    revenue: Number(d.totalRevenue),
    qty: Number(d.totalQuantityKg),
    sales: d.transactionCount,
  }))

  const margin = rangeReport ? Number(rangeReport.netProfit) : 0
  const marginPct = rangeReport && Number(rangeReport.totalRevenue) > 0
    ? ((margin / Number(rangeReport.totalRevenue)) * 100).toFixed(1)
    : '0'

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-900">Reports</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => { setFrom(p.from()); setTo(p.to()) }}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date picker */}
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <label className="text-gray-600">From</label>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
        <label className="text-gray-600">To</label>
        <input type="date" value={to} onChange={e => setTo(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
        {isFetching && <span className="text-xs text-gray-400">Loading…</span>}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={fmt(rangeReport?.totalRevenue)} sub={`${rangeReport?.salesCount ?? 0} sales`} />
        <StatCard label="Total Quantity" value={`${Number(rangeReport?.totalQuantityKg ?? 0).toFixed(2)} kg`} />
        <StatCard label="Total Expenses" value={fmt(rangeReport?.totalExpenses)} accent="text-red-600" />
        <StatCard
          label="Net Profit"
          value={fmt(rangeReport?.netProfit)}
          sub={`${marginPct}% margin`}
          accent={margin >= 0 ? 'text-green-700' : 'text-red-600'}
        />
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Daily Revenue</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`₦${v.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#df5014" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-400 text-center py-10">No sales data in this period</p>
        )}
      </div>

      {/* Volume chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Daily Volume (kg)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [`${v.toFixed(2)} kg`, 'Volume']} />
              <Line dataKey="qty" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Breakdown table */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Transactions</th>
                <th className="px-4 py-3 font-medium text-right">Volume (kg)</th>
                <th className="px-4 py-3 font-medium text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(breakdown ?? []).map(d => (
                <tr key={d.date} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{d.date}</td>
                  <td className="px-4 py-3 text-right">{d.transactionCount}</td>
                  <td className="px-4 py-3 text-right">{Number(d.totalQuantityKg).toFixed(3)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{fmt(d.totalRevenue)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold text-gray-800">
                <td className="px-4 py-3">Total ({breakdown?.length ?? 0} days)</td>
                <td className="px-4 py-3 text-right">{rangeReport?.salesCount ?? 0}</td>
                <td className="px-4 py-3 text-right">{Number(rangeReport?.totalQuantityKg ?? 0).toFixed(3)} kg</td>
                <td className="px-4 py-3 text-right text-green-700">{fmt(rangeReport?.totalRevenue)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
