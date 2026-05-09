'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Search, Printer, CheckCircle } from 'lucide-react'
import api from '@/lib/api'
import { fmt } from '@/lib/utils'
import type { ApiResponse, Customer, PricingTier, FarmCycle, Sale } from '@/types'

const PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER', 'POS', 'CREDIT']

export default function NewSalePage() {
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedTierName, setSelectedTierName] = useState<string>('')
  const [quantityKg, setQuantityKg] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [cycleId, setCycleId] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [receipt, setReceipt] = useState<Sale | null>(null)
  const receiptRef = useRef<HTMLDivElement>(null)

  const { data: searchResults, isFetching: searching } = useQuery({
    queryKey: ['customers', 'search', search],
    queryFn: () =>
      api.get<ApiResponse<{ content: Customer[] }>>(`/customers?search=${encodeURIComponent(search)}&size=8`)
        .then(r => r.data.data.content),
    enabled: search.length >= 2,
  })

  const { data: tiers } = useQuery({
    queryKey: ['pricing'],
    queryFn: () => api.get<ApiResponse<PricingTier[]>>('/pricing/tiers').then(r => r.data.data),
  })

  const { data: cycles } = useQuery({
    queryKey: ['cycles', 'active-list'],
    queryFn: () => api.get<ApiResponse<FarmCycle[]>>('/cycles?status=ACTIVE&size=50').then(r => r.data.data),
    retry: false,
  })

  // Pre-select customer's default tier whenever customer or tier list changes
  useEffect(() => {
    if (selectedCustomer && tiers && tiers.length > 0) {
      const defaultMatch = tiers.find(t => t.tierName === selectedCustomer.customerType)
      setSelectedTierName(defaultMatch?.tierName ?? tiers[0].tierName)
    }
  }, [selectedCustomer, tiers])

  const selectedTier = tiers?.find(t => t.tierName === selectedTierName)
  const tierPrice = Number(selectedTier?.pricePerKg ?? 0)
  const qty = parseFloat(quantityKg) || 0
  const estimatedTotal = tierPrice * qty
  const isOverride = selectedCustomer && selectedTierName !== selectedCustomer.customerType

  const { mutate: createSale, isPending } = useMutation({
    mutationFn: () =>
      api.post<ApiResponse<Sale>>('/sales', {
        customerId: selectedCustomer!.id,
        quantityKg: qty,
        paymentMethod,
        cycleId: cycleId ? parseInt(cycleId) : null,
        notes: notes || null,
        pricingTierName: selectedTierName || null,
      }).then(r => r.data.data),
    onSuccess: (sale) => {
      setReceipt(sale)
      setSearch('')
      setSelectedCustomer(null)
      setSelectedTierName('')
      setQuantityKg('')
      setPaymentMethod('CASH')
      setCycleId('')
      setNotes('')
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message ?? 'Failed to record sale')
    },
  })

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=400,height=600')
    if (!win || !receiptRef.current) return
    win.document.write(`<html><head><title>Receipt</title><style>
      body{font-family:monospace;font-size:12px;padding:16px;width:320px}
      hr{border:none;border-top:1px dashed #999}
      .center{text-align:center} .right{text-align:right}
      .row{display:flex;justify-content:space-between}
    </style></head><body>${receiptRef.current.innerHTML}</body></html>`)
    win.document.close()
    win.print()
  }

  if (receipt) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <div className="flex items-center gap-2 text-green-600 mb-4">
          <CheckCircle size={22} />
          <span className="font-semibold text-lg">Sale Recorded</span>
        </div>

        <div ref={receiptRef} className="bg-white border border-gray-200 rounded-xl p-6 font-mono text-sm">
          <p className="text-center font-bold text-base">CrispFarm</p>
          <p className="text-center text-xs text-gray-500 mb-3">Sales Receipt</p>
          <hr className="border-dashed mb-3" />
          <div className="space-y-1">
            <div className="flex justify-between"><span>Invoice:</span><span>{receipt.invoiceNumber}</span></div>
            <div className="flex justify-between"><span>Date:</span><span>{receipt.saleDate}</span></div>
            <div className="flex justify-between"><span>Customer:</span><span>{receipt.customerName}</span></div>
            <div className="flex justify-between"><span>Type:</span><span>{receipt.customerType}</span></div>
          </div>
          <hr className="border-dashed my-3" />
          <div className="space-y-1">
            <div className="flex justify-between"><span>Quantity:</span><span>{Number(receipt.totalQuantityKg).toFixed(3)} kg</span></div>
            <div className="flex justify-between"><span>Price/kg:</span><span>₦{tierPrice.toLocaleString()}</span></div>
            <div className="flex justify-between font-bold text-base">
              <span>Total:</span><span>₦{Number(receipt.totalPrice).toLocaleString()}</span>
            </div>
          </div>
          <hr className="border-dashed my-3" />
          <div className="flex justify-between">
            <span>Payment:</span><span>{receipt.paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={receipt.invoiceStatus === 'PAID' ? 'text-green-700' : 'text-orange-600'}>
              {receipt.invoiceStatus}
            </span>
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">Thank you for your business!</p>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            <Printer size={15} /> Print
          </button>
          <button
            onClick={() => setReceipt(null)}
            className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
          >
            New Sale
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-5">
      <h2 className="text-xl font-bold text-gray-900">New Sale</h2>

      {/* Customer search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Customer <span className="text-red-500">*</span></label>
        {selectedCustomer ? (
          <div className="flex items-center justify-between bg-brand-50 border border-brand-200 rounded-lg px-4 py-3">
            <div>
              <p className="font-semibold text-gray-900">{selectedCustomer.name}</p>
              <p className="text-xs text-gray-500">{selectedCustomer.customerType} · {selectedCustomer.phone ?? '—'}</p>
            </div>
            <button onClick={() => { setSelectedCustomer(null); setSelectedTierName('') }} className="text-xs text-brand-600 hover:underline">Change</button>
          </div>
        ) : (
          <div className="relative">
            <div className="flex items-center border border-gray-300 rounded-lg px-3 gap-2 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500">
              <Search size={15} className="text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search by name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 py-2.5 text-sm outline-none bg-transparent"
              />
            </div>
            {search.length >= 2 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                {searching && <p className="px-4 py-3 text-sm text-gray-400">Searching…</p>}
                {!searching && (!searchResults || searchResults.length === 0) && (
                  <p className="px-4 py-3 text-sm text-gray-400">No customers found</p>
                )}
                {searchResults?.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedCustomer(c); setSearch('') }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-0"
                  >
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.customerType} · {c.phone ?? '—'}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pricing tier selector */}
      {selectedCustomer && tiers && tiers.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-gray-700">Pricing Tier</label>
            {isOverride && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                Override — default is {selectedCustomer.customerType}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {tiers.map(t => (
              <button
                key={t.tierName}
                onClick={() => setSelectedTierName(t.tierName)}
                className={`px-3 py-2.5 rounded-lg border text-sm text-left transition-colors ${
                  selectedTierName === t.tierName
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'border-gray-300 text-gray-600 hover:border-brand-400'
                }`}
              >
                <div className="font-semibold">{t.tierName}</div>
                <div className={`text-xs mt-0.5 ${selectedTierName === t.tierName ? 'text-brand-100' : 'text-gray-400'}`}>
                  ₦{Number(t.pricePerKg).toLocaleString()}/kg
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (kg) <span className="text-red-500">*</span></label>
        <input
          type="number"
          min="0.001"
          step="0.001"
          value={quantityKg}
          onChange={e => setQuantityKg(e.target.value)}
          placeholder="0.000"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
        />
        {qty > 0 && tierPrice > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Estimated total: <strong className="text-gray-800">₦{estimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
            <span className="ml-1 text-gray-400">({selectedTierName} @ ₦{tierPrice.toLocaleString()}/kg)</span>
          </p>
        )}
      </div>

      {/* Payment method */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PAYMENT_METHODS.map(m => (
            <button
              key={m}
              onClick={() => setPaymentMethod(m)}
              className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                paymentMethod === m
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'border-gray-300 text-gray-600 hover:border-brand-400'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        {paymentMethod === 'CREDIT' && (
          <p className="text-xs text-orange-600 mt-1">Invoice will be marked as UNPAID (debt)</p>
        )}
      </div>

      {/* Cycle (optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Farm Cycle <span className="text-gray-400">(optional)</span></label>
        <select
          value={cycleId}
          onChange={e => setCycleId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white"
        >
          <option value="">— None —</option>
          {(Array.isArray(cycles) ? cycles : (cycles as any)?.content ?? []).map((c: FarmCycle) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes <span className="text-gray-400">(optional)</span></label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none"
        />
      </div>

      {/* Submit */}
      <button
        onClick={() => createSale()}
        disabled={isPending || !selectedCustomer || qty <= 0}
        className="w-full py-3 bg-brand-600 text-white rounded-lg font-semibold text-sm hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Recording…' : `Record Sale${qty > 0 && tierPrice > 0 ? ` — ${fmt(estimatedTotal)}` : ''}`}
      </button>
    </div>
  )
}
