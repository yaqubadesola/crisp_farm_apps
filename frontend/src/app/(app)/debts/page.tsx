'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { X, CreditCard } from 'lucide-react'
import api from '@/lib/api'
import { fmt } from '@/lib/utils'
import type { ApiResponse, DebtSummary, DebtDto, Payment } from '@/types'

const PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER', 'POS']

export default function DebtsPage() {
  const qc = useQueryClient()
  const today = format(new Date(), 'yyyy-MM-dd')

  const [selectedDebt, setSelectedDebt] = useState<DebtDto | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payDate, setPayDate] = useState(today)
  const [payMethod, setPayMethod] = useState('CASH')
  const [payNotes, setPayNotes] = useState('')

  const { data: debtSummary, isLoading } = useQuery({
    queryKey: ['debts'],
    queryFn: () => api.get<ApiResponse<DebtSummary>>('/debts').then(r => r.data.data),
  })

  const { data: payments } = useQuery({
    queryKey: ['payments', selectedDebt?.saleId],
    queryFn: () =>
      api.get<ApiResponse<Payment[]>>(`/sales/${selectedDebt!.saleId}/payments`)
        .then(r => r.data.data),
    enabled: !!selectedDebt,
  })

  const { mutate: recordPayment, isPending } = useMutation({
    mutationFn: () =>
      api.post('/payments', {
        saleId: selectedDebt!.saleId,
        amount: parseFloat(payAmount),
        paymentDate: payDate,
        paymentMethod: payMethod,
        notes: payNotes || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['debts'] })
      qc.invalidateQueries({ queryKey: ['payments', selectedDebt?.saleId] })
      setSelectedDebt(null)
      setPayAmount('')
      setPayNotes('')
      setPayMethod('CASH')
    },
    onError: (err: any) => alert(err?.response?.data?.message ?? 'Payment failed'),
  })

  const maxPay = selectedDebt ? Number(selectedDebt.balance) : 0

  return (
    <div className="p-6 space-y-5">
      <h2 className="text-xl font-bold text-gray-900">Outstanding Debts</h2>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Outstanding</p>
          <p className="text-2xl font-bold mt-1 text-orange-600">{fmt(debtSummary?.totalOutstanding)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Debtors</p>
          <p className="text-2xl font-bold mt-1 text-gray-900">{debtSummary?.totalDebtors ?? 0}</p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Sale Date</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium text-right">Paid</th>
                <th className="px-4 py-3 font-medium text-right">Balance</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {!debtSummary?.debts?.length && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No outstanding debts</td></tr>
              )}
              {debtSummary?.debts?.map(debt => (
                <tr key={debt.saleId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{debt.invoiceNumber ?? '—'}</td>
                  <td className="px-4 py-3 font-medium">{debt.customerName}</td>
                  <td className="px-4 py-3 text-gray-600">{debt.saleDate}</td>
                  <td className="px-4 py-3 text-right">{fmt(debt.totalAmount)}</td>
                  <td className="px-4 py-3 text-right text-green-700">{fmt(debt.paidAmount)}</td>
                  <td className="px-4 py-3 text-right font-bold text-orange-600">{fmt(debt.balance)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setSelectedDebt(debt); setPayAmount(String(debt.balance)) }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-brand-600 text-white text-xs rounded-lg hover:bg-brand-700"
                    >
                      <CreditCard size={12} /> Pay
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment modal */}
      {selectedDebt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-lg">Record Payment</h3>
              <button onClick={() => setSelectedDebt(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="bg-orange-50 border border-orange-100 rounded-lg px-4 py-3 text-sm">
              <p className="font-semibold text-gray-800">{selectedDebt.customerName}</p>
              <p className="text-gray-600">{selectedDebt.invoiceNumber} · Balance: <strong className="text-orange-700">{fmt(selectedDebt.balance)}</strong></p>
            </div>

            {/* Payment history */}
            {payments && payments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Previous Payments</p>
                <div className="space-y-1">
                  {payments.map(p => (
                    <div key={p.id} className="flex justify-between text-xs text-gray-600 py-1 border-b border-gray-50">
                      <span>{p.paymentDate} · {p.paymentMethod}</span>
                      <span className="font-medium text-green-700">{fmt(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦)</label>
              <input
                type="number" min="0.01" max={maxPay} step="0.01"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-xs text-gray-400 mt-1">Max: {fmt(maxPay)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
              <input
                type="date" value={payDate}
                onChange={e => setPayDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
              <div className="flex gap-2">
                {PAYMENT_METHODS.map(m => (
                  <button key={m} onClick={() => setPayMethod(m)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      payMethod === m ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-300 text-gray-600 hover:border-brand-400'
                    }`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes <span className="text-gray-400">(optional)</span></label>
              <input
                type="text" value={payNotes}
                onChange={e => setPayNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setSelectedDebt(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => recordPayment()}
                disabled={isPending || !payAmount || parseFloat(payAmount) <= 0 || parseFloat(payAmount) > maxPay}
                className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
              >
                {isPending ? 'Processing…' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
