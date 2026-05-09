'use client'

import { useQuery } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '@/lib/api'
import { fmt } from '@/lib/utils'
import type { ApiResponse, DailySalesReport, RangeReport, FarmCycle, DebtSummary } from '@/types'

function cn(...c: (string | undefined)[]) { return c.filter(Boolean).join(' ') }

function StatCard({ label, value, sub, accent }: {
  label: string; value: string; sub?: string; accent?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={cn('text-2xl font-bold mt-1', accent ?? 'text-gray-900')}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const weekAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd')

  const { data: daily } = useQuery({
    queryKey: ['report', 'daily', today],
    queryFn: () => api.get<ApiResponse<DailySalesReport>>(`/reports/daily?date=${today}`).then(r => r.data.data),
  })

  const { data: weekly } = useQuery({
    queryKey: ['report', 'range', weekAgo, today],
    queryFn: () => api.get<ApiResponse<RangeReport>>(`/reports/range?from=${weekAgo}&to=${today}`).then(r => r.data.data),
  })

  const { data: breakdown } = useQuery({
    queryKey: ['report', 'breakdown', weekAgo, today],
    queryFn: () => api.get<ApiResponse<DailySalesReport[]>>(`/reports/breakdown?from=${weekAgo}&to=${today}`).then(r => r.data.data),
  })

  const { data: activeCycle } = useQuery({
    queryKey: ['cycles', 'active'],
    queryFn: () => api.get<ApiResponse<FarmCycle | null>>('/cycles/active').then(r => r.data.data),
    retry: false,
  })

  const { data: debtSummary } = useQuery({
    queryKey: ['debts'],
    queryFn: () => api.get<ApiResponse<DebtSummary>>('/debts').then(r => r.data.data),
  })

  const chartData = (breakdown ?? []).map((d) => ({
    date: format(new Date(d.date + 'T00:00:00'), 'dd/MM'),
    revenue: Number(d.totalRevenue),
  }))

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Revenue"
          value={fmt(daily?.totalRevenue)}
          sub={`${daily?.transactionCount ?? 0} sales`}
        />
        <StatCard label="Today's Quantity" value={`${Number(daily?.totalQuantityKg ?? 0).toFixed(2)} kg`} />
        <StatCard
          label="Outstanding Debts"
          value={fmt(debtSummary?.totalOutstanding)}
          accent={debtSummary && debtSummary.totalOutstanding > 0 ? 'text-orange-600' : undefined}
          sub={`${debtSummary?.totalDebtors ?? 0} debtors`}
        />
        <StatCard
          label="Week Revenue"
          value={fmt(weekly?.totalRevenue)}
          sub={`${weekly?.salesCount ?? 0} sales`}
        />
      </div>

      {activeCycle && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Active Cycle</p>
            <p className="text-lg font-bold text-green-800">{activeCycle.name}</p>
            <p className="text-sm text-green-700 mt-0.5">
              Started {activeCycle.startDate}
              {activeCycle.pondName && ` · ${activeCycle.pondName}`}
              {activeCycle.fingerlingCount && ` · ${activeCycle.fingerlingCount.toLocaleString()} fingerlings`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-green-600">Mortalities</p>
            <p className="text-2xl font-bold text-green-800">{activeCycle.totalMortalities}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue — Last 7 Days</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`₦${v.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#df5014" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-400 text-center py-10">No sales data for this period</p>
        )}
      </div>
    </div>
  )
}
