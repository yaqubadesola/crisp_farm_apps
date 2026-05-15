'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, subDays, startOfMonth } from 'date-fns'
import { Plus, X, Pencil } from 'lucide-react'
import api from '@/lib/api'
import { fmt } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import type { ApiResponse, PageResponse, Expense, ExpenseCategory, ExpenseSummary } from '@/types'

const CATEGORIES: ExpenseCategory[] = ['FEED', 'MEDICATION', 'LABOR', 'LOGISTICS', 'SALARY', 'UTILITIES', 'OTHER']

const CATEGORY_COLORS: Record<string, string> = {
  FEED: 'bg-green-100 text-green-700',
  MEDICATION: 'bg-blue-100 text-blue-700',
  LABOR: 'bg-purple-100 text-purple-700',
  LOGISTICS: 'bg-yellow-100 text-yellow-700',
  SALARY: 'bg-pink-100 text-pink-700',
  UTILITIES: 'bg-orange-100 text-orange-700',
  OTHER: 'bg-gray-100 text-gray-600',
}

function SummaryCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent ?? 'text-gray-900'}`}>{value}</p>
    </div>
  )
}

export default function ExpensesPage() {
  const qc = useQueryClient()
  const { hasRole } = useAuth()
  const canEdit = hasRole('ADMIN', 'FARM_MANAGER', 'ACCOUNTANT')
  const today = format(new Date(), 'yyyy-MM-dd')
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')

  const [from, setFrom] = useState(monthStart)
  const [to, setTo] = useState(today)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  // Create form state
  const [category, setCategory] = useState<ExpenseCategory>('FEED')
  const [amount, setAmount] = useState('')
  const [expenseDate, setExpenseDate] = useState(today)
  const [description, setDescription] = useState('')

  // Edit form state
  const [editCategory, setEditCategory] = useState<ExpenseCategory>('FEED')
  const [editAmount, setEditAmount] = useState('')
  const [editDate, setEditDate] = useState(today)
  const [editDescription, setEditDescription] = useState('')

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', from, to, categoryFilter, page],
    queryFn: () => {
      const params = new URLSearchParams({ from, to, page: String(page), size: '20' })
      return api.get<ApiResponse<PageResponse<Expense>>>(`/expenses?${params}`)
        .then(r => r.data.data)
    },
  })

  const { data: summary } = useQuery({
    queryKey: ['expenses', 'summary', from, to],
    queryFn: () =>
      api.get<ApiResponse<ExpenseSummary>>(`/expenses/summary?from=${from}&to=${to}`)
        .then(r => r.data.data),
  })

  const { mutate: updateExpense, isPending: updatingExpense } = useMutation({
    mutationFn: (e: Expense) =>
      api.put(`/expenses/${e.id}`, {
        category: editCategory,
        amount: parseFloat(editAmount),
        expenseDate: editDate,
        description: editDescription || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      setEditingExpense(null)
    },
    onError: (err: any) => alert(err?.response?.data?.message ?? 'Failed to update expense'),
  })

  const openEdit = (e: Expense) => {
    setEditingExpense(e)
    setEditCategory(e.category)
    setEditAmount(String(Number(e.amount)))
    setEditDate(e.expenseDate)
    setEditDescription(e.description ?? '')
  }

  const { mutate: createExpense, isPending } = useMutation({
    mutationFn: () =>
      api.post('/expenses', {
        category,
        amount: parseFloat(amount),
        expenseDate,
        description: description || null,
        cycleId: null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      setShowForm(false)
      setAmount('')
      setDescription('')
      setCategory('FEED')
      setExpenseDate(today)
    },
    onError: (err: any) => alert(err?.response?.data?.message ?? 'Failed to record expense'),
  })

  const topCategory = summary?.byCategory
    ? Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1])[0]
    : null

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-900">Expenses</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
        >
          <Plus size={15} /> Record Expense
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <label className="text-gray-600">From</label>
        <input
          type="date" value={from}
          onChange={e => { setFrom(e.target.value); setPage(0) }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        />
        <label className="text-gray-600">To</label>
        <input
          type="date" value={to}
          onChange={e => { setTo(e.target.value); setPage(0) }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        />
        <label className="text-gray-600 ml-2">Category</label>
        <select
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setPage(0) }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
        >
          <option value="">All</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryCard label="Total Expenses" value={fmt(summary?.totalAmount)} accent="text-red-600" />
        <SummaryCard
          label="Top Category"
          value={topCategory ? topCategory[0] : '—'}
          accent="text-gray-700"
        />
        <SummaryCard
          label="Top Category Amount"
          value={topCategory ? fmt(topCategory[1]) : '—'}
          accent="text-orange-600"
        />
      </div>

      {/* Category breakdown */}
      {summary?.byCategory && Object.keys(summary.byCategory).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">By Category</p>
          <div className="space-y-2">
            {Object.entries(summary.byCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amt]) => {
                const pct = summary.totalAmount > 0
                  ? Math.round((amt / summary.totalAmount) * 100)
                  : 0
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[cat] ?? 'bg-gray-100 text-gray-600'}`}>{cat}</span>
                      <span className="text-gray-700 font-medium">{fmt(amt)} <span className="text-gray-400 text-xs">({pct}%)</span></span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Recorded By</th>
                  {canEdit && <th className="px-4 py-3 font-medium"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expenses?.content.length === 0 && (
                  <tr><td colSpan={canEdit ? 6 : 5} className="px-4 py-8 text-center text-gray-400">No expenses in this period</td></tr>
                )}
                {(expenses?.content ?? [])
                  .filter(e => !categoryFilter || e.category === categoryFilter)
                  .map(e => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{e.expenseDate}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[e.category] ?? ''}`}>
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-red-700">{fmt(e.amount)}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{e.description ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{e.recordedBy}</td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openEdit(e)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="Edit expense"
                        >
                          <Pencil size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              {expenses && expenses.content.length > 0 && (() => {
                const visibleRows = categoryFilter
                  ? expenses.content.filter(e => e.category === categoryFilter)
                  : expenses.content
                const pageTotal = visibleRows.reduce((s, e) => s + Number(e.amount), 0)
                return (
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold text-gray-800">
                      <td className="px-4 py-3" colSpan={2}>
                        Page total ({visibleRows.length} records)
                      </td>
                      <td className="px-4 py-3 text-right text-red-700">{fmt(pageTotal)}</td>
                      <td colSpan={canEdit ? 3 : 2} />
                    </tr>
                    <tr className="bg-red-50 font-semibold text-gray-800">
                      <td className="px-4 py-3" colSpan={2}>
                        Period total {categoryFilter ? `(${categoryFilter})` : ''}
                      </td>
                      <td className="px-4 py-3 text-right text-red-700">{fmt(summary?.totalAmount)}</td>
                      <td colSpan={canEdit ? 3 : 2} />
                    </tr>
                  </tfoot>
                )
              })()}
            </table>
          </div>

          {expenses && expenses.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <p className="text-gray-500">{expenses.totalElements} total records</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Previous</button>
                <span className="px-3 py-1.5 text-gray-600">Page {page + 1} of {expenses.totalPages}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= expenses.totalPages - 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit expense modal */}
      {editingExpense && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-lg">Edit Expense</h3>
              <button onClick={() => setEditingExpense(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={editCategory}
                onChange={e => setEditCategory(e.target.value as ExpenseCategory)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦)</label>
              <input
                type="number" min="0.01" step="0.01"
                value={editAmount}
                onChange={e => setEditAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date" value={editDate}
                onChange={e => setEditDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400">(optional)</span></label>
              <textarea
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setEditingExpense(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => updateExpense(editingExpense)}
                disabled={updatingExpense || !editAmount || parseFloat(editAmount) <= 0}
                className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
              >
                {updatingExpense ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record expense modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-lg">Record Expense</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ExpenseCategory)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦)</label>
              <input
                type="number" min="0.01" step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={expenseDate}
                onChange={e => setExpenseDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400">(optional)</span></label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => createExpense()}
                disabled={isPending || !amount || parseFloat(amount) <= 0}
                className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
              >
                {isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
