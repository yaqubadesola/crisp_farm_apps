'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Pencil, X, Trash2 } from 'lucide-react'
import api from '@/lib/api'
import { fmt } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import type { ApiResponse, PageResponse, Sale, PricingTier, FarmCycle } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  PAID: 'bg-green-100 text-green-700',
  UNPAID: 'bg-orange-100 text-orange-700',
  PARTIAL: 'bg-yellow-100 text-yellow-700',
}

const PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER', 'POS', 'CREDIT']
const INVOICE_STATUSES = ['PAID', 'UNPAID', 'PARTIAL']

interface EditState {
  sale: Sale
  quantityKg: string
  paymentMethod: string
  invoiceStatus: string
  notes: string
  cycleId: string
  saleDate: string
  pricingTierName: string
}

function buildEditState(sale: Sale): EditState {
  return {
    sale,
    quantityKg: String(Number(sale.totalQuantityKg)),
    paymentMethod: sale.paymentMethod,
    invoiceStatus: sale.invoiceStatus,
    notes: sale.notes ?? '',
    cycleId: sale.cycleId ? String(sale.cycleId) : '',
    saleDate: sale.saleDate,
    pricingTierName: sale.customerType,
  }
}

export default function SalesHistoryPage() {
  const { hasRole } = useAuth()
  const isAdmin = hasRole('ADMIN')
  const queryClient = useQueryClient()

  const [from, setFrom] = useState(format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'))
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [statusFilter, setStatusFilter] = useState('')
  const [cycleFilter, setCycleFilter] = useState('')
  const [page, setPage] = useState(0)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['sales', from, to, statusFilter, cycleFilter, page],
    queryFn: () => {
      const params = new URLSearchParams({ from, to, page: String(page), size: '20' })
      if (statusFilter) params.set('status', statusFilter)
      if (cycleFilter) params.set('cycleId', cycleFilter)
      return api.get<ApiResponse<PageResponse<Sale>>>(`/sales?${params}`).then(r => r.data.data)
    },
  })

  const { data: tiers } = useQuery({
    queryKey: ['pricing'],
    queryFn: () => api.get<ApiResponse<PricingTier[]>>('/pricing/tiers').then(r => r.data.data),
    enabled: isAdmin,
  })

  const { data: cycles } = useQuery({
    queryKey: ['cycles', 'all-list'],
    queryFn: () => api.get<ApiResponse<FarmCycle[]>>('/cycles?size=100').then(r => r.data.data),
    retry: false,
  })

  const { mutate: deleteSale, isPending: deleting } = useMutation({
    mutationFn: (id: number) => api.delete(`/sales/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      setDeletingId(null)
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message ?? 'Failed to delete sale')
      setDeletingId(null)
    },
  })

  const { mutate: updateSale, isPending: saving } = useMutation({
    mutationFn: (s: EditState) => {
      const qty = parseFloat(s.quantityKg)
      return api.put<ApiResponse<Sale>>(`/sales/${s.sale.id}`, {
        quantityKg: isNaN(qty) ? undefined : qty,
        paymentMethod: s.paymentMethod,
        invoiceStatus: s.invoiceStatus,
        notes: s.notes || null,
        cycleId: s.cycleId ? parseInt(s.cycleId) : -1,
        saleDate: s.saleDate,
        pricingTierName: s.pricingTierName || null,
      }).then(r => r.data.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      setEditState(null)
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message ?? 'Failed to update sale')
    },
  })

  const selectedTierPrice = editState
    ? Number(tiers?.find(t => t.tierName === editState.pricingTierName)?.pricePerKg ?? 0)
    : 0
  const editQty = editState ? parseFloat(editState.quantityKg) || 0 : 0
  const editEstimated = selectedTierPrice * editQty

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-900">Sales History</h2>
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
        <label className="text-gray-600 ml-2">Status</label>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
        >
          <option value="">All</option>
          {INVOICE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <label className="text-gray-600 ml-2">Cycle</label>
        <select
          value={cycleFilter}
          onChange={e => { setCycleFilter(e.target.value); setPage(0) }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
        >
          <option value="">All Cycles</option>
          {(Array.isArray(cycles) ? cycles : (cycles as any)?.content ?? []).map((c: FarmCycle) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Cycle</th>
                  <th className="px-4 py-3 font-medium text-right">Qty (kg)</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  {isAdmin && <th className="px-4 py-3 font-medium"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.content.length === 0 && (
                  <tr><td colSpan={isAdmin ? 10 : 9} className="px-4 py-8 text-center text-gray-400">No sales in this period</td></tr>
                )}
                {data?.content.map(sale => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{sale.invoiceNumber ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{sale.saleDate}</td>
                    <td className="px-4 py-3 font-medium">{sale.customerName}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                        {sale.customerType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {sale.cycleName ? (
                        <span className="inline-block bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">
                          {sale.cycleName}
                        </span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">{Number(sale.totalQuantityKg).toFixed(3)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{fmt(sale.totalPrice)}</td>
                    <td className="px-4 py-3 text-gray-600">{sale.paymentMethod}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[sale.invoiceStatus] ?? ''}`}>
                        {sale.invoiceStatus}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditState(buildEditState(sale))}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                            title="Edit sale"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeletingId(sale.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete sale"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              {data && data.content.length > 0 && (() => {
                const pageQty = data.content.reduce((s, r) => s + Number(r.totalQuantityKg), 0)
                const pageRev = data.content.reduce((s, r) => s + Number(r.totalPrice), 0)
                return (
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold text-gray-800">
                      <td className="px-4 py-3" colSpan={5}>
                        Page total ({data.content.length} records)
                      </td>
                      <td className="px-4 py-3 text-right">{pageQty.toFixed(3)} kg</td>
                      <td className="px-4 py-3 text-right text-green-700">{fmt(pageRev)}</td>
                      <td colSpan={isAdmin ? 3 : 2} />
                    </tr>
                  </tfoot>
                )
              })()}
            </table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <p className="text-gray-500">{data.totalElements} total records</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 0}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-gray-600">
                  Page {page + 1} of {data.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= data.totalPages - 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete confirm modal */}
      {deletingId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 rounded-xl"><Trash2 size={18} className="text-red-600" /></div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete Sale?</h3>
                <p className="text-sm text-gray-500 mt-0.5">This will permanently remove the sale record and all its line items.</p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => deleteSale(deletingId)}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-900">Edit Sale</h3>
                <p className="text-xs text-gray-500 mt-0.5">{editState.sale.invoiceNumber} · {editState.sale.customerName}</p>
              </div>
              <button onClick={() => setEditState(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Sale date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sale Date</label>
                <input
                  type="date"
                  value={editState.saleDate}
                  onChange={e => setEditState(s => s && { ...s, saleDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              {/* Pricing tier */}
              {tiers && tiers.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-gray-700">Pricing Tier</label>
                    {editState.pricingTierName !== editState.sale.customerType && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        Override — default is {editState.sale.customerType}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {tiers.map(t => (
                      <button
                        key={t.tierName}
                        onClick={() => setEditState(s => s && { ...s, pricingTierName: t.tierName })}
                        className={`px-3 py-2.5 rounded-lg border text-sm text-left transition-colors ${
                          editState.pricingTierName === t.tierName
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'border-gray-300 text-gray-600 hover:border-brand-400'
                        }`}
                      >
                        <div className="font-semibold">{t.tierName}</div>
                        <div className={`text-xs mt-0.5 ${editState.pricingTierName === t.tierName ? 'text-brand-100' : 'text-gray-400'}`}>
                          ₦{Number(t.pricePerKg).toLocaleString()}/kg
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (kg)</label>
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={editState.quantityKg}
                  onChange={e => setEditState(s => s && { ...s, quantityKg: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
                {editQty > 0 && selectedTierPrice > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    New total: <strong className="text-gray-800">₦{editEstimated.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                    <span className="ml-1 text-gray-400">({editState.pricingTierName} @ ₦{selectedTierPrice.toLocaleString()}/kg)</span>
                  </p>
                )}
              </div>

              {/* Payment method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map(m => (
                    <button
                      key={m}
                      onClick={() => setEditState(s => s && { ...s, paymentMethod: m })}
                      className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                        editState.paymentMethod === m
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'border-gray-300 text-gray-600 hover:border-brand-400'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Invoice status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Status</label>
                <div className="flex gap-2">
                  {INVOICE_STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => setEditState(es => es && { ...es, invoiceStatus: s })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        editState.invoiceStatus === s
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'border-gray-300 text-gray-600 hover:border-brand-400'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cycle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Farm Cycle <span className="text-red-500">*</span>
                </label>
                <select
                  value={editState.cycleId}
                  onChange={e => setEditState(s => s && { ...s, cycleId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                >
                  <option value="">— Select a cycle —</option>
                  {(Array.isArray(cycles) ? cycles : (cycles as any)?.content ?? []).map((c: FarmCycle) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={editState.notes}
                  onChange={e => setEditState(s => s && { ...s, notes: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setEditState(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => updateSale(editState)}
                disabled={saving || !editState.cycleId}
                className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
